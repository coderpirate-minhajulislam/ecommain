<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PathaoService
{
    private string $baseUrl = 'https://api-hermes.pathao.com';

    private function credentials(): array
    {
        return [
            'client_id'     => Setting::get('pathao_client_id', ''),
            'client_secret' => Setting::get('pathao_client_secret', ''),
            'username'      => Setting::get('pathao_username', ''),
            'password'      => Setting::get('pathao_password', ''),
        ];
    }

    private function getAccessToken(): string
    {
        $accessToken  = Setting::get('pathao_access_token', '');
        $expiresAt    = (int) Setting::get('pathao_token_expires_at', 0);
        $refreshToken = Setting::get('pathao_refresh_token', '');

        // Refresh if expired (with 60 second buffer)
        if ($accessToken && $refreshToken && time() >= ($expiresAt - 60)) {
            $refreshed = $this->refreshToken($refreshToken);
            if ($refreshed) {
                return Setting::get('pathao_access_token', '');
            }
        }

        if ($accessToken && time() < ($expiresAt - 60)) {
            return $accessToken;
        }

        return $this->issueToken();
    }

    public function issueToken(): string
    {
        $creds = $this->credentials();

        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->baseUrl}/aladdin/api/v1/issue-token", [
                'client_id'     => $creds['client_id'],
                'client_secret' => $creds['client_secret'],
                'grant_type'    => 'password',
                'username'      => $creds['username'],
                'password'      => $creds['password'],
            ]);

        if ($response->successful()) {
            $data = $response->json();
            $this->storeTokens($data);
            return $data['access_token'];
        }

        throw new \RuntimeException('Failed to issue Pathao access token: ' . $response->body());
    }

    private function refreshToken(string $refreshToken): bool
    {
        $creds = $this->credentials();

        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->baseUrl}/aladdin/api/v1/issue-token", [
                'client_id'     => $creds['client_id'],
                'client_secret' => $creds['client_secret'],
                'grant_type'    => 'refresh_token',
                'refresh_token' => $refreshToken,
            ]);

        if ($response->successful()) {
            $this->storeTokens($response->json());
            return true;
        }

        return false;
    }

    private function storeTokens(array $data): void
    {
        Setting::set('pathao_access_token', $data['access_token']);
        Setting::set('pathao_refresh_token', $data['refresh_token']);
        Setting::set('pathao_token_expires_at', (string) (time() + (int) $data['expires_in']));
    }

    public function getStores(): array
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/aladdin/api/v1/stores");

        if ($response->successful()) {
            return $response->json('data.data', []);
        }

        throw new \RuntimeException('Failed to fetch Pathao stores: ' . $response->body());
    }

    public function getCities(): array
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/aladdin/api/v1/city-list");

        if ($response->successful()) {
            return $response->json('data.data', []);
        }

        throw new \RuntimeException('Failed to fetch Pathao cities: ' . $response->body());
    }

    public function getZones(int $cityId): array
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/aladdin/api/v1/cities/{$cityId}/zone-list");

        if ($response->successful()) {
            return $response->json('data.data', []);
        }

        throw new \RuntimeException('Failed to fetch Pathao zones: ' . $response->body());
    }

    public function getAreas(int $zoneId): array
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/aladdin/api/v1/zones/{$zoneId}/area-list");

        if ($response->successful()) {
            return $response->json('data.data', []);
        }

        throw new \RuntimeException('Failed to fetch Pathao areas: ' . $response->body());
    }

    public function createOrder(array $payload): array
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Authorization' => "Bearer {$token}",
        ])->post("{$this->baseUrl}/aladdin/api/v1/orders", $payload);

        if ($response->successful()) {
            return $response->json('data', []);
        }

        $body = $response->json();
        Log::warning('Pathao createOrder failed', ['status' => $response->status(), 'body' => $body, 'payload' => $payload]);

        // Extract field-level validation errors if present
        if (!empty($body['errors']) && is_array($body['errors'])) {
            $fieldErrors = [];
            foreach ($body['errors'] as $field => $messages) {
                $fieldErrors[] = implode(', ', (array) $messages);
            }
            throw new \RuntimeException(implode(' | ', $fieldErrors));
        }

        $message = $body['message'] ?? $response->body();
        throw new \RuntimeException($message);
    }

    public function getOrderInfo(string $consignmentId): array
    {
        $token = $this->getAccessToken();

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/aladdin/api/v1/orders/{$consignmentId}/info");

        if ($response->successful()) {
            return $response->json('data', []);
        }

        throw new \RuntimeException('Failed to fetch Pathao order info: ' . $response->body());
    }

    public function testConnection(): bool
    {
        try {
            $this->issueToken();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
