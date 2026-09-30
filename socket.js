const jwt = require('jsonwebtoken');
let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Optional auth: guests still connect (for catalog updates), logged-in users join a private room
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      if (userId) {
        socket.data.userId = userId;
        socket.join(`user:${userId}`);
      }
    } catch (err) {
      // invalid/expired token -> treat as guest
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, socket.data.userId ? `(user ${socket.data.userId})` : '(guest)');
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
}

const emitCatalogUpdate = (data) => {
  if (!io) return false;
  io.emit('catalog_updated', data || {});
  io.emit('products_updated', data || {});
  io.emit('packages_updated', data || {});
  console.log('📦 [Socket] Broadcasted packages_updated to all clients');
  return true;
};

// Send a balance update to ONE user only (all their tabs/devices)
const emitCreditBalance = (userId, creditBalance) => {
  if (!io) return false;
  io.to(`user:${userId}`).emit('credit_balance_updated', {
    creditBalance: Number(creditBalance) || 0,
  });
  return true;
};

module.exports = { initSocket, getIO, emitCatalogUpdate, emitCreditBalance };