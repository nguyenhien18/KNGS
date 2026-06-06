(function () {
  UiUtils.renderHeader();

  const list = document.getElementById('courseList');
  const countEl = document.getElementById('resultCount');
  const subjectSelect = document.getElementById('courseSubjectFilter');
  const gradeSelect = document.getElementById('courseGradeFilter');
  const modeSelect = document.getElementById('courseModeFilter');
  const provinceInput = document.getElementById('courseProvinceFilter');
  const districtInput = document.getElementById('courseDistrictFilter');
  const searchButton = document.getElementById('courseSearchButton');
  if (!list || !countEl) return;

  function appendOptions(selectEl, rows) {
    if (!selectEl || !Array.isArray(rows)) return;
    rows.forEach((item) => {
      const id = Number(item && item.id);
      const name = String((item && item.name) || '').trim();
      if (!Number.isFinite(id) || !name) return;

      const option = document.createElement('option');
      option.value = String(id);
      option.textContent = name;
      selectEl.appendChild(option);
    });
  }

  function parseOptionalId(raw) {
    const value = Number(raw || 0);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  async function loadLookups() {
    try {
      const [subjects, grades] = await Promise.all([
        ApiClient.get('/api/lookups/subjects'),
        ApiClient.get('/api/lookups/grades')
      ]);
      appendOptions(subjectSelect, subjects);
      appendOptions(gradeSelect, grades);
    } catch (err) {
      console.error('Load course filters failed', err);
    }
  }

  async function loadCourses() {
    try {
      const rows = await ApiClient.get('/api/public/courses', {
        subjectId: parseOptionalId(subjectSelect && subjectSelect.value),
        gradeId: parseOptionalId(gradeSelect && gradeSelect.value),
        teachingMode: modeSelect && modeSelect.value ? modeSelect.value : undefined,
        province: provinceInput && provinceInput.value ? provinceInput.value.trim() : undefined,
        district: districtInput && districtInput.value ? districtInput.value.trim() : undefined,
        page: 0,
        size: 50
      });
      const courses = ApiClient.asArray(rows);
      countEl.textContent = String(courses.length);

      if (!courses.length) {
        DomUtils.setHtml(list, '<div class="empty-state"><div><i class="fas fa-inbox"></i><h3>Chưa có dữ liệu lớp</h3><p>Hiện chưa có lớp gia sư mở nào.</p></div></div>');
        return;
      }

      DomUtils.setHtml(list, courses.map((item) => {
        const priceText = formatMoney(item.price);
        const tutorDisplayName = item.tutorName ? esc(item.tutorName) : `gia sư #${esc(item.tutorId)}`;
        return `
          <article class="post-card">
            <div class="post-head">
              <div>
                <div class="manage-badge-row">
                  <span class="badge badge-success">${esc(item.status || 'OPEN')}</span>
                </div>
                <h3 class="post-title">${esc(item.title)}</h3>
                <div class="post-sub">${esc(item.subject || '-')} · ${esc(item.grade || '-')} · ${esc(item.teachingMode || '-')} · Mở bởi ${tutorDisplayName}</div>
              </div>
              <div class="manage-price">${priceText}</div>
            </div>
            <div class="post-grid">
              <div class="manage-meta-item"><strong>Lịch học</strong><span>${esc(item.studyTime || '-')}</span></div>
              <div class="manage-meta-item"><strong>Khu vực</strong><span>${esc(item.province || '-')} ${item.district ? ' - ' + esc(item.district) : ''}</span></div>
              <div class="manage-meta-item"><strong>Số học viên tối đa</strong><span>${esc(item.maxStudents || 0)}</span></div>
              <div class="manage-meta-item"><strong>Ngày đăng</strong><span>${formatDate(item.createdAt)}</span></div>
            </div>
            <div class="post-footer">
              <div class="notice-inline success">Lớp này do gia sư chủ động mở để học viên đăng ký tham gia.</div>
              <a class="btn btn-primary" href="lop-chi-tiet.html?id=${encodeURIComponent(item.courseId)}">Xem chi tiết</a>
            </div>
          </article>`;
      }).join(''));
    } catch (err) {
      DomUtils.setHtml(list, `<div class="empty-state"><div><i class="fas fa-circle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${esc(err.message || 'Không thể tải danh sách lớp.')}</p></div></div>`);
    }
  }

  if (searchButton) searchButton.addEventListener('click', loadCourses);
  [subjectSelect, gradeSelect, modeSelect].forEach((el) => {
    if (el) el.addEventListener('change', loadCourses);
  });
  [provinceInput, districtInput].forEach((el) => {
    if (!el) return;
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') loadCourses();
    });
  });

  loadLookups();
  loadCourses();
})();
