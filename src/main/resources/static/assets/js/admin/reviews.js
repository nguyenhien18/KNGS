(function () {
  if (!AuthGuard.requireAdmin()) return;
  UiUtils.renderHeader();

  const tabs = Array.from(document.querySelectorAll('#reviewTabs .manage-tab'));
  const listEl = document.getElementById('reviewList');
  const titleEl = document.getElementById('reviewSectionTitle');
  const totalEl = document.getElementById('reviewTotal');
  const countTutorEl = document.getElementById('countTutor');
  const countPostEl = document.getElementById('countPost');
  const countCourseEl = document.getElementById('countCourse');
  const countIdentityEl = document.getElementById('countIdentity');
  const tutorDetailModal = document.getElementById('tutorDetailModal');
  const tutorDetailBody = document.getElementById('tutorDetailBody');
  const reviewDetailModalTitle = document.getElementById('reviewDetailModalTitle');
  const rejectReasonModal = document.getElementById('rejectReasonModal');
  const rejectReasonForm = document.getElementById('rejectReasonForm');
  const rejectReasonInput = document.getElementById('rejectReasonInput');
  const dom = DomUtils;
  const escapeHtml = FormatUtils.escapeHtml;

  let activeKind = 'tutor';
  let datasets = {
    tutor: [],
    post: [],
    course: [],
    identity: []
  };
  const paginationEl = UiUtils.ensurePaginationAfter(listEl, 'adminReviewsPagination');
  const pageSize = 10;
  const pageState = {
    tutor: { page: 0, totalPages: 1, totalElements: 0 },
    post: { page: 0, totalPages: 1, totalElements: 0 },
    course: { page: 0, totalPages: 1, totalElements: 0 },
    identity: { page: 0, totalPages: 1, totalElements: 0 }
  };
  let rejectReasonResolver = null;

  function setHtml(element, html) {
    if (!element) return;
    dom.setHtml(element, html);
  }

  function closeTutorDetailModal() {
    AdminImageLightbox.close();
    tutorDetailModal.classList.add('hidden');
  }

  function openTutorDetailModal() {
    tutorDetailModal.classList.remove('hidden');
  }

  function closeRejectReasonModal(value) {
    if (rejectReasonModal) rejectReasonModal.classList.add('hidden');
    if (rejectReasonInput) rejectReasonInput.value = '';
    if (!rejectReasonResolver) return;

    const resolve = rejectReasonResolver;
    rejectReasonResolver = null;
    resolve(value);
  }

  function askRejectReason() {
    if (!rejectReasonModal || !rejectReasonForm || !rejectReasonInput) {
      return Promise.resolve(null);
    }

    if (rejectReasonResolver) closeRejectReasonModal(null);
    rejectReasonInput.value = '';
    rejectReasonModal.classList.remove('hidden');
    setTimeout(function () {
      rejectReasonInput.focus();
    }, 0);

    return new Promise(function (resolve) {
      rejectReasonResolver = resolve;
    });
  }

  async function showTutorDetail(tutorId) {
    try {
      setHtml(tutorDetailBody, '<p>Đang tải chi tiết...</p>');
      openTutorDetailModal();
      const context = await AdminReviewApi.loadTutorDetail(tutorId);
      AdminReviewDetail.renderTutor(tutorDetailBody, reviewDetailModalTitle, context.tutor, context.identity, context.certificates);
    } catch (err) {
      setHtml(tutorDetailBody, '<p>' + escapeHtml(err.message || 'Không tải được chi tiết hồ sơ') + '</p>');
    }
  }

  function showIdentityDetail(verificationId) {
    const identity = (datasets.identity || []).find(function (it) {
      return String(it.id) === String(verificationId);
    });
    if (!identity) {
      alert('Không tìm thấy thông tin xác minh danh tính');
      return;
    }
    AdminReviewDetail.renderIdentity(tutorDetailBody, reviewDetailModalTitle, identity);
    openTutorDetailModal();
  }

  function showPostDetail(postId) {
    const post = (datasets.post || []).find(function (it) {
      return String(it.postId) === String(postId);
    });
    if (!post) {
      alert('Không tìm thấy bài đăng');
      return;
    }
    AdminReviewDetail.renderPost(tutorDetailBody, reviewDetailModalTitle, post);
    openTutorDetailModal();
  }

  function showCourseDetail(courseId) {
    const course = (datasets.course || []).find(function (it) {
      return String(it.courseId) === String(courseId);
    });
    if (!course) {
      alert('Không tìm thấy lớp/khóa học');
      return;
    }
    AdminReviewDetail.renderCourse(tutorDetailBody, reviewDetailModalTitle, course);
    openTutorDetailModal();
  }

  function renderActiveList() {
    const rows = datasets[activeKind] || [];
    titleEl.textContent = AdminReviewList.sectionTitleByKind[activeKind];
    const state = pageState[activeKind] || { page: 0, totalPages: 1, totalElements: rows.length };
    totalEl.textContent = state.totalElements + ' mục';

    if (!rows.length) {
      setHtml(listEl, '<div class="mini-item"><p>' + AdminReviewList.emptyText(activeKind) + '</p></div>');
      UiUtils.renderSimplePagination(paginationEl, state, function (nextPage) { loadDataset(activeKind, nextPage); });
      return;
    }

    setHtml(listEl, rows.map(function (item) {
      return AdminReviewList.renderRow(activeKind, item);
    }).join(''));

    listEl.querySelectorAll('button[data-kind][data-id][data-approved]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const kind = btn.getAttribute('data-kind');
        const id = btn.getAttribute('data-id');
        const approved = btn.getAttribute('data-approved') === 'true';
        try {
          await UiUtils.withButtonLoading(btn, 'Đang xử lý...', function () {
            return review(kind, id, approved);
          });
        } catch (err) {
          alert(err.message || 'Duyệt thất bại');
        }
      });
    });

    UiUtils.renderSimplePagination(paginationEl, state, function (nextPage) { loadDataset(activeKind, nextPage); });

    listEl.querySelectorAll('button[data-action="detail"][data-tutor-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const tutorId = btn.getAttribute('data-tutor-id');
        await showTutorDetail(tutorId);
      });
    });

    listEl.querySelectorAll('button[data-action="identity-detail"][data-identity-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const identityId = btn.getAttribute('data-identity-id');
        showIdentityDetail(identityId);
      });
    });

    listEl.querySelectorAll('button[data-action="post-detail"][data-post-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const postId = btn.getAttribute('data-post-id');
        showPostDetail(postId);
      });
    });

    listEl.querySelectorAll('button[data-action="course-detail"][data-course-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const courseId = btn.getAttribute('data-course-id');
        showCourseDetail(courseId);
      });
    });
  }

  function setActiveTab(kind) {
    activeKind = kind;
    tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-kind') === kind);
    });
    renderActiveList();
  }

  async function loadDataset(kind, page) {
    const current = pageState[kind] || { page: 0 };
    const info = await AdminReviewApi.loadDataset(kind, page == null ? current.page : page, pageSize);
    datasets[kind] = info.content;
    pageState[kind] = { page: info.page, totalPages: info.totalPages, totalElements: info.totalElements };
    if (kind === 'tutor') countTutorEl.textContent = String(info.totalElements);
    if (kind === 'post') countPostEl.textContent = String(info.totalElements);
    if (kind === 'course') countCourseEl.textContent = String(info.totalElements);
    if (kind === 'identity') countIdentityEl.textContent = String(info.totalElements);
    if (kind === activeKind) renderActiveList();
  }

  async function review(kind, id, approved) {
    let rejectedReason = null;
    if (!approved) {
      const input = await askRejectReason();
      if (input === null) return;
      rejectedReason = input.trim() || 'Không đạt yêu cầu';
    }
    if (kind === 'tutor') {
      await AdminReviewApi.review(kind, id, approved, rejectedReason);
    } else if (kind === 'post' || kind === 'course' || kind === 'identity') {
      await AdminReviewApi.review(kind, id, approved, rejectedReason);
    }
    await load();
    setActiveTab(kind);
  }

  async function load() {
    try {
      await Promise.all([
        loadDataset('tutor', 0),
        loadDataset('post', 0),
        loadDataset('course', 0),
        loadDataset('identity', 0)
      ]);
      renderActiveList();
    } catch (err) {
      UiUtils.renderSimplePagination(paginationEl, { page: 0, totalPages: 1 }, function () {});
      setHtml(listEl, '<div class="mini-item"><p>' + escapeHtml(err.message || 'Không tải được dữ liệu duyệt') + '</p></div>');
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setActiveTab(tab.getAttribute('data-kind'));
    });
  });

  if (tutorDetailModal) {
    tutorDetailModal.addEventListener('click', function (event) {
      if (event.target && event.target.getAttribute && event.target.getAttribute('data-close') === 'true') {
        closeTutorDetailModal();
      }
    });
  }

  if (rejectReasonForm) {
    rejectReasonForm.addEventListener('submit', function (event) {
      event.preventDefault();
      closeRejectReasonModal((rejectReasonInput.value || '').trim() || 'Không đạt yêu cầu');
    });
  }

  if (rejectReasonModal) {
    rejectReasonModal.addEventListener('click', function (event) {
      const closeControl = event.target.closest('[data-reject-close="true"]');
      if (event.target === rejectReasonModal || (closeControl && closeControl !== rejectReasonModal)) {
        closeRejectReasonModal(null);
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && rejectReasonModal && !rejectReasonModal.classList.contains('hidden')) {
      closeRejectReasonModal(null);
    }
  });

  load();
})();
