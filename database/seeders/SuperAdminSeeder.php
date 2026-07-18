<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\Role;
use App\Models\FinancialYear;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create default store
        $store = Store::firstOrCreate(
            ['code' => 'MAIN'],
            [
                'name' => 'Main Store',
                'code' => 'MAIN',
                'mobile' => '9999999999',
                'email' => 'admin@buildingerp.com',
                'address' => 'Main Store Address',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pincode' => '400001',
                'invoice_prefix' => 'INV',
                'status' => 'active',
            ]
        );

        // Create Super Admin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@buildingerp.com'],
            [
                'name' => 'Super Admin',
                'mobile' => '96287171775',
                'email' => 'admin@buildingerp.com',
                'password' => 'password',
                'pin' => '2310',
                'status' => 'active',
            ]
        );

        // Assign to store
        StoreUser::firstOrCreate(
            ['user_id' => $superAdmin->id, 'store_id' => $store->id],
            ['is_default' => true, 'status' => 'active']
        );

        // Assign Super Admin role
        $role = Role::where('slug', 'super_admin')->first();
        if ($role) {
            $superAdmin->roles()->syncWithoutDetaching([
                $role->id => [
                    'store_id' => $store->id,
                    'assigned_by' => $superAdmin->id,
                ]
            ]);
        }

        // Create default financial year
        FinancialYear::firstOrCreate(
            ['name' => '2026-27'],
            [
                'name' => '2026-27',
                'start_date' => '2026-04-01',
                'end_date' => '2027-03-31',
                'is_active' => true,
            ]
        );
    }
}
