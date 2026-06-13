(function () {
  UiUtils.renderHeader();

  if (!AuthGuard.requireTutor()) return;

  const certificateManager = window.ProfileCertificates || {
    init: function () {},
    apply: function () {},
    getPayload: function () { return []; }
  };
  const identityManager = window.ProfileIdentity || {
    init: function () {},
    apply: function () {}
  };

  const personalForm = document.querySelector('#personal-info form');
  const passwordForm = document.querySelector('#password form');

  const profileAvatar = document.getElementById('profileAvatar');
  const avatarUpload = document.getElementById('avatarUpload');
  const deleteAvatarButton = document.getElementById('deleteAvatarButton');
  const fullNameInput = document.getElementById('fullNameInput');
  const emailInput = document.getElementById('emailInput');
  const phoneInput = document.getElementById('phoneInput');
  const birthDateInput = document.getElementById('birthDateInput');
  const genderSelect = document.getElementById('genderSelect');
  const addressInput = document.getElementById('addressInput');

  const qualificationSelect = document.getElementById('qualificationSelect');
  const experienceSelect = document.getElementById('experienceSelect');
  const teachingModeSelect = document.getElementById('teachingModeSelect');
  const hourlyRateInput = document.getElementById('hourlyRateInput');
  const provinceInput = document.getElementById('provinceInput');
  const districtInput = document.getElementById('districtInput');
  const bioInput = document.getElementById('bio');
  const viewMyPublicProfile = document.getElementById('viewMyPublicProfile');

  const subjectsList = document.getElementById('subjectsList');
  const subjectSelect = document.getElementById('subjectSelect');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const gradesList = document.getElementById('gradesList');
  const gradeSelect = document.getElementById('gradeSelect');
  const addGradeBtn = document.getElementById('addGradeBtn');

  let subjectLookup = [];
  let gradeLookup = [];
  let subjects = [];
  let grades = [];
  let avatarUrl = null;

  function initTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    const sections = document.querySelectorAll('.profile-section');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (event) {
        event.preventDefault();
        tabs.forEach(function (item) { item.classList.remove('active'); });
        sections.forEach(function (section) { section.classList.add('hidden'); });

        tab.classList.add('active');
        const section = document.getElementById(tab.dataset.section);
        if (section) section.classList.remove('hidden');
        history.replaceState(null, '', '#' + tab.dataset.section);
      });
    });

    const hash = location.hash.replace('#', '');
    if (hash) {
      const target = document.querySelector('.profile-tab[data-section="' + hash + '"]');
      if (target) target.click();
    }
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function safeArray(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function addUnique(list, value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return false;
    const exists = list.some(function (item) {
      return normalizeText(item) === normalizeText(trimmed);
    });
    if (exists) return false;
    list.push(trimmed);
    return true;
  }

  function renderTagList(container, items, kind) {
    if (!container) return;

    DomUtils.setHtml(container, items.map(function (item, index) {
      return '<span class="tag-pill">' +
        FormatUtils.escapeHtml(item) +
        '<button type="button" data-kind="' + kind + '" data-index="' + index + '"><i class="fas fa-times"></i></button>' +
      '</span>';
    }).join(''));

    container.querySelectorAll('button[data-kind][data-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        const index = Number(button.dataset.index);
        if (button.dataset.kind === 'subject') subjects.splice(index, 1);
        if (button.dataset.kind === 'grade') grades.splice(index, 1);
        renderTeachingTags();
      });
    });
  }

  function renderTeachingTags() {
    renderTagList(subjectsList, subjects, 'subject');
    renderTagList(gradesList, grades, 'grade');
  }

  function findLookupIds(selectedNames, lookup) {
    const map = new Map(lookup.map(function (item) {
      return [normalizeText(item.name), item.id];
    }));
    return Array.from(new Set(
      selectedNames
        .map(function (name) { return map.get(normalizeText(name)); })
        .filter(Boolean)
    ));
  }

  function avatarFallback(name) {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'Tutor') + '&background=2563eb&color=fff&size=220';
  }

  function setSelectOptions(select, items, placeholder) {
    if (!select) return;
    DomUtils.setOptions(select, items, {
      placeholder: placeholder,
      value: function (item) { return item.id; },
      label: function (item) { return item.name; }
    });
  }

  function buildGradeGroups(lookup) {
    const byNumber = new Map();
    lookup.forEach(function (item) {
      const match = String(item.name || '').match(/(\d+)/);
      if (match) byNumber.set(Number(match[1]), item.name);
    });

    const groups = [
      { key: '__all__', name: 'Tất cả các lớp', grades: Array.from(byNumber.keys()).sort(function (a, b) { return a - b; }).map(function (n) { return byNumber.get(n); }).filter(Boolean) },
      { key: '__range_1_5__', name: 'Lớp 1 - Lớp 5', grades: [1, 2, 3, 4, 5].map(function (n) { return byNumber.get(n); }).filter(Boolean) },
      { key: '__range_6_9__', name: 'Lớp 6 - Lớp 9', grades: [6, 7, 8, 9].map(function (n) { return byNumber.get(n); }).filter(Boolean) },
      { key: '__range_10_12__', name: 'Lớp 10 - Lớp 12', grades: [10, 11, 12].map(function (n) { return byNumber.get(n); }).filter(Boolean) }
    ];

    return groups.filter(function (group) { return group.grades.length; });
  }

  function getGradesFromSelection(value) {
    if (!value) return [];
    if (!value.startsWith('__')) {
      const item = gradeLookup.find(function (grade) {
        return String(grade.id) === String(value);
      });
      return item ? [item.name] : [];
    }
    const group = buildGradeGroups(gradeLookup).find(function (item) {
      return item.key === value;
    });
    return group ? group.grades : [];
  }

  function populateSelectors() {
    setSelectOptions(subjectSelect, subjectLookup, 'Chọn môn dạy');

    if (!gradeSelect) return;
    DomUtils.clear(gradeSelect);

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Chọn khối lớp hoặc nhóm khối';
    gradeSelect.appendChild(placeholderOption);

    const groupOptions = buildGradeGroups(gradeLookup);
    if (groupOptions.length) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = 'Chọn nhanh theo nhóm';
      groupOptions.forEach(function (group) {
        const option = document.createElement('option');
        option.value = group.key;
        option.textContent = group.name;
        optgroup.appendChild(option);
      });
      gradeSelect.appendChild(optgroup);
    }

    const gradeOptGroup = document.createElement('optgroup');
    gradeOptGroup.label = 'Chọn từng lớp';
    gradeLookup.forEach(function (grade) {
      const option = document.createElement('option');
      option.value = String(grade.id);
      option.textContent = grade.name;
      gradeOptGroup.appendChild(option);
    });
    gradeSelect.appendChild(gradeOptGroup);
  }

  function handleAddSubject() {
    if (!subjectSelect || !subjectSelect.value) {
      showToast('Chọn môn dạy trước khi thêm.');
      return;
    }
    const item = subjectLookup.find(function (subject) {
      return String(subject.id) === String(subjectSelect.value);
    });
    if (!item) {
      showToast('Môn dạy không hợp lệ.');
      return;
    }

    const added = addUnique(subjects, item.name);
    renderTeachingTags();
    subjectSelect.value = '';
    if (!added) showToast('Môn dạy này đã có rồi.');
  }

  function handleAddGrade() {
    if (!gradeSelect || !gradeSelect.value) {
      showToast('Chọn khối lớp trước khi thêm.');
      return;
    }

    const gradeNames = getGradesFromSelection(gradeSelect.value);
    if (!gradeNames.length) {
      showToast('Khối lớp không hợp lệ.');
      return;
    }

    let addedCount = 0;
    gradeNames.forEach(function (name) {
      if (addUnique(grades, name)) addedCount += 1;
    });

    renderTeachingTags();
    gradeSelect.value = '';
    if (!addedCount) showToast('Nhóm khối/lớp này đã có đủ trong danh sách.');
  }

  function updateAvatarPreview() {
    if (!profileAvatar) return;
    profileAvatar.src = avatarUrl || avatarFallback(fullNameInput ? fullNameInput.value : 'Tutor');
  }

  async function uploadAvatarFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const uploaded = await ApiClient.upload('/api/account/avatar', formData);
    return uploaded && uploaded.url ? uploaded : null;
  }

  function applyAccount(account) {
    const data = account || {};
    if (fullNameInput) fullNameInput.value = data.fullName || '';
    if (emailInput) emailInput.value = data.email || '';
    if (phoneInput) phoneInput.value = data.phone || '';
    if (birthDateInput) birthDateInput.value = data.birthDate || '';
    if (genderSelect) genderSelect.value = data.gender || 'OTHER';
    if (addressInput) addressInput.value = data.address || '';
    avatarUrl = data.avatar || null;
    updateAvatarPreview();
  }

  function applyTutor(tutor) {
    const data = tutor || {};
    subjects = safeArray(data.subjects);
    grades = safeArray(data.grades);
    renderTeachingTags();

    if (viewMyPublicProfile && data.tutorId) {
      viewMyPublicProfile.href = '/gia-su-profile.html?id=' + encodeURIComponent(data.tutorId);
      viewMyPublicProfile.classList.remove('hidden');
    }

    if (teachingModeSelect) teachingModeSelect.value = data.teachingMode || 'BOTH';
    if (provinceInput) provinceInput.value = data.province || '';
    if (districtInput) districtInput.value = data.district || '';
    if (hourlyRateInput) hourlyRateInput.value = data.hourlyRate ? String(data.hourlyRate) : '';
    if (bioInput) bioInput.value = data.description || '';
    if (experienceSelect) experienceSelect.value = data.experience || '';
    if (qualificationSelect) qualificationSelect.value = data.qualification || '';
  }

  async function loadLookups() {
    const responses = await Promise.all([
      ApiClient.get('/api/lookups/subjects'),
      ApiClient.get('/api/lookups/grades')
    ]);
    subjectLookup = Array.isArray(responses[0]) ? responses[0] : [];
    gradeLookup = Array.isArray(responses[1]) ? responses[1] : [];
    populateSelectors();
  }

  async function loadProfile() {
    const responses = await Promise.all([
      ApiClient.get('/api/account/me'),
      ApiClient.get('/api/tutors/me').catch(function () { return null; }),
      ApiClient.get('/api/account/identity-verification').catch(function () { return null; }),
      ApiClient.get('/api/tutor/certificates').catch(function () { return []; })
    ]);

    applyAccount(responses[0] || {});
    applyTutor(responses[1] || {});
    identityManager.apply(responses[2] || {});
    certificateManager.apply(responses[3] || []);
  }

  function validateSelection(names, lookup, label) {
    const ids = findLookupIds(names, lookup);
    if (!ids.length) {
      throw new Error('Cần chọn ít nhất 1 ' + label + ' hợp lệ trong danh mục hệ thống.');
    }
    if (ids.length !== names.length) {
      const validNames = new Set(lookup.map(function (item) {
        return normalizeText(item.name);
      }));
      const invalid = names.filter(function (name) {
        return !validNames.has(normalizeText(name));
      });
      throw new Error(label + ' không hợp lệ: ' + invalid.join(', '));
    }
    return ids;
  }

  function bindTeachingSelectors() {
    if (addSubjectBtn) addSubjectBtn.addEventListener('click', handleAddSubject);
    if (subjectSelect) {
      subjectSelect.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        handleAddSubject();
      });
    }

    if (addGradeBtn) addGradeBtn.addEventListener('click', handleAddGrade);
    if (gradeSelect) {
      gradeSelect.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        handleAddGrade();
      });
    }
  }

  function bindAvatar() {
    if (deleteAvatarButton && avatarUpload) {
      deleteAvatarButton.addEventListener('click', function () {
        avatarUrl = null;
        avatarUpload.value = '';
        updateAvatarPreview();
      });
    }

    if (avatarUpload) {
      avatarUpload.addEventListener('change', async function (event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
          const uploaded = await uploadAvatarFile(file);
          if (!uploaded || !uploaded.url) throw new Error('Không nhận được URL ảnh từ máy chủ.');
          avatarUrl = uploaded.url;
          updateAvatarPreview();
          showToast('Tải ảnh đại diện thành công.');
        } catch (err) {
          console.error(err);
          showToast(err && err.message ? err.message : 'Không thể tải ảnh đại diện.');
          avatarUpload.value = '';
          updateAvatarPreview();
        }
      });
    }

    if (fullNameInput) {
      fullNameInput.addEventListener('input', function () {
        if (!avatarUrl) updateAvatarPreview();
      });
    }
  }

  function bindProfileForm() {
    if (!personalForm) return;
    personalForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      try {
        const subjectIds = validateSelection(subjects, subjectLookup, 'môn dạy');
        const gradeIds = validateSelection(grades, gradeLookup, 'khối lớp');

        const accountPayload = {
          fullName: fullNameInput.value.trim(),
          phone: phoneInput.value.trim() || null,
          birthDate: birthDateInput.value || null,
          gender: genderSelect.value || 'OTHER',
          avatar: avatarUrl || '',
          address: addressInput.value.trim() || null
        };

        const tutorPayload = {
          fullName: fullNameInput.value.trim(),
          email: emailInput.value.trim() || null,
          phone: phoneInput.value.trim() || null,
          birthDate: birthDateInput.value || null,
          gender: genderSelect.value || 'OTHER',
          avatar: avatarUrl || '',
          address: addressInput.value.trim() || null,
          description: bioInput.value.trim() || null,
          experience: experienceSelect.value || null,
          qualification: qualificationSelect.value || null,
          teachingMode: teachingModeSelect.value || 'BOTH',
          province: provinceInput.value.trim() || null,
          district: districtInput.value.trim() || null,
          hourlyRate: hourlyRateInput.value ? Number(hourlyRateInput.value) : null,
          subjectIds: subjectIds,
          gradeIds: gradeIds,
          certificates: certificateManager.getPayload()
        };

        const savedAccount = await ApiClient.patch('/api/account/me', accountPayload);
        const savedTutor = await ApiClient.put('/api/tutors/me', tutorPayload);
        applyAccount(savedAccount || accountPayload);
        applyTutor(savedTutor || tutorPayload);
        showToast('Đã lưu hồ sơ thành công.');
      } catch (err) {
        console.error(err);
        showToast(err && err.message ? err.message : 'Không thể lưu hồ sơ.');
      }
    });
  }

  function bindPasswordForm() {
    if (!passwordForm) return;
    passwordForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const inputs = passwordForm.querySelectorAll('input[type="password"]');
      const oldPassword = inputs[0].value.trim();
      const newPassword = inputs[1].value.trim();
      const confirmPassword = inputs[2].value.trim();

      if (!oldPassword || !newPassword || !confirmPassword) {
        showToast('Vui lòng nhập đầy đủ thông tin mật khẩu.');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp.');
        return;
      }

      try {
        await ApiClient.post('/api/account/change-password', {
          currentPassword: oldPassword,
          newPassword: newPassword
        });
        inputs.forEach(function (input) { input.value = ''; });
        showToast('Đổi mật khẩu thành công.');
      } catch (err) {
        console.error(err);
        showToast(err && err.message ? err.message : 'Không thể đổi mật khẩu.');
      }
    });
  }

  function bindEvents() {
    bindTeachingSelectors();
    bindAvatar();
    bindProfileForm();
    bindPasswordForm();
  }

  async function initData() {
    const results = await Promise.allSettled([
      loadLookups(),
      loadProfile()
    ]);

    if (results[1].status === 'rejected') {
      console.error(results[1].reason);
      showToast('Không tải được dữ liệu hồ sơ.');
      return;
    }

    if (results[0].status === 'rejected') {
      console.error(results[0].reason);
      showToast('Đã tải hồ sơ nhưng không tải được danh mục môn học/khối lớp.');
    }
  }

  initTabs();
  certificateManager.init();
  identityManager.init();
  bindEvents();
  initData();
})();
