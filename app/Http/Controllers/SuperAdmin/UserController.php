<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $status = $request->input('status');
        if ($status && $status !== '') {
            $query->where('is_active', $status === 'active');
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100])
            ? (int) $request->input('perPage')
            : 10;

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('super-admin/users/index', [
            'users'   => $users,
            'filters' => $request->only(['search', 'role', 'perPage', 'status']),
            'roles'   => User::ROLES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('super-admin/users/create', [
            'roles' => User::ROLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'role'                  => ['required', Rule::in(User::ROLES)],
            'is_active'             => ['boolean'],
        ]);

        $validated['password']  = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        User::create($validated);

        return redirect()->route('super-admin.users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('super-admin/users/edit', [
            'editUser' => $user,
            'roles'    => User::ROLES,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        // Prevent editing another super_admin (only self is allowed)
        if ($user->isSuperAdmin() && $user->id !== auth()->id()) {
            return redirect()->route('super-admin.users.index')->with('error', 'You cannot edit another Super Admin.');
        }

        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role'      => ['required', Rule::in(User::ROLES)],
            'is_active' => ['boolean'],
            'password'  => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('super-admin.users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('super-admin.users.index')->with('error', 'You cannot delete yourself.');
        }

        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.users.index')->with('error', 'Cannot delete a Super Admin account.');
        }

        $user->delete();

        return redirect()->route('super-admin.users.index')->with('success', 'User deleted successfully.');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.users.index')->with('error', 'Cannot deactivate a Super Admin account.');
        }

        if ($user->id === auth()->id()) {
            return redirect()->route('super-admin.users.index')->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return redirect()->route('super-admin.users.index')->with('success', "User {$status} successfully.");
    }

    public function changePassword(User $user): Response
    {
        return Inertia::render('super-admin/users/change-password', [
            'editUser' => $user,
        ]);
    }

    public function updatePassword(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($request->password)]);

        return redirect()->route('super-admin.users.index')->with('success', "Password changed successfully for {$user->name}.");
    }
}
