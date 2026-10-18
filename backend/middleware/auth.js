const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ msg: 'No token, access denied' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'User not found' });
    if (user.isBanned) return res.status(403).json({ msg: 'Account banned' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin)
    return res.status(403).json({ msg: 'Admin access required' });
  next();
};

module.exports = auth;
module.exports.adminOnly = adminOnly;