(function () {
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function readAuth() {
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!token || !user) return null;
      return { token, user };
    } catch (_) {
      return null;
    }
  }

  function initials(name) {
    const words = String(name || 'U').trim().split(/\s+/).filter(Boolean);
    return ((words[0] && words[0][0]) || 'U') + ((words[1] && words[1][0]) || '');
  }

  function safeDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('vi-VN');
  }

  function roleLabel(role) {
    const r = String(role || '').toUpperCase();
    if (r === 'TUTOR') return 'GIA SƯ';
    if (r === 'LEARNER') return 'HỌC VIÊN';
    if (r === 'ADMIN') return 'QUẢN TRỊ';
    return 'USER';
  }

  function isClassPage(page) {
    return ['lop-gia-su.html', 'bai-dang-phu-huynh.html', 'bai-dang-chi-tiet.html', 'lop-chi-tiet.html'].indexOf(page) >= 0;
  }

  function currentPage() {
    const p = window.location.pathname.split('/').pop();
    return p || 'index.html';
  }

  function isTutorListPage(page) {
    return ['tim-gia-su.html', 'gia-su-profile.html'].indexOf(page) >= 0;
  }

  function normalizeSiteHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const page = currentPage();
    const homeActive = page === 'index.html' ? 'active' : '';
    const tutorActive = isTutorListPage(page) ? 'active' : '';
    const classActive = isClassPage(page) ? 'active' : '';

    const logo = header.querySelector('.logo');
    if (logo) {
      logo.setAttribute('href', '/index.html');
      const brand = logo.querySelector('span');
      if (brand) brand.textContent = 'Gia Sư Việt';
    }

    const desktopNav = header.querySelector('.desktop-nav');
    if (desktopNav) {
      desktopNav.innerHTML = `
        <a href="/index.html" class="${homeActive}">Trang chủ</a>
        <a href="/tim-gia-su.html" class="${tutorActive}">Tìm gia sư</a>
        <div class="nav-dropdown ${classActive}">
          <a href="#" class="nav-dropdown-trigger ${classActive}" aria-haspopup="true" aria-expanded="false">Tìm lớp học <i class="fas fa-chevron-down"></i></a>
          <div class="nav-dropdown-menu">
            <a href="/lop-gia-su.html">Lớp gia sư mở</a>
            <a href="/bai-dang-phu-huynh.html">Lớp phụ huynh đăng</a>
          </div>
        </div>`;

      const trigger = desktopNav.querySelector('.nav-dropdown-trigger');
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
        });
      }
    }

    const mobile = document.getElementById('mobileMenu');
    if (mobile) {
      mobile.innerHTML = `
        <a href="/index.html" class="${homeActive}">Trang chủ</a>
        <a href="/tim-gia-su.html" class="${tutorActive}">Tìm gia sư</a>
        <div class="mobile-submenu">
          <span class="mobile-submenu-title">Tìm lớp học</span>
          <div class="mobile-submenu-links">
            <a href="/lop-gia-su.html">Lớp gia sư mở</a>
            <a href="/bai-dang-phu-huynh.html">Lớp phụ huynh đăng</a>
          </div>
        </div>`;
    }
  }

  function normalizeSiteFooter() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <div class="logo footer-logo">
            <div class="logo-box"><i class="fas fa-graduation-cap"></i></div>
            <span>Gia Sư Việt</span>
          </div>
          <p>Nền tảng kết nối gia sư và học viên toàn quốc.</p>
          <p>Hà Nội, Việt Nam</p>
        </div>
        <div>
          <h3>Đi nhanh</h3>
          <a href="/index.html">Trang chủ</a>
          <a href="/tim-gia-su.html">Tìm gia sư</a>
          <a href="/lop-gia-su.html">Tìm lớp học</a>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <a href="#">Liên hệ</a>
          <a href="#">Điều khoản</a>
          <a href="#">Chính sách bảo mật</a>
        </div>
      </div>
      <div class="footer-bottom">© 2025 Gia Sư Việt. Tất cả quyền được bảo lưu.</div>`;
  }

  window.formatVND = function (value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ';
  };

  window.renderUtilityHeaderRight = function () {
    const auth = readAuth();
    if (!auth) {
      return `
        <div class="auth-buttons">
          <a href="/login.html" class="btn btn-outline-primary">Đăng nhập</a>
          <a href="/login.html?tab=register" class="btn btn-primary">Đăng ký</a>
        </div>`;
    }

    const user = auth.user || {};
    const role = String(user.role || '').toUpperCase();
    const name = esc(user.fullName || 'Người dùng');
    const email = esc(user.email || '');
    const roleText = roleLabel(role);

    const menuByRole = {
      TUTOR: {
        profileHref: '/gia-su/profile.html',
        profileLabel: 'Hồ sơ cá nhân',
        classHref: '/gia-su/quan-ly-lop.html',
        applicationHref: '/gia-su/tutor-applications.html',
        extraHref: '/gia-su/my-classes.html',
        reviewHref: '/gia-su/tutor-reviews.html',
        notificationHref: '/gia-su/tutor-notifications.html',
        classLabel: 'Quản lý lớp đăng',
        applicationLabel: 'Quản lý lớp ứng tuyển',
        extraLabel: 'Quản lý lớp học',
        reviewLabel: 'Đánh giá của tôi',
        notificationLabel: 'Thông báo của tôi'
      },
      LEARNER: {
        profileHref: '/hoc-vien/learner-profile.html',
        profileLabel: 'Hồ sơ cá nhân',
        classHref: '/hoc-vien/learner-posts.html',
        applicationHref: '/hoc-vien/my-classes.html',
        reviewHref: '/hoc-vien/learner-enrollments.html',
        notificationHref: '/hoc-vien/learner-notifications.html',
        classLabel: 'Bài đăng của tôi',
        applicationLabel: 'Lớp học của tôi',
        reviewLabel: 'Đăng ký lớp',
        notificationLabel: 'Thông báo của tôi'
      },
      ADMIN: {
        profileHref: '/admin/admin-dashboard.html',
        profileLabel: 'Dashboard',
        classHref: '/admin/admin-users.html',
        applicationHref: '/admin/admin-reviews.html',
        extraHref: '/admin/admin-lookups.html',
        extraLabel: 'Môn học & khối lớp',
        reviewHref: '',
        notificationHref: '/admin/admin-notifications.html',
        classLabel: 'Quản lý tài khoản',
        applicationLabel: 'Duyệt hệ thống',
        reviewLabel: '',
        notificationLabel: 'Thông báo của tôi'
      }
    };
    const menu = menuByRole[role] || {
      profileHref: '/index.html',
      profileLabel: 'Hồ sơ cá nhân',
      classHref: '/index.html',
      applicationHref: '/index.html',
      extraHref: '',
      reviewHref: '/index.html',
      notificationHref: '/index.html',
      classLabel: 'Tính năng',
      applicationLabel: 'Tính năng',
      extraLabel: '',
      reviewLabel: 'Tính năng',
      notificationLabel: 'Thông báo'
    };

    return `
      <div class="notification-pop">
        <button class="notification-btn" data-toggle="notifications">
          <i class="fas fa-bell"></i>
          <span class="notification-badge hidden" data-notification-badge>0</span>
        </button>
        <div class="dropdown-panel hidden" data-panel="notifications">
          <div class="dropdown-header"><strong>Thông báo</strong><a href="${menu.notificationHref}" class="text-link">Xem tất cả</a></div>
          <div class="notification-quick-list" data-notification-list>
            <div class="dropdown-content">Đang tải thông báo...</div>
          </div>
        </div>
      </div>
      <div class="user-menu-wrap">
        <div class="user-menu-trigger" data-toggle="user-menu">
          <div class="avatar-chip">${esc(initials(name).toUpperCase())}</div>
          <span>${name}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="user-dropdown hidden" data-panel="user-menu">
          <div class="top">
            <h4>${name}</h4>
            <p>${email}</p>
            <span>${roleText}</span>
          </div>
          <a href="${menu.profileHref}"><span><i class="fas fa-user"></i> ${menu.profileLabel || 'Hồ sơ cá nhân'}</span></a>
          <a href="${menu.classHref}"><span><i class="fas fa-book"></i> ${menu.classLabel}</span></a>
          <a href="${menu.applicationHref}"><span><i class="fas fa-paper-plane"></i> ${menu.applicationLabel}</span></a>
          ${menu.extraHref ? `<a href="${menu.extraHref}"><span><i class="fas fa-layer-group"></i> ${menu.extraLabel}</span></a>` : ''}
          ${menu.reviewHref ? `<a href="${menu.reviewHref}"><span><i class="fas fa-star"></i> ${menu.reviewLabel}</span></a>` : ''}
          <a href="${menu.notificationHref}"><span><i class="fas fa-bell"></i> ${menu.notificationLabel}</span></a>
          <button class="danger"><span><i class="fas fa-sign-out-alt"></i> Đăng xuất</span></button>
        </div>
      </div>`;
  };

  window.renderHeaderExtras = function () {
    normalizeSiteHeader();
    normalizeSiteFooter();

    const notificationToggles = document.querySelectorAll('[data-toggle="notifications"]');
    const userToggles = document.querySelectorAll('[data-toggle="user-menu"]');
    const notificationPanels = document.querySelectorAll('[data-panel="notifications"]');
    const userPanels = document.querySelectorAll('[data-panel="user-menu"]');
    const notificationLists = document.querySelectorAll('[data-notification-list]');
    const notificationBadges = document.querySelectorAll('[data-notification-badge]');

    async function loadHeaderNotifications() {
      if (!window.ApiClient || typeof ApiClient.get !== 'function') return;
      if (!ApiClient.getToken || !ApiClient.getToken()) return;
      try {
        const rows = await ApiClient.get('/api/notifications');
        const allRows = Array.isArray(rows) ? rows : [];
        const items = allRows
          .slice()
          .sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); })
          .slice(0, 5);
        const unreadCount = allRows.filter(function (n) { return !n.isRead; }).length;

        notificationBadges.forEach(function (badge) {
          if (unreadCount > 0) {
            badge.textContent = String(unreadCount > 99 ? '99+' : unreadCount);
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        });

        notificationLists.forEach(function (list) {
          if (!items.length) {
            list.innerHTML = '<div class="dropdown-content">Không có thông báo mới.</div>';
            return;
          }
          list.innerHTML = items.map(function (n) {
            return '' +
              '<article class="notification-quick-item">' +
                '<div class="notification-quick-top">' +
                  '<strong>' + esc(n.title || 'Thông báo') + '</strong>' +
                  (!n.isRead ? '<span class="notification-unread-dot" title="Chưa đọc"></span>' : '') +
                '</div>' +
                '<p>' + esc(n.content || '') + '</p>' +
                '<time>' + esc(safeDateTime(n.createdAt)) + '</time>' +
              '</article>';
          }).join('');
        });
      } catch (_) {
        notificationLists.forEach(function (list) {
          list.innerHTML = '<div class="dropdown-content">Không tải được thông báo.</div>';
        });
      }
    }

    notificationToggles.forEach((btn) => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationPanels.forEach((p) => p.classList.toggle('hidden'));
      userPanels.forEach((p) => p.classList.add('hidden'));
      loadHeaderNotifications();
    }));

    userToggles.forEach((btn) => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      userPanels.forEach((p) => p.classList.toggle('hidden'));
      notificationPanels.forEach((p) => p.classList.add('hidden'));
    }));

    document.addEventListener('click', () => {
      notificationPanels.forEach((p) => p.classList.add('hidden'));
      userPanels.forEach((p) => p.classList.add('hidden'));
    });

    const mobile = document.getElementById('mobileMenu');
    const mobileBtn = document.getElementById('mobileMenuButton');
    if (mobile && mobileBtn) {
      mobileBtn.addEventListener('click', () => mobile.classList.toggle('hidden'));
    }

    loadHeaderNotifications();

  };

  document.addEventListener('click', function (e) {
    const logoutBtn = e.target.closest('.user-dropdown .danger');
    if (!logoutBtn) return;
    if (window.ApiClient && typeof ApiClient.clearAuth === 'function') {
      ApiClient.clearAuth();
    }
    localStorage.removeItem('current_tutor_id');
    window.location.href = '/index.html';
  });
})();
