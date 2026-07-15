<?php

namespace App\Services;

use App\Models\NumberSeries;
use App\Models\FinancialYear;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Generate the next document number for a given store and document type.
     * Uses database locking to prevent duplicates during concurrent requests.
     */
    public static function generate(int $storeId, string $documentType): string
    {
        return DB::transaction(function () use ($storeId, $documentType) {
            $financialYear = FinancialYear::where('is_active', true)->first();

            if (!$financialYear) {
                throw new \RuntimeException('No active financial year found.');
            }

            $series = NumberSeries::where('store_id', $storeId)
                ->where('document_type', $documentType)
                ->where('financial_year_id', $financialYear->id)
                ->lockForUpdate()
                ->first();

            if (!$series) {
                $series = NumberSeries::create([
                    'store_id' => $storeId,
                    'document_type' => $documentType,
                    'financial_year_id' => $financialYear->id,
                    'prefix' => self::getDefaultPrefix($documentType),
                    'current_number' => 1,
                    'padding_length' => 6,
                ]);
            }

            $currentNumber = $series->current_number;
            $series->increment('current_number');

            $store = \App\Models\Store::find($storeId);
            $storePrefix = $store ? $store->code : 'STORE';
            $yearSuffix = $financialYear->name;
            $prefix = $series->prefix ? $series->prefix . '/' : '';

            $paddedNumber = str_pad((string) $currentNumber, $series->padding_length, '0', STR_PAD_LEFT);

            return "{$storePrefix}/{$prefix}{$yearSuffix}/{$paddedNumber}";
        });
    }

    private static function getDefaultPrefix(string $documentType): string
    {
        return match ($documentType) {
            'purchase' => 'PUR',
            'purchase_return' => 'PRT',
            'sales_invoice' => 'INV',
            'sales_return' => 'SRT',
            'customer_payment' => 'REC',
            'supplier_payment' => 'PAY',
            'stock_adjustment' => 'ADJ',
            'stock_transfer' => 'TRF',
            default => 'DOC',
        };
    }
}
