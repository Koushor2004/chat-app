const Room = require('../models/Room');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    return res.status(200).json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error.message);
    return res.status(500).json({ message: 'Server error fetching rooms' });
  }
};

const createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Room name must be at least 2 characters' });
    }

    const existingRoom = await Room.findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(409).json({ message: 'Room already exists' });
    }

    const room = await Room.create({
      name: name.trim(),
      createdBy: req.user._id,
      members: [req.user._id],
    });
    const populatedRoom = await room.populate('createdBy', 'username');

    return res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Create room error:', error.message);
    return res.status(500).json({ message: 'Server error creating room' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    const populatedRoom = await room.populate('createdBy', 'username');
    return res.status(200).json(populatedRoom);
  } catch (error) {
    console.error('Join room error:', error.message);
    return res.status(500).json({ message: 'Server error joining room' });
  }
};

module.exports = { getRooms, createRoom, joinRoom };
