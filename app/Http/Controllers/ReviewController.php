<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Store a newly created review in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10',
        ]);

        // Check if this email has already reviewed this product
        $existingReview = Review::where('product_id', $validated['product_id'])
            ->where('email', $validated['email'])
            ->exists();

        if ($existingReview) {
            return back()->with('error', 'You have already reviewed this product.');
        }

        $review = Review::create([
            ...$validated,
            'user_id' => auth()->id(),
            'is_approved' => false,
        ]);

        return back()->with('success', 'Your review has been submitted and is waiting for approval.');
    }
}
