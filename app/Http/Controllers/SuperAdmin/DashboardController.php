<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('super-admin/dashboard', [
            'stats' => [
                'totalUsers'        => User::count(),
                'totalSuperAdmins'  => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
                'totalAdmins'       => User::where('role', User::ROLE_ADMIN)->count(),
                'totalManagers'     => User::where('role', User::ROLE_MANAGER)->count(),
                'totalRegularUsers' => User::where('role', User::ROLE_USER)->count(),
                'activeUsers'       => User::where('is_active', true)->count(),
                'inactiveUsers'     => User::where('is_active', false)->count(),
                'totalOrders'       => Order::count(),
                'totalRevenue'      => Order::where('status', '!=', 'cancelled')->sum('total'),
                'totalProducts'     => Product::count(),
            ],
            'recentUsers' => User::orderBy('created_at', 'desc')->limit(5)->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']),
        ]);
    }
}
