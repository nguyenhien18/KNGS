(function () {
  const escapeHtml = FormatUtils.escapeHtml;
  const formatDateTime = FormatUtils.formatDateTime;

  const sectionTitleByKind = {
    tutor: 'Hồ sơ gia sư chờ duyệt',
    post: 'Bài đăng học viên chờ duyệt',
    course: 'Lớp/khóa học gia sư chờ duyệt',
    identity: 'Xác minh danh tính chờ duyệt'
  };

  function statusBadgeLabel(kind) {
    if (kind === 'tutor') return 'PENDING PROFILE';
    if (kind === 'post') return 'PENDING POST';
    if (kind === 'course') return 'PENDING COURSE';
    return 'PENDING IDENTITY';
  }

  function statusBadgeClass(status) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'badge-success';
    if (normalized === 'REJECTED') return 'badge-danger';
    if (normalized === 'PENDING') return 'badge-warning';
    return 'badge-gray';
  }

  function emptyText(kind) {
    if (kind === 'tutor') return 'Không có hồ sơ gia sư chờ duyệt.';
    if (kind === 'post') return 'Không có bài đăng học viên chờ duyệt.';
    if (kind === 'course') return 'Không có lớp/khóa học chờ duyệt.';
    return 'Không có xác minh danh tính chờ duyệt.';
  }

  function renderTutorRow(item) {
    return '' +
      '<div class="post-card">' +
        '<div class="badge-row">' +
          '<span class="badge badge-warning">' + statusBadgeLabel('tutor') + '</span>' +
          '<span class="badge badge-gray">' + escapeHtml(item.teachingMode || 'BOTH') + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.fullName || 'Gia sư') + '</h3>' +
        '<p class="muted">' + escapeHtml(item.email || '---') + ' • ' + escapeHtml(item.phone || '---') + '</p>' +
        '<div class="card-actions">' +
          '<span class="muted">' + escapeHtml((item.subjects || []).join(', ') || 'Chưa khai báo môn dạy') + '</span>' +
          '<div class="manage-action-group">' +
            '<button class="btn btn-outline" data-action="detail" data-tutor-id="' + escapeHtml(item.tutorId) + '">Xem chi tiết</button>' +
            '<button class="btn btn-primary" data-kind="tutor" data-id="' + escapeHtml(item.tutorId) + '" data-approved="true">Duyệt</button>' +
            '<button class="btn btn-outline" data-kind="tutor" data-id="' + escapeHtml(item.tutorId) + '" data-approved="false">Từ chối</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderPostRow(item) {
    return '' +
      '<div class="post-card">' +
        '<div class="badge-row">' +
          '<span class="badge badge-warning">' + statusBadgeLabel('post') + '</span>' +
          '<span class="badge badge-gray">' + escapeHtml(item.subject || '---') + '</span>' +
          '<span class="badge badge-gray">' + escapeHtml(item.grade || '---') + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.title || 'Bài đăng học viên') + '</h3>' +
        '<p class="muted">' + escapeHtml(item.province || '---') + ' • ' + escapeHtml(item.district || '---') + '</p>' +
        '<div class="card-actions">' +
          '<span class="muted">' + (item.budget ? formatVND(item.budget) + '/buổi' : 'Ngân sách thỏa thuận') + '</span>' +
          '<div class="manage-action-group">' +
            '<button class="btn btn-outline" data-action="post-detail" data-post-id="' + escapeHtml(item.postId) + '">Xem chi tiết</button>' +
            '<button class="btn btn-primary" data-kind="post" data-id="' + escapeHtml(item.postId) + '" data-approved="true">Duyệt</button>' +
            '<button class="btn btn-outline" data-kind="post" data-id="' + escapeHtml(item.postId) + '" data-approved="false">Từ chối</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderCourseRow(item) {
    return '' +
      '<div class="post-card">' +
        '<div class="badge-row">' +
          '<span class="badge badge-warning">' + statusBadgeLabel('course') + '</span>' +
          '<span class="badge badge-gray">' + escapeHtml(item.subject || '---') + '</span>' +
          '<span class="badge badge-gray">' + escapeHtml(item.grade || '---') + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.title || 'Khóa học gia sư') + '</h3>' +
        '<p class="muted">Gia sư: ' + escapeHtml(item.tutorName || '---') + '</p>' +
        '<div class="card-actions">' +
          '<span class="muted">' + (item.price ? formatVND(item.price) : 'Học phí thỏa thuận') + '</span>' +
          '<div class="manage-action-group">' +
            '<button class="btn btn-outline" data-action="course-detail" data-course-id="' + escapeHtml(item.courseId) + '">Xem chi tiết</button>' +
            '<button class="btn btn-primary" data-kind="course" data-id="' + escapeHtml(item.courseId) + '" data-approved="true">Duyệt</button>' +
            '<button class="btn btn-outline" data-kind="course" data-id="' + escapeHtml(item.courseId) + '" data-approved="false">Từ chối</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderIdentityRow(item) {
    return '' +
      '<div class="post-card">' +
        '<div class="badge-row">' +
          '<span class="badge badge-warning">' + statusBadgeLabel('identity') + '</span>' +
          '<span class="badge ' + statusBadgeClass(item.status) + '">' + escapeHtml(item.status || 'PENDING') + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.userFullName || 'Người dùng') + '</h3>' +
        '<p class="muted">Mã xác minh: ' + escapeHtml(item.id || '---') + ' | User ID: ' + escapeHtml(item.userId || '---') + '</p>' +
        '<p class="muted">CCCD/CMND: ' + escapeHtml(item.idNumber || '---') + '</p>' +
        '<div class="card-actions">' +
          '<span class="muted">Gửi lúc: ' + formatDateTime(item.createdAt) + '</span>' +
          '<div class="manage-action-group">' +
            '<button class="btn btn-outline" data-action="identity-detail" data-identity-id="' + escapeHtml(item.id) + '">Xem chi tiết</button>' +
            '<button class="btn btn-primary" data-kind="identity" data-id="' + escapeHtml(item.id) + '" data-approved="true">Duyệt</button>' +
            '<button class="btn btn-outline" data-kind="identity" data-id="' + escapeHtml(item.id) + '" data-approved="false">Từ chối</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderRow(kind, item) {
    if (kind === 'tutor') return renderTutorRow(item);
    if (kind === 'post') return renderPostRow(item);
    if (kind === 'course') return renderCourseRow(item);
    return renderIdentityRow(item);
  }

  window.AdminReviewList = {
    emptyText: emptyText,
    renderRow: renderRow,
    sectionTitleByKind: sectionTitleByKind,
    statusBadgeClass: statusBadgeClass
  };
})();
