let ioInstance = null;
const userSockets = new Map();

module.exports = {
  init: (io) => {
    ioInstance = io;
    ioInstance.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('register', (userId) => {
        if (userId) {
          userSockets.set(userId.toString(), socket.id);
          console.log(`User ${userId} registered with socket ${socket.id}`);
        }
      });

      socket.on('disconnect', () => {
        let disconnectedUserId = null;
        for (let [userId, socketId] of userSockets.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }
        if (disconnectedUserId) {
          userSockets.delete(disconnectedUserId);
          console.log(`User ${disconnectedUserId} disconnected`);
        }
      });
    });
  },

  getIo: () => {
    if (!ioInstance) {
      throw new Error('Socket.io is not initialized!');
    }
    return ioInstance;
  },

  sendNotificationToUser: (userId, notification) => {
    if (ioInstance && userId) {
      const socketId = userSockets.get(userId.toString());
      if (socketId) {
        ioInstance.to(socketId).emit('notification', notification);
        console.log(`Sent notification to user ${userId}`);
      } else {
        console.log(`User ${userId} is offline, notification saved only.`);
      }
    }
  }
};
