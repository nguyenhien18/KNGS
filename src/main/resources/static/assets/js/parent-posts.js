(function () {
  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const list = document.getElementById('postList');
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

  function resolvePageItems(page) {
    if (page && Array.isArray(page.items)) return page.items;
    if (page && Array.isArray(page.content)) return page.content;
    return [];
  }

  async function loadPosts() {
    try {
      const page = await ApiClient.get('/api/public/posts', { page: 0, size: 50 });
      const posts = resolvePageItems(page);
      countEl.textContent = String(posts.length);

      if (!posts.length) {
        list.innerHTML = '<div class="empty-state"><div><i class="fas fa-inbox"></i><h3>Chưa có bài đăng</h3><p>Hiện chưa có bài đăng phụ huynh/học viên nào.</p></div></div>';
        return;
      }

      list.innerHTML = posts.map((item) => `
        <article class="post-card">
          <div class="post-head">
            <div>
              <div class="manage-badge-row">
                <span class="badge badge-primary">${esc(item.subject)}</span>
                <span class="badge badge-gray">${esc(item.grade)}</span>
                <span class="badge badge-info">${esc(item.teachingMode)}</span>
                <span class="badge badge-success">Đang mở</span>
              </div>
              <h3 class="post-title">${esc(item.title)}</h3>
              <div class="post-sub">${esc(item.province || '-')} ${item.district ? ', ' + esc(item.district) : ''}</div>
            </div>
            <div class="manage-price">${formatMoney(item.budget)} / buổi</div>
          </div>
          <div class="post-grid">
            <div class="manage-meta-item"><strong>Thời gian học</strong><span>${esc(item.studyTime || '-')}</span></div>
            <div class="manage-meta-item"><strong>Địa điểm</strong><span>${esc(item.addressDetail || '-')}</span></div>
            <div class="manage-meta-item"><strong>Ngày đăng</strong><span>${formatDate(item.createdAt)}</span></div>
          </div>
          <div class="post-footer">
            <div class="notice-inline warn">Gia sư có thể ứng tuyển bằng cách gửi lời nhắn và mức phí mong muốn.</div>
            <a class="btn btn-primary" href="bai-dang-chi-tiet.html?id=${encodeURIComponent(item.postId)}">Xem chi tiết & ứng tuyển</a>
          </div>
        </article>`).join('');
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><div><i class="fas fa-circle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${esc(err.message || 'Không thể tải danh sách bài đăng.')}</p></div></div>`;
    }
  }

  loadPosts();
})();

