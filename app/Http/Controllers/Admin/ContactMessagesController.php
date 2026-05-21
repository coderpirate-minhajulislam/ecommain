<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactMessagesController extends Controller
{
    public function index(): Response
    {
        $messages = ContactMessage::orderByRaw('is_read ASC')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('admin/contacts/index', [
            'messages' => $messages,
            'unreadCount' => ContactMessage::where('is_read', false)->count(),
        ]);
    }

    public function update(Request $request, ContactMessage $contact): RedirectResponse
    {
        $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'subject'    => ['nullable', 'string', 'max:255'],
            'message'    => ['required', 'string', 'max:10000'],
            'admin_note' => ['nullable', 'string', 'max:3000'],
            'is_read'    => ['nullable', 'boolean'],
        ]);

        $contact->update([
            'name'       => $request->input('name'),
            'email'      => $request->input('email'),
            'phone'      => $request->input('phone'),
            'subject'    => $request->input('subject'),
            'message'    => $request->input('message'),
            'admin_note' => $request->input('admin_note'),
            'is_read'    => $request->boolean('is_read', true),
        ]);

        return back()->with('success', 'Message updated.');
    }

    public function markRead(ContactMessage $contact): RedirectResponse
    {
        $contact->update(['is_read' => true]);

        return back();
    }

    public function destroy(ContactMessage $contact): RedirectResponse
    {
        $contact->delete();

        return back()->with('success', 'Message deleted.');
    }
}
