(function () {
  function ensureAdmin() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'ADMIN') {
      alert('Ban can dang nhap tai khoan admin.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }

  if (!ensureAdmin()) return;

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
      listEl.innerHTML = '<div class="mini-item"><h4>Khong co thong bao</h4><p>Hien tai ban chua co thong bao nao.</p></div>';
      return;
    }
    listEl.innerHTML = rows.map(function (n) {
      return '<div class="mini-item notification-feed-item ' + (n.isRead ? 'is-read' : 'is-unread') + '" data-notification-id="' + safe(n.id) + '" data-unread="' + (n.isRead ? '0' : '1') + '">' +
        '<div class="notification-feed-main"><h4>' + safe(n.title || 'Thong bao') + '</h4><p style="margin-top:6px">' + safe(n.content || '') + '</p><p class="muted" style="margin-top:8px">' + dt(n.createdAt) + '</p></div>' +
        (n.isRead ? '' : '<span class="notification-unread-dot notification-feed-dot" title="Chua doc"></span>') +
        '</div>';
    }).join('');
  }

  async function load() {
    try {
      const rows = await ApiClient.get('/api/notifications');
      rows.sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
      render(rows);
    } catch (err) {
      listEl.innerHTML = '<div class="mini-item"><h4>Loi tai thong bao</h4><p>' + safe(err.message || 'Vui long thu lai') + '</p></div>';
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
      alert(safe(err.message || 'Khong the cap nhat thong bao.'));
    }
  });

  markAllBtn.addEventListener('click', async function () {
    try {
      await ApiClient.patch('/api/notifications/read-all', {});
      await load();
    } catch (err) {
      alert(safe(err.message || 'Khong the danh dau da doc tat ca.'));
    }
  });

  load();
})();
