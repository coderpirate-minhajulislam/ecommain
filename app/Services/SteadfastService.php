<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SteadfastService
{
    private string $baseUrl = 'https://portal.packzy.com/api/v1';

    private function headers(): array
    {
        return [
            'Api-Key'      => Setting::get('steadfast_api_key', ''),
            'Secret-Key'   => Setting::get('steadfast_secret_key', ''),
            'Content-Type' => 'application/json',
        ];
    }

    public function createOrder(array $payload): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/create_order", $payload);

        if ($response->successful()) {
            $data = $response->json();
            if (($data['status'] ?? 0) === 200) {
                return $data['consignment'] ?? $data;
            }
        }

        $body = $response->json();
        Log::warning('Steadfast createOrder failed', [
            'status'  => $response->status(),
            'body'    => $body,
            'payload' => $payload,
        ]);

        $message = $body['message'] ?? $response->body();
        throw new \RuntimeException($message);
    }

    public function bulkCreateOrder(array $orders): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/create_order/bulk-order", [
                'data' => json_encode($orders),
            ]);

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Steadfast bulk order failed: ' . $response->body());
    }

    public function getStatusByConsignmentId(int $id): string
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/status_by_cid/{$id}");

        if ($response->successful()) {
            return $response->json('delivery_status', 'unknown');
        }

        throw new \RuntimeException('Failed to fetch Steadfast status: ' . $response->body());
    }

    public function getStatusByInvoice(string $invoice): string
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/status_by_invoice/{$invoice}");

        if ($response->successful()) {
            return $response->json('delivery_status', 'unknown');
        }

        throw new \RuntimeException('Failed to fetch Steadfast status: ' . $response->body());
    }

    public function getStatusByTrackingCode(string $trackingCode): string
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/status_by_trackingcode/{$trackingCode}");

        if ($response->successful()) {
            return $response->json('delivery_status', 'unknown');
        }

        throw new \RuntimeException('Failed to fetch Steadfast status: ' . $response->body());
    }

    public function getBalance(): float
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/get_balance");

        if ($response->successful()) {
            return (float) $response->json('current_balance', 0);
        }

        throw new \RuntimeException('Failed to fetch Steadfast balance: ' . $response->body());
    }

    public function createReturnRequest(array $payload): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/create_return_request", $payload);

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Steadfast return request failed: ' . $response->body());
    }

    public function getReturnRequest(int $id): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/get_return_request/{$id}");

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Failed to fetch Steadfast return request: ' . $response->body());
    }

    public function getReturnRequests(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/get_return_requests");

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Failed to fetch Steadfast return requests: ' . $response->body());
    }

    public function getPayments(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/payments");

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Failed to fetch Steadfast payments: ' . $response->body());
    }

    public function getPayment(int $paymentId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/payments/{$paymentId}");

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Failed to fetch Steadfast payment: ' . $response->body());
    }

    public function getPoliceStations(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/police_stations");

        if ($response->successful()) {
            return $response->json() ?? [];
        }

        throw new \RuntimeException('Failed to fetch Steadfast police stations: ' . $response->body());
    }

    public function testConnection(): bool
    {
        try {
            $this->getBalance();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
