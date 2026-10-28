<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function selectedItems(): Collection
    {
        return $this->items()
            ->where('is_selected', true)
            ->with('productVariant.product')
            ->get();
    }

    public function subtotal(): int
    {
        return (int) $this->selectedItems()->sum(fn (CartItem $item) => $item->lineTotal());
    }

    public function clear(): void
    {
        $this->items()->delete();
    }
}