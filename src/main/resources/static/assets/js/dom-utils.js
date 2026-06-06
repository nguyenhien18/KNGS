(function () {
  const safeHtml = window.FormatUtils.safe;

  function clear(element) {
    if (element) element.replaceChildren();
  }

  function setText(element, value) {
    if (element) element.textContent = value == null ? '' : String(value);
  }

  function htmlToFragment(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '').trim();
    return template.content;
  }

  function setHtml(element, html) {
    if (!element) return;
    element.replaceChildren(htmlToFragment(html));
  }

  function appendHtml(element, html) {
    if (!element) return;
    element.appendChild(htmlToFragment(html));
  }

  function setOptions(select, items, options) {
    if (!select) return;
    const config = options || {};
    clear(select);
    if (config.placeholder) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = config.placeholder;
      select.appendChild(option);
    }
    (items || []).forEach(function (item) {
      const option = document.createElement('option');
      option.value = String(config.value ? config.value(item) : item.id);
      option.textContent = config.label ? config.label(item) : item.name;
      select.appendChild(option);
    });
  }

  function setEmpty(element, title, message) {
    setHtml(
      element,
      '<div class="mini-item"><h4>' + safeHtml(title) + '</h4><p>' + safeHtml(message) + '</p></div>'
    );
  }

  function renderList(element, rows, renderItem, empty) {
    const items = Array.isArray(rows) ? rows : [];
    if (!items.length) {
      if (typeof empty === 'string') {
        setHtml(element, empty);
      } else {
        setEmpty(element, empty && empty.title || 'Không có dữ liệu', empty && empty.message || '');
      }
      return;
    }
    setHtml(element, items.map(renderItem).join(''));
  }

  window.DomUtils = {
    clear: clear,
    setText: setText,
    htmlToFragment: htmlToFragment,
    setHtml: setHtml,
    appendHtml: appendHtml,
    setOptions: setOptions,
    setEmpty: setEmpty,
    renderList: renderList
  };
})();
