<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sync courier delivery statuses every day at midnight
Schedule::command('couriers:sync')->dailyAt('00:00')->withoutOverlapping();
