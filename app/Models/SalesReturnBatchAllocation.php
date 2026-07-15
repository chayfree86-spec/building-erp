<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesReturnBatchAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'sales_return_id', 'sales_return_item_id', 'product_id',
        'batch_id', 'original_allocation_id', 'quantity', 'purchase_price',
        'landed_cost', 'selling_price', 'cost_amount', 'sale_amount',
        'profit_reversed',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'purchase_price' => 'decimal:2',
        'landed_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'cost_amount' => 'decimal:2',
        'sale_amount' => 'decimal:2',
        'profit_reversed' => 'decimal:2',
    ];

    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function salesReturnItem(): BelongsTo
    {
        return $this->belongsTo(SalesReturnItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PurchaseBatch::class);
    }

    public function originalAllocation(): BelongsTo
    {
        return $this->belongsTo(SalesBatchAllocation::class, 'original_allocation_id');
    }
}
