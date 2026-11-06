'use strict';
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('skycast.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('skycast.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
};
const S = { unit: store.get('unit', 'C'), speed: store.get('speed', 'kmh'), favs: store.get('favs', []), recent: store.get('recent', []), place: null, data: null, t: 0, chart: null, mode: 'temp', theme: store.get('theme', 'auto'), idx: [], map: null, pin: null };
const DEFAULT_PLACE = { id: '1273294', name: 'Delhi', label: 'Delhi, India', lat: 28.6519, lon: 77.2315 };
const CACHE_MS = 10 * 60 * 1000;

// WMO weather codes -> [label, icon, theme]
const WX = {};
[[[0], 'Clear', '☀️', 'clear'], [[1], 'Mostly clear', '🌤️', 'clear'], [[2], 'Partly cloudy', '⛅', 'cloud'], [[3], 'Overcast', '☁️', 'cloud'],
 [[45, 48], 'Fog', '🌫️', 'fog'], [[51, 53, 55, 56, 57], 'Drizzle', '🌦️', 'rain'], [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain', '🌧️', 'rain'],
 [[71, 73, 75, 77, 85, 86], 'Snow', '❄️', 'snow'], [[95, 96, 99], 'Thunderstorm', '⛈️', 'storm']]
  .forEach(([codes, label, icon, theme]) => codes.forEach(c => WX[c] = [label, icon, theme]));
const wx = c => WX[c] || ['Unknown', '🌡️', 'cloud'];

// Unit helpers (data is stored metric, converted on display)
const T = c => Math.round(S.unit === 'C' ? c : c * 9 / 5 + 32);
const speed = k => S.speed === 'kmh' ? Math.round(k) + ' km/h' : Math.round(k * 0.621371) + ' mph';
const dist = m => S.speed === 'kmh' ? (m / 1000).toFixed(1) + ' km' : (m / 1609.34).toFixed(1) + ' mi';
const compass = d => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Service returned ' + r.status);
  return r.json();
}
function msg(t) { const m = $('#msg'); m.hidden = !t; m.textContent = t || ''; }
const placeLabel = p => [p.name, p.admin1, p.country].filter(Boolean).join(', ');

async function load(place, force = false) {
  S.place = place; store.set('last', place);
  document.body.classList.add('loading'); msg('');
  const key = 'wx2.' + place.lat.toFixed(2) + ',' + place.lon.toFixed(2);
  const cached = store.get(key, null);
  if (!force && cached && Date.now() - cached.t < CACHE_MS) {
    S.data = cached.d; S.t = cached.t;
  } else {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.lat + '&longitude=' + place.lon +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,visibility,wind_speed_10m,precipitation' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' +
      '&timezone=auto&forecast_days=7';
    try {
      if (!navigator.onLine) throw new Error('offline');
      S.data = await getJSON(url); S.t = Date.now();
      store.set(key, { t: S.t, d: S.data });
    } catch (e) {
      if (cached) { S.data = cached.d; S.t = cached.t; msg('Could not reach the weather service. Showing the last saved data.'); }
      else { document.body.classList.remove('loading'); msg('Could not load weather. Check your connection and press Refresh.'); return; }
    }
  }
  S.recent = [place, ...S.recent.filter(p => p.id !== place.id)].slice(0, 5);
  store.set('recent', S.recent);
  render();
}

