(function () {
  const escapeHtml = FormatUtils.escapeHtml;
  const formatDateTime = FormatUtils.formatDateTime;

  function setHtml(element, html) {
    if (!element) return;
    DomUtils.setHtml(element, html);
  }

  function statusBadgeClass(status) {
    return AdminReviewList.statusBadgeClass(status);
  }

  function renderCertificateList(certificates) {
    if (!Array.isArray(certificates) || !certificates.length) {
      return '<p class="muted">Chưa có bằng cấp.</p>';
    }
    return certificates.map(function (certificate) {
      const rawUrl = String(
        certificate.certificateImageUrl
        || certificate.certificateImageURL
        || certificate.imageUrl
        || certificate.url
        || ''
      ).trim();
      const hasImage = rawUrl && rawUrl.toLowerCase() !== 'null' && rawUrl.toLowerCase() !== 'undefined';
      const image = hasImage
        ? '<button type="button" class="btn btn-soft js-open-cert-image" data-certificate-url="' + escapeHtml(rawUrl) + '">Xem ảnh bằng cấp</button>'
        : '<span class="muted">Không có ảnh</span>';
      return '' +
        '<div class="mini-item mini-item-mb-10">' +
          '<p><strong>' + escapeHtml(certificate.title || 'Bằng cấp') + '</strong></p>' +
          '<div>' + image + '</div>' +
        '</div>';
    }).join('');
  }

  function bindCertificateImages(container) {
    container.querySelectorAll('.js-open-cert-image').forEach(function (button) {
      button.addEventListener('click', function () {
        AdminImageLightbox.open(
          button.getAttribute('data-certificate-url'),
          'Ảnh bằng cấp không hợp lệ hoặc không phải URL Cloudinary.'
        );
      });
    });
  }

  function bindIdentityImages(container) {
    container.querySelectorAll('.js-open-identity-image').forEach(function (button) {
      button.addEventListener('click', function () {
        AdminImageLightbox.open(
          button.getAttribute('data-url'),
          'Ảnh xác minh không hợp lệ hoặc không phải URL Cloudinary.'
        );
      });
    });
  }

  function renderTutor(container, titleEl, tutor, identity, certificates) {
    titleEl.textContent = 'Chi tiết hồ sơ gia sư';
    setHtml(container, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Họ tên</strong></p><p>' + escapeHtml(tutor.fullName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Email</strong></p><p>' + escapeHtml(tutor.email || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Số điện thoại</strong></p><p>' + escapeHtml(tutor.phone || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vực</strong></p><p>' + escapeHtml((tutor.district || '---') + ', ' + (tutor.province || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hình thức dạy</strong></p><p>' + escapeHtml(tutor.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Mức giá</strong></p><p>' + (tutor.hourlyRate ? formatVND(tutor.hourlyRate) + '/giờ' : 'Thỏa thuận') + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Mô tả</strong></p><p>' + escapeHtml(tutor.description || 'Chưa cập nhật') + '</p></div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Môn dạy / Khối lớp</strong></p>' +
        '<p>' + escapeHtml((tutor.subjects || []).join(', ') || 'Chưa khai báo môn dạy') + '</p>' +
        '<p class="muted">' + escapeHtml((tutor.grades || []).join(', ') || 'Chưa khai báo khối lớp') + '</p>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Xác minh danh tính</strong> <span class="badge ' + statusBadgeClass(identity.status) + '">' + escapeHtml(identity.status || 'NOT_SUBMITTED') + '</span></p>' +
        '<p class="muted">CCCD/CMND: ' + escapeHtml(identity.idNumber || '---') + ' | Họ tên trên giấy tờ: ' + escapeHtml(identity.fullNameOnId || '---') + '</p>' +
        '<p class="muted">Ngày tạo: ' + formatDateTime(identity.createdAt) + '</p>' +
      '</div>' +
      '<div class="mini-item"><p><strong>Bằng cấp</strong></p>' + renderCertificateList(certificates) + '</div>');

    bindCertificateImages(container);
  }

  function renderIdentity(container, titleEl, identity) {
    titleEl.textContent = 'Chi tiết xác minh danh tính';
    function imgButton(imageUrl, label) {
      if (!imageUrl) return '<p class="muted">' + label + ': Chưa có ảnh</p>';
      return '<p><button type="button" class="btn btn-soft js-open-identity-image" data-url="' + escapeHtml(imageUrl) + '">' + label + '</button></p>';
    }

    setHtml(container, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Họ tên người dùng</strong></p><p>' + escapeHtml(identity.userFullName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Trạng thái</strong></p><p><span class="badge ' + statusBadgeClass(identity.status) + '">' + escapeHtml(identity.status || 'PENDING') + '</span></p></div>' +
        '<div class="mini-item"><p><strong>Họ tên trên giấy tờ</strong></p><p>' + escapeHtml(identity.fullNameOnId || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Số CCCD/CMND</strong></p><p>' + escapeHtml(identity.idNumber || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngày sinh</strong></p><p>' + escapeHtml(identity.dateOfBirthOnId || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngày cấp</strong></p><p>' + escapeHtml(identity.issuedDate || '---') + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Nơi cấp</strong></p><p>' + escapeHtml(identity.issuedPlace || '---') + '</p></div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Địa chỉ trên giấy tờ</strong></p><p>' + escapeHtml(identity.addressOnId || '---') + '</p></div>' +
      '<div class="mini-item mini-item-mb-14">' +
        '<p><strong>Ảnh giấy tờ</strong></p>' +
        imgButton(identity.idFrontImageUrl, 'Xem ảnh mặt trước') +
        imgButton(identity.idBackImageUrl, 'Xem ảnh mặt sau') +
        imgButton(identity.selfieImageUrl, 'Xem ảnh selfie') +
      '</div>' +
      '<div class="mini-item">' +
        '<p class="muted">Tạo lúc: ' + formatDateTime(identity.createdAt) + '</p>' +
        '<p class="muted">Cập nhật lúc: ' + formatDateTime(identity.updatedAt) + '</p>' +
      '</div>');

    bindIdentityImages(container);
  }

  function renderPost(container, titleEl, post) {
    titleEl.textContent = 'Chi tiết bài đăng học viên';
    setHtml(container, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Tiêu đề</strong></p><p>' + escapeHtml(post.title || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Môn học / Khối lớp</strong></p><p>' + escapeHtml((post.subject || '---') + ' / ' + (post.grade || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hình thức dạy</strong></p><p>' + escapeHtml(post.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Thời gian học</strong></p><p>' + escapeHtml(post.studyTime || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Ngân sách</strong></p><p>' + (post.budget ? formatVND(post.budget) + '/buổi' : 'Thỏa thuận') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vực</strong></p><p>' + escapeHtml((post.district || '---') + ', ' + (post.province || '---')) + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Địa chỉ chi tiết</strong></p><p>' + escapeHtml(post.addressDetail || '---') + '</p></div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Mô tả nhu cầu</strong></p><p>' + escapeHtml(post.description || '---') + '</p></div>' +
      '<div class="mini-item"><p class="muted">Tạo lúc: ' + formatDateTime(post.createdAt) + '</p></div>');
  }

  function renderCourse(container, titleEl, course) {
    titleEl.textContent = 'Chi tiết lớp/khóa học gia sư';
    setHtml(container, '' +
      '<div class="detail-grid detail-grid-2">' +
        '<div class="mini-item"><p><strong>Tiêu đề</strong></p><p>' + escapeHtml(course.title || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Gia sư</strong></p><p>' + escapeHtml(course.tutorName || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Môn học / Khối lớp</strong></p><p>' + escapeHtml((course.subject || '---') + ' / ' + (course.grade || '---')) + '</p></div>' +
        '<div class="mini-item"><p><strong>Hình thức dạy</strong></p><p>' + escapeHtml(course.teachingMode || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Lịch học</strong></p><p>' + escapeHtml(course.studyTime || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Học phí</strong></p><p>' + (course.price ? formatVND(course.price) : 'Thỏa thuận') + '</p></div>' +
        '<div class="mini-item"><p><strong>Số học viên tối đa</strong></p><p>' + escapeHtml(course.maxStudents || '---') + '</p></div>' +
        '<div class="mini-item"><p><strong>Khu vực</strong></p><p>' + escapeHtml((course.district || '---') + ', ' + (course.province || '---')) + '</p></div>' +
      '</div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Địa chỉ chi tiết</strong></p><p>' + escapeHtml(course.addressDetail || '---') + '</p></div>' +
      '<div class="mini-item mini-item-mb-14"><p><strong>Mô tả lớp/khóa học</strong></p><p>' + escapeHtml(course.description || '---') + '</p></div>' +
      '<div class="mini-item"><p class="muted">Tạo lúc: ' + formatDateTime(course.createdAt) + '</p></div>');
  }

  window.AdminReviewDetail = {
    renderCourse: renderCourse,
    renderIdentity: renderIdentity,
    renderPost: renderPost,
    renderTutor: renderTutor
  };
})();
