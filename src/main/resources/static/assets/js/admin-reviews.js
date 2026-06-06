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
  let imageLightbox = null;
  let lightboxImage = null;
  let closeLightboxButton = null;
  const dom = DomUtils;
  const escapeHtml = FormatUtils.escapeHtml;
  const formatDateTime = FormatUtils.formatDateTime;

  const sectionTitleByKind = {
    tutor: 'Hồ sơ gia sư chờ duyệt',
    post: 'Bài đăng học viên chờ duyệt',
    course: 'Lớp/khóa học gia sư chờ duyệt',
    identity: 'Xác minh danh tính chờ duyệt'
  };

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

  function statusBadgeLabel(kind) {
    if (kind === 'tutor') return 'PENDING PROFILE';
    if (kind === 'post') return 'PENDING POST';
    if (kind === 'course') return 'PENDING COURSE';
    return 'PENDING IDENTITY';
  }

  function statusBadgeClass(status) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'badge-success';
    if (normalized === 'REJECTED') return 'badge-danger';
    if (normalized === 'PENDING') return 'badge-warning';
    return 'badge-gray';
  }

  function setHtml(element, html) {
    if (!element) return;
    dom.setHtml(element, html);
  }

  function ensureImageLightbox() {
    if (imageLightbox && lightboxImage && closeLightboxButton) return;
    imageLightbox = document.createElement('div');
    imageLightbox.id = 'adminImageLightbox';
    imageLightbox.className = 'lightbox hidden';
    setHtml(imageLightbox, '<span class="lightbox-close" id="adminCloseLightbox">&times;</span><img id="adminLightboxImage" src="" alt="Preview">');
    document.body.appendChild(imageLightbox);
    lightboxImage = imageLightbox.querySelector('#adminLightboxImage');
    closeLightboxButton = imageLightbox.querySelector('#adminCloseLightbox');
    closeLightboxButton.addEventListener('click', closeImagePreview);
    imageLightbox.addEventListener('click', function (event) {
      if (event.target === imageLightbox) closeImagePreview();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && imageLightbox && !imageLightbox.classList.contains('hidden')) {
        closeImagePreview();
      }
    });
  }

  function closeImagePreview() {
    if (!imageLightbox || !lightboxImage) return;
    imageLightbox.classList.add('hidden');
    lightboxImage.removeAttribute('src');
  }

  function openImagePreview(url) {
    ensureImageLightbox();
    if (!lightboxImage || !imageLightbox) return;
    lightboxImage.src = url;
    imageLightbox.classList.remove('hidden');
  }

  function toCloudinaryUrl(value) {
    try {
      const raw = String(value || '').trim();
      if (!raw) return null;
      const url = new URL(raw);
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      const isCloudinary = String(url.hostname || '').toLowerCase().endsWith('.cloudinary.com');
      if (!isHttp || !isCloudinary) return null;
      return url.toString();
    } catch (_) {
      return null;
    }
  }

  function renderCertificateList(certificates) {
    if (!Array.isArray(certificates) || !certificates.length) {
      return '<p class="muted">Chưa có bằng cấp.</p>';
    }
    return certificates.map(function (certificate) {
      const rawUrl = String(
        certificate.certificateImageUrl
        || certificate.certificateImageURL
        || certificate.imageUrl
        || certificate.url
        || ''
      ).trim();
      const hasImage = rawUrl && rawUrl.toLowerCase() !== 'null' && rawUrl.toLowerCase() !== 'undefined';
      const image = hasImage
        ? '<button type="button" class="btn btn-soft js-open-cert-image" data-certificate-url="' + escapeHtml(rawUrl) + '">Xem ảnh bằng cấp</button>'
        : '<span class="muted">Không có ảnh</span>';
      return '' +
        '<div class="mini-item mini-item-mb-10">' +
          '<p><strong>' + escapeHtml(certificate.title || 'Bằng cấp') + '</strong></p>' +
          '<div>' + image + '</div>' +
        '</div>';
    }).join('');
  }

  function renderTutorDetailModal(tutor, identity, certificates) {
    reviewDetailModalTitle.textContent = 'Chi tiết hồ sơ gia sư';
    setHtml(tutorDetailBody, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Họ tên</strong></p><p>' + escapeHtml(tutor.fullName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Email</strong></p><p>' + escapeHtml(tutor.email || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Số điện thoại</strong></p><p>' + escapeHtml(tutor.phone || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vực</strong></p><p>' + escapeHtml((tutor.district || '---') + ', ' + (tutor.province || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hình thức dạy</strong></p><p>' + escapeHtml(tutor.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Mức giá</strong></p><p>' + (tutor.hourlyRate ? formatVND(tutor.hourlyRate) + '/giờ' : 'Thỏa thuận') + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Mô tả</strong></p>' +
        '<p>' + escapeHtml(tutor.description || 'Chưa cập nhật') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Môn dạy / Khối lớp</strong></p>' +
        '<p>' + escapeHtml((tutor.subjects || []).join(', ') || 'Chưa khai báo môn dạy') + '</p>' +
        '<p class="muted">' + escapeHtml((tutor.grades || []).join(', ') || 'Chưa khai báo khối lớp') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Xác minh danh tính</strong> <span class="badge ' + statusBadgeClass(identity.status) + '">' + escapeHtml(identity.status || 'NOT_SUBMITTED') + '</span></p>' +
        '<p class="muted">CCCD/CMND: ' + escapeHtml(identity.idNumber || '---') + ' | Họ tên trên giấy tờ: ' + escapeHtml(identity.fullNameOnId || '---') + '</p>' +
        '<p class="muted">Ngay tao: ' + formatDateTime(identity.createdAt) + '</p>' +
      '</div>' +
      '<div class="mini-item">' +
        '<p><strong>Bằng cấp</strong></p>' +
        renderCertificateList(certificates) +
      '</div>');

    tutorDetailBody.querySelectorAll('.js-open-cert-image').forEach(function (button) {
      button.addEventListener('click', function () {
        const certificateUrl = button.getAttribute('data-certificate-url');
        const publicCloudinaryUrl = toCloudinaryUrl(certificateUrl);
        if (!publicCloudinaryUrl) {
          alert('Ảnh bằng cấp không hợp lệ hoặc không phải URL Cloudinary.');
          return;
        }
        openImagePreview(publicCloudinaryUrl);
      });
    });
  }

  function renderIdentityDetailModal(identity) {
    reviewDetailModalTitle.textContent = 'Chi tiết xác minh danh tính';
    function imgButton(imageUrl, label) {
      const hasImage = Boolean(imageUrl);
      if (!hasImage) return '<p class="muted">' + label + ': Chưa có ảnh</p>';
      return '<p><button type="button" class="btn btn-soft js-open-identity-image" data-url="' + escapeHtml(imageUrl) + '">' + label + '</button></p>';
    }
    setHtml(tutorDetailBody, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Họ tên người dùng</strong></p><p>' + escapeHtml(identity.userFullName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Trạng thái</strong></p><p><span class="badge ' + statusBadgeClass(identity.status) + '">' + escapeHtml(identity.status || 'PENDING') + '</span></p></div>' +
        '<div class="mini-item"><p><strong>Họ tên trên giấy tờ</strong></p><p>' + escapeHtml(identity.fullNameOnId || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Số CCCD/CMND</strong></p><p>' + escapeHtml(identity.idNumber || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngày sinh</strong></p><p>' + escapeHtml(identity.dateOfBirthOnId || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngày cấp</strong></p><p>' + escapeHtml(identity.issuedDate || '---') + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Nơi cấp</strong></p>' +
        '<p>' + escapeHtml(identity.issuedPlace || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Địa chỉ trên giấy tờ</strong></p>' +
        '<p>' + escapeHtml(identity.addressOnId || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Ảnh giấy tờ</strong></p>' +
        imgButton(identity.idFrontImageUrl, 'Xem ảnh mặt trước') +
        imgButton(identity.idBackImageUrl, 'Xem ảnh mặt sau') +
        imgButton(identity.selfieImageUrl, 'Xem ảnh selfie') +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tạo lúc: ' + formatDateTime(identity.createdAt) + '</p>' +
        '<p class="muted">Cập nhật lúc: ' + formatDateTime(identity.updatedAt) + '</p>' +
      '</div>');

    tutorDetailBody.querySelectorAll('.js-open-identity-image').forEach(function (button) {
      button.addEventListener('click', function () {
        const imageUrl = button.getAttribute('data-url');
        const publicCloudinaryUrl = toCloudinaryUrl(imageUrl);
        if (!publicCloudinaryUrl) {
          alert('Ảnh xác minh không hợp lệ hoặc không phải URL Cloudinary.');
          return;
        }
        openImagePreview(publicCloudinaryUrl);
      });
    });
  }

  function renderPostDetailModal(post) {
    reviewDetailModalTitle.textContent = 'Chi tiết bài đăng học viên';
    setHtml(tutorDetailBody, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Tiêu đề</strong></p><p>' + escapeHtml(post.title || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Môn học / Khối lớp</strong></p><p>' + escapeHtml((post.subject || '---') + ' / ' + (post.grade || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hình thức dạy</strong></p><p>' + escapeHtml(post.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Thời gian học</strong></p><p>' + escapeHtml(post.studyTime || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngân sách</strong></p><p>' + (post.budget ? formatVND(post.budget) + '/buổi' : 'Thỏa thuận') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vực</strong></p><p>' + escapeHtml((post.district || '---') + ', ' + (post.province || '---')) + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Địa chỉ chi tiết</strong></p>' +
        '<p>' + escapeHtml(post.addressDetail || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Mô tả nhu cau</strong></p>' +
        '<p>' + escapeHtml(post.description || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tạo lúc: ' + formatDateTime(post.createdAt) + '</p>' +
      '</div>');
  }

  function renderCourseDetailModal(course) {
    reviewDetailModalTitle.textContent = 'Chi tiết lớp/khóa học gia sư';
    setHtml(tutorDetailBody, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Tiêu đề</strong></p><p>' + escapeHtml(course.title || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Gia sư</strong></p><p>' + escapeHtml(course.tutorName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Môn học / Khối lớp</strong></p><p>' + escapeHtml((course.subject || '---') + ' / ' + (course.grade || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hình thức dạy</strong></p><p>' + escapeHtml(course.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Lịch học</strong></p><p>' + escapeHtml(course.studyTime || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Học phí</strong></p><p>' + (course.price ? formatVND(course.price) : 'Thỏa thuận') + '</p></div>' +
        '<div class="mini-item"><p><strong>Số học viên tối đa</strong></p><p>' + escapeHtml(course.maxStudents || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vực</strong></p><p>' + escapeHtml((course.district || '---') + ', ' + (course.province || '---')) + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Địa chỉ chi tiết</strong></p>' +
        '<p>' + escapeHtml(course.addressDetail || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Mô tả lớp/khóa học</strong></p>' +
        '<p>' + escapeHtml(course.description || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tạo lúc: ' + formatDateTime(course.createdAt) + '</p>' +
      '</div>');
  }

  function closeTutorDetailModal() {
    closeImagePreview();
    tutorDetailModal.classList.add('hidden');
  }

  function openTutorDetailModal() {
    tutorDetailModal.classList.remove('hidden');
  }

  async function showTutorDetail(tutorId) {
    try {
      setHtml(tutorDetailBody, '<p>Đang tải chi tiết...</p>');
      openTutorDetailModal();
      const [tutor, identity, certificates] = await Promise.all([
        ApiClient.get('/api/admin/tutors/' + encodeURIComponent(tutorId) + '/detail'),
        ApiClient.get('/api/admin/tutors/' + encodeURIComponent(tutorId) + '/identity-verification'),
        ApiClient.get('/api/admin/tutors/' + encodeURIComponent(tutorId) + '/certificates')
      ]);
      renderTutorDetailModal(tutor || {}, identity || {}, Array.isArray(certificates) ? certificates : []);
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
    renderIdentityDetailModal(identity);
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
    renderPostDetailModal(post);
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
    renderCourseDetailModal(course);
    openTutorDetailModal();
  }

  function renderRow(kind, item) {
    if (kind === 'tutor') {
      return '' +
        '<div class="post-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-warning">' + statusBadgeLabel(kind) + '</span>' +
            '<span class="badge badge-gray">' + escapeHtml(item.teachingMode || 'BOTH') + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + escapeHtml(item.fullName || 'Gia sư') + '</h3>' +
          '<p class="muted">' + escapeHtml(item.email || '---') + ' • ' + escapeHtml(item.phone || '---') + '</p>' +
          '<div class="card-actions">' +
            '<span class="muted">' + escapeHtml((item.subjects || []).join(', ') || 'Chưa khai báo môn dạy') + '</span>' +
            '<div class="manage-action-group">' +
              '<button class="btn btn-outline" data-action="detail" data-tutor-id="' + item.tutorId + '">Xem chi tiết</button>' +
              '<button class="btn btn-primary" data-kind="tutor" data-id="' + item.tutorId + '" data-approved="true">Duyệt</button>' +
              '<button class="btn btn-outline" data-kind="tutor" data-id="' + item.tutorId + '" data-approved="false">Từ chối</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    if (kind === 'post') {
      return '' +
        '<div class="post-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-warning">' + statusBadgeLabel(kind) + '</span>' +
            '<span class="badge badge-gray">' + escapeHtml(item.subject || '---') + '</span>' +
            '<span class="badge badge-gray">' + escapeHtml(item.grade || '---') + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + escapeHtml(item.title || 'Bài đăng học viên') + '</h3>' +
          '<p class="muted">' + escapeHtml(item.province || '---') + ' • ' + escapeHtml(item.district || '---') + '</p>' +
          '<div class="card-actions">' +
            '<span class="muted">' + (item.budget ? formatVND(item.budget) + '/buổi' : 'Ngân sách thỏa thuận') + '</span>' +
            '<div class="manage-action-group">' +
              '<button class="btn btn-outline" data-action="post-detail" data-post-id="' + item.postId + '">Xem chi tiết</button>' +
              '<button class="btn btn-primary" data-kind="post" data-id="' + item.postId + '" data-approved="true">Duyệt</button>' +
              '<button class="btn btn-outline" data-kind="post" data-id="' + item.postId + '" data-approved="false">Từ chối</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    if (kind === 'course') {
      return '' +
        '<div class="post-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-warning">' + statusBadgeLabel(kind) + '</span>' +
            '<span class="badge badge-gray">' + escapeHtml(item.subject || '---') + '</span>' +
            '<span class="badge badge-gray">' + escapeHtml(item.grade || '---') + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + escapeHtml(item.title || 'Khóa học gia sư') + '</h3>' +
          '<p class="muted">Gia sư: ' + escapeHtml(item.tutorName || '---') + '</p>' +
          '<div class="card-actions">' +
            '<span class="muted">' + (item.price ? formatVND(item.price) : 'Học phí thỏa thuận') + '</span>' +
            '<div class="manage-action-group">' +
              '<button class="btn btn-outline" data-action="course-detail" data-course-id="' + item.courseId + '">Xem chi tiết</button>' +
              '<button class="btn btn-primary" data-kind="course" data-id="' + item.courseId + '" data-approved="true">Duyệt</button>' +
              '<button class="btn btn-outline" data-kind="course" data-id="' + item.courseId + '" data-approved="false">Từ chối</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    return '' +
      '<div class="post-card">' +
        '<div class="badge-row">' +
          '<span class="badge badge-warning">' + statusBadgeLabel(kind) + '</span>' +
          '<span class="badge ' + statusBadgeClass(item.status) + '">' + escapeHtml(item.status || 'PENDING') + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.userFullName || 'Người dùng') + '</h3>' +
        '<p class="muted">Mã xác minh: ' + escapeHtml(item.id || '---') + ' | User ID: ' + escapeHtml(item.userId || '---') + '</p>' +
        '<p class="muted">CCCD/CMND: ' + escapeHtml(item.idNumber || '---') + '</p>' +
        '<div class="card-actions">' +
          '<span class="muted">Gửi lúc: ' + formatDateTime(item.createdAt) + '</span>' +
          '<div class="manage-action-group">' +
            '<button class="btn btn-outline" data-action="identity-detail" data-identity-id="' + item.id + '">Xem chi tiết</button>' +
            '<button class="btn btn-primary" data-kind="identity" data-id="' + item.id + '" data-approved="true">Duyệt</button>' +
            '<button class="btn btn-outline" data-kind="identity" data-id="' + item.id + '" data-approved="false">Từ chối</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderActiveList() {
    const rows = datasets[activeKind] || [];
    titleEl.textContent = sectionTitleByKind[activeKind];
    const state = pageState[activeKind] || { page: 0, totalPages: 1, totalElements: rows.length };
    totalEl.textContent = state.totalElements + ' mục';

    if (!rows.length) {
      const emptyText = activeKind === 'tutor'
        ? 'Không có hồ sơ gia sư chờ duyệt.'
        : activeKind === 'post'
          ? 'Không có bài đăng học viên chờ duyệt.'
          : activeKind === 'course'
            ? 'Không có lớp/khóa học chờ duyệt.'
            : 'Không có xác minh danh tính chờ duyệt.';
      setHtml(listEl, '<div class="mini-item"><p>' + emptyText + '</p></div>');
      UiUtils.renderSimplePagination(paginationEl, state, function (nextPage) { loadDataset(activeKind, nextPage); });
      return;
    }

    setHtml(listEl, rows.map(function (item) {
      return renderRow(activeKind, item);
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

  function endpointByKind(kind) {
    if (kind === 'tutor') return '/api/admin/tutors/pending';
    if (kind === 'post') return '/api/admin/posts/pending';
    if (kind === 'course') return '/api/admin/courses/pending';
    return '/api/admin/identity-verifications/pending';
  }

  async function loadDataset(kind, page) {
    const current = pageState[kind] || { page: 0 };
    const data = await ApiClient.get(endpointByKind(kind), { page: page == null ? current.page : page, size: pageSize });
    const info = UiUtils.pageInfo(data);
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
      const input = prompt('Nhập lý do từ chối:', '');
      if (input === null) return;
      rejectedReason = input.trim() || 'Không đạt yêu cầu';
    }
    if (kind === 'tutor') {
      await ApiClient.patch('/api/admin/tutors/' + encodeURIComponent(id) + '/review', { approved: approved, rejectedReason: rejectedReason });
    } else if (kind === 'post') {
      await ApiClient.patch('/api/admin/posts/' + encodeURIComponent(id) + '/review', { approved: approved, rejectedReason: rejectedReason });
    } else if (kind === 'course') {
      await ApiClient.patch('/api/admin/courses/' + encodeURIComponent(id) + '/review', { approved: approved, rejectedReason: rejectedReason });
    } else {
      await ApiClient.patch('/api/admin/identity-verifications/' + encodeURIComponent(id) + '/review', { approved: approved, rejectedReason: rejectedReason });
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

  load();
})();
