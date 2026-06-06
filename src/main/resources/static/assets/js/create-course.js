(function () {
  if (!AuthGuard.requireTutor()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const form = document.getElementById('createCourseForm');
  if (!form) return;
  const submitButton = form.querySelector('button[type="submit"]');

  const subjectSelect = document.getElementById('courseSubject');
  const gradeSelect = document.getElementById('courseGrade');
  const modeSelect = document.getElementById('courseMode');

  const titleInput = document.getElementById('courseTitle');
  const provinceSelect = document.getElementById('courseProvince');
  const districtInput = document.getElementById('courseDistrict');
  const studyTimeInput = document.getElementById('courseStudyTime');
  const descriptionInput = document.getElementById('courseDescription');
  const maxStudentsInput = document.getElementById('maxStudents');
  const priceMinInput = document.getElementById('priceMin');

  let subjects = [];
  let grades = [];

  function ensureTutorAuth() {
    if (window.AuthGuard && typeof AuthGuard.requireTutor === 'function') {
      return AuthGuard.requireTutor();
    }

    const user = window.ApiClient && ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    const role = String(user && user.role || '').toUpperCase();
    if (window.ApiClient && ApiClient.getToken && ApiClient.getToken() && role === 'TUTOR') {
      return true;
    }

    alert('Bạn cần đăng nhập tài khoản gia sư để sử dụng chức năng này.');
    const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = '/login.html?returnTo=' + returnTo;
    return false;
  }

  async function loadLookups() {
    subjects = await ApiClient.get('/api/lookups/subjects');
    grades = await ApiClient.get('/api/lookups/grades');

    DomUtils.setHtml(subjectSelect, '<option value="">Chọn môn học</option>');
    subjects.forEach((s) => {
      const option = document.createElement('option');
      option.value = String(s.id);
      option.textContent = s.name || '';
      subjectSelect.appendChild(option);
    });

    DomUtils.setHtml(gradeSelect, '<option value="">Chọn khối lớp</option>');
    grades.forEach((g) => {
      const option = document.createElement('option');
      option.value = String(g.id);
      option.textContent = g.name || '';
      gradeSelect.appendChild(option);
    });

    if (!modeSelect.value) modeSelect.value = 'ONLINE';
  }

  function getPayload() {
    const title = titleInput.value.trim();
    const subjectId = Number(subjectSelect.value);
    const gradeId = Number(gradeSelect.value);
    const teachingMode = modeSelect.value;
    const province = provinceSelect.value;
    const district = districtInput.value.trim() || null;
    const studyTime = studyTimeInput.value.trim();
    const description = descriptionInput.value.trim();
    const maxStudents = Number(maxStudentsInput.value || 0);
    const price = Number(priceMinInput.value || 0);

    if (!title || !subjectId || !gradeId || !teachingMode || !province || !studyTime) {
      throw new Error('Vui lòng nhập đầy đủ các trường bắt buộc.');
    }
    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      throw new Error('Số học viên tối đa phải >= 1.');
    }
    if (price <= 0) {
      throw new Error('Giá phải lớn hơn 0.');
    }

    return {
      title,
      description: description || null,
      subjectId,
      gradeId,
      teachingMode,
      studyTime,
      price,
      maxStudents,
      province,
      district,
      addressDetail: null
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureTutorAuth()) return;

    try {
      await UiUtils.withButtonLoading(submitButton, 'Đang xử lý...', async function () {
        const payload = getPayload();
        await ApiClient.post('/api/tutor/courses', payload);
        location.href = '/gia-su/quan-ly-lop.html?created=1';
      });
    } catch (err) {
      alert(err.message || 'Không tạo được lớp học.');
    }
  });

  (async function init() {
    if (!ensureTutorAuth()) return;
    try {
      await loadLookups();
    } catch (err) {
      alert('Không tải được dữ liệu môn học/khối lớp.');
    }
  })();
})();


