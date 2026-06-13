(function () {
  function currentUser() {
    return window.ApiClient && ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
  }

  function hasToken() {
    return Boolean(window.ApiClient && ApiClient.getToken && ApiClient.getToken());
  }

  function roleOf(user) {
    return String(user && user.role || '').toUpperCase();
  }

  function requireRole(role, message) {
    const expected = String(role || '').toUpperCase();
    const user = currentUser();
    if (hasToken() && user && (!expected || roleOf(user) === expected)) {
      return true;
    }

    window.alert(message || 'Bạn cần đăng nhập để sử dụng chức năng này.');
    const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = '/login.html?returnTo=' + returnTo;
    return false;
  }

  window.AuthGuard = {
    requireRole: requireRole,
    requireAdmin: function () { return requireRole('ADMIN', 'Bạn cần đăng nhập tài khoản admin.'); },
    requireTutor: function () { return requireRole('TUTOR', 'Bạn cần đăng nhập tài khoản gia sư.'); },
    requireLearner: function () { return requireRole('LEARNER', 'Bạn cần đăng nhập tài khoản học viên.'); },
    currentUser: currentUser
  };

  window.requireRole = window.requireRole || requireRole;
})();
