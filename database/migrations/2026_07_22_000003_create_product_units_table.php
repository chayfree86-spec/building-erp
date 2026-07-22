<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mirrors product_brands: a Product (e.g. a Tile design) can be bought/sold
 * in more than one unit (Piece, Box, Sq.Ft...), so Purchase/Sales item rows
 * need a per-product list of allowed units, not just the category-wide one.
 * `products.unit_id` stays as the required "default" unit.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['product_id', 'unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_units');
    }
};
