<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Models\Concerns\HasPublicUuid;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class Order extends Model
{
    use HasPublicUuid;

    protected $fillable = [
        'order_number',
        'user_id',
        'voucher_id',
        'recipient_name',
        'phone',
        'shipping_address',
        'subtotal',
        'shipping_cost',
        'discount_total',
        'grand_total',
        'status',
        'expires_at',
        'paid_at',
        'shipped_at',
        'tracking_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'shipping_cost' => 'integer',
            'discount_total' => 'integer',
            'grand_total' => 'integer',
            'status' => OrderStatus::class,
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
            'shipped_at' => 'datetime',
        ];
    }

    // ---------- Relasi ----------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    // ---------- Method sesuai diagram ----------

    public function isExpired(?CarbonInterface $now = null): bool
    {
        $now ??= now();

        return $this->status === OrderStatus::PendingPayment
            && $this->expires_at !== null
            && $this->expires_at->lte($now);
    }

    public function canTransitionTo(OrderStatus $status): bool
    {
        $allowed = [
            OrderStatus::PendingPayment->value => [OrderStatus::Paid, OrderStatus::Cancelled, OrderStatus::Expired],
            OrderStatus::Paid->value => [OrderStatus::Processing, OrderStatus::Cancelled],
            OrderStatus::Processing->value => [OrderStatus::Shipped, OrderStatus::Cancelled],
            OrderStatus::Shipped->value => [OrderStatus::Completed],
            OrderStatus::Completed->value => [],
            OrderStatus::Cancelled->value => [],
            OrderStatus::Expired->value => [],
        ];

        return in_array($status, $allowed[$this->status->value] ?? [], true);
    }

    public function transitionTo(OrderStatus $status, ?string $note = null, ?User $actor = null): void
    {
        if (! $this->canTransitionTo($status)) {
            throw new InvalidArgumentException(
                "Status pesanan tidak bisa diubah dari {$this->status->value} ke {$status->value}."
            );
        }

        DB::transaction(function () use ($status, $note, $actor) {
            $this->status = $status;

            if ($status === OrderStatus::Paid) {
                $this->paid_at = now();
            }

            if ($status === OrderStatus::Shipped) {
                $this->shipped_at = now();
            }

            $this->save();

            $this->statusLogs()->create([
                'status' => $status,
                'note' => $note,
                'created_by' => $actor?->id,
            ]);
        });
    }
}