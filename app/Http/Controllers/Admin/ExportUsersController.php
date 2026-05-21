<?php

namespace App\Http\Controllers\Admin;

use App\Exports\UsersExport;
use App\Http\Controllers\Controller;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportUsersController extends Controller
{
    public function excel(Request $request)
    {
        return Excel::download(
            new UsersExport($request->input('search'), $request->input('role')),
            'users.xlsx'
        );
    }

    public function pdf(Request $request)
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

        $users = $query->orderBy('created_at', 'desc')->get();

        $pdf = Pdf::loadView('exports.users', ['users' => $users]);

        return $pdf->download('users.pdf');
    }
}
