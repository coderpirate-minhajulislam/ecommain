<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'size',
        'color',
        'price',
        'original_price',
        'in_stock',
        'stock_quantity',
        'free_shipping',
        'shipping_zones',
        'image_path',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'in_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'free_shipping' => 'boolean',
            'shipping_zones' => 'array',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
