<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id', 'address_type', 'address', 'city', 'state',
        'pincode', 'is_default', 'status',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'status' => 'string',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
