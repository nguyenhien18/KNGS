(function () {
  function ensureLearner() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'LEARNER') {
      alert('Bạn cần đăng nhập tài khoản học viên.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname + location.search);
      return false;
    }
    return true;
  }

  if (!ensureLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const fullNameInput = document.getElementById('fullNameInput');
  const emailInput = document.getElementById('emailInput');
  const phoneInput = document.getElementById('phoneInput');
  const birthDateInput = document.getElementById('birthDateInput');
  const genderSelect = document.getElementById('genderSelect');
  const addressInput = document.getElementById('addressInput');
  const statusInput = document.getElementById('statusInput');
  const profileAvatar = document.getElementById('profileAvatar');
  const avatarUpload = document.getElementById('avatarUpload');
  const deleteAvatarButton = document.getElementById('deleteAvatarButton');

  const learnerProfileForm = document.getElementById('learnerProfileForm');
  const learnerPasswordForm = document.getElementById('learnerPasswordForm');
  const learnerIdentityVerificationForm = document.getElementById('learnerIdentityVerificationForm');

  const learnerIdentityStatusInput = document.getElementById('learnerIdentityStatusInput');
  const learnerIdFullNameInput = document.getElementById('learnerIdFullNameInput');
  const learnerIdNumberInput = document.getElementById('learnerIdNumberInput');
  const learnerIdDobInput = document.getElementById('learnerIdDobInput');
  const learnerIdIssuedDateInput = document.getElementById('learnerIdIssuedDateInput');
  const learnerIdIssuedPlaceInput = document.getElementById('learnerIdIssuedPlaceInput');
  const learnerIdAddressInput = document.getElementById('learnerIdAddressInput');
  const learnerIdFrontImageInput = document.getElementById('learnerIdFrontImageInput');
  const learnerIdBackImageInput = document.getElementById('learnerIdBackImageInput');
  const learnerIdSelfieImageInput = document.getElementById('learnerIdSelfieImageInput');
  const learnerIdentityRejectedReasonInput = document.getElementById('learnerIdentityRejectedReasonInput');
  const learnerSaveIdentityDraftBtn = document.getElementById('learnerSaveIdentityDraftBtn');

  const learnerIdFrontFile = document.getElementById('learnerIdFrontFile');
  const learnerIdBackFile = document.getElementById('learnerIdBackFile');
  const learnerIdSelfieFile = document.getElementById('learnerIdSelfieFile');
  const learnerIdFrontPreview = document.getElementById('learnerIdFrontPreview');
  const learnerIdBackPreview = document.getElementById('learnerIdBackPreview');
  const learnerIdSelfiePreview = document.getElementById('learnerIdSelfiePreview');

  let avatarUrl = null;

  function avatarFallback(name) {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'Learner') + '&background=2563eb&color=fff&size=220';
  }

  function statusText(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE') return 'Đang hoạt động';
    if (s === 'BLOCKED') return 'Đã khóa';
    if (s === 'INACTIVE') return 'Không hoạt động';
    return status || '---';
  }

  function identityStatusText(status) {
    const s = String(status || 'NOT_SUBMITTED').toUpperCase();
    if (s === 'NOT_SUBMITTED') return 'Chưa gửi';
    if (s === 'PENDING') return 'Đang chờ duyệt';
    if (s === 'APPROVED') return 'Đã duyệt';
    if (s === 'REJECTED') return 'Bị từ chối';
    return status || '---';
  }

  function setAvatar(url) {
    profileAvatar.src = url || avatarFallback(fullNameInput.value || 'Learner');
  }

  function updatePreview(anchor, url) {
    if (!anchor) return;
    if (!url) {
      anchor.classList.add('hidden');
      anchor.removeAttribute('href');
      return;
    }
    anchor.classList.remove('hidden');
    anchor.href = url;
  }

  async function openProtectedImage(path) {
    const blob = await ApiClient.getBlob(path);
    const objectUrl = URL.createObjectURL(blob);
    const win = window.open(objectUrl, '_blank', 'noopener');
    if (!win) {
      URL.revokeObjectURL(objectUrl);
      throw new Error('Trinh duyet dang chan cua so moi.');
    }
    setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 60000);
  }

  function updateIdentityPreview(anchor, hasValue) {
    if (!anchor) return;
    if (!hasValue) {
      anchor.classList.add('hidden');
      return;
    }
    anchor.classList.remove('hidden');
    anchor.href = '#';
  }

  async function uploadIdentityFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await ApiClient.upload('/api/account/identity-image', form);
    return res && res.url ? res.url : null;
  }

  function bindIdentityUpload(fileInput, textInput, previewAnchor, imageType) {
    if (!fileInput || !textInput) return;
    fileInput.addEventListener('change', async function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const url = await uploadIdentityFile(file);
        if (!url) throw new Error('Upload ảnh thất bại.');
        textInput.value = url;
        updateIdentityPreview(previewAnchor, true);
        alert('Tải ảnh thành công.');
      } catch (err) {
        alert(err.message || 'Không thể tải ảnh.');
      } finally {
        fileInput.value = '';
      }
    });

    textInput.addEventListener('input', function () {
      updateIdentityPreview(previewAnchor, Boolean((textInput.value || '').trim()));
    });

    if (previewAnchor && imageType) {
      previewAnchor.addEventListener('click', async function (event) {
        event.preventDefault();
        if (!(textInput.value || '').trim()) return;
        try {
          await openProtectedImage('/api/account/identity-verification/images/' + encodeURIComponent(imageType));
        } catch (err) {
          alert(err.message || 'Không thể mở ảnh.');
        }
      });
    }
  }

  function applyAccount(account) {
    fullNameInput.value = account.fullName || '';
    emailInput.value = account.email || '';
    phoneInput.value = account.phone || '';
    birthDateInput.value = account.birthDate || '';
    genderSelect.value = account.gender || 'OTHER';
    addressInput.value = account.address || '';
    statusInput.value = statusText(account.status);
    avatarUrl = account.avatar || null;
    setAvatar(avatarUrl);
  }

  function applyIdentity(identity) {
    learnerIdentityStatusInput.value = identityStatusText(identity && identity.status);
    learnerIdFullNameInput.value = (identity && identity.fullNameOnId) || '';
    learnerIdNumberInput.value = (identity && identity.idNumber) || '';
    learnerIdDobInput.value = (identity && identity.dateOfBirthOnId) || '';
    learnerIdIssuedDateInput.value = (identity && identity.issuedDate) || '';
    learnerIdIssuedPlaceInput.value = (identity && identity.issuedPlace) || '';
    learnerIdAddressInput.value = (identity && identity.addressOnId) || '';
    learnerIdFrontImageInput.value = (identity && identity.idFrontImageUrl) || '';
    learnerIdBackImageInput.value = (identity && identity.idBackImageUrl) || '';
    learnerIdSelfieImageInput.value = (identity && identity.selfieImageUrl) || '';
    learnerIdentityRejectedReasonInput.value = (identity && identity.rejectedReason) || '';

    updateIdentityPreview(learnerIdFrontPreview, Boolean(learnerIdFrontImageInput.value));
    updateIdentityPreview(learnerIdBackPreview, Boolean(learnerIdBackImageInput.value));
    updateIdentityPreview(learnerIdSelfiePreview, Boolean(learnerIdSelfieImageInput.value));
  }

  function setTab(tabName) {
    document.querySelectorAll('.profile-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-section') === tabName);
    });
    document.querySelectorAll('.profile-section').forEach(function (section) {
      section.classList.toggle('hidden', section.id !== tabName);
    });
  }

  document.querySelectorAll('.profile-tab').forEach(function (tab) {
    tab.addEventListener('click', function (event) {
      event.preventDefault();
      const section = tab.getAttribute('data-section');
      if (!section) return;
      setTab(section);
      history.replaceState(null, '', '#' + section);
    });
  });

  fullNameInput.addEventListener('input', function () {
    if (!avatarUrl) setAvatar(null);
  });

  avatarUpload.addEventListener('change', async function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await ApiClient.upload('/api/account/avatar', form);
      avatarUrl = (res && res.url) ? res.url : null;
      setAvatar(avatarUrl);
      alert('Tải ảnh đại diện thành công.');
    } catch (err) {
      alert(err.message || 'Không thể tải ảnh đại diện.');
    } finally {
      avatarUpload.value = '';
    }
  });

  deleteAvatarButton.addEventListener('click', function () {
    avatarUrl = null;
    setAvatar(null);
  });

  bindIdentityUpload(learnerIdFrontFile, learnerIdFrontImageInput, learnerIdFrontPreview, 'front');
  bindIdentityUpload(learnerIdBackFile, learnerIdBackImageInput, learnerIdBackPreview, 'back');
  bindIdentityUpload(learnerIdSelfieFile, learnerIdSelfieImageInput, learnerIdSelfiePreview, 'selfie');

  learnerProfileForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const payload = {
      fullName: (fullNameInput.value || '').trim(),
      phone: (phoneInput.value || '').trim() || null,
      birthDate: birthDateInput.value || null,
      gender: genderSelect.value || 'OTHER',
      avatar: avatarUrl,
      address: (addressInput.value || '').trim() || null
    };
    if (!payload.fullName) {
      alert('Vui lòng nhập họ và tên.');
      fullNameInput.focus();
      return;
    }
    try {
      const saved = await ApiClient.patch('/api/account/me', payload);
      applyAccount(saved || payload);
      const currentUser = ApiClient.getCurrentUser ? (ApiClient.getCurrentUser() || {}) : {};
      if (ApiClient.setCurrentUser) {
        ApiClient.setCurrentUser({
          ...currentUser,
          fullName: payload.fullName,
          email: emailInput.value || currentUser.email
        });
      }
      if (headerRight && typeof renderUtilityHeaderRight === 'function') {
        headerRight.innerHTML = renderUtilityHeaderRight();
        if (typeof renderHeaderExtras === 'function') renderHeaderExtras();
      }
      alert('Cập nhật hồ sơ thành công.');
    } catch (err) {
      alert(err.message || 'Không thể cập nhật hồ sơ.');
    }
  });

  learnerPasswordForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const currentPassword = (currentPasswordInput.value || '').trim();
    const newPassword = (newPasswordInput.value || '').trim();
    const confirmPassword = (confirmPasswordInput.value || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng nhập đủ thông tin mật khẩu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Xác nhận mật khẩu mới không khớp.');
      return;
    }
    try {
      await ApiClient.post('/api/account/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      alert('Đổi mật khẩu thành công.');
    } catch (err) {
      alert(err.message || 'Không thể đổi mật khẩu.');
    }
  });

  learnerIdentityVerificationForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    try {
      const payload = {
        fullNameOnId: (learnerIdFullNameInput.value || '').trim() || null,
        idNumber: (learnerIdNumberInput.value || '').trim() || null,
        dateOfBirthOnId: learnerIdDobInput.value || null,
        issuedDate: learnerIdIssuedDateInput.value || null,
        issuedPlace: (learnerIdIssuedPlaceInput.value || '').trim() || null,
        addressOnId: (learnerIdAddressInput.value || '').trim() || null,
        idFrontImageUrl: (learnerIdFrontImageInput.value || '').trim() || null,
        idBackImageUrl: (learnerIdBackImageInput.value || '').trim() || null,
        selfieImageUrl: (learnerIdSelfieImageInput.value || '').trim() || null,
        submit: true
      };
      const saved = await ApiClient.put('/api/account/identity-verification', payload);
      applyIdentity(saved || payload);
      alert('Đã gửi hồ sơ xác minh danh tính.');
    } catch (err) {
      alert(err.message || 'Không thể gửi xác minh danh tính.');
    }
  });

  learnerSaveIdentityDraftBtn.addEventListener('click', async function () {
    try {
      const payload = {
        fullNameOnId: (learnerIdFullNameInput.value || '').trim() || null,
        idNumber: (learnerIdNumberInput.value || '').trim() || null,
        dateOfBirthOnId: learnerIdDobInput.value || null,
        issuedDate: learnerIdIssuedDateInput.value || null,
        issuedPlace: (learnerIdIssuedPlaceInput.value || '').trim() || null,
        addressOnId: (learnerIdAddressInput.value || '').trim() || null,
        idFrontImageUrl: (learnerIdFrontImageInput.value || '').trim() || null,
        idBackImageUrl: (learnerIdBackImageInput.value || '').trim() || null,
        selfieImageUrl: (learnerIdSelfieImageInput.value || '').trim() || null,
        submit: false
      };
      const saved = await ApiClient.put('/api/account/identity-verification', payload);
      applyIdentity(saved || payload);
      alert('Đã lưu nháp xác minh danh tính.');
    } catch (err) {
      alert(err.message || 'Không thể lưu nháp xác minh.');
    }
  });

  (async function init() {
    try {
      const [account, identity] = await Promise.all([
        ApiClient.get('/api/account/me'),
        ApiClient.get('/api/account/identity-verification').catch(() => null)
      ]);
      applyAccount(account || {});
      applyIdentity(identity || {});
      const initialHash = String(location.hash || '').replace('#', '');
      if (initialHash === 'password' || initialHash === 'identity-verification' || initialHash === 'personal-info') {
        setTab(initialHash);
      } else {
        setTab('personal-info');
      }
    } catch (err) {
      alert(err.message || 'Không thể tải hồ sơ.');
    }
  })();
})();