function render() {
  const d = S.data, c = d.current, p = S.place, [label, icon, theme] = wx(c.weather_code);
  document.body.classList.remove('loading');
  document.body.dataset.sky = theme;
  document.body.classList.toggle('night', S.theme === 'dark' || (S.theme === 'auto' && !c.is_day));
  $('#themeBtn').textContent = 'Theme: ' + S.theme;
  $('#place').textContent = p.label;
  $('#local').textContent = new Date().toLocaleString('en', { timeZone: d.timezone, weekday: 'long', hour: 'numeric', minute: '2-digit' });
  $('#temp').textContent = T(c.temperature_2m) + '°';
  $('#cond').textContent = icon + ' ' + label;
  $('#feels').textContent = 'Feels like ' + T(c.apparent_temperature) + '°';
  $('#unitBtn').textContent = '°' + S.unit;
  $('#speedBtn').textContent = S.speed === 'kmh' ? 'km' : 'mi';

  const h = d.hourly, i0 = Math.max(0, h.time.findIndex(t => t >= c.time.slice(0, 13) + ':00'));
  const day = d.daily;
  const stats = [
    ['Humidity', c.relative_humidity_2m + '%'],
    ['Wind', speed(c.wind_speed_10m) + ' ' + compass(c.wind_direction_10m)],
    ['Pressure', Math.round(c.pressure_msl) + ' hPa'],
    ['Visibility', dist(h.visibility[i0])],
    ['UV index', Math.round(day.uv_index_max[0])],
    ['Chance of rain', day.precipitation_probability_max[0] + '%'],
    ['Sunrise', day.sunrise[0].slice(11, 16)],
    ['Sunset', day.sunset[0].slice(11, 16)],
    ['Moon', moon(Date.now())]
  ];
  $('#stats').innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  const idx = [...Array(24).keys()].map(n => i0 + n).filter(n => n < h.time.length);
  $('#hours').innerHTML = idx.map(n => `<li><span>${h.time[n].slice(11, 16)}</span><span>${wx(h.weather_code[n])[1]}</span><span>${T(h.temperature_2m[n])}°</span><span>${h.precipitation_probability[n]}%</span></li>`).join('');
  S.idx = idx; drawChart(idx);

  const lo = Math.min(...day.temperature_2m_min), hi = Math.max(...day.temperature_2m_max), span = hi - lo || 1;
  $('#days').innerHTML = day.time.map((t, n) => {
    const left = (day.temperature_2m_min[n] - lo) / span * 100, w = (day.temperature_2m_max[n] - day.temperature_2m_min[n]) / span * 100;
    const name = n === 0 ? 'Today' : new Date(t + 'T12:00').toLocaleDateString('en', { weekday: 'short' });
    return `<li><span>${name}</span><span>${wx(day.weather_code[n])[1]}</span><span class="rain">${day.precipitation_probability_max[n]}%</span><span class="lo">${T(day.temperature_2m_min[n])}°</span><i class="bar"><b style="left:${left}%;width:${Math.max(w, 6)}%"></b></i><span>${T(day.temperature_2m_max[n])}°</span></li>`;
  }).join('');

  $('#updated').textContent = 'Updated ' + new Date(S.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  $('#favBtn').textContent = S.favs.some(f => f.id === p.id) ? 'Remove from saved' : 'Save city';
  chips('#favs', S.favs, 'No saved cities yet.');
  chips('#recent', S.recent, 'Cities you search will appear here.');
  fx(theme); map(); air();
}

function chips(sel, list, empty) {
  const el = $(sel);
  el.innerHTML = list.length ? list.map((p, n) => `<li><button type="button" data-n="${n}">${p.name}</button></li>`).join('') : `<li>${empty}</li>`;
  el.onclick = e => { const b = e.target.closest('button'); if (b) load(list[b.dataset.n]); };
}

// Search with autocomplete
let timer;
async function geocode(q) {
  const r = await getJSON('https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=' + encodeURIComponent(q));
  return (r.results || []).map(x => ({ id: String(x.id), name: x.name, label: placeLabel(x), lat: x.latitude, lon: x.longitude }));
}
$('#q').addEventListener('input', e => {
  clearTimeout(timer);
  const q = e.target.value.trim(), box = $('#suggest');
  if (q.length < 2) { box.hidden = true; return; }
  timer = setTimeout(async () => {
    try {
      const res = await geocode(q);
      box.innerHTML = res.map((p, n) => `<li><button type="button" data-n="${n}">${p.label}</button></li>`).join('');
      box.hidden = !res.length;
      box.onclick = ev => { const b = ev.target.closest('button'); if (b) { box.hidden = true; $('#q').value = ''; load(res[b.dataset.n]); } };
    } catch { box.hidden = true; }
  }, 250);
});
$('#searchForm').addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('#q').value.trim(); if (!q) return;
  try {
    const res = await geocode(q);
    if (!res.length) { msg('No city found for “' + q + '”. Check the spelling or try a nearby city.'); return; }
    $('#suggest').hidden = true; $('#q').value = ''; load(res[0]);
  } catch { msg('Search failed. Check your connection and try again.'); }
});

