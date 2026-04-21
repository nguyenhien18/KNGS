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

  const listEl = document.getElementById('enrollmentsList');
  const countEl = document.getElementById('enrollmentsCountText');
  const statusFilterSelect = document.getElementById('enrollmentStatusFilterSelect');
  const applyFilterButton = document.getElementById('applyEnrollmentFilterButton');

  let allRows = [];
  let currentStatus = 'ALL';

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
    return d.toLocaleString('vi-VN');
  }

  function normalizeStatus(raw) {
    const s = String(raw || 'PENDING');
    if (s === 'ACCEPTED') return 'ACCEPTED';
    if (s === 'PENDING') return 'PENDING';
    return 'CANCELLED';
  }

  function statusMeta(status) {
    const map = {
      PENDING: { text: 'Đang chờ', badgeClass: 'badge-warning' },
      ACCEPTED: { text: 'Được chấp nhận', badgeClass: 'badge-success' },
      CANCELLED: { text: 'Đã hủy', badgeClass: 'badge-gray' }
    };
    return map[status] || map.CANCELLED;
  }

  function helperText(status) {
    if (status === 'PENDING') return 'Đơn đăng ký đang chờ gia sư xác nhận.';
    if (status === 'ACCEPTED') return 'Đơn đăng ký đã được chấp nhận. Bấm "Xem lớp học" để chuyển sang quản lý lớp học.';
    return 'Đơn đăng ký đã kết thúc hoặc bị hủy.';
  }

  function filterRows(rows) {
    const base = rows.filter(function (item) {
      const n = normalizeStatus(item.status);
      return n === 'PENDING' || n === 'ACCEPTED' || n === 'CANCELLED';
    });

    if (currentStatus === 'ALL') return base;
    return base.filter(function (item) {
      return normalizeStatus(item.status) === currentStatus;
    });
  }

  async function cancelEnrollment(id) {
    if (!confirm('Hủy đơn đăng ký này?')) return;
    await ApiClient.patch('/api/learner/enrollments/' + encodeURIComponent(id) + '/cancel', {});
    await load();
  }

  function classLinkByCourseId(courseId) {
    return '/hoc-vien/my-classes.html?source=COURSE&courseId=' + encodeURIComponent(courseId || '');
  }

  function render() {
    const rows = filterRows(allRows);
    if (countEl) countEl.textContent = rows.length + ' đăng ký';

    if (!rows.length) {
      listEl.innerHTML = '<div class="mini-item"><h4>Không có đăng ký</h4><p>Không có dữ liệu ở bộ lọc hiện tại.</p></div>';
      return;
    }

    listEl.innerHTML = rows.map(function (e) {
      const normalized = normalizeStatus(e.status);
      const meta = statusMeta(normalized);
      const canCancel = normalized === 'PENDING';
      const canViewClass = normalized === 'ACCEPTED';

      return '' +
        '<article class="list-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-primary">Khóa #' + safe(e.courseId || '-') + '</span>' +
            '<span class="badge ' + meta.badgeClass + '">' + meta.text + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + safe(e.courseTitle || ('Đăng ký khóa #' + (e.courseId || '-'))) + '</h3>' +
          '<p class="muted">Gia sư: ' + safe(e.tutorName || '---') + '</p>' +
          '<div class="info-grid">' +
            '<div class="info-box"><strong>Phí đề xuất</strong><span>' + (e.agreedFee ? formatVND(e.agreedFee) : 'Thỏa thuận') + '</span></div>' +
            '<div class="info-box"><strong>Ngày đăng ký</strong><span>' + formatDate(e.createdAt) + '</span></div>' +
            '<div class="info-box"><strong>Lời nhắn</strong><span>' + safe(e.message || '(không có)') + '</span></div>' +
            '<div class="info-box"><strong>Trạng thái</strong><span>' + meta.text + '</span></div>' +
          '</div>' +
          '<div class="card-actions">' +
            '<span class="muted">' + helperText(normalized) + '</span>' +
            '<div class="manage-action-group">' +
              (canViewClass ? '<a class="btn btn-soft" href="' + classLinkByCourseId(e.courseId) + '">Xem lớp học</a>' : '') +
              (canCancel ? '<button class="btn btn-outline" data-cancel="' + safe(e.enrollmentId) + '">Hủy đơn</button>' : '') +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    listEl.querySelectorAll('button[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cancelEnrollment(btn.getAttribute('data-cancel'));
      });
    });
  }

  async function load() {
    try {
      allRows = await ApiClient.get('/api/learner/enrollments');
      if (!Array.isArray(allRows)) allRows = [];
      render();
    } catch (err) {
      if (countEl) countEl.textContent = 'Không tải được dữ liệu';
      listEl.innerHTML = '<div class="mini-item"><h4>Lỗi</h4><p>' + safe(err.message || 'Không tải được đăng ký') + '</p></div>';
    }
  }

  if (statusFilterSelect) statusFilterSelect.value = currentStatus;
  if (applyFilterButton) {
    applyFilterButton.addEventListener('click', function () {
      currentStatus = statusFilterSelect ? (statusFilterSelect.value || 'ALL') : 'ALL';
      render();
    });
  }

  load();
})();
