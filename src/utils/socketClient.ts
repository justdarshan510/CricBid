import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
      
    socket = io(socketUrl, {
      autoConnect: false,
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
    });
  }
  return socket;
};
