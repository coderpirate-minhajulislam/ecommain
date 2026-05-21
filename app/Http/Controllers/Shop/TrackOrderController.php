<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrackOrderController extends Controller
{
    public function index(): Response
    {
        $categories = Category::with('subCategories:id,category_id,name,slug')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'image_path'])
            ->toArray();

        return Inertia::render('shop/track-order', [
            'categories' => $categories,
            'orders' => [],
        ]);
    }

    public function search(Request $request): Response
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^\d{11}$/'],
        ]);

        $categories = Category::with('subCategories:id,category_id,name,slug')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'image_path'])
            ->toArray();

        $orders = Order::where('phone', $request->phone)
            ->with('items:id,order_id,product_name,variant_label,price,quantity,total')
            ->orderByDesc('created_at')
            ->get([
                'id', 'order_number', 'status', 'subtotal', 'shipping', 'discount',
                'coupon_code', 'total', 'first_name', 'phone', 'address',
                'delivery_zone', 'payment_method', 'created_at',
                'steadfast_consignment_id', 'steadfast_status',
                'pathao_consignment_id', 'pathao_order_status',
                'redx_tracking_id', 'redx_status',
                'carrybee_consignment_id', 'carrybee_status',
            ]);

        return Inertia::render('shop/track-order', [
            'categories' => $categories,
            'orders' => $orders,
            'phone' => $request->phone,
        ]);
    }
}
