<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\ImageService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        // Save old image path before filling with new data
        $oldProfileImage = $user->profile_image;

        // Update name and email
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Handle profile image upload if provided
        if ($request->hasFile('profile_image')) {
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
                $user->profile_image = 'uploads/profile-images/' . $basename . '.webp';
            } catch (\Exception $e) {
                return back()->withErrors(['profile_image' => 'Failed to upload image: ' . $e->getMessage()]);
            }
        }

        $user->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
