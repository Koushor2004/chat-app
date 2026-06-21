const express = require('express');
const router = express.Router();
const { getRooms, createRoom, joinRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRooms);
router.post('/', protect, createRoom);
router.post('/:roomId/join', protect, joinRoom);

module.exports = router;
