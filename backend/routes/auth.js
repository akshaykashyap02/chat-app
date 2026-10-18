const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/sendEmail'); // <-- Added import

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^\+?[1-9]\d{9,14}$/.test(v);
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ============================================================
// POST /api/auth/register
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ msg: 'Username and password required' });
    if (!email && !phone)
      return res.status(400).json({ msg: 'Email or phone required' });
    if (email && !isEmail(email))
      return res.status(400).json({ msg: 'Invalid email format' });
    if (phone && !isPhone(phone))
      return res.status(400).json({ msg: 'Invalid phone (use +countrycode)' });
    if (password.length < 6)
      return res.status(400).json({ msg: 'Password must be 6+ characters' });

    const or = [{ username }];
    if (email) or.push({ email: email.toLowerCase() });
    if (phone) or.push({ phone });

    const exists = await User.findOne({ $or: or });
    if (exists) return res.status(400).json({ msg: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      password: hash
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('register error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ============================================================
// POST /api/auth/login
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ msg: 'All fields required' });

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ msg: 'Account banned' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: 'Invalid credentials' });

    user.lastSeen = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ msg: 'Email required' });

    const user = await User.findOne({ email: identifier.toLowerCase() });
    if (!user) return res.status(404).json({ msg: 'No account with that email' });
    if (user.isBanned) return res.status(403).json({ msg: 'Account banned' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    // Send email
    const result = await sendOtpEmail(user.email, otp, 'Password Reset');
    if (!result.ok) {
      return res.status(500).json({ msg: 'Failed to send OTP email. Check server logs.' });
    }

    res.json({ msg: 'OTP sent to your email' });
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ============================================================
// POST /api/auth/reset-password
// ============================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword)
      return res.status(400).json({ msg: 'All fields required' });
    if (newPassword.length < 6)
      return res.status(400).json({ msg: 'Password must be 6+ characters' });

    const user = await User.findOne({ email: identifier.toLowerCase() });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ msg: 'No OTP requested. Please request again.' });
    if (user.otp !== otp)
      return res.status(400).json({ msg: 'Invalid OTP' });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ msg: 'OTP expired. Request a new one.' });

    // Update password + clear OTP
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ msg: 'Password updated successfully. Please sign in.' });
  } catch (err) {
    console.error('reset-password error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;