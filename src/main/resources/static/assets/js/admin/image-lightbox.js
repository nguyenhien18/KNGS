(function () {
  let lightbox = null;
  let lightboxImage = null;
  let closeButton = null;

  function setHtml(element, html) {
    if (!element) return;
    DomUtils.setHtml(element, html);
  }

  function ensure() {
    if (lightbox && lightboxImage && closeButton) return;

    lightbox = document.createElement('div');
    lightbox.id = 'adminImageLightbox';
    lightbox.className = 'lightbox hidden';
    setHtml(lightbox, '<span class="lightbox-close" id="adminCloseLightbox">&times;</span><img id="adminLightboxImage" src="" alt="Preview">');
    document.body.appendChild(lightbox);

    lightboxImage = lightbox.querySelector('#adminLightboxImage');
    closeButton = lightbox.querySelector('#adminCloseLightbox');
    closeButton.addEventListener('click', close);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && lightbox && !lightbox.classList.contains('hidden')) {
        close();
      }
    });
  }

  function close() {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.add('hidden');
    lightboxImage.removeAttribute('src');
  }

  function toCloudinaryUrl(value) {
    try {
      const raw = String(value || '').trim();
      if (!raw) return null;
      const url = new URL(raw);
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      const isCloudinary = String(url.hostname || '').toLowerCase().endsWith('.cloudinary.com');
      if (!isHttp || !isCloudinary) return null;
      return url.toString();
    } catch (_) {
      return null;
    }
  }

  function open(url, invalidMessage) {
    ensure();
    const publicCloudinaryUrl = toCloudinaryUrl(url);
    if (!publicCloudinaryUrl) {
      alert(invalidMessage || 'Ảnh không hợp lệ hoặc không phải URL Cloudinary.');
      return false;
    }
    lightboxImage.src = publicCloudinaryUrl;
    lightbox.classList.remove('hidden');
    return true;
  }

  window.AdminImageLightbox = {
    close: close,
    open: open,
    toCloudinaryUrl: toCloudinaryUrl
  };
})();
