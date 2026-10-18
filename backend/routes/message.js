const router = require('express').Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

router.use(auth);

// GET /api/message/:userId — Get chat history with a specific user
router.get('/:userId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 }); // Oldest to newest

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;