// Controls
$('#locBtn').onclick = () => {
  if (!navigator.geolocation) { msg('Location is not supported in this browser. Search for a city instead.'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => load({ id: 'here', name: 'My location', label: 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
    () => msg('Location access was denied. Allow it in your browser settings or search for a city.'));
};
$('#unitBtn').onclick = () => { S.unit = S.unit === 'C' ? 'F' : 'C'; store.set('unit', S.unit); if (S.data) render(); };
$('#speedBtn').onclick = () => { S.speed = S.speed === 'kmh' ? 'mi' : 'kmh'; store.set('speed', S.speed); if (S.data) render(); };
$('#refresh').onclick = () => load(S.place, true);
$('#favBtn').onclick = () => {
  const p = S.place, saved = S.favs.some(f => f.id === p.id);
  S.favs = saved ? S.favs.filter(f => f.id !== p.id) : [...S.favs, p];
  store.set('favs', S.favs); render();
};
window.addEventListener('offline', () => msg('You are offline. Showing saved data.'));
window.addEventListener('online', () => msg(''));

$('#unitBtn').textContent = '°' + S.unit;
$('#speedBtn').textContent = S.speed === 'kmh' ? 'km' : 'mi';
load(store.get('last', DEFAULT_PLACE));

// ---- Advanced features ----
function drawChart(idx) {
  if (!window.Chart) return;
  const h = S.data.hourly, m = S.mode, mi = S.speed === 'kmh' ? 1 : 0.621371;
  const vals = idx.map(n => m === 'wind' ? Math.round(h.wind_speed_10m[n] * mi) : m === 'rain' ? h.precipitation[n] : T(h.temperature_2m[n]));
  const unit = m === 'wind' ? (S.speed === 'kmh' ? ' km/h' : ' mph') : m === 'rain' ? ' mm' : '°';
  if (S.chart) S.chart.destroy();
  S.chart = new Chart($('#chart'), {
    type: m === 'rain' ? 'bar' : 'line',
    data: { labels: idx.map(n => h.time[n].slice(11, 16)), datasets: [{ data: vals, borderColor: '#fff', backgroundColor: m === 'rain' ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.15)', fill: m !== 'rain', tension: .4, pointRadius: 0 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: '#fff', maxTicksLimit: 8 }, grid: { display: false } }, y: { beginAtZero: m !== 'temp', ticks: { color: '#fff', callback: v => v + unit }, grid: { color: 'rgba(255,255,255,.15)' } } } }
  });
}
$('#tabs').onclick = e => {
  const b = e.target.closest('button'); if (!b || !S.data) return;
  S.mode = b.dataset.m;
  [...$('#tabs').children].forEach(x => x.setAttribute('aria-pressed', x === b));
  drawChart(S.idx);
};

function moon(ms) {
  const syn = 29.530588853, age = (((ms - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % syn + syn) % syn;
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  return names[Math.floor(age / syn * 8 + .5) % 8] + ' ' + Math.round((1 - Math.cos(2 * Math.PI * age / syn)) / 2 * 100) + '%';
}

async function air() {
  const el = $('#air'), p = S.place;
  try {
    const r = (await getJSON('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + p.lat + '&longitude=' + p.lon + '&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone')).current;
    if (r.us_aqi == null) throw new Error('no data');
    const a = r.us_aqi, lv = a <= 50 ? 'Good' : a <= 100 ? 'Moderate' : a <= 150 ? 'Unhealthy for sensitive groups' : a <= 200 ? 'Unhealthy' : a <= 300 ? 'Very unhealthy' : 'Hazardous';
    el.innerHTML = [['AQI (US)', a + ' · ' + lv], ['PM2.5', r.pm2_5 + ' µg/m³'], ['PM10', r.pm10 + ' µg/m³'], ['NO₂', r.nitrogen_dioxide + ' µg/m³'], ['Ozone', r.ozone + ' µg/m³']]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  } catch { el.innerHTML = '<div><dd>Air quality data is not available for this location.</dd></div>'; }
}

function map() {
  if (!window.L) return;
  const p = S.place, ll = [p.lat, p.lon];
  if (!S.map) {
    S.map = L.map('map').setView(ll, 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(S.map);
    S.pin = L.marker(ll).addTo(S.map);
    S.map.on('click', e => load({ id: 'pin', name: 'Pinned spot', label: 'Pinned spot (' + e.latlng.lat.toFixed(2) + ', ' + e.latlng.lng.toFixed(2) + ')', lat: e.latlng.lat, lon: e.latlng.lng }));
  } else { S.map.setView(ll, S.map.getZoom()); S.pin.setLatLng(ll); }
}

let fxRaf;
function fx(theme) {
  const cv = $('#fx'), ctx = cv.getContext('2d');
  cancelAnimationFrame(fxRaf);
  cv.width = innerWidth; cv.height = innerHeight;
  if (!['rain', 'snow', 'storm'].includes(theme) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const snow = theme === 'snow';
  const ps = Array.from({ length: snow ? 90 : 140 }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, v: snow ? 1 + Math.random() * 1.5 : 9 + Math.random() * 6, s: Math.random() * 2 + 1 }));
  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (const p of ps) {
      ctx.beginPath();
      if (snow) { ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); p.x += Math.sin(p.y / 30); }
      else { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + 12); ctx.stroke(); p.x -= 1; }
      p.y += p.v;
      if (p.y > cv.height) { p.y = -10; p.x = Math.random() * cv.width; }
    }
    fxRaf = requestAnimationFrame(tick);
  })();
}
addEventListener('resize', () => { if (S.data) fx(wx(S.data.current.weather_code)[2]); });

$('#themeBtn').onclick = () => { S.theme = { auto: 'light', light: 'dark', dark: 'auto' }[S.theme]; store.set('theme', S.theme); if (S.data) render(); };
$('#themeBtn').textContent = 'Theme: ' + S.theme;

async function quick(p) {
  return getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + p.lat + '&longitude=' + p.lon + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto');
}
$('#cmpForm').addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('#cq').value.trim(); if (!q || !S.place) return;
  try {
    const res = await geocode(q);
    if (!res.length) { msg('No city found for “' + q + '”. Check the spelling or try a nearby city.'); return; }
    const rows = await Promise.all([S.place, res[0]].map(async p => ({ p, d: await quick(p) })));
    const spec = [
      ['Now', d => wx(d.current.weather_code)[1] + ' ' + T(d.current.temperature_2m) + '°'],
      ['Feels like', d => T(d.current.apparent_temperature) + '°'],
      ['High / low', d => T(d.daily.temperature_2m_max[0]) + '° / ' + T(d.daily.temperature_2m_min[0]) + '°'],
      ['Humidity', d => d.current.relative_humidity_2m + '%'],
      ['Wind', d => speed(d.current.wind_speed_10m)]];
    $('#cmp').innerHTML = '<table class="cmp"><tr><th></th>' + rows.map(r => `<th>${r.p.name}</th>`).join('') + '</tr>' +
      spec.map(([k, f]) => `<tr><th>${k}</th>${rows.map(r => `<td>${f(r.d)}</td>`).join('')}</tr>`).join('') + '</table>';
    $('#cq').value = '';
  } catch { msg('Comparison failed. Check your connection and try again.'); }
});
