(function () {
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function safe(value, fallback) {
    const raw = value == null || value === '' ? (fallback == null ? '' : fallback) : value;
    return escapeHtml(raw);
  }

  function formatDate(value, fallback) {
    if (!value) return fallback || '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return safe(value);
    return date.toLocaleDateString('vi-VN');
  }

  function formatDateTime(value, fallback) {
    if (!value) return fallback || '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return safe(value);
    return date.toLocaleString('vi-VN');
  }

  function formatMoney(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return fallback || 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN').format(number) + ' đ';
  }

  window.FormatUtils = {
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    safe: safe,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatMoney: formatMoney
  };

  window.escapeHtml = window.escapeHtml || escapeHtml;
  window.esc = window.esc || escapeHtml;
  window.safe = window.safe || safe;
  window.formatDate = window.formatDate || formatDate;
  window.formatDateTime = window.formatDateTime || formatDateTime;
  window.formatMoney = window.formatMoney || formatMoney;
  window.formatVND = window.formatVND || function (value) {
    return formatMoney(value, '0 đ');
  };
})();
