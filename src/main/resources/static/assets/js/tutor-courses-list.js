(function () {
  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const list = document.getElementById('courseList');
  const countEl = document.getElementById('resultCount');
  if (!list || !countEl) return;

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

  async function loadCourses() {
    try {
      const rows = await ApiClient.get('/api/public/courses');
      const courses = Array.isArray(rows) ? rows : [];
      countEl.textContent = String(courses.length);

      if (!courses.length) {
        list.innerHTML = '<div class="empty-state"><div><i class="fas fa-inbox"></i><h3>Chưa có dữ liệu lớp</h3><p>Hiện chưa có lớp gia sư mở nào.</p></div></div>';
        return;
      }

      list.innerHTML = courses.map((item) => {
        const priceText = formatMoney(item.price);
        const tutorDisplayName = item.tutorName ? esc(item.tutorName) : `gia sư #${esc(item.tutorId)}`;
        return `
          <article class="post-card">
            <div class="post-head">
              <div>
                <div class="manage-badge-row">
                  <span class="badge badge-primary">${esc(item.subject)}</span>
                  <span class="badge badge-gray">${esc(item.teachingMode)}</span>
                  <span class="badge badge-success">${esc(item.status || 'OPEN')}</span>
                </div>
                <h3 class="post-title">${esc(item.title)}</h3>
                <div class="post-sub">Mở bởi ${tutorDisplayName} • ${esc(item.grade)}</div>
              </div>
              <div class="manage-price">${priceText}</div>
            </div>
            <div class="post-grid">
              <div class="manage-meta-item"><strong>Lịch học</strong><span>${esc(item.studyTime || '-')}</span></div>
              <div class="manage-meta-item"><strong>Khu vực</strong><span>${esc(item.province || '-')} ${item.district ? ' - ' + esc(item.district) : ''}</span></div>
              <div class="manage-meta-item"><strong>Số học viên tối đa</strong><span>${esc(item.maxStudents || 0)}</span></div>
              <div class="manage-meta-item"><strong>Ngày đăng</strong><span>${formatDate(item.createdAt)}</span></div>
            </div>
            <div class="post-footer">
              <div class="notice-inline success">Lớp này do gia sư chủ động mở để học viên đăng ký tham gia.</div>
              <a class="btn btn-primary" href="lop-chi-tiet.html?id=${encodeURIComponent(item.courseId)}">Xem chi tiết</a>
            </div>
          </article>`;
      }).join('');
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><div><i class="fas fa-circle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${esc(err.message || 'Không thể tải danh sách lớp.')}</p></div></div>`;
    }
  }

  loadCourses();
})();
