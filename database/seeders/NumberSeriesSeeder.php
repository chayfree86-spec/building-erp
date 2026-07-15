<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NumberSeries;
use App\Models\Store;
use App\Models\FinancialYear;

class NumberSeriesSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::first();
        if (!$store) return;

        // Find or create financial year
        $fy = FinancialYear::where('start_date', '2026-04-01')->where('end_date', '2027-03-31')->first();
        if (!$fy) {
            $fy = FinancialYear::create([
                'name' => 'FY 2026-27',
                'start_date' => '2026-04-01',
                'end_date' => '2027-03-31',
                'is_active' => true,
                'is_closed' => false,
            ]);
        }

        $series = [
            ['document_type' => 'invoice', 'prefix' => 'INV', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'purchase', 'prefix' => 'PUR', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'customer_payment', 'prefix' => 'RCPT', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'supplier_payment', 'prefix' => 'PAY', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'sales_return', 'prefix' => 'SR', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'purchase_return', 'prefix' => 'PR', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'stock_adjustment', 'prefix' => 'ADJ', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'stock_transfer', 'prefix' => 'TRF', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'credit_note', 'prefix' => 'CN', 'padding_length' => 4, 'current_number' => 1],
            ['document_type' => 'debit_note', 'prefix' => 'DN', 'padding_length' => 4, 'current_number' => 1],
        ];

        foreach ($series as $s) {
            NumberSeries::firstOrCreate(
                ['store_id' => $store->id, 'document_type' => $s['document_type'], 'financial_year_id' => $fy->id],
                array_merge(['store_id' => $store->id, 'financial_year_id' => $fy->id], $s)
            );
        }

        echo "Seeded " . count($series) . " number series.\n";
    }
}
