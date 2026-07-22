<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mirrors the purchase-side brand_id addition: a Product can be sold under
 * multiple Brands, so the sales invoice line (and the resulting batch
 * allocation) needs to record which brand's stock was actually sold.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales_invoice_items', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('product_id')->constrained('brands')->nullOnDelete();
        });

        Schema::table('sales_batch_allocations', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('product_id')->constrained('brands')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales_invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('brand_id');
        });

        Schema::table('sales_batch_allocations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('brand_id');
        });
    }
};
