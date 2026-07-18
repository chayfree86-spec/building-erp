<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('category_supplier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['category_id', 'supplier_id']);
        });

        // Copy existing category_id references to category_supplier table
        $suppliers = DB::table('suppliers')->whereNotNull('category_id')->get();
        foreach ($suppliers as $supplier) {
            DB::table('category_supplier')->insert([
                'supplier_id' => $supplier->id,
                'category_id' => $supplier->category_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_supplier');
    }
};
