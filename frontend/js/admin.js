/* ============================================================
   ADMIN PANEL LOGIC
   ============================================================ */

if (requireAuth()) {
  initAdmin();
}

async function initAdmin() {
  // 1. Fetch current user to verify they are an admin
  const cached = getUser();
  if (cached) {
    if (!cached.isAdmin) {
      alert('Access Denied. You are not an admin.');
      location.href = 'dashboard.html';
      return;
    }
    setupNavbar(cached);
  }

  try {
    const meRes = await fetch(apiURL('/user/me'), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const meData = await meRes.json();
    
    if (!meData.user || !meData.user.isAdmin) {
      alert('Access Denied. You are not an admin.');
      location.href = 'dashboard.html';
      return;
    }
    localStorage.setItem('user', JSON.stringify(meData.user));
    setupNavbar(meData.user);

    // 2. Load admin data
    await loadStats();
    await loadUsers();
  } catch (err) {
    console.error(err);
    alert('Error loading admin data. Check console.');
  }
}

function setupNavbar(user) {
  document.getElementById('navAvatar').textContent = getInitials(user.username);
  document.getElementById('navUsername').textContent = user.username;
}

// ============================================================
// LOAD STATS
// ============================================================
async function loadStats() {
  try {
    const res = await fetch(apiURL('/admin/stats'), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    
    if (res.ok) {
      document.getElementById('statTotalUsers').textContent = data.totalUsers;
      document.getElementById('statOnlineUsers').textContent = data.onlineUsers;
      document.getElementById('statTotalMessages').textContent = data.totalMessages;
      document.getElementById('statBannedUsers').textContent = data.bannedUsers;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// ============================================================
// LOAD USERS TABLE
// ============================================================
async function loadUsers() {
  const tbody = document.getElementById('userTableBody');

  try {
    const res = await fetch(apiURL('/admin/users'), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.msg);

    if (data.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center;">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.users.map(user => {
      // Determine Badges
      let badges = '';
      if (user.isAdmin) badges += `<span class="badge" style="background: rgba(139,92,246,0.2); border-color: #8b5cf6; color: #a78bfa; margin-right: 6px; margin-bottom: 4px;">Admin</span>`;
      if (user.isBanned) badges += `<span class="badge" style="background: rgba(239,68,68,0.2); border-color: #ef4444; color: #fca5a5; margin-bottom: 4px;">Banned</span>`;
      if (!badges) badges = `<span style="color: var(--text-muted); font-size: 13px;">Active</span>`;

      // Action Buttons
      const banBtnText = user.isBanned ? 'Unban' : 'Ban';
      const banBtnColor = user.isBanned ? '#10b981' : '#ef4444'; // Green if unban, Red if ban
      
      const banButton = user.isAdmin ? '' : `
        <button onclick="toggleBan('${user._id}', ${!user.isBanned})" 
                style="padding: 6px 12px; font-size: 12px; background: ${banBtnColor}20; border: 1px solid ${banBtnColor}; color: ${banBtnColor}; box-shadow: none; margin-left: 8px;">
          ${banBtnText}
        </button>
      `;

      const adminButton = user.isAdmin ? '' : `
        <button onclick="makeAdmin('${user._id}')" 
                style="padding: 6px 12px; font-size: 12px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; color: #a78bfa; box-shadow: none; margin-left: 8px;">
          Make Admin
        </button>
      `;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="avatar" style="width: 32px; height: 32px; font-size: 12px; ${user.avatar ? `background: url(${user.avatar}) center/cover;` : ''}">
                ${user.avatar ? '' : getInitials(user.username)}
              </div>
              <span style="font-weight: 600;">${user.username}</span>
            </div>
          </td>
          <td style="padding: 12px; color: var(--text-secondary); font-size: 13px;">
            <div>${user.email || 'No email'}</div>
            <div>${user.phone || 'No phone'}</div>
          </td>
          <td style="padding: 12px;">${badges}</td>
          <td style="padding: 12px; text-align: right;">
            ${adminButton}
            ${banButton}
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #ef4444;">Error: ${err.message}</td></tr>`;
  }
}

// ============================================================
// ACTIONS
// ============================================================
async function toggleBan(userId, banStatus) {
  if (!confirm(`Are you sure you want to ${banStatus ? 'BAN' : 'UNBAN'} this user?`)) return;

  try {
    const res = await fetch(apiURL(`/admin/ban/${userId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ ban: banStatus })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.msg);
    }

    // Reload table and stats
    await loadUsers();
    await loadStats();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}

async function makeAdmin(userId) {
  if (!confirm('Promote this user to Admin? They will have full control.')) return;

  try {
    const res = await fetch(apiURL(`/admin/make-admin/${userId}`), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.msg);
    }

    await loadUsers();
    await loadStats();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}