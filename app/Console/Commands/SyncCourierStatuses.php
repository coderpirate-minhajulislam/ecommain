<?php

namespace App\Console\Commands;

use App\Services\CourierSyncService;
use Illuminate\Console\Command;

class SyncCourierStatuses extends Command
{
    protected $signature = 'couriers:sync {--courier= : Sync a specific courier (steadfast|pathao|redx|carrybee)}';

    protected $description = 'Fetch latest delivery statuses from all configured courier APIs and update orders';

    public function handle(CourierSyncService $service): int
    {
        $this->info('Syncing courier statuses...');

        $courier = $this->option('courier');

        if ($courier) {
            $configuredMap = [
                'steadfast' => CourierSyncService::isSteadfastConfigured(),
                'pathao'    => CourierSyncService::isPathaoConfigured(),
                'redx'      => CourierSyncService::isRedxConfigured(),
                'carrybee'  => CourierSyncService::isCarrybeeConfigured(),
            ];

            if (!array_key_exists($courier, $configuredMap)) {
                $this->error("Unknown courier: {$courier}. Valid options: steadfast, pathao, redx, carrybee");
                return 1;
            }

            if (!$configuredMap[$courier]) {
                $this->warn("Courier '{$courier}' is not configured. Skipping.");
                return 0;
            }
        }

        $summary = $service->syncAll();

        $this->line('');
        $this->info("✓ Sync complete — updated: {$summary['updated']}, errors: {$summary['errors']}");

        foreach ($summary['couriers'] as $name => $result) {
            $this->line("  {$name}: updated={$result['updated']}, errors={$result['errors']}");
        }

        return 0;
    }
}
