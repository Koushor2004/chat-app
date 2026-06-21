const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    socket.user = { id: user._id.toString(), username: user.username };
    next();
  } catch (error) {
    next(new Error('Authentication error: invalid token'));
  }
};

module.exports = socketAuth;
