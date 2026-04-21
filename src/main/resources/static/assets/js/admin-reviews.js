(function () {
  function ensureAdmin() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'ADMIN') {
      alert('Ban can dang nhap tai khoan admin.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }

  if (!ensureAdmin()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

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

  const sectionTitleByKind = {
    tutor: 'Ho so gia su cho duyet',
    post: 'Bai dang hoc vien cho duyet',
    course: 'Lop/khoa hoc gia su cho duyet',
    identity: 'Xac minh danh tinh cho duyet'
  };

  let activeKind = 'tutor';
  let datasets = {
    tutor: [],
    post: [],
    course: [],
    identity: []
  };

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function statusBadgeLabel(kind) {
    if (kind === 'tutor') return 'PENDING PROFILE';
    if (kind === 'post') return 'PENDING POST';
    if (kind === 'course') return 'PENDING COURSE';
    return 'PENDING IDENTITY';
  }

  function formatDateTime(value) {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('vi-VN');
  }

  function statusBadgeClass(status) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'badge-success';
    if (normalized === 'REJECTED') return 'badge-danger';
    if (normalized === 'PENDING') return 'badge-warning';
    return 'badge-gray';
  }

  async function openProtectedImage(path) {
    const blob = await ApiClient.getBlob(path);
    const objectUrl = URL.createObjectURL(blob);
    const win = window.open(objectUrl, '_blank', 'noopener');
    if (!win) {
      URL.revokeObjectURL(objectUrl);
      throw new Error('Trinh duyet dang chan cua so moi.');
    }
    setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 60000);
  }

  function renderCertificateList(certificates) {
    if (!Array.isArray(certificates) || !certificates.length) {
      return '<p class="muted">Chua co bang cap.</p>';
    }
    return certificates.map(function (certificate) {
      const rawUrl = String(certificate.certificateImageUrl || '').trim();
      const hasImage = rawUrl && rawUrl.toLowerCase() !== 'null' && rawUrl.toLowerCase() !== 'undefined';
      const image = hasImage
        ? '<button type="button" class="btn btn-soft js-open-cert-image" data-certificate-id="' + escapeHtml(certificate.id) + '">Xem anh bang cap</button>'
        : '<span class="muted">Khong co anh</span>';
      return '' +
        '<div class="mini-item" style="margin-bottom:10px">' +
          '<p><strong>' + escapeHtml(certificate.title || 'Bang cap') + '</strong></p>' +
          '<div>' + image + '</div>' +
        '</div>';
    }).join('');
  }

  function renderTutorDetailModal(tutor, identity, certificates) {
    reviewDetailModalTitle.textContent = 'Chi tiet ho so gia su';
    tutorDetailBody.innerHTML = '' +
      '<div class="detail-grid" style="grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">' +
        '<div class="mini-item"><p><strong>Ho ten</strong></p><p>' + escapeHtml(tutor.fullName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Email</strong></p><p>' + escapeHtml(tutor.email || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>So dien thoai</strong></p><p>' + escapeHtml(tutor.phone || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vuc</strong></p><p>' + escapeHtml((tutor.district || '---') + ', ' + (tutor.province || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hinh thuc day</strong></p><p>' + escapeHtml(tutor.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Muc gia</strong></p><p>' + (tutor.hourlyRate ? formatVND(tutor.hourlyRate) + '/gio' : 'Thoa thuan') + '</p></div>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Mo ta</strong></p>' +
        '<p>' + escapeHtml(tutor.description || 'Chua cap nhat') + '</p>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Mon day / Khoi lop</strong></p>' +
        '<p>' + escapeHtml((tutor.subjects || []).join(', ') || 'Chua khai bao mon day') + '</p>' +
        '<p class="muted">' + escapeHtml((tutor.grades || []).join(', ') || 'Chua khai bao khoi lop') + '</p>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Xac minh danh tinh</strong> <span class="badge ' + statusBadgeClass(identity.status) + '">' + escapeHtml(identity.status || 'NOT_SUBMITTED') + '</span></p>' +
        '<p class="muted">CCCD/CMND: ' + escapeHtml(identity.idNumber || '---') + ' | Ho ten tren giay to: ' + escapeHtml(identity.fullNameOnId || '---') + '</p>' +
        '<p class="muted">Ngay tao: ' + formatDateTime(identity.createdAt) + '</p>' +
      '</div>' +
      '<div class="mini-item">' +
        '<p><strong>Bang cap</strong></p>' +
        renderCertificateList(certificates) +
      '</div>';

    tutorDetailBody.querySelectorAll('.js-open-cert-image').forEach(function (button) {
      button.addEventListener('click', async function () {
        const certificateId = button.getAttribute('data-certificate-id');
        if (!certificateId) return;
        try {
          await openProtectedImage('/api/admin/certificates/' + encodeURIComponent(certificateId) + '/image');
        } catch (err) {
          alert(err.message || 'Khong mo duoc anh bang cap');
        }
      });
    });
  }

  function renderIdentityDetailModal(identity) {
    reviewDetailModalTitle.textContent = 'Chi tiet xac minh danh tinh';
    function imgButton(type, hasImage, label) {
      if (!hasImage) return '<p class="muted">' + label + ': Chua co anh</p>';
      return '<p><button type="button" class="btn btn-soft js-open-identity-image" data-verification-id="' + escapeHtml(identity.id) + '" data-type="' + escapeHtml(type) + '">' + label + '</button></p>';
    }
    tutorDetailBody.innerHTML = '' +
      '<div class="detail-grid" style="grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">' +
        '<div class="mini-item"><p><strong>Ho ten nguoi dung</strong></p><p>' + escapeHtml(identity.userFullName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Trang thai</strong></p><p><span class="badge ' + statusBadgeClass(identity.status) + '">' + escapeHtml(identity.status || 'PENDING') + '</span></p></div>' +
        '<div class="mini-item"><p><strong>Ho ten tren giay to</strong></p><p>' + escapeHtml(identity.fullNameOnId || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>So CCCD/CMND</strong></p><p>' + escapeHtml(identity.idNumber || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngay sinh</strong></p><p>' + escapeHtml(identity.dateOfBirthOnId || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngay cap</strong></p><p>' + escapeHtml(identity.issuedDate || '---') + '</p></div>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Noi cap</strong></p>' +
        '<p>' + escapeHtml(identity.issuedPlace || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Dia chi tren giay to</strong></p>' +
        '<p>' + escapeHtml(identity.addressOnId || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Anh giay to</strong></p>' +
        imgButton('front', !!identity.idFrontImageUrl, 'Xem anh mat truoc') +
        imgButton('back', !!identity.idBackImageUrl, 'Xem anh mat sau') +
        imgButton('selfie', !!identity.selfieImageUrl, 'Xem anh selfie') +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tao luc: ' + formatDateTime(identity.createdAt) + '</p>' +
        '<p class="muted">Cap nhat luc: ' + formatDateTime(identity.updatedAt) + '</p>' +
      '</div>';

    tutorDetailBody.querySelectorAll('.js-open-identity-image').forEach(function (button) {
      button.addEventListener('click', async function () {
        const verificationId = button.getAttribute('data-verification-id');
        const type = button.getAttribute('data-type');
        if (!verificationId || !type) return;
        try {
          await openProtectedImage(
            '/api/admin/identity-verifications/' + encodeURIComponent(verificationId) + '/images/' + encodeURIComponent(type)
          );
        } catch (err) {
          alert(err.message || 'Khong mo duoc anh xac minh');
        }
      });
    });
  }

  function renderPostDetailModal(post) {
    reviewDetailModalTitle.textContent = 'Chi tiet bai dang hoc vien';
    tutorDetailBody.innerHTML = '' +
      '<div class="detail-grid" style="grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">' +
        '<div class="mini-item"><p><strong>Tieu de</strong></p><p>' + escapeHtml(post.title || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Mon hoc / Khoi lop</strong></p><p>' + escapeHtml((post.subject || '---') + ' / ' + (post.grade || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hinh thuc day</strong></p><p>' + escapeHtml(post.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Thoi gian hoc</strong></p><p>' + escapeHtml(post.studyTime || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngan sach</strong></p><p>' + (post.budget ? formatVND(post.budget) + '/buoi' : 'Thoa thuan') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vuc</strong></p><p>' + escapeHtml((post.district || '---') + ', ' + (post.province || '---')) + '</p></div>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Dia chi chi tiet</strong></p>' +
        '<p>' + escapeHtml(post.addressDetail || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Mo ta nhu cau</strong></p>' +
        '<p>' + escapeHtml(post.description || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tao luc: ' + formatDateTime(post.createdAt) + '</p>' +
      '</div>';
  }

  function renderCourseDetailModal(course) {
    reviewDetailModalTitle.textContent = 'Chi tiet lop/khoa hoc gia su';
    tutorDetailBody.innerHTML = '' +
      '<div class="detail-grid" style="grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">' +
        '<div class="mini-item"><p><strong>Tieu de</strong></p><p>' + escapeHtml(course.title || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Gia su</strong></p><p>' + escapeHtml(course.tutorName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Mon hoc / Khoi lop</strong></p><p>' + escapeHtml((course.subject || '---') + ' / ' + (course.grade || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hinh thuc day</strong></p><p>' + escapeHtml(course.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Lich hoc</strong></p><p>' + escapeHtml(course.studyTime || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Hoc phi</strong></p><p>' + (course.price ? formatVND(course.price) : 'Thoa thuan') + '</p></div>' +
        '<div class="mini-item"><p><strong>So hoc vien toi da</strong></p><p>' + escapeHtml(course.maxStudents || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vuc</strong></p><p>' + escapeHtml((course.district || '---') + ', ' + (course.province || '---')) + '</p></div>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Dia chi chi tiet</strong></p>' +
        '<p>' + escapeHtml(course.addressDetail || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item" style="margin-bottom:14px">' +
        '<p><strong>Mo ta lop/khoa hoc</strong></p>' +
        '<p>' + escapeHtml(course.description || '---') + '</p>' +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tao luc: ' + formatDateTime(course.createdAt) + '</p>' +
      '</div>';
  }

  function closeTutorDetailModal() {
    tutorDetailModal.classList.add('hidden');
  }

  function openTutorDetailModal() {
    tutorDetailModal.classList.remove('hidden');
  }

  async function showTutorDetail(tutorId) {
    try {
      tutorDetailBody.innerHTML = '<p>Dang tai chi tiet...</p>';
      openTutorDetailModal();
      const [tutor, identity, certificates] = await Promise.all([
        ApiClient.get('/api/admin/tutors/' + encodeURIComponent(tutorId) + '/detail'),
        ApiClient.get('/api/admin/tutors/' + encodeURIComponent(tutorId) + '/identity-verification'),
        ApiClient.get('/api/admin/tutors/' + encodeURIComponent(tutorId) + '/certificates')
      ]);
      renderTutorDetailModal(tutor || {}, identity || {}, Array.isArray(certificates) ? certificates : []);
    } catch (err) {
      tutorDetailBody.innerHTML = '<p>' + escapeHtml(err.message || 'Khong tai duoc chi tiet ho so') + '</p>';
    }
  }

  function showIdentityDetail(verificationId) {
    const identity = (datasets.identity || []).find(function (it) {
      return String(it.id) === String(verificationId);
    });
    if (!identity) {
      alert('Khong tim thay thong tin xac minh danh tinh');
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
      alert('Khong tim thay bai dang');
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
      alert('Khong tim thay lop/khoa hoc');
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
          '<h3 class="card-title">' + escapeHtml(item.fullName || 'Gia su') + '</h3>' +
          '<p class="muted">' + escapeHtml(item.email || '---') + ' â€¢ ' + escapeHtml(item.phone || '---') + '</p>' +
          '<div class="card-actions">' +
            '<span class="muted">' + escapeHtml((item.subjects || []).join(', ') || 'Chua khai bao mon day') + '</span>' +
            '<div class="manage-action-group">' +
              '<button class="btn btn-outline" data-action="detail" data-tutor-id="' + item.tutorId + '">Xem chi tiet</button>' +
              '<button class="btn btn-primary" data-kind="tutor" data-id="' + item.tutorId + '" data-approved="true">Duyet</button>' +
              '<button class="btn btn-outline" data-kind="tutor" data-id="' + item.tutorId + '" data-approved="false">Tu choi</button>' +
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
          '<h3 class="card-title">' + escapeHtml(item.title || 'Bai dang hoc vien') + '</h3>' +
          '<p class="muted">' + escapeHtml(item.province || '---') + ' â€¢ ' + escapeHtml(item.district || '---') + '</p>' +
          '<div class="card-actions">' +
            '<span class="muted">' + (item.budget ? formatVND(item.budget) + '/buoi' : 'Ngan sach thoa thuan') + '</span>' +
            '<div class="manage-action-group">' +
              '<button class="btn btn-outline" data-action="post-detail" data-post-id="' + item.postId + '">Xem chi tiet</button>' +
              '<button class="btn btn-primary" data-kind="post" data-id="' + item.postId + '" data-approved="true">Duyet</button>' +
              '<button class="btn btn-outline" data-kind="post" data-id="' + item.postId + '" data-approved="false">Tu choi</button>' +
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
          '<h3 class="card-title">' + escapeHtml(item.title || 'Khoa hoc gia su') + '</h3>' +
          '<p class="muted">Gia su: ' + escapeHtml(item.tutorName || '---') + '</p>' +
          '<div class="card-actions">' +
            '<span class="muted">' + (item.price ? formatVND(item.price) : 'Hoc phi thoa thuan') + '</span>' +
            '<div class="manage-action-group">' +
              '<button class="btn btn-outline" data-action="course-detail" data-course-id="' + item.courseId + '">Xem chi tiet</button>' +
              '<button class="btn btn-primary" data-kind="course" data-id="' + item.courseId + '" data-approved="true">Duyet</button>' +
              '<button class="btn btn-outline" data-kind="course" data-id="' + item.courseId + '" data-approved="false">Tu choi</button>' +
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
        '<h3 class="card-title">' + escapeHtml(item.userFullName || 'Nguoi dung') + '</h3>' +
        '<p class="muted">Ma xac minh: ' + escapeHtml(item.id || '---') + ' | User ID: ' + escapeHtml(item.userId || '---') + '</p>' +
        '<p class="muted">CCCD/CMND: ' + escapeHtml(item.idNumber || '---') + '</p>' +
        '<div class="card-actions">' +
          '<span class="muted">Gui luc: ' + formatDateTime(item.createdAt) + '</span>' +
          '<div class="manage-action-group">' +
            '<button class="btn btn-outline" data-action="identity-detail" data-identity-id="' + item.id + '">Xem chi tiet</button>' +
            '<button class="btn btn-primary" data-kind="identity" data-id="' + item.id + '" data-approved="true">Duyet</button>' +
            '<button class="btn btn-outline" data-kind="identity" data-id="' + item.id + '" data-approved="false">Tu choi</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderActiveList() {
    const rows = datasets[activeKind] || [];
    titleEl.textContent = sectionTitleByKind[activeKind];
    totalEl.textContent = rows.length + ' muc';

    if (!rows.length) {
      const emptyText = activeKind === 'tutor'
        ? 'Khong co ho so gia su cho duyet.'
        : activeKind === 'post'
          ? 'Khong co bai dang hoc vien cho duyet.'
          : activeKind === 'course'
            ? 'Khong co lop/khoa hoc cho duyet.'
            : 'Khong co xac minh danh tinh cho duyet.';
      listEl.innerHTML = '<div class="mini-item"><p>' + emptyText + '</p></div>';
      return;
    }

    listEl.innerHTML = rows.map(function (item) {
      return renderRow(activeKind, item);
    }).join('');

    listEl.querySelectorAll('button[data-kind][data-id][data-approved]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const kind = btn.getAttribute('data-kind');
        const id = btn.getAttribute('data-id');
        const approved = btn.getAttribute('data-approved') === 'true';
        try {
          await review(kind, id, approved);
        } catch (err) {
          alert(err.message || 'Duyet that bai');
        }
      });
    });

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

  async function review(kind, id, approved) {
    let rejectedReason = null;
    if (!approved) {
      const input = prompt('Nhap ly do tu choi:', '');
      if (input === null) return;
      rejectedReason = input.trim() || 'Khong dat yeu cau';
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
      const [tutors, posts, courses, identities] = await Promise.all([
        ApiClient.get('/api/admin/tutors/pending'),
        ApiClient.get('/api/admin/posts/pending'),
        ApiClient.get('/api/admin/courses/pending'),
        ApiClient.get('/api/admin/identity-verifications/pending')
      ]);
      datasets = {
        tutor: Array.isArray(tutors) ? tutors : [],
        post: Array.isArray(posts) ? posts : [],
        course: Array.isArray(courses) ? courses : [],
        identity: Array.isArray(identities) ? identities : []
      };

      countTutorEl.textContent = String(datasets.tutor.length);
      countPostEl.textContent = String(datasets.post.length);
      countCourseEl.textContent = String(datasets.course.length);
      countIdentityEl.textContent = String(datasets.identity.length);
      renderActiveList();
    } catch (err) {
      listEl.innerHTML = '<div class="mini-item"><p>' + (err.message || 'Khong tai duoc du lieu duyet') + '</p></div>';
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
