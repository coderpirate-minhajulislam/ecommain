<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SubCategory extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
    ];

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
}
