<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name'                  => 'Sharma Constructions',
                'mobile'                => '9811111111',
                'normalized_mobile'     => '9811111111',
                'alternate_mobile'      => null,
                'email'                 => 'sharma@example.com',
                'gst_number'            => '27AABCS1234P1Z1',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'credit_limit'          => 500000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Mehta Builders',
                'mobile'                => '9822222222',
                'normalized_mobile'     => '9822222222',
                'alternate_mobile'      => null,
                'email'                 => 'mehta@example.com',
                'gst_number'            => '27AABCM5678Q2Z2',
                'opening_balance'       => 25000,
                'opening_balance_type'  => 'debit',
                'credit_limit'          => 300000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Patel Infra Pvt Ltd',
                'mobile'                => '9833333333',
                'normalized_mobile'     => '9833333333',
                'alternate_mobile'      => '9833333334',
                'email'                 => 'patel@example.com',
                'gst_number'            => '24AABCP9012R3Z3',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'credit_limit'          => 1000000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Singh & Sons Hardware',
                'mobile'                => '9844444444',
                'normalized_mobile'     => '9844444444',
                'alternate_mobile'      => null,
                'email'                 => 'singh@example.com',
                'gst_number'            => '27AABCS3456S4Z4',
                'opening_balance'       => 15000,
                'opening_balance_type'  => 'debit',
                'credit_limit'          => 150000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Desai Developers',
                'mobile'                => '9855555555',
                'normalized_mobile'     => '9855555555',
                'alternate_mobile'      => null,
                'email'                 => 'desai@example.com',
                'gst_number'            => null,
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'credit_limit'          => 200000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Agarwal Contractors',
                'mobile'                => '9866666666',
                'normalized_mobile'     => '9866666666',
                'alternate_mobile'      => null,
                'email'                 => 'agarwal@example.com',
                'gst_number'            => '27AABCA7890A5Z5',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'credit_limit'          => 400000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Joshi Retails',
                'mobile'                => '9877777777',
                'normalized_mobile'     => '9877777777',
                'alternate_mobile'      => null,
                'email'                 => 'joshi@example.com',
                'gst_number'            => null,
                'opening_balance'       => 5000,
                'opening_balance_type'  => 'debit',
                'credit_limit'          => 100000,
                'status'                => 'active',
            ],
            [
                'name'                  => 'Kumar Construction Co',
                'mobile'                => '9888888888',
                'normalized_mobile'     => '9888888888',
                'alternate_mobile'      => null,
                'email'                 => 'kumar@example.com',
                'gst_number'            => '27AABCK2468K6Z6',
                'opening_balance'       => 0,
                'opening_balance_type'  => 'credit',
                'credit_limit'          => 600000,
                'status'                => 'active',
            ],
        ];

        foreach ($customers as $customer) {
            Customer::firstOrCreate(['mobile' => $customer['mobile']], $customer);
        }
    }
}
