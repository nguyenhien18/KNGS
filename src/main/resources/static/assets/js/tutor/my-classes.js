(function () {
  if (!AuthGuard.requireTutor()) return;

  UiUtils.renderHeader();

  const common = MyClassesCommon;
  const listEl = document.getElementById('myClassesList');
  const countEl = document.getElementById('myClassesCount');
  const sourceFilterSelect = document.getElementById('sourceFilterSelect');
  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const applyFilterButton = document.getElementById('applyFilterButton');
  const studentsModal = document.getElementById('studentsModal');
  const studentsModalContent = document.getElementById('studentsModalContent');
  const closeStudentsModalButton = document.getElementById('closeStudentsModalButton');

  const focus = common.readFocus();

  let allItems = [];
  const paginationEl = UiUtils.ensurePaginationAfter(listEl, 'tutorMyClassesPagination');
  let currentPage = 0;
  const pageSize = 10;
  let sourceFilter = 'ALL';
  let stateFilter = 'ALL';
  const asArray = ApiClient.asArray;
  const dom = DomUtils;

  function setHtml(element, html) {
    if (!element) return;
    dom.setHtml(element, html);
  }

  function hasAcceptedLearner(enrollments) {
    return asArray(enrollments).some(function (row) {
      const s = String(row && row.status || '');
      return s === 'ACCEPTED' || s === 'COMPLETED';
    });
  }

  function statusTextByCourse(raw) {
    if (raw === 'OPEN' || raw === 'CLOSED' || raw === 'IN_PROGRESS') return 'Đang học';
    if (raw === 'COMPLETED') return 'Đã hoàn thành';
    if (raw === 'CANCELLED') return 'Đã hủy';
    return raw || '---';
  }

  function buildFromTutorCourses(rows) {
    return asArray(rows).map(function (c) {
      const s = String(c.status || 'OPEN');
      const state = (s === 'COMPLETED') ? 'COMPLETED' : ((s === 'CANCELLED') ? 'CANCELLED' : 'ACTIVE');
      return {
        source: 'COURSE',
        itemId: c.courseId || c.id,
        rawStatus: s,
        state: state,
        title: c.title || ('Khóa học #' + (c.courseId || c.id || '-')),
        sub: 'Loại: Lớp gia sư mở',
        meta1: 'Môn học: ' + (c.subject || '---'),
        meta2: 'Khu vực: ' + ([c.province, c.district].filter(Boolean).join(' - ') || '---'),
        meta3: 'Học phí: ' + (c.price ? formatVND(c.price) : 'Thỏa thuận'),
        statusText: statusTextByCourse(s),
        badgeClass: s === 'COMPLETED' ? 'badge-success' : 'badge-primary'
      };
    });
  }

  function buildFromMatched(rows) {
    return asArray(rows).map(function (c) {
      const s = String(c.status || 'ASSIGNED');
      const state = (s === 'COMPLETED') ? 'COMPLETED' : ((s === 'CANCELLED') ? 'CANCELLED' : 'ACTIVE');
      const waitingForMyConfirmation = Boolean(c.waitingForMyConfirmation);
      return {
        source: 'MATCHED',
        itemId: c.classId,
        postId: c.postId,
        rawStatus: s,
        statusRequestedByUserId: c.statusRequestedByUserId,
        statusRequestedByRole: c.statusRequestedByRole,
        statusRequestedAt: c.statusRequestedAt,
        statusRequestReason: c.statusRequestReason,
        waitingForMyConfirmation: waitingForMyConfirmation,
        state: state,
        title: c.postTitle || 'Lớp từ bài đăng',
        sub: 'Học viên: ' + (c.learnerName || '---'),
        meta1: 'Mã lớp: #' + (c.classId || '-'),
        meta2: 'Bắt đầu: ' + common.toDate(c.startDate || c.assignedAt),
        meta3: 'Kết thúc: ' + common.toDate(c.endDate),
        statusText: common.matchedStatusText(s, waitingForMyConfirmation),
        learnerName: c.learnerName,
        learnerEmail: c.learnerEmail,
        learnerPhone: c.learnerPhone,
        badgeClass: common.matchedBadgeClass(s)
      };
    });
  }

  function setActiveStatusTab(state) {
    stateFilter = state;
    if (statusFilterSelect) statusFilterSelect.value = state;
  }

  function setActiveSourceFilter(source) {
    sourceFilter = source;
    if (sourceFilterSelect) sourceFilterSelect.value = source;
  }

  function applyFocusFiltersIfNeeded() {
    const found = common.findFocusItem(allItems, focus);
    if (!found) return;

    setActiveSourceFilter('ALL');
    setActiveStatusTab(common.stateForFocus(found));
  }

  async function completeCourseWithoutStartStep(courseId, rawStatus) {
    if (rawStatus === 'OPEN' || rawStatus === 'CLOSED') {
      await ApiClient.patch('/api/tutor/courses/' + encodeURIComponent(courseId) + '/status', { status: 'IN_PROGRESS' });
    }
    await ApiClient.patch('/api/tutor/courses/' + encodeURIComponent(courseId) + '/status', { status: 'COMPLETED' });
  }

  async function completeMatchedWithoutStartStep(classId, rawStatus) {
    if (rawStatus === 'ASSIGNED') {
      await ApiClient.patch('/api/tutor/matched-classes/' + encodeURIComponent(classId) + '/status', { status: 'IN_PROGRESS' });
    }
    await ApiClient.patch('/api/tutor/matched-classes/' + encodeURIComponent(classId) + '/status', { status: 'COMPLETED' });
  }

  function actionButtons(item) {
    if (item.rawStatus === 'CANCELLED') {
      if (item.source === 'COURSE') {
        return '<button class="btn btn-soft" data-course-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
      }
      return '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
    }

    if (item.source === 'COURSE') {
      if (item.rawStatus === 'COMPLETED') {
        return '<a class="btn btn-soft" href="/gia-su/tutor-reviews.html?courseId=' + encodeURIComponent(item.itemId) + '">Xem đánh giá của lớp</a>'
          + '<button class="btn btn-soft" data-course-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
      }
      return '<button class="btn btn-primary" data-course-id="' + safe(item.itemId) + '" data-action="complete" data-raw-status="' + safe(item.rawStatus) + '">Hoàn thành lớp học</button>'
        + '<button class="btn btn-outline" data-course-id="' + safe(item.itemId) + '" data-action="cancel">Hủy lớp học</button>'
        + '<button class="btn btn-soft" data-course-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
    }

    if (item.rawStatus === 'COMPLETED') {
      return '<a class="btn btn-soft" href="/gia-su/tutor-reviews.html?classId=' + encodeURIComponent(item.itemId) + '">Xem đánh giá của lớp</a>'
        + '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
    }

    if (item.rawStatus === 'COMPLETION_REQUESTED') {
      if (item.waitingForMyConfirmation) {
        return '<button class="btn btn-primary" data-class-id="' + safe(item.itemId) + '" data-action="complete" data-raw-status="' + safe(item.rawStatus) + '">Xác nhận hoàn thành</button>'
          + '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
      }
      return '<span class="muted">Đang chờ học viên xác nhận hoàn thành</span>'
        + '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
    }

    if (item.rawStatus === 'CANCELLATION_REQUESTED') {
      if (item.waitingForMyConfirmation) {
        return '<button class="btn btn-outline" data-class-id="' + safe(item.itemId) + '" data-action="cancel" data-raw-status="' + safe(item.rawStatus) + '">Xác nhận hủy</button>'
          + '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
      }
      return '<span class="muted">Đang chờ học viên xác nhận hủy</span>'
        + '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
    }

    return '<button class="btn btn-primary" data-class-id="' + safe(item.itemId) + '" data-action="complete" data-raw-status="' + safe(item.rawStatus) + '">Yêu cầu hoàn thành lớp học</button>'
      + '<button class="btn btn-outline" data-class-id="' + safe(item.itemId) + '" data-action="cancel" data-raw-status="' + safe(item.rawStatus) + '">Yêu cầu hủy lớp học</button>'
      + '<button class="btn btn-soft" data-class-id="' + safe(item.itemId) + '" data-action="students">Xem học viên</button>';
  }

  async function updateCourseStatus(courseId, action, rawStatus) {
    if (action === 'cancel') {
      if (!window.confirm('Bạn chắc chắn muốn hủy lớp này?')) return;
      await ApiClient.patch('/api/tutor/courses/' + encodeURIComponent(courseId) + '/status', { status: 'CANCELLED' });
      await load();
      return;
    }

    if (!window.confirm('Xác nhận lớp đã hoàn thành?')) return;
    await completeCourseWithoutStartStep(courseId, rawStatus);
    await load();
  }

  async function updateMatchedClassStatus(classId, action, rawStatus) {
    if (action === 'cancel') {
      const confirming = rawStatus === 'CANCELLATION_REQUESTED';
      if (!window.confirm(confirming ? 'Xác nhận hủy lớp này?' : 'Gửi yêu cầu hủy lớp này?')) return;
      await ApiClient.patch('/api/tutor/matched-classes/' + encodeURIComponent(classId) + '/status', { status: 'CANCELLED' });
      await load();
      return;
    }

    const confirming = rawStatus === 'COMPLETION_REQUESTED';
    if (!window.confirm(confirming ? 'Xác nhận hoàn thành lớp này?' : 'Gửi yêu cầu hoàn thành lớp này?')) return;
    await completeMatchedWithoutStartStep(classId, rawStatus);
    await load();
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

  function canShowContact(status) {
    return status === 'ACCEPTED' || status === 'COMPLETED';
  }

  async function openStudentsModalByCourse(courseId) {
    const rows = await ApiClient.getAll('/api/tutor/courses/' + encodeURIComponent(courseId) + '/enrollments', { size: 10 });

    if (!rows.length) {
      setHtml(studentsModalContent, '<p>Chưa có học viên nào trong lớp này.</p>');
      studentsModal.classList.remove('hidden');
      return;
    }

    setHtml(studentsModalContent, rows.map(function (enrollment) {
      const showContact = canShowContact(String(enrollment.status || ''));
      return '<div class="student-item student-item-spaced">' +
        '<div class="student-row student-row-start">' +
          '<div>' +
            '<h4>' + safe(enrollment.learnerName || 'Học viên') + '</h4>' +
            '<p>Trạng thái: <strong>' + safe(enrollmentStatusText(enrollment.status)) + '</strong></p>' +
            '<p>Lời nhắn: ' + safe(enrollment.message || '(không có)') + '</p>' +
            '<p>Học phí: ' + (enrollment.agreedFee ? formatVND(enrollment.agreedFee) : 'Thỏa thuận') + '</p>' +
            (showContact
              ? '<p>Email: ' + safe(enrollment.learnerEmail || '-') + '</p><p>Số điện thoại: ' + safe(enrollment.learnerPhone || '-') + '</p>'
              : '<p>Thông tin liên hệ sẽ hiển thị sau khi đơn đã được chấp nhận.</p>') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join(''));

    studentsModal.classList.remove('hidden');
  }

  function openStudentsModalByMatched(item) {
    setHtml(studentsModalContent, '<div class="student-item student-item-spaced">' +
      '<div class="student-row student-row-start">' +
        '<div>' +
          '<h4>' + safe(item.learnerName || 'Học viên') + '</h4>' +
          '<p>Email: ' + safe(item.learnerEmail || '-') + '</p>' +
          '<p>Số điện thoại: ' + safe(item.learnerPhone || '-') + '</p>' +
          '<p>Trạng thái lớp: <strong>' + safe(item.statusText || 'Đang học') + '</strong></p>' +
        '</div>' +
      '</div>' +
    '</div>');
    studentsModal.classList.remove('hidden');
  }

  function render() {
    const allVisible = common.filterItems(allItems, sourceFilter, stateFilter);
    const page = common.paginate(allVisible, currentPage, pageSize);
    const totalPages = page.totalPages;
    currentPage = page.page;
    const rows = page.rows;
    const focusItem = common.findFocusItem(allItems, focus);
    if (countEl) countEl.textContent = allVisible.length + ' lớp';

    if (!rows.length) {
      const emptyText = allItems.length
        ? 'Không có dữ liệu ở bộ lọc hiện tại.'
        : 'Chưa có học viên nào trong lớp học.';
      const emptyTitle = allItems.length ? 'Không có lớp' : 'Chưa có học viên';
      setHtml(listEl, '<div class="mini-item"><h4>' + safe(emptyTitle) + '</h4><p>' + safe(emptyText) + '</p></div>');
      UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; render(); });
      return;
    }

    setHtml(listEl, rows.map(function (item) {
      return common.renderClassCard(item, actionButtons(item), common.focusClass(item, focusItem));
    }).join(''));

    UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; render(); });

    common.scrollToFocus(listEl, focusItem);

    listEl.querySelectorAll('button[data-class-id][data-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        const classId = button.getAttribute('data-class-id');
        const action = button.getAttribute('data-action');
        const rawStatus = button.getAttribute('data-raw-status') || 'ASSIGNED';

        if (action === 'students') {
          const item = allItems.find(function (x) { return x.source === 'MATCHED' && String(x.itemId) === String(classId); });
          if (item) openStudentsModalByMatched(item);
          return;
        }

        UiUtils.withButtonLoading(button, 'Đang xử lý...', function () {
          return updateMatchedClassStatus(classId, action, rawStatus);
        })
          .catch(function (err) {
            alert(err.message || 'Không cập nhật được trạng thái lớp.');
          });
      });
    });

    listEl.querySelectorAll('button[data-course-id][data-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        const courseId = button.getAttribute('data-course-id');
        const action = button.getAttribute('data-action');
        const rawStatus = button.getAttribute('data-raw-status') || 'OPEN';

        if (action === 'students') {
          UiUtils.withButtonLoading(button, 'Đang tải...', function () {
            return openStudentsModalByCourse(courseId);
          })
            .catch(function (err) {
              alert(err.message || 'Không tải được danh sách học viên.');
            });
          return;
        }

        UiUtils.withButtonLoading(button, 'Đang xử lý...', function () {
          return updateCourseStatus(courseId, action, rawStatus);
        })
          .catch(function (err) {
            alert(err.message || 'Không cập nhật được trạng thái lớp.');
          });
      });
    });
  }

  async function load() {
    try {
      const [courses, matched] = await Promise.all([
        ApiClient.getAll('/api/tutor/courses', { size: 10 }),
        ApiClient.getAll('/api/tutor/matched-classes', { size: 10 })
      ]);
      const courseRows = courses;
      const activeCourseIds = courseRows
        .map(function (course) { return course && (course.courseId || course.id); })
        .filter(Boolean);

      const enrollmentChecks = await Promise.all(activeCourseIds.map(async function (courseId) {
        try {
          const rows = await ApiClient.getAll('/api/tutor/courses/' + encodeURIComponent(courseId) + '/enrollments', { size: 10 });
          return { courseId: String(courseId), ok: hasAcceptedLearner(rows) };
        } catch (_) {
          return { courseId: String(courseId), ok: false };
        }
      }));
      const visibleCourseIds = new Set(enrollmentChecks.filter(function (item) { return item.ok; }).map(function (item) { return item.courseId; }));
      const visibleCourses = courseRows.filter(function (course) {
        const cid = String((course && (course.courseId || course.id)) || '');
        return visibleCourseIds.has(cid);
      });

      allItems = buildFromTutorCourses(visibleCourses).concat(buildFromMatched(matched));
      applyFocusFiltersIfNeeded();
      currentPage = 0;
      render();
    } catch (err) {
      setHtml(listEl, '<div class="mini-item"><h4>Lỗi</h4><p>' + safe(err.message || 'Không tải được dữ liệu lớp học') + '</p></div>');
    }
  }

  if (sourceFilterSelect) sourceFilterSelect.value = sourceFilter;
  if (statusFilterSelect) statusFilterSelect.value = stateFilter;
  if (applyFilterButton) {
    applyFilterButton.addEventListener('click', function () {
      sourceFilter = sourceFilterSelect ? (sourceFilterSelect.value || 'ALL') : 'ALL';
      stateFilter = statusFilterSelect ? (statusFilterSelect.value || 'ALL') : 'ALL';
      currentPage = 0;
      render();
    });
  }

  if (closeStudentsModalButton) {
    closeStudentsModalButton.onclick = function () {
      studentsModal.classList.add('hidden');
    };
  }
  if (studentsModal) {
    studentsModal.addEventListener('click', function (event) {
      if (event.target === studentsModal) studentsModal.classList.add('hidden');
    });
  }

  load();
})();
