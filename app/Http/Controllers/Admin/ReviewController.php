<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ReviewController extends Controller
{
    /**
     * Display a listing of the reviews.
     */
    public function index(Request $request)
    {
        $query = Review::with(['product', 'user']);

        // Filter by approval status
        if ($request->has('filter') && $request->filter === 'pending') {
            $query->pending();
        } elseif ($request->has('filter') && $request->filter === 'approved') {
            $query->approved();
        }

        // Search by product name, reviewer name, or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        $reviews = $query->latest()->paginate(15);

        return Inertia::render('admin/reviews/index', [
            'reviews' => $reviews,
            'filter' => $request->filter ?? 'all',
            'search' => $request->search ?? '',
        ]);
    }

    /**
     * Show the form for editing the specified review.
     */
    public function edit(Review $review)
    {
        $review->load('product', 'user');

        return Inertia::render('admin/reviews/edit', [
            'review' => $review,
        ]);
    }

    /**
     * Update the specified review in storage.
     */
    public function update(Request $request, Review $review)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10',
            'is_approved' => 'required|boolean',
        ]);

        $review->update($validated);
        Cache::forget('shop.reviews.' . $review->product_id);

        return back()->with('success', 'Review updated successfully.');
    }

    /**
     * Approve the specified review.
     */
    public function approve(Review $review)
    {
        $review->update(['is_approved' => true]);
        Cache::forget('shop.reviews.' . $review->product_id);

        return back()->with('success', 'Review approved successfully.');
    }

    /**
     * Reject the specified review (mark as not approved).
     */
    public function reject(Review $review)
    {
        $review->update(['is_approved' => false]);
        Cache::forget('shop.reviews.' . $review->product_id);

        return back()->with('success', 'Review rejected successfully.');
    }

    /**
     * Remove the specified review from storage.
     */
    public function destroy(Review $review)
    {
        $review->delete();
        Cache::forget('shop.reviews.' . $review->product_id);

        return back()->with('success', 'Review deleted successfully.');
    }
}
