<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'purchase_id', 'purchase_item_id', 'supplier_id',
        'product_id', 'brand_id', 'batch_number', 'purchase_date', 'purchase_quantity',
        'available_quantity', 'sold_quantity', 'purchase_return_quantity',
        'sales_return_quantity', 'damage_quantity', 'adjustment_quantity',
        'purchase_price', 'selling_price', 'landed_cost', 'gst_rate',
        'expiry_date', 'status', 'created_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expiry_date' => 'date',
        'purchase_quantity' => 'decimal:3',
        'available_quantity' => 'decimal:3',
        'sold_quantity' => 'decimal:3',
        'purchase_return_quantity' => 'decimal:3',
        'sales_return_quantity' => 'decimal:3',
        'damage_quantity' => 'decimal:3',
        'adjustment_quantity' => 'decimal:3',
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'landed_cost' => 'decimal:2',
        'gst_rate' => 'decimal:4',
        'status' => 'string',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function salesAllocations(): HasMany
    {
        return $this->hasMany(SalesBatchAllocation::class, 'batch_id');
    }

    public function inventoryLedgers(): HasMany
    {
        return $this->hasMany(InventoryLedger::class, 'batch_id');
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(BatchPriceHistory::class, 'batch_id');
    }

    public function hasAvailableStock(): bool
    {
        return $this->available_quantity > 0;
    }
}
