<?php

namespace App\Services;

use App\Models\PurchaseBatch;
use Illuminate\Support\Facades\DB;

class FifoStockService
{
    /**
     * Allocate stock using FIFO method.
     * Returns an array of batch allocations with quantities and costs.
     *
     * @param int $storeId
     * @param int $productId
     * @param float $requiredQuantity
     * @return array Array of ['batch_id', 'quantity', 'purchase_price', 'landed_cost', 'selling_price']
     * @throws \RuntimeException if insufficient stock
     */
    public static function allocate(int $storeId, int $productId, float $requiredQuantity): array
    {
        if ($requiredQuantity <= 0) {
            throw new \InvalidArgumentException('Required quantity must be greater than zero.');
        }

        return DB::transaction(function () use ($storeId, $productId, $requiredQuantity) {
            // Lock eligible batches for update
            $batches = PurchaseBatch::where('store_id', $storeId)
                ->where('product_id', $productId)
                ->where('status', 'active')
                ->where('available_quantity', '>', 0)
                ->orderBy('purchase_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->orderBy('id', 'asc')
                ->lockForUpdate()
                ->get();

            $totalAvailable = $batches->sum('available_quantity');

            if ($totalAvailable < $requiredQuantity) {
                throw new \RuntimeException(
                    "Insufficient stock. Available: {$totalAvailable}, Required: {$requiredQuantity}"
                );
            }

            $allocations = [];
            $remaining = $requiredQuantity;

            foreach ($batches as $batch) {
                if ($remaining <= 0) {
                    break;
                }

                $allocateQty = min($remaining, (float) $batch->available_quantity);

                $allocations[] = [
                    'batch_id' => $batch->id,
                    'quantity' => $allocateQty,
                    'purchase_price' => (float) $batch->purchase_price,
                    'landed_cost' => (float) $batch->landed_cost,
                    'selling_price' => (float) $batch->selling_price,
                    'gst_rate' => (float) $batch->gst_rate,
                ];

                $remaining -= $allocateQty;
            }

            if ($remaining > 0.0001) {
                throw new \RuntimeException(
                    "FIFO allocation failed. Remaining unallocated: {$remaining}"
                );
            }

            return $allocations;
        });
    }
}
