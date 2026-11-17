(function () {
  'use strict';
  const button = document.getElementById('today-itinerary');
  const note = document.getElementById('today-itinerary-note');
  if (!button || !note) return;
  function update() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const date = fields.year + '-' + fields.month + '-' + fields.day;
    const dates = ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'];
    const index = dates.indexOf(date);
    const day = index >= 0 ? index + 1 : date < dates[0] ? 1 : 4;
    button.href = '#d' + day;
    button.textContent = index >= 0 ? '📅 오늘 일정 바로 보기 · ' + day + '일차' : date < dates[0] ? '📅 여행 첫날 일정 보기' : '📅 여행 마지막 날 일정 보기';
    note.textContent = index >= 0 ? '도쿄 현지 날짜 기준 · 11월 ' + (19 + day) + '일' : date < dates[0] ? '여행 전이에요. 11월 20일부터 오늘 일정으로 연결됩니다.' : '여행이 끝났어요. 11월 23일 일정으로 연결됩니다.';
  }
  update();
  button.addEventListener('click', () => {
    update();
    const target = document.querySelector(button.getAttribute('href'));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (typeof setActiveDay === 'function') setActiveDay(target.id);
    }
  });
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
}());
