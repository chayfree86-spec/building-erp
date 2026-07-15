<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GstRate;

class GstRateSeeder extends Seeder
{
    public function run(): void
    {
        $rates = [
            ['name' => 'GST 0%', 'rate' => 0, 'cgst_rate' => 0, 'sgst_rate' => 0, 'igst_rate' => 0],
            ['name' => 'GST 5%', 'rate' => 5, 'cgst_rate' => 2.5, 'sgst_rate' => 2.5, 'igst_rate' => 5],
            ['name' => 'GST 12%', 'rate' => 12, 'cgst_rate' => 6, 'sgst_rate' => 6, 'igst_rate' => 12],
            ['name' => 'GST 18%', 'rate' => 18, 'cgst_rate' => 9, 'sgst_rate' => 9, 'igst_rate' => 18],
            ['name' => 'GST 28%', 'rate' => 28, 'cgst_rate' => 14, 'sgst_rate' => 14, 'igst_rate' => 28],
        ];

        foreach ($rates as $rate) {
            GstRate::firstOrCreate(['rate' => $rate['rate']], $rate);
        }
    }
}
