<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CustomerPayment;
use App\Services\DocumentNumberService;
use App\Services\CustomerPaymentService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CustomerPayment::with(['customer', 'store', 'paymentMode', 'allocations.invoice', 'createdBy']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->date_from) {
            $query->whereDate('payment_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('payment_date', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true, 'message' => 'Customer payments retrieved.',
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20),
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'customer_id' => 'required|exists:customers,id',
            'payment_date' => 'required|date',
            'payment_mode_id' => 'required|exists:payment_modes,id',
            'amount' => 'required|numeric|min:0.01',
            'transaction_reference' => 'nullable|string|max:200',
            'remarks' => 'nullable|string',
            'allocations' => 'nullable|array',
            'allocations.*.invoice_id' => 'required|exists:sales_invoices,id',
            'allocations.*.allocated_amount' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 'message' => 'Validation failed.',
                'data' => null, 'errors' => $validator->errors(),
            ], 422);
        }

        $receiptNumber = DocumentNumberService::generate($request->store_id, 'customer_payment');

        $payment = CustomerPayment::create([
            'store_id' => $request->store_id,
            'customer_id' => $request->customer_id,
            'receipt_number' => $receiptNumber,
            'payment_date' => $request->payment_date,
            'payment_mode_id' => $request->payment_mode_id,
            'amount' => $request->amount,
            'allocated_amount' => 0,
            'advance_amount' => 0,
            'transaction_reference' => $request->transaction_reference,
            'status' => 'draft',
            'remarks' => $request->remarks,
            'created_by' => $request->user()->id,
        ]);

        AuditLogService::log(
            module: 'customer_payment', action: 'payment_create',
            recordType: 'customer_payment', recordId: $payment->id,
            storeId: $request->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Customer payment created.',
            'data' => $payment->load(['customer', 'store', 'paymentMode']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Customer payment retrieved.',
            'data' => CustomerPayment::with(['customer', 'store', 'paymentMode', 'allocations.invoice', 'createdBy'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payment = CustomerPayment::findOrFail($id);

        if ($payment->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft payments can be edited.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $payment->update($request->validate([
            'payment_date' => 'sometimes|date',
            'payment_mode_id' => 'sometimes|exists:payment_modes,id',
            'amount' => 'sometimes|numeric|min:0.01',
            'transaction_reference' => 'nullable|string|max:200',
            'remarks' => 'nullable|string',
        ]));

        return response()->json([
            'success' => true, 'message' => 'Payment updated.',
            'data' => $payment->load(['customer', 'store', 'paymentMode']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $payment = CustomerPayment::findOrFail($id);

        if ($payment->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft payments can be deleted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $payment->delete();

        return response()->json([
            'success' => true, 'message' => 'Payment deleted.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function confirm(int $id, Request $request): JsonResponse
    {
        try {
            $payment = CustomerPayment::findOrFail($id);
            $allocations = $request->allocations ?? [];
            $payment = CustomerPaymentService::confirm($payment, $allocations);

            return response()->json([
                'success' => true, 'message' => 'Payment confirmed successfully.',
                'data' => $payment->load(['allocations.invoice']),
                'errors' => null,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }
    }

    public function reverse(int $id, Request $request): JsonResponse
    {
        $payment = CustomerPayment::with('allocations')->findOrFail($id);

        if ($payment->status !== 'confirmed') {
            return response()->json([
                'success' => false, 'message' => 'Only confirmed payments can be reversed.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($payment, $request) {
            foreach ($payment->allocations as $alloc) {
                $invoice = \App\Models\SalesInvoice::lockForUpdate()->find($alloc->invoice_id);
                if ($invoice) {
                    $newPaid = (float) $invoice->paid_amount - $alloc->allocated_amount;
                    $newBalance = (float) $invoice->total_amount - $newPaid;
                    $invoice->update([
                        'paid_amount' => round(max(0, $newPaid), 2),
                        'balance_amount' => round(max(0, $newBalance), 2),
                        'payment_status' => $newBalance <= 0 ? 'paid' : ($newPaid > 0 ? 'partially_paid' : 'unpaid'),
                    ]);
                }
            }

            $payment->allocations()->delete();

            \App\Services\CustomerLedgerService::addEntry(
                storeId: $payment->store_id,
                customerId: $payment->customer_id,
                transactionType: 'payment_reversal',
                transactionId: $payment->id,
                referenceNumber: $payment->receipt_number . '-REV',
                transactionDate: now()->toDateString(),
                debitAmount: $payment->amount,
                creditAmount: 0,
                remarks: "Payment reversal: " . ($request->reason ?? 'Reversed'),
                createdBy: $request->user()->id,
            );

            $payment->update([
                'status' => 'reversed',
                'cancelled_by' => $request->user()->id,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->reason ?? 'Reversed',
            ]);
        });

        return response()->json([
            'success' => true, 'message' => 'Payment reversed successfully.',
            'data' => $payment->fresh(), 'errors' => null,
        ]);
    }
}
