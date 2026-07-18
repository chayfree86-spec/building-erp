<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\GstRate;

return new class extends Migration
{
    public function up(): void
    {
        // Get unit Pcs
        $unitId = Unit::where('short_name', 'Pcs')->first()?->id;
        
        // Get 18% GST rate
        $gstRateId = GstRate::where('rate', 18)->first()?->id;

        // 1. Create Category
        $category = Category::firstOrCreate(
            ['name' => 'Services & Charges'],
            [
                'unit_id' => $unitId,
                'description' => 'Transportation, labor, and other service charges (does not track inventory stock)',
                'status' => 'active',
            ]
        );

        // 2. Create default Products
        $services = [
            [
                'name' => 'Transport Charges',
                'sku' => 'SRV-TRN-001',
                'description' => 'Delivery, transportation, and freight charges',
            ],
            [
                'name' => 'Labour Charges',
                'sku' => 'SRV-LBR-001',
                'description' => 'Labor, loading, and unloading charges',
            ],
            [
                'name' => 'Other Charges',
                'sku' => 'SRV-OTH-001',
                'description' => 'General miscellaneous service charges',
            ],
        ];

        foreach ($services as $srv) {
            Product::firstOrCreate(
                ['sku' => $srv['sku']],
                [
                    'category_id' => $category->id,
                    'unit_id' => $unitId,
                    'brand_id' => null,
                    'gst_rate_id' => $gstRateId,
                    'name' => $srv['name'],
                    'description' => $srv['description'],
                    'minimum_stock' => 0,
                    'status' => 'active',
                ]
            );
        }
    }

    public function down(): void
    {
        // Keep seeded data on rollback to prevent breaking foreign keys on historical records
    }
};
