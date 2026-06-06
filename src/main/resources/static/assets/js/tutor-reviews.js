(function () {
  if (!AuthGuard.requireTutor()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const listEl = document.getElementById('reviewList');
  const avgEl = document.getElementById('avgRating');
  const starsEl = document.getElementById('avgStars');
  const totalEl = document.getElementById('totalReviews');

  const query = new URLSearchParams(window.location.search);
  const filterClassId = query.get('classId');
  const filterCourseId = query.get('courseId');

  function ensureTutorAuth() {
    if (!window.ApiClient || !ApiClient.getToken || !ApiClient.getToken()) {
      alert('Bạn cần đăng nhập tài khoản gia sư để sử dụng chức năng này.');
      const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
      location.href = '/login.html?returnTo=' + returnTo;
      return false;
    }
    return true;
  }

  function renderStars(value) {
    const v = Math.max(0, Math.min(5, Number(value || 0)));
    const full = Math.round(v);
    return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function filterReviews(rows) {
    let data = rows;
    if (filterClassId) {
      data = data.filter((r) => String(r.matchedClassId || '') === String(filterClassId));
    }
    if (filterCourseId) {
      data = data.filter((r) => String(r.courseId || '') === String(filterCourseId));
    }
    return data;
  }

  function sourceLabel(review) {
    if (review.postTitle) return 'Lớp từ bài đăng: ' + review.postTitle;
    if (review.courseTitle) return 'Lớp gia sư mở: ' + review.courseTitle;
    return 'Đánh giá lớp học';
  }

  function render(reviews) {
    const count = reviews.length;
    const avg = count ? reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / count : 0;

    avgEl.textContent = avg.toFixed(1);
    starsEl.textContent = renderStars(avg);
    totalEl.textContent = count + ' đánh giá';

    if (!count) {
      DomUtils.setHtml(listEl, '<div class="card-box empty-state"><div><i class="fas fa-star-half-alt"></i><h3>Chưa có đánh giá</h3><p>Đánh giá từ học viên sẽ hiển thị tại đây.</p></div></div>');
      return;
    }

    DomUtils.setHtml(listEl, reviews.map((review) =>
      '<div class="card-box"><div class="mini-item mini-item-plain">'
      + '<h4>' + escapeHtml(review.learnerName || 'Học viên') + '</h4>'
      + '<p class="rating-stars">' + renderStars(review.rating) + ' • ' + formatDate(review.createdAt) + '</p>'
      + '<p class="muted">' + escapeHtml(sourceLabel(review)) + '</p>'
      + '<p>' + escapeHtml(review.comment || '(Không có nhận xét)') + '</p>'
      + '</div></div>'
    ).join(''));
  }

  (async function init() {
    if (!ensureTutorAuth()) return;
    try {
      const rows = await ApiClient.get('/api/tutor/reviews');
      const reviews = filterReviews(ApiClient.asArray(rows));
      render(reviews);
    } catch (err) {
      alert(err.message || 'Không tải được danh sách đánh giá.');
    }
  })();
})();
