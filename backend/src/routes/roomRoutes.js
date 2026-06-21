const express = require('express');
const router = express.Router();
const { getRooms, createRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRooms);
router.post('/', protect, createRoom);

module.exports = router;
