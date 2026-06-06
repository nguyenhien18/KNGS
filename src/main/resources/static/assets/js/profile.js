(function () {
  UiUtils.renderHeader();

  if (!AuthGuard.requireTutor()) return;

  const tabs = document.querySelectorAll('.profile-tab');
  const sections = document.querySelectorAll('.profile-section');
  tabs.forEach((tab) => tab.addEventListener('click', (e) => {
    e.preventDefault();
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    sections.forEach((s) => s.classList.add('hidden'));
    const section = document.getElementById(tab.dataset.section);
    if (section) section.classList.remove('hidden');
    history.replaceState(null, '', `#${tab.dataset.section}`);
  }));

  const hash = location.hash.replace('#', '');
  if (hash) {
    const target = document.querySelector(`.profile-tab[data-section="${hash}"]`);
    if (target) target.click();
  }

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
  const certificatesList = document.getElementById('certificatesList');
  const certificateTitleInput = document.getElementById('certificateTitleInput');
  const certificateImageFile = document.getElementById('certificateImageFile');
  const certificateImageUrlInput = document.getElementById('certificateImageUrlInput');
  const certificateImagePreview = document.getElementById('certificateImagePreview');
  const addCertificateBtn = document.getElementById('addCertificateBtn');

  const identityVerificationForm = document.getElementById('identityVerificationForm');
  const identityStatusInput = document.getElementById('identityStatusInput');
  const idFullNameInput = document.getElementById('idFullNameInput');
  const idNumberInput = document.getElementById('idNumberInput');
  const idDobInput = document.getElementById('idDobInput');
  const idIssuedDateInput = document.getElementById('idIssuedDateInput');
  const idIssuedPlaceInput = document.getElementById('idIssuedPlaceInput');
  const idAddressInput = document.getElementById('idAddressInput');
  const idFrontImageInput = document.getElementById('idFrontImageInput');
  const idBackImageInput = document.getElementById('idBackImageInput');
  const idSelfieImageInput = document.getElementById('idSelfieImageInput');
  const idFrontFile = document.getElementById('idFrontFile');
  const idBackFile = document.getElementById('idBackFile');
  const idSelfieFile = document.getElementById('idSelfieFile');
  const idFrontPreview = document.getElementById('idFrontPreview');
  const idBackPreview = document.getElementById('idBackPreview');
  const idSelfiePreview = document.getElementById('idSelfiePreview');
  const identityRejectedReasonInput = document.getElementById('identityRejectedReasonInput');
  const saveIdentityDraftBtn = document.getElementById('saveIdentityDraftBtn');

  let subjectLookup = [];
  let gradeLookup = [];
  let subjects = [];
  let grades = [];
  let certificates = [];
  let avatarUrl = null;
  let imageLightbox = null;
  let lightboxImage = null;
  const dom = DomUtils;
  const escapeAttr = FormatUtils.escapeAttr;
  const escapeHtml = FormatUtils.escapeHtml;

  function normalizeText(v) {
    return String(v || '')
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
    const exists = list.some((item) => normalizeText(item) === normalizeText(trimmed));
    if (exists) return false;
    list.push(trimmed);
    return true;
  }

  function normalizeCertificateTitle(item) {
    if (item && typeof item === 'object') return String(item.title || '').trim();
    return String(item || '').trim();
  }

  function addUniqueCertificate(list, certificate) {
    const title = normalizeCertificateTitle(certificate);
    if (!title) return false;
    const exists = list.some((item) => normalizeText(normalizeCertificateTitle(item)) === normalizeText(title));
    if (exists) return false;
    list.push({
      title,
      certificateImageUrl: (certificate && certificate.certificateImageUrl) ? String(certificate.certificateImageUrl).trim() : null
    });
    return true;
  }

  function setTagList(container, items, kind) {
    const html = items.map((item, idx) => `
      <span class="tag-pill">
        ${escapeHtml(kind === 'certificate' && item && typeof item === 'object' ? item.title : item)}
        ${kind === 'certificate' && item && item.certificateImageUrl ? '<button type="button" class="text-link cert-preview-link" data-cert-url="' + escapeAttr(item.certificateImageUrl) + '">Ảnh</button>' : ''}
        <button type="button" data-kind="${kind}" data-idx="${idx}"><i class="fas fa-times"></i></button>
      </span>
    `).join('');
    dom.setHtml(container, html);

    container.querySelectorAll('button[data-kind][data-idx]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.idx);
        if (button.dataset.kind === 'subject') subjects.splice(index, 1);
        if (button.dataset.kind === 'grade') grades.splice(index, 1);
        if (button.dataset.kind === 'certificate') certificates.splice(index, 1);
        renderTags();
      });
    });

    container.querySelectorAll('.cert-preview-link[data-cert-url]').forEach((button) => {
      button.addEventListener('click', () => {
        openImagePreview(button.dataset.certUrl);
      });
    });
  }

  function renderTags() {
    setTagList(subjectsList, subjects, 'subject');
    setTagList(gradesList, grades, 'grade');
    setTagList(certificatesList, certificates, 'certificate');
  }

  function findLookupIds(selectedNames, lookup) {
    const map = new Map(lookup.map((item) => [normalizeText(item.name), item.id]));
    return Array.from(new Set(
      selectedNames
        .map((name) => map.get(normalizeText(name)))
        .filter(Boolean)
    ));
  }

  function avatarFallback(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Tutor')}&background=2563eb&color=fff&size=220`;
  }

  function setSelectOptions(select, items, placeholder, getValue) {
    if (!select) return;
    dom.setOptions(select, items, {
      placeholder: placeholder,
      value: function (item) { return getValue ? getValue(item) : item.id; },
      label: function (item) { return item.name; }
    });
  }

  function buildGradeGroups(lookup) {
    const byNumber = new Map();
    lookup.forEach((item) => {
      const match = String(item.name || '').match(/(\d+)/);
      if (match) byNumber.set(Number(match[1]), item.name);
    });

    const groups = [
      { key: '__all__', name: 'Tất cả các lớp', grades: Array.from(byNumber.keys()).sort((a, b) => a - b).map((n) => byNumber.get(n)).filter(Boolean) },
      { key: '__range_1_5__', name: 'Lớp 1 - Lớp 5', grades: [1, 2, 3, 4, 5].map((n) => byNumber.get(n)).filter(Boolean) },
      { key: '__range_6_9__', name: 'Lớp 6 - Lớp 9', grades: [6, 7, 8, 9].map((n) => byNumber.get(n)).filter(Boolean) },
      { key: '__range_10_12__', name: 'Lớp 10 - Lớp 12', grades: [10, 11, 12].map((n) => byNumber.get(n)).filter(Boolean) }
    ];

    return groups.filter((group) => group.grades.length);
  }

  function getGradesFromSelection(value) {
    if (!value) return [];
    if (!value.startsWith('__')) {
      const item = gradeLookup.find((grade) => String(grade.id) === String(value));
      return item ? [item.name] : [];
    }
    const groups = buildGradeGroups(gradeLookup);
    const group = groups.find((item) => item.key === value);
    return group ? group.grades : [];
  }

  function populateSelectors() {
    setSelectOptions(subjectSelect, subjectLookup, 'Chọn môn dạy');

    if (gradeSelect) {
      dom.clear(gradeSelect);
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = 'Chọn khối lớp hoặc nhóm khối';
      gradeSelect.appendChild(placeholderOption);

      const groupOptions = buildGradeGroups(gradeLookup);
      if (groupOptions.length) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Chọn nhanh theo nhóm';
        groupOptions.forEach((group) => {
          const option = document.createElement('option');
          option.value = group.key;
          option.textContent = group.name;
          optgroup.appendChild(option);
        });
        gradeSelect.appendChild(optgroup);
      }

      const gradeOptGroup = document.createElement('optgroup');
      gradeOptGroup.label = 'Chọn từng lớp';
      gradeLookup.forEach((grade) => {
        const option = document.createElement('option');
        option.value = String(grade.id);
        option.textContent = grade.name;
        gradeOptGroup.appendChild(option);
      });
      gradeSelect.appendChild(gradeOptGroup);
    }
  }

  function ensureImageLightbox() {
    if (imageLightbox && lightboxImage) return;
    imageLightbox = document.createElement('div');
    imageLightbox.className = 'lightbox hidden';
    const lightboxHtml = '<span class="lightbox-close" id="profileCloseLightbox">&times;</span><img id="profileLightboxImage" src="" alt="Preview">';
    dom.setHtml(imageLightbox, lightboxHtml);
    document.body.appendChild(imageLightbox);
    lightboxImage = imageLightbox.querySelector('#profileLightboxImage');
    const closeBtn = imageLightbox.querySelector('#profileCloseLightbox');
    closeBtn.addEventListener('click', closeImagePreview);
    imageLightbox.addEventListener('click', (event) => {
      if (event.target === imageLightbox) closeImagePreview();
    });
  }

  function openImagePreview(url) {
    const value = String(url || '').trim();
    if (!value) return;
    ensureImageLightbox();
    lightboxImage.src = value;
    imageLightbox.classList.remove('hidden');
  }

  function closeImagePreview() {
    if (!imageLightbox || !lightboxImage) return;
    imageLightbox.classList.add('hidden');
    lightboxImage.removeAttribute('src');
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

  function updateIdentityPreview(anchor, url) {
    if (!anchor) return;
    if (!url) {
      anchor.classList.add('hidden');
      anchor.removeAttribute('href');
      return;
    }
    anchor.classList.remove('hidden');
    anchor.href = '#';
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
    anchor.dataset.previewUrl = url;
  }

  async function uploadIdentityFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await ApiClient.upload('/api/account/identity-image', form);
    return res && res.url ? res.url : null;
  }

  async function uploadCertificateImage(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await ApiClient.upload('/api/tutor/certificates/upload-image', form);
    return res && res.url ? res.url : null;
  }

  function bindIdentityUpload(fileInput, textInput, previewAnchor) {
    if (!fileInput || !textInput) return;
    fileInput.addEventListener('change', async function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const url = await uploadIdentityFile(file);
        if (!url) throw new Error('Upload ảnh thất bại.');
        textInput.value = url;
        updateIdentityPreview(previewAnchor, url);
        showToast('Tải ảnh thành công.');
      } catch (err) {
        showToast(err && err.message ? err.message : 'Không thể tải ảnh.');
      } finally {
        fileInput.value = '';
      }
    });

    textInput.addEventListener('input', function () {
      updateIdentityPreview(previewAnchor, (textInput.value || '').trim());
    });

    if (previewAnchor) {
      previewAnchor.addEventListener('click', function (event) {
        event.preventDefault();
        openImagePreview(previewAnchor.dataset.previewUrl || textInput.value);
      });
    }
  }

  function handleAddSubject() {
    if (!subjectSelect || !subjectSelect.value) {
      showToast('Chọn môn dạy trước khi thêm.');
      return;
    }
    const item = subjectLookup.find((subject) => String(subject.id) === String(subjectSelect.value));
    if (!item) {
      showToast('Môn dạy không hợp lệ.');
      return;
    }
    const added = addUnique(subjects, item.name);
    renderTags();
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
    gradeNames.forEach((name) => {
      if (addUnique(grades, name)) addedCount += 1;
    });
    renderTags();
    gradeSelect.value = '';
    if (!addedCount) {
      showToast('Nhóm khối/lớp này đã có đủ trong danh sách.');
    }
  }

  function handleAddCertificate() {
    if (!certificateTitleInput) return;
    const title = certificateTitleInput.value.trim();
    if (!title) {
      showToast('Nhập tên bằng cấp trước khi thêm.');
      return;
    }
    const imageUrl = certificateImageUrlInput ? (certificateImageUrlInput.value || '').trim() || null : null;
    const existingIndex = certificates.findIndex((item) => normalizeText(normalizeCertificateTitle(item)) === normalizeText(title));
    if (existingIndex >= 0) {
      if (imageUrl) {
        certificates[existingIndex].certificateImageUrl = imageUrl;
        renderTags();
        certificateTitleInput.value = '';
        if (certificateImageUrlInput) certificateImageUrlInput.value = '';
        updatePreview(certificateImagePreview, null);
        showToast('Đã cập nhật ảnh cho bằng cấp đã có.');
      } else {
        showToast('Bằng cấp này đã có rồi.');
      }
      return;
    }
    const added = addUniqueCertificate(certificates, {
      title,
      certificateImageUrl: imageUrl
    });
    renderTags();
    certificateTitleInput.value = '';
    if (certificateImageUrlInput) certificateImageUrlInput.value = '';
    updatePreview(certificateImagePreview, null);
    if (!added) showToast('Bằng cấp này đã có rồi.');
  }

  function attachCertificateImageByCurrentTitle(url) {
    const cleanUrl = String(url || '').trim();
    const title = certificateTitleInput ? certificateTitleInput.value.trim() : '';
    if (!cleanUrl) return false;

    if (title) {
      const existingIndex = certificates.findIndex((item) => normalizeText(normalizeCertificateTitle(item)) === normalizeText(title));
      if (existingIndex >= 0) {
        certificates[existingIndex].certificateImageUrl = cleanUrl;
        renderTags();
        return true;
      }
      certificates.push({ title, certificateImageUrl: cleanUrl });
      renderTags();
      return true;
    }

    // Fallback: tự động gắn vào bằng cấp đầu tiên chưa có ảnh hoặc bằng cấp duy nhất.
    const firstMissingImageIndex = certificates.findIndex((item) => !String(item && item.certificateImageUrl || '').trim());
    if (firstMissingImageIndex >= 0) {
      certificates[firstMissingImageIndex].certificateImageUrl = cleanUrl;
      renderTags();
      return true;
    }
    if (certificates.length === 1) {
      certificates[0].certificateImageUrl = cleanUrl;
      renderTags();
      return true;
    }
    return false;
  }

  function updateAvatarPreview() {
    profileAvatar.src = avatarUrl || avatarFallback(fullNameInput.value || 'Tutor');
  }

  async function uploadAvatarFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const uploaded = await ApiClient.upload('/api/account/avatar', formData);
    if (uploaded && uploaded.url) {
      return uploaded;
    }
    return null;
  }

  if (addSubjectBtn) addSubjectBtn.addEventListener('click', handleAddSubject);
  if (subjectSelect) {
    subjectSelect.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      handleAddSubject();
    });
  }

  if (addGradeBtn) addGradeBtn.addEventListener('click', handleAddGrade);
  if (gradeSelect) {
    gradeSelect.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      handleAddGrade();
    });
  }

  if (addCertificateBtn) {
    addCertificateBtn.addEventListener('click', handleAddCertificate);
  }
  if (certificateTitleInput) {
    certificateTitleInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      handleAddCertificate();
    });
  }

  if (deleteAvatarButton && avatarUpload) {
    deleteAvatarButton.addEventListener('click', () => {
      avatarUrl = null;
      avatarUpload.value = '';
      updateAvatarPreview();
    });
  }

  if (avatarUpload) {
    avatarUpload.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const uploaded = await uploadAvatarFile(file);
        if (!uploaded || !uploaded.url) {
          throw new Error('Không nhận được URL ảnh từ máy chủ.');
        }
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
    fullNameInput.addEventListener('input', () => {
      if (!avatarUrl) updateAvatarPreview();
    });
  }

  bindIdentityUpload(idFrontFile, idFrontImageInput, idFrontPreview);
  bindIdentityUpload(idBackFile, idBackImageInput, idBackPreview);
  bindIdentityUpload(idSelfieFile, idSelfieImageInput, idSelfiePreview);

  if (certificateImageFile) {
    certificateImageFile.addEventListener('change', async function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const url = await uploadCertificateImage(file);
        if (!url) throw new Error('Upload ảnh bằng cấp thất bại.');
        if (certificateImageUrlInput) certificateImageUrlInput.value = url;
        updatePreview(certificateImagePreview, url);
        const attached = attachCertificateImageByCurrentTitle(url);
        if (!attached) {
          showToast('Ảnh đã upload nhưng chưa gắn vào bằng cấp cụ thể. Hãy nhập đúng tên bằng cấp rồi bấm Thêm bằng cấp.');
        }
        showToast('Tải ảnh bằng cấp thành công.');
      } catch (err) {
        showToast(err && err.message ? err.message : 'Không thể tải ảnh bằng cấp.');
      } finally {
        certificateImageFile.value = '';
      }
    });
  }
  if (certificateImageUrlInput) {
    certificateImageUrlInput.addEventListener('input', function () {
      updatePreview(certificateImagePreview, (certificateImageUrlInput.value || '').trim());
    });
  }

  if (certificateImagePreview) {
    certificateImagePreview.addEventListener('click', function (event) {
      event.preventDefault();
      openImagePreview(certificateImagePreview.getAttribute('href'));
    });
  }

  function applyAccount(account) {
    fullNameInput.value = account.fullName || '';
    emailInput.value = account.email || '';
    phoneInput.value = account.phone || '';
    birthDateInput.value = account.birthDate || '';
    genderSelect.value = account.gender || 'OTHER';
    addressInput.value = account.address || '';
    avatarUrl = account.avatar || null;
    updateAvatarPreview();
  }

  function applyTutor(tutor) {
    subjects = safeArray(tutor && tutor.subjects);
    grades = safeArray(tutor && tutor.grades);
    renderTags();

    if (tutor && tutor.tutorId) {
      viewMyPublicProfile.href = `/gia-su-profile.html?id=${encodeURIComponent(tutor.tutorId)}`;
      viewMyPublicProfile.classList.remove('hidden');
    }

    teachingModeSelect.value = tutor && tutor.teachingMode ? tutor.teachingMode : 'BOTH';
    provinceInput.value = tutor && tutor.province ? tutor.province : '';
    districtInput.value = tutor && tutor.district ? tutor.district : '';
    hourlyRateInput.value = tutor && tutor.hourlyRate ? String(tutor.hourlyRate) : '';
    bioInput.value = tutor && tutor.description ? tutor.description : '';
    experienceSelect.value = tutor && tutor.experience ? tutor.experience : '';
    qualificationSelect.value = tutor && tutor.qualification ? tutor.qualification : '';
  }

  function identityStatusText(status) {
    const s = String(status || 'NOT_SUBMITTED').toUpperCase();
    if (s === 'NOT_SUBMITTED') return 'Chưa gửi';
    if (s === 'PENDING') return 'Đang chờ duyệt';
    if (s === 'APPROVED') return 'Đã duyệt';
    if (s === 'REJECTED') return 'Bị từ chối';
    return status || '---';
  }

  function applyIdentity(identity) {
    if (!identityStatusInput) return;
    identityStatusInput.value = identityStatusText(identity && identity.status);
    idFullNameInput.value = (identity && identity.fullNameOnId) || '';
    idNumberInput.value = (identity && identity.idNumber) || '';
    idDobInput.value = (identity && identity.dateOfBirthOnId) || '';
    idIssuedDateInput.value = (identity && identity.issuedDate) || '';
    idIssuedPlaceInput.value = (identity && identity.issuedPlace) || '';
    idAddressInput.value = (identity && identity.addressOnId) || '';
    idFrontImageInput.value = (identity && identity.idFrontImageUrl) || '';
    idBackImageInput.value = (identity && identity.idBackImageUrl) || '';
    idSelfieImageInput.value = (identity && identity.selfieImageUrl) || '';
    identityRejectedReasonInput.value = (identity && identity.rejectedReason) || '';
    updateIdentityPreview(idFrontPreview, idFrontImageInput.value);
    updateIdentityPreview(idBackPreview, idBackImageInput.value);
    updateIdentityPreview(idSelfiePreview, idSelfieImageInput.value);
  }

  function applyCertificates(items) {
    const list = Array.isArray(items) ? items : [];
    certificates = list
      .map((item) => ({
        title: item && item.title ? String(item.title).trim() : '',
        certificateImageUrl: item && item.certificateImageUrl ? String(item.certificateImageUrl).trim() : null
      }))
      .filter((item) => item.title);
    renderTags();
  }

  async function loadLookups() {
    const [subjectsResp, gradesResp] = await Promise.all([
      ApiClient.get('/api/lookups/subjects'),
      ApiClient.get('/api/lookups/grades')
    ]);
    subjectLookup = Array.isArray(subjectsResp) ? subjectsResp : [];
    gradeLookup = Array.isArray(gradesResp) ? gradesResp : [];
    populateSelectors();
  }

  async function loadProfile() {
    const [account, tutor, identity, certificateList] = await Promise.all([
      ApiClient.get('/api/account/me'),
      ApiClient.get('/api/tutors/me').catch(() => null),
      ApiClient.get('/api/account/identity-verification').catch(() => null),
      ApiClient.get('/api/tutor/certificates').catch(() => [])
    ]);
    applyAccount(account || {});
    applyTutor(tutor || {});
    applyIdentity(identity || {});
    applyCertificates(certificateList || []);
  }

  function validateSelection(names, lookup, label) {
    const ids = findLookupIds(names, lookup);
    if (!ids.length) {
      throw new Error(`Cần chọn ít nhất 1 ${label} hợp lệ trong danh mục hệ thống.`);
    }
    if (ids.length !== names.length) {
      const validNames = new Set(lookup.map((item) => normalizeText(item.name)));
      const invalid = names.filter((name) => !validNames.has(normalizeText(name)));
      throw new Error(`${label} không hợp lệ: ${invalid.join(', ')}`);
    }
    return ids;
  }

  if (personalForm) {
    personalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
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
          subjectIds,
          gradeIds,
          certificates: certificates.map((item) => ({
            title: item && item.title ? item.title : '',
            certificateImageUrl: item && item.certificateImageUrl ? item.certificateImageUrl : null
          })).filter((item) => item.title)
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

  if (identityVerificationForm) {
    identityVerificationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          fullNameOnId: idFullNameInput.value.trim() || null,
          idNumber: idNumberInput.value.trim() || null,
          dateOfBirthOnId: idDobInput.value || null,
          issuedDate: idIssuedDateInput.value || null,
          issuedPlace: idIssuedPlaceInput.value.trim() || null,
          addressOnId: idAddressInput.value.trim() || null,
          idFrontImageUrl: idFrontImageInput.value.trim() || null,
          idBackImageUrl: idBackImageInput.value.trim() || null,
          selfieImageUrl: idSelfieImageInput.value.trim() || null,
          submit: true
        };
        const saved = await ApiClient.put('/api/account/identity-verification', payload);
        applyIdentity(saved || payload);
        showToast('Đã gửi hồ sơ xác minh danh tính.');
      } catch (err) {
        console.error(err);
        showToast(err && err.message ? err.message : 'Không thể gửi xác minh danh tính.');
      }
    });
  }

  if (saveIdentityDraftBtn) {
    saveIdentityDraftBtn.addEventListener('click', async () => {
      try {
        const payload = {
          fullNameOnId: idFullNameInput.value.trim() || null,
          idNumber: idNumberInput.value.trim() || null,
          dateOfBirthOnId: idDobInput.value || null,
          issuedDate: idIssuedDateInput.value || null,
          issuedPlace: idIssuedPlaceInput.value.trim() || null,
          addressOnId: idAddressInput.value.trim() || null,
          idFrontImageUrl: idFrontImageInput.value.trim() || null,
          idBackImageUrl: idBackImageInput.value.trim() || null,
          selfieImageUrl: idSelfieImageInput.value.trim() || null,
          submit: false
        };
        const saved = await ApiClient.put('/api/account/identity-verification', payload);
        applyIdentity(saved || payload);
        showToast('Đã lưu nháp xác minh danh tính.');
      } catch (err) {
        console.error(err);
        showToast(err && err.message ? err.message : 'Không thể lưu nháp xác minh.');
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
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
          newPassword
        });
        inputs.forEach((input) => { input.value = ''; });
        showToast('Đổi mật khẩu thành công.');
      } catch (err) {
        console.error(err);
        showToast(err && err.message ? err.message : 'Không thể đổi mật khẩu.');
      }
    });
  }

  (async function init() {
    const [lookupsResult, profileResult] = await Promise.allSettled([
      loadLookups(),
      loadProfile()
    ]);

    if (profileResult.status === 'rejected') {
      console.error(profileResult.reason);
      showToast('Không tải được dữ liệu hồ sơ.');
      return;
    }

    if (lookupsResult.status === 'rejected') {
      console.error(lookupsResult.reason);
      showToast('Đã tải hồ sơ nhưng không tải được danh mục môn học/khối lớp.');
    }
  })();
})();
