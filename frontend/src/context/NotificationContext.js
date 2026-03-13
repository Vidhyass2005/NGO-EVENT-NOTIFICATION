// context/NotificationContext.js
// Dual notification: in-app toast (Socket.io) + browser push (Service Worker)
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
  const { on, off }         = useSocket();
  const { toasts, showToast, dismissToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [pushStatus,    setPushStatus]    = useState('default');

  // Register SW on mount
  useEffect(() => {
    registerServiceWorker();
    setPushStatus(getPushPermissionStatus());
  }, []);

  // Fetch existing notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (e) { console.error(e); }
  }, [isAuthenticated]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Enable browser push
  const enablePush = useCallback(async () => {
    const result = await requestPushPermission();
    setPushStatus(getPushPermissionStatus());
    return result;
  }, []);

  // Socket.io real-time notification handler
  useEffect(() => {
    const handler = (notif) => {
      // 1. Add to notification list
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      // 2. Show in-app toast
      showToast({ title: notif.title, message: notif.message, type: notif.type, duration: 6000 });
      // 3. Show browser push notification
      showBrowserNotification(notif.title, notif.message, '/');
    };
    on('notification', handler);
    return () => off('notification', handler);
  }, [on, off, showToast]);

  // Mark notifications as read
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

  // Delete a notification
  const deleteNotif = async (id) => {
    await notificationAPI.delete(id);
    const n = notifications.find(x => x._id === id);
    setNotifications(prev => prev.filter(x => x._id !== id));
    if (!n?.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Manual notify — for local UI feedback (no DB, no socket)
  const notify = useCallback((title, message, type = 'system') => {
    showToast({ title, message, type });
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      deleteNotif,
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
