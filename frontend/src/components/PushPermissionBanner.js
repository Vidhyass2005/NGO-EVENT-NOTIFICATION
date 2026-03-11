// components/PushPermissionBanner.js
// Shows a one-time banner asking user to enable browser push notifications
// Dismissible and remembers the user's choice in localStorage

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function PushPermissionBanner() {
  const { pushStatus, enablePush } = useNotifications();
  const [visible,   setVisible]   = useState(false);
  const [enabling,  setEnabling]  = useState(false);

  useEffect(() => {
    // Show banner only if permission not yet decided and not dismissed before
    const dismissed = localStorage.getItem('ngo_push_banner_dismissed');
    if (pushStatus === 'default' && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000); // delay 2s after login
      return () => clearTimeout(timer);
    }
  }, [pushStatus]);

  if (!visible || pushStatus === 'granted' || pushStatus === 'denied' || pushStatus === 'unsupported') {
    return null;
  }

  const handleEnable = async () => {
    setEnabling(true);
    const result = await enablePush();
    setEnabling(false);
    if (result.granted) setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('ngo_push_banner_dismissed', 'true');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-slide-in">
      <div className="card shadow-xl border-brand-400/30 overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-brand-400 to-indigo-400" />
        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Enable Push Notifications</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Get notified about event approvals, registrations, and certificates — even when the app is in the background.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={enabling}
                className="btn-primary text-xs py-1.5 px-3"
              >
                {enabling
                  ? <><span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Enabling...</>
                  : <><Bell size={12} /> Enable</>
                }
              </button>
              <button
                onClick={handleDismiss}
                className="btn-ghost text-xs py-1.5 px-3 gap-1"
              >
                <BellOff size={12} /> Not now
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
