(function () {
  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const params = new URLSearchParams(location.search);
  const postId = params.get('id');

  const postHeader = document.getElementById('postHeader');
  const postDescription = document.getElementById('postDescription');
  const postRequirements = document.getElementById('postRequirements');
  const postInfo = document.getElementById('postInfo');
  const sendApplyBtn = document.getElementById('sendApplyBtn');

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function formatMoney(v) {
    const n = Number(v || 0);
    return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
  }

  function formatDate(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return esc(v);
    return d.toLocaleDateString('vi-VN');
  }

  async function loadDetail() {
    if (!postId) {
      postHeader.innerHTML = '<h1>Thiếu mã bài đăng</h1>';
      return;
    }

    try {
      const post = await ApiClient.get(`/api/public/posts/${encodeURIComponent(postId)}`);

      postHeader.innerHTML = `
        <div class="detail-header-badges">
          <span class="badge badge-primary">${esc(post.subject)}</span>
          <span class="badge badge-gray">${esc(post.grade)}</span>
          <span class="badge badge-info">${esc(post.teachingMode)}</span>
          <span class="badge badge-success">Đang mở</span>
        </div>
        <h1 class="detail-header-title">${esc(post.title)}</h1>
        <p class="detail-header-sub">Bài đăng tìm gia sư do phụ huynh / học viên tạo.</p>
        <div class="detail-meta-row">
          <span class="detail-meta-pill"><i class="fas fa-coins"></i> Ngân sách: ${formatMoney(post.budget)} / buổi</span>
          <span class="detail-meta-pill"><i class="fas fa-location-dot"></i> ${esc(post.province || '-')} ${post.district ? ', ' + esc(post.district) : ''}</span>
          <span class="detail-meta-pill"><i class="fas fa-clock"></i> ${esc(post.studyTime || '-')}</span>
        </div>`;

      postDescription.textContent = post.description || 'Chưa có mô tả.';
      postRequirements.textContent = 'Gia sư cần phù hợp môn học, khối lớp và thời gian học.';
      postInfo.innerHTML = `
        <div class="info-item"><strong>Hình thức học</strong><span>${esc(post.teachingMode)}</span></div>
        <div class="info-item"><strong>Khu vực</strong><span>${esc(post.addressDetail || '-')}</span></div>
        <div class="info-item"><strong>Ngày đăng</strong><span>${formatDate(post.createdAt)}</span></div>`;
    } catch (err) {
      postHeader.innerHTML = `<h1>Lỗi tải bài đăng</h1><p>${esc(err.message || 'Không thể tải dữ liệu')}</p>`;
    }
  }

  sendApplyBtn.onclick = async function () {
    const user = ApiClient.getCurrentUser();
    const token = ApiClient.getToken();

    if (!token || !user || String(user.role || '').toUpperCase() !== 'TUTOR') {
      alert('Bạn cần đăng nhập tài khoản gia sư để ứng tuyển.');
      const returnTo = encodeURIComponent(location.pathname + location.search);
      location.href = '/login.html?returnTo=' + returnTo;
      return;
    }

    const expectedFee = Number(document.getElementById('expectedFee').value || 0);
    const message = String(document.getElementById('applyMessage').value || '').trim();

    if (expectedFee <= 0) {
      alert('Vui lòng nhập mức phí đề xuất hợp lệ (> 0).');
      return;
    }
    if (message.length < 10) {
      alert('Lời nhắn tối thiểu 10 ký tự.');
      return;
    }

    try {
      await ApiClient.post(`/api/tutor/posts/${encodeURIComponent(postId)}/apply`, {
        message,
        expectedFee
      });
      alert('Đã gửi ứng tuyển thành công.');
      location.href = '/gia-su/tutor-applications.html';
    } catch (err) {
      alert(err.message || 'Gửi ứng tuyển thất bại.');
    }
  };

  loadDetail();
})();
