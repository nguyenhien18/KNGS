(function () {
  const form = document.getElementById('tutorLoginForm');
  if (!form) return;

  const errorEl = document.getElementById('loginError');
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/gia-su/profile.html';

  if (window.ApiClient && ApiClient.getToken && ApiClient.getToken()) {
    location.href = returnTo;
    return;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await ApiClient.post('/api/auth/login', { email, password });
      if (res.role !== 'TUTOR') {
        showError('Tài khoản này không phải vai trò gia sư.');
        return;
      }
      ApiClient.setToken(res.accessToken);
      ApiClient.setCurrentUser({
        userId: res.userId,
        role: res.role,
        fullName: res.fullName,
        email: res.email,
        tutorId: res.tutorId || null
      });
      location.href = returnTo;
    } catch (err) {
      showError(err.message || 'Đăng nhập thất bại.');
    }
  });
})();
