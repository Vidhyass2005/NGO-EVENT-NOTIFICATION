// context/SocketContext.js
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setConnected(true); socket.emit('register', user._id); });
    socket.on('disconnect', () => setConnected(false));
    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; setConnected(false); };
  }, [user]);

  const on  = (event, fn) => socketRef.current?.on(event, fn);
  const off = (event, fn) => socketRef.current?.off(event, fn);
  const joinEvent  = (id) => socketRef.current?.emit('join_event', id);
  const leaveEvent = (id) => socketRef.current?.emit('leave_event', id);

  return (
    <SocketContext.Provider value={{ connected, on, off, joinEvent, leaveEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
