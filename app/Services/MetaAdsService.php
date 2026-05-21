<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MetaAdsService
{
    private const API_VERSION = 'v20.0';
    private const BASE_URL    = 'https://graph.facebook.com';

    private string $accessToken;
    private string $adAccountId;

    public function __construct(string $accessToken, string $adAccountId)
    {
        $this->accessToken  = $accessToken;
        // Normalise: always include act_ prefix
        $this->adAccountId  = str_starts_with($adAccountId, 'act_')
            ? $adAccountId
            : 'act_' . $adAccountId;
    }

    /**
     * Fetch account-level ad insights for a given date preset or custom range.
     *
     * @param  string       $datePreset  e.g. today|yesterday|last_7d|last_30d|this_month
     * @param  string|null  $since       Custom range start (Y-m-d), overrides $datePreset
     * @param  string|null  $until       Custom range end   (Y-m-d), overrides $datePreset
     * @return array<string, mixed>
     */
    public function getAccountInsights(string $datePreset = 'last_7d', ?string $since = null, ?string $until = null): array
    {
        $isCustom = $since !== null && $until !== null;
        $cacheKey = $isCustom
            ? "meta_ads.insights.{$this->adAccountId}.{$since}_{$until}"
            : "meta_ads.insights.{$this->adAccountId}.{$datePreset}";

        return Cache::remember($cacheKey, 300, function () use ($datePreset, $since, $until, $isCustom) {
            $params = [
                'access_token' => $this->accessToken,
                'fields'       => 'spend,impressions,clicks,reach,ctr,cpc,actions,action_values',
                'level'        => 'account',
            ];
            if ($isCustom) {
                $params['time_range'] = json_encode(['since' => $since, 'until' => $until]);
            } else {
                $params['date_preset'] = $datePreset;
            }

            $response = Http::timeout(15)->get(
                self::BASE_URL . '/' . self::API_VERSION . '/' . $this->adAccountId . '/insights',
                $params
            );

            if ($response->failed()) {
                $msg = $response->json('error.message', $response->body());
                throw new \RuntimeException('Meta Ads API: ' . $msg);
            }

            return $response->json('data.0', []);
        });
    }

    /**
     * Fetch all campaigns with full insights for a given date preset or custom range.
     *
     * @param  string       $datePreset
     * @param  int          $limit
     * @param  string|null  $since  Custom range start (Y-m-d)
     * @param  string|null  $until  Custom range end   (Y-m-d)
     * @return array<int, mixed>
     */
    public function getCampaigns(string $datePreset = 'last_7d', int $limit = 50, ?string $since = null, ?string $until = null): array
    {
        $isCustom = $since !== null && $until !== null;
        $cacheKey = $isCustom
            ? "meta_ads.campaigns.{$this->adAccountId}.{$since}_{$until}.{$limit}"
            : "meta_ads.campaigns.{$this->adAccountId}.{$datePreset}.{$limit}";

        return Cache::remember($cacheKey, 300, function () use ($datePreset, $limit, $since, $until, $isCustom) {
            $insightFields = 'spend,impressions,clicks,reach,ctr,cpc,actions,action_values,cost_per_action_type,objective';

            if ($isCustom) {
                $timeRange    = json_encode(['since' => $since, 'until' => $until]);
                $insightSpec  = 'insights.time_range(' . $timeRange . '){' . $insightFields . '}';
            } else {
                $insightSpec  = 'insights.date_preset(' . $datePreset . '){' . $insightFields . '}';
            }

            $campaignFields = implode(',', [
                'name',
                'effective_status',
                'status',
                'daily_budget',
                'lifetime_budget',
                'budget_remaining',
                'bid_strategy',
                'objective',
                'stop_time',
                $insightSpec,
            ]);

            $response = Http::timeout(20)->get(
                self::BASE_URL . '/' . self::API_VERSION . '/' . $this->adAccountId . '/campaigns',
                [
                    'access_token' => $this->accessToken,
                    'fields'       => $campaignFields,
                    'limit'        => $limit,
                ]
            );

            if ($response->failed()) {
                $msg = $response->json('error.message', $response->body());
                throw new \RuntimeException('Meta Ads API: ' . $msg);
            }

            return $response->json('data', []);
        });
    }

    /**
     * Read the current url_tags setting on the ad account.
     * Returns an empty string if none is set.
     */
    public function getAccountUrlTags(): string
    {
        $response = Http::timeout(10)->get(
            self::BASE_URL . '/' . self::API_VERSION . '/' . $this->adAccountId,
            [
                'access_token' => $this->accessToken,
                'fields'       => 'url_tags',
            ]
        );

        if ($response->failed()) {
            $msg = $response->json('error.message', $response->body());
            throw new \RuntimeException('Meta Ads API: ' . $msg);
        }

        return $response->json('url_tags', '');
    }

    /**
     * Set url_tags on the ad account so every ad click automatically receives
     * UTM parameters without any per-campaign configuration.
     *
     * Requires the token to have ads_management permission on this ad account.
     */
    public function setAccountUrlTags(string $tags): void
    {
        $response = Http::timeout(10)->post(
            self::BASE_URL . '/' . self::API_VERSION . '/' . $this->adAccountId,
            [
                'access_token' => $this->accessToken,
                'url_tags'     => $tags,
            ]
        );

        if ($response->failed()) {
            $msg = $response->json('error.message', $response->body());
            throw new \RuntimeException('Meta Ads API: ' . $msg);
        }
    }

    /**
     * Clear cached insights for this account (called when credentials change).
     */
    public function forgetCache(): void
    {
        foreach (['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month'] as $preset) {
            Cache::forget("meta_ads.insights.{$this->adAccountId}.{$preset}");
            Cache::forget("meta_ads.campaigns.{$this->adAccountId}.{$preset}");
        }
    }
}
