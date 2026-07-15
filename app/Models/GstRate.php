<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GstRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'rate', 'cgst_rate', 'sgst_rate', 'igst_rate', 'description', 'status',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'cgst_rate' => 'decimal:4',
        'sgst_rate' => 'decimal:4',
        'igst_rate' => 'decimal:4',
        'status' => 'string',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
