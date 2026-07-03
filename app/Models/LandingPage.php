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
        'authentic_badge_text',
        'authentic_badge_icon',
        'delivery_badge_text',
        'delivery_badge_icon',
        'checkout_banner_text',
        'price_banner_original_label',
        'price_banner_original_price',
        'price_banner_current_label',
        'price_banner_current_price',
        'mid_order_button_text',
        'mid_order_button_icon',
        'benefits_sections',
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
            'hero_images' => 'array',
            'review_images' => 'array',
            'extra_product_ids' => 'array',
            'benefits_sections' => 'array',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
