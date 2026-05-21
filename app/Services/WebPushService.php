<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\Setting;

class WebPushService
{
    private string $publicKey;
    private string $privateKeyPem;
    private ?string $opensslConfig = null;

    public function __construct()
    {
        $this->opensslConfig = $this->findOpensslConfig();
        $this->ensureVapidKeys();
        $this->publicKey = Setting::get('vapid_public_key', '');
        $this->privateKeyPem = Setting::get('vapid_private_key_pem', '');
    }

    public function getPublicKey(): string
    {
        return $this->publicKey;
    }

    /**
     * Send push notification to all subscribers.
     */
    public function sendToAll(array $payload): void
    {
        if (!Setting::get('order_notifications_enabled', true)) {
            return;
        }

        // Include site logo as notification icon if not already set
        if (empty($payload['icon'])) {
            $siteLogo = Setting::get('site_logo', '');
            if ($siteLogo) {
                $payload['icon'] = '/' . ltrim($siteLogo, '/');
            }
        }

        $subscriptions = PushSubscription::all();

        foreach ($subscriptions as $sub) {
            try {
                $success = $this->sendNotification($sub->endpoint, $sub->p256dh, $sub->auth, $payload);

                if (!$success) {
                    $sub->delete();
                }
            } catch (\Throwable) {
                // Continue with next subscription
            }
        }
    }

    /**
     * Send a single push notification.
     */
    public function sendNotification(string $endpoint, string $p256dh, string $auth, array $payload): bool
    {
        $userPublicKey = $this->base64urlDecode($p256dh);
        $userAuth = $this->base64urlDecode($auth);
        $payloadJson = json_encode($payload);

        $encrypted = $this->encrypt($payloadJson, $userPublicKey, $userAuth);

        $audience = parse_url($endpoint, PHP_URL_SCHEME) . '://' . parse_url($endpoint, PHP_URL_HOST);
        $jwt = $this->createVapidJwt($audience);

        return $this->sendRequest($endpoint, $encrypted, $jwt);
    }

    /**
     * Generate VAPID keys if they don't exist.
     */
    private function ensureVapidKeys(): void
    {
        if (Setting::get('vapid_public_key')) {
            return;
        }

        $key = openssl_pkey_new(array_filter([
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
            'config' => $this->opensslConfig,
        ]));

        $details = openssl_pkey_get_details($key);
        $rawPublic = "\x04" . $details['ec']['x'] . $details['ec']['y'];

        openssl_pkey_export($key, $pem, null, array_filter(['config' => $this->opensslConfig]));

        Setting::set('vapid_public_key', $this->base64urlEncode($rawPublic));
        Setting::set('vapid_private_key_pem', $pem);
    }

    /**
     * Encrypt payload using Web Push (RFC 8291) aes128gcm content encoding.
     */
    private function encrypt(string $payload, string $userPublicKey, string $userAuth): string
    {
        // Generate ephemeral ECDH key pair
        $localKey = openssl_pkey_new(array_filter([
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
            'config' => $this->opensslConfig,
        ]));
        $localDetails = openssl_pkey_get_details($localKey);
        $localPublicKey = "\x04" . $localDetails['ec']['x'] . $localDetails['ec']['y'];

        // Convert raw user public key to PEM for ECDH
        $peerPem = $this->rawPublicKeyToPem($userPublicKey);
        $peerKey = openssl_pkey_get_public($peerPem);

        // ECDH shared secret
        $sharedSecret = openssl_pkey_derive($peerKey, $localKey);

        // IKM derivation (RFC 8291 Section 3.4)
        $ikmInfo = "WebPush: info\x00" . $userPublicKey . $localPublicKey;
        $ikm = $this->hkdf($userAuth, $sharedSecret, $ikmInfo, 32);

        // Content encryption (RFC 8188)
        $salt = random_bytes(16);
        $prk = hash_hmac('sha256', $ikm, $salt, true);
        $cek = $this->hkdfExpand($prk, "Content-Encoding: aes128gcm\x00", 16);
        $nonce = $this->hkdfExpand($prk, "Content-Encoding: nonce\x00", 12);

        // Encrypt with AES-128-GCM (padding delimiter 0x02 for last record)
        $tag = '';
        $encrypted = openssl_encrypt(
            $payload . "\x02",
            'aes-128-gcm',
            $cek,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            '',
            16
        );

        // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
        $header = $salt . pack('N', 4096) . chr(65) . $localPublicKey;

        return $header . $encrypted . $tag;
    }

