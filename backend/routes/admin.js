const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');

// All routes here require login AND admin privileges
router.use(auth);
router.use(auth.adminOnly);

// ============================================================
// GET /api/admin/stats — Dashboard statistics
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalMessages = await Message.countDocuments();

    res.json({
      totalUsers,
      onlineUsers,
      bannedUsers,
      totalMessages
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ============================================================
// GET /api/admin/users — List all users
// ============================================================
router.get('/users', async (req, res) => {
  try {
    // Get all users, sorted by newest first
    const users = await User.find()
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ============================================================
// PUT /api/admin/ban/:id — Ban or Unban a user
// ============================================================
router.put('/ban/:id', async (req, res) => {
  try {
    const { ban } = req.body; // boolean: true to ban, false to unban
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ msg: 'Cannot ban another admin' });

    user.isBanned = ban;
    await user.save();

    res.json({ msg: ban ? 'User banned' : 'User unbanned', user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ============================================================
// PUT /api/admin/make-admin/:id — Promote a user to admin
// ============================================================
router.put('/make-admin/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.isAdmin = true;
    await user.save();

    res.json({ msg: 'User promoted to admin', user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;