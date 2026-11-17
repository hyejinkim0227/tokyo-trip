(function () {
  'use strict';
  const TTL = 60 * 60 * 1000;
  const locations = {
    tokyo: { name: '도쿄', latitude: 35.6762, longitude: 139.6503 },
    disney: { name: '디즈니씨·마이하마', latitude: 35.6267, longitude: 139.8851 }
  };
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const description = code => {
    if (code === 0) return '☀️ 맑음';
    if ([1, 2].includes(code)) return '🌤️ 구름 조금';
    if (code === 3) return '☁️ 흐림';
    if ([45, 48].includes(code)) return '🌫️ 안개';
    if ([51, 53, 55, 56, 57].includes(code)) return '🌦️ 이슬비';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️ 비';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️ 눈';
    if ([95, 96, 99].includes(code)) return '⛈️ 뇌우';
    return '날씨 정보 없음';
  };
  const number = (value, suffix) => Number.isFinite(value) ? Math.round(value) + suffix : '정보 없음';
  function valid(cache) {
    return cache && Number.isFinite(cache.fetchedAt) && cache.fetchedAt > 0 &&
      cache.daily && Array.isArray(cache.daily.time) &&
      ['weather_code', 'temperature_2m_min', 'temperature_2m_max', 'precipitation_probability_max', 'wind_speed_10m_max'].every(key =>
        Array.isArray(cache.daily[key]) && cache.daily[key].length === cache.daily.time.length);
  }
  const cards = [...document.querySelectorAll('[data-trip-weather]')];
  if (!cards.length) return;
  function render(key, cache, stale, failed) {
    cards.filter(card => card.dataset.weatherLocation === key).forEach(card => {
      const date = card.dataset.tripWeather;
      const index = valid(cache) ? cache.daily.time.indexOf(date) : -1;
      const summary = card.querySelector('.weather-summary');
      const meta = card.querySelector('.weather-meta');
      if (index < 0) {
        summary.textContent = locations[key].name + ' · ' + (date < today() ? '이 날짜의 예보 제공 기간이 지났어요' : failed ? '날씨를 불러오지 못했어요' : '아직 이 날짜의 예보가 없어요');
        if (date < today()) summary.textContent = locations[key].name + ' · 이 날짜의 예보 제공 기간이 지났어요';
        meta.textContent = '아래 날씨 확인 링크를 이용해 주세요.';
        return;
      }
      const d = cache.daily;
      summary.textContent = locations[key].name + ' · ' + description(d.weather_code[index]) +
        ' · 최저 ' + number(d.temperature_2m_min[index], '°C') + ' / 최고 ' + number(d.temperature_2m_max[index], '°C') +
        ' · 강수확률 ' + number(d.precipitation_probability_max[index], '%') +
        (key === 'disney' ? ' · 최대풍속 ' + number(d.wind_speed_10m_max[index], 'm/s') : '');
      const stamp = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(cache.dateStamps?.[date] || cache.fetchedAt));
      meta.textContent = (stale ? '저장된 예보 · 최신 조회 실패 · ' : '') + '조회 ' + stamp + ' (도쿄 시간)' + (date < today() ? ' · 여행 당시 저장한 예보이며 실제 관측값이 아닙니다.' : ' · 예보는 바뀔 수 있어요.');
    });
  }
  async function update(key) {
    const storageKey = 'tokyo-trip-weather-v1-' + key;
    let cache;
    try { const value = JSON.parse(localStorage.getItem(storageKey)); if (valid(value)) cache = value; } catch (_) {}
    const current = today();
    const needed = cards.filter(card => card.dataset.weatherLocation === key && card.dataset.tripWeather >= current);
    if (cache) render(key, cache, false, false);
    if (!needed.length) { render(key, cache, false, false); return; }
    const age = cache ? Date.now() - cache.fetchedAt : Infinity;
    const covered = cache && needed.every(card => cache.daily.time.includes(card.dataset.tripWeather));
    if (covered && age >= 0 && age < TTL) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const location = locations[key];
      const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
        timezone: 'Asia/Tokyo', forecast_days: '16', wind_speed_unit: 'ms' });
      const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params, { signal: controller.signal });
      if (!response.ok) throw new Error('Weather unavailable');
      const data = await response.json();
      const fresh = { fetchedAt: Date.now(), daily: data.daily, dateStamps: {} };
      if (!valid(fresh)) throw new Error('Invalid weather data');
      fresh.daily.time.forEach(date => { fresh.dateStamps[date] = fresh.fetchedAt; });
      // Retain earlier trip dates as forecasts, never present them as observations.
      if (cache) {
        cache.daily.time.forEach((date, i) => {
          if (!fresh.daily.time.includes(date)) {
            fresh.dateStamps[date] = cache.dateStamps?.[date] || cache.fetchedAt;
            Object.keys(fresh.daily).forEach(field => {
              if (Array.isArray(fresh.daily[field]) && Array.isArray(cache.daily[field])) fresh.daily[field].push(cache.daily[field][i]);
            });
          }
        });
      }
      render(key, fresh, false, false);
      try { localStorage.setItem(storageKey, JSON.stringify(fresh)); } catch (_) {}
    } catch (_) { render(key, cache, Boolean(cache), true); }
    finally { clearTimeout(timeout); }
  }
  let running = null;
  function refresh() {
    if (running) return running;
    running = Promise.all(Object.keys(locations).map(update)).finally(() => { running = null; });
    return running;
  }
  refresh();
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}());
