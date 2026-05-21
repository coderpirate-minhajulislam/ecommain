<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedIp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlockedIpController extends Controller
{
    public function index(Request $request): Response
    {
        $query = BlockedIp::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%");
            });
        }

        $blocked = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        return Inertia::render('admin/blocked-ips/index', [
            'blocked' => $blocked,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ip_address' => ['nullable', 'string', 'max:45'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'reason'     => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($validated['ip_address']) && empty($validated['phone'])) {
            return back()->withErrors(['ip_address' => 'At least an IP address or phone number is required.']);
        }

        BlockedIp::create([
            'ip_address' => $validated['ip_address'] ?? null,
            'phone'      => $validated['phone'] ?? null,
            'reason'     => $validated['reason'] ?? null,
            'blocked_by' => $request->user()?->name ?? 'System',
        ]);

        return back()->with('success', 'IP/Phone blocked successfully.');
    }

    public function destroy(int $id): RedirectResponse
    {
        BlockedIp::findOrFail($id)->delete();

        return back()->with('success', 'Block removed successfully.');
    }

    /**
     * Quick-block from order details page.
     */
    public function blockFromOrder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ip_address' => ['nullable', 'string', 'max:45'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'reason'     => ['nullable', 'string', 'max:500'],
            'order_id'   => ['nullable', 'integer'],
        ]);

        if (empty($validated['ip_address']) && empty($validated['phone'])) {
            return back()->withErrors(['ip_address' => 'No IP or phone to block.']);
        }

        // Check if already blocked
        $exists = BlockedIp::where(function ($q) use ($validated) {
            if (!empty($validated['ip_address'])) {
                $q->orWhere('ip_address', $validated['ip_address']);
            }
            if (!empty($validated['phone'])) {
                $q->orWhere('phone', $validated['phone']);
            }
        })->exists();

        if ($exists) {
            return back()->with('info', 'This IP/phone is already blocked.');
        }

        $reason = $validated['reason'] ?? '';
        if (!empty($validated['order_id'])) {
            $reason = $reason ?: 'Blocked from order #' . $validated['order_id'];
        }

        BlockedIp::create([
            'ip_address' => $validated['ip_address'] ?? null,
            'phone'      => $validated['phone'] ?? null,
            'reason'     => $reason,
            'blocked_by' => $request->user()?->name ?? 'System',
        ]);

        return back()->with('success', 'Customer blocked successfully.');
    }
}
