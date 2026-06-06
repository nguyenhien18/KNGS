(function () {
  UiUtils.renderHeader();
  if (!AuthGuard.requireTutor()) return;

  const tabs = Array.from(document.querySelectorAll('#courseTabs .manage-tab'));
  const courseList = document.getElementById('courseList');
  let currentStatus = '';
  const paginationEl = UiUtils.ensurePaginationAfter(courseList, 'tutorCoursesPagination');
  let currentPage = 0;
  const pageSize = 10;
  let totalPages = 1;

  function statusBadge(status) {
    if (status === 'OPEN') return '<span class="badge badge-success">Đang mở</span>';
    if (status === 'IN_PROGRESS') return '<span class="badge badge-primary">Đang dạy</span>';
    if (status === 'COMPLETED') return '<span class="badge badge-gray">Hoàn thành</span>';
    if (status === 'CANCELLED') return '<span class="badge badge-danger">Đã hủy</span>';
    return '<span class="badge badge-gray">' + safe(status || '---') + '</span>';
  }

  function approvalBadge(status) {
    if (status === 'APPROVED') return '<span class="badge badge-success">Đã duyệt</span>';
    if (status === 'REJECTED') return '<span class="badge badge-danger">Bị từ chối</span>';
    return '<span class="badge badge-warning">Chờ duyệt</span>';
  }

  function modeText(v) {
    if (v === 'ONLINE') return 'Online';
    if (v === 'OFFLINE') return 'Offline';
    return 'Online/Offline';
  }

  function renderCourses(rows) {
    if (!rows || !rows.length) {
      DomUtils.setHtml(courseList, '<div class="mini-item"><h4>Không có dữ liệu</h4><p>Chưa có lớp/khóa học ở trạng thái này.</p></div>');
      UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; loadCourses(); });
      return;
    }

    DomUtils.setHtml(courseList, rows.map(function (c) {
      return '' +
        '<div class="course-card">' +
          '<div class="badge-row">' +
            approvalBadge(c.approvalStatus) +
            statusBadge(c.status) +
          '</div>' +
          '<div class="list-top">' +
            '<div>' +
              '<h3 class="card-title">' + safe(c.title || 'Lớp học') + '</h3>' +
              '<p class="muted">' + safe(c.subject || '---') + ' · ' + safe(c.grade || '---') + ' · ' + modeText(c.teachingMode) + ' · ' + safe([c.province, c.district].filter(Boolean).join(', ') || '---') + '</p>' +
              '<p class="muted">' + safe(c.description || 'Chưa có mô tả') + '</p>' +
            '</div>' +
            '<div class="price">' + (c.price ? formatVND(c.price) : 'Thỏa thuận') + '</div>' +
          '</div>' +
          '<div class="info-grid">' +
            '<div class="info-box"><strong>Khối lớp</strong><span>' + safe(c.grade || '---') + '</span></div>' +
            '<div class="info-box"><strong>Số chỗ tối đa</strong><span>' + safe(c.maxStudents || 0) + '</span></div>' +
            '<div class="info-box"><strong>Khu vực</strong><span>' + safe([c.province, c.district].filter(Boolean).join(', ') || '---') + '</span></div>' +
            '<div class="info-box"><strong>Lịch học</strong><span>' + safe(c.studyTime || '---') + '</span></div>' +
          '</div>' +
          '<div class="card-actions">' +
            '<span class="muted">Mã lớp: #' + safe(c.courseId) + '</span>' +
            '<button class="btn btn-soft" data-enroll="' + safe(c.courseId) + '">Xem đăng ký</button>' +
          '</div>' +
        '</div>';
    }).join(''));

    UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; loadCourses(); });

    courseList.querySelectorAll('button[data-enroll]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const id = btn.getAttribute('data-enroll');
        try {
          const enrollments = ApiClient.asArray(await ApiClient.get('/api/tutor/courses/' + encodeURIComponent(id) + '/enrollments'));
          alert('Lớp #' + id + ' có ' + enrollments.length + ' đăng ký.');
        } catch (err) {
          alert(err.message || 'Không tải được danh sách đăng ký.');
        }
      });
    });
  }

  async function loadCourses() {
    try {
      const query = currentStatus ? { status: currentStatus, page: currentPage, size: pageSize } : { page: currentPage, size: pageSize };
      const page = await ApiClient.get('/api/tutor/courses', query);
      const info = UiUtils.pageInfo(page);
      currentPage = info.page;
      totalPages = info.totalPages;
      renderCourses(info.content);
    } catch (err) {
      UiUtils.renderSimplePagination(paginationEl, { page: 0, totalPages: 1 }, function () {});
      DomUtils.setHtml(courseList, '<div class="mini-item"><h4>Lỗi tải dữ liệu</h4><p>' + safe(err.message || 'Vui lòng thử lại sau') + '</p></div>');
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentStatus = tab.getAttribute('data-status') || '';
      currentPage = 0;
      loadCourses();
    });
  });

  loadCourses();
})();
