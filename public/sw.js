// Service Worker for Order Push Notifications
// This runs in the background even when the browser is closed.
const SW_VERSION = '2.0';

self.addEventListener('push', function (event) {
    console.log('[SW v' + SW_VERSION + '] Push event received!', event);

    let data = { title: 'New Order', body: 'A new order has been placed.', url: '/admin/orders' };

    if (event.data) {
        try {
            const raw = event.data.text();
            console.log('[SW] Push data (text):', raw);
            data = Object.assign(data, JSON.parse(raw));
            console.log('[SW] Push data (parsed):', data);
        } catch (e) {
            console.error('[SW] Failed to parse push data:', e);
            // fallback to defaults
        }
    } else {
        console.log('[SW] Push event has no data');
    }

    const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || data.icon || '/favicon.ico',
        tag: data.tag || 'order-notification',
        requireInteraction: true,
        data: { url: data.url || '/admin/orders' },
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options).then(function () {
            console.log('[SW] Notification shown successfully');
        }).catch(function (err) {
            console.error('[SW] Failed to show notification:', err);
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const url = event.notification.data?.url || '/admin/orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Focus existing admin tab if found
            for (const client of clientList) {
                if (client.url.includes('/admin') && 'focus' in client) {
                    return client.focus().then(function (c) {
                        c.navigate(url);
                    });
                }
            }

            // Otherwise open a new window
            return clients.openWindow(url);
        }),
    );
});

self.addEventListener('install', function (event) {
    console.log('[SW v' + SW_VERSION + '] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[SW v' + SW_VERSION + '] Activating...');
    event.waitUntil(self.clients.claim());
});

// Minimal fetch handler — required for PWA install eligibility
self.addEventListener('fetch', function (event) {
    // Only intercept same-origin GET requests; let everything else pass through natively
    if (event.request.method !== 'GET') return;
    event.respondWith(fetch(event.request));
});
