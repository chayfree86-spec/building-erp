<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Store;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $stores = [
            [
                'name'           => 'Main Store',
                'code'           => 'MAIN',
                'mobile'         => '9999999999',
                'email'          => 'main@buildingerp.com',
                'address'        => 'Shop 1, Ground Floor, Patel Building, S.V. Road',
                'city'           => 'Mumbai',
                'state'          => 'Maharashtra',
                'pincode'        => '400001',
                'invoice_prefix' => 'MAIN',
                'status'         => 'active',
            ],
            [
                'name'           => 'Andheri Branch',
                'code'           => 'AND',
                'mobile'         => '8888888881',
                'email'          => 'andheri@buildingerp.com',
                'address'        => 'Gala 5, Marol Industrial Estate, Andheri East',
                'city'           => 'Mumbai',
                'state'          => 'Maharashtra',
                'pincode'        => '400059',
                'invoice_prefix' => 'AND',
                'status'         => 'active',
            ],
            [
                'name'           => 'Thane Warehouse',
                'code'           => 'THN',
                'mobile'         => '8888888882',
                'email'          => 'thane@buildingerp.com',
                'address'        => 'Plot 20, Wagle Estate, Thane West',
                'city'           => 'Thane',
                'state'          => 'Maharashtra',
                'pincode'        => '400604',
                'invoice_prefix' => 'THN',
                'status'         => 'active',
            ],
            [
                'name'           => 'Navi Mumbai Outlet',
                'code'           => 'NVM',
                'mobile'         => '8888888883',
                'email'          => 'navimumbai@buildingerp.com',
                'address'        => 'Sector 19, APMC Market, Turbhe, Vashi',
                'city'           => 'Navi Mumbai',
                'state'          => 'Maharashtra',
                'pincode'        => '400703',
                'invoice_prefix' => 'NVM',
                'status'         => 'active',
            ],
        ];

        foreach ($stores as $store) {
            Store::firstOrCreate(['code' => $store['code']], $store);
        }
    }
}
