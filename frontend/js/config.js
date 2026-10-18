/* ============================================================
   GLOBAL CONFIG — loaded first on every page
   ============================================================ */

// Backend API base URL
const CONFIG = {
  API_BASE: 'http://localhost:5000/api'
};

// Build full API URL
const apiURL = (path) => `${CONFIG.API_BASE}${path}`;

/* ============================================================
   AUTH STORAGE HELPERS
   ============================================================ */

const getToken = () => localStorage.getItem('token');

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const isLoggedIn = () => !!getToken();

/* ============================================================
   AUTH GUARD HELPERS
   Use on protected pages (dashboard, profile, chat, admin)
   ============================================================ */

// Call at the top of a protected page's script.
// If not logged in, redirects to login.html.
const requireAuth = () => {
  if (!isLoggedIn()) {
    location.href = 'login.html';
    return false;
  }
  return true;
};

// Call at the top of login.html / register.html.
// If already logged in, redirects to dashboard.
const redirectIfLoggedIn = (to = 'dashboard.html') => {
  if (isLoggedIn()) {
    location.href = to;
  }
};

/* ============================================================
   UI HELPERS
   ============================================================ */

// Show error / success message in an element with id="msg"
const showMsg = (text, isSuccess = false) => {
  const msg = document.getElementById('msg');
  if (!msg) return;
  msg.textContent = text;
  msg.className = isSuccess ? 'success' : '';
};

// Toggle loading spinner on a button
const setLoading = (btn, isLoading) => {
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
};

// Logout — clear auth + redirect
const logout = () => {
  clearAuth();
  location.href = 'index.html';
};

// Get initials from a username (for avatar fallback)
const getInitials = (name = '') =>
  name.trim().slice(0, 2).toUpperCase() || '?';