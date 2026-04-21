let activeRole = 'learner';
const API_BASE = window.API_BASE || ((window.location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '8087')) ? 'http://localhost:8087' : '');

function normalize(v) {
  return String(v || '').trim();
}

function setRole(role) {
  activeRole = role;
  document.getElementById('roleLearner').classList.toggle('active', role === 'learner');
  document.getElementById('roleTutor').classList.toggle('active', role === 'tutor');
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('loginCard').style.display = isLogin ? 'block' : 'none';
  document.getElementById('registerCard').style.display = isLogin ? 'none' : 'block';
}

function togglePwd(inputId, iconEl) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
  iconEl.textContent = input.type === 'password' ? '👁' : '🙈';
}

function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const span = el.querySelector('span') || el;
  span.textContent = msg;
  el.classList.add('show');
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function saveAuth(res) {
  localStorage.setItem('accessToken', res.accessToken || '');
  localStorage.setItem('currentUser', JSON.stringify({
    userId: res.userId,
    role: res.role,
    fullName: res.fullName,
    email: res.email,
    tutorId: res.tutorId || null
  }));
}

function resolveRedirectUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('returnTo') || '/index.html';
}

async function request(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let msg = 'Yêu cầu thất bại';
    try {
      const d = await res.json();
      msg = d.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) return null;

  const data = await res.json();
  if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'result')) {
    return data.result;
  }
  return data;
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlert('loginAlert');

  const email = normalize(document.getElementById('loginEmail').value);
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAlert('loginAlert', 'Vui lòng nhập email và mật khẩu.');
    return;
  }

  try {
    const res = await request('/api/auth/login', { email, password });
    saveAuth(res);
    location.href = resolveRedirectUrl();
  } catch (err) {
    showAlert('loginAlert', err.message || 'Đăng nhập thất bại.');
  }
}

function buildRegisterPayload() {
  const fullName = normalize(document.getElementById('regName').value);
  const email = normalize(document.getElementById('regEmail').value);
  const phone = normalize(document.getElementById('regPhone').value);
  const birthDate = document.getElementById('regBirth').value || null;
  const gender = document.getElementById('regGender').value || 'OTHER';
  const password = document.getElementById('regPassword').value;
  const passwordConfirm = document.getElementById('regPasswordConfirm').value;
  const agree = document.getElementById('regAgree').checked;

  if (!fullName || !email || !password) throw new Error('Vui lòng nhập đủ họ tên, email, mật khẩu.');
  if (password.length < 8) throw new Error('Mật khẩu phải từ 8 ký tự trở lên.');
  if (password !== passwordConfirm) throw new Error('Mật khẩu xác nhận không khớp.');
  if (!agree) throw new Error('Bạn cần đồng ý điều khoản sử dụng.');

  if (activeRole === 'tutor') {
    return {
      path: '/api/auth/register-tutor',
      body: {
        email,
        password,
        fullName,
        phone: phone || null,
        gender,
        address: null
      }
    };
  }

  return {
    path: '/api/auth/register-learner',
    body: {
      email,
      password,
      fullName,
      phone: phone || null,
      birthDate,
      gender,
      address: null
    }
  };
}

async function handleRegister(e) {
  e.preventDefault();
  hideAlert('registerAlert');
  hideAlert('registerSuccess');

  try {
    const payload = buildRegisterPayload();
    const res = await request(payload.path, payload.body);

    if (activeRole === 'learner' && res && res.accessToken) {
      saveAuth(res);
      showAlert('registerSuccess', 'Đăng ký thành công! Đang chuyển về trang chủ...');
      setTimeout(() => {
        location.href = '/index.html';
      }, 1200);
      return;
    }

    showAlert('registerSuccess', 'Đăng ký thành công! Mời bạn đăng nhập.');
    setTimeout(() => switchTab('login'), 900);
  } catch (err) {
    showAlert('registerAlert', err.message || 'Đăng ký thất bại.');
  }
}

(function init() {
  const params = new URLSearchParams(location.search);
  if (params.get('tab') === 'register') switchTab('register');
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
})();

window.setRole = setRole;
window.switchTab = switchTab;
window.togglePwd = togglePwd;
