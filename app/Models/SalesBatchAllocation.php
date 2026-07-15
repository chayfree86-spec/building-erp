<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesBatchAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'invoice_id', 'invoice_item_id', 'product_id',
        'batch_id', 'quantity', 'purchase_price', 'landed_cost',
        'selling_price', 'discount_share', 'taxable_amount', 'tax_amount',
        'cost_amount', 'sale_amount', 'profit_amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'purchase_price' => 'decimal:2',
        'landed_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount_share' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'cost_amount' => 'decimal:2',
        'sale_amount' => 'decimal:2',
        'profit_amount' => 'decimal:2',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'invoice_id');
    }

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(SalesInvoiceItem::class, 'invoice_item_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PurchaseBatch::class, 'batch_id');
    }
}
