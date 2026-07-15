<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;
use App\Models\Store;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::first();
        if (!$store) return;

        $defaults = [
            ['key' => 'company_name', 'value' => 'Build ERP', 'group' => 'general', 'type' => 'string', 'description' => 'Business name displayed on invoices'],
            ['key' => 'company_address', 'value' => '123, Building Materials Market, Mumbai', 'group' => 'general', 'type' => 'string', 'description' => 'Business address for invoices'],
            ['key' => 'company_phone', 'value' => '9999999999', 'group' => 'general', 'type' => 'string', 'description' => 'Business contact number'],
            ['key' => 'company_email', 'value' => 'contact@buildingerp.com', 'group' => 'general', 'type' => 'string', 'description' => 'Business email address'],
            ['key' => 'company_gst', 'value' => '27AAAAA0000A1Z5', 'group' => 'general', 'type' => 'string', 'description' => 'GST registration number'],
            ['key' => 'invoice_prefix', 'value' => 'INV', 'group' => 'invoice', 'type' => 'string', 'description' => 'Prefix for sales invoice numbers'],
            ['key' => 'purchase_prefix', 'value' => 'PUR', 'group' => 'invoice', 'type' => 'string', 'description' => 'Prefix for purchase invoice numbers'],
            ['key' => 'default_credit_limit', 'value' => '100000', 'group' => 'customer', 'type' => 'number', 'description' => 'Default credit limit for new customers'],
            ['key' => 'low_stock_threshold', 'value' => '10', 'group' => 'inventory', 'type' => 'number', 'description' => 'Minimum stock level before low-stock warning'],
            ['key' => 'currency_symbol', 'value' => '₹', 'group' => 'general', 'type' => 'string', 'description' => 'Currency symbol for amounts'],
            ['key' => 'date_format', 'value' => 'DD/MM/YYYY', 'group' => 'general', 'type' => 'string', 'description' => 'Date display format'],
            ['key' => 'enable_gst', 'value' => 'true', 'group' => 'general', 'type' => 'boolean', 'description' => 'Enable GST calculations'],
            ['key' => 'default_payment_mode_id', 'value' => '', 'group' => 'payment', 'type' => 'number', 'description' => 'Default payment mode for new transactions'],
            ['key' => 'round_off', 'value' => 'true', 'group' => 'invoice', 'type' => 'boolean', 'description' => 'Round off invoice totals to nearest rupee'],
        ];

        foreach ($defaults as $setting) {
            Setting::firstOrCreate(
                ['store_id' => $store->id, 'key' => $setting['key']],
                array_merge(['store_id' => $store->id], $setting)
            );
        }

        echo "Seeded " . count($defaults) . " default settings.\n";
    }
}
