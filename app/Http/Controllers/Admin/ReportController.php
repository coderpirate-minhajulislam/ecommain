<?php

namespace App\Http\Controllers\Admin;

use App\Exports\OrdersExport;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    private function buildQuery(Request $request)
    {
        $query = Order::query()->with('items');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($range = $request->input('date_range')) {
            $now = now();
            match ($range) {
                'today'      => $query->whereDate('created_at', $now->toDateString()),
                'this_week'  => $query->whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()]),
                'this_month' => $query->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year),
                'this_year'  => $query->whereYear('created_at', $now->year),
                default      => null,
            };
        } elseif ($request->input('date_from') || $request->input('date_to')) {
            if ($from = $request->input('date_from')) {
                $query->whereDate('created_at', '>=', $from);
            }
            if ($to = $request->input('date_to')) {
                $query->whereDate('created_at', '<=', $to);
            }
        }

        if ($payment = $request->input('payment_method')) {
            $query->where('payment_method', $payment);
        }

        if ($product = $request->input('product')) {
            $query->whereHas('items', fn ($q) => $q->where('product_name', 'like', "%{$product}%"));
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function index(Request $request): Response
    {
        $baseQuery = $this->buildQuery($request);
        $orders = (clone $baseQuery)->paginate(25)->withQueryString();

        $summaryQuery = clone $baseQuery;
        $allOrders = $summaryQuery->select('status', 'total')->get();
        $summary = [
            'total'      => $allOrders->count(),
            'revenue'    => $allOrders->where('status', '!=', 'cancelled')->sum('total'),
            'pending'    => $allOrders->where('status', 'pending')->count(),
            'processing' => $allOrders->where('status', 'processing')->count(),
            'delivered'  => $allOrders->where('status', 'delivered')->count(),
            'cancelled'  => $allOrders->where('status', 'cancelled')->count(),
        ];

        $statuses        = Order::select('status')->distinct()->pluck('status')->sort()->values();
        $paymentMethods  = Order::select('payment_method')->distinct()->whereNotNull('payment_method')->pluck('payment_method')->sort()->values();

        return Inertia::render('admin/reports/index', [
            'orders'         => $orders,
            'summary'        => $summary,
            'statuses'       => $statuses,
            'paymentMethods' => $paymentMethods,
            'filters'        => $request->only(['status', 'date_range', 'date_from', 'date_to', 'payment_method', 'product']),
        ]);
    }

    public function exportExcel(Request $request)
    {
        return Excel::download(
            new OrdersExport($request->only(['status', 'date_range', 'date_from', 'date_to', 'payment_method'])),
            'orders-report.xlsx'
        );
    }

    public function exportPdf(Request $request)
    {
        $orders    = $this->buildQuery($request)->get();
        $filters   = $request->only(['status', 'date_range', 'date_from', 'date_to', 'payment_method']);
        $total     = $orders->whereNotIn('status', ['cancelled'])->sum('total');
        $siteTitle = Setting::get('site_title', config('app.name'));
        $siteLogo  = Setting::get('site_logo', '');

        return view('exports.orders', compact('orders', 'filters', 'total', 'siteTitle', 'siteLogo'));
    }
}
