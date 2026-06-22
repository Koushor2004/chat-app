const Message = require('../models/Message');
const Room = require('../models/Room');
const socketAuth = require('./socketAuth');

const roomUsers = new Map();
const globalOnlineUsers = new Map();

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
    const userId = socket.user.id;
    const username = socket.user.username;

    console.log(`Socket connected: ${username} (${socket.id})`);

    socket.join(`user_${userId}`);


    if (!globalOnlineUsers.has(userId)) {
      globalOnlineUsers.set(userId, { id: userId, username, count: 0 });
    }
    globalOnlineUsers.get(userId).count += 1;


    const broadcastOnlineList = () => {
      const list = Array.from(globalOnlineUsers.values()).map((u) => ({
        id: u.id,
        username: u.username,
      }));
      io.emit('globalOnlineUsers', list);
    };

    broadcastOnlineList();

    let currentRoomId = null;

    socket.on('joinRoom', async ({ roomId }) => {
      try {
        if (!roomId) return;

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('errorMessage', { message: 'Room not found' });
          return;
        }


        if (!room.members || !room.members.includes(userId)) {
          socket.emit('errorMessage', { message: 'You must join this room to view its chat' });
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
        roomUsers.get(roomId).set(socket.id, { id: userId, username });

        const history = await Message.find({ room: roomId })
          .sort({ createdAt: 1 })
          .limit(200)
          .lean();
        socket.emit('chatHistory', history);

        io.to(roomId).emit('onlineUsers', getOnlineUsersInRoom(roomId));
        socket.to(roomId).emit('userJoined', { username });
      } catch (error) {
        console.error('joinRoom error:', error.message);
        socket.emit('errorMessage', { message: 'Failed to join room' });
      }
    });

    socket.on('chatMessage', async ({ roomId, text }) => {
      try {
        if (!roomId || !text || !text.trim()) return;

        const room = await Room.findById(roomId);
        if (!room || !room.members || !room.members.includes(userId)) {
          socket.emit('errorMessage', { message: 'You must join this room to send messages' });
          return;
        }

        const message = await Message.create({
          room: roomId,
          sender: userId,
          senderUsername: username,
          text: text.trim(),
        });

        io.to(roomId).emit('chatMessage', {
          _id: message._id,
          room: roomId,
          sender: userId,
          senderUsername: username,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('chatMessage error:', error.message);
        socket.emit('errorMessage', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', async ({ roomId, isTyping }) => {
      if (!roomId) return;
      socket.to(roomId).emit('typing', {
        username,
        isTyping: !!isTyping,
      });
    });


    socket.on('privateMessage', async ({ recipientId, text }) => {
      try {
        if (!recipientId || !text || !text.trim()) return;

        const message = await Message.create({
          recipient: recipientId,
          sender: userId,
          senderUsername: username,
          text: text.trim(),
        });

        const msgPayload = {
          _id: message._id,
          recipient: recipientId,
          sender: userId,
          senderUsername: username,
          text: message.text,
          createdAt: message.createdAt,
        };


        io.to(`user_${recipientId}`).emit('privateMessage', msgPayload);
        io.to(`user_${userId}`).emit('privateMessage', msgPayload);
      } catch (error) {
        console.error('privateMessage error:', error.message);
        socket.emit('errorMessage', { message: 'Failed to send private message' });
      }
    });

    socket.on('privateTyping', ({ recipientId, isTyping }) => {
      if (!recipientId) return;
      io.to(`user_${recipientId}`).emit('privateTyping', {
        senderId: userId,
        username,
        isTyping: !!isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${username} (${socket.id})`);
      if (currentRoomId) {
        const usersMap = roomUsers.get(currentRoomId);
        if (usersMap) {
          usersMap.delete(socket.id);
          io.to(currentRoomId).emit('onlineUsers', getOnlineUsersInRoom(currentRoomId));
          socket.to(currentRoomId).emit('userLeft', { username });
        }
      }


      if (globalOnlineUsers.has(userId)) {
        const userObj = globalOnlineUsers.get(userId);
        userObj.count -= 1;
        if (userObj.count <= 0) {
          globalOnlineUsers.delete(userId);
          broadcastOnlineList();
        }
      }
    });
  });
};

module.exports = initSocket;
