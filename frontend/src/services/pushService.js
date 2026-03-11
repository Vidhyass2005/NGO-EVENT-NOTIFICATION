// services/pushService.js
// Manages browser push notification permission + Service Worker registration
// Works alongside Socket.io in-app toasts for dual-channel notifications

const PUSH_STORAGE_KEY = 'ngo_push_enabled';

// Register the Service Worker
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered');
    return reg;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
};

// Request browser notification permission
export const requestPushPermission = async () => {
  if (!('Notification' in window)) {
    return { granted: false, reason: 'Browser does not support notifications' };
  }
  if (Notification.permission === 'granted') {
    localStorage.setItem(PUSH_STORAGE_KEY, 'true');
    return { granted: true };
  }
  if (Notification.permission === 'denied') {
    return { granted: false, reason: 'Permission denied by user' };
  }
  const permission = await Notification.requestPermission();
  const granted = permission === 'granted';
  localStorage.setItem(PUSH_STORAGE_KEY, granted ? 'true' : 'false');
  return { granted };
};

// Check if push is currently enabled
export const isPushEnabled = () => {
  return (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    localStorage.getItem(PUSH_STORAGE_KEY) === 'true'
  );
};

// Show a browser push notification directly (no server needed)
// This is triggered by Socket.io events so works while app is open
export const showBrowserNotification = (title, body, url = '/') => {
  if (!isPushEnabled()) return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((reg) => {
    reg.showNotification(title, {
      body,
      icon:    '/logo192.png',
      badge:   '/logo192.png',
      tag:     `ngo-${Date.now()}`,
      data:    { url },
      vibrate: [200, 100, 200],
    });
  }).catch(console.error);
};

export const getPushPermissionStatus = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};
