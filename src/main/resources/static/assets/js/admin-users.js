(function () {
  if (!AuthGuard.requireAdmin()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('usersList');
  const usersCountText = document.getElementById('usersCountText');
  const roleFilter = document.getElementById('roleFilter');
  const statusFilter = document.getElementById('statusFilter');
  const filterBtn = document.getElementById('filterBtn');

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
      const page = await ApiClient.get('/api/admin/users', query);
      const rows = ApiClient.asArray(page);

      if (!rows || !rows.length) {
        if (usersCountText) usersCountText.textContent = '0 tài khoản phù hợp bộ lọc';
        DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Không có dữ liệu</h4><p>Không tìm thấy tài khoản phù hợp bộ lọc.</p></div>');
        return;
      }

      if (usersCountText) usersCountText.textContent = (page && page.totalElements != null ? page.totalElements : rows.length) + ' tài khoản';
      DomUtils.setHtml(listEl, rows.map(function (u) {
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
      }).join(''));

      listEl.querySelectorAll('button[data-status][data-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          changeStatus(btn.getAttribute('data-id'), btn.getAttribute('data-status'));
        });
      });
    } catch (err) {
      if (usersCountText) usersCountText.textContent = 'Không tải được danh sách';
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Lỗi</h4><p>' + safe(err.message || 'Không tải được danh sách người dùng') + '</p></div>');
    }
  }

  filterBtn.addEventListener('click', load);
  load();
})();
