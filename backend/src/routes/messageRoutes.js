const express = require('express');
const router = express.Router();
const { getRoomMessages, getDirectMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/room/:roomId', protect, getRoomMessages);
router.get('/direct/:userId', protect, getDirectMessages);

module.exports = router;
