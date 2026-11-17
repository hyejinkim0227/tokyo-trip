(function () {
  'use strict';
  document.querySelectorAll('.stop[data-priority-key], [data-priority-card]').forEach(stop => {
    const time = stop.querySelector(':scope > .time') || stop.querySelector('.priority-control');
    if (!time) return;
    const name = stop.dataset.priorityName || stop.querySelector('.name')?.textContent.trim() || '이 장소';
    const key = 'tokyo-stop-priority-v1-' + stop.dataset.priorityKey;
    let value = stop.dataset.priority;
    try {
      const saved = localStorage.getItem(key);
      if (saved === 'required' || saved === 'optional') value = saved;
    } catch (_) {}
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'priority-toggle';
    function render() {
      const required = value === 'required';
      stop.dataset.priority = value;
      button.textContent = '★';
      button.setAttribute('aria-pressed', String(required));
      button.setAttribute('aria-label', name + ': ' + (required ? '필수 일정. 누르면 선택으로 변경' : '선택 일정. 누르면 필수로 변경'));
    }
    button.addEventListener('click', () => {
      value = value === 'required' ? 'optional' : 'required';
      render();
      try { localStorage.setItem(key, value); } catch (_) {}
    });
    render();
    time.append(button);
  });
}());
