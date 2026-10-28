<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasPublicUuid, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'details',
        'price',
        'sale_price',
        'is_active',
        'is_featured',
        'is_new',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'price' => 'integer',
            'sale_price' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_new' => 'boolean',
        ];
    }

    // ---------- Relasi ----------

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    // ---------- Method sesuai diagram ----------

    public function displayPrice(): int
    {
        if ($this->sale_price !== null && $this->sale_price < $this->price) {
            return $this->sale_price;
        }

        return $this->price;
    }

    public function totalStock(): int
    {
        return (int) $this->variants()->where('is_active', true)->sum('stock');
    }

    public function inStock(): bool
    {
        return $this->totalStock() > 0;
    }

    public function primaryImage(): ?ProductImage
    {
        return $this->images()->where('is_primary', true)->first()
            ?? $this->images()->first();
    }

    public function related(int $limit = 4): Collection
    {
        return static::query()
            ->active()
            ->where('category_id', $this->category_id)
            ->whereKeyNot($this->getKey())
            ->inRandomOrder()
            ->limit($limit)
            ->get();
    }

    // ---------- Scope ----------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $q): Builder
    {
        if (blank($q)) {
            return $query;
        }

        $term = '%' . $q . '%';

        return $query->where(function (Builder $w) use ($term) {
            $w->where('name', 'like', $term)
              ->orWhere('description', 'like', $term);
        });
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['category'] ?? null, fn ($q, $slug) => $q->whereHas(
                'category', fn ($c) => $c->where('slug', $slug)
            ))
            ->when($filters['min_price'] ?? null, fn ($q, $v) => $q->where('price', '>=', (int) $v))
            ->when($filters['max_price'] ?? null, fn ($q, $v) => $q->where('price', '<=', (int) $v))
            ->when($filters['size'] ?? null, fn ($q, $size) => $q->whereHas(
                'variants', fn ($v) => $v->where('is_active', true)->where('size', $size)
            ))
            ->when($filters['color'] ?? null, fn ($q, $color) => $q->whereHas(
                'variants', fn ($v) => $v->where('is_active', true)->where('color_name', $color)
            ))
            ->when(! empty($filters['on_sale']), fn ($q) => $q
                ->whereNotNull('sale_price')
                ->whereColumn('sale_price', '<', 'price'))
            ->when(! empty($filters['is_new']), fn ($q) => $q->where('is_new', true))
            ->when(! empty($filters['is_featured']), fn ($q) => $q->where('is_featured', true));
    }

    public function scopeSort(Builder $query, ?string $sort): Builder
    {
        return match ($sort) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'name' => $query->orderBy('name'),
            default => $query->latest(),
        };
    }
}