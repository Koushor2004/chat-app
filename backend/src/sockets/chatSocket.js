const Message = require('../models/Message');
const Room = require('../models/Room');
const socketAuth = require('./socketAuth');


const roomUsers = new Map();

const getOnlineUsersInRoom = (roomId) => {
  const usersMap = roomUsers.get(roomId);
  if (!usersMap) return [];
  const seen = new Map();
  for (const u of usersMap.values()) {
    seen.set(u.id, u);
  }
  return Array.from(seen.values());
};

const initSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    let currentRoomId = null;

    socket.on('joinRoom', async ({ roomId }) => {
      try {
        if (!roomId) return;

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('errorMessage', { message: 'Room not found' });
          return;
        }

        if (currentRoomId && currentRoomId !== roomId) {
          socket.leave(currentRoomId);
          const prevUsers = roomUsers.get(currentRoomId);
          if (prevUsers) {
            prevUsers.delete(socket.id);
            io.to(currentRoomId).emit('onlineUsers', getOnlineUsersInRoom(currentRoomId));
          }
        }

        socket.join(roomId);
        currentRoomId = roomId;

        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }
        roomUsers.get(roomId).set(socket.id, { id: socket.user.id, username: socket.user.username });

        const history = await Message.find({ room: roomId })
          .sort({ createdAt: 1 })
          .limit(200)
          .lean();
        socket.emit('chatHistory', history);

        io.to(roomId).emit('onlineUsers', getOnlineUsersInRoom(roomId));
        socket.to(roomId).emit('userJoined', { username: socket.user.username });
      } catch (error) {
        console.error('joinRoom error:', error.message);
        socket.emit('errorMessage', { message: 'Failed to join room' });
      }
    });

    socket.on('chatMessage', async ({ roomId, text }) => {
      try {
        if (!roomId || !text || !text.trim()) return;

        const message = await Message.create({
          room: roomId,
          sender: socket.user.id,
          senderUsername: socket.user.username,
          text: text.trim(),
        });

        io.to(roomId).emit('chatMessage', {
          _id: message._id,
          room: roomId,
          sender: socket.user.id,
          senderUsername: socket.user.username,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('chatMessage error:', error.message);
        socket.emit('errorMessage', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      if (!roomId) return;
      socket.to(roomId).emit('typing', {
        username: socket.user.username,
        isTyping: !!isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.username} (${socket.id})`);
      if (currentRoomId) {
        const usersMap = roomUsers.get(currentRoomId);
        if (usersMap) {
          usersMap.delete(socket.id);
          io.to(currentRoomId).emit('onlineUsers', getOnlineUsersInRoom(currentRoomId));
          socket.to(currentRoomId).emit('userLeft', { username: socket.user.username });
        }
      }
    });
  });
};

module.exports = initSocket;
