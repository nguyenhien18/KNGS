(function () {
  let elements = {};

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
      delete anchor.dataset.previewUrl;
      return;
    }
    anchor.classList.remove('hidden');
    anchor.href = '#';
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
    anchor.dataset.previewUrl = url;
  }

  async function uploadIdentityFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await ApiClient.upload('/api/account/identity-image', form);
    return res && res.url ? res.url : null;
  }

  function bindUpload(fileInput, textInput, previewAnchor) {
    if (!fileInput || !textInput) return;

    fileInput.addEventListener('change', async function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        const url = await uploadIdentityFile(file);
        if (!url) throw new Error('Upload ảnh thất bại.');
        textInput.value = url;
        updatePreview(previewAnchor, url);
        showToast('Tải ảnh thành công.');
      } catch (err) {
        showToast(err && err.message ? err.message : 'Không thể tải ảnh.');
      } finally {
        fileInput.value = '';
      }
    });

    textInput.addEventListener('input', function () {
      updatePreview(previewAnchor, (textInput.value || '').trim());
    });

    if (previewAnchor) {
      previewAnchor.addEventListener('click', function (event) {
        event.preventDefault();
        openImagePreview(previewAnchor.dataset.previewUrl || textInput.value);
      });
    }
  }

  function statusText(status) {
    const normalized = String(status || 'NOT_SUBMITTED').toUpperCase();
    if (normalized === 'NOT_SUBMITTED') return 'Chưa gửi';
    if (normalized === 'PENDING') return 'Đang chờ duyệt';
    if (normalized === 'APPROVED') return 'Đã duyệt';
    if (normalized === 'REJECTED') return 'Bị từ chối';
    return status || '---';
  }

  function buildPayload(submit) {
    return {
      fullNameOnId: elements.fullNameInput ? elements.fullNameInput.value.trim() || null : null,
      idNumber: elements.idNumberInput ? elements.idNumberInput.value.trim() || null : null,
      dateOfBirthOnId: elements.dobInput ? elements.dobInput.value || null : null,
      issuedDate: elements.issuedDateInput ? elements.issuedDateInput.value || null : null,
      issuedPlace: elements.issuedPlaceInput ? elements.issuedPlaceInput.value.trim() || null : null,
      addressOnId: elements.addressInput ? elements.addressInput.value.trim() || null : null,
      idFrontImageUrl: elements.frontImageInput ? elements.frontImageInput.value.trim() || null : null,
      idBackImageUrl: elements.backImageInput ? elements.backImageInput.value.trim() || null : null,
      selfieImageUrl: elements.selfieImageInput ? elements.selfieImageInput.value.trim() || null : null,
      submit: submit
    };
  }

  async function save(submit) {
    const payload = buildPayload(submit);
    const saved = await ApiClient.put('/api/account/identity-verification', payload);
    apply(saved || payload);
    showToast(submit ? 'Đã gửi hồ sơ xác minh danh tính.' : 'Đã lưu nháp xác minh danh tính.');
  }

  function apply(identity) {
    const data = identity || {};
    if (!elements.statusInput) return;

    elements.statusInput.value = statusText(data.status);
    elements.fullNameInput.value = data.fullNameOnId || '';
    elements.idNumberInput.value = data.idNumber || '';
    elements.dobInput.value = data.dateOfBirthOnId || '';
    elements.issuedDateInput.value = data.issuedDate || '';
    elements.issuedPlaceInput.value = data.issuedPlace || '';
    elements.addressInput.value = data.addressOnId || '';
    elements.frontImageInput.value = data.idFrontImageUrl || '';
    elements.backImageInput.value = data.idBackImageUrl || '';
    elements.selfieImageInput.value = data.selfieImageUrl || '';
    elements.rejectedReasonInput.value = data.rejectedReason || '';

    updatePreview(elements.frontPreview, elements.frontImageInput.value);
    updatePreview(elements.backPreview, elements.backImageInput.value);
    updatePreview(elements.selfiePreview, elements.selfieImageInput.value);
  }

  function bindEvents() {
    bindUpload(elements.frontFile, elements.frontImageInput, elements.frontPreview);
    bindUpload(elements.backFile, elements.backImageInput, elements.backPreview);
    bindUpload(elements.selfieFile, elements.selfieImageInput, elements.selfiePreview);

    if (elements.form) {
      elements.form.addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
          await save(true);
        } catch (err) {
          console.error(err);
          showToast(err && err.message ? err.message : 'Không thể gửi xác minh danh tính.');
        }
      });
    }

    if (elements.saveDraftButton) {
      elements.saveDraftButton.addEventListener('click', async function () {
        try {
          await save(false);
        } catch (err) {
          console.error(err);
          showToast(err && err.message ? err.message : 'Không thể lưu nháp xác minh.');
        }
      });
    }
  }

  function init() {
    elements = {
      form: document.getElementById('identityVerificationForm'),
      statusInput: document.getElementById('identityStatusInput'),
      fullNameInput: document.getElementById('idFullNameInput'),
      idNumberInput: document.getElementById('idNumberInput'),
      dobInput: document.getElementById('idDobInput'),
      issuedDateInput: document.getElementById('idIssuedDateInput'),
      issuedPlaceInput: document.getElementById('idIssuedPlaceInput'),
      addressInput: document.getElementById('idAddressInput'),
      frontImageInput: document.getElementById('idFrontImageInput'),
      backImageInput: document.getElementById('idBackImageInput'),
      selfieImageInput: document.getElementById('idSelfieImageInput'),
      frontFile: document.getElementById('idFrontFile'),
      backFile: document.getElementById('idBackFile'),
      selfieFile: document.getElementById('idSelfieFile'),
      frontPreview: document.getElementById('idFrontPreview'),
      backPreview: document.getElementById('idBackPreview'),
      selfiePreview: document.getElementById('idSelfiePreview'),
      rejectedReasonInput: document.getElementById('identityRejectedReasonInput'),
      saveDraftButton: document.getElementById('saveIdentityDraftBtn')
    };
    bindEvents();
  }

  window.ProfileIdentity = {
    init: init,
    apply: apply,
    buildPayload: buildPayload
  };
})();