    /**
     * Create a signed VAPID JWT (ES256).
     */
    private function createVapidJwt(string $audience): string
    {
        $header = $this->base64urlEncode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $payload = $this->base64urlEncode(json_encode([
            'aud' => $audience,
            'exp' => time() + 86400,
            'sub' => 'mailto:' . config('mail.from.address', 'admin@example.com'),
        ]));

        $input = $header . '.' . $payload;

        $privateKey = openssl_pkey_get_private($this->privateKeyPem);
        openssl_sign($input, $derSignature, $privateKey, OPENSSL_ALGO_SHA256);

        $rawSignature = $this->derSignatureToRaw($derSignature);

        return $input . '.' . $this->base64urlEncode($rawSignature);
    }

    /**
     * Send the encrypted push to the push service endpoint.
     */
    private function sendRequest(string $endpoint, string $body, string $jwt): bool
    {
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/octet-stream',
                'Content-Encoding: aes128gcm',
                'Content-Length: ' . strlen($body),
                'TTL: 86400',
                'Urgency: high',
                'Authorization: vapid t=' . $jwt . ', k=' . $this->publicKey,
            ],
        ]);

        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // 201 = created (success), 410/404 = subscription gone (delete it)
        return $httpCode >= 200 && $httpCode < 300;
    }

    /**
     * Convert raw 65-byte uncompressed EC public key to PEM format.
     */
    private function rawPublicKeyToPem(string $rawKey): string
    {
        // ASN.1 DER prefix for P-256 EC public key
        $der = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $rawKey;

        return "-----BEGIN PUBLIC KEY-----\n"
            . chunk_split(base64_encode($der), 64, "\n")
            . "-----END PUBLIC KEY-----\n";
    }

    /**
     * HKDF (extract + expand) using SHA-256.
     */
    private function hkdf(string $salt, string $ikm, string $info, int $length): string
    {
        $prk = hash_hmac('sha256', $ikm, $salt, true);

        return $this->hkdfExpand($prk, $info, $length);
    }

    /**
     * HKDF-Expand step.
     */
    private function hkdfExpand(string $prk, string $info, int $length): string
    {
        $output = '';
        $lastBlock = '';
        $counter = 1;

        while (strlen($output) < $length) {
            $lastBlock = hash_hmac('sha256', $lastBlock . $info . chr($counter), $prk, true);
            $output .= $lastBlock;
            $counter++;
        }

        return substr($output, 0, $length);
    }

    /**
     * Convert DER-encoded ECDSA signature to raw r||s (64 bytes for P-256).
     */
    private function derSignatureToRaw(string $der): string
    {
        $offset = 2; // skip SEQUENCE tag (0x30) and length

        // Parse r INTEGER
        $offset++; // skip 0x02 tag
        $rLen = ord($der[$offset]);
        $offset++;
        $r = substr($der, $offset, $rLen);
        $offset += $rLen;

        // Parse s INTEGER
        $offset++; // skip 0x02 tag
        $sLen = ord($der[$offset]);
        $offset++;
        $s = substr($der, $offset, $sLen);

        // Normalize to 32 bytes each
        $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);

        return $r . $s;
    }

    private function base64urlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }

    private function findOpensslConfig(): ?string
    {
        $candidates = [
            getenv('OPENSSL_CONF') ?: null,
            dirname(PHP_BINARY) . DIRECTORY_SEPARATOR . 'extras' . DIRECTORY_SEPARATOR . 'ssl' . DIRECTORY_SEPARATOR . 'openssl.cnf',
        ];

        foreach ($candidates as $path) {
            if ($path && file_exists($path)) {
                return $path;
            }
        }

        return null;
    }
}
