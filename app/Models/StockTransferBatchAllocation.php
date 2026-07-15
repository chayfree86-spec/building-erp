<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferBatchAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_transfer_id', 'stock_transfer_item_id', 'product_id',
        'source_batch_id', 'destination_batch_id', 'quantity',
        'purchase_price', 'landed_cost', 'selling_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'purchase_price' => 'decimal:2',
        'landed_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
    ];

    public function stockTransfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function stockTransferItem(): BelongsTo
    {
        return $this->belongsTo(StockTransferItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function sourceBatch(): BelongsTo
    {
        return $this->belongsTo(PurchaseBatch::class, 'source_batch_id');
    }

    public function destinationBatch(): BelongsTo
    {
        return $this->belongsTo(PurchaseBatch::class, 'destination_batch_id');
    }
}
