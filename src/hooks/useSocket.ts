import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (baseURL?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) return;

    const user = JSON.parse(userData);
    const userId = user.id || user._id || user.userId || user.userID;
    const clientId = user.clientId || user.clientID || user.client || userId;

    if (!userId) return;

    // Connect to socket server
    const newSocket = io(baseURL || 'http://localhost:8745', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('🔔 Connected to notification socket', new Date().toISOString());
      setIsConnected(true);

      // Join appropriate room
      if (user.role === 'master') {
        newSocket.emit('joinRoom', { userId, role: user.role, clientId });
        console.log('🔔 Joined master room:', `master-${userId}`);
      } else if (user.role === 'client' || user.role === 'user' || user.role === 'admin') {
        newSocket.emit('joinRoom', { userId, role: user.role, clientId });
        console.log('🔔 Joined rooms:', `user-${userId}`, `client-${clientId}`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔔 Disconnected from notification socket');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, [baseURL]);

  return { socket, isConnected };
};