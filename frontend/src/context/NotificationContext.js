// context/NotificationContext.js
// Dual notification system: in-app toast + browser push notification
// Browser push fires even when tab is in background

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastNotification';
import {
  registerServiceWorker,
  requestPushPermission,
  showBrowserNotification,
  isPushEnabled,
  getPushPermissionStatus,
} from '../services/pushService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { on, off } = useSocket();
  const { toasts, showToast, dismissToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [pushStatus,    setPushStatus]    = useState('default'); // 'default'|'granted'|'denied'|'unsupported'

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
    setPushStatus(getPushPermissionStatus());
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (e) { console.error(e); }
  }, [isAuthenticated]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Enable browser push notifications
  const enablePush = useCallback(async () => {
    const result = await requestPushPermission();
    setPushStatus(getPushPermissionStatus());
    return result;
  }, []);

  // Socket.io → in-app toast + browser push
  useEffect(() => {
    const handler = (notif) => {
      // Update notification list
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // 1️⃣ In-app toast
      showToast({ title: notif.title, message: notif.message, type: notif.type, duration: 5000 });

      // 2️⃣ Browser push notification
      showBrowserNotification(notif.title, notif.message, '/');
    };

    on('notification', handler);
    return () => off('notification', handler);
  }, [on, off, showToast]);

  const markAsRead = async (ids) => {
    await notificationAPI.markRead(ids);
    if (ids === 'all') {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } else {
      setNotifications(prev => prev.map(n => ids.includes(n._id) ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    }
  };

  const deleteNotif = async (id) => {
    await notificationAPI.delete(id);
    const n = notifications.find(x => x._id === id);
    setNotifications(prev => prev.filter(x => x._id !== id));
    if (!n?.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const notify = useCallback((title, message, type = 'system') => {
    showToast({ title, message, type });
    showBrowserNotification(title, message);
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      markAsRead, deleteNotif,
      refetch: fetchNotifications,
      notify,
      pushStatus,
      enablePush,
      isPushEnabled: isPushEnabled(),
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
