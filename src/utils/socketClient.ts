import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : '');

    socket = io(socketUrl, {
      autoConnect: false,
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
    });
  }

  return socket;
};