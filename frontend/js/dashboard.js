/* ============================================================
   DASHBOARD — Protected page logic
   Requires: config.js loaded BEFORE this file
   ============================================================ */

// 🔒 Auth guard: if not logged in, redirect to login
if (requireAuth()) {
  initDashboard();
}

async function initDashboard() {
  // 1. Show cached user instantly (fast paint)
  const cached = getUser();
  if (cached) renderUser(cached);

  // 2. Fetch fresh user from backend
  try {
    const res = await fetch(apiURL('/user/me'), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    // If token expired or account banned → force re-login
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      renderUser(data.user);
    }
  } catch (err) {
    console.error('Failed to fetch user:', err);
  }
}

function renderUser(user) {
  // --- Navbar ---
  const navAvatar = document.getElementById('navAvatar');
  const navUsername = document.getElementById('navUsername');

  if (navAvatar) navAvatar.textContent = getInitials(user.username);
  if (navUsername) navUsername.textContent = user.username;

  // --- Welcome section ---
  const welcomeTitle = document.getElementById('welcomeTitle');
  const welcomeSubtitle = document.getElementById('welcomeSubtitle');

  if (welcomeTitle) welcomeTitle.textContent = `Hi, ${user.username} 👋`;
  if (welcomeSubtitle)
    welcomeSubtitle.textContent =
      'Welcome to your chat dashboard. Pick a section to get started.';

  // --- Admin card (only visible for admins) ---
  if (user.isAdmin) {
    const adminCard = document.getElementById('adminCard');
    if (adminCard) adminCard.style.display = 'flex';
  }
}