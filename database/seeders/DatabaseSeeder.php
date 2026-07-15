<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UnitSeeder::class,
            GstRateSeeder::class,
            PaymentModeSeeder::class,
            RoleAndPermissionSeeder::class,
            SuperAdminSeeder::class,
            SettingSeeder::class,
            NumberSeriesSeeder::class,
        ]);
    }
}
