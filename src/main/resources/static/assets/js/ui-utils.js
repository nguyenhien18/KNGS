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

  window.UiUtils = {
    renderHeader: renderHeader,
    showToast: showToast,
    withButtonLoading: withButtonLoading,
    ensureLightbox: ensureLightbox
  };

  window.showToast = window.showToast || showToast;
})();
