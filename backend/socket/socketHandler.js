const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Store online users in memory: { userId: socketId }
const onlineUsers = new Map();

module.exports = (io) => {
  // Middleware: Authenticate socket connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId}`);
    
    // 1. Add to online users
    onlineUsers.set(socket.userId, socket.id);
    
    // Update DB
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    
    // Broadcast to everyone that this user is online
    io.emit('online-users', Array.from(onlineUsers.keys()));

    // 2. Handle sending a message
    socket.on('send-message', async ({ to, text }) => {
      try {
        // Save to DB
        const msg = await Message.create({
          sender: socket.userId,
          receiver: to,
          text: text
        });

        // Find receiver's socket ID
        const targetSocketId = onlineUsers.get(to);
        
        // Send to receiver (if online)
        if (targetSocketId) {
          io.to(targetSocketId).emit('receive-message', msg);
        }
        
        // Send back to sender (so they see it instantly too)
        socket.emit('message-sent', msg);
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    // 3. Handle typing indicator
    socket.on('typing', ({ to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('user-typing', { from: socket.userId });
      }
    });

    // 4. Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });
      
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });
  });
};