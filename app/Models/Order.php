<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'shipping',
        'total',
        'first_name',
        'phone',
        'email',
        'district',
        'address',
        'delivery_zone',
        'ip_address',
        'user_agent',
        'fbc',
        'fbp',
        'ttclid',
        'ttp',
        'ga4_client_id',
        'gclid',
        'payment_method',
        'payment_phone',
        'payment_amount',
        'payment_screenshot',
        'coupon_code',
        'discount',
        'note',
        'order_source',
        'pathao_consignment_id',
        'pathao_order_status',
        'steadfast_consignment_id',
        'steadfast_tracking_code',
        'steadfast_status',
        'redx_tracking_id',
        'redx_status',
        'carrybee_consignment_id',
        'carrybee_status',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'shipping' => 'decimal:2',
            'total' => 'decimal:2',
            'payment_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
