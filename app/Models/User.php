<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'mobile', 'email', 'password', 'pin', 'status', 'last_login_at',
    ];

    protected $hidden = [
        'password', 'pin', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'pin' => 'hashed',
            'status' => 'string',
            'last_login_at' => 'datetime',
        ];
    }

    public function storeUsers(): HasMany
    {
        return $this->hasMany(StoreUser::class);
    }

    public function stores()
    {
        return $this->belongsToMany(Store::class, 'store_users')
            ->withPivot('is_default', 'status')
            ->withTimestamps();
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('store_id', 'assigned_by', 'expires_at')
            ->withTimestamps();
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function getStoreIds(): array
    {
        return $this->storeUsers()->where('status', 'active')->pluck('store_id')->toArray();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasPermission(string $permissionSlug, ?int $storeId = null): bool
    {
        return $this->roles()
            ->when($storeId, fn($q) => $q->wherePivot('store_id', $storeId))
            ->whereHas('permissions', fn($q) => $q->where('slug', $permissionSlug))
            ->exists();
    }

    public function hasStoreAccess(int $storeId): bool
    {
        return $this->storeUsers()
            ->where('store_id', $storeId)
            ->where('status', 'active')
            ->exists();
    }
}
