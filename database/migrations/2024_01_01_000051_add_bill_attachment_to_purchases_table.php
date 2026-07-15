<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('bill_attachment', 500)->nullable()->after('cancellation_reason');
            $table->string('bill_attachment_original_name', 300)->nullable()->after('bill_attachment');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['bill_attachment', 'bill_attachment_original_name']);
        });
    }
};
