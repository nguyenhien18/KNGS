(function () {
  UiUtils.renderHeader();
  if (!AuthGuard.requireTutor()) return;

  const keywordInput = document.getElementById('keywordInput');
  const searchBtn = document.getElementById('searchBtn');
  const postsList = document.getElementById('postsList');

  function modeText(v) {
    if (v === 'ONLINE') return 'Online';
    if (v === 'OFFLINE') return 'Offline';
    return 'Online/Offline';
  }

  function dateText(v) {
    return FormatUtils.formatDate(v);
  }

  function render(rows) {
    if (!rows || !rows.length) {
      DomUtils.setHtml(postsList, '<div class="mini-item"><h4>Không có bài đăng</h4><p>Không tìm thấy bài đăng phù hợp.</p></div>');
      return;
    }

    DomUtils.setHtml(postsList, rows.map(function (p) {
      return '' +
        '<div class="post-card">' +
          '<div class="badge-row">' +
            '<span class="badge badge-primary">' + safe(p.subject || '---') + '</span>' +
            '<span class="badge badge-gray">' + safe(p.grade || '---') + '</span>' +
            '<span class="badge badge-success">Đã duyệt</span>' +
          '</div>' +
          '<h3 class="card-title">' + safe(p.title || 'Bài đăng tìm gia sư') + '</h3>' +
          '<p class="muted">' + safe(p.description || 'Không có mô tả') + '</p>' +
          '<div class="info-grid">' +
            '<div class="info-box"><strong>Ngân sách</strong><span>' + (p.budget ? formatVND(p.budget) + '/buổi' : 'Thỏa thuận') + '</span></div>' +
            '<div class="info-box"><strong>Khu vực</strong><span>' + safe([p.province, p.district].filter(Boolean).join(', ') || '---') + '</span></div>' +
            '<div class="info-box"><strong>Hình thức</strong><span>' + modeText(p.teachingMode) + '</span></div>' +
            '<div class="info-box"><strong>Thời gian</strong><span>' + safe(p.studyTime || '---') + '</span></div>' +
          '</div>' +
          '<div class="card-actions"><span class="muted">Đăng: ' + safe(dateText(p.createdAt)) + '</span><a class="btn btn-primary" href="/bai-dang-chi-tiet.html?id=' + encodeURIComponent(p.postId) + '">Xem chi tiết</a></div>' +
        '</div>';
    }).join(''));
  }

  async function load() {
    try {
      const keyword = (keywordInput.value || '').trim();
      const page = await ApiClient.get('/api/tutor/posts/available', {
        keyword: keyword || undefined,
        page: 0,
        size: 50
      });
      render((page && page.content) || []);
    } catch (err) {
      DomUtils.setHtml(postsList, '<div class="mini-item"><h4>Lỗi tải dữ liệu</h4><p>' + safe(err.message || 'Vui lòng thử lại sau') + '</p></div>');
    }
  }

  searchBtn.addEventListener('click', load);
  keywordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      load();
    }
  });

  load();
})();
