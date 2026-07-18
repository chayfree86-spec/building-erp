<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('purchase_id')->constrained('purchases')->restrictOnDelete();
            $table->foreignId('purchase_item_id')->constrained('purchase_items')->restrictOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->string('batch_number', 100);
            $table->date('purchase_date');
            $table->decimal('purchase_quantity', 15, 3);
            $table->decimal('available_quantity', 15, 3);
            $table->decimal('sold_quantity', 15, 3)->default(0);
            $table->decimal('purchase_return_quantity', 15, 3)->default(0);
            $table->decimal('sales_return_quantity', 15, 3)->default(0);
            $table->decimal('damage_quantity', 15, 3)->default(0);
            $table->decimal('adjustment_quantity', 15, 3)->default(0);
            $table->decimal('purchase_price', 15, 2);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->decimal('landed_cost', 15, 2);
            $table->decimal('gst_rate', 7, 4)->default(0);
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['active', 'exhausted', 'cancelled', 'returned'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('store_id');
            $table->index('product_id');
            $table->index('batch_number');
            $table->index('purchase_date');
            $table->index('status');
            $table->index(['store_id', 'product_id', 'status'], 'idx_batch_store_product_status');
            $table->index(['store_id', 'product_id', 'available_quantity', 'purchase_date'], 'idx_batch_fifo_lookup');
            $table->index(['product_id', 'available_quantity'], 'idx_batch_product_avail');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_batches');
    }
};
