// sw.js - Service Worker for browser push notifications
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Handle push event from server
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title   = data.title   || 'NGO Events';
  const options = {
    body:    data.body    || 'You have a new notification',
    icon:    data.icon    || '/logo192.png',
    badge:   '/logo192.png',
    tag:     data.tag     || 'ngo-notification',
    data:    { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: [{ action: 'view', title: 'View' }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
