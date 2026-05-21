<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use App\Services\MetaAdsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MetaAdsController extends Controller
{
    public function index(): Response
    {
        $connected = (bool) (Setting::get('meta_ads_access_token', '') && Setting::get('meta_ad_account_id', ''));

        return Inertia::render('admin/meta-ads', [
            'connected'  => $connected,
            'adAccountId' => Setting::get('meta_ad_account_id', ''),
        ]);
    }

    public function insights(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $since    = $request->input('start_date');
        $until    = $request->input('end_date');
        $isCustom = $since && $until;

        $period = 'last_7d';
        if (! $isCustom) {
            $allowed = ['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month'];
            $period  = in_array($request->input('period'), $allowed, true)
                ? $request->input('period')
                : 'last_7d';
        }

        $accessToken = Setting::get('meta_ads_access_token', '');
        $adAccountId = Setting::get('meta_ad_account_id', '');

        if (! $accessToken || ! $adAccountId) {
            return response()->json([
                'error' => 'Meta Ads not configured. Add your Ad Account ID and a Marketing API token (with ads_read permission) in Tracking Settings.',
            ], 422);
        }

        try {
            $service   = new MetaAdsService($accessToken, $adAccountId);
            $insights  = $isCustom
                ? $service->getAccountInsights('last_7d', $since, $until)
                : $service->getAccountInsights($period);
            $campaigns = $isCustom
                ? $service->getCampaigns('last_7d', 50, $since, $until)
                : $service->getCampaigns($period);

            // Resolve date range for order query
            [$dateFrom, $dateTo] = $this->resolveDateRange($period, $since, $until);

            // Per-campaign order breakdown keyed by utm_campaign value
            $campaignOrderStats = Order::query()
                ->whereBetween('created_at', [$dateFrom->startOfDay(), $dateTo->copy()->endOfDay()])
                ->whereNotNull('utm_campaign')
                ->where('utm_campaign', '!=', '')
                ->selectRaw('utm_campaign, status, COUNT(*) as count, SUM(total) as revenue')
                ->groupBy('utm_campaign', 'status')
                ->get()
                ->groupBy('utm_campaign')
                ->map(fn ($rows) => $rows->keyBy('status')->map(fn ($r) => [
                    'count'   => (int) $r->count,
                    'revenue' => (float) $r->revenue,
                ]));

            return response()->json(compact('insights', 'campaigns', 'campaignOrderStats'));
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function autoTracking(Request $request): JsonResponse
    {
        $accessToken = Setting::get('meta_ads_access_token', '');
        $adAccountId = Setting::get('meta_ad_account_id', '');

        if (! $accessToken || ! $adAccountId) {
            return response()->json(['error' => 'Meta Ads not configured.'], 422);
        }

        $service = new MetaAdsService($accessToken, $adAccountId);

        // GET — read from settings (source of truth), fall back to Meta API
        if ($request->isMethod('get')) {
            $saved = Setting::get('meta_ads_url_tags', '');

            // Auto-migrate old template that used names → IDs
            if ($saved && str_contains($saved, '{{campaign.name}}')) {
                $saved = str_replace(
                    ['{{campaign.name}}', '{{ad.name}}', '{{adset.name}}'],
                    ['{{campaign.id}}',   '{{ad.id}}',   '{{adset.id}}'],
                    $saved
                );
                Setting::set('meta_ads_url_tags', $saved);
            }

            if ($saved) {
                return response()->json(['url_tags' => $saved]);
            }
            // Not in settings yet — try reading directly from Meta API (first-time check)
            try {
                $currentTags = $service->getAccountUrlTags();
                if ($currentTags) {
                    Setting::set('meta_ads_url_tags', $currentTags);
                }
                return response()->json(['url_tags' => $currentTags]);
            } catch (\Throwable $e) {
                return response()->json(['url_tags' => '']);
            }
        }

        // POST — write the UTM template to the ad account and persist to settings
        $template = 'utm_source=facebook&utm_medium=paid'
            . '&utm_campaign={{campaign.id}}'
            . '&utm_content={{ad.id}}'
            . '&utm_term={{adset.id}}';

        try {
            $service->setAccountUrlTags($template);
            Setting::set('meta_ads_url_tags', $template);
            return response()->json(['success' => true, 'url_tags' => $template]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function resolveDateRange(string $period, ?string $since, ?string $until): array
    {
        if ($since && $until) {
            return [Carbon::parse($since), Carbon::parse($until)];
        }

        $now = Carbon::now();
        return match ($period) {
            'today'      => [$now->copy()->startOfDay(),         $now->copy()->endOfDay()],
            'yesterday'  => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()],
            'last_7d'    => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay()],
            'last_30d'   => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->endOfDay()],
            'this_month' => [$now->copy()->startOfMonth(),        $now->copy()->endOfDay()],
            'last_month' => [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()],
            default      => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay()],
        };
    }
}
