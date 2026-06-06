(function () {
  if (!AuthGuard.requireLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('postsList');
  const countEl = document.getElementById('postsCountText');
  const statusFilterSelect = document.getElementById('postStatusFilterSelect');
  const applyFilterButton = document.getElementById('applyPostFilterButton');

  const applicationsModal = document.getElementById('applicationsModal');
  const applicationsModalContent = document.getElementById('applicationsModalContent');
  const closeApplicationsModalButton = document.getElementById('closeApplicationsModalButton');

  let allRows = [];
  let currentFilter = 'ALL';
  let activePostId = null;
<<<<<<< HEAD
  const paginationEl = UiUtils.ensurePaginationAfter(listEl, 'learnerPostsPagination');
  let currentPage = 0;
  const pageSize = 10;
  let totalPages = 1;
  let totalElements = 0;
=======
>>>>>>> c0ad3c416d7d0f2655469575cb17f19e0b77f88b

  function modeText(value) {
    if (value === 'ONLINE') return 'Online';
    if (value === 'OFFLINE') return 'Offline';
    return 'Online/Offline';
  }

  function approvalBadgeClass(status) {
    if (status === 'APPROVED') return 'badge-success';
    if (status === 'REJECTED') return 'badge-danger';
    return 'badge-warning';
  }

  function approvalText(status) {
    if (status === 'APPROVED') return 'Đã duyệt';
    if (status === 'REJECTED') return 'Bị từ chối';
    return 'Chờ duyệt';
  }

  function postStatusClass(status) {
    if (status === 'OPEN') return 'badge-primary';
    if (status === 'CLOSED' || status === 'CANCELLED') return 'badge-gray';
    if (status === 'COMPLETED') return 'badge-success';
    return 'badge-gray';
  }

  function postStatusText(status) {
    if (status === 'OPEN') return 'Đang mở';
    if (status === 'CLOSED') return 'Đã đóng';
    if (status === 'CANCELLED') return 'Đã hủy';
    if (status === 'COMPLETED') return 'Đã hoàn thành';
    return safe(status || '---');
  }

  function helperText(post) {
    if (post.approvalStatus === 'PENDING') return 'Bài đăng đang được hệ thống xem xét.';
    if (post.approvalStatus === 'REJECTED') return 'Bạn có thể chỉnh sửa thông tin và tạo bài đăng mới.';
    if (post.status === 'CANCELLED') return 'Bài đăng đã được hủy.';
    if (post.status === 'CLOSED' || post.status === 'COMPLETED') return 'Bài đăng đã kết thúc.';
    return 'Đang chờ gia sư ứng tuyển vào bài đăng này.';
  }

  function canCancel(post) {
    return post.status !== 'COMPLETED' && post.status !== 'CLOSED' && post.status !== 'CANCELLED';
  }

  function canViewApplications(post) {
    return String(post.approvalStatus || '') === 'APPROVED';
  }

  function canViewClass(post) {
    return String(post.approvalStatus || '') === 'APPROVED';
  }

  function filterRows(rows) {
    if (currentFilter === 'ALL') return rows;
    if (currentFilter === 'CANCELLED') {
      return rows.filter(function (p) { return String(p.status || '') === 'CANCELLED'; });
    }
    return rows.filter(function (p) {
      return String(p.approvalStatus || 'PENDING') === currentFilter;
    });
  }

  async function cancelPost(id) {
    if (!confirm('Hủy bài đăng này?')) return;
    await ApiClient.patch('/api/learner/posts/' + encodeURIComponent(id) + '/cancel', {});
    await load();
  }

  function applicationStatusMeta(status) {
    const s = String(status || 'PENDING');
    if (s === 'ACCEPTED') return { text: 'Đã chấp nhận', cls: 'badge-success' };
    if (s === 'REJECTED') return { text: 'Đã từ chối', cls: 'badge-danger' };
    return { text: 'Đang chờ', cls: 'badge-warning' };
  }

  function renderApplications(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      DomUtils.setHtml(applicationsModalContent, '<div class="mini-item"><h4>Chưa có ứng tuyển</h4><p>Chưa có gia sư nào ứng tuyển vào bài đăng này.</p></div>');
      return;
    }

    DomUtils.setHtml(applicationsModalContent, list.map(function (a) {
      const meta = applicationStatusMeta(a.status);
      const canDecide = String(a.status || '') === 'PENDING';
      return '<div class="student-item student-item-spaced">' +
        '<div class="student-row student-row-start">' +
          '<div>' +
            '<h4>' + safe(a.tutorName || 'Gia sư') + '</h4>' +
            '<p>Email: ' + safe(a.tutorEmail || '---') + '</p>' +
            '<p>Số điện thoại: ' + safe(a.tutorPhone || '---') + '</p>' +
            '<p>Phí đề xuất: ' + (a.expectedFee ? formatVND(a.expectedFee) : 'Thỏa thuận') + '</p>' +
            '<p>Lời nhắn: ' + safe(a.message || '(không có)') + '</p>' +
            '<p>Trạng thái: <span class="badge ' + meta.cls + '">' + meta.text + '</span></p>' +
          '</div>' +
          '<div class="manage-action-group">' +
            (canDecide
              ? '<button class="btn btn-primary" data-decision="accept" data-app="' + safe(a.applicationId) + '">Chấp nhận</button><button class="btn btn-outline" data-decision="reject" data-app="' + safe(a.applicationId) + '">Từ chối</button>'
              : '<span class="badge ' + meta.cls + '">' + meta.text + '</span>') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join(''));
  }

  async function loadApplications(postId) {
    const rows = await ApiClient.get('/api/learner/posts/' + encodeURIComponent(postId) + '/applications');
    renderApplications(ApiClient.asArray(rows));
  }

  async function decideApplication(applicationId, accepted) {
    await ApiClient.patch('/api/learner/applications/' + encodeURIComponent(applicationId) + '/decision', { accepted: accepted });
    if (activePostId) {
      await loadApplications(activePostId);
    }
    await load();
  }

  function openApplications(postId) {
    activePostId = postId;
    loadApplications(postId)
      .then(function () { applicationsModal.classList.remove('hidden'); })
      .catch(function (err) {
        alert(err.message || 'Không tải được danh sách ứng tuyển.');
      });
  }

  function classLinkByPost(post) {
    return '/hoc-vien/my-classes.html?source=MATCHED&postId=' + encodeURIComponent(post.postId || '');
  }

  function render() {
    const rows = filterRows(allRows);
    if (countEl) countEl.textContent = totalElements + ' bài đăng';

    if (!rows.length) {
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Không có dữ liệu</h4><p>Không có bài đăng ở bộ lọc hiện tại.</p></div>');
<<<<<<< HEAD
      UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; load(); });
=======
>>>>>>> c0ad3c416d7d0f2655469575cb17f19e0b77f88b
      return;
    }

    DomUtils.setHtml(listEl, rows.map(function (p) {
      const approvalStatus = String(p.approvalStatus || 'PENDING');
      const postStatus = String(p.status || 'OPEN');
      return '' +
        '<article class="list-card">' +
          '<div class="badge-row">' +
            '<span class="badge ' + approvalBadgeClass(approvalStatus) + '">' + approvalText(approvalStatus) + '</span>' +
            '<span class="badge ' + postStatusClass(postStatus) + '">' + postStatusText(postStatus) + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + safe(p.title || 'Bài đăng') + '</h3>' +
          '<p class="muted">' + safe(p.subject || '---') + ' · ' + safe(p.grade || '---') + ' · ' + modeText(p.teachingMode) + ' · ' + safe(([p.province, p.district].filter(Boolean).join(' - ') || '---')) + '</p>' +
          '<p class="muted">' + safe(p.description || 'Không có mô tả') + '</p>' +
          (p.rejectedReason ? '<div class="notice-inline danger">Lý do từ chối: ' + safe(p.rejectedReason) + '</div>' : '') +
          '<div class="info-grid">' +
            '<div class="info-box"><strong>Ngân sách</strong><span>' + (p.budget ? formatVND(p.budget) + '/buổi' : 'Thỏa thuận') + '</span></div>' +
            '<div class="info-box"><strong>Hình thức</strong><span>' + modeText(p.teachingMode) + '</span></div>' +
            '<div class="info-box"><strong>Khu vực</strong><span>' + safe(([p.province, p.district].filter(Boolean).join(' - ') || '---')) + '</span></div>' +
            '<div class="info-box"><strong>Ngày tạo</strong><span>' + formatDate(p.createdAt) + '</span></div>' +
          '</div>' +
          '<div class="card-actions">' +
            '<span class="muted">' + helperText(p) + '</span>' +
            '<div class="manage-action-group">' +
              (canViewApplications(p) ? '<button class="btn btn-soft" data-apps="' + safe(p.postId) + '">Xem danh sách ứng tuyển</button>' : '') +
              (canViewClass(p) ? '<a class="btn btn-soft" href="' + classLinkByPost(p) + '">Xem lớp học</a>' : '') +
              (canCancel(p) ? '<button class="btn btn-outline" data-cancel="' + safe(p.postId) + '">Hủy bài đăng</button>' : '') +
            '</div>' +
          '</div>' +
        '</article>';
    }).join(''));
<<<<<<< HEAD

    UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; load(); });
=======
>>>>>>> c0ad3c416d7d0f2655469575cb17f19e0b77f88b

    listEl.querySelectorAll('button[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cancelPost(btn.getAttribute('data-cancel'));
      });
    });

    listEl.querySelectorAll('button[data-apps]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openApplications(btn.getAttribute('data-apps'));
      });
    });
  }

  async function load() {
    try {
<<<<<<< HEAD
      const query = { page: currentPage, size: pageSize };
      if (currentFilter !== 'ALL' && currentFilter !== 'CANCELLED') query.approvalStatus = currentFilter;
      const page = await ApiClient.get('/api/learner/posts', query);
      const info = UiUtils.pageInfo(page);
      allRows = info.content;
      currentPage = info.page;
      totalPages = info.totalPages;
      totalElements = info.totalElements;
      render();
    } catch (err) {
      if (countEl) countEl.textContent = 'Không tải được dữ liệu';
      UiUtils.renderSimplePagination(paginationEl, { page: 0, totalPages: 1 }, function () {});
=======
      allRows = ApiClient.asArray(await ApiClient.get('/api/learner/posts'));
      render();
    } catch (err) {
      if (countEl) countEl.textContent = 'Không tải được dữ liệu';
>>>>>>> c0ad3c416d7d0f2655469575cb17f19e0b77f88b
      DomUtils.setHtml(listEl, '<div class="mini-item"><h4>Lỗi tải dữ liệu</h4><p>' + safe(err.message || 'Vui lòng thử lại') + '</p></div>');
    }
  }

  if (applicationsModalContent) {
    applicationsModalContent.addEventListener('click', async function (e) {
      const btn = e.target.closest('button[data-decision][data-app]');
      if (!btn) return;
      const appId = btn.getAttribute('data-app');
      const accepted = btn.getAttribute('data-decision') === 'accept';
      try {
        await decideApplication(appId, accepted);
      } catch (err) {
        alert(err.message || 'Không cập nhật được trạng thái ứng tuyển.');
      }
    });
  }

  if (closeApplicationsModalButton) {
    closeApplicationsModalButton.onclick = function () { applicationsModal.classList.add('hidden'); };
  }
  if (applicationsModal) {
    applicationsModal.addEventListener('click', function (e) {
      if (e.target === applicationsModal) applicationsModal.classList.add('hidden');
    });
  }

  if (statusFilterSelect) statusFilterSelect.value = currentFilter;
  if (applyFilterButton) {
    applyFilterButton.addEventListener('click', function () {
      currentFilter = statusFilterSelect ? (statusFilterSelect.value || 'ALL') : 'ALL';
      currentPage = 0;
      load();
    });
  }

  load();
})();
