(function () {
  UiUtils.renderHeader();

  const listEl = document.getElementById('tutorClasses');
  if (!listEl) return;

  const emptyStateEl = document.getElementById('emptyState');
  const createdBannerEl = document.getElementById('createdBanner');
  const tabs = Array.from(document.querySelectorAll('.manage-tab'));
  const studentsModal = document.getElementById('studentsModal');
  const studentsModalContent = document.getElementById('studentsModalContent');
  const closeStudentsModalButton = document.getElementById('closeStudentsModalButton');

  const params = new URLSearchParams(location.search);
  if (params.get('created') && createdBannerEl) createdBannerEl.classList.remove('hidden');

  let courses = [];
  let activeApproval = 'all';
  let activeCourseId = null;
function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.content)) return value.content;
    if (value && Array.isArray(value.items)) return value.items;
    return [];
  }

  function formatCurrency(value) {
    const num = Number(value || 0);
    if (typeof window.formatVND === 'function') return window.formatVND(num);
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  }

  function approvalBadge(status) {
    if (status === 'APPROVED') return '<span class="status-chip approved"><i class="fas fa-circle-check"></i> Đã duyệt</span>';
    if (status === 'REJECTED') return '<span class="status-chip rejected"><i class="fas fa-circle-xmark"></i> Từ chối</span>';
    return '<span class="status-chip pending"><i class="fas fa-hourglass-half"></i> Chờ duyệt</span>';
  }

  function courseBadge(status) {
    if (status === 'OPEN') return '<span class="status-chip open"><i class="fas fa-bullhorn"></i> Đang mở</span>';
    if (status === 'CLOSED') return '<span class="status-chip pending"><i class="fas fa-lock"></i> Đã đóng bài đăng</span>';
    if (status === 'IN_PROGRESS') return '<span class="status-chip pending"><i class="fas fa-book"></i> Đang học</span>';
    if (status === 'COMPLETED') return '<span class="status-chip approved"><i class="fas fa-check"></i> Hoàn thành</span>';
    if (status === 'CANCELLED') return '<span class="status-chip rejected"><i class="fas fa-ban"></i> Đã hủy</span>';
    return '<span class="status-chip rejected"><i class="fas fa-lock"></i> Đã đóng</span>';
  }

  function postingActionButtons(course) {
    const actions = [];
    actions.push('<button class="btn btn-soft" data-action="enrollments"><i class="fas fa-users"></i> Học viên ứng tuyển</button>');
    actions.push('<button class="btn btn-soft" data-action="view-post"><i class="fas fa-eye"></i> Xem bài đăng chi tiết</button>');
    actions.push('<button class="btn btn-soft" data-action="view-class"><i class="fas fa-layer-group"></i> Xem lớp học</button>');

    return actions.join('');
  }

  function hasAcceptedLearner(rows) {
    return asArray(rows).some((row) => {
      const status = String(row.status || '');
      return status === 'ACCEPTED' || status === 'COMPLETED';
    });
  }

  function render() {
    const rows = activeApproval === 'all'
      ? courses
      : courses.filter((c) => String(c.approvalStatus) === activeApproval);

    if (emptyStateEl) emptyStateEl.classList.toggle('hidden', rows.length > 0);

    DomUtils.setHtml(listEl, rows.map((item) => {
      return `
        <article class="manage-card" data-course-id="${safe(item.courseId)}" data-approval-status="${safe(item.approvalStatus || '')}">
          <div class="manage-card-top">
            <div>
              <div class="manage-badge-row">
                <span class="badge badge-primary">${safe(item.subject || '-')}</span>
                <span class="badge badge-gray">${safe(item.grade || '-')}</span>
                ${approvalBadge(item.approvalStatus)}
                ${courseBadge(item.status)}
              </div>
              <h3 class="manage-card-title">${safe(item.title || '-')}</h3>
              <p class="manage-card-sub">${safe(item.teachingMode || '-')} • ${safe(item.province || '-')}${item.district ? ' - ' + safe(item.district) : ''} • ${safe(item.studyTime || 'Chưa cập nhật')}</p>
            </div>
            <div class="manage-price">${formatCurrency(item.price)} / buoi</div>
          </div>
          <div class="manage-meta-grid">
            <div class="manage-meta-item"><strong>Số học viên tối đa</strong><span>${safe(item.maxStudents || 0)}</span></div>
            <div class="manage-meta-item"><strong>Ngay tao</strong><span>${safe(formatDateTime(item.createdAt))}</span></div>
            <div class="manage-meta-item"><strong>Tỉnh thành</strong><span>${safe(item.province || '-')}</span></div>
            <div class="manage-meta-item"><strong>Quận huyện</strong><span>${safe(item.district || '-')}</span></div>
          </div>
          <div class="manage-card-footer">
            <div class="manage-action-group">
              ${postingActionButtons(item)}
            </div>
          </div>
        </article>`;
    }).join(''));
  }

  function enrollmentStatusText(status) {
    const map = {
      PENDING: 'Chờ duyệt',
      ACCEPTED: 'Đã chấp nhận',
      REJECTED: 'Đã từ chối',
      COMPLETED: 'Đã chấp nhận',
      CANCELLED: 'Đã từ chối'
    };
    return map[status] || status;
  }

  function actionButtons(enrollment) {
    if (enrollment.status !== 'PENDING') return '';
    return `<button class="btn btn-primary" data-eid="${safe(enrollment.enrollmentId)}" data-status="ACCEPTED">Chấp nhận</button>
      <button class="btn btn-outline" data-eid="${safe(enrollment.enrollmentId)}" data-status="REJECTED">Từ chối</button>`;
  }

  function learnerLabel(enrollment) {
    return enrollment.learnerName || '-';
  }

  async function loadEnrollments(courseId) {
    const rowsRaw = await ApiClient.get(`/api/tutor/courses/${courseId}/enrollments`);
    const rows = asArray(rowsRaw);
    DomUtils.setHtml(studentsModalContent, rows.length
      ? rows.map((e) => `
          <div class="student-item student-item-spaced">
            <div class="student-row student-row-start">
              <div>
                <h4>${safe(learnerLabel(e))}</h4>
                <p>Phí đề xuất: ${formatCurrency(e.agreedFee)}</p>
                <p>Lời nhắn: ${safe(e.message || '(không có)')}</p>
                <p>Trạng thái: <strong>${safe(enrollmentStatusText(e.status))}</strong></p>
              </div>
              <div class="manage-action-group" data-actions>
                ${actionButtons(e)}
              </div>
            </div>
          </div>`).join('')
      : '<p>Chưa có đăng ký học viên cho lớp này.</p>');
  }

  async function updateEnrollmentStatus(enrollmentId, status) {
    await ApiClient.patch(`/api/tutor/enrollments/${enrollmentId}/status`, { status });
    await loadEnrollments(activeCourseId);
  }

  async function loadCourses() {
    const rowsRaw = await ApiClient.get('/api/tutor/courses');
    courses = asArray(rowsRaw);
    render();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeApproval = tab.dataset.filter || 'all';
      render();
    });
  });

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="enrollments"]');
    const viewPostBtn = e.target.closest('[data-action="view-post"]');
    const viewClassBtn = e.target.closest('[data-action="view-class"]');
    const card = e.target.closest('[data-course-id]');
    if (!card) return;
    const courseId = card.dataset.courseId;
    const approvalStatus = String(card.dataset.approvalStatus || '').toUpperCase();

    if (btn) {
      activeCourseId = courseId;
      if (!activeCourseId) {
        alert('Không xác định được mã lớp. Vui lòng tải lại trang.');
        return;
      }

      try {
        await loadEnrollments(activeCourseId);
        studentsModal.classList.remove('hidden');
      } catch (err) {
        alert(err.message || 'Không tải được danh sách đăng ký.');
      }
      return;
    }

    if (viewPostBtn) {
      if (approvalStatus !== 'APPROVED') {
        alert('Bài đăng chưa được duyệt.');
        return;
      }
      location.href = '/lop-chi-tiet.html?id=' + encodeURIComponent(courseId);
      return;
    }

    if (viewClassBtn) {
      try {
        const rowsRaw = await ApiClient.get(`/api/tutor/courses/${courseId}/enrollments`);
        const rows = asArray(rowsRaw);
        if (!hasAcceptedLearner(rows)) {
          alert('Chưa có học viên. Lớp học chỉ được tạo khi có học viên được chấp nhận.');
          return;
        }
        location.href = '/gia-su/my-classes.html?source=COURSE&id=' + encodeURIComponent(courseId) + '&courseId=' + encodeURIComponent(courseId);
      } catch (err) {
        alert(err.message || 'Không kiểm tra được dữ liệu lớp học.');
      }
    }

  });

  studentsModalContent.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-eid][data-status]');
    if (!btn) return;
    try {
      await updateEnrollmentStatus(btn.dataset.eid, btn.dataset.status);
      await loadCourses();
    } catch (err) {
      alert(err.message || 'Cập nhật trạng thái thất bại.');
    }
  });

  if (closeStudentsModalButton) {
    closeStudentsModalButton.onclick = () => studentsModal.classList.add('hidden');
  }
  if (studentsModal) {
    studentsModal.addEventListener('click', (e) => {
      if (e.target === studentsModal) studentsModal.classList.add('hidden');
    });
  }

  (async function init() {
    if (!AuthGuard.requireTutor()) return;
    try {
      await loadCourses();
    } catch (err) {
      alert(err.message || 'Không tải được danh sách lớp.');
    }
  })();
})();



