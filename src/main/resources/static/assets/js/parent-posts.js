(function () {
  UiUtils.renderHeader();

  const list = document.getElementById('postList');
  const countEl = document.getElementById('resultCount');
  const subjectSelect = document.getElementById('postSubjectFilter');
  const gradeSelect = document.getElementById('postGradeFilter');
  const modeSelect = document.getElementById('postModeFilter');
  const provinceInput = document.getElementById('postProvinceFilter');
  const districtInput = document.getElementById('postDistrictFilter');
  const searchButton = document.getElementById('postSearchButton');
  if (!list || !countEl) return;

  const paginationEl = UiUtils.ensurePaginationAfter(list, 'postPagination');
  let currentPage = 0;
  const pageSize = 10;
  let totalPages = 1;

  function resolvePageItems(page) {
    if (page && Array.isArray(page.items)) return page.items;
    if (page && Array.isArray(page.content)) return page.content;
    return [];
  }

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
      console.error('Load post filters failed', err);
    }
  }

  async function loadPosts() {
    try {
      const page = await ApiClient.get('/api/public/posts', {
        subjectId: parseOptionalId(subjectSelect && subjectSelect.value),
        gradeId: parseOptionalId(gradeSelect && gradeSelect.value),
        teachingMode: modeSelect && modeSelect.value ? modeSelect.value : undefined,
        province: provinceInput && provinceInput.value ? provinceInput.value.trim() : undefined,
        district: districtInput && districtInput.value ? districtInput.value.trim() : undefined,
        page: currentPage,
        size: pageSize
      });
      const pageInfo = UiUtils.pageInfo(page);
      const posts = pageInfo.content;
      currentPage = pageInfo.page;
      totalPages = pageInfo.totalPages;
      countEl.textContent = String(pageInfo.totalElements);

      if (!posts.length) {
        DomUtils.setHtml(list, '<div class="empty-state"><div><i class="fas fa-inbox"></i><h3>Chưa có bài đăng</h3><p>Hiện chưa có bài đăng học viên nào.</p></div></div>');
        UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; loadPosts(); });
        return;
      }

      DomUtils.setHtml(list, posts.map((item) => `
        <article class="post-card">
          <div class="post-head">
            <div>
              <div class="manage-badge-row">
                <span class="badge badge-success">Đang mở</span>
              </div>
              <h3 class="post-title">${esc(item.title)}</h3>
              <div class="post-sub">${esc(item.subject || '-')} · ${esc(item.grade || '-')} · ${esc(item.teachingMode || '-')} · ${esc(item.province || '-')}${item.district ? ', ' + esc(item.district) : ''}</div>
            </div>
            <div class="manage-price">${formatMoney(item.budget)} / buổi</div>
          </div>
          <div class="post-grid">
            <div class="manage-meta-item"><strong>Thời gian học</strong><span>${esc(item.studyTime || '-')}</span></div>
            <div class="manage-meta-item"><strong>Địa điểm</strong><span>${esc(item.addressDetail || '-')}</span></div>
            <div class="manage-meta-item"><strong>Ngày đăng</strong><span>${formatDate(item.createdAt)}</span></div>
          </div>
          <div class="post-footer">
            <div class="notice-inline warn">Gia sư có thể ứng tuyển bằng cách gửi lời nhắn và mức phí mong muốn.</div>
            <a class="btn btn-primary" href="bai-dang-chi-tiet.html?id=${encodeURIComponent(item.postId)}">Xem chi tiết & ứng tuyển</a>
          </div>
        </article>`).join(''));
      UiUtils.renderSimplePagination(paginationEl, { page: currentPage, totalPages: totalPages }, function (nextPage) { currentPage = nextPage; loadPosts(); });
    } catch (err) {
      DomUtils.setHtml(list, `<div class="empty-state"><div><i class="fas fa-circle-exclamation"></i><h3>Lỗi tải dữ liệu</h3><p>${esc(err.message || 'Không thể tải danh sách bài đăng.')}</p></div></div>`);
      UiUtils.renderSimplePagination(paginationEl, { page: 0, totalPages: 1 }, function () {});
    }
  }

  function searchFromFirstPage() { currentPage = 0; loadPosts(); }
  if (searchButton) searchButton.addEventListener('click', searchFromFirstPage);
  [subjectSelect, gradeSelect, modeSelect].forEach((el) => {
    if (el) el.addEventListener('change', searchFromFirstPage);
  });
  [provinceInput, districtInput].forEach((el) => {
    if (!el) return;
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') searchFromFirstPage();
    });
  });

  loadLookups();
  loadPosts();
})();

