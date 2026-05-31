<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sub_category_id')->nullable()->constrained()->nullOnDelete();
            $table->json('extra_category_ids')->nullable();
            $table->json('extra_sub_category_ids')->nullable();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->longText('long_description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('original_price', 10, 2)->nullable();
            $table->dateTime('offer_timer')->nullable()->default(null);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_new_arrival')->default(false);
            $table->boolean('in_stock')->default(true);
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('free_shipping')->default(false);
            $table->json('shipping_zones')->nullable();
            $table->json('allowed_payment_methods')->nullable();
            $table->string('size_label')->nullable();
            $table->string('color_label')->nullable();
            $table->string('youtube_video')->nullable();
            $table->timestamps();

            $table->index(['in_stock', 'is_featured']);
            $table->index(['in_stock', 'is_new_arrival']);
            $table->index(['in_stock', 'offer_timer']);
            $table->index('created_at');
            $table->index('price');
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('size')->nullable();
            $table->string('color')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('original_price', 10, 2)->nullable();
            $table->boolean('in_stock')->default(true);
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('free_shipping')->nullable()->default(null); // null = inherit from product, true = free, false = use variant zones
            $table->json('shipping_zones')->nullable()->default(null);
            $table->string('image_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
    }
};
