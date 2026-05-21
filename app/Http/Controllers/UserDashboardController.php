<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    /**
     * Display the user dashboard with recent orders
     */
    public function index(): Response
    {
        $user = auth()->user();

        $orders = Order::where('user_id', $user->id)
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

        return Inertia::render('user/dashboard', [
            'user' => $user,
            'orders' => $orders,
        ]);
    }

    /**
     * Track orders by phone number
     */
    public function trackOrders(Request $request): Response
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^\d{11}$/'],
        ]);

        $user = auth()->user();

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

        return Inertia::render('user/track-orders', [
            'user' => $user,
            'orders' => $orders,
            'phone' => $request->phone,
        ]);
    }

    /**
     * Show the track orders page (GET)
     */
    public function trackOrdersPage(): Response
    {
        return Inertia::render('user/track-orders', [
            'user' => auth()->user(),
            'orders' => [],
        ]);
    }

    /**
     * Upload or update user profile image
     */
    public function uploadProfileImage(Request $request): RedirectResponse
    {
        $request->validate([
            'profile_image' => ['required', 'image', 'max:10240'], // 10MB max, any image format
        ]);

        $user = auth()->user();

        // Save old image path before updating
        $oldProfileImage = $user->profile_image;

        try {
            // Delete old image if exists
            if ($oldProfileImage) {
                $oldPath = public_path($oldProfileImage);
                if (File::exists($oldPath)) {
                    File::delete($oldPath);
                }
            }

            // Create uploads directory if it doesn't exist
            $uploadDir = public_path('uploads/profile-images');
            if (!File::isDirectory($uploadDir)) {
                File::makeDirectory($uploadDir, 0755, true, true);
            }

            // Store new image as WebP (quality 90, near-lossless)
            $file = $request->file('profile_image');
            $basename = uniqid() . '_' . time();
            (new ImageService())->saveAsWebP($file, $uploadDir, $basename);

            // Update user with new image path
            $imagePath = 'uploads/profile-images/' . $basename . '.webp';
            $user->profile_image = $imagePath;
            $user->save();

            return back()->with('success', 'Profile image updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to upload image: ' . $e->getMessage());
        }
    }

    /**
     * Delete user profile image
     */
    public function deleteProfileImage(): RedirectResponse
    {
        $user = auth()->user();

        if ($user->profile_image) {
            $path = public_path($user->profile_image);
            if (File::exists($path)) {
                File::delete($path);
            }
            $user->update(['profile_image' => null]);
        }

        return back()->with('success', 'Profile image deleted successfully!');
    }
}
