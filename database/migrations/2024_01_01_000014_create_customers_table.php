<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 300);
            $table->string('mobile', 15)->nullable();
            $table->string('normalized_mobile', 15)->nullable()->unique();
            $table->string('alternate_mobile', 15)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('gst_number', 20)->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->enum('opening_balance_type', ['debit', 'credit'])->default('debit');
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('normalized_mobile');
            $table->index('status');
            $table->index('gst_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
