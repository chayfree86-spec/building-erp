<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLedger extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'store_id', 'product_id', 'batch_id', 'transaction_type',
        'transaction_id', 'transaction_item_id', 'reference_number',
        'transaction_date', 'opening_quantity', 'incoming_quantity',
        'outgoing_quantity', 'closing_quantity', 'unit_id', 'remarks',
        'created_by', 'created_at',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'opening_quantity' => 'decimal:3',
        'incoming_quantity' => 'decimal:3',
        'outgoing_quantity' => 'decimal:3',
        'closing_quantity' => 'decimal:3',
        'created_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PurchaseBatch::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
