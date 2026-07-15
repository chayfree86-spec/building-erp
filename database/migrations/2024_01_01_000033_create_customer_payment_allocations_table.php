<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('customer_payments')->restrictOnDelete();
            $table->foreignId('invoice_id')->constrained('sales_invoices')->restrictOnDelete();
            $table->decimal('allocated_amount', 15, 2);
            $table->timestamps();

            $table->unique(['payment_id', 'invoice_id']);
            $table->index('payment_id');
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_payment_allocations');
    }
};
