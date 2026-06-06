(function () {
  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  }
  if (typeof renderHeaderExtras === 'function') {
    renderHeaderExtras();
  }

  function q(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function starString(rating) {
    const full = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function statusMeta(status) {
    const map = {
      PENDING: { label: 'Chờ duyệt', cls: 'pending', icon: 'fa-hourglass-half' },
      APPROVED: { label: 'Đã duyệt', cls: 'approved', icon: 'fa-circle-check' },
      REJECTED: { label: 'Bị từ chối', cls: 'rejected', icon: 'fa-circle-xmark' },
      BLOCKED: { label: 'Đã bị khóa', cls: 'rejected', icon: 'fa-ban' }
    };
    return map[status] || { label: safe(status, 'Chưa cập nhật'), cls: 'pending', icon: 'fa-circle-info' };
  }

  function renderOwnerStatus(tutor) {
    const box = document.getElementById('ownerStatusCard');
    if (!box) return;

    const meta = statusMeta(tutor.profileStatus);
    const isRejected = tutor.profileStatus === 'REJECTED';

    box.classList.remove('hidden');
    DomUtils.setHtml(box, `
      <h3 class="detail-sidebar-title">Trạng thái hồ sơ</h3>
      <div class="approval-banner ${meta.cls} mt-12">
        <i class="fas ${meta.icon}"></i>
        <div>
          <strong>${meta.label}</strong>
          <div class="helper-text">${isRejected
            ? 'Bạn cần cập nhật lại hồ sơ theo góp ý để gửi duyệt lại.'
            : 'Đây là trạng thái hiện tại của hồ sơ gia sư của bạn.'}</div>
        </div>
      </div>
      ${isRejected ? `
        <details class="mt-14">
          <summary class="summary-link">Xem lý do và sửa</summary>
          <div class="helper-text mt-10 pre-wrap">${safe(tutor.rejectedReason, 'Chưa có lý do cụ thể từ quản trị viên.')}</div>
          <a href="/gia-su/profile.html#personal-info" class="btn btn-outline-primary mt-12 inline-flex">Sửa hồ sơ</a>
        </details>` : ''}`);
  }

  function renderTutorHeader(t) {
    const avatar = t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullName || 'Tutor')}&background=2563eb&color=fff&size=220`;
    const subjects = (t.subjects || []).join(', ');
    const region = [t.province, t.district].filter(Boolean).join(' - ');

    const profileHeader = document.getElementById('profileHeader');
    if (!profileHeader) return;

    DomUtils.setHtml(profileHeader, `
      <div class="public-profile-header">
        <img src="${safe(avatar, '')}" alt="${safe(t.fullName)}" class="public-profile-avatar" />
        <div class="flex-1">
          <h1 class="public-profile-name">${safe(t.fullName)}</h1>
          <div class="public-profile-sub">${safe(subjects)}</div>
          <div class="public-profile-meta">
            <span class="detail-meta-pill"><i class="fas fa-location-dot"></i> ${safe(region)}</span>
            <span class="detail-meta-pill"><i class="fas fa-chalkboard-teacher"></i> ${safe(t.teachingMode)}</span>
            <span class="detail-meta-pill"><i class="fas fa-star"></i> ${Number(t.averageRating || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>`);

    const tutorIntro = document.getElementById('tutorIntro');
    if (tutorIntro) {
      tutorIntro.textContent = safe(t.description, 'Gia sư chưa cập nhật phần giới thiệu.');
    }

    const ratingOverview = document.getElementById('ratingOverview');
    if (ratingOverview) {
      DomUtils.setHtml(ratingOverview, `
        <div class="rating-summary-box">
          <div class="rating-summary-score">${Number(t.averageRating || 0).toFixed(1)}</div>
          <div class="rating-summary-stars">${starString(t.averageRating)}</div>
          <div class="rating-summary-count">${t.reviewCount || 0} đánh giá</div>
        </div>`);
    }

    const detailInfo = document.getElementById('detailInfo');
    if (detailInfo) {
      DomUtils.setHtml(detailInfo, `
        <div class="info-list">
          <div class="info-item"><strong>Khu vực</strong><span>${safe(region)}</span></div>
          <div class="info-item"><strong>Trình độ</strong><span>${safe(t.qualification)}</span></div>
          <div class="info-item"><strong>Kinh nghiệm</strong><span>${safe(t.experience)}</span></div>
          <div class="info-item"><strong>Hình thức dạy</strong><span>${safe(t.teachingMode)}</span></div>
          <div class="info-item"><strong>Học phí/giờ</strong><span>${t.hourlyRate ? window.formatVND(t.hourlyRate) : 'Chưa cập nhật'}</span></div>
          <div class="info-item"><strong>Các môn dạy</strong><span>${safe((t.subjects || []).join(', '))}</span></div>
          <div class="info-item"><strong>Khối lớp</strong><span>${safe((t.grades || []).join(', '))}</span></div>
        </div>`);
    }
  }

  function renderCourses(courses) {
    const box = document.getElementById('classOfTutor');
    if (!box) return;

    if (!courses.length) {
      DomUtils.setHtml(box, `<div class="empty-state empty-state-sm"><div><h3>Gia sư chưa mở lớp nào.</h3></div></div>`);
      return;
    }

    DomUtils.setHtml(box, courses.map((c) => `
      <article class="class-card">
        <div class="class-card-top">
          <div>
            <div class="class-badge-row">
              <span class="badge badge-primary">${safe(c.subject, '-')}</span>
              <span class="badge badge-gray">${safe(c.grade, '-')}</span>
              <span class="badge badge-success">${safe(c.status, 'OPEN')}</span>
            </div>
            <h3 class="class-title">${safe(c.title, '-')}</h3>
            <div class="class-tutor-sub">${safe(c.studyTime, 'Chưa cập nhật')}</div>
          </div>
        </div>
        <div class="class-card-footer">
          <div class="class-price"><strong>${window.formatVND(c.price || 0)}</strong><span>/ buổi</span></div>
          <a class="btn btn-outline-dark" href="lop-chi-tiet.html?id=${encodeURIComponent(c.courseId)}">Xem chi tiết</a>
        </div>
      </article>
    `).join(''));
  }

  function renderReviews(reviews) {
    const list = document.getElementById('reviewList');
    if (!list) return;

    if (!reviews.length) {
      DomUtils.setHtml(list, `<div class="empty-state empty-state-md"><div><i class="fas fa-star-half-alt"></i><h3>Chưa có đánh giá nào.</h3></div></div>`);
      return;
    }

    DomUtils.setHtml(list, reviews.map((r) => `
      <div class="mini-item">
        <h4>${safe(r.learnerName, 'Học viên')}</h4>
        <p class="rating-stars">${starString(r.rating)} • ${new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
        <p>${safe(r.comment, '(Không có nhận xét)')}</p>
      </div>
    `).join(''));
  }

  async function load() {
    const tutorId = q('id');
    if (!tutorId) {
      const profileHeader = document.getElementById('profileHeader');
      if (profileHeader) {
        DomUtils.setHtml(profileHeader, `<div class="empty-state"><div><h3>Thiếu tutor id</h3></div></div>`);
      }
      return;
    }

    try {
      const myTutor = await ApiClient.get('/api/tutors/me').catch(() => null);
      const isOwner = myTutor && String(myTutor.tutorId) === String(tutorId);
      const tutor = await (isOwner
        ? ApiClient.get(`/api/tutors/${tutorId}`).catch(() => myTutor)
        : ApiClient.get(`/api/tutors/${tutorId}`));

      const [courses, reviews] = await Promise.all([
        ApiClient.get(`/api/public/tutors/${tutorId}/courses`).catch(() => []),
        ApiClient.get(`/api/public/tutors/${tutorId}/reviews`).catch(() => [])
      ]);

      renderTutorHeader(tutor || {});
      renderCourses(ApiClient.asArray(courses));
      renderReviews(ApiClient.asArray(reviews));

      if (isOwner) {
        renderOwnerStatus(myTutor);
      }
    } catch (e) {
      console.error(e);
      const profileHeader = document.getElementById('profileHeader');
      if (profileHeader) {
        DomUtils.setHtml(profileHeader, `<div class="empty-state"><div><h3>Không tải được thông tin gia sư</h3></div></div>`);
      }
    }
  }

  load();
})();
