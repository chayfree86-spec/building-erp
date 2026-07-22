<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A Product can now be linked to multiple Brands (product_brands pivot) —
 * e.g. a generic "Cement" product supplied under both "Acc" and "Ultratech".
 * Purchases need to record WHICH brand was actually bought/stocked per line,
 * since different brands of the same product are physically distinct stock.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('product_id')->constrained('brands')->nullOnDelete();
        });

        Schema::table('purchase_batches', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('product_id')->constrained('brands')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('brand_id');
        });

        Schema::table('purchase_batches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('brand_id');
        });
    }
};
