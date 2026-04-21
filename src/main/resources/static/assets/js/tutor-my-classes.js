(function () {
  function ensureTutor() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'TUTOR') {
      alert('Bạn cần đăng nhập tài khoản gia sư.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname + location.search);
      return false;
    }
    return true;
  }

  if (!ensureTutor()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') headerRight.innerHTML = renderUtilityHeaderRight();
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('myClassesList');
  const countEl = document.getElementById('myClassesCount');
  const sourceFilterSelect = document.getElementById('sourceFilterSelect');
  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const applyFilterButton = document.getElementById('applyFilterButton');
  const studentsModal = document.getElementById('studentsModal');
  const studentsModalContent = document.getElementById('studentsModalContent');
  const closeStudentsModalButton = document.getElementById('closeStudentsModalButton');

  const params = new URLSearchParams(location.search);
  const focusSource = params.get('source');
  const focusId = params.get('id');
  const focusCourseId = params.get('courseId');
  const focusClassId = params.get('classId');
  const focusPostId = params.get('postId');

  let allItems = [];
  let sourceFilter = 'ALL';
  let stateFilter = 'ALL';

  function safe(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.content)) return value.content;
    if (value && Array.isArray(value.items)) return value.items;
    return [];
  }

  function hasAcceptedLearner(enrollments) {
    return asArray(enrollments).some(function (row) {
      const s = String(row && row.status || '');
      return s === 'ACCEPTED' || s === 'COMPLETED';
    });
  }

  function toDate(value) {
    if (!value) return '---';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safe(value);
    return d.toLocaleDateString('vi-VN');
  }

  function statusTextByCourse(raw) {
    if (raw === 'OPEN' || raw === 'CLOSED' || raw === 'IN_PROGRESS') return 'Đang học';
    if (raw === 'COMPLETED') return 'Đã hoàn thành';
    if (raw === 'CANCELLED') return 'Đã hủy';
    return raw || '---';
  }

  function statusTextByMatched(raw) {
    if (raw === 'ASSIGNED' || raw === 'IN_PROGRESS') return 'Đang học';
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
        title: c.title || ('Khoa hoc #' + (c.courseId || c.id || '-')),
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
      return {
        source: 'MATCHED',
        itemId: c.classId,
        postId: c.postId,
        rawStatus: s,
        state: state,
        title: c.postTitle || 'Lớp từ bài đăng',
        sub: 'Học viên: ' + (c.learnerName || '---'),
        meta1: 'Mã lớp: #' + (c.classId || '-'),
        meta2: 'Bắt đầu: ' + toDate(c.startDate || c.assignedAt),
        meta3: 'Kết thúc: ' + toDate(c.endDate),
        statusText: statusTextByMatched(s),
        learnerName: c.learnerName,
        learnerEmail: c.learnerEmail,
        learnerPhone: c.learnerPhone,
        badgeClass: s === 'COMPLETED' ? 'badge-success' : 'badge-primary'
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
    if (!focusSource && !focusId && !focusCourseId && !focusClassId && !focusPostId) return;

    let found = null;
    if (focusSource && focusId) {
      found = allItems.find(function (item) {
        return String(item.source) === String(focusSource) && String(item.itemId) === String(focusId);
      });
    }
    if (!found && focusCourseId) {
      found = allItems.find(function (item) {
        return item.source === 'COURSE' && String(item.itemId) === String(focusCourseId);
      });
    }
    if (!found && focusClassId) {
      found = allItems.find(function (item) {
        return item.source === 'MATCHED' && String(item.itemId) === String(focusClassId);
      });
    }
    if (!found && focusPostId) {
      found = allItems.find(function (item) {
        return item.source === 'MATCHED' && String(item.postId) === String(focusPostId);
      });
    }
    if (!found) return;

    setActiveSourceFilter('ALL');
    if (found.state === 'COMPLETED') {
      setActiveStatusTab('COMPLETED');
    } else if (found.state === 'CANCELLED') {
      setActiveStatusTab('CANCELLED');
    } else {
      setActiveStatusTab('ACTIVE');
    }
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
        return '<button class="btn btn-soft" data-course-id="' + item.itemId + '" data-action="students">Xem học viên</button>';
      }
      return '<button class="btn btn-soft" data-class-id="' + item.itemId + '" data-action="students">Xem học viên</button>';
    }

    if (item.source === 'COURSE') {
      if (item.rawStatus === 'COMPLETED') {
        return '<a class="btn btn-soft" href="/gia-su/tutor-reviews.html?courseId=' + item.itemId + '">Xem đánh giá của lớp</a>'
          + '<button class="btn btn-soft" data-course-id="' + item.itemId + '" data-action="students">Xem học viên</button>';
      }
      return '<button class="btn btn-primary" data-course-id="' + item.itemId + '" data-action="complete" data-raw-status="' + item.rawStatus + '">Hoàn thành lớp học</button>'
        + '<button class="btn btn-outline" data-course-id="' + item.itemId + '" data-action="cancel">Hủy lớp học</button>'
        + '<button class="btn btn-soft" data-course-id="' + item.itemId + '" data-action="students">Xem học viên</button>';
    }

    if (item.rawStatus === 'COMPLETED') {
      return '<a class="btn btn-soft" href="/gia-su/tutor-reviews.html?classId=' + item.itemId + '">Xem đánh giá của lớp</a>'
        + '<button class="btn btn-soft" data-class-id="' + item.itemId + '" data-action="students">Xem học viên</button>';
    }
    return '<button class="btn btn-primary" data-class-id="' + item.itemId + '" data-action="complete" data-raw-status="' + item.rawStatus + '">Hoàn thành lớp học</button>'
      + '<button class="btn btn-outline" data-class-id="' + item.itemId + '" data-action="cancel">Hủy lớp học</button>'
      + '<button class="btn btn-soft" data-class-id="' + item.itemId + '" data-action="students">Xem học viên</button>';
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
      if (!window.confirm('Bạn chắc chắn muốn hủy lớp này?')) return;
      await ApiClient.patch('/api/tutor/matched-classes/' + encodeURIComponent(classId) + '/status', { status: 'CANCELLED' });
      await load();
      return;
    }

    if (!window.confirm('Xác nhận lớp đã hoàn thành?')) return;
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
    const enrollmentsRaw = await ApiClient.get('/api/tutor/courses/' + encodeURIComponent(courseId) + '/enrollments');
    const rows = asArray(enrollmentsRaw);

    if (!rows.length) {
      studentsModalContent.innerHTML = '<p>Chưa có học viên nào trong lớp này.</p>';
      studentsModal.classList.remove('hidden');
      return;
    }

    studentsModalContent.innerHTML = rows.map(function (enrollment) {
      const showContact = canShowContact(String(enrollment.status || ''));
      return '<div class="student-item" style="margin-bottom:12px">' +
        '<div class="student-row" style="align-items:flex-start;gap:16px">' +
          '<div>' +
            '<h4>' + safe(enrollment.learnerName || 'Học viên') + '</h4>' +
            '<p>Trạng thái: <strong>' + safe(enrollmentStatusText(enrollment.status)) + '</strong></p>' +
            '<p>Lời nhắn: ' + safe(enrollment.message || '(không có)') + '</p>' +
            '<p>Học phí: ' + (enrollment.agreedFee ? formatVND(enrollment.agreedFee) : 'Thỏa thuận') + '</p>' +
            (showContact
              ? '<p>Email: ' + safe(enrollment.learnerEmail || '-') + '</p><p>So dien thoai: ' + safe(enrollment.learnerPhone || '-') + '</p>'
              : '<p>Thông tin liên hệ sẽ hiển thị sau khi đơn đã được chấp nhận.</p>') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    studentsModal.classList.remove('hidden');
  }

  function openStudentsModalByMatched(item) {
    studentsModalContent.innerHTML = '<div class="student-item" style="margin-bottom:12px">' +
      '<div class="student-row" style="align-items:flex-start;gap:16px">' +
        '<div>' +
          '<h4>' + safe(item.learnerName || 'Học viên') + '</h4>' +
          '<p>Email: ' + safe(item.learnerEmail || '-') + '</p>' +
          '<p>Số điện thoại: ' + safe(item.learnerPhone || '-') + '</p>' +
          '<p>Trạng thái lớp: <strong>' + safe(item.statusText || 'Đang học') + '</strong></p>' +
        '</div>' +
      '</div>' +
    '</div>';
    studentsModal.classList.remove('hidden');
  }

  function render() {
    const rows = visibleItems();
    if (countEl) countEl.textContent = rows.length + ' lop';

    if (!rows.length) {
      const emptyText = allItems.length
        ? 'Không có dữ liệu ở bộ lọc hiện tại.'
        : 'Chưa có học viên nào trong lớp học.';
      const emptyTitle = allItems.length ? 'Không có lớp' : 'Chưa có học viên';
      listEl.innerHTML = '<div class="mini-item"><h4>' + emptyTitle + '</h4><p>' + emptyText + '</p></div>';
      return;
    }

    listEl.innerHTML = rows.map(function (item) {
      const focusBySourceId = focusSource && focusId
        && String(item.source) === String(focusSource)
        && String(item.itemId) === String(focusId);
      const focusByCourseId = focusCourseId && item.source === 'COURSE' && String(item.itemId) === String(focusCourseId);
      const focusByClassId = focusClassId && item.source === 'MATCHED' && String(item.itemId) === String(focusClassId);
      const focusByPostId = focusPostId && item.source === 'MATCHED' && String(item.postId) === String(focusPostId);
      const focusStyle = (focusBySourceId || focusByCourseId || focusByClassId || focusByPostId)
        ? ' style="border:2px solid #2563eb"'
        : '';
      return '<article class="list-card" data-source="' + item.source + '" data-item-id="' + item.itemId + '"' + focusStyle + '>' +
        '<div class="badge-row">' +
          '<span class="badge badge-gray">' + sourceText(item.source) + '</span>' +
          '<span class="badge ' + item.badgeClass + '">' + item.statusText + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + safe(item.title) + '</h3>' +
        '<p class="muted">' + safe(item.sub) + '</p>' +
        '<div class="info-grid">' +
          '<div class="info-box"><strong>Thông tin 1</strong><span>' + safe(item.meta1) + '</span></div>' +
          '<div class="info-box"><strong>Thông tin 2</strong><span>' + safe(item.meta2) + '</span></div>' +
          '<div class="info-box"><strong>Thông tin 3</strong><span>' + safe(item.meta3) + '</span></div>' +
          '<div class="info-box"><strong>Nhóm lớp</strong><span>' + sourceText(item.source) + '</span></div>' +
        '</div>' +
        '<div class="card-actions"><span class="muted">Trạng thái học tập: ' + item.statusText + '</span><div class="manage-action-group">' + actionButtons(item) + '</div></div>' +
      '</article>';
    }).join('');

    if (focusSource || focusId || focusCourseId || focusClassId || focusPostId) {
      let targetItem = null;
      if (focusSource && focusId) {
        targetItem = allItems.find(function (item) {
          return String(item.source) === String(focusSource) && String(item.itemId) === String(focusId);
        });
      }
      if (!targetItem && focusCourseId) {
        targetItem = allItems.find(function (item) {
          return item.source === 'COURSE' && String(item.itemId) === String(focusCourseId);
        });
      }
      if (!targetItem && focusClassId) {
        targetItem = allItems.find(function (item) {
          return item.source === 'MATCHED' && String(item.itemId) === String(focusClassId);
        });
      }
      if (!targetItem && focusPostId) {
        targetItem = allItems.find(function (item) {
          return item.source === 'MATCHED' && String(item.postId) === String(focusPostId);
        });
      }

      let selector = '';
      if (targetItem) {
        selector = '[data-source="' + String(targetItem.source).replace(/"/g, '') + '"][data-item-id="' + String(targetItem.itemId).replace(/"/g, '') + '"]';
      }
      const el = selector ? listEl.querySelector(selector) : null;
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

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

        updateMatchedClassStatus(classId, action, rawStatus)
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
          openStudentsModalByCourse(courseId)
            .catch(function (err) {
              alert(err.message || 'Không tải được danh sách học viên.');
            });
          return;
        }

        updateCourseStatus(courseId, action, rawStatus)
          .catch(function (err) {
            alert(err.message || 'Không cập nhật được trạng thái lớp.');
          });
      });
    });
  }

  async function load() {
    try {
      const [courses, matched] = await Promise.all([
        ApiClient.get('/api/tutor/courses'),
        ApiClient.get('/api/tutor/matched-classes')
      ]);
      const courseRows = asArray(courses);
      const activeCourseIds = courseRows
        .map(function (course) { return course && (course.courseId || course.id); })
        .filter(Boolean);

      const enrollmentChecks = await Promise.all(activeCourseIds.map(async function (courseId) {
        try {
          const rows = await ApiClient.get('/api/tutor/courses/' + encodeURIComponent(courseId) + '/enrollments');
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
      render();
    } catch (err) {
      listEl.innerHTML = '<div class="mini-item"><h4>Lỗi</h4><p>' + safe(err.message || 'Không tải được dữ liệu lớp học') + '</p></div>';
    }
  }

  if (sourceFilterSelect) sourceFilterSelect.value = sourceFilter;
  if (statusFilterSelect) statusFilterSelect.value = stateFilter;
  if (applyFilterButton) {
    applyFilterButton.addEventListener('click', function () {
      sourceFilter = sourceFilterSelect ? (sourceFilterSelect.value || 'ALL') : 'ALL';
      stateFilter = statusFilterSelect ? (statusFilterSelect.value || 'ALL') : 'ALL';
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
