(function () {
  function ensureLearner() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'LEARNER') {
      alert('Ban can dang nhap tai khoan hoc vien.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }

  if (!ensureLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') headerRight.innerHTML = renderUtilityHeaderRight();
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('classesList');
  const countEl = document.getElementById('classesCountText');
  const tabs = Array.from(document.querySelectorAll('#classTabs .manage-tab'));

  let allRows = [];
  let currentFilter = 'ALL';

  function safe(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatDate(value) {
    if (!value) return '---';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safe(value);
    return d.toLocaleDateString('vi-VN');
  }

  function statusMeta(status) {
    const map = {
      ASSIGNED: { text: 'Cho bat dau', badgeClass: 'badge-warning' },
      IN_PROGRESS: { text: 'Dang hoc', badgeClass: 'badge-primary' },
      COMPLETED: { text: 'Da hoan thanh', badgeClass: 'badge-success' },
      CANCELLED: { text: 'Da huy', badgeClass: 'badge-danger' }
    };
    return map[String(status || 'ASSIGNED')] || map.ASSIGNED;
  }

  function filterRows(rows) {
    if (currentFilter === 'ALL') return rows;
    if (currentFilter === 'ACTIVE') {
      return rows.filter(function (item) {
        const s = String(item.status || 'ASSIGNED');
        return s === 'ASSIGNED' || s === 'IN_PROGRESS';
      });
    }
    if (currentFilter === 'COMPLETED') {
      return rows.filter(function (item) {
        return String(item.status || '') === 'COMPLETED';
      });
    }
    return rows;
  }

  function helperText(status) {
    if (status === 'ASSIGNED') return 'Lop da ghep gia su, chua bat dau buoi hoc dau tien.';
    if (status === 'IN_PROGRESS') return 'Lop dang trong qua trinh hoc. Co the danh dau hoan thanh khi ket thuc.';
    if (status === 'COMPLETED') return 'Lop da hoan thanh. Ban co the de lai danh gia gia su.';
    return 'Lop da duoc huy.';
  }

  function actions(row) {
    const id = safe(row.classId || '-');
    const status = String(row.status || 'ASSIGNED');
    if (status === 'ASSIGNED') {
      return '<button class="btn btn-outline" data-status="IN_PROGRESS" data-id="' + id + '">Bat dau hoc</button>' +
        '<button class="btn btn-outline" data-status="CANCELLED" data-id="' + id + '">Huy lop</button>';
    }
    if (status === 'IN_PROGRESS') {
      return '<button class="btn btn-primary" data-status="COMPLETED" data-id="' + id + '">Hoan thanh</button>' +
        '<button class="btn btn-outline" data-status="CANCELLED" data-id="' + id + '">Huy lop</button>';
    }
    return '<a class="btn btn-soft" href="/hoc-vien/learner-notifications.html">Xem thong bao</a>';
  }

  async function updateStatus(id, status) {
    let message = 'Cap nhat trang thai lop?';
    if (status === 'IN_PROGRESS') message = 'Xac nhan bat dau lop hoc nay?';
    if (status === 'COMPLETED') message = 'Xac nhan lop da hoan thanh?';
    if (status === 'CANCELLED') message = 'Ban chac chan muon huy lop nay?';
    if (!confirm(message)) return;

    await ApiClient.patch('/api/learner/classes/' + encodeURIComponent(id) + '/status', { status: status });
    await load();
  }

  function render() {
    const rows = filterRows(allRows);
    if (countEl) countEl.textContent = rows.length + ' lop';

    if (!rows.length) {
      const emptyText = currentFilter === 'ACTIVE'
        ? 'Khong co lop dang hoc.'
        : currentFilter === 'COMPLETED'
          ? 'Khong co lop da hoan thanh.'
          : 'Ban chua co lop nao duoc ghep.';
      listEl.innerHTML = '<div class="mini-item"><h4>Khong co lop</h4><p>' + emptyText + '</p></div>';
      return;
    }

    listEl.innerHTML = rows.map(function (c) {
      const meta = statusMeta(c.status);
      return '' +
        '<article class="list-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-primary">Lop 1-1</span>' +
            '<span class="badge ' + meta.badgeClass + '">' + meta.text + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + safe(c.postTitle || 'Lop hoc da ghep') + '</h3>' +
          '<p class="muted">Gia su: ' + safe(c.tutorName || '---') + ' • ' + safe(c.tutorPhone || c.tutorEmail || 'Chua co thong tin') + '</p>' +
          '<div class="info-grid">' +
            '<div class="info-box"><strong>Ma lop</strong><span>#' + safe(c.classId || '-') + '</span></div>' +
            '<div class="info-box"><strong>Ngay bat dau</strong><span>' + formatDate(c.startDate || c.assignedAt) + '</span></div>' +
            '<div class="info-box"><strong>Ngay ket thuc</strong><span>' + formatDate(c.endDate) + '</span></div>' +
            '<div class="info-box"><strong>Trang thai</strong><span>' + meta.text + '</span></div>' +
          '</div>' +
          '<div class="card-actions">' +
            '<span class="muted">' + helperText(String(c.status || 'ASSIGNED')) + '</span>' +
            '<div class="manage-action-group">' + actions(c) + '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    listEl.querySelectorAll('button[data-status][data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateStatus(btn.getAttribute('data-id'), btn.getAttribute('data-status'));
      });
    });
  }

  async function load() {
    try {
      allRows = await ApiClient.get('/api/learner/classes');
      if (!Array.isArray(allRows)) allRows = [];
      render();
    } catch (err) {
      if (countEl) countEl.textContent = 'Khong tai duoc du lieu';
      listEl.innerHTML = '<div class="mini-item"><h4>Loi</h4><p>' + safe(err.message || 'Khong tai duoc du lieu lop') + '</p></div>';
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter') || 'ALL';
      render();
    });
  });

  load();
})();
