<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingZone extends Model
{
    protected $fillable = [
        'name',
        'districts',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'districts' => 'array',
            'sort_order' => 'integer',
        ];
    }
}
