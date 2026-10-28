<?php

namespace App\Models;

use App\Enums\VoucherType;
use App\Models\Concerns\HasPublicUuid;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use RuntimeException;

class Voucher extends Model
{
    use HasPublicUuid;

    public $timestamps = false;

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'min_subtotal',
        'max_discount',
        'quota',
        'used_count',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => VoucherType::class,
            'value' => 'integer',
            'min_subtotal' => 'integer',
            'max_discount' => 'integer',
            'quota' => 'integer',
            'used_count' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isUsable(int $subtotal, ?CarbonInterface $now = null): bool
    {
        $now ??= now();

        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at !== null && $this->starts_at->gt($now)) {
            return false;
        }

        if ($this->ends_at !== null && $this->ends_at->lt($now)) {
            return false;
        }

        if ($this->remainingQuota() <= 0) {
            return false;
        }

        return $subtotal >= $this->min_subtotal;
    }

    public function discountFor(int $subtotal): int
    {
        $discount = match ($this->type) {
            VoucherType::Percent => intdiv($subtotal * $this->value, 100),
            VoucherType::Fixed => $this->value,
        };

        if ($this->max_discount !== null) {
            $discount = min($discount, $this->max_discount);
        }

        return min($discount, $subtotal);
    }

    public function remainingQuota(): int
    {
        if ($this->quota === null) {
            return PHP_INT_MAX;
        }

        return max(0, $this->quota - $this->used_count);
    }

    public function incrementUsage(): void
    {
        $affected = static::query()
            ->whereKey($this->getKey())
            ->where(function ($q) {
                $q->whereNull('quota')->orWhereColumn('used_count', '<', 'quota');
            })
            ->increment('used_count');

        if ($affected === 0) {
            throw new RuntimeException('Kuota voucher sudah habis.');
        }

        $this->refresh();
    }

    public function decrementUsage(): void
    {
        if ($this->used_count > 0) {
            $this->decrement('used_count');
        }
    }
}