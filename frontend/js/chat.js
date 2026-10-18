/* ============================================================
   CHAT LOGIC
   ============================================================ */

// Variables MUST be declared at the top so they exist before functions run
let socket;
let currentUser = null;
let allUsers = [];
let onlineUserIds = [];
let activeChatId = null;

async function initChat() {
  // 1. Get current user
  currentUser = getUser();
  if (!currentUser) {
    location.href = 'login.html';
    return;
  }
  
  setupNavbar(currentUser);

  // 2. Connect to Socket.IO
    // 2. Connect to Socket.IO (Pointing to backend on port 5000)
  socket = io('http://localhost:5000', {
    auth: { token: getToken() }
  });

  socket.on('connect', () => console.log('Socket connected'));
  
  socket.on('online-users', (users) => {
    onlineUserIds = users;
    updateOnlineStatuses();
  });

  socket.on('receive-message', (msg) => {
    if (activeChatId === msg.sender || activeChatId === msg.receiver) {
      appendMessage(msg, msg.sender === currentUser._id ? 'sent' : 'received');
    }
  });

  socket.on('message-sent', (msg) => {
    appendMessage(msg, 'sent');
  });

  // 3. Load all users (excluding me)
  await fetchUsers();
}

function setupNavbar(user) {
  document.getElementById('navAvatar').textContent = getInitials(user.username);
  document.getElementById('navUsername').textContent = user.username;
}

async function fetchUsers() {
  try {
    const res = await fetch(apiURL('/user'), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    
    if (res.ok) {
      allUsers = data.users;
      renderUserList();
      
      // Force a status update after users load so the dots appear
      updateOnlineStatuses();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderUserList() {
  const list = document.getElementById('usersList');
  list.innerHTML = allUsers.map(user => {
    const isOnline = onlineUserIds.includes(user._id);
    return `
      <div class="user-item" id="user-${user._id}" onclick="openChat('${user._id}')">
        <div class="avatar-wrapper">
          <div class="avatar" style="${user.avatar ? `background: url(${user.avatar}) center/cover;` : ''}">
            ${user.avatar ? '' : getInitials(user.username)}
          </div>
          <div class="status-dot ${isOnline ? 'online' : ''}" id="dot-${user._id}"></div>
        </div>
        <div class="user-info">
          <h4>${user.username}</h4>
          <p>${isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>
    `;
  }).join('');
}

function updateOnlineStatuses() {
  allUsers.forEach(user => {
    const isOnline = onlineUserIds.includes(user._id);
    const dot = document.getElementById(`dot-${user._id}`);
    const text = document.querySelector(`#user-${user._id} .user-info p`);
    
    if (dot) {
      if (isOnline) dot.classList.add('online');
      else dot.classList.remove('online');
    }
    if (text) {
      text.textContent = isOnline ? 'Online' : 'Offline';
    }
  });

  // If chatting, update header status
  if (activeChatId) {
    const isOnline = onlineUserIds.includes(activeChatId);
    const chatDot = document.getElementById('chatStatusDot');
    const chatText = document.getElementById('chatStatusText');
    
    if (isOnline) chatDot.classList.add('online');
    else chatDot.classList.remove('online');
    
    chatText.textContent = isOnline ? 'Online' : 'Offline';
  }
}

async function openChat(userId) {
  activeChatId = userId;
  const user = allUsers.find(u => u._id === userId);

  // UI switches
  document.getElementById('noChatSelected').style.display = 'none';
  document.getElementById('activeChat').style.display = 'flex';
  
  // Highlight sidebar
  document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`user-${userId}`).classList.add('active');

  // Update header
  document.getElementById('chatName').textContent = user.username;
  document.getElementById('chatAvatar').innerHTML = user.avatar 
    ? '' : getInitials(user.username);
  if (user.avatar) {
    document.getElementById('chatAvatar').style.background = `url(${user.avatar}) center/cover`;
  } else {
    document.getElementById('chatAvatar').style.background = '';
  }
  
  updateOnlineStatuses(); // Update header dot

  // Fetch history
  const msgsContainer = document.getElementById('messagesContainer');
  msgsContainer.innerHTML = '<div style="text-align:center;color:#71717a;">Loading messages...</div>';

  try {
    const res = await fetch(apiURL(`/message/${userId}`), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    
    if (res.ok) {
      msgsContainer.innerHTML = '';
      if (data.messages.length === 0) {
        msgsContainer.innerHTML = '<div style="text-align:center;color:#71717a;margin-top:20px;">No messages yet. Say hi!</div>';
      } else {
        data.messages.forEach(msg => {
          const type = msg.sender === currentUser._id ? 'sent' : 'received';
          appendMessage(msg, type, false); // false = don't scroll yet
        });
      }
      scrollToBottom();
    }
  } catch (err) {
    msgsContainer.innerHTML = '<div style="color:#ef4444;text-align:center;">Failed to load messages.</div>';
  }
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !activeChatId) return;

  socket.emit('send-message', { to: activeChatId, text });
  input.value = '';
}

// Allow Enter key to send
document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function appendMessage(msg, type, scroll = true) {
  const container = document.getElementById('messagesContainer');
  
  // Remove "No messages yet" if it exists
  if (container.innerHTML.includes('No messages yet')) {
    container.innerHTML = '';
  }

  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.textContent = msg.text;
  container.appendChild(div);
  
  if (scroll) scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  container.scrollTop = container.scrollHeight;
}

/* ============================================================
   START CHAT (Must be at the bottom!)
   ============================================================ */
if (requireAuth()) {
  initChat();
}