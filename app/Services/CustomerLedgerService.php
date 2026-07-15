<?php

namespace App\Services;

use App\Models\CustomerLedger;

class CustomerLedgerService
{
    /**
     * Add an entry to the customer ledger.
     * Calculates running balance automatically.
     */
    public static function addEntry(
        int $storeId,
        int $customerId,
        string $transactionType,
        ?int $transactionId,
        ?string $referenceNumber,
        string $transactionDate,
        float $debitAmount,
        float $creditAmount,
        ?string $remarks,
        ?int $createdBy,
    ): CustomerLedger {
        // Get last entry for running balance
        $lastEntry = CustomerLedger::where('store_id', $storeId)
            ->where('customer_id', $customerId)
            ->orderBy('id', 'desc')
            ->first();

        $lastBalance = $lastEntry ? (float) $lastEntry->running_balance : 0;
        // Debit increases balance (customer owes), Credit decreases balance
        $runningBalance = $lastBalance + $debitAmount - $creditAmount;

        return CustomerLedger::create([
            'store_id' => $storeId,
            'customer_id' => $customerId,
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
     * Get current outstanding balance for a customer in a store.
     * Positive = customer owes money (debit balance)
     * Negative = advance from customer (credit balance)
     */
    public static function getOutstanding(int $storeId, int $customerId): float
    {
        $lastEntry = CustomerLedger::where('store_id', $storeId)
            ->where('customer_id', $customerId)
            ->orderBy('id', 'desc')
            ->first();

        return $lastEntry ? (float) $lastEntry->running_balance : 0;
    }
}
