<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_batch_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('invoice_id')->constrained('sales_invoices')->restrictOnDelete();
            $table->foreignId('invoice_item_id')->constrained('sales_invoice_items')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('batch_id')->constrained('purchase_batches')->restrictOnDelete();
            $table->decimal('quantity', 15, 3);
            $table->decimal('purchase_price', 15, 2);
            $table->decimal('landed_cost', 15, 2);
            $table->decimal('selling_price', 15, 2);
            $table->decimal('discount_share', 15, 2)->default(0);
            $table->decimal('taxable_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('cost_amount', 15, 2)->default(0);
            $table->decimal('sale_amount', 15, 2)->default(0);
            $table->decimal('profit_amount', 15, 2)->default(0);
            $table->timestamps();

            $table->index('invoice_id');
            $table->index('invoice_item_id');
            $table->index('batch_id');
            $table->index('product_id');
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_batch_allocations');
    }
};
