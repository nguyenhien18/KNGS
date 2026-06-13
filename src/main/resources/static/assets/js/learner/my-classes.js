(function () {
  if (!AuthGuard.requireLearner()) return;

  UiUtils.renderHeader();

  const common = MyClassesCommon;
  const listEl = document.getElementById('myClassesList');
  const countEl = document.getElementById('myClassesCount');
  const sourceFilterSelect = document.getElementById('sourceFilterSelect');
  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const applyFilterButton = document.getElementById('applyFilterButton');

  const tutorInfoModal = document.getElementById('tutorInfoModal');
  const tutorInfoModalContent = document.getElementById('tutorInfoModalContent');
  const closeTutorInfoModalButton = document.getElementById('closeTutorInfoModalButton');

  const reviewModal = document.getElementById('reviewModal');
  const reviewRating = document.getElementById('reviewRating');
  const reviewComment = document.getElementById('reviewComment');
  const submitReviewButton = document.getElementById('submitReviewButton');
  const cancelReviewButton = document.getElementById('cancelReviewButton');
  const closeReviewModalButton = document.getElementById('closeReviewModalButton');

  const focus = common.readFocus();

  let allItems = [];
  const paginationEl = UiUtils.ensurePaginationAfter(listEl, 'learnerMyClassesPagination');
  let currentPage = 0;
  const pageSize = 10;
  let sourceFilter = 'ALL';
  let stateFilter = 'ALL';
  let pendingReviewTarget = null;
  const dom = DomUtils;

  function setHtml(element, html) {
    if (!element) return;
    dom.setHtml(element, html);
  }

  function enrollmentStatusText(status) {
    const map = {
      PENDING: 'Đang chờ',
      ACCEPTED: 'Đã chấp nhận',
      REJECTED: 'Bị từ chối',
      COMPLETED: 'Đã hoàn thành',
      CANCELLED: 'Đã hủy'
    };
    return map[String(status || 'PENDING')] || 'Đang học';
  }

  function buildFromMatched(rows) {
    return (rows || []).map(function (c) {
      const raw = String(c.status || 'ASSIGNED');
      const state = raw === 'COMPLETED' ? 'COMPLETED' : (raw === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE');
      const waitingForMyConfirmation = Boolean(c.waitingForMyConfirmation);
      return {
        source: 'MATCHED',
        itemId: c.classId,
        postId: c.postId,
        rawStatus: raw,
        statusRequestedByUserId: c.statusRequestedByUserId,
        statusRequestedByRole: c.statusRequestedByRole,
        statusRequestedAt: c.statusRequestedAt,
        statusRequestReason: c.statusRequestReason,
        waitingForMyConfirmation: waitingForMyConfirmation,
        state: state,
        title: c.postTitle || 'Lớp từ bài đăng',
        sub: 'Gia sư: ' + (c.tutorName || '---'),
        tutorName: c.tutorName,
        tutorEmail: c.tutorEmail,
        tutorPhone: c.tutorPhone,
        meta1: 'Mã lớp: #' + (c.classId || '-'),
        meta2: 'Bắt đầu: ' + common.toDate(c.startDate || c.assignedAt),
        meta3: 'Kết thúc: ' + common.toDate(c.endDate),
        statusText: common.matchedStatusText(raw, waitingForMyConfirmation),
        badgeClass: common.matchedBadgeClass(raw),
        link: '/hoc-vien/my-classes.html?classId=' + encodeURIComponent(c.classId || '')
      };
    });
  }

  function buildFromEnrollments(rows) {
    return (rows || []).map(function (e) {
      const raw = String(e.status || 'PENDING');
      const courseStatus = String(e.courseStatus || '');
      const effectiveRaw = (raw === 'ACCEPTED' && courseStatus === 'COMPLETED') ? 'COMPLETED' : raw;
      const active = effectiveRaw === 'ACCEPTED' || effectiveRaw === 'PENDING';
      const completed = effectiveRaw === 'COMPLETED';
      const cancelled = effectiveRaw === 'CANCELLED' || effectiveRaw === 'REJECTED';
      return {
        source: 'COURSE',
        itemId: e.courseId,
        enrollmentId: e.enrollmentId,
        rawStatus: effectiveRaw,
        state: completed ? 'COMPLETED' : (cancelled ? 'CANCELLED' : (active ? 'ACTIVE' : 'ACTIVE')),
        title: e.courseTitle || ('Khóa học #' + (e.courseId || '-')),
        sub: 'Gia sư: ' + (e.tutorName || '---'),
        tutorName: e.tutorName,
        tutorEmail: e.tutorEmail,
        tutorPhone: e.tutorPhone,
        meta1: 'Mã đăng ký: #' + (e.enrollmentId || '-'),
        meta2: 'Ngày đăng ký: ' + common.toDate(e.createdAt),
        meta3: 'Học phí: ' + (e.agreedFee ? formatVND(e.agreedFee) : 'Thỏa thuận'),
        statusText: enrollmentStatusText(effectiveRaw),
        badgeClass: completed ? 'badge-success' : (cancelled ? 'badge-gray' : 'badge-primary'),
        link: '/hoc-vien/learner-enrollments.html?courseId=' + encodeURIComponent(e.courseId || '')
      };
    });
  }

  function setSourceFilter(value) {
    sourceFilter = value;
    if (sourceFilterSelect) sourceFilterSelect.value = value;
  }

  function setStateFilter(value) {
    stateFilter = value;
    if (statusFilterSelect) statusFilterSelect.value = value;
  }

  function applyFocusFiltersIfNeeded() {
    const focusItem = common.findFocusItem(allItems, focus);
    if (!focusItem) return;

    setSourceFilter('ALL');
    setStateFilter(common.stateForFocus(focusItem));
  }

  function openTutorInfoModal(item) {
    setHtml(tutorInfoModalContent, '<div class="student-item">' +
      '<h4>' + safe(item.tutorName || 'Gia sư') + '</h4>' +
      '<p>Email: ' + safe(item.tutorEmail || 'Chưa có dữ liệu') + '</p>' +
      '<p>Số điện thoại: ' + safe(item.tutorPhone || 'Chưa có dữ liệu') + '</p>' +
      '<p>Trạng thái lớp: <strong>' + safe(item.statusText) + '</strong></p>' +
    '</div>');
    tutorInfoModal.classList.remove('hidden');
  }

  async function completeMatchedClass(classId, rawStatus) {
    const confirming = rawStatus === 'COMPLETION_REQUESTED';
    if (!confirm(confirming ? 'Xác nhận hoàn thành lớp này?' : 'Gửi yêu cầu hoàn thành lớp này?')) return;
    if (rawStatus === 'ASSIGNED') {
      await ApiClient.patch('/api/learner/classes/' + encodeURIComponent(classId) + '/status', { status: 'IN_PROGRESS' });
    }
    await ApiClient.patch('/api/learner/classes/' + encodeURIComponent(classId) + '/status', { status: 'COMPLETED' });
    await load();
  }

  async function cancelMatchedClass(classId, rawStatus) {
    const confirming = rawStatus === 'CANCELLATION_REQUESTED';
    if (!confirm(confirming ? 'Xác nhận hủy lớp này?' : 'Gửi yêu cầu hủy lớp này?')) return;
    await ApiClient.patch('/api/learner/classes/' + encodeURIComponent(classId) + '/status', { status: 'CANCELLED' });
    await load();
  }

  function openReviewModal(type, id) {
    pendingReviewTarget = { type: type, id: id };
    if (reviewRating) reviewRating.value = '5';
    if (reviewComment) reviewComment.value = '';
    reviewModal.classList.remove('hidden');
  }

  async function submitReview() {
    if (!pendingReviewTarget || !pendingReviewTarget.id) return;
    const rating = Number(reviewRating ? reviewRating.value : 5);
    const comment = reviewComment ? String(reviewComment.value || '').trim() : '';
    if (!rating || rating < 1 || rating > 5) {
      alert('Vui lòng chọn số sao hợp lệ.');
      return;
    }

    const payload = { rating: rating, comment: comment };
    if (pendingReviewTarget.type === 'COURSE') {
      payload.courseEnrollmentId = pendingReviewTarget.id;
    } else {
      payload.classId = pendingReviewTarget.id;
    }

    await ApiClient.post('/api/learner/reviews', payload);

    alert('Đã gửi đánh giá gia sư.');
    reviewModal.classList.add('hidden');
    pendingReviewTarget = null;
  }

  function courseClassActions(item) {
    if (item.rawStatus === 'COMPLETED') {
      return '<button class="btn btn-soft" data-action="view-tutor" data-course-id="' + safe(item.itemId) + '" data-enrollment-id="' + safe(item.enrollmentId) + '">Xem gia sư</button>' +
        '<button class="btn btn-primary" data-action="review" data-course-id="' + safe(item.itemId) + '" data-enrollment-id="' + safe(item.enrollmentId) + '">Đánh giá gia sư</button>';
    }

    if (item.rawStatus === 'ACCEPTED') {
      return '<button class="btn btn-soft" data-action="view-tutor" data-course-id="' + safe(item.itemId) + '" data-enrollment-id="' + safe(item.enrollmentId) + '">Xem gia sư</button>';
    }

    return '<a class="btn btn-soft" href="' + safe(item.link) + '">Xem chi tiết</a>';
  }

  function matchedClassActions(item) {
    if (item.rawStatus === 'COMPLETED') {
      return '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>' +
        '<button class="btn btn-primary" data-action="review" data-class-id="' + safe(item.itemId) + '">Đánh giá gia sư</button>';
    }

    if (item.rawStatus === 'CANCELLED') {
      return '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>';
    }

    if (item.rawStatus === 'COMPLETION_REQUESTED') {
      if (item.waitingForMyConfirmation) {
        return '<button class="btn btn-primary" data-action="complete" data-class-id="' + safe(item.itemId) + '" data-raw-status="' + safe(item.rawStatus) + '">Xác nhận hoàn thành</button>' +
          '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>';
      }
      return '<span class="muted">Đang chờ gia sư xác nhận hoàn thành</span>' +
        '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>';
    }

    if (item.rawStatus === 'CANCELLATION_REQUESTED') {
      if (item.waitingForMyConfirmation) {
        return '<button class="btn btn-outline" data-action="cancel" data-class-id="' + safe(item.itemId) + '" data-raw-status="' + safe(item.rawStatus) + '">Xác nhận hủy</button>' +
          '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>';
      }
      return '<span class="muted">Đang chờ gia sư xác nhận hủy</span>' +
        '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>';
    }

    return '<button class="btn btn-primary" data-action="complete" data-class-id="' + safe(item.itemId) + '" data-raw-status="' + safe(item.rawStatus) + '">Yêu cầu hoàn thành</button>' +
      '<button class="btn btn-outline" data-action="cancel" data-class-id="' + safe(item.itemId) + '" data-raw-status="' + safe(item.rawStatus) + '">Yêu cầu hủy</button>' +
      '<button class="btn btn-soft" data-action="view-tutor" data-class-id="' + safe(item.itemId) + '">Xem gia sư</button>';
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
      setHtml(listEl, '<div class="mini-item"><h4>Không có lớp</h4><p>Không có dữ liệu ở bộ lọc hiện tại.</p></div>');
      UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; render(); });
      return;
    }

    setHtml(listEl, rows.map(function (item) {
      const actionsHtml = item.source === 'MATCHED'
        ? matchedClassActions(item)
        : courseClassActions(item);

      return common.renderClassCard(item, actionsHtml, common.focusClass(item, focusItem));
    }).join(''));

    UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; render(); });

    common.scrollToFocus(listEl, focusItem);

    listEl.querySelectorAll('button[data-action][data-class-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const action = btn.getAttribute('data-action');
        const classId = btn.getAttribute('data-class-id');
        const item = allItems.find(function (x) {
          return x.source === 'MATCHED' && String(x.itemId) === String(classId);
        });
        if (!item) return;

        try {
          if (action === 'view-tutor') {
            openTutorInfoModal(item);
            return;
          }
          if (action === 'cancel') {
            await UiUtils.withButtonLoading(btn, 'Đang xử lý...', async function () {
              await cancelMatchedClass(classId, btn.getAttribute('data-raw-status') || item.rawStatus);
            });
            return;
          }
          if (action === 'complete') {
            await UiUtils.withButtonLoading(btn, 'Đang xử lý...', async function () {
              await completeMatchedClass(classId, btn.getAttribute('data-raw-status') || item.rawStatus);
            });
            return;
          }
          if (action === 'review') {
            openReviewModal('MATCHED', classId);
          }
        } catch (err) {
          alert(err.message || 'Không xử lý được thao tác lớp học.');
        }
      });
    });

    listEl.querySelectorAll('button[data-action][data-course-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const action = btn.getAttribute('data-action');
        const courseId = btn.getAttribute('data-course-id');
        const enrollmentId = btn.getAttribute('data-enrollment-id');
        const item = allItems.find(function (x) {
          return x.source === 'COURSE'
            && String(x.itemId) === String(courseId)
            && String(x.enrollmentId) === String(enrollmentId);
        });
        if (!item) return;

        if (action === 'view-tutor') {
          openTutorInfoModal(item);
          return;
        }
        if (action === 'review') {
          openReviewModal('COURSE', enrollmentId);
        }
      });
    });
  }

  async function load() {
    try {
      const [matchedClasses, enrollments] = await Promise.all([
        ApiClient.getAll('/api/learner/classes', { size: 10 }),
        ApiClient.getAll('/api/learner/enrollments', { size: 10 })
      ]);
      allItems = buildFromMatched(matchedClasses).concat(buildFromEnrollments(enrollments));
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
      setSourceFilter(sourceFilterSelect ? (sourceFilterSelect.value || 'ALL') : 'ALL');
      setStateFilter(statusFilterSelect ? (statusFilterSelect.value || 'ALL') : 'ALL');
      currentPage = 0;
      render();
    });
  }

  if (closeTutorInfoModalButton && tutorInfoModal) {
    closeTutorInfoModalButton.addEventListener('click', function () {
      tutorInfoModal.classList.add('hidden');
    });
    tutorInfoModal.addEventListener('click', function (e) {
      if (e.target === tutorInfoModal) tutorInfoModal.classList.add('hidden');
    });
  }

  function closeReviewModal() {
    pendingReviewTarget = null;
    if (reviewModal) reviewModal.classList.add('hidden');
  }

  if (submitReviewButton) {
    submitReviewButton.addEventListener('click', async function () {
      try {
        await UiUtils.withButtonLoading(submitReviewButton, 'Đang gửi...', submitReview);
      } catch (err) {
        alert(err.message || 'Không gửi được đánh giá. Có thể lớp đã được đánh giá trước đó.');
      }
    });
  }
  if (cancelReviewButton) cancelReviewButton.addEventListener('click', closeReviewModal);
  if (closeReviewModalButton) closeReviewModalButton.addEventListener('click', closeReviewModal);
  if (reviewModal) {
    reviewModal.addEventListener('click', function (e) {
      if (e.target === reviewModal) closeReviewModal();
    });
  }

  load();
})();
