<?php

namespace App\Services;

use App\Models\InventoryLedger;
use App\Models\PurchaseBatch;

class InventoryLedgerService
{
    /**
     * Add an entry to the inventory ledger.
     * Calculates opening and closing quantities automatically.
     */
    public static function addEntry(
        int $storeId,
        int $productId,
        int $batchId,
        string $transactionType,
        ?int $transactionId,
        ?int $transactionItemId,
        ?string $referenceNumber,
        string $transactionDate,
        float $incomingQuantity,
        float $outgoingQuantity,
        ?int $unitId,
        ?string $remarks,
        ?int $createdBy,
    ): InventoryLedger {
        // Get the last ledger entry for this batch to determine opening quantity
        $lastEntry = InventoryLedger::where('batch_id', $batchId)
            ->orderBy('id', 'desc')
            ->first();

        $openingQty = $lastEntry ? $lastEntry->closing_quantity : 0;
        $closingQty = $openingQty + $incomingQuantity - $outgoingQuantity;

        return InventoryLedger::create([
            'store_id' => $storeId,
            'product_id' => $productId,
            'batch_id' => $batchId,
            'transaction_type' => $transactionType,
            'transaction_id' => $transactionId,
            'transaction_item_id' => $transactionItemId,
            'reference_number' => $referenceNumber,
            'transaction_date' => $transactionDate,
            'opening_quantity' => $openingQty,
            'incoming_quantity' => $incomingQuantity,
            'outgoing_quantity' => $outgoingQuantity,
            'closing_quantity' => $closingQty,
            'unit_id' => $unitId,
            'remarks' => $remarks,
            'created_by' => $createdBy,
            'created_at' => now(),
        ]);
    }

    /**
     * Get current stock for a product in a store (sum of all batch available quantities).
     */
    public static function getCurrentStock(int $storeId, int $productId): float
    {
        return (float) PurchaseBatch::where('store_id', $storeId)
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->sum('available_quantity');
    }

    /**
     * Reconcile batch stock vs ledger for a batch.
     * Returns ['batch_quantity' => x, 'ledger_closing' => y, 'difference' => z]
     */
    public static function reconcileBatch(int $batchId): array
    {
        $batch = PurchaseBatch::find($batchId);
        if (!$batch) {
            return ['error' => 'Batch not found'];
        }

        $lastLedger = InventoryLedger::where('batch_id', $batchId)
            ->orderBy('id', 'desc')
            ->first();

        $ledgerClosing = $lastLedger ? (float) $lastLedger->closing_quantity : 0;

        return [
            'batch_id' => $batchId,
            'batch_available' => (float) $batch->available_quantity,
            'batch_sold' => (float) $batch->sold_quantity,
            'ledger_closing' => $ledgerClosing,
            'difference' => round((float) $batch->available_quantity - $ledgerClosing, 3),
        ];
    }
}
