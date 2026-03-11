// hooks/useToast.js
// Custom hook to manage the toast queue
// Call showToast({ title, message, type }) from anywhere

import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, message, type = 'system', duration = 5000 }) => {
    const id = ++toastId;
    setToasts(prev => {
      // Max 4 toasts visible at once - remove oldest if exceeded
      const updated = prev.length >= 4 ? prev.slice(1) : prev;
      return [...updated, { id, title, message, type, duration }];
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
};
