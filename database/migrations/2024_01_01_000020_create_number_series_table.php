<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('number_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('document_type', 50);
            $table->foreignId('financial_year_id')->nullable()->constrained('financial_years')->nullOnDelete();
            $table->string('prefix', 50)->nullable();
            $table->unsignedBigInteger('current_number')->default(1);
            $table->unsignedTinyInteger('padding_length')->default(6);
            $table->timestamps();

            $table->unique(['store_id', 'document_type', 'financial_year_id']);
            $table->index('document_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('number_series');
    }
};
