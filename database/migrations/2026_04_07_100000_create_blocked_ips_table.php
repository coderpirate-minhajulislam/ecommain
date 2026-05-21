<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocked_ips', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45)->nullable()->index();
            $table->string('phone', 30)->nullable()->index();
            $table->string('reason')->nullable();
            $table->string('blocked_by')->nullable();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('delivery_zone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocked_ips');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('ip_address');
        });
    }
};
