<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RedxService
{
    private string $baseUrl;

    public function __construct()
    {
        $sandbox = (bool) Setting::get('redx_sandbox', '0');
        $this->baseUrl = $sandbox
            ? 'https://sandbox.redx.com.bd/v1.0.0-beta'
            : 'https://openapi.redx.com.bd/v1.0.0-beta';
    }

    private function headers(): array
    {
        return [
            'API-ACCESS-TOKEN' => 'Bearer ' . Setting::get('redx_access_token', ''),
            'Content-Type'     => 'application/json',
        ];
    }

    public function testConnection(): bool
    {
        try {
            $this->getPickupStores();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function getAreas(array $params = []): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/areas", $params);

        if ($response->successful()) {
            return $response->json('areas', []);
        }

        throw new \RuntimeException('Failed to fetch RedX areas: ' . $response->body());
    }

    public function getPickupStores(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/pickup/stores");

        if ($response->successful()) {
            return $response->json('pickup_stores', []);
        }

        throw new \RuntimeException('Failed to fetch RedX pickup stores: ' . $response->body());
    }

    public function createParcel(array $payload): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/parcel", $payload);

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        $body = $response->json();
        Log::warning('RedX createParcel failed', ['status' => $response->status(), 'body' => $body, 'payload' => $payload]);

        $message = $body['message'] ?? $response->body();
        throw new \RuntimeException($message);
    }

    public function trackParcel(string $trackingId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/parcel/track/{$trackingId}");

        if ($response->successful()) {
            return $response->json('tracking', []);
        }

        throw new \RuntimeException('Failed to track RedX parcel: ' . $response->body());
    }
}
