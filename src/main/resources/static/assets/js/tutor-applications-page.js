(function () {
  UiUtils.renderHeader();

  const listEl = document.getElementById('applicationsList');
  if (!listEl) return;

  const tabEls = Array.from(document.querySelectorAll('#applicationTabs .manage-tab'));
  let activeStatus = 'all';
  let applications = [];
function formatCurrency(value) {
    const num = Number(value || 0);
    if (typeof window.formatVND === 'function') return window.formatVND(num);
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  }

  function statusMeta(status) {
    const map = {
      PENDING: { label: 'Đang chờ', badgeClass: 'badge-warning' },
      ACCEPTED: { label: 'Được chấp nhận', badgeClass: 'badge-success' },
      REJECTED: { label: 'Bị từ chối', badgeClass: 'badge-danger' },
      CANCELLED: { label: 'Đã hủy', badgeClass: 'badge-gray' }
    };
    return map[status] || map.PENDING;
  }

  function helperText(status) {
    if (status === 'PENDING') return 'Hệ thống sẽ thông báo khi có phản hồi.';
    if (status === 'ACCEPTED') return 'Đơn đã được chấp nhận. Bấm "Xem lớp học" để xem học viên và liên hệ.';
    if (status === 'REJECTED') return 'Đơn đã bị từ chối. Bạn có thể ứng tuyển bài đăng khác.';
    return 'Đơn đã được hủy.';
  }

  async function loadApplications() {
    const query = activeStatus === 'all' ? undefined : { status: activeStatus };
    const raw = await ApiClient.get('/api/tutor/applications', query);
    applications = ApiClient.asArray(raw);
    render();
  }

  function render() {
    if (!applications.length) {
      DomUtils.setHtml(listEl, `
        <div class="card-box empty-state empty-state-lg">
          <div>
            <i class="fas fa-inbox"></i>
            <h3>Không có đơn ứng tuyển</h3>
            <p>Không có dữ liệu ở bộ lọc hiện tại.</p>
          </div>
        </div>`);
      return;
    }

    DomUtils.setHtml(listEl, applications.map((item) => {
      const meta = statusMeta(item.status);
      const canCancel = item.status === 'PENDING';
      const canViewClass = item.status === 'ACCEPTED';
      const classHref = item.matchedClassId
        ? '/gia-su/my-classes.html?source=MATCHED&id=' + encodeURIComponent(item.matchedClassId) + '&classId=' + encodeURIComponent(item.matchedClassId)
        : '/gia-su/my-classes.html?source=MATCHED&postId=' + encodeURIComponent(item.postId);

      return `
        <div class="list-card" data-app-id="${safe(item.applicationId)}">
          <div class="badge-row">
            <span class="badge badge-primary">${safe(item.subject || '-')}</span>
            <span class="badge badge-gray">${safe(item.grade || '-')}</span>
            <span class="badge ${meta.badgeClass}">${meta.label}</span>
          </div>
          <h3 class="card-title">Ứng tuyển: ${safe(item.postTitle || '-')}</h3>
          <p class="muted">Lời nhắn: ${safe(item.message || '(không có)')}</p>
          <div class="info-grid">
            <div class="info-box"><strong>Phí đề xuất</strong><span>${formatCurrency(item.expectedFee)}</span></div>
            <div class="info-box"><strong>Ngày gửi</strong><span>${safe(formatDate(item.createdAt))}</span></div>
            <div class="info-box"><strong>Khu vực</strong><span>${safe(item.province || '-')}${item.district ? ' - ' + safe(item.district) : ''}</span></div>
            <div class="info-box"><strong>Trạng thái</strong><span>${meta.label}</span></div>
          </div>
          <div class="card-actions">
            <span class="muted">${helperText(item.status)}</span>
            <div class="manage-action-group">
              <a class="btn btn-soft" href="/bai-dang-chi-tiet.html?id=${encodeURIComponent(item.postId)}">Xem bài đăng</a>
              ${canViewClass ? `<a class="btn btn-soft" href="${classHref}">Xem lớp học</a>` : ''}
              ${canCancel ? '<button class="btn btn-outline" data-action="cancel">Hủy đơn</button>' : ''}
            </div>
          </div>
        </div>`;
    }).join(''));
  }

  tabEls.forEach((tab) => {
    tab.addEventListener('click', async () => {
      tabEls.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeStatus = tab.dataset.status || 'all';
      try {
        await loadApplications();
      } catch (err) {
        alert(err.message || 'Không tải được đơn ứng tuyển.');
      }
    });
  });

  listEl.addEventListener('click', async (e) => {
    const cancelBtn = e.target.closest('[data-action="cancel"]');
    if (!cancelBtn) return;

    const card = e.target.closest('[data-app-id]');
    if (!card) return;

    const appId = card.dataset.appId;
    const ok = window.confirm('Bạn chắc chắn muốn hủy đơn ứng tuyển này?');
    if (!ok) return;

    try {
      await ApiClient.patch('/api/tutor/applications/' + encodeURIComponent(appId) + '/cancel', {});
      await loadApplications();
    } catch (err) {
      alert(err.message || 'Hủy đơn thất bại.');
    }
  });

  (async function init() {
    if (!AuthGuard.requireTutor()) return;
    try {
      await loadApplications();
    } catch (err) {
      alert(err.message || 'Không tải được đơn ứng tuyển.');
    }
  })();
})();

