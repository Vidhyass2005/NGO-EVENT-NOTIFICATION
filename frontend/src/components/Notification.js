// components/Notification.js
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/helpers';

const TYPE_ICONS = {
  event_created: '📋', event_approved: '✅', event_cancelled: '⚠️',
  registration: '🎫', certificate_ready: '🏆', system: '📢'
};

export default function Notification() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, deleteNotif } = useNotifications();
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-ghost p-2 relative">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-400 text-slate-900 text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 card shadow-xl overflow-hidden animate-slide-in z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={() => markAsRead('all')} className="text-xs text-brand-500 hover:text-brand-600 px-2 py-1 rounded flex items-center gap-1">
                  <Check size={11} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><X size={13} /></button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id}
                  onClick={() => !n.isRead && markAsRead([n._id])}
                  className={`group flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                  <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 transition-opacity">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
