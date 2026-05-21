<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_number')->unique();
            $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'hold', 'pre-order'])->default('pending');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('shipping', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('first_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('district')->nullable();
            $table->string('address');
            $table->string('pathao_consignment_id')->nullable();
            $table->string('pathao_order_status')->nullable();
            $table->string('steadfast_consignment_id')->nullable();
            $table->string('steadfast_tracking_code')->nullable();
            $table->string('steadfast_status')->nullable();
            $table->string('redx_tracking_id')->nullable();
            $table->string('redx_status')->nullable();
            $table->string('carrybee_consignment_id')->nullable();
            $table->string('carrybee_status')->nullable();
            $table->string('delivery_zone')->default('inside_dhaka');
            $table->string('payment_method')->default('cod');
            $table->string('payment_phone')->nullable();
            $table->decimal('payment_amount', 10, 2)->nullable();
            $table->string('payment_screenshot')->nullable();
            $table->string('coupon_code')->nullable();
            $table->decimal('discount', 10, 2)->default(0);
            $table->text('note')->nullable();
            $table->string('order_source', 50)->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('phone');
            $table->index('created_at');
            $table->index(['status', 'created_at']);
            $table->index('steadfast_consignment_id');
            $table->index('payment_method');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_label')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('quantity');
            $table->decimal('total', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
