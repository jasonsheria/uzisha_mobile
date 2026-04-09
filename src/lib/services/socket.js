import { io } from 'socket.io-client';

// Remplacez par l'IP de votre machine (pas localhost) pour tester sur un vrai téléphone
const SOCKET_URL = "http://192.168.1.XX:3000/webrtc"; 

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket']
});

export const connectSocket = (userId) => {
  socket.io.opts.query = { userId };
  socket.connect();
};