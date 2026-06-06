(function () {
  UiUtils.renderHeader();

  const params = new URLSearchParams(location.search);
  const courseId = params.get('id');

  const classHeader = document.getElementById('classHeader');
  const classDescription = document.getElementById('classDescription');
  const requirementsContent = document.getElementById('requirementsContent');
  const tutorProfile = document.getElementById('tutorProfile');
  const classInfo = document.getElementById('classInfo');
  const bidSection = document.getElementById('bidSection');

  async function loadDetail() {
    if (!courseId) {
      DomUtils.setHtml(classHeader, '<h1>Thiếu mã lớp</h1>');
      return;
    }

    try {
      const c = await ApiClient.get(`/api/public/courses/${encodeURIComponent(courseId)}`);
      let tutor = null;
      try {
        tutor = await ApiClient.get(`/api/tutors/${encodeURIComponent(c.tutorId)}`);
      } catch (_) {
        tutor = null;
      }

      DomUtils.setHtml(classHeader, `
        <div class="detail-header-badges">
          <span class="badge badge-primary">${esc(c.subject)}</span>
          <span class="badge badge-gray">${esc(c.teachingMode)}</span>
          <span class="badge badge-success">${esc(c.status || 'OPEN')}</span>
        </div>
        <h1 class="detail-header-title">${esc(c.title)}</h1>
        <div class="detail-meta-row">
          <span class="detail-meta-pill"><i class="fas fa-graduation-cap"></i> ${esc(c.grade)}</span>
          <span class="detail-meta-pill"><i class="fas fa-users"></i> Tối đa ${esc(c.maxStudents || 0)} học viên</span>
          <span class="detail-meta-pill"><i class="fas fa-location-dot"></i> ${esc(c.province || '-')} ${c.district ? ', ' + esc(c.district) : ''}</span>
          <span class="detail-meta-pill"><i class="fas fa-calendar"></i> ${formatDate(c.createdAt)}</span>
        </div>
        <div class="class-detail-price">${formatMoney(c.price)} <span class="class-detail-price-unit">/ buổi</span></div>`);

      classDescription.textContent = c.description || 'Chưa có mô tả lớp học.';
      requirementsContent.textContent = 'Học viên đăng ký tham gia lớp theo thông tin và lịch học của gia sư.';

      DomUtils.setHtml(tutorProfile, tutor
        ? `<div class="tutor-mini-card"><div><div class="tutor-mini-name">${esc(tutor.fullName || ('Gia sư #' + c.tutorId))}</div></div></div><a href="gia-su-profile.html?id=${encodeURIComponent(c.tutorId)}" class="btn btn-outline-dark full-btn">Xem hồ sơ chi tiết</a>`
        : `<div class="tutor-mini-card"><div><div class="tutor-mini-name">Gia sư #${esc(c.tutorId)}</div></div></div><a href="gia-su-profile.html?id=${encodeURIComponent(c.tutorId)}" class="btn btn-outline-dark full-btn">Xem hồ sơ chi tiết</a>`);

      DomUtils.setHtml(classInfo, `
        <div class="info-list">
          <div class="info-item"><strong>Thời gian học</strong><span>${esc(c.studyTime || '-')}</span></div>
          <div class="info-item"><strong>Địa chỉ chi tiết</strong><span>${esc(c.addressDetail || '-')}</span></div>
          <div class="info-item"><strong>Đăng ngày</strong><span>${formatDate(c.createdAt)}</span></div>
        </div>`);

      DomUtils.setHtml(bidSection, `
        <div class="bid-box">
          <h2 class="detail-section-title">Đăng ký tham gia lớp</h2>
          <div class="bid-price-box"><strong>${formatMoney(c.price)}</strong><span>Dành cho học viên đăng ký lớp</span></div>
          <div class="form-group">
            <label for="enrollMessageInput">Lời nhắn cho gia sư</label>
            <textarea id="enrollMessageInput" rows="4" maxlength="500" placeholder="Ví dụ: Em muốn đăng ký lớp, mong gia sư hỗ trợ lịch học buổi tối..."></textarea>
          </div>
          <div class="form-actions">
            <button id="enrollBtn" class="btn btn-primary btn-lg"><i class="fas fa-paper-plane"></i> Đăng ký lớp</button>
          </div>
        </div>`);

      const enrollButton = document.getElementById('enrollBtn');
      enrollButton.addEventListener('click', async () => {
        const user = ApiClient.getCurrentUser();
        const token = ApiClient.getToken();
        if (!token || !user || String(user.role || '').toUpperCase() !== 'LEARNER') {
          alert('Bạn cần đăng nhập tài khoản học viên để đăng ký lớp.');
          const returnTo = encodeURIComponent(location.pathname + location.search);
          location.href = '/login.html?returnTo=' + returnTo;
          return;
        }

        try {
          await UiUtils.withButtonLoading(enrollButton, 'Đang xử lý...', async function () {
            const messageInput = document.getElementById('enrollMessageInput');
            const message = messageInput ? String(messageInput.value || '').trim() : '';
            await ApiClient.post(`/api/learner/courses/${encodeURIComponent(courseId)}/enroll`, {
              message: message || null,
              agreedFee: Number(c.price || 0)
            });
          });
          alert('Đăng ký lớp thành công.');
        } catch (err) {
          alert(err.message || 'Đăng ký lớp thất bại.');
        }
      });
    } catch (err) {
      DomUtils.setHtml(classHeader, `<h1>Lỗi tải lớp học</h1><p>${esc(err.message || 'Không thể tải dữ liệu')}</p>`);
    }
  }

  loadDetail();
})();
