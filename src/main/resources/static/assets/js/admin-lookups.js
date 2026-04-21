(function () {
  function ensureAdmin() {
    const user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
    if (!ApiClient.getToken || !ApiClient.getToken() || !user || String(user.role || '').toUpperCase() !== 'ADMIN') {
      alert('Bạn cần đăng nhập tài khoản admin.');
      location.href = '/login.html?returnTo=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }

  if (!ensureAdmin()) return;

  const headerRight = document.getElementById('headerRight');
  if (headerRight && typeof renderUtilityHeaderRight === 'function') {
    headerRight.innerHTML = renderUtilityHeaderRight();
  }
  if (typeof renderHeaderExtras === 'function') renderHeaderExtras();

  const subjectListEl = document.getElementById('subjectList');
  const gradeListEl = document.getElementById('gradeList');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const addGradeBtn = document.getElementById('addGradeBtn');
  const lookupModal = document.getElementById('lookupModal');
  const lookupModalTitle = document.getElementById('lookupModalTitle');
  const lookupModalLabel = document.getElementById('lookupModalLabel');
  const lookupNameInput = document.getElementById('lookupNameInput');
  const lookupModalCloseBtn = document.getElementById('lookupModalCloseBtn');
  const lookupModalCancelBtn = document.getElementById('lookupModalCancelBtn');
  const lookupModalSaveBtn = document.getElementById('lookupModalSaveBtn');

  let modalState = {
    mode: 'create',
    kind: 'subject',
    id: null
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function listHtml(rows, kind) {
    if (!rows.length) {
      return '<div class="mini-item"><h4>Trống</h4><p>Chưa có dữ liệu.</p></div>';
    }
    return rows.map(function (row) {
      const id = row.id;
      return '<article class="lookup-item">' +
          '<h3 class="lookup-name">' + esc(row.name) + '</h3>' +
          '<div class="lookup-actions">' +
            '<button class="btn btn-soft" data-kind="' + kind + '" data-action="edit" data-id="' + esc(id) + '" data-name="' + esc(row.name) + '"><i class="fas fa-pen"></i> Sửa</button>' +
            '<button class="btn btn-outline" data-kind="' + kind + '" data-action="delete" data-id="' + esc(id) + '" data-name="' + esc(row.name) + '"><i class="fas fa-trash"></i> Xóa</button>' +
          '</div>' +
      '</article>';
    }).join('');
  }

  function prettyError(err, fallback) {
    const raw = String((err && err.message) || fallback || 'Có lỗi xảy ra.');
    if (raw.includes('No static resource api/admin/lookups')) {
      return 'Backend chưa cập nhật API danh mục. Vui lòng restart server để nạp code mới.';
    }
    return raw;
  }

  async function load() {
    try {
      const [subjects, grades] = await Promise.all([
        ApiClient.get('/api/admin/lookups/subjects'),
        ApiClient.get('/api/admin/lookups/grades')
      ]);
      subjectListEl.innerHTML = listHtml(Array.isArray(subjects) ? subjects : [], 'subject');
      gradeListEl.innerHTML = listHtml(Array.isArray(grades) ? grades : [], 'grade');
    } catch (err) {
      const msg = esc(prettyError(err, 'Không tải được dữ liệu danh mục'));
      subjectListEl.innerHTML = '<div class="mini-item"><h4>Lỗi</h4><p>' + msg + '</p></div>';
      gradeListEl.innerHTML = '<div class="mini-item"><h4>Lỗi</h4><p>' + msg + '</p></div>';
    }
  }

  function openModal(kind, mode, data) {
    modalState = { kind: kind, mode: mode, id: data && data.id ? data.id : null };
    const kindLabel = kind === 'subject' ? 'môn học' : 'khối/lớp';
    lookupModalTitle.textContent = mode === 'edit' ? 'Sửa ' + kindLabel : 'Thêm ' + kindLabel;
    lookupModalLabel.textContent = 'Tên ' + kindLabel;
    lookupNameInput.value = data && data.name ? data.name : '';
    lookupModal.classList.remove('hidden');
    setTimeout(function () { lookupNameInput.focus(); }, 0);
  }

  function closeModal() {
    lookupModal.classList.add('hidden');
  }

  async function saveModal() {
    const value = String(lookupNameInput.value || '').trim();
    if (!value) {
      alert('Tên không được để trống.');
      lookupNameInput.focus();
      return;
    }

    if (modalState.mode === 'create') {
      if (modalState.kind === 'subject') {
        await ApiClient.post('/api/admin/lookups/subjects', { name: value });
      } else {
        await ApiClient.post('/api/admin/lookups/grades', { name: value });
      }
    } else {
      if (modalState.kind === 'subject') {
        await ApiClient.put('/api/admin/lookups/subjects/' + encodeURIComponent(modalState.id), { name: value });
      } else {
        await ApiClient.put('/api/admin/lookups/grades/' + encodeURIComponent(modalState.id), { name: value });
      }
    }
    closeModal();
    await load();
  }

  async function deleteItem(kind, id, name) {
    const label = kind === 'subject' ? 'môn học' : 'khối/lớp';
    if (!window.confirm('Xóa ' + label + ' "' + name + '"?')) return;
    if (kind === 'subject') {
      await fetch('/api/admin/lookups/subjects/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(ApiClient.getToken() ? { Authorization: 'Bearer ' + ApiClient.getToken() } : {})
        }
      }).then(async function (res) {
        if (!res.ok) {
          let msg = 'Xóa thất bại';
          try {
            const data = await res.json();
            msg = data.message || msg;
          } catch (_) {}
          throw new Error(msg);
        }
      });
    } else {
      await fetch('/api/admin/lookups/grades/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(ApiClient.getToken() ? { Authorization: 'Bearer ' + ApiClient.getToken() } : {})
        }
      }).then(async function (res) {
        if (!res.ok) {
          let msg = 'Xóa thất bại';
          try {
            const data = await res.json();
            msg = data.message || msg;
          } catch (_) {}
          throw new Error(msg);
        }
      });
    }
    await load();
  }

  addSubjectBtn.addEventListener('click', function () {
    openModal('subject', 'create');
  });

  addGradeBtn.addEventListener('click', function () {
    openModal('grade', 'create');
  });

  lookupModalSaveBtn.addEventListener('click', function () {
    saveModal().catch(function (err) {
      alert(prettyError(err, 'Không lưu được dữ liệu.'));
    });
  });

  lookupModalCloseBtn.addEventListener('click', closeModal);
  lookupModalCancelBtn.addEventListener('click', closeModal);
  lookupModal.addEventListener('click', function (event) {
    if (event.target === lookupModal) closeModal();
  });
  lookupNameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      lookupModalSaveBtn.click();
    }
  });

  document.addEventListener('click', function (event) {
    const btn = event.target.closest('button[data-kind][data-action][data-id]');
    if (!btn) return;
    const kind = btn.getAttribute('data-kind');
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name') || '';
    if (action === 'edit') {
      openModal(kind, 'edit', { id: id, name: name });
      return;
    }
    if (action === 'delete') {
      deleteItem(kind, id, name).catch(function (err) {
        alert(prettyError(err, 'Không xóa được dữ liệu.'));
      });
    }
  });

  load();
})();
