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
  if (headerRight && typeof renderUtilityHeaderRight === 'function') headerRight.innerHTML = renderUtilityHeaderRight();
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  function renderMini(el, rows, mapper, emptyText) {
    if (!rows || !rows.length) {
      el.innerHTML = '<div class="mini-item"><p>' + emptyText + '</p></div>';
      return;
    }
    el.innerHTML = rows.map(mapper).join('');
  }

  async function init() {
    try {
      const [stats, pendingTutors, pendingPosts, pendingCourses] = await Promise.all([
        ApiClient.get('/api/admin/stats'),
        ApiClient.get('/api/admin/tutors/pending'),
        ApiClient.get('/api/admin/posts/pending'),
        ApiClient.get('/api/admin/courses/pending')
      ]);

      document.getElementById('kpiUsers').textContent = String(stats.totalUsers || 0);
      document.getElementById('kpiTutors').textContent = String(stats.totalTutors || 0);
      document.getElementById('kpiPendingPosts').textContent = String(stats.pendingPosts || 0);
      document.getElementById('kpiPendingCourses').textContent = String(stats.pendingCourses || 0);

      renderMini(document.getElementById('pendingTutors'), pendingTutors, function (t) { return '<div class="mini-item"><h4>' + (t.fullName || 'Gia su') + '</h4><p>' + (t.email || '---') + '</p></div>'; }, 'Khong co ho so cho duyet.');
      renderMini(document.getElementById('pendingPosts'), pendingPosts, function (p) { return '<div class="mini-item"><h4>' + (p.title || 'Bai dang') + '</h4><p>' + (p.subject || '---') + ' • ' + (p.grade || '---') + '</p></div>'; }, 'Khong co bai dang cho duyet.');
      renderMini(document.getElementById('pendingCourses'), pendingCourses, function (c) { return '<div class="mini-item"><h4>' + (c.title || 'Khoa hoc') + '</h4><p>' + (c.tutorName || '---') + '</p></div>'; }, 'Khong co khoa hoc cho duyet.');
    } catch (err) {
      document.getElementById('pendingTutors').innerHTML = '<div class="mini-item"><p>' + (err.message || 'Khong tai duoc dashboard admin') + '</p></div>';
    }
  }

  init();
})();
