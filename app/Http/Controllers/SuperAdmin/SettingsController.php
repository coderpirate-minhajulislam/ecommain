<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function maintenance(): Response
    {
        return Inertia::render('super-admin/settings/maintenance', [
            'enabled'            => (bool) Setting::get('maintenance_mode', false),
            'maintenanceTitle'   => Setting::get('maintenance_title', 'We\'ll Be Back Soon'),
            'maintenanceMessage' => Setting::get('maintenance_message', 'Our site is currently undergoing scheduled maintenance. We apologize for any inconvenience and will be back shortly.'),
        ]);
    }

    public function updateMaintenance(Request $request): RedirectResponse
    {
        $request->validate([
            'enabled'             => ['required', 'boolean'],
            'maintenance_title'   => ['nullable', 'string', 'max:200'],
            'maintenance_message' => ['nullable', 'string', 'max:2000'],
        ]);

        Setting::set('maintenance_mode', $request->boolean('enabled') ? '1' : '0');
        Setting::set('maintenance_title', $request->input('maintenance_title') ?? 'We\'ll Be Back Soon');
        Setting::set('maintenance_message', $request->input('maintenance_message') ?? '');

        return back()->with('success', 'Maintenance mode settings saved successfully.');
    }
}
