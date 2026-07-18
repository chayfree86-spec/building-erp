<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'mobile', 'normalized_mobile', 'alternate_mobile', 'email',
        'gst_number', 'opening_balance', 'opening_balance_type',
        'credit_limit', 'status', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'status' => 'string',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function salesInvoices(): HasMany
    {
        return $this->hasMany(SalesInvoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class);
    }

    public function ledgers(): HasMany
    {
        return $this->hasMany(CustomerLedger::class);
    }

    protected $appends = ['outstanding_balance'];

    public function getOutstandingBalanceAttribute()
    {
        $openingBal = (float) $this->opening_balance;
        $effectiveOpening = $this->opening_balance_type === 'debit' ? $openingBal : ($this->opening_balance_type === 'credit' ? -$openingBal : 0);

        $totalInvoiced = $this->salesInvoices()->where('status', '!=', 'cancelled')->sum('total_amount');
        $totalReceived = $this->payments()->where('status', 'confirmed')->sum('amount');

        return $effectiveOpening + $totalInvoiced - $totalReceived;
    }
}
