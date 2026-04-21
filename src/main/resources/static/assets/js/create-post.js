(function () {
  function ensureLearner() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'LEARNER') {
      alert('Ban can dang nhap tai khoan hoc vien.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }

  if (!ensureLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') headerRight.innerHTML = renderUtilityHeaderRight();
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const form = document.getElementById('createPostForm');
  if (!form) return;

  const subjectSelect = document.getElementById('postSubject');
  const gradeSelect = document.getElementById('postGrade');
  const modeSelect = document.getElementById('postMode');
  const titleInput = document.getElementById('postTitle');
  const descriptionInput = document.getElementById('postDescription');
  const studyTimeInput = document.getElementById('postStudyTime');
  const budgetInput = document.getElementById('postBudget');
  const provinceInput = document.getElementById('postProvince');
  const districtInput = document.getElementById('postDistrict');
  const addressInput = document.getElementById('postAddress');

  async function loadLookups() {
    const [subjects, grades] = await Promise.all([
      ApiClient.get('/api/lookups/subjects'),
      ApiClient.get('/api/lookups/grades')
    ]);

    subjectSelect.innerHTML = '<option value="">Chon mon hoc</option>';
    (subjects || []).forEach(function (s) {
      subjectSelect.insertAdjacentHTML('beforeend', '<option value="' + s.id + '">' + s.name + '</option>');
    });

    gradeSelect.innerHTML = '<option value="">Chon khoi lop</option>';
    (grades || []).forEach(function (g) {
      gradeSelect.insertAdjacentHTML('beforeend', '<option value="' + g.id + '">' + g.name + '</option>');
    });
  }

  function payload() {
    const title = (titleInput.value || '').trim();
    const subjectId = Number(subjectSelect.value || 0);
    const gradeId = Number(gradeSelect.value || 0);
    const teachingMode = modeSelect.value;

    if (!title || !subjectId || !gradeId || !teachingMode) {
      throw new Error('Vui long nhap day du cac truong bat buoc (*).');
    }

    const budgetRaw = (budgetInput.value || '').trim();
    const budgetNum = budgetRaw ? Number(budgetRaw) : null;
    if (budgetRaw && (!Number.isFinite(budgetNum) || budgetNum < 0)) {
      throw new Error('Ngan sach khong hop le.');
    }

    return {
      title: title,
      subjectId: subjectId,
      gradeId: gradeId,
      teachingMode: teachingMode,
      description: (descriptionInput.value || '').trim() || null,
      studyTime: (studyTimeInput.value || '').trim() || null,
      budget: budgetNum,
      province: (provinceInput.value || '').trim() || null,
      district: (districtInput.value || '').trim() || null,
      addressDetail: (addressInput.value || '').trim() || null
    };
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await ApiClient.post('/api/learner/posts', payload());
      location.href = '/hoc-vien/learner-posts.html?created=1';
    } catch (err) {
      alert(err.message || 'Tao bai dang that bai.');
    }
  });

  (async function init() {
    try {
      await loadLookups();
    } catch (err) {
      alert(err.message || 'Khong tai duoc danh muc mon hoc/khoi lop.');
    }
  })();
})();
