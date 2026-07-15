<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMode;

class PaymentModeSeeder extends Seeder
{
    public function run(): void
    {
        $modes = [
            ['name' => 'Cash', 'code' => 'cash', 'is_active' => true],
            ['name' => 'UPI', 'code' => 'upi', 'is_active' => true],
            ['name' => 'Card', 'code' => 'card', 'is_active' => true],
            ['name' => 'Bank Transfer', 'code' => 'bank_transfer', 'is_active' => true],
            ['name' => 'Cheque', 'code' => 'cheque', 'is_active' => true],
            ['name' => 'Credit', 'code' => 'credit', 'is_active' => true],
            ['name' => 'Adjustment', 'code' => 'adjustment', 'is_active' => true],
        ];

        foreach ($modes as $mode) {
            PaymentMode::firstOrCreate(['code' => $mode['code']], $mode);
        }
    }
}
