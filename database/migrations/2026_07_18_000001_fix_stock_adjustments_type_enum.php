<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The application (frontend form + StockAdjustmentController validation and
 * confirm logic) uses the adjustment types 'addition' / 'deduction' / 'damage',
 * but the original enum column only allowed 'increase' / 'decrease' / 'damage' /
 * 'shortage' / 'excess' / 'manual_correction'. Inserting 'addition'/'deduction'
 * therefore failed with "Data truncated for column 'type'".
 *
 * Widen the enum to a union of both sets so the app values are accepted while
 * any legacy values stay valid.
 */
return new class extends Migration {
    public function up(): void
    {
        // SQLite stores enums as plain text with no CHECK constraint here, so the
        // widening is only meaningful (and the MODIFY syntax only valid) on MySQL.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE `stock_adjustments` MODIFY COLUMN `type` ENUM('addition','deduction','damage','increase','decrease','shortage','excess','manual_correction') NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE `stock_adjustments` MODIFY COLUMN `type` ENUM('increase','decrease','damage','shortage','excess','manual_correction') NOT NULL");
    }
};
