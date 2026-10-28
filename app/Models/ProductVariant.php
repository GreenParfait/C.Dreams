<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class ProductVariant extends Model
{
    use HasPublicUuid;

    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'sku',
        'size',
        'color_name',
        'color_hex',
        'stock',
        'price_override',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'price_override' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unitPrice(): int
    {
        return $this->price_override ?? $this->product->displayPrice();
    }

    public function hasStock(int $qty = 1): bool
    {
        return $this->stock >= $qty;
    }

    public function decrementStock(int $qty): void
    {
        // Atomic: hanya mengurangi jika stok cukup, aman dari race condition.
        $affected = static::query()
            ->whereKey($this->getKey())
            ->where('stock', '>=', $qty)
            ->decrement('stock', $qty);

        if ($affected === 0) {
            throw new RuntimeException('Stok tidak cukup.');
        }

        $this->refresh();
    }

    public function incrementStock(int $qty): void
    {
        $this->increment('stock', $qty);
    }
}