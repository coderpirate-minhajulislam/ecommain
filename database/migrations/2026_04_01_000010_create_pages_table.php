<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        DB::table('pages')->insert([
            ['title' => 'Help Center',      'slug' => 'help-center',      'content' => '<h2>How can we help you?</h2><p>Browse our help topics below or contact our support team for assistance.</p>', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Returns',           'slug' => 'returns',          'content' => '<h2>Return Policy</h2><p>We offer a hassle-free return policy. If you are not satisfied with your purchase, you can return it within 7 days of delivery.</p>', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Careers',           'slug' => 'careers',          'content' => '<h2>Join Our Team</h2><p>We are always looking for talented individuals to join our growing team. Check back for open positions.</p>', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Privacy Policy',    'slug' => 'privacy-policy',   'content' => '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.</p>', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Terms of Service',  'slug' => 'terms-of-service', 'content' => '<h2>Terms of Service</h2><p>By using our website, you agree to these terms and conditions. Please read them carefully.</p>', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Cookie Policy',     'slug' => 'cookie-policy',    'content' => '<h2>Cookie Policy</h2><p>We use cookies to improve your browsing experience. This policy explains what cookies are and how we use them.</p>', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
