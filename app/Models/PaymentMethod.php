<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'account_number',
        'logo',
        'icon',
        'account_label',
        'instructions_text',
        'payment_number_label',
        'payment_amount_label',
        'requires_payment_details',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_payment_details' => 'boolean',
        ];
    }
}
