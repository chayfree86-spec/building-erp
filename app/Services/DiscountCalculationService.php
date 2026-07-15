<?php

namespace App\Services;

class DiscountCalculationService
{
    /**
     * Calculate item discount.
     * Discount can be a flat amount or percentage.
     */
    public static function calculateItemDiscount(
        float $quantity,
        float $rate,
        float $discountAmount = 0,
        ?float $discountPercentage = null
    ): float {
        if ($discountPercentage !== null && $discountPercentage > 0) {
            return round($quantity * $rate * $discountPercentage / 100, 2);
        }
        return round($discountAmount, 2);
    }

    /**
     * Distribute overall discount proportionally across items.
     */
    public static function distributeOverallDiscount(
        float $overallDiscount,
        array $itemTotals
    ): array {
        $totalAmount = array_sum($itemTotals);

        if ($totalAmount <= 0 || $overallDiscount <= 0) {
            return array_fill(0, count($itemTotals), 0);
        }

        $shares = [];
        $remaining = $overallDiscount;

        foreach ($itemTotals as $i => $itemTotal) {
            if ($i === count($itemTotals) - 1) {
                $shares[] = round($remaining, 2);
            } else {
                $share = round(($itemTotal / $totalAmount) * $overallDiscount, 2);
                $shares[] = $share;
                $remaining -= $share;
            }
        }

        return $shares;
    }
}
