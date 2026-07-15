<?php

namespace App\Services;

use App\Models\SupplierLedger;

class SupplierLedgerService
{
    /**
     * Add an entry to the supplier ledger.
     * Calculates running balance automatically.
     */
    public static function addEntry(
        int $storeId,
        int $supplierId,
        string $transactionType,
        ?int $transactionId,
        ?string $referenceNumber,
        string $transactionDate,
        float $debitAmount,
        float $creditAmount,
        ?string $remarks,
        ?int $createdBy,
    ): SupplierLedger {
        $lastEntry = SupplierLedger::where('store_id', $storeId)
            ->where('supplier_id', $supplierId)
            ->orderBy('id', 'desc')
            ->first();

        $lastBalance = $lastEntry ? (float) $lastEntry->running_balance : 0;
        // Credit increases balance (we owe supplier), Debit decreases balance
        $runningBalance = $lastBalance + $creditAmount - $debitAmount;

        return SupplierLedger::create([
            'store_id' => $storeId,
            'supplier_id' => $supplierId,
            'transaction_type' => $transactionType,
            'transaction_id' => $transactionId,
            'reference_number' => $referenceNumber,
            'transaction_date' => $transactionDate,
            'debit_amount' => $debitAmount,
            'credit_amount' => $creditAmount,
            'running_balance' => $runningBalance,
            'remarks' => $remarks,
            'created_by' => $createdBy,
            'created_at' => now(),
        ]);
    }

    /**
     * Get current outstanding balance for a supplier in a store.
     * Positive = amount payable to supplier (credit balance)
     * Negative = advance to supplier (debit balance)
     */
    public static function getOutstanding(int $storeId, int $supplierId): float
    {
        $lastEntry = SupplierLedger::where('store_id', $storeId)
            ->where('supplier_id', $supplierId)
            ->orderBy('id', 'desc')
            ->first();

        return $lastEntry ? (float) $lastEntry->running_balance : 0;
    }
}
