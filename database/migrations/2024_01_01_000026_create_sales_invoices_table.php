<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->string('invoice_number', 100)->unique();
            $table->date('invoice_date');
            $table->string('customer_name_snapshot', 300)->nullable();
            $table->string('customer_mobile_snapshot', 15)->nullable();
            $table->text('customer_address_snapshot')->nullable();
            $table->string('customer_gst_snapshot', 20)->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('item_discount', 15, 2)->default(0);
            $table->decimal('overall_discount', 15, 2)->default(0);
            $table->decimal('taxable_amount', 15, 2)->default(0);
            $table->decimal('cgst_amount', 15, 2)->default(0);
            $table->decimal('sgst_amount', 15, 2)->default(0);
            $table->decimal('igst_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('round_off', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->enum('payment_status', ['unpaid', 'partially_paid', 'paid'])->default('unpaid');
            $table->enum('status', ['draft', 'confirmed', 'partially_paid', 'paid', 'partially_returned', 'fully_returned', 'cancelled', 'reversed'])->default('draft');
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->index('store_id');
            $table->index('customer_id');
            $table->index('invoice_date');
            $table->index('status');
            $table->index('payment_status');
            $table->index(['store_id', 'invoice_date']);
            $table->index(['store_id', 'customer_id', 'invoice_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_invoices');
    }
};
