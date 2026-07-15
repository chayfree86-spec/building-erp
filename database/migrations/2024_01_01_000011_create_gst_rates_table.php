<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gst_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->decimal('rate', 7, 4);
            $table->decimal('cgst_rate', 7, 4)->default(0);
            $table->decimal('sgst_rate', 7, 4)->default(0);
            $table->decimal('igst_rate', 7, 4)->default(0);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique('rate');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gst_rates');
    }
};
