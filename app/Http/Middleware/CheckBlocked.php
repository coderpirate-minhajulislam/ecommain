<?php

namespace App\Http\Middleware;

use App\Models\BlockedIp;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckBlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        $ip    = $request->ip();
        $phone = $request->input('phone');

        if (BlockedIp::isBlocked($ip ?: null, $phone ?: null)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Your access has been restricted. You cannot place orders.',
                ], 403);
            }

            return redirect()->back()->withErrors([
                'blocked' => 'Your access has been restricted. You cannot place orders.',
            ]);
        }

        return $next($request);
    }
}
