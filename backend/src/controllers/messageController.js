const Message = require('../models/Message');
const Room = require('../models/Room');
const mongoose = require('mongoose');

const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid room id' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Get room messages error:', error.message);
    return res.status(500).json({ message: 'Server error fetching messages' });
  }
};

const getDirectMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: userId },
        { sender: userId, recipient: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Get direct messages error:', error.message);
    return res.status(500).json({ message: 'Server error fetching messages' });
  }
};

module.exports = { getRoomMessages, getDirectMessages };
