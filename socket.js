let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  }
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

module.exports = {
  initSocket,
  getIO,
  emitCatalogUpdate,
};