<?php

use App\Http\Middleware\CheckBlocked;
use App\Http\Middleware\CheckMaintenanceMode;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: ['webhooks/*']);

        $middleware->encryptCookies(except: [
            'appearance',
            'sidebar_state',
            // Third-party tracking cookies (set by Meta/TikTok/Google pixels — not encrypted by Laravel)
            '_fbc',
            '_fbp',
            '_fbi',   // client IP cookie written by Meta client-side param builder SDK
            'ttclid',
            '_ttp',
            '_ga',
            '_gcl_aw',
            '_gcl_dc',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'check.blocked' => CheckBlocked::class,
            'maintenance' => CheckMaintenanceMode::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response) {
            if ($response instanceof \Symfony\Component\HttpFoundation\Response && in_array($response->getStatusCode(), [403, 404, 500, 503])) {
                return Inertia::render('errors/error', [
                    'status' => $response->getStatusCode(),
                ])
                    ->toResponse(request())
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
