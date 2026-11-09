/* 離線版已關閉：自我移除版 Service Worker（自動產生，源碼/build_play.py）。曾經裝過的人，下次連網會清掉離線快取並註銷自己，之後一切走一般網路。 */
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil((async () => {
  try { for (const k of await caches.keys()) if (k.startsWith('sunnu-play-') || k === 'sunnu-music') await caches.delete(k); } catch (er) {}
  try { await self.registration.unregister(); } catch (er) {}
  try { for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url).catch(() => {}); } catch (er) {}
})()); });
