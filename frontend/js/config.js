const PROD_URL = 'https://chat-app-backend-y02z.onrender.com';

const CONFIG = {
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : `${PROD_URL}/api`
};

const apiURL = (path) => `${CONFIG.API_BASE}${path}`;

const getToken = () => localStorage.getItem('token');
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
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

const requireAuth = () => {
  if (!isLoggedIn()) {
    location.href = 'login.html';
    return false;
  }
  return true;
};

const redirectIfLoggedIn = (to = 'dashboard.html') => {
  if (isLoggedIn()) location.href = to;
};

const showMsg = (text, isSuccess = false) => {
  const msg = document.getElementById('msg');
  if (!msg) return;
  msg.textContent = text;
  msg.className = isSuccess ? 'success' : '';
};

const setLoading = (btn, isLoading) => {
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
};

const logout = () => {
  clearAuth();
  location.href = 'index.html';
};

const getInitials = (name = '') =>
  name.trim().slice(0, 2).toUpperCase() || '?';