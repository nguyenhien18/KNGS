(function () {
  if (!AuthGuard.requireLearner()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') DomUtils.setHtml(headerRight, renderUtilityHeaderRight());
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
  const submitButton = form.querySelector('button[type="submit"]');

  async function loadLookups() {
    const [subjects, grades] = await Promise.all([
      ApiClient.get('/api/lookups/subjects'),
      ApiClient.get('/api/lookups/grades')
    ]);

    DomUtils.setHtml(subjectSelect, '<option value="">Chọn môn học</option>');
    (subjects || []).forEach(function (s) {
      const option = document.createElement('option');
      option.value = String(s.id);
      option.textContent = s.name || '';
      subjectSelect.appendChild(option);
    });

    DomUtils.setHtml(gradeSelect, '<option value="">Chọn khối lớp</option>');
    (grades || []).forEach(function (g) {
      const option = document.createElement('option');
      option.value = String(g.id);
      option.textContent = g.name || '';
      gradeSelect.appendChild(option);
    });
  }

  function payload() {
    const title = (titleInput.value || '').trim();
    const subjectId = Number(subjectSelect.value || 0);
    const gradeId = Number(gradeSelect.value || 0);
    const teachingMode = modeSelect.value;

    if (!title || !subjectId || !gradeId || !teachingMode) {
      throw new Error('Vui lòng nhập đầy đủ các trường bắt buộc (*).');
    }

    const budgetRaw = (budgetInput.value || '').trim();
    const budgetNum = budgetRaw ? Number(budgetRaw) : null;
    if (budgetRaw && (!Number.isFinite(budgetNum) || budgetNum < 0)) {
      throw new Error('Ngân sách không hợp lệ.');
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
      await UiUtils.withButtonLoading(submitButton, 'Đang xử lý...', async function () {
        await ApiClient.post('/api/learner/posts', payload());
        location.href = '/hoc-vien/learner-posts.html?created=1';
      });
    } catch (err) {
      alert(err.message || 'Tạo bài đăng thất bại.');
    }
  });

  (async function init() {
    try {
      await loadLookups();
    } catch (err) {
      alert(err.message || 'Không tải được danh mục môn học/khối lớp.');
    }
  })();
})();
