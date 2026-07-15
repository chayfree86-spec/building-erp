<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Piece', 'short_name' => 'Pcs', 'decimal_places' => 0, 'allow_fraction' => false],
            ['name' => 'Bag', 'short_name' => 'Bag', 'decimal_places' => 0, 'allow_fraction' => false],
            ['name' => 'Kilogram', 'short_name' => 'Kg', 'decimal_places' => 3, 'allow_fraction' => true],
            ['name' => 'Ton', 'short_name' => 'Ton', 'decimal_places' => 3, 'allow_fraction' => true],
            ['name' => 'Meter', 'short_name' => 'Mtr', 'decimal_places' => 2, 'allow_fraction' => true],
            ['name' => 'Foot', 'short_name' => 'Ft', 'decimal_places' => 2, 'allow_fraction' => true],
            ['name' => 'Square Foot', 'short_name' => 'Sq.Ft', 'decimal_places' => 2, 'allow_fraction' => true],
            ['name' => 'Cubic Foot', 'short_name' => 'Cu.Ft', 'decimal_places' => 2, 'allow_fraction' => true],
            ['name' => 'Bundle', 'short_name' => 'Bdl', 'decimal_places' => 0, 'allow_fraction' => false],
            ['name' => 'Liter', 'short_name' => 'Ltr', 'decimal_places' => 2, 'allow_fraction' => true],
            ['name' => 'Box', 'short_name' => 'Box', 'decimal_places' => 0, 'allow_fraction' => false],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(['short_name' => $unit['short_name']], $unit);
        }
    }
}
