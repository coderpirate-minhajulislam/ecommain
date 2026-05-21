<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarrybeeService
{
    private string $baseUrl;

    public function __construct()
    {
        $sandbox = (bool) Setting::get('carrybee_sandbox', '0');
        $this->baseUrl = $sandbox
            ? 'https://sandbox.carrybee.com'
            : 'https://developers.carrybee.com';
    }

    private function headers(): array
    {
        return [
            'Client-ID'      => Setting::get('carrybee_client_id', ''),
            'Client-Secret'  => Setting::get('carrybee_client_secret', ''),
            'Client-Context' => Setting::get('carrybee_client_context', ''),
            'Content-Type'   => 'application/json',
        ];
    }

    public function testConnection(): bool
    {
        try {
            $this->getStores();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function getCities(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v2/cities");

        if ($response->successful()) {
            return $response->json('data.cities', []);
        }

        throw new \RuntimeException('Failed to fetch Carrybee cities: ' . ($response->json('message') ?? $response->body()));
    }

    public function getZones(int $cityId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v2/cities/{$cityId}/zones");

        if ($response->successful()) {
            return $response->json('data.zones', []);
        }

        throw new \RuntimeException('Failed to fetch Carrybee zones: ' . ($response->json('message') ?? $response->body()));
    }

    public function getAreas(int $cityId, int $zoneId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v2/cities/{$cityId}/zones/{$zoneId}/areas");

        if ($response->successful()) {
            return $response->json('data.areas', []);
        }

        throw new \RuntimeException('Failed to fetch Carrybee areas: ' . ($response->json('message') ?? $response->body()));
    }

    public function getAreaSuggestions(string $search): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v2/area-suggestions", ['search' => $search]);

        if ($response->successful()) {
            return $response->json('data.items', []);
        }

        throw new \RuntimeException('Failed to fetch Carrybee area suggestions: ' . ($response->json('message') ?? $response->body()));
    }

    public function getStores(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v2/stores");

        if ($response->successful()) {
            return $response->json('data.stores', []);
        }

        throw new \RuntimeException('Failed to fetch Carrybee stores: ' . ($response->json('message') ?? $response->body()));
    }

    public function createOrder(array $payload): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/api/v2/orders", $payload);

        if ($response->successful()) {
            return $response->json('data.order', []);
        }

        $body = $response->json();
        Log::warning('Carrybee createOrder failed', [
            'status'  => $response->status(),
            'body'    => $body,
            'payload' => $payload,
        ]);

        $message = $body['message'] ?? $response->body();
        throw new \RuntimeException($message);
    }

    public function getOrderDetails(string $consignmentId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v2/orders/{$consignmentId}/details");

        if ($response->successful()) {
            return $response->json('data', []);
        }

        throw new \RuntimeException('Failed to fetch Carrybee order: ' . ($response->json('message') ?? $response->body()));
    }
}
