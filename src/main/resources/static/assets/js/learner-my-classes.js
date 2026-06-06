(function () {
  if (!AuthGuard.requireLearner()) return;

  UiUtils.renderHeader();

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

  const params = new URLSearchParams(location.search);
  const focusSource = params.get('source');
  const focusId = params.get('id');
  const focusCourseId = params.get('courseId');
  const focusClassId = params.get('classId');
  const focusPostId = params.get('postId');

  let allItems = [];
  let sourceFilter = 'ALL';
  let stateFilter = 'ALL';
  let pendingReviewTarget = null;
  const dom = DomUtils;

  function setHtml(element, html) {
    if (!element) return;
    dom.setHtml(element, html);
  }

  function toDate(value) {
    return FormatUtils.formatDate(value);
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

  function matchedStatusText(status, waitingForMyConfirmation) {
    const map = {
      ASSIGNED: 'Đang học',
      IN_PROGRESS: 'Đang học',
      COMPLETION_REQUESTED: waitingForMyConfirmation ? 'Cần xác nhận hoàn thành' : 'Chờ xác nhận hoàn thành',
      COMPLETED: 'Đã hoàn thành',
      CANCELLATION_REQUESTED: waitingForMyConfirmation ? 'Cần xác nhận hủy' : 'Chờ xác nhận hủy',
      CANCELLED: 'Đã hủy'
    };
    return map[String(status || 'ASSIGNED')] || 'Đang học';
  }

  function matchedBadgeClass(status) {
    const raw = String(status || 'ASSIGNED');
    if (raw === 'COMPLETED') return 'badge-success';
    if (raw === 'CANCELLED') return 'badge-gray';
    if (raw === 'COMPLETION_REQUESTED' || raw === 'CANCELLATION_REQUESTED') return 'badge-warning';
    return 'badge-primary';
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
        meta2: 'Bắt đầu: ' + toDate(c.startDate || c.assignedAt),
        meta3: 'Kết thúc: ' + toDate(c.endDate),
        statusText: matchedStatusText(raw, waitingForMyConfirmation),
        badgeClass: matchedBadgeClass(raw),
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
        meta2: 'Ngày đăng ký: ' + toDate(e.createdAt),
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

  function findFocusItem() {
    let item = null;
    if (focusSource && focusId) {
      item = allItems.find(function (x) {
        return String(x.source) === String(focusSource) && String(x.itemId) === String(focusId);
      });
    }
    if (!item && focusCourseId) {
      item = allItems.find(function (x) {
        return x.source === 'COURSE' && String(x.itemId) === String(focusCourseId);
      });
    }
    if (!item && focusClassId) {
      item = allItems.find(function (x) {
        return x.source === 'MATCHED' && String(x.itemId) === String(focusClassId);
      });
    }
    if (!item && focusPostId) {
      item = allItems.find(function (x) {
        return x.source === 'MATCHED' && String(x.postId) === String(focusPostId);
      });
    }
    return item;
  }

  function applyFocusFiltersIfNeeded() {
    const focusItem = findFocusItem();
    if (!focusItem) return;

    setSourceFilter('ALL');
    if (focusItem.state === 'COMPLETED') setStateFilter('COMPLETED');
    else if (focusItem.state === 'CANCELLED') setStateFilter('CANCELLED');
    else setStateFilter('ACTIVE');
  }

  function visibleItems() {
    return allItems.filter(function (item) {
      if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
      if (stateFilter !== 'ALL' && item.state !== stateFilter) return false;
      return true;
    });
  }

  function sourceText(source) {
    return source === 'MATCHED' ? 'Lớp từ bài đăng' : 'Lớp gia sư mở';
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
    const rows = visibleItems();
    if (countEl) countEl.textContent = rows.length + ' lớp';

    if (!rows.length) {
      setHtml(listEl, '<div class="mini-item"><h4>Không có lớp</h4><p>Không có dữ liệu ở bộ lọc hiện tại.</p></div>');
      return;
    }

    setHtml(listEl, rows.map(function (item) {
      const focusItem = findFocusItem();
      const isFocused = focusItem
        && String(focusItem.source) === String(item.source)
        && String(focusItem.itemId) === String(item.itemId);
      const focusClass = isFocused ? ' is-focused' : '';

      const actionsHtml = item.source === 'MATCHED'
        ? matchedClassActions(item)
        : courseClassActions(item);

      return '<article class="list-card' + focusClass + '" data-source="' + safe(item.source) + '" data-item-id="' + safe(item.itemId) + '">' +
        '<div class="badge-row">' +
          '<span class="badge badge-gray">' + safe(sourceText(item.source)) + '</span>' +
          '<span class="badge ' + safe(item.badgeClass) + '">' + safe(item.statusText) + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + safe(item.title) + '</h3>' +
        '<p class="muted">' + safe(item.sub) + '</p>' +
        '<div class="info-grid">' +
          '<div class="info-box"><strong>Thông tin 1</strong><span>' + safe(item.meta1) + '</span></div>' +
          '<div class="info-box"><strong>Thông tin 2</strong><span>' + safe(item.meta2) + '</span></div>' +
          '<div class="info-box"><strong>Thông tin 3</strong><span>' + safe(item.meta3) + '</span></div>' +
          '<div class="info-box"><strong>Nhóm lớp</strong><span>' + safe(sourceText(item.source)) + '</span></div>' +
        '</div>' +
        '<div class="card-actions"><span class="muted">Trạng thái học tập: ' + safe(item.statusText) + '</span><div class="manage-action-group">' + actionsHtml + '</div></div>' +
      '</article>';
    }).join(''));

    const focusItem = findFocusItem();
    if (focusItem) {
      const selector = '[data-source="' + String(focusItem.source).replace(/"/g, '') + '"][data-item-id="' + String(focusItem.itemId).replace(/"/g, '') + '"]';
      const el = listEl.querySelector(selector);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

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
        ApiClient.get('/api/learner/classes'),
        ApiClient.get('/api/learner/enrollments')
      ]);
      allItems = buildFromMatched(ApiClient.asArray(matchedClasses)).concat(buildFromEnrollments(ApiClient.asArray(enrollments)));
      applyFocusFiltersIfNeeded();
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
