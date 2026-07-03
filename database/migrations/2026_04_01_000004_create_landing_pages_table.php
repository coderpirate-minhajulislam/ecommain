<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->json('extra_product_ids')->nullable();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();
            $table->text('hero_text')->nullable();
            $table->json('hero_images')->nullable();
            $table->string('badge_text')->nullable();
            $table->string('icon_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('authentic_badge_text', 255)->nullable();
            $table->string('authentic_badge_icon', 50)->nullable();
            $table->string('delivery_badge_text', 255)->nullable();
            $table->string('delivery_badge_icon', 50)->nullable();
            $table->string('checkout_banner_text')->nullable();
            $table->string('price_banner_original_label', 255)->nullable();
            $table->string('price_banner_original_price', 50)->nullable();
            $table->string('price_banner_current_label', 255)->nullable();
            $table->string('price_banner_current_price', 50)->nullable();
            $table->string('mid_order_button_text', 100)->nullable();
            $table->string('mid_order_button_icon', 50)->nullable();
            $table->json('benefits_items')->nullable();
            $table->string('benefits_title')->nullable();
            $table->string('checkout_title')->nullable();
            $table->string('review_images_title')->nullable();
            $table->string('order_now_text', 100)->nullable();
            $table->string('footer_text')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('free_shipping_enabled')->nullable();
            $table->unsignedInteger('free_shipping_amount')->nullable();
            $table->boolean('countdown_enabled')->default(false);
            $table->dateTime('countdown_end_time')->nullable();
            $table->string('hero_video')->nullable();
            $table->json('review_images')->nullable();
            $table->string('template', 10)->default('v1');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_pages');
    }
};
