<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Models\Concerns\HasPublicUuid;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasPublicUuid;

    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'invoice_number',
        'method',
        'channel',
        'va_number',
        'status',
        'amount',
        'expires_at',
        'paid_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'amount' => 'integer',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function markPaid(?CarbonInterface $at = null): void
    {
        $this->update([
            'status' => PaymentStatus::Paid,
            'paid_at' => $at ?? now(),
            'failure_reason' => null,
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => PaymentStatus::Failed,
            'failure_reason' => $reason,
        ]);
    }

    public function markExpired(): void
    {
        $this->update(['status' => PaymentStatus::Expired]);
    }

    public function isExpired(?CarbonInterface $now = null): bool
    {
        $now ??= now();

        return $this->status === PaymentStatus::Pending
            && $this->expires_at !== null
            && $this->expires_at->lte($now);
    }
}