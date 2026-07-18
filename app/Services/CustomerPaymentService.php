<?php

namespace App\Services;

use App\Models\CustomerPayment;
use App\Models\CustomerPaymentAllocation;
use App\Models\SalesInvoice;
use Illuminate\Support\Facades\DB;

class CustomerPaymentService
{
    /**
     * Confirm a customer payment with allocations.
     * Supports full payment, partial payment, advance payment, and multi-invoice allocation.
     */
    public static function confirm(CustomerPayment $payment, array $allocations): CustomerPayment
    {
        if ($payment->status !== 'draft') {
            throw new \RuntimeException('Only draft payments can be confirmed.');
        }

        return DB::transaction(function () use ($payment, $allocations) {
            // If allocations is empty, auto-allocate using FIFO
            if (empty($allocations)) {
                $outstandingInvoices = SalesInvoice::where('customer_id', $payment->customer_id)
                    ->where('store_id', $payment->store_id)
                    ->whereIn('status', ['confirmed', 'partially_paid'])
                    ->orderBy('invoice_date', 'asc')
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get();

                $remainingAmount = $payment->amount;
                foreach ($outstandingInvoices as $inv) {
                    if ($remainingAmount <= 0) {
                        break;
                    }
                    $bal = (float) $inv->balance_amount;
                    if ($bal <= 0) {
                        continue;
                    }
                    $allocAmt = min($remainingAmount, $bal);
                    $allocations[] = [
                        'invoice_id' => $inv->id,
                        'allocated_amount' => $allocAmt,
                    ];
                    $remainingAmount -= $allocAmt;
                }
            }

            $totalAllocated = array_sum(array_column($allocations, 'allocated_amount'));
            $advanceAmount = $payment->amount - $totalAllocated;

            if ($advanceAmount < 0) {
                throw new \RuntimeException('Total allocation exceeds payment amount.');
            }

            $payment->update([
                'allocated_amount' => $totalAllocated,
                'advance_amount' => $advanceAmount,
            ]);

            foreach ($allocations as $alloc) {
                $invoice = SalesInvoice::lockForUpdate()->find($alloc['invoice_id']);

                if (!$invoice) {
                    throw new \RuntimeException("Invoice not found: {$alloc['invoice_id']}");
                }

                $currentBalance = (float) $invoice->balance_amount;
                if ($alloc['allocated_amount'] > $currentBalance) {
                    throw new \RuntimeException(
                        "Over-allocation: Invoice {$invoice->invoice_number} balance is {$currentBalance}"
                    );
                }

                // Prevent duplicate allocation
                $existing = CustomerPaymentAllocation::where('payment_id', $payment->id)
                    ->where('invoice_id', $alloc['invoice_id'])
                    ->exists();

                if ($existing) {
                    throw new \RuntimeException("Duplicate allocation for invoice {$invoice->invoice_number}");
                }

                CustomerPaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $alloc['invoice_id'],
                    'allocated_amount' => $alloc['allocated_amount'],
                ]);

                // Update invoice
                $newPaid = (float) $invoice->paid_amount + $alloc['allocated_amount'];
                $newBalance = (float) $invoice->total_amount - $newPaid;

                $status = $newBalance <= 0 ? 'paid' : 'partially_paid';
                $paymentStatus = $newBalance <= 0 ? 'paid' : 'partially_paid';

                $invoice->update([
                    'paid_amount' => round($newPaid, 2),
                    'balance_amount' => round(max(0, $newBalance), 2),
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                ]);
            }

            // Customer ledger entry
            CustomerLedgerService::addEntry(
                storeId: $payment->store_id,
                customerId: $payment->customer_id,
                transactionType: $advanceAmount > 0 ? 'advance_payment' : 'payment',
                transactionId: $payment->id,
                referenceNumber: $payment->receipt_number,
                transactionDate: $payment->payment_date,
                debitAmount: 0,
                creditAmount: $payment->amount,
                remarks: "Payment received: {$payment->receipt_number}",
                createdBy: $payment->created_by,
            );

            $payment->update(['status' => 'confirmed']);

            AuditLogService::log(
                module: 'customer_payment',
                action: 'payment_confirm',
                recordType: 'customer_payment',
                recordId: $payment->id,
                storeId: $payment->store_id,
            );

            return $payment->fresh(['allocations']);
        });
    }

    /**
     * Reverse a customer payment.
     */
    public static function reverse(CustomerPayment $payment, int $reversedBy, string $reason): CustomerPayment
    {
        if (!in_array($payment->status, ['confirmed'])) {
            throw new \RuntimeException('Only confirmed payments can be reversed.');
        }

        return DB::transaction(function () use ($payment, $reversedBy, $reason) {
            // Reverse each allocation
            foreach ($payment->allocations as $alloc) {
                $invoice = SalesInvoice::lockForUpdate()->find($alloc->invoice_id);

                if ($invoice) {
                    $newPaid = max(0, (float) $invoice->paid_amount - (float) $alloc->allocated_amount);
                    $newBalance = (float) $invoice->total_amount - $newPaid;

                    $invoice->update([
                        'paid_amount' => round($newPaid, 2),
                        'balance_amount' => round(max(0, $newBalance), 2),
                        'status' => $newBalance <= 0 ? 'paid' : ($newPaid > 0 ? 'partially_paid' : 'confirmed'),
                        'payment_status' => $newBalance <= 0 ? 'paid' : ($newPaid > 0 ? 'partially_paid' : 'unpaid'),
                    ]);
                }
            }

            // Reverse ledger
            CustomerLedgerService::addEntry(
                storeId: $payment->store_id,
                customerId: $payment->customer_id,
                transactionType: 'payment_reversal',
                transactionId: $payment->id,
                referenceNumber: $payment->receipt_number . '-REV',
                transactionDate: now()->toDateString(),
                debitAmount: $payment->amount,
                creditAmount: 0,
                remarks: "Payment reversal: {$reason}",
                createdBy: $reversedBy,
            );

            $payment->update([
                'status' => 'reversed',
                'cancelled_by' => $reversedBy,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
            ]);

            AuditLogService::log(
                module: 'customer_payment',
                action: 'payment_reverse',
                recordType: 'customer_payment',
                recordId: $payment->id,
                storeId: $payment->store_id,
                reason: $reason,
            );

            return $payment->fresh();
        });
    }
}
