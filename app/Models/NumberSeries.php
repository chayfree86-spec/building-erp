<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NumberSeries extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'document_type', 'financial_year_id',
        'prefix', 'current_number', 'padding_length',
    ];

    protected $casts = [
        'current_number' => 'integer',
        'padding_length' => 'integer',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function financialYear(): BelongsTo
    {
        return $this->belongsTo(FinancialYear::class);
    }
}
