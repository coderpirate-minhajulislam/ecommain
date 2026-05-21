import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/@inertiajs')) {
                        return 'vendor-inertia';
                    }
                    if (
                        id.includes('node_modules/lucide-react') ||
                        id.includes('node_modules/class-variance-authority') ||
                        id.includes('node_modules/clsx') ||
                        id.includes('node_modules/tailwind-merge')
                    ) {
                        return 'vendor-ui';
                    }
                    if (id.includes('node_modules/@radix-ui')) {
                        return 'vendor-radix';
                    }
                    if (id.includes('node_modules/sonner') || id.includes('node_modules/axios') || id.includes('node_modules/zustand')) {
                        return 'vendor-misc';
                    }
                },
            },
        },
    },
});
