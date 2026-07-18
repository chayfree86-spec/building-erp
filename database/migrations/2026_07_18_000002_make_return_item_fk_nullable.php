<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `purchase_return_items.purchase_item_id` and `sales_return_items.invoice_item_id`
 * were NOT NULL, but the return controllers never populated them, so every
 * return insert failed with "Field ... doesn't have a default value".
 *
 * Make them nullable. The controllers now populate them when the original
 * line id is supplied by the client, and leave them null otherwise
 * (the return still links to the parent purchase/invoice via *_id + batch_id).
 */
return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE `purchase_return_items` MODIFY `purchase_item_id` BIGINT UNSIGNED NULL");
        DB::statement("ALTER TABLE `sales_return_items` MODIFY `invoice_item_id` BIGINT UNSIGNED NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `purchase_return_items` MODIFY `purchase_item_id` BIGINT UNSIGNED NOT NULL");
        DB::statement("ALTER TABLE `sales_return_items` MODIFY `invoice_item_id` BIGINT UNSIGNED NOT NULL");
    }
};
