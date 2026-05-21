<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Setting::get('maintenance_mode', false)) {
            return $next($request);
        }

        // Allow super_admin to bypass
        $user = $request->user();
        if ($user && $user->role === User::ROLE_SUPER_ADMIN) {
            return $next($request);
        }

        return Inertia::render('maintenance', [
            'title'   => Setting::get('maintenance_title', "We'll Be Back Soon"),
            'message' => Setting::get('maintenance_message', 'Our site is currently undergoing scheduled maintenance.'),
        ])
            ->toResponse($request)
            ->setStatusCode(503);
    }
}
