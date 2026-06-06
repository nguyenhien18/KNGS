(function () {
  if (!AuthGuard.requireAdmin()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('notificationList');
  const markAllBtn = document.getElementById('markAllReadBtn');

  function dt(v) {
    if (!v) return '---';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return safe(v);
    return d.toLocaleString('vi-VN');
  }

  function render(rows) {
    if (!rows || !rows.length) {
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Không có thông báo</h4><p>Hiện tại bạn chưa có thông báo nào.</p></div>');
      return;
    }
    DomUtils.setHtml(listEl, rows.map(function (n) {
      return '<div class="mini-item notification-feed-item ' + (n.isRead ? 'is-read' : 'is-unread') + '" data-notification-id="' + safe(n.id) + '" data-unread="' + (n.isRead ? '0' : '1') + '">' +
        '<div class="notification-feed-main"><h4>' + safe(n.title || 'Thông báo') + '</h4><p class="notification-message">' + safe(n.content || '') + '</p><p class="muted notification-time">' + dt(n.createdAt) + '</p></div>' +
        (n.isRead ? '' : '<span class="notification-unread-dot notification-feed-dot" title="Chưa đọc"></span>') +
        '</div>';
    }).join(''));
  }

  async function load() {
    try {
      const rows = ApiClient.asArray(await ApiClient.get('/api/notifications'));
      rows.sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
      render(rows);
    } catch (err) {
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Lỗi tải thông báo</h4><p>' + safe(err.message || 'Vui lòng thử lại') + '</p></div>');
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

  markAllBtn.addEventListener('click', async function () {
    try {
      await ApiClient.patch('/api/notifications/read-all', {});
      await load();
    } catch (err) {
      alert(safe(err.message || 'Không thể đánh dấu đã đọc tất cả.'));
    }
  });

  load();
})();
