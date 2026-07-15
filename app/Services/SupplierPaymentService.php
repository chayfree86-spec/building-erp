<?php

namespace App\Services;

use App\Models\SupplierPayment;
use App\Models\SupplierPaymentAllocation;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;

class SupplierPaymentService
{
    /**
     * Confirm a supplier payment with allocations.
     */
    public static function confirm(SupplierPayment $payment, array $allocations): SupplierPayment
    {
        if ($payment->status !== 'draft') {
            throw new \RuntimeException('Only draft payments can be confirmed.');
        }

        $totalAllocated = array_sum(array_column($allocations, 'allocated_amount'));
        $advanceAmount = $payment->amount - $totalAllocated;

        if ($advanceAmount < 0) {
            throw new \RuntimeException('Total allocation exceeds payment amount.');
        }

        return DB::transaction(function () use ($payment, $allocations, $totalAllocated, $advanceAmount) {
            $payment->update([
                'allocated_amount' => $totalAllocated,
                'advance_amount' => $advanceAmount,
            ]);

            foreach ($allocations as $alloc) {
                $purchase = Purchase::lockForUpdate()->find($alloc['purchase_id']);

                if (!$purchase) {
                    throw new \RuntimeException("Purchase not found: {$alloc['purchase_id']}");
                }

                $currentBalance = (float) $purchase->balance_amount;
                if ($alloc['allocated_amount'] > $currentBalance) {
                    throw new \RuntimeException(
                        "Over-allocation: Purchase {$purchase->purchase_number} balance is {$currentBalance}"
                    );
                }

                $existing = SupplierPaymentAllocation::where('payment_id', $payment->id)
                    ->where('purchase_id', $alloc['purchase_id'])
                    ->exists();

                if ($existing) {
                    throw new \RuntimeException("Duplicate allocation for purchase {$purchase->purchase_number}");
                }

                SupplierPaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'purchase_id' => $alloc['purchase_id'],
                    'allocated_amount' => $alloc['allocated_amount'],
                ]);

                $newPaid = (float) $purchase->paid_amount + $alloc['allocated_amount'];
                $newBalance = (float) $purchase->total_amount - $newPaid;

                $purchase->update([
                    'paid_amount' => round($newPaid, 2),
                    'balance_amount' => round(max(0, $newBalance), 2),
                    'status' => $newBalance <= 0 ? 'paid' : 'partially_paid',
                ]);
            }

            // Supplier ledger entry
            SupplierLedgerService::addEntry(
                storeId: $payment->store_id,
                supplierId: $payment->supplier_id,
                transactionType: $advanceAmount > 0 ? 'supplier_advance' : 'supplier_payment',
                transactionId: $payment->id,
                referenceNumber: $payment->payment_number,
                transactionDate: $payment->payment_date,
                debitAmount: $payment->amount,
                creditAmount: 0,
                remarks: "Payment to supplier: {$payment->payment_number}",
                createdBy: $payment->created_by,
            );

            $payment->update(['status' => 'confirmed']);

            AuditLogService::log(
                module: 'supplier_payment',
                action: 'payment_confirm',
                recordType: 'supplier_payment',
                recordId: $payment->id,
                storeId: $payment->store_id,
            );

            return $payment->fresh(['allocations']);
        });
    }

    /**
     * Reverse a supplier payment.
     */
    public static function reverse(SupplierPayment $payment, int $reversedBy, string $reason): SupplierPayment
    {
        if (!in_array($payment->status, ['confirmed'])) {
            throw new \RuntimeException('Only confirmed payments can be reversed.');
        }

        return DB::transaction(function () use ($payment, $reversedBy, $reason) {
            foreach ($payment->allocations as $alloc) {
                $purchase = Purchase::lockForUpdate()->find($alloc->purchase_id);

                if ($purchase) {
                    $newPaid = max(0, (float) $purchase->paid_amount - (float) $alloc->allocated_amount);
                    $newBalance = (float) $purchase->total_amount - $newPaid;

                    $purchase->update([
                        'paid_amount' => round($newPaid, 2),
                        'balance_amount' => round(max(0, $newBalance), 2),
                        'status' => $newBalance <= 0 ? 'paid' : ($newPaid > 0 ? 'partially_paid' : 'confirmed'),
                    ]);
                }
            }

            SupplierLedgerService::addEntry(
                storeId: $payment->store_id,
                supplierId: $payment->supplier_id,
                transactionType: 'payment_reversal',
                transactionId: $payment->id,
                referenceNumber: $payment->payment_number . '-REV',
                transactionDate: now()->toDateString(),
                debitAmount: 0,
                creditAmount: $payment->amount,
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
                module: 'supplier_payment',
                action: 'payment_reverse',
                recordType: 'supplier_payment',
                recordId: $payment->id,
                storeId: $payment->store_id,
                reason: $reason,
            );

            return $payment->fresh();
        });
    }
}
