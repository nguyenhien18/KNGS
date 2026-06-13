(function () {
  const escapeHtml = FormatUtils.escapeHtml;
  const escapeAttr = FormatUtils.escapeAttr;

  let certificates = [];
  let elements = {};

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function normalizeTitle(item) {
    if (item && typeof item === 'object') return String(item.title || '').trim();
    return String(item || '').trim();
  }

  function toCertificate(item) {
    return {
      title: normalizeTitle(item),
      certificateImageUrl: item && item.certificateImageUrl ? String(item.certificateImageUrl).trim() : null
    };
  }

  function openImagePreview(url) {
    const value = String(url || '').trim();
    if (!value) return;
    UiUtils.ensureLightbox({ id: 'profileImageLightbox', imageId: 'profileLightboxImage' }).open(value);
  }

  function updatePreview(anchor, url) {
    if (!anchor) return;
    if (!url) {
      anchor.classList.add('hidden');
      anchor.removeAttribute('href');
      return;
    }
    anchor.classList.remove('hidden');
    anchor.href = url;
  }

  async function uploadCertificateImage(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await ApiClient.upload('/api/tutor/certificates/upload-image', form);
    return res && res.url ? res.url : null;
  }

  function addCertificate(certificate) {
    const normalized = toCertificate(certificate);
    if (!normalized.title) return false;

    const exists = certificates.some(function (item) {
      return normalizeText(item.title) === normalizeText(normalized.title);
    });
    if (exists) return false;

    certificates.push(normalized);
    return true;
  }

  function attachImageToCurrentCertificate(url) {
    const cleanUrl = String(url || '').trim();
    const title = elements.titleInput ? elements.titleInput.value.trim() : '';
    if (!cleanUrl) return false;

    if (title) {
      const existingIndex = certificates.findIndex(function (item) {
        return normalizeText(item.title) === normalizeText(title);
      });
      if (existingIndex >= 0) {
        certificates[existingIndex].certificateImageUrl = cleanUrl;
        render();
        return true;
      }
      certificates.push({ title: title, certificateImageUrl: cleanUrl });
      render();
      return true;
    }

    const firstMissingImageIndex = certificates.findIndex(function (item) {
      return !String(item && item.certificateImageUrl || '').trim();
    });
    if (firstMissingImageIndex >= 0) {
      certificates[firstMissingImageIndex].certificateImageUrl = cleanUrl;
      render();
      return true;
    }

    if (certificates.length === 1) {
      certificates[0].certificateImageUrl = cleanUrl;
      render();
      return true;
    }

    return false;
  }

  function render() {
    if (!elements.list) return;

    DomUtils.setHtml(elements.list, certificates.map(function (item, index) {
      const imageButton = item.certificateImageUrl
        ? '<button type="button" class="text-link cert-preview-link" data-cert-url="' + escapeAttr(item.certificateImageUrl) + '">Ảnh</button>'
        : '';
      return '<span class="tag-pill">' +
        escapeHtml(item.title) +
        imageButton +
        '<button type="button" data-certificate-index="' + index + '"><i class="fas fa-times"></i></button>' +
      '</span>';
    }).join(''));

    elements.list.querySelectorAll('button[data-certificate-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        certificates.splice(Number(button.dataset.certificateIndex), 1);
        render();
      });
    });

    elements.list.querySelectorAll('.cert-preview-link[data-cert-url]').forEach(function (button) {
      button.addEventListener('click', function () {
        openImagePreview(button.dataset.certUrl);
      });
    });
  }

  function handleAddCertificate() {
    if (!elements.titleInput) return;

    const title = elements.titleInput.value.trim();
    if (!title) {
      showToast('Nhập tên bằng cấp trước khi thêm.');
      return;
    }

    const imageUrl = elements.imageUrlInput ? (elements.imageUrlInput.value || '').trim() || null : null;
    const existingIndex = certificates.findIndex(function (item) {
      return normalizeText(item.title) === normalizeText(title);
    });

    if (existingIndex >= 0) {
      if (imageUrl) {
        certificates[existingIndex].certificateImageUrl = imageUrl;
        clearInputs();
        render();
        showToast('Đã cập nhật ảnh cho bằng cấp đã có.');
      } else {
        showToast('Bằng cấp này đã có rồi.');
      }
      return;
    }

    if (!addCertificate({ title: title, certificateImageUrl: imageUrl })) {
      showToast('Bằng cấp này đã có rồi.');
      return;
    }

    clearInputs();
    render();
  }

  function clearInputs() {
    if (elements.titleInput) elements.titleInput.value = '';
    if (elements.imageUrlInput) elements.imageUrlInput.value = '';
    updatePreview(elements.preview, null);
  }

  function bindEvents() {
    if (elements.addButton) {
      elements.addButton.addEventListener('click', handleAddCertificate);
    }
    if (elements.titleInput) {
      elements.titleInput.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        handleAddCertificate();
      });
    }
    if (elements.imageFileInput) {
      elements.imageFileInput.addEventListener('change', async function (event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const url = await uploadCertificateImage(file);
          if (!url) throw new Error('Upload ảnh bằng cấp thất bại.');

          if (elements.imageUrlInput) elements.imageUrlInput.value = url;
          updatePreview(elements.preview, url);

          const attached = attachImageToCurrentCertificate(url);
          if (!attached) {
            showToast('Ảnh đã upload nhưng chưa gắn vào bằng cấp cụ thể. Hãy nhập tên bằng cấp rồi bấm Thêm.');
          }
          showToast('Tải ảnh bằng cấp thành công.');
        } catch (err) {
          showToast(err && err.message ? err.message : 'Không thể tải ảnh bằng cấp.');
        } finally {
          elements.imageFileInput.value = '';
        }
      });
    }
    if (elements.imageUrlInput) {
      elements.imageUrlInput.addEventListener('input', function () {
        updatePreview(elements.preview, (elements.imageUrlInput.value || '').trim());
      });
    }
    if (elements.preview) {
      elements.preview.addEventListener('click', function (event) {
        event.preventDefault();
        openImagePreview(elements.preview.getAttribute('href'));
      });
    }
  }

  function init() {
    elements = {
      list: document.getElementById('certificatesList'),
      titleInput: document.getElementById('certificateTitleInput'),
      imageFileInput: document.getElementById('certificateImageFile'),
      imageUrlInput: document.getElementById('certificateImageUrlInput'),
      preview: document.getElementById('certificateImagePreview'),
      addButton: document.getElementById('addCertificateBtn')
    };
    bindEvents();
    render();
  }

  function apply(items) {
    certificates = (Array.isArray(items) ? items : [])
      .map(toCertificate)
      .filter(function (item) { return item.title; });
    render();
  }

  function getPayload() {
    return certificates
      .map(toCertificate)
      .filter(function (item) { return item.title; });
  }

  window.ProfileCertificates = {
    init: init,
    apply: apply,
    getPayload: getPayload
  };
})();
