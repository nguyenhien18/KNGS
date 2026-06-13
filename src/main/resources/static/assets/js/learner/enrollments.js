(function () {
  if (!AuthGuard.requireLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('enrollmentsList');
  const countEl = document.getElementById('enrollmentsCountText');
  const statusFilterSelect = document.getElementById('enrollmentStatusFilterSelect');
  const applyFilterButton = document.getElementById('applyEnrollmentFilterButton');

  let allRows = [];
  let currentStatus = 'ALL';
  const paginationEl = UiUtils.ensurePaginationAfter(listEl, 'learnerEnrollmentsPagination');
  let currentPage = 0;
  const pageSize = 10;
  let totalPages = 1;
  let totalElements = 0;
  const knownStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

  function normalizeStatus(raw) {
    const s = String(raw || 'PENDING');
    return knownStatuses.indexOf(s) >= 0 ? s : 'PENDING';
  }

  function statusMeta(status) {
    const map = {
      PENDING: { text: 'Đang chờ', badgeClass: 'badge-warning' },
      ACCEPTED: { text: 'Được chấp nhận', badgeClass: 'badge-success' },
      REJECTED: { text: 'Bị từ chối', badgeClass: 'badge-danger' },
      COMPLETED: { text: 'Đã hoàn thành', badgeClass: 'badge-success' },
      CANCELLED: { text: 'Đã hủy', badgeClass: 'badge-gray' }
    };
    return map[status] || map.PENDING;
  }

  function helperText(status) {
    if (status === 'PENDING') return 'Đơn đăng ký đang chờ gia sư xác nhận.';
    if (status === 'ACCEPTED') return 'Đơn đăng ký đã được chấp nhận. Bấm "Xem lớp học" để chuyển sang quản lý lớp học.';
    if (status === 'REJECTED') return 'Đăng ký đã bị gia sư từ chối.';
    if (status === 'COMPLETED') return 'Lớp học đã hoàn thành.';
    return 'Đăng ký đã được hủy.';
  }

  function filterRows(rows) {
    const base = rows.filter(function (item) {
      return knownStatuses.indexOf(normalizeStatus(item.status)) >= 0;
    });

    if (currentStatus === 'ALL') return base;
    return base.filter(function (item) {
      return normalizeStatus(item.status) === currentStatus;
    });
  }

  function pageRows(rows) {
    totalElements = rows.length;
    totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    const start = currentPage * pageSize;
    return rows.slice(start, start + pageSize);
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
    const filteredRows = filterRows(allRows);
    const rows = pageRows(filteredRows);
    if (countEl) countEl.textContent = totalElements + ' đăng ký';

    if (!rows.length) {
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Không có đăng ký</h4><p>Không có dữ liệu ở bộ lọc hiện tại.</p></div>');
      UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; render(); });
      return;
    }

    DomUtils.setHtml(listEl, rows.map(function (e) {
      const normalized = normalizeStatus(e.status);
      const meta = statusMeta(normalized);
      const canCancel = normalized === 'PENDING';
      const canViewClass = normalized === 'ACCEPTED' || normalized === 'COMPLETED';

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
    }).join(''));

    UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; render(); });

    listEl.querySelectorAll('button[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cancelEnrollment(btn.getAttribute('data-cancel'));
      });
    });
  }

  async function load() {
    try {
      allRows = await ApiClient.getAll('/api/learner/enrollments', { size: pageSize });
      render();
    } catch (err) {
      if (countEl) countEl.textContent = 'Không tải được dữ liệu';
      UiUtils.renderSimplePagination(paginationEl, { page: 0, totalPages: 1 }, function () {});
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Lỗi</h4><p>' + safe(err.message || 'Không tải được đăng ký') + '</p></div>');
    }
  }

  if (statusFilterSelect) statusFilterSelect.value = currentStatus;
  if (applyFilterButton) {
    applyFilterButton.addEventListener('click', function () {
      currentStatus = statusFilterSelect ? (statusFilterSelect.value || 'ALL') : 'ALL';
      currentPage = 0;
      load();
    });
  }

  load();
})();
