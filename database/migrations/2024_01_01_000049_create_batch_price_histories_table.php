<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('purchase_batches')->restrictOnDelete();
            $table->decimal('old_price', 15, 2);
            $table->decimal('new_price', 15, 2);
            $table->date('effective_from');
            $table->string('reason', 200)->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('batch_id');
            $table->index('effective_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_price_histories');
    }
};
