<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Meta (Facebook) cookie persistence for CAPI deduplication + EMQ
            $table->string('fbc', 500)->nullable()->after('ip_address');
            $table->string('fbp', 255)->nullable()->after('fbc');
            // TikTok cookie persistence for Events API deduplication + EMQ
            $table->string('ttclid', 500)->nullable()->after('fbp');
            $table->string('ttp', 255)->nullable()->after('ttclid');
            // GA4 Measurement Protocol client_id
            $table->string('ga4_client_id', 100)->nullable()->after('ttp');
            // Google Ads Click ID for Conversion API server-side tracking
            $table->string('gclid', 500)->nullable()->after('ga4_client_id');
            // UTM campaign attribution
            $table->string('utm_source',   100)->nullable()->after('gclid');
            $table->string('utm_medium',   100)->nullable()->after('utm_source');
            $table->string('utm_campaign', 255)->nullable()->after('utm_medium');
            $table->string('utm_content',  255)->nullable()->after('utm_campaign');
            $table->string('utm_term',     255)->nullable()->after('utm_content');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['fbc', 'fbp', 'ttclid', 'ttp', 'ga4_client_id', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']);
        });
    }
};
