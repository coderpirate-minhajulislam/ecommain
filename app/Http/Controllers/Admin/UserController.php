<?php

namespace App\Http\Controllers\Admin;

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
        // Admin cannot see super_admin users
        $query = User::query()->where('role', '!=', User::ROLE_SUPER_ADMIN);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $perPage = in_array((int) $request->input('perPage'), [10, 15, 25, 50, 100]) ? (int) $request->input('perPage') : 10;

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'perPage']),
            'roles' => User::ADMIN_ASSIGNABLE_ROLES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create', [
            'roles' => User::ADMIN_ASSIGNABLE_ROLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(User::ADMIN_ASSIGNABLE_ROLES)],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        // Admin cannot edit super_admin users
        if ($user->isSuperAdmin()) {
            abort(403, 'You cannot edit a Super Admin user.');
        }

        return Inertia::render('admin/users/edit', [
            'editUser' => $user,
            'roles' => User::ADMIN_ASSIGNABLE_ROLES,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        // Admin cannot update super_admin users
        if ($user->isSuperAdmin()) {
            return redirect()->route('admin.users.index')->with('error', 'You cannot edit a Super Admin user.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(User::ADMIN_ASSIGNABLE_ROLES)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')->with('error', 'You cannot delete yourself.');
        }

        // Admin cannot delete super_admin users
        if ($user->isSuperAdmin()) {
            return redirect()->route('admin.users.index')->with('error', 'You cannot delete a Super Admin user.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }
}
