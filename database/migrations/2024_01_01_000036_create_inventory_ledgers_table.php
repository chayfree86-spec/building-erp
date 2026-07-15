<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('batch_id')->constrained('purchase_batches')->restrictOnDelete();
            $table->string('transaction_type', 50);
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->unsignedBigInteger('transaction_item_id')->nullable();
            $table->string('reference_number', 100)->nullable();
            $table->date('transaction_date');
            $table->decimal('opening_quantity', 15, 3)->default(0);
            $table->decimal('incoming_quantity', 15, 3)->default(0);
            $table->decimal('outgoing_quantity', 15, 3)->default(0);
            $table->decimal('closing_quantity', 15, 3)->default(0);
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index('store_id');
            $table->index('product_id');
            $table->index('batch_id');
            $table->index('transaction_type');
            $table->index('transaction_date');
            $table->index(['store_id', 'product_id', 'batch_id']);
            $table->index(['store_id', 'product_id', 'transaction_date']);
            $table->index(['transaction_type', 'transaction_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_ledgers');
    }
};
