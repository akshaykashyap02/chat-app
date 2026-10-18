/* ============================================================
   PROFILE PAGE — view + edit user profile
   ============================================================ */

if (requireAuth()) {
  initProfile();
}

let currentUser = null;

async function initProfile() {
  const cached = getUser();
  if (cached) {
    currentUser = cached;
    fillForm(cached);
  }

  try {
    const res = await fetch(apiURL('/user/me'), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (res.status === 401 || res.status === 403) {
      clearAuth();
      location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (data.user) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      fillForm(data.user);
    }
  } catch (err) {
    console.error('Fetch user failed:', err);
    showMsg('Failed to load profile');
  }
}

function fillForm(user) {
  document.getElementById('navAvatar').textContent = getInitials(user.username);
  document.getElementById('navUsername').textContent = user.username;
  document.getElementById('bigAvatar').textContent = getInitials(user.username);

  const bigAvatar = document.getElementById('bigAvatar');
  if (user.avatar) {
    bigAvatar.style.background = `url(${user.avatar}) center/cover`;
    bigAvatar.textContent = '';
  }

  document.getElementById('username').value = user.username || '';
  document.getElementById('email').value = user.email || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('bio').value = user.bio || '';
  document.getElementById('avatar').value = user.avatar || '';

  if (!user.email) document.getElementById('email').value = '—';
  if (!user.phone) document.getElementById('phone').value = '—';
}

const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMsg('');

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);

    const fd = new FormData(profileForm);
    const body = {
      username: fd.get('username').trim(),
      bio: fd.get('bio').trim(),
      avatar: fd.get('avatar').trim()
    };

    try {
      const res = await fetch(apiURL('/user/update'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg(data.msg || 'Update failed');
        setLoading(btn, false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      fillForm(data.user);

      showMsg('Profile updated!', true);
      setLoading(btn, false);
    } catch (err) {
      showMsg('Server error: ' + err.message);
      setLoading(btn, false);
    }
  });
}