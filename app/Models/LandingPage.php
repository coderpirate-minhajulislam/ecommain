<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPage extends Model
{
    protected $fillable = [
        'product_id',
        'extra_product_ids',
        'title',
        'slug',
        'subtitle',
        'hero_text',
        'hero_images',
        'badge_text',
        'icon_name',
        'phone',
        'use_cases',
        'use_cases_title',
        'use_cases_subtitle',
        'features',
        'features_title',
        'features_subtitle',
        'specifications',
        'specifications_title',
        'specifications_subtitle',
        'authentic_badge_text',
        'authentic_badge_icon',
        'delivery_badge_text',
        'delivery_badge_icon',
        'why_buy',
        'why_buy_title',
        'why_buy_super_text',
        'why_buy_subtitle',
        'checkout_banner_text',
        'checkout_title',
        'review_images_title',
        'order_now_text',
        'footer_text',
        'is_active',
        'free_shipping_enabled',
        'free_shipping_amount',
        'countdown_enabled',
        'countdown_end_time',
        'hero_video',
        'review_images',
        'template',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'free_shipping_enabled' => 'boolean',
            'countdown_enabled' => 'boolean',
            'countdown_end_time' => 'datetime',
            'use_cases' => 'array',
            'features' => 'array',
            'specifications' => 'array',
            'why_buy' => 'array',
            'hero_images' => 'array',
            'review_images' => 'array',
            'extra_product_ids' => 'array',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
