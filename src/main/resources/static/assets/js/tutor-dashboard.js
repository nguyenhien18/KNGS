(function () {
  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  function toDateTime(v) {
    if (!v) return 'Chưa cập nhật';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString('vi-VN');
  }

  function modeText(v) {
    if (v === 'ONLINE') return 'Online';
    if (v === 'OFFLINE') return 'Offline';
    return 'Online/Offline';
  }

  function profileStatusMeta(status) {
    const s = String(status || 'PENDING');
    if (s === 'APPROVED') return { cls: 'badge-success', label: 'Đã duyệt', msg: 'Hồ sơ gia sư của bạn đang hoạt động bình thường.' };
    if (s === 'REJECTED') return { cls: 'badge-danger', label: 'Bị từ chối', msg: 'Hồ sơ cần cập nhật theo phản hồi từ quản trị viên.' };
    if (s === 'BLOCKED') return { cls: 'badge-danger', label: 'Đang bị khóa', msg: 'Hồ sơ đang bị khóa tạm thời.' };
    return { cls: 'badge-warning', label: 'Chờ duyệt', msg: 'Hồ sơ đang chờ quản trị viên duyệt.' };
  }

  function renderMiniList(el, rows, mapper, emptyText) {
    if (!rows || !rows.length) {
      el.innerHTML = '<div class="mini-item"><p>' + emptyText + '</p></div>';
      return;
    }
    el.innerHTML = rows.map(mapper).join('');
  }

  async function init() {
    try {
      const [postsPage, applications, courses, unreadNotifications, tutorMe] = await Promise.all([
        ApiClient.get('/api/tutor/posts/available', { page: 0, size: 5 }),
        ApiClient.get('/api/tutor/applications'),
        ApiClient.get('/api/tutor/courses'),
        ApiClient.get('/api/notifications', { unreadOnly: true }),
        ApiClient.get('/api/tutors/me')
      ]);

      const posts = Array.isArray(postsPage && postsPage.content) ? postsPage.content : [];
      const pendingApps = (applications || []).filter(function (a) { return a.status === 'PENDING'; });
      const sortedApps = (applications || []).slice().sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      const sortedCourses = (courses || []).slice().sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      document.getElementById('kpiPosts').textContent = String(postsPage && postsPage.totalElements ? postsPage.totalElements : posts.length);
      document.getElementById('kpiPendingApps').textContent = String(pendingApps.length);
      document.getElementById('kpiCourses').textContent = String((courses || []).length);
      document.getElementById('kpiUnreadNoti').textContent = String((unreadNotifications || []).length);

      renderMiniList(
        document.getElementById('availablePosts'),
        posts,
        function (p) {
          return '<div class="mini-item"><h4>' + (p.title || 'Bài đăng') + '</h4><p>' +
            (p.province || '---') + ' • ' + (p.budget ? formatVND(p.budget) + '/buổi' : 'Thỏa thuận') + ' • ' + modeText(p.teachingMode) + '</p></div>';
        },
        'Chưa có bài đăng phù hợp.'
      );

      renderMiniList(
        document.getElementById('recentApplications'),
        sortedApps.slice(0, 5),
        function (a) {
          return '<div class="mini-item"><h4>' + (a.postTitle || 'Ứng tuyển') + '</h4><p>' +
            (a.status || 'PENDING') + ' • ' + toDateTime(a.createdAt) + '</p></div>';
        },
        'Bạn chưa gửi ứng tuyển nào.'
      );

      renderMiniList(
        document.getElementById('recentCourses'),
        sortedCourses.slice(0, 5),
        function (c) {
          return '<div class="mini-item"><h4>' + (c.title || 'Lớp học') + '</h4><p>' +
            (c.status || 'OPEN') + ' • ' + (c.price ? formatVND(c.price) : 'Thỏa thuận') + '</p></div>';
        },
        'Bạn chưa mở lớp nào.'
      );

      const profileMeta = profileStatusMeta(tutorMe && tutorMe.profileStatus);
      const badge = document.getElementById('profileStatusBadge');
      badge.className = 'badge ' + profileMeta.cls;
      badge.textContent = profileMeta.label;
      document.getElementById('profileStatusText').textContent = profileMeta.msg;
    } catch (err) {
      document.getElementById('availablePosts').innerHTML = '<div class="mini-item"><p>Không tải được dữ liệu dashboard.</p></div>';
      document.getElementById('recentApplications').innerHTML = '<div class="mini-item"><p>' + (err.message || 'Lỗi hệ thống') + '</p></div>';
      document.getElementById('recentCourses').innerHTML = '<div class="mini-item"><p>Vui lòng thử lại sau.</p></div>';
    }
  }

  init();
})();
