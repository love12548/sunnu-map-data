/* 自動產生（源碼/build_play.py），不要手改。離線遊戲版的 Service Worker。 */
const VER = '7ef6b723', CORE = 'sunnu-play-' + VER, MUSIC = 'sunnu-music';
const LOCAL = ["app.js", "chicken/audio/xianshuiji.mp3", "chicken/chicken.html", "chicken/img/chicken.webp", "chicken/img/duck.webp", "chicken/three.min.js", "dino/dino.html", "ffl/ffl.html", "games/dofu.js", "games/gym.js", "games/jeep.js", "games/train.js", "music/catalog.json", "shooter/audio/bgm1.mp3", "shooter/audio/bgm2.mp3", "shooter/audio/bgm3.mp3", "shooter/audio/bgmBoss.mp3", "shooter/audio/boom.mp3", "shooter/audio/boomBig.mp3", "shooter/audio/clear.mp3", "shooter/audio/hit.mp3", "shooter/audio/hurt.mp3", "shooter/audio/missile.mp3", "shooter/audio/pick.mp3", "shooter/audio/power.mp3", "shooter/audio/roar.mp3", "shooter/audio/shoot.mp3", "shooter/audio/warn.mp3", "shooter/audio/zap.mp3", "shooter/shooter.html"], CROSS = ["https://cdn.jsdelivr.net/gh/ACh-K/Cubic-11@main/fonts/web/Cubic_11.woff2"], CSS = ["https://fonts.googleapis.com/css2?family=DotGothic16&display=swap"];
const ROOT = new URL('./', self.location.href).href;
const say = async m => { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(m); };
self.addEventListener('install', e => { e.waitUntil((async () => {
  const c = await caches.open(CORE); const all = [...LOCAL.map(f => ROOT + f), ROOT + 'play/index.html', ROOT + 'play/manifest.webmanifest', ROOT + 'play/icon-192.png', ROOT + 'play/icon-512.png', ROOT + 'map.js', ...CROSS];
  let done = 0; const total = all.length + CSS.length;
  const tick = () => say({ sunnuPlay: 'progress', done: ++done, total });
  await Promise.all(all.map(async u => { try { const r = await fetch(new Request(u, { cache: 'reload', mode: u.startsWith(ROOT) ? 'same-origin' : 'no-cors' })); if (r.ok || r.type === 'opaque') await c.put(u, r); } catch (er) {} tick(); }));
  for (const u of CSS) { try { const r = await fetch(u); const t = await r.clone().text(); await c.put(u, r); for (const m of t.matchAll(/url\((https:[^)]+)\)/g)) { try { const f = await fetch(m[1]); await c.put(m[1], f); } catch (er) {} } } catch (er) {} tick(); }
  await say({ sunnuPlay: 'ready', ver: VER });
  self.skipWaiting();
})()); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('sunnu-play-') && k !== CORE) await caches.delete(k); await self.clients.claim(); })()); });
const inRoot = u => u.startsWith(ROOT);
async function rangeFrom(req, res) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || ''); if (!m || !res) return res;
  const b = await res.arrayBuffer(), n = b.byteLength, s = m[1] === '' ? Math.max(0, n - +m[2]) : +m[1], en = m[1] === '' || m[2] === '' ? n - 1 : Math.min(+m[2], n - 1);
  return new Response(b.slice(s, en + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': 'bytes ' + s + '-' + en + '/' + n, 'Content-Length': String(en - s + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = req.url, u = new URL(url);
  const mine = inRoot(url), ok = mine || CROSS.includes(url) || CSS.includes(url) || /\/\/(fonts\.gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)\//.test(url) || /^https:\/\/i\.ytimg\.com\//.test(url);
  if (!ok) return;
  if (mine && /\/music\/[^/]+\.mp3$/.test(u.pathname)) {   /* 音樂：只從玩家按「下載音樂」存進來的快取讀，沒有就走網路；支援 Range（手機播放器需要） */
    e.respondWith((async () => { const c = await caches.open(MUSIC), hit = await c.match(u.origin + u.pathname); if (hit) return rangeFrom(req, hit); return fetch(req); })()); return;
  }
  e.respondWith((async () => {
    const c = await caches.open(CORE);
    const net = (async () => { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) { if (mine) for (const k of await c.keys()) { const ku = new URL(k.url); if (ku.pathname === u.pathname && k.url !== url) await c.delete(k); } try { await c.put(req, r.clone()); } catch (er) {} } return r; })();
    /* 線上：優先拿新的（4 秒內）；沒訊號或太慢：用快取 */
    try { return await Promise.race([net, new Promise((_, rj) => setTimeout(() => rj(new Error('slow')), 4000))]); }
    catch (er) { net.catch(() => {}); const hit = (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await c.match(ROOT + 'play/index.html') : null); if (hit) return hit; return net; }
  })());
});
