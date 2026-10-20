const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Store online users: Map<userId, socketId>
const onlineUsers = new Map();

module.exports = (io) => {
  // Middleware: Authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch the user to get their username
      const user = await User.findById(decoded.id);
      if (!user) throw new Error('User not found');
      
      socket.userId = user._id.toString(); // Ensure it's a string
      socket.username = user.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.username}`);
    
    // 1. Add to online users map
    onlineUsers.set(socket.userId, socket.id);
    
    // 2. Update DB
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    
    // 3. Broadcast the updated list of online User IDs to EVERYONE
    io.emit('online-users', Array.from(onlineUsers.keys()));

    // 4. Handle sending a message
    socket.on('send-message', async ({ to, text }) => {
      try {
        const msg = await Message.create({
          sender: socket.userId,
          receiver: to,
          text: text
        });

        // Find the socket ID of the person receiving the message
        const targetSocketId = onlineUsers.get(to);
        
        // Send to receiver (if they are online)
        if (targetSocketId) {
          io.to(targetSocketId).emit('receive-message', msg);
        }
        
        // Send back to sender (so they see it instantly too)
        socket.emit('message-sent', msg);
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    // 5. Handle typing indicator
    socket.on('typing', ({ to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('user-typing', { from: socket.userId });
      }
    });

    // 6. Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.username}`);
      
      // Remove from map
      onlineUsers.delete(socket.userId);
      
      // Update DB
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });
      
      // Broadcast the updated list
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });
  });
};