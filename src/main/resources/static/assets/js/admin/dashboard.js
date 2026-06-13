(function () {
  if (!AuthGuard.requireAdmin()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  function renderMini(el, rows, mapper, emptyText) {
    if (!rows || !rows.length) {
      DomUtils.setHtml(el, '<div class="mini-item"><p>' + safe(emptyText) + '</p></div>');
      return;
    }
    DomUtils.setHtml(el, rows.map(mapper).join(''));
  }

  async function init() {
    try {
      const pageParams = { page: 0, size: 10 };
      const [stats, pendingTutors, pendingPosts, pendingCourses] = await Promise.all([
        ApiClient.get('/api/admin/stats'),
        ApiClient.get('/api/admin/tutors/pending', pageParams),
        ApiClient.get('/api/admin/posts/pending', pageParams),
        ApiClient.get('/api/admin/courses/pending', pageParams)
      ]);

      document.getElementById('kpiUsers').textContent = String(stats.totalUsers || 0);
      document.getElementById('kpiTutors').textContent = String(stats.totalTutors || 0);
      document.getElementById('kpiPendingPosts').textContent = String(stats.pendingPosts || 0);
      document.getElementById('kpiPendingCourses').textContent = String(stats.pendingCourses || 0);

      renderMini(document.getElementById('pendingTutors'), ApiClient.asArray(pendingTutors), function (t) { return '<div class="mini-item"><h4>' + safe(t.fullName || 'Gia sư') + '</h4><p>' + safe(t.email || '---') + '</p></div>'; }, 'Không có hồ sơ chờ duyệt.');
      renderMini(document.getElementById('pendingPosts'), ApiClient.asArray(pendingPosts), function (p) { return '<div class="mini-item"><h4>' + safe(p.title || 'Bài đăng') + '</h4><p>' + safe(p.subject || '---') + ' • ' + safe(p.grade || '---') + '</p></div>'; }, 'Không có bài đăng chờ duyệt.');
      renderMini(document.getElementById('pendingCourses'), ApiClient.asArray(pendingCourses), function (c) { return '<div class="mini-item"><h4>' + safe(c.title || 'Khóa học') + '</h4><p>' + safe(c.tutorName || '---') + '</p></div>'; }, 'Không có khóa học chờ duyệt.');
    } catch (err) {
      DomUtils.setHtml(document.getElementById('pendingTutors'), '<div class="mini-item"><p>' + safe(err.message || 'Không tải được dashboard admin') + '</p></div>');
    }
  }

  init();
})();
