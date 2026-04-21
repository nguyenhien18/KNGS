(function () {
  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const form = document.getElementById('createCourseForm');
  if (!form) return;

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
    if (!window.ApiClient || !ApiClient.getToken || !ApiClient.getToken()) {
      alert('Ban can dang nhap tai khoan gia su de su dung chuc nang nay.');
      const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
      location.href = '/login.html?returnTo=' + returnTo;
      return false;
    }
    return true;
  }

  async function loadLookups() {
    subjects = await ApiClient.get('/api/lookups/subjects');
    grades = await ApiClient.get('/api/lookups/grades');

    subjectSelect.innerHTML = '<option value="">Chon mon hoc</option>';
    subjects.forEach((s) => {
      subjectSelect.insertAdjacentHTML('beforeend', `<option value="${s.id}">${s.name}</option>`);
    });

    gradeSelect.innerHTML = '<option value="">Chon khoi lop</option>';
    grades.forEach((g) => {
      gradeSelect.insertAdjacentHTML('beforeend', `<option value="${g.id}">${g.name}</option>`);
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
      throw new Error('Vui long nhap day du cac truong bat buoc.');
    }
    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      throw new Error('So hoc vien toi da phai >= 1.');
    }
    if (price <= 0) {
      throw new Error('Gia phai lon hon 0.');
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
      const payload = getPayload();
      await ApiClient.post('/api/tutor/courses', payload);
      location.href = '/gia-su/quan-ly-lop.html?created=1';
    } catch (err) {
      alert(err.message || 'Khong tao duoc lop hoc.');
    }
  });

  (async function init() {
    if (!ensureTutorAuth()) return;
    try {
      await loadLookups();
    } catch (err) {
      alert('Khong tai duoc du lieu mon hoc/khoi lop.');
    }
  })();
})();


