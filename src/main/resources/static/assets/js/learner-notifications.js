(function () {
  function ensureLearner() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'LEARNER') {
      alert('Bạn cần đăng nhập tài khoản học viên.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname + location.search);
      return false;
    }
    return true;
  }

  if (!ensureLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') headerRight.innerHTML = renderUtilityHeaderRight();
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('notificationList');
  const markAllBtn = document.getElementById('markAllReadBtn');

  function safe(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function dt(v) {
    if (!v) return '---';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return safe(v);
    return d.toLocaleString('vi-VN');
  }

  function render(rows) {
    if (!rows || !rows.length) {
      listEl.innerHTML = '<div class="mini-item"><h4>Không có thông báo</h4><p>Hiện tại bạn chưa có thông báo nào.</p></div>';
      return;
    }

    listEl.innerHTML = rows.map(function (n) {
      return '<div class="mini-item notification-feed-item ' + (n.isRead ? 'is-read' : 'is-unread') + '" data-notification-id="' + safe(n.id) + '" data-unread="' + (n.isRead ? '0' : '1') + '">' +
        '<div class="notification-feed-main"><h4>' + safe(n.title || 'Thông báo') + '</h4>' +
        '<p style="margin-top:6px">' + safe(n.content || '') + '</p>' +
        '<span class="muted" style="margin-top:8px;display:inline-block">' + dt(n.createdAt) + '</span></div>' +
        (n.isRead ? '' : '<span class="notification-unread-dot notification-feed-dot" title="Chưa đọc"></span>') +
        '</div>';
    }).join('');
  }

  async function load() {
    try {
      const rows = await ApiClient.get('/api/notifications');
      rows.sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
      render(rows);
    } catch (err) {
      listEl.innerHTML = '<div class="mini-item"><h4>Lỗi tải thông báo</h4><p>' + safe(err.message || 'Vui lòng thử lại') + '</p></div>';
    }
  }

  listEl.addEventListener('click', async function (event) {
    const item = event.target.closest('[data-notification-id][data-unread="1"]');
    if (!item) return;
    const id = item.getAttribute('data-notification-id');
    if (!id) return;
    try {
      await ApiClient.patch('/api/notifications/' + encodeURIComponent(id) + '/read', {});
      await load();
    } catch (err) {
      alert(safe(err.message || 'Không thể cập nhật thông báo.'));
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener('click', async function () {
      try {
        await ApiClient.patch('/api/notifications/read-all', {});
        await load();
      } catch (err) {
        alert(safe(err.message || 'Không thể đánh dấu đã đọc tất cả.'));
      }
    });
  }

  load();
})();
