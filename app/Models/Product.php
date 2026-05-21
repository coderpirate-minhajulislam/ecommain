<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'sub_category_id',
        'extra_category_ids',
        'extra_sub_category_ids',
        'name',
        'description',
        'short_description',
        'long_description',
        'slug',
        'price',
        'original_price',
        'offer_timer',
        'in_stock',
        'free_shipping',
        'shipping_zones',
        'allowed_payment_methods',
        'size_label',
        'color_label',
        'youtube_video',
        'is_featured',
        'is_new_arrival',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'offer_timer' => 'datetime',
            'in_stock' => 'boolean',
            'free_shipping' => 'boolean',
            'shipping_zones' => 'array',
            'allowed_payment_methods' => 'array',
            'is_featured' => 'boolean',
            'is_new_arrival' => 'boolean',
            'extra_category_ids' => 'array',
            'extra_sub_category_ids' => 'array',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->slug && $model->name) {
                $model->slug = $model->generateUniqueSlug();
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty('name') && !$model->isDirty('slug')) {
                $model->slug = $model->generateUniqueSlug();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        // Use ID for admin routes, slug for frontend routes
        $route = \Illuminate\Support\Facades\Route::current();
        if ($route && str_contains($route->getPrefix(), 'admin')) {
            return 'id';
        }
        return 'slug';
    }

    protected function generateUniqueSlug(): string
    {
        $slug = Str::slug($this->name);
        $count = static::where('slug', 'like', $slug . '%')
            ->where('id', '!=', $this->id)
            ->count();

        return $count > 0 ? "{$slug}-{$count}" : $slug;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
