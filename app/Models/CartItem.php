<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class CartItem extends Model
{
    use HasPublicUuid;

    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'product_variant_id',
        'quantity',
        'is_selected',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'is_selected' => 'boolean',
        ];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function lineTotal(): int
    {
        return $this->productVariant->unitPrice() * $this->quantity;
    }

    public function setQuantity(int $qty): void
    {
        $qty = max(1, $qty);

        if (! $this->productVariant->hasStock($qty)) {
            throw new RuntimeException('Stok tidak cukup.');
        }

        $this->update(['quantity' => $qty]);
    }

    public function toggleSelected(bool $selected): void
    {
        $this->update(['is_selected' => $selected]);
    }
}