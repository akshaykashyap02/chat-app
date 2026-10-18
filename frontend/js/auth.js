/* ============================================================
   AUTH — Register & Login forms
   Requires: config.js loaded BEFORE this file
   ============================================================ */

// If already signed in and visiting login/register → redirect
redirectIfLoggedIn('dashboard.html');

/* ============================================================
   REGISTER FORM
   ============================================================ */
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMsg('');

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);

    const fd = new FormData(registerForm);
    const body = {
      username: fd.get('username').trim(),
      password: fd.get('password')
    };

    const email = fd.get('email')?.trim();
    const phone = fd.get('phone')?.trim();
    if (email) body.email = email;
    if (phone) body.phone = phone;

    // Require at least one of email or phone
    if (!body.email && !body.phone) {
      showMsg('Please enter an email or phone number');
      setLoading(btn, false);
      return;
    }

    try {
      const res = await fetch(apiURL('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg(data.msg || 'Registration failed');
        setLoading(btn, false);
        return;
      }

      // Save token + user
      setAuth(data.token, data.user);
      showMsg('Account created! Redirecting...', true);

      setTimeout(() => (location.href = 'dashboard.html'), 900);
    } catch (err) {
      showMsg('Server error: ' + err.message);
      setLoading(btn, false);
    }
  });
}

/* ============================================================
   LOGIN FORM
   ============================================================ */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMsg('');

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);

    const fd = new FormData(loginForm);
    const body = {
      identifier: fd.get('identifier').trim(),
      password: fd.get('password')
    };

    try {
      const res = await fetch(apiURL('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg(data.msg || 'Login failed');
        setLoading(btn, false);
        return;
      }

      setAuth(data.token, data.user);
      showMsg('Signed in! Redirecting...', true);

      setTimeout(() => (location.href = 'dashboard.html'), 900);
    } catch (err) {
      showMsg('Server error: ' + err.message);
      setLoading(btn, false);
    }
  });
}
/* ============================================================
   FORGOT PASSWORD — request OTP
   ============================================================ */
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMsg('');

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);

    const fd = new FormData(forgotForm);
    const identifier = fd.get('identifier').trim();

    try {
      const res = await fetch(apiURL('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.msg || 'Failed to send OTP');
        setLoading(btn, false);
        return;
      }

      showMsg('OTP sent! Redirecting...', true);
      setTimeout(() => {
        location.href = `reset-password.html?identifier=${encodeURIComponent(identifier)}`;
      }, 900);
    } catch (err) {
      showMsg('Server error: ' + err.message);
      setLoading(btn, false);
    }
  });
}

/* ============================================================
   RESET PASSWORD — verify OTP + set new password
   ============================================================ */
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  // Prefill identifier from URL (?identifier=...)
  const params = new URLSearchParams(location.search);
  const prefilled = params.get('identifier');
  if (prefilled) {
    const input = document.getElementById('identifier');
    if (input) input.value = prefilled;
  }

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMsg('');

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);

    const fd = new FormData(resetForm);
    const body = {
      identifier: fd.get('identifier').trim(),
      otp: fd.get('otp').trim(),
      newPassword: fd.get('newPassword')
    };

    try {
      const res = await fetch(apiURL('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.msg || 'Reset failed');
        setLoading(btn, false);
        return;
      }

      showMsg('Password updated! Redirecting to sign in...', true);
      setTimeout(() => (location.href = 'login.html'), 1200);
    } catch (err) {
      showMsg('Server error: ' + err.message);
      setLoading(btn, false);
    }
  });
}