<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'integer',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return response()->json(['message' => 'Invalid coupon code.'], 422);
        }

        if (!$coupon->isValid((float) $request->subtotal)) {
            if (!$coupon->is_active) {
                return response()->json(['message' => 'This coupon is no longer active.'], 422);
            }
            if ($coupon->starts_at && now()->lt($coupon->starts_at)) {
                return response()->json(['message' => 'This coupon is not active until ' . $coupon->starts_at->format('d M Y, h:i A') . '.'], 422);
            }
            if ($coupon->expires_at && now()->gt($coupon->expires_at)) {
                return response()->json(['message' => 'This coupon has expired.'], 422);
            }
            if ($coupon->usage_limit && $coupon->used_count >= $coupon->usage_limit) {
                return response()->json(['message' => 'This coupon usage limit has been reached.'], 422);
            }
            if ($coupon->min_order_amount && (float) $request->subtotal < (float) $coupon->min_order_amount) {
                return response()->json(['message' => "Minimum order amount is ৳{$coupon->min_order_amount}."], 422);
            }
            return response()->json(['message' => 'This coupon is not valid.'], 422);
        }

        // Check product-specific coupon
        if (!$coupon->is_global) {
            $couponProductIds = $coupon->products()->pluck('products.id')->toArray();
            $matchingIds = array_intersect($request->product_ids, $couponProductIds);

            if (empty($matchingIds)) {
                return response()->json(['message' => 'This coupon does not apply to any of your products.'], 422);
            }
        }

        $discount = $coupon->calculateDiscount((float) $request->subtotal);

        return response()->json([
            'discount' => $discount,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
        ]);
    }
}
