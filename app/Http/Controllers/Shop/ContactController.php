<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Services\TrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email', 'max:150'],
            'phone'   => ['nullable', 'string', 'max:30'],
            'subject' => ['nullable', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:3000'],
        ]);

        ContactMessage::create($request->only('name', 'email', 'phone', 'subject', 'message'));

        // Server-side tracking: Contact event (Meta CAPI)
        try {
            (new TrackingService())->trackContact($request, [
                'name'  => $request->input('name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
            ]);
        } catch (\Throwable) {
        }

        return back()->with('success', 'Your message has been sent! We\'ll get back to you soon.');
    }
}
