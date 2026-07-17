<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name'                  => 'UltraTech Cement Ltd',
                'mobile'                => '9011111111',
                'normalized_mobile'     => '9011111111',
                'alternate_mobile'      => null,
                'email'                 => 'sales@ultratech.example.com',
                'gst_number'            => '27AAACU1234E1Z1',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Tata Steel Trading',
                'mobile'                => '9022222222',
                'normalized_mobile'     => '9022222222',
                'alternate_mobile'      => null,
                'email'                 => 'orders@tatasteel.example.com',
                'gst_number'            => '27AAACT5678F2Z2',
                'opening_balance'       => 50000,
                'opening_balance_type'  => 'debit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Asian Paints Dealer',
                'mobile'                => '9033333333',
                'normalized_mobile'     => '9033333333',
                'alternate_mobile'      => '9033333334',
                'email'                 => 'dealer@asianpaints.example.com',
                'gst_number'            => '27AAAPA9012G3Z3',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Kajaria Ceramics Distributor',
                'mobile'                => '9044444444',
                'normalized_mobile'     => '9044444444',
                'alternate_mobile'      => null,
                'email'                 => 'orders@kajaria.example.com',
                'gst_number'            => '27AAACK3456H4Z4',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Mahalaxmi Sand Suppliers',
                'mobile'                => '9055555555',
                'normalized_mobile'     => '9055555555',
                'alternate_mobile'      => null,
                'email'                 => 'mahalaxmi@example.com',
                'gst_number'            => null,
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Om Sai Hardware Wholesale',
                'mobile'                => '9066666666',
                'normalized_mobile'     => '9066666666',
                'alternate_mobile'      => null,
                'email'                 => 'omsai@example.com',
                'gst_number'            => '27AAABO7890I5Z5',
                'opening_balance'       => 10000,
                'opening_balance_type'  => 'debit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Supreme Industries Ltd',
                'mobile'                => '9077777777',
                'normalized_mobile'     => '9077777777',
                'alternate_mobile'      => null,
                'email'                 => 'sales@supreme.example.com',
                'gst_number'            => '27AAACS1357J6Z6',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'status'                => 'active',
            ],
            [
                'name'                  => 'Century Plywoods India',
                'mobile'                => '9088888888',
                'normalized_mobile'     => '9088888888',
                'alternate_mobile'      => null,
                'email'                 => 'support@centuryply.example.com',
                'gst_number'            => '27AAACC2468K7Z7',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'status'                => 'active',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::firstOrCreate(['mobile' => $supplier['mobile']], $supplier);
        }
    }
}
