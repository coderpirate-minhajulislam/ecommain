<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Add stock_quantity column (nullable means unlimited)
            $table->unsignedInteger('stock_quantity')->nullable()->after('in_stock');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            // Add stock_quantity column (nullable means unlimited)
            $table->unsignedInteger('stock_quantity')->nullable()->after('in_stock');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('stock_quantity');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('stock_quantity');
        });
    }
};
