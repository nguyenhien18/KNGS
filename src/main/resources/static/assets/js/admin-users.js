(function () {
  function ensureAdmin() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'ADMIN') {
      alert('Bạn cần đăng nhập tài khoản admin.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }

  if (!ensureAdmin()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('usersList');
  const usersCountText = document.getElementById('usersCountText');
  const roleFilter = document.getElementById('roleFilter');
  const statusFilter = document.getElementById('statusFilter');
  const filterBtn = document.getElementById('filterBtn');

  function safe(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalizeStatus(status) {
    return String(status || '').toUpperCase() === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE';
  }

  function statusBadgeClass(status) {
    return normalizeStatus(status) === 'BLOCKED' ? 'badge-danger' : 'badge-success';
  }
  function statusText(status) {
    return normalizeStatus(status) === 'BLOCKED' ? 'Đã khóa' : 'Đang hoạt động';
  }

  async function changeStatus(userId, status) {
    await ApiClient.patch('/api/admin/users/' + encodeURIComponent(userId) + '/status', { status: status });
    await load();
  }

  async function load() {
    try {
      const query = {
        role: roleFilter.value || undefined,
        status: statusFilter.value || undefined
      };
      const rows = await ApiClient.get('/api/admin/users', query);

      if (!rows || !rows.length) {
        if (usersCountText) usersCountText.textContent = '0 tài khoản phù hợp bộ lọc';
        listEl.innerHTML = '<div class="mini-item"><h4>Không có dữ liệu</h4><p>Không tìm thấy tài khoản phù hợp bộ lọc.</p></div>';
        return;
      }

      if (usersCountText) usersCountText.textContent = rows.length + ' tài khoản';
      listEl.innerHTML = rows.map(function (u) {
        const id = safe(u.id || '-');
        const role = safe(String(u.role || 'USER').toUpperCase());
        const status = normalizeStatus(u.status);
        const nextStatus = status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        const fullName = safe(u.fullName || 'Người dùng');
        const email = safe(u.email || '---');
        const phone = safe(u.phone || '---');

        return '<article class="list-card user-card">' +
          '<div class="user-main">' +
            '<div class="user-headline">' +
              '<span class="badge badge-gray">' + role + '</span>' +
              '<span class="badge ' + statusBadgeClass(status) + '">' + statusText(status) + '</span>' +
            '</div>' +
            '<h3 class="user-name">' + fullName + '</h3>' +
            '<p class="user-email">' + email + '</p>' +
            '<div class="user-meta">' +
              '<span><b>SĐT:</b> ' + phone + '</span>' +
              '<span><b>ID:</b> ' + id + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn-outline user-action" data-status="' + nextStatus + '" data-id="' + id + '">' + (nextStatus === 'BLOCKED' ? 'Khóa tài khoản' : 'Mở khóa') + '</button>' +
        '</article>';
      }).join('');

      listEl.querySelectorAll('button[data-status][data-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          changeStatus(btn.getAttribute('data-id'), btn.getAttribute('data-status'));
        });
      });
    } catch (err) {
      if (usersCountText) usersCountText.textContent = 'Không tải được danh sách';
      listEl.innerHTML = '<div class="mini-item"><h4>Lỗi</h4><p>' + (err.message || 'Không tải được danh sách người dùng') + '</p></div>';
    }
  }

  filterBtn.addEventListener('click', load);
  load();
})();
