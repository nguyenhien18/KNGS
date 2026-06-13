(function () {
  function toDate(value) {
    return FormatUtils.formatDate(value);
  }

  function matchedStatusText(status, waitingForMyConfirmation) {
    const map = {
      ASSIGNED: 'Đang học',
      IN_PROGRESS: 'Đang học',
      COMPLETION_REQUESTED: waitingForMyConfirmation ? 'Cần xác nhận hoàn thành' : 'Chờ xác nhận hoàn thành',
      COMPLETED: 'Đã hoàn thành',
      CANCELLATION_REQUESTED: waitingForMyConfirmation ? 'Cần xác nhận hủy' : 'Chờ xác nhận hủy',
      CANCELLED: 'Đã hủy'
    };
    return map[String(status || 'ASSIGNED')] || 'Đang học';
  }

  function matchedBadgeClass(status) {
    const raw = String(status || 'ASSIGNED');
    if (raw === 'COMPLETED') return 'badge-success';
    if (raw === 'CANCELLED') return 'badge-gray';
    if (raw === 'COMPLETION_REQUESTED' || raw === 'CANCELLATION_REQUESTED') return 'badge-warning';
    return 'badge-primary';
  }

  function sourceText(source) {
    return source === 'MATCHED' ? 'Lớp từ bài đăng' : 'Lớp gia sư mở';
  }

  function readFocus() {
    const params = new URLSearchParams(location.search);
    return {
      source: params.get('source'),
      id: params.get('id'),
      courseId: params.get('courseId'),
      classId: params.get('classId'),
      postId: params.get('postId')
    };
  }

  function findFocusItem(items, focus) {
    const rows = Array.isArray(items) ? items : [];
    const target = focus || {};
    let item = null;
    if (target.source && target.id) {
      item = rows.find(function (row) {
        return String(row.source) === String(target.source) && String(row.itemId) === String(target.id);
      });
    }
    if (!item && target.courseId) {
      item = rows.find(function (row) {
        return row.source === 'COURSE' && String(row.itemId) === String(target.courseId);
      });
    }
    if (!item && target.classId) {
      item = rows.find(function (row) {
        return row.source === 'MATCHED' && String(row.itemId) === String(target.classId);
      });
    }
    if (!item && target.postId) {
      item = rows.find(function (row) {
        return row.source === 'MATCHED' && String(row.postId) === String(target.postId);
      });
    }
    return item || null;
  }

  function stateForFocus(item) {
    if (!item) return null;
    if (item.state === 'COMPLETED') return 'COMPLETED';
    if (item.state === 'CANCELLED') return 'CANCELLED';
    return 'ACTIVE';
  }

  function filterItems(items, sourceFilter, stateFilter) {
    return (Array.isArray(items) ? items : []).filter(function (item) {
      if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
      if (stateFilter !== 'ALL' && item.state !== stateFilter) return false;
      return true;
    });
  }

  function paginate(items, currentPage, pageSize) {
    const rows = Array.isArray(items) ? items : [];
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(0, currentPage || 0), totalPages - 1);
    return {
      page: page,
      totalPages: totalPages,
      rows: rows.slice(page * pageSize, page * pageSize + pageSize)
    };
  }

  function focusClass(item, focusItem) {
    return focusItem
      && String(focusItem.source) === String(item.source)
      && String(focusItem.itemId) === String(item.itemId)
      ? ' is-focused'
      : '';
  }

  function scrollToFocus(listEl, focusItem) {
    if (!listEl || !focusItem) return;
    const source = String(focusItem.source).replace(/"/g, '');
    const itemId = String(focusItem.itemId).replace(/"/g, '');
    const el = listEl.querySelector('[data-source="' + source + '"][data-item-id="' + itemId + '"]');
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function renderClassCard(item, actionsHtml, focusClassName) {
    return '<article class="list-card' + (focusClassName || '') + '" data-source="' + safe(item.source) + '" data-item-id="' + safe(item.itemId) + '">' +
      '<div class="badge-row">' +
        '<span class="badge badge-gray">' + safe(sourceText(item.source)) + '</span>' +
        '<span class="badge ' + safe(item.badgeClass) + '">' + safe(item.statusText) + '</span>' +
      '</div>' +
      '<h3 class="card-title">' + safe(item.title) + '</h3>' +
      '<p class="muted">' + safe(item.sub) + '</p>' +
      '<div class="info-grid">' +
        '<div class="info-box"><strong>Thông tin 1</strong><span>' + safe(item.meta1) + '</span></div>' +
        '<div class="info-box"><strong>Thông tin 2</strong><span>' + safe(item.meta2) + '</span></div>' +
        '<div class="info-box"><strong>Thông tin 3</strong><span>' + safe(item.meta3) + '</span></div>' +
        '<div class="info-box"><strong>Nhóm lớp</strong><span>' + safe(sourceText(item.source)) + '</span></div>' +
      '</div>' +
      '<div class="card-actions"><span class="muted">Trạng thái học tập: ' + safe(item.statusText) + '</span><div class="manage-action-group">' + actionsHtml + '</div></div>' +
    '</article>';
  }

  window.MyClassesCommon = {
    filterItems: filterItems,
    findFocusItem: findFocusItem,
    focusClass: focusClass,
    matchedBadgeClass: matchedBadgeClass,
    matchedStatusText: matchedStatusText,
    paginate: paginate,
    readFocus: readFocus,
    renderClassCard: renderClassCard,
    scrollToFocus: scrollToFocus,
    sourceText: sourceText,
    stateForFocus: stateForFocus,
    toDate: toDate
  };
})();
