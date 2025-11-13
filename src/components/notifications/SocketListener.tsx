import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface SocketListenerProps {
  socket: Socket | null;
  onNotification: () => void;
}

const SocketListener = ({ socket, onNotification }: SocketListenerProps) => {
  useEffect(() => {
    console.log('🔊 SocketListener: Setting up notification listener, socket:', !!socket);
    if (!socket) return;

    const handleNotification = (data: any) => {
      console.log('🔊 SocketListener: New notification received:', data, new Date().toISOString());
      onNotification();
    };

    socket.on('newNotification', handleNotification);
    console.log('🔊 SocketListener: Notification listener attached');

    return () => {
      socket.off('newNotification', handleNotification);
      console.log('🔊 SocketListener: Notification listener removed');
    };
  }, [socket, onNotification]);

  return null; // This component doesn't render anything
};

export default SocketListener;