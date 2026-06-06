(function () {
  if (!AuthGuard.requireLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('classesList');
  const countEl = document.getElementById('classesCountText');
  const tabs = Array.from(document.querySelectorAll('#classTabs .manage-tab'));

  let allRows = [];
  let currentFilter = 'ALL';

  function statusMeta(status) {
    const map = {
      ASSIGNED: { text: 'Cho bắt đầu', badgeClass: 'badge-warning' },
      IN_PROGRESS: { text: 'Đang học', badgeClass: 'badge-primary' },
      COMPLETION_REQUESTED: { text: 'Cho xác nhận hoàn thành', badgeClass: 'badge-warning' },
      COMPLETED: { text: 'Đã hoàn thành', badgeClass: 'badge-success' },
      CANCELLATION_REQUESTED: { text: 'Chờ xác nhận hủy', badgeClass: 'badge-warning' },
      CANCELLED: { text: 'Đã hủy', badgeClass: 'badge-danger' }
    };
    return map[String(status || 'ASSIGNED')] || map.ASSIGNED;
  }

  function filterRows(rows) {
    if (currentFilter === 'ALL') return rows;
    if (currentFilter === 'ACTIVE') {
      return rows.filter(function (item) {
        const s = String(item.status || 'ASSIGNED');
        return s === 'ASSIGNED' || s === 'IN_PROGRESS'
          || s === 'COMPLETION_REQUESTED' || s === 'CANCELLATION_REQUESTED';
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
    if (status === 'ASSIGNED') return 'Lớp đã ghép gia sư, chưa bắt đầu buổi học đầu tiên.';
    if (status === 'IN_PROGRESS') return 'Lớp đang trong quá trình học. Có thể đánh dấu hoàn thành khi kết thúc.';
    if (status === 'COMPLETION_REQUESTED') return 'Một bên đã yêu cầu hoàn thành lớp. Cần bên còn lại xác nhận.';
    if (status === 'CANCELLATION_REQUESTED') return 'Một bên đã yêu cầu hủy lớp. Cần bên còn lại xác nhận.';
    if (status === 'COMPLETED') return 'Lớp đã hoàn thành. Bạn có thể để lại đánh giá gia sư.';
    return 'Lớp đã được hủy.';
  }

  function actions(row) {
    const id = safe(row.classId || '-');
    const status = String(row.status || 'ASSIGNED');
    if (status === 'ASSIGNED') {
      return '<button class="btn btn-outline" data-status="IN_PROGRESS" data-id="' + id + '">Bắt đầu học</button>' +
        '<button class="btn btn-outline" data-status="CANCELLED" data-current-status="' + safe(status) + '" data-id="' + id + '">Yêu cầu hủy lớp</button>';
    }
    if (status === 'IN_PROGRESS') {
      return '<button class="btn btn-primary" data-status="COMPLETED" data-current-status="' + safe(status) + '" data-id="' + id + '">Yêu cầu hoàn thành</button>' +
        '<button class="btn btn-outline" data-status="CANCELLED" data-current-status="' + safe(status) + '" data-id="' + id + '">Yêu cầu hủy lớp</button>';
    }
    if (status === 'COMPLETION_REQUESTED') {
      if (row.waitingForMyConfirmation) {
        return '<button class="btn btn-primary" data-status="COMPLETED" data-current-status="' + safe(status) + '" data-id="' + id + '">Xác nhận hoàn thành</button>';
      }
      return '<span class="muted">Đang chờ gia sư xác nhận hoàn thành</span>';
    }
    if (status === 'CANCELLATION_REQUESTED') {
      if (row.waitingForMyConfirmation) {
        return '<button class="btn btn-outline" data-status="CANCELLED" data-current-status="' + safe(status) + '" data-id="' + id + '">Xác nhận hủy</button>';
      }
      return '<span class="muted">Đang chờ gia sư xác nhận hủy</span>';
    }
    return '<a class="btn btn-soft" href="/hoc-vien/learner-notifications.html">Xem thông báo</a>';
  }

  async function updateStatus(id, status, currentStatus) {
    let message = 'Cập nhật trạng thái lớp?';
    if (status === 'IN_PROGRESS') message = 'Xác nhận bắt đầu lớp học này?';
    if (status === 'COMPLETED') {
      message = currentStatus === 'COMPLETION_REQUESTED'
        ? 'Xác nhận lớp đã hoàn thành?'
        : 'Gửi yêu cầu hoàn thành lớp nay?';
    }
    if (status === 'CANCELLED') {
      message = currentStatus === 'CANCELLATION_REQUESTED'
        ? 'Xác nhận hủy lớp này?'
        : 'Gửi yêu cầu hủy lớp này?';
    }
    if (!confirm(message)) return;

    await ApiClient.patch('/api/learner/classes/' + encodeURIComponent(id) + '/status', { status: status });
    await load();
  }

  function render() {
    const rows = filterRows(allRows);
    if (countEl) countEl.textContent = rows.length + ' lớp';

    if (!rows.length) {
      const emptyText = currentFilter === 'ACTIVE'
        ? 'Không có lớp đang học.'
        : currentFilter === 'COMPLETED'
          ? 'Không có lớp đã hoàn thành.'
          : 'Bạn chưa có lớp nào được ghép.';
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Không có lớp</h4><p>' + emptyText + '</p></div>');
      return;
    }

    DomUtils.setHtml(listEl, rows.map(function (c) {
      const meta = statusMeta(c.status);
      return '' +
        '<article class="list-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-primary">Lớp 1-1</span>' +
            '<span class="badge ' + meta.badgeClass + '">' + meta.text + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + safe(c.postTitle || 'Lớp học đã ghép') + '</h3>' +
          '<p class="muted">Gia sư: ' + safe(c.tutorName || '---') + ' • ' + safe(c.tutorPhone || c.tutorEmail || 'Chưa có thông tin') + '</p>' +
          '<div class="info-grid">' +
            '<div class="info-box"><strong>Ma lớp</strong><span>#' + safe(c.classId || '-') + '</span></div>' +
            '<div class="info-box"><strong>Ngay bắt đầu</strong><span>' + formatDate(c.startDate || c.assignedAt) + '</span></div>' +
            '<div class="info-box"><strong>Ngay kết thúc</strong><span>' + formatDate(c.endDate) + '</span></div>' +
            '<div class="info-box"><strong>Trạng thái</strong><span>' + meta.text + '</span></div>' +
          '</div>' +
          '<div class="card-actions">' +
            '<span class="muted">' + helperText(String(c.status || 'ASSIGNED')) + '</span>' +
            '<div class="manage-action-group">' + actions(c) + '</div>' +
          '</div>' +
        '</article>';
    }).join(''));

    listEl.querySelectorAll('button[data-status][data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        UiUtils.withButtonLoading(btn, 'Đang xử lý...', function () {
          return updateStatus(
            btn.getAttribute('data-id'),
            btn.getAttribute('data-status'),
            btn.getAttribute('data-current-status') || ''
          );
        }).catch(function (err) {
          alert(err.message || 'Không cập nhật được trạng thái lớp.');
        });
      });
    });
  }

  async function load() {
    try {
      allRows = ApiClient.asArray(await ApiClient.get('/api/learner/classes'));
      render();
    } catch (err) {
      if (countEl) countEl.textContent = 'Không tải được dữ liệu';
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Lỗi</h4><p>' + safe(err.message || 'Không tải được dữ liệu lớp') + '</p></div>');
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
