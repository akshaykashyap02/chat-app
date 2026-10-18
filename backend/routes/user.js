const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.use(auth);

// GET /api/user/me
router.get('/me', async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/user/update
router.put('/update', async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};

    if (username) {
      if (username.length < 3)
        return res.status(400).json({ msg: 'Username must be 3+ chars' });

      const taken = await User.findOne({
        username,
        _id: { $ne: req.user._id }
      });
      if (taken) return res.status(400).json({ msg: 'Username taken' });

      updates.username = username;
    }

    if (bio !== undefined) updates.bio = bio.slice(0, 200);
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password');

    res.json({ msg: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/user — list users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar bio isOnline lastSeen')
      .limit(100);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;