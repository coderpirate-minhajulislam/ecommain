<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        @php
            $siteLogo     = \App\Models\Setting::get('site_logo', '');
            $siteTitle    = \App\Models\Setting::get('site_title', '');
            $siteSubtitle = \App\Models\Setting::get('site_subtitle', '');
        @endphp
        <script>window.__SITE_TITLE__ = @json($siteTitle); window.__SITE_SUBTITLE__ = @json($siteSubtitle);</script>

        @if($siteLogo)
            <link rel="icon" href="/{{ $siteLogo }}" type="image/{{ pathinfo($siteLogo, PATHINFO_EXTENSION) === 'svg' ? 'svg+xml' : 'png' }}">
            <link rel="apple-touch-icon" href="/{{ $siteLogo }}">
        @endif

        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="{{ \App\Models\Setting::get('theme_primary_hex', '#16a34a') }}">
        <script>
            // Capture install prompt as early as possible, before React mounts
            window.__pwaInstallPrompt = null;
            window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                window.__pwaInstallPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-install-ready'));
            });
            window.addEventListener('appinstalled', function () {
                window.__pwaInstallPrompt = null;
            });
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
            }
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])

        @php
            $primaryHue   = (int) \App\Models\Setting::get('theme_primary_hue', 152);
            $secondaryHue = (int) \App\Models\Setting::get('theme_secondary_hue', 143);
            $outlineHue   = (int) \App\Models\Setting::get('theme_outline_hue', 143);
            $primaryHex   = \App\Models\Setting::get('theme_primary_hex', '#16a34a');
            $secondaryHex = \App\Models\Setting::get('theme_secondary_hex', '#dcfce7');
            $outlineHex   = \App\Models\Setting::get('theme_outline_hex', '#bbf7d0');
        @endphp
        <style>
            /* Supply hue values for derived/background tokens */
            :root, .dark {
                --theme-primary-hue: {{ $primaryHue }} !important;
                --theme-secondary-hue: {{ $secondaryHue }} !important;
                --theme-outline-hue: {{ $outlineHue }} !important;
            }
            /* Light mode: use exact admin-selected hex for the button/border tokens */
            :root {
                --primary: {{ $primaryHex }} !important;
                --ring: {{ $primaryHex }} !important;
                --secondary: {{ $secondaryHex }} !important;
                --border: {{ $outlineHex }} !important;
                --input: {{ $outlineHex }} !important;
                --sidebar-primary: {{ $primaryHex }} !important;
                --sidebar-ring: {{ $primaryHex }} !important;
            }
        </style>

        @php
            $seoMetaTags = json_decode(\App\Models\Setting::get('seo_meta_tags', '[]'), true) ?: [];
        @endphp

        <x-inertia::head>
            <title>{{ $siteTitle && $siteSubtitle ? $siteTitle . ' - ' . $siteSubtitle : ($siteTitle ?: 'Shop') }}</title>
            @foreach ($seoMetaTags as $seoMetaTag)
                {!! $seoMetaTag !!}
            @endforeach
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
