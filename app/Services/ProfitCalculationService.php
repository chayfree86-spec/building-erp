<?php

namespace App\Services;

use App\Models\SalesBatchAllocation;

class ProfitCalculationService
{
    /**
     * Calculate profit for a batch allocation.
     *
     * Cost Amount = Allocated Quantity × Batch Landed Cost
     * Net Sale Amount = Allocated Sale Value - Allocated Discount
     * Profit Amount = Net Sale Amount - Cost Amount
     */
    public static function calculate(
        float $quantity,
        float $landedCost,
        float $sellingPrice,
        float $discountShare = 0,
        float $taxableAmount = 0,
        float $taxAmount = 0
    ): array {
        $costAmount = round($quantity * $landedCost, 2);
        $saleAmount = round($quantity * $sellingPrice, 2);
        $netSaleAmount = $saleAmount - $discountShare;
        $profitAmount = round($netSaleAmount - $costAmount, 2);

        return [
            'cost_amount' => $costAmount,
            'sale_amount' => $saleAmount,
            'profit_amount' => $profitAmount,
        ];
    }

    /**
     * Calculate cost and profit totals from batch allocations.
     */
    public static function calculateTotals(array $allocations): array
    {
        $totalCost = 0;
        $totalSale = 0;
        $totalProfit = 0;

        foreach ($allocations as $alloc) {
            $totalCost += $alloc['cost_amount'] ?? 0;
            $totalSale += $alloc['sale_amount'] ?? 0;
            $totalProfit += $alloc['profit_amount'] ?? 0;
        }

        return [
            'total_cost' => round($totalCost, 2),
            'total_sale' => round($totalSale, 2),
            'total_profit' => round($totalProfit, 2),
        ];
    }
}
