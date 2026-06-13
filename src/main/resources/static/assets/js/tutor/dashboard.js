(function () {
  UiUtils.renderHeader();
  if (!AuthGuard.requireTutor()) return;

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
      DomUtils.setHtml(el, '<div class="mini-item"><p>' + safe(emptyText) + '</p></div>');
      return;
    }
    DomUtils.setHtml(el, rows.map(mapper).join(''));
  }

  async function init() {
    try {
      const pageSize = 10;
      const [postsPage, applications, pendingApplications, courses, unreadNotifications, tutorMe] = await Promise.all([
        ApiClient.get('/api/tutor/posts/available', { page: 0, size: pageSize }),
        ApiClient.get('/api/tutor/applications', { page: 0, size: pageSize }),
        ApiClient.get('/api/tutor/applications', { status: 'PENDING', page: 0, size: pageSize }),
        ApiClient.get('/api/tutor/courses', { page: 0, size: pageSize }),
        ApiClient.get('/api/notifications', { unreadOnly: true, page: 0, size: pageSize }),
        ApiClient.get('/api/tutors/me')
      ]);

      const posts = Array.isArray(postsPage && postsPage.content) ? postsPage.content : [];
      const applicationRows = ApiClient.asArray(applications);
      const courseRows = ApiClient.asArray(courses);
      const unreadRows = ApiClient.asArray(unreadNotifications);
      const pendingApps = ApiClient.asArray(pendingApplications);
      const sortedApps = applicationRows.slice().sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      const sortedCourses = courseRows.slice().sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      document.getElementById('kpiPosts').textContent = String(postsPage && postsPage.totalElements ? postsPage.totalElements : posts.length);
      document.getElementById('kpiPendingApps').textContent = String(pendingApplications && pendingApplications.totalElements != null ? pendingApplications.totalElements : pendingApps.length);
      document.getElementById('kpiCourses').textContent = String(courses && courses.totalElements != null ? courses.totalElements : courseRows.length);
      document.getElementById('kpiUnreadNoti').textContent = String(unreadNotifications && unreadNotifications.totalElements != null ? unreadNotifications.totalElements : unreadRows.length);

      renderMiniList(
        document.getElementById('availablePosts'),
        posts,
        function (p) {
          return '<div class="mini-item"><h4>' + safe(p.title || 'Bài đăng') + '</h4><p>' +
            safe(p.province || '---') + ' • ' + (p.budget ? formatVND(p.budget) + '/buổi' : 'Thỏa thuận') + ' • ' + modeText(p.teachingMode) + '</p></div>';
        },
        'Chưa có bài đăng phù hợp.'
      );

      renderMiniList(
        document.getElementById('recentApplications'),
        sortedApps.slice(0, 5),
        function (a) {
          return '<div class="mini-item"><h4>' + safe(a.postTitle || 'Ứng tuyển') + '</h4><p>' +
            safe(a.status || 'PENDING') + ' • ' + safe(toDateTime(a.createdAt)) + '</p></div>';
        },
        'Bạn chưa gửi ứng tuyển nào.'
      );

      renderMiniList(
        document.getElementById('recentCourses'),
        sortedCourses.slice(0, 5),
        function (c) {
          return '<div class="mini-item"><h4>' + safe(c.title || 'Lớp học') + '</h4><p>' +
            safe(c.status || 'OPEN') + ' • ' + (c.price ? formatVND(c.price) : 'Thỏa thuận') + '</p></div>';
        },
        'Bạn chưa mở lớp nào.'
      );

      const profileMeta = profileStatusMeta(tutorMe && tutorMe.profileStatus);
      const badge = document.getElementById('profileStatusBadge');
      badge.className = 'badge ' + profileMeta.cls;
      badge.textContent = profileMeta.label;
      document.getElementById('profileStatusText').textContent = profileMeta.msg;
    } catch (err) {
      DomUtils.setHtml(document.getElementById('availablePosts'), '<div class="mini-item"><p>Không tải được dữ liệu dashboard.</p></div>');
      DomUtils.setHtml(document.getElementById('recentApplications'), '<div class="mini-item"><p>' + safe(err.message || 'Lỗi hệ thống') + '</p></div>');
      DomUtils.setHtml(document.getElementById('recentCourses'), '<div class="mini-item"><p>Vui lòng thử lại sau.</p></div>');
    }
  }

  init();
})();
