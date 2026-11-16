(function () {
  'use strict';
  const inputs = [...document.querySelectorAll('input[name="ginza-route"]')];
  const routes = [...document.querySelectorAll('[data-ginza-route]')];
  const status = document.getElementById('ginza-route-status');
  if (!inputs.length || !status) return;
  function select(value) {
    const selected = value === 'hotel' ? 'hotel' : 'direct';
    inputs.forEach(input => { input.checked = input.value === selected; });
    routes.forEach(route => { route.hidden = route.dataset.ginzaRoute !== selected; });
    status.textContent = selected === 'hotel' ? '선택한 경로: 숙소에 짐을 놓고 시부야로 이동' : '선택한 경로: 짐을 들고 시부야로 바로 이동';
    try { localStorage.setItem('tokyo-ginza-route-v1', selected); } catch (_) {}
  }
  let saved = 'direct';
  try { saved = localStorage.getItem('tokyo-ginza-route-v1') || saved; } catch (_) {}
  inputs.forEach(input => input.addEventListener('change', () => { if (input.checked) select(input.value); }));
  select(saved);
}());
