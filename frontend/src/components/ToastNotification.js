// components/ToastNotification.js
// Custom minimal toast popup that slides in from bottom-right
// Supports all notification types with auto-dismiss and progress bar

import { useEffect, useState, useCallback } from 'react';
import { X, Bell, CheckCircle, XCircle, Award, UserPlus } from 'lucide-react';

// Icons and colors per notification type
const TYPE_CONFIG = {
  event_approved:  { Icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-50  dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800',  label: 'Event Approved'  },
  event_cancelled: { Icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50    dark:bg-red-900/20',    border: 'border-red-200   dark:border-red-800',    label: 'Event Cancelled' },
  registration:    { Icon: UserPlus,    color: 'text-blue-500',   bg: 'bg-blue-50   dark:bg-blue-900/20',   border: 'border-blue-200  dark:border-blue-800',   label: 'Registration'    },
  certificate_ready:{ Icon: Award,      color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', label: 'Certificate'     },
  event_created:   { Icon: Bell,        color: 'text-brand-500',  bg: 'bg-cyan-50   dark:bg-cyan-900/20',   border: 'border-cyan-200  dark:border-cyan-800',   label: 'New Event'       },
  system:          { Icon: Bell,        color: 'text-slate-500',  bg: 'bg-slate-50  dark:bg-slate-800',     border: 'border-slate-200 dark:border-slate-700',  label: 'System'          },
};

// Single toast item with progress bar and auto-dismiss
function ToastItem({ id, title, message, type, duration = 5000, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.system;
  const { Icon, color, bg, border } = cfg;

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300); // wait for exit animation
  }, [id, onDismiss]);

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p <= 0) { dismiss(); return 0; }
        return p - (100 / (duration / 100));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [duration, dismiss]);

  return (
    <div
      className={`
        relative w-80 rounded-xl border shadow-lg overflow-hidden
        transition-all duration-300 ease-out
        ${bg} ${border}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4 pr-10">
        <div className={`flex-shrink-0 mt-0.5 ${color}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {title}
          </p>
          {message && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <div className="h-0.5 bg-black/5 dark:bg-white/10">
        <div
          className={`h-full transition-all duration-100 ease-linear ${color.replace('text-', 'bg-')}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Container that holds all active toasts
export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
