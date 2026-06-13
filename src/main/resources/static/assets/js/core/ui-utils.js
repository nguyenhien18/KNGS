(function () {
  function setHtml(element, html) {
    if (!element) return;
    if (window.DomUtils && DomUtils.setHtml) {
      DomUtils.setHtml(element, html);
      return;
    }
    const template = document.createElement('template');
    template.innerHTML = String(html || '').trim();
    element.replaceChildren(template.content);
  }

  function renderHeader() {
    const headerRight = document.getElementById('headerRight');
    if (headerRight && typeof window.renderUtilityHeaderRight === 'function') {
      setHtml(headerRight, window.renderUtilityHeaderRight());
    }
    if (typeof window.renderHeaderExtras === 'function') {
      window.renderHeaderExtras();
    }
  }

  function showToast(message) {
    if (window.Toastify && typeof window.Toastify === 'function') {
      window.Toastify({ text: String(message || ''), duration: 2500, gravity: 'top', position: 'right' }).showToast();
      return;
    }
    window.alert(message);
  }

  async function withButtonLoading(button, loadingText, task) {
    if (typeof task !== 'function') return undefined;
    if (!button) return task();
    if (button.disabled) return undefined;

    const originalHtml = button.innerHTML;
    const originalAriaBusy = button.getAttribute('aria-busy');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (loadingText) button.textContent = loadingText;

    try {
      return await task();
    } finally {
      button.disabled = false;
      if (originalAriaBusy === null) button.removeAttribute('aria-busy');
      else button.setAttribute('aria-busy', originalAriaBusy);
      button.innerHTML = originalHtml;
    }
  }

  function ensureLightbox(config) {
    const options = config || {};
    const id = options.id || 'imageLightbox';
    const imageId = options.imageId || id + 'Image';
    let lightbox = document.getElementById(id);
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = id;
      lightbox.className = 'lightbox hidden';
      const closeId = id + 'Close';
      const html = '<span class="lightbox-close" id="' + closeId + '">&times;</span><img id="' + imageId + '" src="" alt="Preview">';
      setHtml(lightbox, html);
      document.body.appendChild(lightbox);
      const closeButton = lightbox.querySelector('#' + closeId);
      if (closeButton) closeButton.addEventListener('click', close);
      lightbox.addEventListener('click', function (event) {
        if (event.target === lightbox) close();
      });
    }
    const image = lightbox.querySelector('#' + imageId) || lightbox.querySelector('img');

    function open(url) {
      if (!image || !url) return;
      image.src = url;
      lightbox.classList.remove('hidden');
    }

    function close() {
      lightbox.classList.add('hidden');
      if (image) image.removeAttribute('src');
    }

    return { element: lightbox, image: image, open: open, close: close };
  }


  function ensurePaginationAfter(anchor, id) {
    if (!anchor || !anchor.parentNode) return null;
    const paginationId = id || ((anchor.id || 'list') + 'Pagination');
    let container = document.getElementById(paginationId);
    if (!container) {
      container = document.createElement('div');
      container.id = paginationId;
      container.className = 'pagination-holder';
      anchor.insertAdjacentElement('afterend', container);
    }
    return container;
  }

  function renderSimplePagination(container, pageInfo, onPageChange) {
    if (!container) return;
    const currentPage = Number((pageInfo && pageInfo.page) || 0);
    const totalPages = Number((pageInfo && pageInfo.totalPages) || 1);
    if (!Number.isFinite(totalPages) || totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    setHtml(container,
      '<div class="pagination-simple">' +
        '<button class="btn btn-outline" data-page="prev" ' + (currentPage <= 0 ? 'disabled' : '') + '>Trước</button>' +
        '<span>Trang ' + (currentPage + 1) + ' / ' + totalPages + '</span>' +
        '<button class="btn btn-outline" data-page="next" ' + (currentPage >= totalPages - 1 ? 'disabled' : '') + '>Sau</button>' +
      '</div>'
    );

    const prev = container.querySelector('[data-page="prev"]');
    const next = container.querySelector('[data-page="next"]');
    if (prev) {
      prev.addEventListener('click', function () {
        if (currentPage > 0 && typeof onPageChange === 'function') onPageChange(currentPage - 1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        if (currentPage < totalPages - 1 && typeof onPageChange === 'function') onPageChange(currentPage + 1);
      });
    }
  }

  function pageItems(page) {
    if (Array.isArray(page)) return page;
    if (page && Array.isArray(page.content)) return page.content;
    if (page && Array.isArray(page.items)) return page.items;
    return [];
  }

  function pageInfo(page, fallbackRows) {
    const rows = Array.isArray(fallbackRows) ? fallbackRows : pageItems(page);
    return {
      content: rows,
      page: Number((page && page.page) || 0),
      size: Number((page && page.size) || rows.length || 10),
      totalElements: Number((page && page.totalElements) != null ? page.totalElements : rows.length),
      totalPages: Number((page && page.totalPages) || 1),
      first: !!(page && page.first),
      last: !!(page && page.last)
    };
  }

  window.UiUtils = {
    renderHeader: renderHeader,
    showToast: showToast,
    withButtonLoading: withButtonLoading,
    ensureLightbox: ensureLightbox,
    ensurePaginationAfter: ensurePaginationAfter,
    renderSimplePagination: renderSimplePagination,
    pageItems: pageItems,
    pageInfo: pageInfo
  };

  window.showToast = window.showToast || showToast;
})();
