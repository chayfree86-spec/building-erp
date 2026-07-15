<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfer_batch_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_transfer_id')->constrained('stock_transfers')->restrictOnDelete();
            $table->foreignId('stock_transfer_item_id')->constrained('stock_transfer_items')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('source_batch_id')->constrained('purchase_batches')->restrictOnDelete();
            $table->foreignId('destination_batch_id')->nullable()->constrained('purchase_batches')->nullOnDelete();
            $table->decimal('quantity', 15, 3);
            $table->decimal('purchase_price', 15, 2);
            $table->decimal('landed_cost', 15, 2);
            $table->decimal('selling_price', 15, 2);
            $table->timestamps();

            $table->index('stock_transfer_id');
            $table->index('source_batch_id');
            $table->index('destination_batch_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_batch_allocations');
    }
};
