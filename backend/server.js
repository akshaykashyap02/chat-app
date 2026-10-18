require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ---------- Socket.IO Setup ----------
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*' }
});

// ---------- Middleware ----------
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ---------- Routes ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/message', require('./routes/message'));

// ---------- Health Check ----------
app.get('/', (req, res) => {
  res.json({ msg: 'API running ✅', time: new Date().toISOString() });
});

// ---------- Socket Handler ----------
require('./socket/socketHandler')(io);

// ---------- 404 Handler ----------
app.use((req, res) => {
  res.status(404).json({ msg: `Route not found: ${req.method} ${req.url}` });
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ msg: 'Internal server error' });
});

// ---------- Connect DB + Start Server ----------
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () =>
      console.log(`🚀 Server on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ Mongo connection failed:', err.message);
    process.exit(1);
  });