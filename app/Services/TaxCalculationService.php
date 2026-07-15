<?php

namespace App\Services;

class TaxCalculationService
{
    /**
     * Calculate GST for a given taxable amount and rate.
     * Returns CGST, SGST, IGST based on whether it's intra-state or inter-state.
     */
    public static function calculate(
        float $taxableAmount,
        float $gstRate,
        bool $isInterState = false
    ): array {
        $taxAmount = round($taxableAmount * $gstRate / 100, 2);

        if ($isInterState) {
            return [
                'cgst_amount' => 0,
                'sgst_amount' => 0,
                'igst_amount' => $taxAmount,
                'tax_amount' => $taxAmount,
            ];
        }

        $halfTax = round($taxAmount / 2, 2);
        // Adjust for rounding discrepancy
        $cgst = $halfTax;
        $sgst = $taxAmount - $cgst;

        return [
            'cgst_amount' => $cgst,
            'sgst_amount' => $sgst,
            'igst_amount' => 0,
            'tax_amount' => $taxAmount,
        ];
    }

    /**
     * Calculate taxable amount from gross amount.
     * Taxable = Gross / (1 + rate/100)
     */
    public static function extractTaxable(float $grossAmount, float $gstRate): float
    {
        if ($gstRate <= 0) {
            return round($grossAmount, 2);
        }
        return round($grossAmount / (1 + $gstRate / 100), 2);
    }

    /**
     * Round to 2 decimal places using round half up.
     */
    public static function round(float $amount): float
    {
        return round($amount, 2);
    }

    /**
     * Calculate round-off for an invoice total.
     */
    public static function calculateRoundOff(float $total): float
    {
        return round($total) - $total;
    }
}
