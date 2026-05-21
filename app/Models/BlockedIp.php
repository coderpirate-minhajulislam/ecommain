<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    protected $fillable = [
        'ip_address',
        'phone',
        'reason',
        'blocked_by',
    ];

    public static function isBlocked(?string $ip, ?string $phone = null): bool
    {
        if (!$ip && !$phone) {
            return false;
        }

        return static::where(function ($q) use ($ip, $phone) {
            if ($ip) {
                $q->orWhere('ip_address', $ip);
            }
            if ($phone) {
                $q->orWhere('phone', $phone);
            }
        })->exists();
    }
}
