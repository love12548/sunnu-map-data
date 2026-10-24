(function(){
/* ---- ring_assets.js ---- */
var RingAssets = {"fish": {"w": 74, "h": 83, "pal": {"k": "#8f86b3", "g": "#c9c9cc", "w": "#ffffff", "y": "#f4dd7a", "Y": "#fbf3bd"}, "d": ".110k4.69k7.66k3g2k4.64k3g3k2wk2.62k3g4k2wk3.61k2g5k2w2k2.60k2g6k3wk3.58k3y4g3k2w2k2.58k2gyk2yg3k2w2k2.57k2g2y3g5kw2k3.56k2g10w4k2.55k2g10w5k2.55k2g10w5k2.54k2g9kgw5k2.54k2g4k6w2k2w2k2.54k2g4k6wk3w3k2.52k2g7k2w2k5w2k2.52k2g3kg4wk4wk6.52k2g2k10w3k5.51k2g4k7w8k2.51k2g7w12k2.15g.35k2g3kg3w12k2.14g2.21g.11k4g2k2g3w12k5.11g2.21g.6k9g2k2g3w12k10.5g3.21g.2k9yk2g3k2g3w12k2y3k9.g2.22gk5y7k2g9w11k2y8k6g.20k2gky11k2g3k2g4w11k2y13g2k2.16k3.gy12k2g3k2g4w11k2y13g2k3.14k3y.gky11k2g3k2g4w11k2y12k2gy2k2.13k4.k15g3k2g5w10k16g2k4.11k4.4k13g10w10k14.2g2.k3.12k.17k2g10w10k3.14g.3k.30k2g3k2g5w10k2.50k2g3k2g5w10k2.50k2g3k2g5w10k2.50k2g3k3g5w9k2.50k2g4kg6w9k2.50k2g4k2g5w9k2.50k2g4k2g5w9k2.50k2g4k2g5w9k2.50k2g4k2g5w9k2.50k2g4k2g5w8k2.51k3g10w8k2.52k2g4kg5w8k2.52k2g4k2g4w8k2.51gk2g4k2g4w7k3.51gk3g3k3g3w7k2.52g2k2g4kg4w7k2y.51g2k2g10w6k2y2.50g2k2g4k2g4w6k2y3.49g3k2g3k2g4w5k2y4.50g2k2g3k3g3w5k2y2.53gk3g3k2g4w4k2y.54g2k2g9w4k2y.55gk3g8w4k2.56g2k2g3k2g4w3k2.57gk3g2k2g4w3k2.57g2k3gk2g5w2k2.58g2k2g8w2k2.61k2g8wk2.62k2g8k7.57k3g8k8.57k3g6k2w3k5.56k4g5kwy4.k4.55k5g2k2w4y3.k3.56k7w5.y3k4.55k2wywywy5.2yg2k3.54k2wywyw5y3g4k3.53k3ywyw3kw.kg6k3.53k2y2wywk14.53k2y2wyw2k13.54k2ywy2wk2.65k2y2wywk2.66k2y3wk2.66k3yg2k2.67k2g4k2.67k2g3k2.68k2g2k2.69k2gk2.70k5.70k4.72k2.21"}};

/* ---- gym_game.js ---- */
/* 古厝呷飯・體操午仔魚（橫向闖關）。由 build_gym.py 從 體操午仔魚/闖關試玩.html 產生，不要手改。依賴 RingAssets.fish。
   用法：var g = GymGame.create({ host, diff:'normal', sound:()=>true, onEnd(res){...} }); g.destroy()／g.freeze() */
var GymGame = (function () {
  function create(o) {
  /* ---------- 魚像素圖 ---------- */
  var F = RingAssets.fish, FW = F.w, FH = F.h, GX = 37, GY = 29;
  function rle(d, w, h, pal) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d');
    var f = d.replace(/(\D)(\d+)/g, function (m, ch, n) { return ch.repeat(+n); });
    for (var i = 0; i < w * h; i++) { var ch = f[i]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(i % w, (i / w) | 0, 1, 1); } }
    return c;
  }
  var fishImg = rle(F.d, FW, FH, F.pal);
  (function () {                                       // 手臂重畫：粗一點、圓潤、尖端往下勾（原插圖手尖有握把小棒，擦掉）；左手在 x0–23，右手對稱
    var q = fishImg.getContext('2d'), P = ['........................','........................','........................','........................','........................','........................','........................','........................','........................','.....................kkk','.................kkkkyyy','...............kkYYYYyyy','............kkkYYyyyyyyy','..........kkyyyyyyyyyyyy','........kkyyyyyyyyyyyyyy','.......kyyyyyyyyyyyyyyyy','......kykkkkkyyyyyyyyyyy','......kk.....kkkkkkkyyyy','......k.............kkkk','.....k..................','........................','........................','........................','........................'], y, x, c;
    q.clearRect(0, 14, 24, 24); q.clearRect(50, 14, 24, 24);
    for (y = 0; y < P.length; y++) for (x = 0; x < 24; x++) { c = P[y][x]; if (c === '.' || !F.pal[c]) continue; q.fillStyle = F.pal[c]; q.fillRect(x, 14 + y, 1, 1); q.fillRect(73 - x, 14 + y, 1, 1); }
  })();
  var K = 0.55, GDX = 29.5 * K, HO = 10;            // 縮放、兩隻手距離一半、身體中心比手低多少

  /* ---------- 關卡 ---------- */
  var G = 700, RUN = 100, JUMP = 300, AIRV = 130, TUCK = 0.70, TAU = 0.08, DAMP = 0.12, GRAB = 28, HBW = 14, HBH = 40;
  /* 關卡＝一串「區」。每區有自己的平台、吊環、動物、主題色；建好後合併成一個 LV。
     平台 [x, y(上緣), w, 樣式]；吊環 [x, y(手的高度), {kind:'move'|'break', ax, per}]；平台樣式 brick＝磚牆、roof＝屋瓦 */
  var ZONES = [
    { name: '魚塭', x0: 0, plats: [[-80, 400, 350, 'brick'], [680, 345, 290, 'brick'], [1305, 305, 280, 'brick']],
      rings: [[335, 345], [485, 335], [635, 322], [985, 278], [1125, 250], [1265, 222]],
      ens: [{ k: 'gull', x0: 380, x1: 600, y: 292, spd: 46 }, { k: 'otter', x: 560, per: 2.8, off: 0.6 }, { k: 'cat', x0: 700, x1: 950, plat: 1, spd: 36 },
        { k: 'gull', x0: 1040, x1: 1200, y: 205, spd: 40 }, { k: 'heron', x: 1195, per: 3.4, off: 1.0 }],
      theme: { sky: ['#3f86ec', '#5ea6ff', '#8ccaff', '#bfe8ff'], sun: '#ffe34a', halo: '255,240,180', hill1: '#5cc04f', hill2: '#3fa447', cloud: '255,255,255', water: ['#3f8fe0', '#1f56ae'], wave: '#c4e8ff' } },
    { name: '古厝屋簷', x0: 1600, plats: [[2000, 248, 250, 'roof'], [2600, 175, 240, 'roof'], [3045, 125, 300, 'roof']],
      rings: [[1665, 255], [1810, 240, { kind: 'move', ax: 32, per: 4.2 }], [1955, 225], [2265, 181], [2410, 165], [2555, 150, { kind: 'break' }], [2855, 110], [3000, 100]],
      ens: [{ k: 'crow', x0: 1690, x1: 1900, y: 195, spd: 60 }, { k: 'mouse', x0: 2020, x1: 2230, plat: 3, spd: 70 }, { k: 'tile', x: 2340, per: 3.2, off: 0.8, y0: 100 },
        { k: 'tile', x: 2930, per: 2.6, off: 1.6, y0: 30 }],
      theme: { sky: ['#3b4a8c', '#c2607a', '#f2a05a', '#f7c98a'], sun: '#ffd9a0', halo: '255,170,100', hill1: '#a07a92', hill2: '#7f5f7c', cloud: '255,205,190', water: ['#4a6fa0', '#25375f'], wave: '#8fb0d8' } },
    { name: '水管牆', x0: 3900, plats: [[3880, 330, 1400, 'room'], [4110, 230, 270, 'pipe', 16], [4850, 230, 200, 'pipe', 16]], rings: [[4450, 205], [4610, 195, { kind: 'move', ax: 28, per: 3.6 }], [4750, 205]], ens: [{ k: 'ball8', x0: 5080, x1: 4790, y: 320, per: 4.2, off: 0.5 }],
      theme: { sky: ['#3f86ec', '#5ea6ff', '#8ccaff', '#bfe8ff'], sun: '#ffe34a', halo: '255,240,180', hill1: '#5cc04f', hill2: '#3fa447', cloud: '255,255,255', water: ['#3f8fe0', '#1f56ae'], wave: '#c4e8ff' } }
  ];
  ZONES.push(
    { name: '雲上吊環', x0: 6000, plats: [[6020, 300, 170, 'cloud', 16], [6500, 262, 130, 'cloud', 16], [7050, 235, 260, 'cloud', 16]],
      rings: [[6215, 235], [6335, 240], [6455, 238, { kind: 'move', ax: 24, per: 3.6 }], [6645, 197], [6765, 200, { kind: 'break' }], [6885, 205], [7005, 210, { kind: 'move', ax: 22, per: 3.2 }]], ens: [],
      theme: { sky: ['#5ab0ff', '#8fd0ff', '#c2e8ff', '#eaf7ff'], sun: '#fff3a0', halo: '255,250,200', hill1: '#bfe0ff', hill2: '#a0d0f5', cloud: '255,255,255', water: ['#bfe6ff', '#9fd0f5'], wave: '#ffffff' } },
    { name: '魚乾倉庫', x0: 7700, plats: [[7700, 330, 330, 'wh'], [8600, 330, 800, 'wh']],
      rings: [[8105, 268, { kind: 'rail', ax: 40, per: 5, ph: 0 }], [8225, 266, { kind: 'rail', ax: 40, per: 5, ph: 1.6 }], [8345, 268, { kind: 'rail', ax: 40, per: 5, ph: 3.1 }], [8465, 266, { kind: 'rail', ax: 40, per: 5, ph: 4.7 }], [9080, 265, { kind: 'rail', ax: 70, per: 5.5, ph: 0 }]],
      ens: [{ k: 'mouse', x0: 7740, x1: 8000, plat: 'x:7700', spd: 60 }, { k: 'cat', x0: 8960, x1: 9160, plat: 'x:8600', spd: 45 }],
      theme: { sky: ['#3b2a1c', '#4a3524', '#5a4230', '#6b4a2e'], sun: '#ffcf6a', halo: '255,200,110', hill1: '#4a3220', hill2: '#3a2616', cloud: '200,160,110', water: ['#2a1c10', '#1a1008'], wave: '#6b4a2e' } }
  );
  var GOAL = { x: 3250, y: 66, r: 24, beam: -4 };         // 終點吊環架（像旗杆：跑過去一定掛上，跳越高分越多）；y＝沒抓前環的位置、beam＝橫樑高度
  var QB = { x: 800, y: 262 }, ROOMX = 3800, EXITX = 5200;
  function isMv(r) { return r.kind === 'move' || r.kind === 'rail'; }
  var BOXES = [{ x: 7830, y: 262 }, { x: 7930, y: 262 }, { x: 8830, y: 262 }, { x: 8960, y: 262 }, { x: 9180, y: 195, gold: 1 }];   // 魚乾倉庫的木箱：空翻頂到就掉出魚乾（金色木箱在高處，要抓軌道吊環盪上去）
  var QBS = [{ x: 800, y: 262, room: 0 }, { x: 2490, y: 100, room: 1, ret: { x: 2630, y: 155 } }, { x: 2720, y: 92, room: 2 }];   // 四個「？」磚，各通往一間隱藏室
  var RXS = [3800, 5700, 7600, 9400, 11300], ENT = [3930, 6050, 7740, 9520], ENTY = [309, 279, 309, 309], EXS = [5200, 7270, 9330, 11000], EXY = [330, 235, 330, 330];   // 各室範圍、入口、出口
  var ROOM_NAMES = ['水管牆！', '雲上吊環！', '魚乾倉庫！'], COIN_NAME = ['8 號球', '雲朵星', '魚乾'], GOLD_NAME = ['金色 8 號球', '金色雲朵星', '金色魚乾'], TITLES = ['水管牆霸主', '雲端飛午', '倉庫大盜'];
  function roomIdx(x) { if (x <= ROOMX) return -1; for (var i = 3; i >= 0; i--) if (x >= RXS[i]) return i; return 0; }       // 「？」磚（空翻頂到＝進隱藏室）、隱藏室範圍與出口
  var ROOM_COINS = [[4250, 298, 50], [4860, 298, 100], [5110, 298, 50], [4200, 198, 50], [4320, 198, 50], [4540, 160, 100], [4690, 156, 100], [4950, 198, 100], [4880, 150, 300, 1]].map(function (c) { return { x: c[0], y: c[1], v: c[2], gold: c[3] | 0, r: 0, got: false }; });
  [[1, [[6275, 185, 50], [6395, 190, 50], [6565, 225, 50], [6705, 150, 100], [6825, 155, 50], [6945, 160, 50], [7110, 205, 100], [7230, 205, 100], [6455, 185, 300, 1]]],
   [2, [[7760, 300, 50], [7880, 300, 50], [8000, 300, 50], [8165, 232, 50], [8285, 232, 50], [8405, 232, 50], [8780, 300, 50], [9180, 300, 50], [7830, 296, 100, 0, 0], [7930, 296, 100, 0, 1], [8830, 296, 100, 0, 2], [8960, 296, 100, 0, 3], [9180, 228, 300, 1, 4]]]].forEach(function (rr) { rr[1].forEach(function (c) { ROOM_COINS.push({ x: c[0], y: c[1], v: c[2], gold: c[3] | 0, r: rr[0], b: c[4], got: false }); }); });
  var STEAM = [{ x: 4250, y: 230, per: 3.6, off: 0 }, { x: 4770, y: 330, per: 3.8, off: 1.2 }], WHEELS = [{ x: 4095, vy: 445, vx: 40, per: 3.6, off: 0.6 }, { x: 4815, vy: 505, vx: 90, per: 3.6, off: 2.4 }];   // 養殖池打水水車（增氧機）：水花彈射＋增氧加速（額外捷徑）
  var GEY = { x: 4045, w: 84, per: 3.4, t0: 1.0, t1: 2.5 };
  function geyU() { return (((W.t - (W.gs || 0)) % GEY.per) + GEY.per) % GEY.per; }   // 噴水柱的週期從「進水管牆／回到上一段」那一刻對齊，走到柱子時剛好噴                    // 噴水柱：每 3.4 秒噴 1.5 秒（噴前 0.6 秒冒泡）
  var SLIDE = [[4392, 266], [4470, 266], [4540, 275], [4600, 295], [4650, 320], [4705, 330]], SLEN = [0];   // 水管溜滑梯（腳底座標）
  for (var sli = 1; sli < SLIDE.length; sli++) SLEN.push(SLEN[sli - 1] + Math.hypot(SLIDE[sli][0] - SLIDE[sli - 1][0], SLIDE[sli][1] - SLIDE[sli - 1][1]));
  var LV = { w: 9400, waterY: 470, bottom: 620, goalX: 3240, plats: [], rings: [], zones: ZONES };
  var ENS = [];
  ZONES.forEach(function (z) {
    z.plats.forEach(function (q) { LV.plats.push({ x: q[0], y: q[1], w: q[2], st: q[3], h: q[4] || LV.bottom - q[1] }); });
    z.rings.forEach(function (r) { var o = r[2] || {}; LV.rings.push({ x: r[0], y: r[1], R: 70, kind: o.kind || '', cx: r[0], ax: o.ax || 0, per: o.per || 3, ph: o.ph || 0 }); });
    z.ens.forEach(function (e) { if (typeof e.plat === 'string') { var px0 = parseInt(e.plat.slice(2), 10); LV.plats.forEach(function (q, qi) { if (q.x === px0) e.plat = qi; }); } ENS.push(e); });
  });
  LV.rings.forEach(function (r) { r.px = r.x; r.py = r.y - r.R; });
  function zoneIdx(x) { var zi = 0; for (var i = 1; i < ZONES.length; i++) if (x >= ZONES[i].x0) zi = i; return zi; }

  /* ---------- 難度：簡單／普通／困難（愛心數、無敵時間、動物速度、判定大小） ---------- */
  var DFS = {
    easy: { name: '簡單', lives: Infinity, hp: 5, inv: 2.0, sp: 0.8, hit: 0.85, fall: 0, reset: 0 },
    normal: { name: '普通', lives: 5, hp: 3, inv: 1.5, sp: 1.0, hit: 1.0, fall: 1, reset: 0 },
    hard: { name: '困難', lives: 4, hp: 2, inv: 1.0, sp: 1.3, hit: 1.15, fall: 1, reset: 0 }
  };
  var diffKey = DFS[o.diff] ? o.diff : 'normal', LOCK = !!o.diff, dead = false, raf = 0, reported = false, tmr = 0;
  
  function DF() { return DFS[diffKey]; }
  function setDiff(k) { diffKey = k; try { localStorage.setItem('sunnuGymDiff', k); } catch (e) { } }
  /* ---------- 敵人：海鷗（空中巡邏）、貓（平台巡邏）、水獺（水中跳出）、鷺鷥（水中伸長脖子啄）。空翻中碰到＝擊退 ---------- */
  function mkEnemies() {
    return ENS.map(function (sp) {
      var e = { k: sp.k, s: sp, x: sp.x0 !== undefined ? sp.x0 : sp.x, y: 0, dir: 1, t: sp.off || 0, alive: true, boxes: null, dieT: 0, vy: 0, neck: 14, warn: false };
      if (sp.k === 'cat') e.y = LV.plats[sp.plat].y - 6; if (sp.k === 'mouse') e.y = LV.plats[sp.plat].y - 4; if (sp.k === 'gull' || sp.k === 'crow' || sp.k === 'ball8') e.y = sp.y; return e;
    });
  }
  function overlap(a, b) { return a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]; }
  function killEnemy(W, e) {
    e.alive = false; e.dieT = 0; e.vy = -220; W.kills++; W.score += 200; pop(W, e.x, (e.boxes ? e.boxes[0][1] : e.y) - 16, '擊退！+200', '#ffd24a');
    for (var i = 0; i < 10; i++) W.fx.push({ x: e.x, y: e.y, vx: (Math.random() - .5) * 200, vy: -Math.random() * 160, t: 0, life: 0.5, gold: 1 });
  }
  function hurt(W, e) {
    var p = W.p; var safe = p.x > ROOMX; if (!safe) W.hp--; p.inv = DF().inv; /* 隱藏室只彈開、不扣血 */ var away = p.x >= e.x ? 1 : -1;
    pop(W, p.x, p.y - 34, safe ? '哎呀！' : '痛！', '#ff8a8a');
    if (safe) { p.inv = 0.8; return; }
    if (p.swing) { p.swing = null; p.vx = away * 90; p.vy = -140; p.rel = 0.7; p.on = false; p.jumping = false; }
    else { p.vy = -220; p.vx = away * 130; p.stun = 0.35; p.on = false; p.jumping = false; }
    if (W.hp <= 0) { p.dead = 1; W.faints++; W.fl = { n: 0, pts: 0 }; pop(W, p.x, p.y - 50, '被抓走了…', '#ff8a8a'); }
  }
  function heronNeck(e) {                                   // 鷺鷥一個週期：休息→縮頸蓄力（警告）→猛啄→停→收回
    var T = e.s.per, u = e.t % T, MAX = 178, REST = 14, hot = false, warn = false, nk;
    if (u < 1.8) nk = REST;
    else if (u < 2.4) { nk = REST + 16 * (u - 1.8) / 0.6; warn = true; }
    else if (u < 2.65) { var k = (u - 2.4) / 0.25; nk = 30 + (MAX - 30) * (1 - (1 - k) * (1 - k)); hot = true; }
    else if (u < 3.05) { nk = MAX; hot = true; }
    else nk = MAX - (MAX - REST) * ((u - 3.05) / (T - 3.05));
    return { nk: nk, hot: hot && nk > 50, warn: warn };
  }
  function updEnemies(W, dt) {
    var p = W.p, pb = [p.x - 7, p.y - 20, 14, 40];
    if (p.inv > 0) p.inv -= dt;
    W.en.forEach(function (e) {
      var sp = e.s;
      if (!e.alive) { e.dieT += dt; e.vy += 900 * dt; e.y += e.vy * dt; e.x += e.dir * 30 * dt; e.boxes = null; return; }
      var spm = DF().sp; e.t += dt * spm;
      if (e.k === 'gull' || e.k === 'crow') { e.x += e.dir * sp.spd * spm * dt; if (e.x > sp.x1) { e.x = sp.x1; e.dir = -1; } else if (e.x < sp.x0) { e.x = sp.x0; e.dir = 1; } e.y = sp.y + (e.k === 'crow' ? 16 : 10) * Math.sin(e.t * (e.k === 'crow' ? 3.6 : 3)); e.boxes = [[e.x - 8, e.y - 4, 16, 9]]; }
      else if (e.k === 'cat') { e.x += e.dir * sp.spd * spm * dt; if (e.x > sp.x1) { e.x = sp.x1; e.dir = -1; } else if (e.x < sp.x0) { e.x = sp.x0; e.dir = 1; } e.boxes = [[e.x - 8, e.y - 6, 16, 12]]; }
      else if (e.k === 'mouse') { e.x += e.dir * sp.spd * spm * dt; if (e.x > sp.x1) { e.x = sp.x1; e.dir = -1; } else if (e.x < sp.x0) { e.x = sp.x0; e.dir = 1; } e.boxes = [[e.x - 6, e.y - 4, 12, 8]]; }
      else if (e.k === 'tile') {
        var tu = e.t % sp.per, T0 = sp.per - 0.5; e.x = sp.x; e.boxes = null; e.warn = tu >= T0 - 0.9 && tu < T0; e.falling = false; e.y = sp.y0;
        if (tu >= T0) { var ty = sp.y0 + 760 * (tu - T0); if (ty < LV.waterY) { e.y = ty; e.falling = true; e.boxes = [[sp.x - 8, ty - 6, 16, 12]]; } }
      }
      else if (e.k === 'ball8') { var bu = e.t % sp.per, bd = 3.6; e.boxes = null; if (bu < bd) { e.x = sp.x0 + (sp.x1 - sp.x0) * (bu / bd); e.boxes = [[e.x - 7, e.y - 6, 14, 14]]; } }
      else if (e.k === 'otter') {
        var u = e.t % sp.per; e.boxes = null; e.warn = u >= 1.9 && u < 2.3; e.x = sp.x;
        if (u >= 2.3) { var ls = u - 2.3, yy = LV.waterY - 480 * ls + 350 * ls * ls; if (yy < LV.waterY - 4) { e.y = yy; e.vy = -480 + 700 * ls; e.boxes = [[sp.x - 7, yy - 8, 14, 16]]; } }
      } else if (e.k === 'heron') {
        var hn = heronNeck(e), headY = 448 - hn.nk; e.neck = hn.nk; e.warn = hn.warn; e.x = sp.x; e.y = 448;
        e.boxes = hn.hot ? [[e.x - 4, headY - 3, 8, hn.nk + 3], [e.x - 12, headY - 4, 16, 9]] : [[e.x - 4, headY - 3, 8, 9]];
      }
      if (e.boxes && DF().hit !== 1) { var hs = DF().hit; e.boxes = e.boxes.map(function (b) { return [b[0] + b[2] * (1 - hs) / 2, b[1] + b[3] * (1 - hs) / 2, b[2] * hs, b[3] * hs]; }); }
      if (!e.boxes || p.dead > 0) return;
      for (var i = 0; i < e.boxes.length; i++) if (overlap(pb, e.boxes[i])) {
        if (p.spinT > 0 && e.k === 'ball8') { e.t += sp.per - (e.t % sp.per); W.score += 100; W.kills++; pop(W, e.x, e.y - 22, '彈開 8 號球！+100', '#ffd24a'); sfx('kill'); } else if (p.spinT > 0 && e.k !== 'tile') killEnemy(W, e); else if (p.inv <= 0) hurt(W, e);
        break;
      }
    });
  }
  /* ---------- 音效（WebAudio 合成，第一次點擊後才有聲音） ---------- */
  var AC = null;
  function audioOn() { try { if (o.sound && !o.sound()) return; if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
  function tone(f0, f1, dur, type, vol, delay) {
    if (!AC || false) return;
    try {
      var t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      gn.gain.setValueAtTime(vol || 0.06, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  var SFX = {
    jump: function () { tone(300, 640, 0.14, 'square', 0.05); },
    grab: function () { tone(520, 780, 0.08, 'triangle', 0.08); tone(780, 1040, 0.08, 'triangle', 0.06, 0.07); },
    release: function () { tone(700, 260, 0.2, 'sawtooth', 0.04); },
    perfect: function () { [880, 1175, 1568].forEach(function (f, i) { tone(f, f * 1.01, 0.12, 'triangle', 0.07, i * 0.07); }); },
    coin: function () { tone(988, 988, 0.05, 'square', 0.05); tone(1319, 1319, 0.14, 'square', 0.05, 0.05); },
    warp: function () { tone(500, 120, 0.4, 'triangle', 0.08); tone(120, 700, 0.3, 'sine', 0.06, 0.2); },
    flip: function () { tone(400, 900, 0.18, 'sine', 0.07); },
    land: function () { tone(180, 90, 0.08, 'triangle', 0.08); },
    hurt: function () { tone(300, 70, 0.3, 'sawtooth', 0.08); },
    kill: function () { tone(500, 1000, 0.1, 'square', 0.06); tone(1000, 1500, 0.12, 'square', 0.05, 0.08); },
    splash: function () { tone(900, 150, 0.35, 'sawtooth', 0.025); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.2, 'square', 0.06, i * 0.13); }); }
  };
  var NB = null;
  function noiseBuf() { if (!NB) { NB = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); var d = NB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return NB; }
  function noise(dur, vol, hpf, delay, t0) {
    if (!AC || false) return;
    try {
      var t = t0 || (AC.currentTime + (delay || 0)), src = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
      src.buffer = noiseBuf(); fl.type = 'highpass'; fl.frequency.value = hpf || 2000; gn.gain.setValueAtTime(vol || 0.05, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(fl); fl.connect(gn); gn.connect(AC.destination); src.start(t); src.stop(t + dur + 0.02);
    } catch (e) {}
  }
  SFX.step = function () { noise(0.04, 0.012, 1800); };
  SFX.whoosh = function () { noise(0.22, 0.03, 700); };
  SFX.hurt = function () { tone(320, 60, 0.32, 'sawtooth', 0.08); noise(0.18, 0.06, 500); };
  SFX.land = function () { tone(170, 80, 0.09, 'triangle', 0.09); noise(0.05, 0.03, 900); };
  SFX.save = function () { [660, 880, 1320].forEach(function (f, i) { tone(f, f, 0.1, 'triangle', 0.05, i * 0.06); }); };
  SFX.zone = function () { [523, 659, 784].forEach(function (f, i) { tone(f, f, 0.18, 'triangle', 0.06, i * 0.1); }); };
  SFX.low = function () { tone(220, 180, 0.12, 'square', 0.04); tone(220, 180, 0.12, 'square', 0.04, 0.2); };
  /* 背景音樂：8 小節循環（C－Am－F－G），主旋律＋低音＋鼓；點開始後起播、過關停 */
  var MUS = { on: true, i: 0, next: 0 };
  try { if (localStorage.getItem('sunnuGymMusic') === '0') MUS.on = false; } catch (e) { }
  var CH = [48, 45, 41, 43], MEL = [
    [72, 0, 76, 79, 76, 0, 72, 76], [69, 0, 72, 76, 72, 0, 69, 72], [69, 0, 72, 77, 72, 0, 69, 72], [71, 0, 74, 79, 74, 0, 71, 67],
    [79, 76, 72, 76, 79, 0, 84, 0], [76, 72, 69, 72, 76, 0, 81, 0], [77, 74, 69, 74, 77, 0, 81, 0], [79, 74, 71, 74, 79, 77, 76, 74]];
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function mtone(t0, f, dur, type, vol) { try { var o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.value = f; gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(gn); gn.connect(AC.destination); o.start(t0); o.stop(t0 + dur + 0.02); } catch (e) { } }
  function musicStep(t0, q) {
    if (MUS.room) {                                                  // 水管牆專屬曲：Am-F-G-E 的跳躍低音＋泡泡音
      var rb = (MUS.i / 8 | 0) % 4, rs = MUS.i % 8, rr = [45, 41, 43, 40][rb], RM = [[81, 0, 84, 81, 0, 76, 0, 79], [77, 0, 81, 77, 0, 72, 0, 76], [79, 0, 83, 79, 0, 74, 0, 77], [76, 0, 80, 76, 83, 80, 76, 0]][rb];
      if (RM[rs]) mtone(t0, mf(RM[rs] + (MUS.rt || 0)), q * 0.9, 'sine', 0.03); if (rs % 2 === 0) mtone(t0, mf(rr + (rs === 4 ? 12 : 0) + (MUS.rt || 0)), q * 0.8, 'square', 0.03); if (rs === 0 || rs === 3 || rs === 6) mtone(t0, 90, 0.1, 'sine', 0.08);
      if (rs % 2) noise(0.04, 0.01, 7000, 0, t0); MUS.i++; return;
    }
    var bar = (MUS.i / 8 | 0) % 8, st = MUS.i % 8, root = CH[bar % 4], lead = MEL[bar][st];
    if (lead) mtone(t0, mf(lead + (MUS.tr || 0)), q * 1.6, MUS.tr ? 'sawtooth' : 'square', MUS.tr ? 0.012 : 0.018);
    mtone(t0, mf((st % 2 ? root + 7 : root) + (MUS.tr || 0)), q * 0.9, 'triangle', 0.05);
    if (st % 4 === 0) mtone(t0, 110, 0.12, 'sine', 0.07);
    if (st % 2 === 1) noise(0.05, 0.012, 6000, 0, t0);
    MUS.i++;
  }
  tmr = setInterval(function () {
    if (!AC || false) return;
    var ww = window.__jump && window.__jump.W; if (!MUS.on || !ww || !ww.started || ww.done || AC.state !== 'running') { MUS.next = 0; return; }
    var rm = ww.p && ww.p.x > ROOMX; var rid = rm ? roomIdx(ww.p.x) : -1; if (rid !== MUS.rid) { MUS.rid = rid; MUS.room = rm; MUS.rt = [0, 5, -2, 7][Math.max(0, rid)]; MUS.i = 0; MUS.next = 0; } var zz = ww.zi || 0; MUS.tr = zz >= 1 ? -2 : 0; var q = 60 / (rm ? [126, 112, 120, 158][Math.max(0, rid)] : zz >= 1 ? 154 : 140) / 2; if (!MUS.next || MUS.next < AC.currentTime - 0.5) MUS.next = AC.currentTime + 0.05;
    while (MUS.next < AC.currentTime + 0.25) { musicStep(MUS.next, q); MUS.next += q; }
  }, 80);
  function sfx(n) { var f = SFX[n]; if (f) f(); }
  var POPS = { '空翻！': 'flip', '站穩！': 'land', '完美放手！': 'perfect', '痛！': 'hurt', '噗通！': 'splash', '被抓走了…': 'hurt' };
  function summary() {       // 結算用：隱藏室收集、剩餘命、稱號、走到第幾區（主程式算遊戲幣用）
    var rooms = 0, gold = 0;
    for (var ri = 0; ri < 4; ri++) { var tot = 0, got = 0; W.rc.forEach(function (c) { if (c.r === ri && !c.gold) { tot++; if (c.got) got++; } }); if (tot && got >= tot) rooms++; }
    W.rc.forEach(function (c) { if (c.gold && c.got) gold++; });
    return { rooms: rooms, gold: gold, lives: W.lives, titles: W.titles.slice(), zone: W.zi };
  }
  function newWorld() {
    var cp = { x: 40, y: 380 };
    return { t: 0, p: { x: cp.x, y: cp.y, vx: 0, vy: 0, face: 1, on: true, coy: 0, jbuf: 0, jumping: false, spinT: 0, stun: 0, swing: null, rel: 0, dead: 0, inv: 0 },
      rc: ROOM_COINS.map(function (c) { return { x: c.x, y: c.y, v: c.v, gold: c.gold, r: c.r, b: c.b, got: false }; }), bx: [], rcN: 0, rcn: [0, 0, 0], titles: [], rsp: null, wk: 0, oxy: 0, qUsed: {}, ret: null, cp: cp, zi: 0, banner: null, lives: DF().lives, maxLives: DF().lives, failed: false, hp: DF().hp, maxHp: DF().hp, kills: 0, faints: 0, en: mkEnemies(), pa: false, pops: [], fx: [], flips: 0, falls: 0, score: 0, perfects: 0, started: false, fl: { n: 0, pts: 0 }, done: false, doneT: 0, clean: true };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pop(W, x, y, txt, col) { var sn = POPS[txt] || (txt.indexOf('擊退') === 0 ? 'kill' : txt.indexOf('連續空翻') === 0 ? 'flip' : txt.indexOf('抓到') === 0 ? 'grab' : ''); if (sn) sfx(sn); W.pops.push({ x: x, y: y, t: 0, txt: txt, col: col || '#fff' }); }
  function ringNear(p, rad) {
    var hx = p.x, hy = p.y - HO, best = null, bd = rad;
    for (var i = 0; i < LV.rings.length; i++) { var r = LV.rings[i], d = Math.hypot(hx - r.x, hy - r.y); if (d < bd) { bd = d; best = r; } }
    return best;
  }
  function hit(p, plats) {
    for (var i = 0; i < plats.length; i++) { var q = plats[i]; if (p.x + HBW / 2 > q.x && p.x - HBW / 2 < q.x + q.w && p.y + HBH / 2 > q.y && p.y - HBH / 2 < q.y + q.h) return q; }
    return null;
  }
  function splash(W, x) { for (var i = 0; i < 14; i++) W.fx.push({ x: x, y: LV.waterY, vx: (Math.random() - .5) * 120, vy: -80 - Math.random() * 140, t: 0, life: 0.7 }); }

  var THROW = 0.85, PERF_BOOST = 1.3, LAUNCH = 215, AMAX = 1.5, PERF_LO = 0.35, PERF_HI = 0.85;       // 自動擺盪的最大盪幅（弧度）、完美放手的角度範圍
  function swingEnergy(s, Rc) { return 0.5 * s.w * s.w + (G / Rc) * (1 - Math.cos(s.th)); }
  function perfectNow(s) {                                // 盪幅夠大、正在往斜上方走 → 完美放手
    var Rc = s.ring.R * s.Lf, emax = (G / s.ring.R) * (1 - Math.cos(AMAX));
    return swingEnergy(s, Rc) >= 0.8 * emax && s.w * s.th > 0 && Math.abs(s.th) >= PERF_LO && Math.abs(s.th) <= PERF_HI;
  }
  function bank(W, p, why) {                              // 把這趟空中的特技分入帳
    if (W.fl.pts > 0) { W.score += W.fl.pts; pop(W, p.x, p.y - 52, '+' + W.fl.pts + ' 特技', '#ffe38a'); }
    W.fl = { n: 0, pts: 0 };
  }
  function step(W, inp, dt) {
    var p = W.p; W.t += dt;
    LV.rings.forEach(function (r) { if (isMv(r) || r.kind === 'rail') { r.x = r.cx + r.ax * Math.sin(6.283 * W.t / r.per + r.ph); r.vpx = r.ax * 6.283 / r.per * Math.cos(6.283 * W.t / r.per + r.ph); if (r.kind === 'rail' || !(p.swing && p.swing.ring === r)) r.px = r.x; } });
    if (W.banner) { W.banner.t += dt; if (W.banner.t > 2.4) W.banner = null; }
    var aE = (inp.a && !W.pa) || !!inp.press; inp.press = false; W.pa = inp.a;     // press＝按下事件的閂鎖，低幀率下快點也不會漏
    for (var i = W.pops.length - 1; i >= 0; i--) { W.pops[i].t += dt; if (W.pops[i].t > 1) W.pops.splice(i, 1); }
    for (i = W.fx.length - 1; i >= 0; i--) { var f = W.fx[i]; f.t += dt; f.vy += 500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.t > f.life) W.fx.splice(i, 1); }
    if (W.done) { W.doneT += dt; if (W.gbonus && W.doneT < 3.2 && Math.floor(W.doneT * 6) !== W.lastDrop) { W.lastDrop = Math.floor(W.doneT * 6); W.fx.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y - 6, vx: (Math.random() - 0.5) * 20, vy: -10, t: 0, life: 0.8 }); }
    if (W.gbonus) { var gu = Math.min(1, W.doneT / 1.1), ge = gu * gu * (3 - 2 * gu), gh = W.gh0 + (W.gFy - 42 - W.gh0) * ge; p.x = GOAL.x; p.y = gh + HO + (gu >= 1 ? Math.sin(W.doneT * 3) * 1.5 : 0); } return; }
    if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { p.x = W.cp.x; p.y = W.cp.y; p.vx = p.vy = 0; p.swing = null; p.on = true; p.spinT = 0; p.stun = 0; if (W.hp <= 0) { W.lives--; if (W.lives <= 0) { W.failed = true; W.done = true; W.doneT = 0; p.swing = null; p.vx = p.vy = 0; sfx('low'); pop(W, p.x, p.y - 50, '命用完了…', '#ff8a8a'); return; } if (W.lives !== Infinity) pop(W, p.x, p.y - 50, W.lives === 1 ? '最後一條命！' : '剩 ' + W.lives + ' 條命', '#ffd0a0'); W.hp = W.maxHp; if (DF().reset) { W.cp = { x: 40, y: 380 }; p.x = W.cp.x; p.y = W.cp.y; } } p.inv = DF().inv; } return; }
    var man = (inp.r ? 1 : 0) - (inp.l ? 1 : 0), dir = man || 1;   // 自動前進；電腦鍵盤按 ← → 才手動轉向
    if (!W.started) { if (aE) W.started = true; return; }
    if (p.rel > 0) p.rel -= dt;
    if (p.landT > 0) p.landT -= dt;
    updEnemies(W, dt);
    if (p.dead > 0) return;
    if (W.started && !W.done) {
      if (p.on && Math.abs(p.vx) > 20) { W.fs = (W.fs || 0) + dt; if (W.fs > 0.24) { W.fs = 0; sfx('step'); } }
      if (p.swing) { var sw = p.swing; if (sw.pth !== undefined && sw.pth * sw.th < 0 && Math.abs(sw.w) > 1.2) sfx('whoosh'); sw.pth = sw.th; }
      if (W.hp === 1 && W.maxHp > 1 && !W.lowWarn) { W.lowWarn = true; sfx('low'); } else if (W.hp > 1) W.lowWarn = false;
    }
    if (p.stun > 0) p.stun -= dt;
    var ri = roomIdx(p.x);
    if (ri >= 1 && p.on && !p.swing && !W.slide) { var rq = null; LV.plats.forEach(function (q) { if (p.x >= q.x && p.x <= q.x + q.w && Math.abs(q.y - HBH / 2 - p.y) < 6) rq = q; }); W.rsp = { x: rq ? Math.min(p.x - 10, Math.max(rq.x + 50, p.x - 260)) : p.x - 10, y: p.y }; }   /* 回上一段：退回平台前段（至少退 260 px 或到平台起點 +50），不會又掉一次 */       // 隱藏室 2–4 沒有水：掉下去回到最後站的地方
    var zi = zoneIdx(p.x); if (zi !== W.zi) { if (zi > W.zi) { W.banner = { txt: ZONES[zi].name, t: 0 }; sfx('zone'); } W.zi = zi; }

    if (W.slide) {                                          /* ---- 水管溜滑梯：沿管子自動滑，越滑越快，尾端衝出 ---- */
      var sl = W.slide; sl.v = Math.min(300, sl.v + 130 * dt); sl.s += sl.v * dt; p.inv = Math.max(p.inv, 0.05);
      var si = 1; while (si < SLEN.length - 1 && SLEN[si] < sl.s) si++;
      var su = clamp((sl.s - SLEN[si - 1]) / (SLEN[si] - SLEN[si - 1]), 0, 1), spx = SLIDE[si - 1][0] + (SLIDE[si][0] - SLIDE[si - 1][0]) * su, spy = SLIDE[si - 1][1] + (SLIDE[si][1] - SLIDE[si - 1][1]) * su;
      p.x = spx; p.y = spy - HBH / 2; p.vx = p.vy = 0; p.face = 1; p.on = false; p.swing = null; p.sl = Math.atan2(SLIDE[si][1] - SLIDE[si - 1][1], SLIDE[si][0] - SLIDE[si - 1][0]);
      if (sl.s >= SLEN[SLEN.length - 1]) { W.slide = null; p.sl = 0; p.on = true; p.vx = sl.v; p.vy = 0; p.y = 330 - HBH / 2; W.score += 80; pop(W, p.x, p.y - 34, '溜滑梯！+80', '#9fe8ff'); sfx('land'); }
      return;
    }
    if (!p.on && !p.swing && !W.slide && p.vy > 0 && p.x > 4372 && p.x < 4450 && Math.abs(p.y + HBH / 2 - 266) < 12) {   // 從上層水管邊緣「掉進」滑梯口才會滑（跳過去抓吊環就不會）
      W.slide = { s: 0, v: 150 }; sfx('whoosh'); }
    var gu = geyU();                                  // 噴水柱：噴出時把午仔魚往上托（冒泡時是預警）
    if (gu >= GEY.t0 && gu < GEY.t1 && Math.abs(p.x - GEY.x) < GEY.w / 2 && p.y > 150 && !p.swing) { p.on = false; p.jumping = false; p.coy = 0.09; p.vy = Math.max(p.vy - 2600 * dt, -330); if (!W.gj) { W.gj = 1; sfx('flip'); } } else if (gu < GEY.t0) W.gj = 0;
    if (p.swing) {                                          /* ---- 抓環：自動擺盪，放開按鍵＝放手 ---- */
      var s = p.swing, r = s.ring, Lo = s.Lf, emax = (G / r.R) * (1 - Math.cos(AMAX));
      var tgt = (s.w * s.th > 0 && swingEnergy(s, r.R * Lo) < emax) ? TUCK : 1;   // 自動收身：盪幅沒滿就一直推
      s.Lf += (tgt - s.Lf) * Math.min(1, dt / TAU);
      s.w *= Math.pow(Lo / s.Lf, 2);
      var Rc = r.R * s.Lf;
      s.w += (-(G / Rc) * Math.sin(s.th) - DAMP * s.w + man * 2.5) * dt;
      s.w = clamp(s.w, -6.5, 6.5); s.th += s.w * dt; s.t += dt;
      p.x = r.px + Rc * Math.sin(s.th); p.y = r.py + Rc * Math.cos(s.th) + HO;
      if (man) p.face = man;
      s.perf = perfectNow(s);
      if ((!inp.a || (r.kind === 'break' && s.t > 1.8)) && s.t > 0.08) {                           // 放手（斷裂環抓太久會斷）
        p.vx = Rc * s.w * Math.cos(s.th) * THROW; p.vy = -Rc * s.w * Math.sin(s.th) * THROW;
        var fw = p.face || 1; p.vx = Math.abs(p.vx) * fw; if (r.kind === 'rail') p.vx += r.vpx || 0;      /* 軌道吊環：放手時帶著軌道的速度 */                       // 一律往前拋：往回擺時放手也是往前飛
        if (Math.hypot(p.vx, p.vy) < LAUNCH) { p.vx = Math.max(p.vx, fw * LAUNCH * 0.64); p.vy = Math.min(p.vy, -LAUNCH * 0.77); }   // 力道太小（在盪幅頂點放手）也往前上方拋，不會原地掉
        sfx('release'); if (inp.a) pop(W, p.x, p.y - 40, '斷了！', '#ff9a8a'); if (s.perf) { p.vx *= PERF_BOOST; p.vy *= PERF_BOOST; }                                // 完美放手：最後再加成，距離明顯更遠
        p.swing = null; p.rel = 0.25; p.on = false; p.coy = 0; p.jumping = false;
        if (s.perf) { W.fl.pts += 150; W.perfects++; pop(W, p.x, p.y - 30, '完美放手！', '#ffe38a'); for (var k = 0; k < 10; k++) W.fx.push({ x: p.x, y: p.y - 10, vx: (Math.random() - .5) * 160, vy: -Math.random() * 120, t: 0, life: 0.5, gold: 1 }); }
        if (Math.abs(p.vx) > 40) p.face = p.vx > 0 ? 1 : -1;
      }
      return;
    }

    if (W.hold && aE) { W.hold = false; aE = false; }     // 離開隱藏室後魚先站著等，點一下才繼續往前跑（不會一出來就衝出平台掉水）
    /* ---- 地面／空中 ---- */
    if (p.on) p.coy = 0.09; else p.coy -= dt;
    if (aE) p.jbuf = 0.1; else p.jbuf -= dt;
    var can = p.stun <= 0, didJump = false;
    if (p.on) {
      var tv = can && !W.hold ? dir * RUN : 0, dv = (tv === 0 ? 1400 : 1000) * dt; p.vx += clamp(tv - p.vx, -dv, dv);
    } else if (can && man) { if (man * p.vx < AIRV) p.vx += man * 420 * dt; }
    if (dir && can) p.face = dir;
    if (can && p.jbuf > 0 && p.coy > 0) { p.vy = -JUMP; p.jbuf = 0; p.coy = 0; p.on = false; p.jumping = true; didJump = true; sfx('jump'); }
    if (p.jumping && !inp.a && p.vy < -110) p.vy = -110;
    p.vy = Math.min(p.vy + G * dt, 540);
    p.x += p.vx * dt; var q = hit(p, LV.plats);
    if (q) { if (p.vx > 0) p.x = q.x - HBW / 2; else if (p.vx < 0) p.x = q.x + q.w + HBW / 2; p.vx = 0; }
    p.y += p.vy * dt; q = hit(p, LV.plats); var was = p.on; p.on = false;
    if (q) {
      if (p.vy > 0) {
        p.y = q.y - HBH / 2; p.on = true; p.jumping = false; if (!was) p.landT = 0.16;
        if (!was) {                                          // 剛落地
          if (p.spinT > 0) {
            var prog = 1 - p.spinT / 0.5;
            if (prog > 0.15 && prog < 0.85) { p.stun = 0.55; pop(W, p.x, p.y - 34, '摔倒…', '#ff9a8a'); W.clean = false; W.fl = { n: 0, pts: 0 }; }
            else { pop(W, p.x, p.y - 34, '站穩！', '#8dff8a'); W.fl.pts += 50 * W.fl.n; bank(W, p); }
          } else { if (p.vy > 400) pop(W, p.x, p.y - 34, '站穩！', '#8dff8a'); bank(W, p); }
          p.spinT = 0;
          if (q !== LV.plats[0] && q.st !== 'room' && q.st !== 'pipe' && q.st !== 'cloud' && q.st !== 'wh' && W.cpPlat !== q) { W.cpPlat = q; if (W.lives < W.maxLives) W.lives++; pop(W, p.x, p.y - 52, '存檔！', '#9fe8ff'); sfx('save'); W.cp = { x: clamp(p.x, q.x + 30, q.x + q.w - 30), y: q.y - HBH / 2 }; }
        }
        p.vy = 0;
      } else { p.y = q.y + q.h + HBH / 2; p.vy = 0; }
    }
    if (p.spinT > 0) p.spinT -= dt;
    if (ri >= 1 && p.y > LV.waterY - 40) { var rs = W.rsp || { x: ENT[ri], y: ENTY[ri] }; if (ri === 0) W.gs = W.t - 0.55; p.x = rs.x; p.y = rs.y - 4; p.vx = 0; p.vy = 0; p.on = false; p.swing = null; p.spinT = 0; p.inv = 2.0; pop(W, p.x, p.y - 30, '回到上一段！', '#9fe4ff'); sfx('save'); return; }
    if (p.y > LV.waterY + 14) { splash(W, p.x); p.dead = 1; W.falls++; W.fl = { n: 0, pts: 0 }; pop(W, p.x, LV.waterY - 20, '噗通！', '#9fe4ff'); if (DF().fall) { W.hp--; if (W.hp <= 0) W.faints++; } return; }
    if (!p.on) {                                             // 抓環（按住）／空翻（點一下）
      var nr = inp.a && p.rel <= 0 ? ringNear(p, GRAB) : null;
      if (nr) {
        var hx = p.x, hy = p.y - HO, th = Math.atan2(hx - nr.px, hy - nr.py), vt = p.vx * Math.cos(th) - p.vy * Math.sin(th);
        p.swing = { ring: nr, th: th, w: vt / nr.R + p.face * 0.3, Lf: 1, t: 0, perf: false }; p.vx = p.vy = 0; p.spinT = 0; bank(W, p); pop(W, p.x, p.y - 34, '抓到！', '#ffe38a');
      } else if (aE && !didJump && p.coy <= 0 && p.spinT <= 0 && p.stun <= 0 && !ringNear(p, GRAB * 1.8)) {
        p.spinT = 0.5; W.flips++; W.fl.n++; W.fl.pts += 100 * W.fl.n; pop(W, p.x, p.y - 34, W.fl.n > 1 ? '連續空翻 ×' + W.fl.n : '空翻！', '#ffb3f0');
      }
    }
    if (ri === 2) BOXES.forEach(function (b, bi) { if (!W.bx[bi] && (p.spinT > 0 || !p.on) && Math.abs(p.x - b.x) < 24 && p.y - HBH / 2 < b.y + 20 && p.y + HBH / 2 > b.y - 12) { W.bx[bi] = true; W.score += 20; sfx('perfect'); pop(W, b.x, b.y - 22, '魚乾掉出來！', '#ffe38a'); for (var k = 0; k < 8; k++) W.fx.push({ x: b.x, y: b.y, vx: (Math.random() - .5) * 120, vy: -Math.random() * 120, t: 0, life: 0.5, gold: 1 }); } });
    for (var qi = 0; qi < QBS.length; qi++) {                // 空翻頂到「？」磚→進對應的隱藏室
      var qb = QBS[qi]; 
      if (!W.qUsed[qb.room] && (p.spinT > 0 || !p.on) && Math.abs(p.x - qb.x) < 24 && p.y - HBH / 2 < qb.y + 20 && p.y + HBH / 2 > qb.y - 12) { enterRoom(W, qb.room, qb.ret || { x: qb.x + 70, y: p.y }); return; }
    }
    if (ri >= 0) {
      W.rc.forEach(function (c) { if (!c.got && !(c.b !== undefined && !W.bx[c.b]) && Math.abs(p.x - c.x) < (c.gold ? 24 : 15) && Math.abs(p.y - c.y) < (c.gold ? 36 : 26)) { c.got = true; if (c.gold) { W.gold = true; sfx('perfect'); pop(W, c.x, c.y - 16, GOLD_NAME[c.r] + '！+' + c.v, '#ffd24a'); } else { W.rcN++; W.rcn[c.r]++; sfx('coin'); pop(W, c.x, c.y - 14, '+' + c.v, '#ffe38a'); } W.score += c.v; if (c.gold) W['g' + c.r] = 1; } });
      if (ri === 0) STEAM.forEach(function (v) { var u = (W.t + v.off) % v.per; if (u >= v.per - 1.7 && u < v.per - 0.8 && Math.floor(u * 8) % 4 === 0 && (W.sh || 0) < W.t - 0.2) { W.sh = W.t; sfx('save'); } if (u >= v.per - 0.8 && p.inv <= 0 && p.dead <= 0 && !W.slide && Math.abs(p.x - v.x) < 15 && p.y > v.y - 70 && p.y - HBH < v.y) hurt(W, { x: v.x }); });
      if (p.x > EXS[ri]) {
        var tot = 0; W.rc.forEach(function (c) { if (c.r === ri && !c.gold) tot++; }); var all = W.rcn[ri] >= tot; if (all) { W.score += 500; W.maxHp++; W.maxLives++; W.lives++; } W.hp = Math.min(W.maxHp, W.hp + 1);
        
        W.oxy = 0; p.x = W.ret.x; p.y = W.ret.y; p.vx = 0; p.vy = 0; p.on = false; p.swing = null; p.spinT = 0;
        var under = null; LV.plats.forEach(function (q) { if (q.x > ROOMX) return; if (p.x >= q.x && p.x <= q.x + q.w && q.y >= W.ret.y - 40 && q.y <= W.ret.y + HBH + 140 && (!under || q.y < under.y)) under = q; });
        if (under) { p.y = under.y - HBH / 2; p.on = true; }       // 回到原處時一定要站在平台上（不會掉進水裡）
        p.inv = 2.5; W.hold = true; cam.x = p.x - WF / 2; cam.y = p.y - H * 0.5; sfx(all ? 'perfect' : 'save');
        pop(W, p.x, p.y - 40, all ? COIN_NAME[ri] + '全收！多一顆愛心' : '收了 ' + W.rcn[ri] + ' 顆' + COIN_NAME[ri], '#ffe38a');
        if (W['g' + ri] && W.titles.indexOf(TITLES[ri]) < 0) { W.titles.push(TITLES[ri]); try { localStorage.setItem('sunnuGymTitles', JSON.stringify(W.titles)); } catch (_) { } W.banner = { txt: '稱號：' + TITLES[ri], t: 0 }; } return;
      }
    }
    if (!W.done && p.x >= GOAL.x - 4 && p.x < ROOMX && p.dead <= 0) { p.inv = 0;       // 跳起來抓到終點大吊環＝過關，抓越高分越多
      var fyy = LV.plats[5].y, hgt = clamp(fyy - (p.y - HO), 30, 95), bonus = 100 + Math.round((hgt - 30) / 65 * 500); W.gh0 = p.y - HO; W.gFy = fyy;
      bank(W, p); W.score += bonus; W.gbonus = bonus; W.done = true; W.doneT = 0; p.swing = null; p.vx = p.vy = 0; p.on = false; p.spinT = 0; sfx('win'); pop(W, GOAL.x, GOAL.y - 30, '大吊環！+' + bonus, '#ffe38a');
    }
  }

  /* ---------- 畫面 ---------- */
  var host = o.host;
  var cw = host.clientWidth || innerWidth, ch = host.clientHeight || innerHeight, DPR = Math.min(3, window.devicePixelRatio || 1),
    scale = cw < 600 ? (DPR >= 2 ? Math.round(1.33 * DPR) / DPR : 1.33) : 2;   /* 手機放大倍率小一點，看得到更後面的場景；整數裝置像素才不會糊 */
  var WF = Math.min(640, Math.ceil(cw / scale)), H = Math.max(312, Math.floor(ch / scale));
  var cv = document.createElement('canvas'); cv.width = WF; cv.height = H;
  cv.style.cssText = 'position:absolute;image-rendering:pixelated;touch-action:none;left:' + Math.floor((cw - WF * scale) / 2) + 'px;top:0;width:' + WF * scale + 'px;height:' + H * scale + 'px';
  host.appendChild(cv); var g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  /* 文字層：主畫布是低解析像素畫（放大 2 倍以上），字直接畫會糊成一團，所以字另畫在高解析疊層上 */
  var TS = scale * DPR;
  var tv = document.createElement('canvas'); tv.style.pointerEvents = 'none';
  tv.style.cssText = cv.style.cssText + ';pointer-events:none;image-rendering:auto';
  tv.width = Math.round(WF * TS); tv.height = Math.round(H * TS);
  host.appendChild(tv); var tg = tv.getContext('2d');
  var W = newWorld(), inp = { l: false, r: false, a: false }, cam = { x: 0, y: 150 };
  var relT = 0;
  function relayout() {       // 地圖版：結算列出現後舞台會變矮，重新量高度，避免畫面底部（商品橫幅）被切掉
    var h2 = host.clientHeight; if (!h2) return; var nh = Math.max(312, Math.floor(h2 / scale)); if (nh === H) return;
    H = nh; cv.height = H; cv.style.height = H * scale + 'px'; g.imageSmoothingEnabled = false; tv.height = Math.round(H * TS); tv.style.height = H * scale + 'px';
  }
  var PXF = 'Cubic11,"PingFang TC","Microsoft JhengHei",sans-serif';
  try { if (document.fonts && document.fonts.load) { document.fonts.load('22px Cubic11', '體操午仔魚'); } } catch (e) { }
  function txt(t, x, y, sz, col, al) {
    var m = g.getTransform(); x += m.e; y += m.f;
    /* Cubic11 是 11 格像素字，裝置像素字級取 11 的倍數才清晰；字太寬（手機窄螢幕）就降一階 */
    var n = Math.max(1, Math.round(sz * TS / 11 + 0.25)), lim = (WF - 12) * TS;
    tg.font = (n * 11) + 'px ' + PXF; while (n > 1 && tg.measureText(t).width > lim) { n--; tg.font = (n * 11) + 'px ' + PXF; }
    var fs = n * 11;
    tg.textAlign = al || 'center'; tg.textBaseline = 'middle'; tg.lineJoin = 'round'; tg.lineWidth = Math.max(2, Math.round(fs / 5.5)); tg.strokeStyle = '#2b2118';
    var px = Math.round(x * TS), py = Math.round(y * TS);
    tg.strokeText(t, px, py); tg.fillStyle = col; tg.fillText(t, px, py);
  }

  function updCam(dt) {
    var p = W.p, tx = p.x - WF / 2 + p.face * 24, ty = p.y - H * 0.5;
    cam.x += (tx - cam.x) * Math.min(1, dt * 5); cam.y += (ty - cam.y) * Math.min(1, dt * 4);
    cam.x = clamp(cam.x, 0, LV.w - WF); cam.y = clamp(cam.y, -70, LV.bottom - H);
    var cr = roomIdx(p.x); if (cr >= 1) cam.x = clamp(cam.x, RXS[cr], RXS[cr + 1] - WF);
  }
  /* 魚分件畫：頭身不動、尾巴（58 列以下）逐列位移擺動、兩隻手繞肩膀轉。st = { tail:振幅, ph:尾相位, aL:左手抬起(弧度), aR:右手抬起 } */
  var SHL = [24, 28], SHR = [48, 27], TIPL = [7.5, 29.5], TIPR = [66.5, 29];
  function waveDx(st, r) { var wa = st.wave || 0, wp = st.wp !== undefined ? st.wp : (st.ph || 0); return wa * (0.2 + 0.8 * Math.pow(r / 58, 1.3)) * Math.sin(wp - r * 0.09); }   // 身體 S 形波：頭小、越靠尾巴越大
  function handLocal(sd, raise, st) {                      // 手尖相對「手點(GX,GY)」的位置（魚像素單位），含身體波、扭、擠壓
    st = st || {};
    var sh = sd < 0 ? SHL : SHR, tip = sd < 0 ? TIPL : TIPR, ang = sd < 0 ? raise : -raise, c = Math.cos(ang), sn = Math.sin(ang), vx = tip[0] - sh[0], vy = tip[1] - sh[1];
    var x = sh[0] - GX + waveDx(st, 28) + vx * c - vy * sn, y = sh[1] - GY + vx * sn + vy * c;
    if (st.tw) { var hx = 47 - GX, hy = 60 - GY, dx = x - hx, dy = y - hy, ct = Math.cos(st.tw), stn = Math.sin(st.tw); x = hx + dx * ct - dy * stn; y = hy + dx * stn + dy * ct; }
    if (st.sy) { var fy = FH - GY; x = x / st.sy; y = (y - fy) * st.sy + fy; }
    return [x, y];
  }
  function toWorld(l, x, y, rot, flipX) { var fx = l[0] * K * (flipX < 0 ? -1 : 1), fy = l[1] * K, c = Math.cos(rot), sn = Math.sin(rot); return [x + fx * c - fy * sn, y + fx * sn + fy * c]; }
  var DRYC = document.createElement('canvas'); DRYC.width = DRYC.height = 160; var DRYG = DRYC.getContext('2d');
  function drawFish(x, y, rot, flipX, st) {                        // 抓到終點大吊環後 st.dry 0→1：被曬成深色一夜干
    if (!(st && st.dry > 0)) { drawFish0(x, y, rot, flipX, st); return; }
    var main = g; g = DRYG; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 160, 160); drawFish0(80, 80, rot, flipX, st);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(96,50,16,' + (0.74 * st.dry) + ')'; g.fillRect(0, 0, 160, 160);
    g.fillStyle = 'rgba(40,18,4,' + (0.22 * st.dry) + ')'; for (var i = 0; i < 9; i++) g.fillRect(60 + i * 5, 60 + (i % 3) * 10, 2, 26);        // 曬出來的皺紋
    g.globalCompositeOperation = 'source-over'; g = main; g.drawImage(DRYC, Math.round(x) - 80, Math.round(y) - 80);
  }
  function drawFish0(x, y, rot, flipX, st) {
    st = st || {};
    function bdx(r) { return waveDx(st, r); }
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); g.scale(K * (flipX < 0 ? -1 : 1), K);
    if (st.sy) { g.translate(0, FH - GY); g.scale(1 / st.sy, st.sy); g.translate(0, GY - FH); }          // 擠壓／拉伸（以腳底為準）
    if (st.tw) { g.translate(47 - GX, 60 - GY); g.rotate(st.tw); g.translate(GX - 47, GY - 60); }       // 整隻繞髖部扭／甩
    for (var r = 0; r < 58; r++) { var rw = (r >= 14 && r < 40) ? 24 : 28; g.drawImage(fishImg, 24, r, rw, 1, 24 - GX + bdx(r), r - GY, rw, 1); }   // 頭＋身體逐列位移
    g.save(); g.translate(bdx(58), 0);
    var amp = st.tail || 0, ph = st.ph || 0;
    if (st.leg !== undefined) {                                                  // 兩片尾鰭當兩隻腳：交替擺動像走路
      g.drawImage(fishImg, 24, 58, 28, 14, 24 - GX, 58 - GY, 28, 14);            // 尾根（不動）
      g.save(); g.translate(52 - GX, 66 - GY); g.rotate(st.leg * Math.sin(ph + Math.PI)); g.drawImage(fishImg, 52, 60, 12, 12, 0, -6, 12, 12); g.restore();   // 右側尾鰭
      g.save(); g.translate(47 - GX, 72 - GY); g.rotate(st.leg * Math.sin(ph)); g.drawImage(fishImg, 40, 72, 16, 11, -7, 0, 16, 11); g.restore();             // 下方尾尖
    } else for (r = 58; r < FH; r++) { var u = (r - 58) / (FH - 58); g.drawImage(fishImg, 0, r, FW, 1, -GX + amp * u * u * Math.sin(ph - r * 0.13) * 2.2, r - GY, FW, 1); }   // 尾巴逐列擺
    g.restore();
    g.save(); g.translate(SHL[0] - GX + bdx(28), SHL[1] - GY); g.rotate(st.aL || 0); g.drawImage(fishImg, 0, 14, 24, 26, -24, -14, 24, 26); g.restore();   // 左手
    g.save(); g.translate(SHR[0] - GX + bdx(28), SHR[1] - GY); g.rotate(-(st.aR || 0)); g.drawImage(fishImg, 48, 14, 26, 26, 0, -13, 26, 26); g.restore();  // 右手
    g.restore();
  }
  /* ---------- 主題：依畫面中心在哪一區，把天空／遠山／水色在區界慢慢混合 ---------- */
  function hx2n(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mixHex(a, b, k) { var A = hx2n(a), B = hx2n(b), o = '#'; for (var i = 0; i < 3; i++) { var v = Math.round(A[i] + (B[i] - A[i]) * k); o += (v < 16 ? '0' : '') + v.toString(16); } return o; }
  function mixRgb(a, b, k) { var A = a.split(','), B = b.split(','), o = []; for (var i = 0; i < 3; i++) o.push(Math.round(+A[i] + (+B[i] - +A[i]) * k)); return o.join(','); }
  function themeAt(cx) {
    var T = JSON.parse(JSON.stringify(ZONES[0].theme));
    for (var zi = 1; zi < ZONES.length; zi++) {
      var k = clamp((cx - (ZONES[zi].x0 - 150)) / 300, 0, 1); if (k <= 0) continue; var N = ZONES[zi].theme;
      T.sky = T.sky.map(function (c, i) { return mixHex(c, N.sky[i], k); }); T.sun = mixHex(T.sun, N.sun, k); T.halo = mixRgb(T.halo, N.halo, k);
      T.hill1 = mixHex(T.hill1, N.hill1, k); T.hill2 = mixHex(T.hill2, N.hill2, k); T.cloud = mixRgb(T.cloud, N.cloud, k);
      T.water = T.water.map(function (c, i) { return mixHex(c, N.water[i], k); }); T.wave = mixHex(T.wave, N.wave, k);
    }
    return T;
  }
  function drawRoof(q) {                                   // 屋瓦平台：交錯瓦片＋屋脊
    var x, y, row;
    g.fillStyle = '#1a0c06'; g.fillRect(q.x - 1, q.y - 1, q.w + 2, q.h + 2);
    g.fillStyle = '#8a3f2c'; g.fillRect(q.x, q.y, q.w, q.h);
    for (row = 0, y = q.y + 6; y < LV.bottom; y += 9, row++) {
      var c1 = row % 2 ? '#b2553a' : '#c0643f';
      for (x = q.x + (row % 2 ? 7 : 0); x < q.x + q.w; x += 14) { g.fillStyle = c1; g.fillRect(x, y, 12, 7); g.fillStyle = '#7a3524'; g.fillRect(x, y + 6, 12, 2); }
    }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(q.x + q.w - 4, q.y, 4, q.h);
    g.fillStyle = '#1a0c06'; g.fillRect(q.x - 4, q.y - 5, q.w + 8, 11); g.fillStyle = '#5e2a22'; g.fillRect(q.x - 3, q.y - 4, q.w + 6, 9); g.fillStyle = '#d98a52'; g.fillRect(q.x - 3, q.y - 4, q.w + 6, 2);
    g.fillStyle = '#7b3a2c'; for (x = q.x; x < q.x + q.w; x += 10) g.fillRect(x + 1, q.y - 7, 6, 4);
  }
  /* ---------- 隱藏室「水管牆」：屏東枋寮東海村養殖戶從海邊拉到魚塭的塑膠管，疊成一整面牆 ---------- */
  var PIPE_COL = { d: ['#14161c', '#2d323e', '#6b7488'], b: ['#10264a', '#2f6fd0', '#8fb8f5'], c: ['#4a5a68', '#cfe0ee', '#ffffff'], o: ['#5a2a14', '#f08a5a', '#ffd0b0'] }, PIPE_K = 'dddbdcddodbd';
  var PIPES = []; for (var pi = 0; pi < 22; pi++) { var px0 = 3850 + pi * 62; PIPES.push({ x0: px0, x1: px0 + 380 + (pi * 53) % 300, y0: 95 + (pi * 61) % 210, y1: 70 + (pi * 37) % 250, amp: 14 + (pi * 13) % 22, ph: pi * 1.3, w: 6 + (pi % 3) * 3, k: PIPE_K[pi % PIPE_K.length], clamp: pi % 4 === 1 }); }
  function pipePts(P) { var pts = [], n = Math.ceil((P.x1 - P.x0) / 10); for (var i = 0; i <= n; i++) { var u = i / n, e = u * u * (3 - 2 * u); pts.push([P.x0 + (P.x1 - P.x0) * u, P.y0 + (P.y1 - P.y0) * e + Math.sin(u * 6.283 * 1.1 + P.ph) * P.amp]); } return pts; }
  function strokePts(pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(function (q, i) { i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); }
  function drawPipeWall(t) {
    var wx0 = 3860, ww = 1280;
    g.fillStyle = '#6f7a86'; g.fillRect(wx0, 0, ww, LV.bottom); g.fillStyle = '#8a95a0'; g.fillRect(wx0, 0, ww, 14);
    g.fillStyle = '#5a646f'; for (var x = wx0; x < wx0 + ww; x += 96) g.fillRect(x, 0, 2, LV.bottom); for (var y = 40; y < LV.bottom; y += 70) g.fillRect(wx0, y, ww, 2);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(wx0, 0, ww, 330);
    PIPES.forEach(function (P) {
      var pts = pipePts(P), C = PIPE_COL[P.k];
      strokePts(pts, P.w + 3, C[0]); strokePts(pts, P.w, C[1]); strokePts(pts.map(function (q) { return [q[0], q[1] - P.w * 0.22]; }), Math.max(1.5, P.w * 0.22), C[2]);
      if (P.clamp) for (var i = 6; i < pts.length - 2; i += 14) { var q = pts[i]; g.fillStyle = '#1a1a20'; g.fillRect(q[0] - 2, q[1] - P.w / 2 - 3, 5, P.w + 6); g.fillStyle = '#e0a83c'; g.fillRect(q[0] - 1, q[1] - P.w / 2 - 2, 3, P.w + 4); }
      g.fillStyle = 'rgba(255,255,255,.7)'; for (var fk = 0; fk < 4; fk++) { var fq = pts[Math.floor((t * 9 + fk * pts.length / 4) % pts.length)]; g.fillRect(fq[0] - 1, fq[1] - 1, 3, 2); }
      var e = pts[pts.length - 1]; g.fillStyle = C[0]; g.fillRect(e[0] - 2, e[1] - P.w / 2 - 1, 4, P.w + 2);
      var dp = (t * 0.9 + P.ph) % 1; if (P.k === 'd' && P.clamp) { g.fillStyle = '#8fd0f5'; g.fillRect(Math.round(e[0]) + 3, Math.round(e[1] + P.w / 2 + dp * 60), 2, 3); }
    });
  }
  function drawRoomFloor(q) {                                      // 堤防頂：水泥面、伸縮縫，前面躺著幾條水管
    g.fillStyle = '#1a1a20'; g.fillRect(q.x, q.y - 1, q.w, q.h + 2); g.fillStyle = '#c9c5b8'; g.fillRect(q.x, q.y, q.w, q.h); g.fillStyle = '#e4e0d2'; g.fillRect(q.x, q.y, q.w, 5); g.fillStyle = '#a8a496'; g.fillRect(q.x, q.y + 5, q.w, 2);
    for (var x = q.x + 60; x < q.x + q.w; x += 150) { g.fillStyle = '#8f8b7e'; g.fillRect(x, q.y + 7, 2, 60); }
    for (var k = 0; k < 3; k++) { var pts = []; for (var i = 0; i <= 124; i++) pts.push([q.x + i * 10, q.y + 26 + k * 17 + Math.sin(i * 0.25 + k * 2) * 3]); strokePts(pts, 10, '#14161c'); strokePts(pts, 7, k === 1 ? '#2f6fd0' : '#2d323e'); strokePts(pts.map(function (a) { return [a[0], a[1] - 2]; }), 2, k === 1 ? '#8fb8f5' : '#6b7488'); }
  }
  function ball8(x, y, r) {
    g.fillStyle = '#e8f0f8'; g.beginPath(); g.arc(x, y, r + 1.5, 0, 7); g.fill(); g.fillStyle = '#16233a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = '#3a5373'; for (var i = 0; i < 7; i++) g.fillRect(Math.round(x - r * 0.7 + (i * 5) % (r * 1.4)), Math.round(y - r * 0.7 + ((i * 7) % (r * 1.4))), 1, 1);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.5, 0, 7); g.fill(); g.fillStyle = '#16233a'; g.font = 'bold 5px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('8', x, y + 0.5);
  }
  function drawBench(x, y, t) {                                   // 藍色啞鈴長凳＋兩朵黃花＋橘色腳
    g.strokeStyle = '#f08a5a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 14, y + 14); g.moveTo(x + 6, y); g.lineTo(x + 14, y + 14); g.stroke();
    g.fillStyle = '#2d63c4'; g.fillRect(x - 3, y - 18, 6, 20); g.fillRect(x - 22, y - 2, 44, 3); g.fillStyle = '#5a8be0'; g.fillRect(x - 3, y - 18, 2, 20);
    [-26, 26].forEach(function (dx) { var fx = x + dx, fy = y - 2; g.strokeStyle = '#f7d94a'; g.lineWidth = 2; for (var i = 0; i < 8; i++) { var a = i * 0.785 + t * 0.6; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * 7, fy + Math.sin(a) * 7); g.stroke(); } g.fillStyle = '#fff4a8'; g.fillRect(fx - 1, fy - 1, 3, 3); });
  }
  function drawStripeFish(x, y, t, sc) { if (!sc) { stripeFishRaw(x, y, t); return; } g.save(); g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y); stripeFishRaw(x, y, t, 1); g.restore(); }
  function stripeFishRaw(x, y, t, still) {                         // 藍白條紋午仔魚＋黃色點點尾
    var by = y + (still ? 0 : Math.sin(t * 2) * 3); g.save(); g.beginPath(); g.ellipse(x, by, 24, 10, 0, 0, 7); g.clip(); g.fillStyle = '#f2f6fa'; g.fillRect(x - 26, by - 11, 52, 22); g.fillStyle = '#1d5fa8'; for (var i = -26; i < 26; i += 5) g.fillRect(x + i, by - 11, 2.5, 22); g.restore();
    g.strokeStyle = '#16233a'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, by, 24, 10, 0, 0, 7); g.stroke();
    g.fillStyle = '#f7d94a'; g.beginPath(); g.moveTo(x + 22, by); g.lineTo(x + 36, by - 10); g.lineTo(x + 36, by + 10); g.fill(); g.fillStyle = '#c9a41e'; for (i = 0; i < 6; i++) g.fillRect(x + 27 + (i % 2) * 5, by - 6 + i * 2, 1.5, 1.5); g.fillStyle = '#16233a'; g.fillRect(x - 17, by - 3, 2, 2);
  }
  function drawBoxes(t) {
    if (cam.x + WF < RXS[2] || cam.x > RXS[3]) return;
    BOXES.forEach(function (b, bi) {
      var used = W.bx[bi], x = b.x - 14, y = b.y - 14 + (used ? 0 : Math.max(0, Math.sin(t * 5 + bi)) * -1.5);
      g.fillStyle = '#2a1708'; g.fillRect(x - 1, y - 1, 30, 30); g.fillStyle = used ? '#6a4a2a' : (b.gold ? '#e8b83a' : '#b07a3e'); g.fillRect(x, y, 28, 28);
      g.fillStyle = used ? '#4a3018' : (b.gold ? '#ffe27a' : '#d8a460'); g.fillRect(x + 2, y + 2, 24, 4); g.fillRect(x + 2, y + 22, 24, 4);
      g.fillStyle = '#2a1708'; g.fillRect(x + 12, y, 4, 28); g.fillRect(x, y + 12, 28, 3);
      if (!used) { g.fillStyle = b.gold ? '#fff3b0' : '#f4dd7a'; g.fillRect(x + 9, y + 9, 10, 10); g.fillStyle = '#2a1708'; g.fillRect(x + 11, y + 12, 6, 4); }
    });
  }
  function drawQBlock(t) {
    QBS.forEach(function (qb) {
      if (qb.room === 1) {            // 雲上吊環的入口＝蝴蝶結貓咪雲（金邊、發光、閃星）：從吊環盪出去碰到它就進去
        var cu = W.qUsed[1], cb = cu ? 0 : Math.sin(t * 2.2) * 2, cx = qb.x, cy = qb.y + cb, es = CLOUDS.entry;
        if (!cu) { var ha = 0.25 + 0.15 * Math.sin(t * 3); g.fillStyle = 'rgba(255,236,150,' + ha + ')'; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill(); g.fillStyle = 'rgba(255,236,150,' + ha * 0.7 + ')'; g.beginPath(); g.arc(cx, cy, 22, 0, 7); g.fill(); }
        g.globalAlpha = cu ? 0.5 : 1; g.drawImage(es, Math.round(cx - es.width * 0.65), Math.round(cy - es.height * 0.65), Math.round(es.width * 1.3), Math.round(es.height * 1.3)); g.globalAlpha = 1;
        if (!cu) { var tw = Math.floor(t * 3) % 3; g.fillStyle = '#fff6b0'; [[-26, -14], [24, -2], [8, -22]].forEach(function (q, qi) { if (qi === tw) { g.fillRect(cx + q[0] - 1, cy + q[1], 3, 1); g.fillRect(cx + q[0], cy + q[1] - 1, 1, 3); } }); }
        return;
      }
      var used = W.qUsed[qb.room], bob = used ? 0 : Math.max(0, Math.sin(t * 6 + qb.room)) * -1.5, x = qb.x - 8, y = qb.y - 8 + bob;
      g.fillStyle = '#2a1204'; g.fillRect(x - 1, y - 1, 18, 18); g.fillStyle = used ? '#8a5a38' : '#fcb83c'; g.fillRect(x, y, 16, 16); g.fillStyle = used ? '#6a4228' : '#e88a10'; g.fillRect(x + 1, y + 13, 14, 2); g.fillRect(x + 13, y + 1, 2, 14);
      g.fillStyle = used ? '#6a4228' : '#fff0b0'; g.fillRect(x + 1, y + 1, 2, 2); g.fillRect(x + 13, y + 1, 2, 2); g.fillRect(x + 1, y + 13, 2, 2); g.fillRect(x + 13, y + 13, 2, 2);
      if (!used) { g.fillStyle = '#7a2a00'; g.fillRect(x + 6, y + 3, 4, 2); g.fillRect(x + 9, y + 5, 2, 3); g.fillRect(x + 7, y + 8, 3, 2); g.fillRect(x + 7, y + 11, 2, 2); }
    });
  }
  function drawPipePlat(q) {                                       // 上層：灰色大水管當平台
    g.fillStyle = '#1a1a20'; g.fillRect(q.x - 3, q.y - 1, q.w + 6, q.h + 2); g.fillStyle = '#8a929c'; g.fillRect(q.x, q.y, q.w, q.h); g.fillStyle = '#d0d6de'; g.fillRect(q.x, q.y, q.w, 3); g.fillStyle = '#5e656e'; g.fillRect(q.x, q.y + q.h - 3, q.w, 3);
    for (var x = q.x + 6; x < q.x + q.w - 4; x += 70) { g.fillStyle = '#1a1a20'; g.fillRect(x - 1, q.y - 3, 8, q.h + 6); g.fillStyle = '#6b7488'; g.fillRect(x, q.y - 2, 6, q.h + 4); g.fillStyle = '#d0d6de'; g.fillRect(x + 1, q.y - 1, 2, 2); g.fillRect(x + 1, q.y + q.h - 3, 2, 2); }
  }
  function drawValve(r, t) {                                       // 閥門輪吊環：紅色閥門輪裝在灰水管上
    var a = isMv(r) ? r.ax : 0; g.fillStyle = '#1a1a20'; g.fillRect(r.cx - a - 12, r.py - 4, (a + 12) * 2, 8); g.fillStyle = '#8a929c'; g.fillRect(r.cx - a - 11, r.py - 3, (a + 11) * 2, 6); g.fillStyle = '#d0d6de'; g.fillRect(r.cx - a - 11, r.py - 3, (a + 11) * 2, 2);
    var ang = t * (isMv(r) ? 1.6 : 0.3); g.fillStyle = '#1a1a20'; g.beginPath(); g.arc(r.px, r.py, 9, 0, 7); g.fill(); g.fillStyle = '#d8402a'; g.beginPath(); g.arc(r.px, r.py, 7.5, 0, 7); g.fill();
    g.strokeStyle = '#7a1c10'; g.lineWidth = 2; for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(r.px, r.py); g.lineTo(r.px + Math.cos(ang + i * 1.571) * 7, r.py + Math.sin(ang + i * 1.571) * 7); g.stroke(); } g.fillStyle = '#ffb4a0'; g.fillRect(r.px - 1, r.py - 1, 3, 3);
  }
  function drawGeyser(t) {
    var gu = geyU(), mx = GEY.x, fy2 = 330; g.fillStyle = '#1a1a20'; g.fillRect(mx - 17, fy2 - 11, 34, 12); g.fillStyle = '#8a929c'; g.fillRect(mx - 15, fy2 - 9, 30, 9); g.fillStyle = '#d0d6de'; g.fillRect(mx - 15, fy2 - 9, 30, 2); g.fillStyle = '#6b7488'; g.fillRect(mx - 19, fy2 - 13, 38, 4);
    if (gu >= GEY.t0 - 0.6 && gu < GEY.t0) { g.fillStyle = 'rgba(210,240,255,.85)'; for (var i = 0; i < 5; i++) { var bb = ((t * 1.6 + i * 0.21) % 1); g.beginPath(); g.arc(mx + Math.sin(i * 2.3 + t * 5) * 10, fy2 - 14 - bb * 34, 2 + (i % 2), 0, 7); g.fill(); } }
    else if (gu >= GEY.t0 && gu < GEY.t1) {
      var ft = Math.min(1, (gu - GEY.t0) / 0.2), top = fy2 - 12 - 160 * ft, hw = GEY.w / 2 * 0.62; g.fillStyle = 'rgba(150,215,250,.55)'; g.fillRect(mx - hw, top, hw * 2, fy2 - 12 - top); g.fillStyle = 'rgba(235,248,255,.6)'; g.fillRect(mx - hw * 0.45, top, hw * 0.9, fy2 - 12 - top);
      for (i = 0; i < 12; i++) { var dy = ((t * 2.2 + i * 0.083) % 1); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(mx - hw + ((i * 37) % (hw * 2)), fy2 - 14 - dy * 160 * ft, 2, 3); }
      g.fillStyle = 'rgba(235,248,255,.8)'; for (i = -2; i <= 2; i++) g.fillRect(mx + i * 10 - 3, top - 3 - (i % 2 ? 3 : 0), 7, 3);
    }
  }
  function drawWheelFx(w, t) {                                      // 水車：打水前水面起泡（預警）→ 水花沖起（彈射＋增氧）
    var uu = (W.t + w.off) % w.per, x = w.x, fy = 328, h = w.vy / 3.6;
    if (uu >= w.per - 1.6 && uu < w.per - 0.5) { g.fillStyle = 'rgba(210,240,255,.85)'; for (var i = 0; i < 5; i++) { var b = (t * 1.8 + i * 0.2) % 1; g.beginPath(); g.arc(x + Math.sin(i * 2.7 + t * 5) * 22, fy - b * 26, 2 + (i % 2), 0, 7); g.fill(); } g.fillStyle = 'rgba(160,215,250,.45)'; g.fillRect(x - 28, fy - 2, 56, 3); }
    else if (uu >= w.per - 0.5) { var k = Math.min(1, (uu - (w.per - 0.5)) / 0.14), hh = h * k; g.fillStyle = 'rgba(150,215,250,.5)'; g.beginPath(); g.moveTo(x - 24, fy); g.lineTo(x - 9, fy - hh); g.lineTo(x + 9, fy - hh); g.lineTo(x + 24, fy); g.fill(); g.fillStyle = 'rgba(235,248,255,.7)'; g.fillRect(x - 4, fy - hh, 8, hh);
      for (i = 0; i < 12; i++) { var d = (t * 2.6 + i * 0.083) % 1; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - 20 + ((i * 37) % 40), fy - d * hh, 3, 3); } }
  }
  function drawSteam(t) {                                           // 蒸氣漏水口：嘶嘶冒白煙（警告）→ 噴出高溫蒸氣（受傷）
    STEAM.forEach(function (v) {
      var u = (W.t + v.off) % v.per, x = v.x, y = v.y; g.fillStyle = '#1a1a20'; g.fillRect(x - 9, y - 7, 18, 8); g.fillStyle = '#b8802a'; g.fillRect(x - 8, y - 6, 16, 6); g.fillStyle = '#ffd89a'; g.fillRect(x - 8, y - 6, 16, 2); g.fillStyle = '#6b7488'; g.fillRect(x - 11, y - 9, 22, 3);
      if (u >= v.per - 1.7 && u < v.per - 0.8) { g.fillStyle = 'rgba(255,255,255,.7)'; for (var i = 0; i < 4; i++) { var b = (t * 1.4 + i * 0.25) % 1; g.beginPath(); g.arc(x + Math.sin(i * 3 + t * 6) * 5, y - 10 - b * 22, 2 + b * 3, 0, 7); g.fill(); } }
      else if (u >= v.per - 0.8) { var k = Math.min(1, (u - (v.per - 0.8)) / 0.12), h = 66 * k; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x - 11, y - 8 - h, 22, h); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x - 5, y - 8 - h, 10, h); for (i = 0; i < 5; i++) { var q = (t * 2.4 + i * 0.2) % 1; g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x + Math.sin(i * 2 + t * 9) * 9, y - 8 - q * h, 4 + q * 3, 0, 7); g.fill(); } }
    });
  }
  function drawSlide(t) {
    strokePts(SLIDE, 20, '#1a1a20'); strokePts(SLIDE, 16, '#8a929c'); strokePts(SLIDE.map(function (a) { return [a[0], a[1] - 5]; }), 3, '#d0d6de'); strokePts(SLIDE.map(function (a) { return [a[0], a[1] + 5]; }), 3, '#5e656e');
    g.fillStyle = '#1a1a20'; g.fillRect(SLIDE[0][0] - 8, SLIDE[0][1] - 11, 8, 22); g.fillStyle = '#6b7488'; g.fillRect(SLIDE[0][0] - 7, SLIDE[0][1] - 10, 6, 20);
    g.fillStyle = '#ffe34a'; for (var i = 0; i < 3; i++) { var ax = SLIDE[0][0] + 14 + i * 12 + ((t * 20) % 12), ay = SLIDE[0][1] - 18 + i * 3; g.fillRect(ax, ay, 5, 2); g.fillRect(ax + 3, ay - 2, 2, 6); }
  }
  function drawGlassPipe(t) {                                      // 背景玻璃管：條紋午仔魚在管子裡游
    var y0 = 100, x0 = ROOMX + 100, x1 = 5400; g.fillStyle = '#1a1a20'; g.fillRect(x0, y0 - 17, x1 - x0, 34); g.fillStyle = 'rgba(160,215,245,.9)'; g.fillRect(x0, y0 - 15, x1 - x0, 30); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0, y0 - 13, x1 - x0, 4);
    g.fillStyle = '#6b7488'; for (var x = x0 + 20; x < x1; x += 160) { g.fillRect(x, y0 - 19, 8, 38); g.fillStyle = '#d0d6de'; g.fillRect(x + 1, y0 - 18, 2, 36); g.fillStyle = '#6b7488'; }
    for (var k = 0; k < 3; k++) { var fx = x0 + ((t * (24 + k * 9) + k * 380) % (x1 - x0 - 80)) + 30; drawStripeFish(fx, y0 + Math.sin(t * 2 + k) * 3, t + k, 0.42); }
    g.fillStyle = 'rgba(255,255,255,.8)'; for (var b = 0; b < 14; b++) { var bx = x0 + ((t * 30 + b * 97) % (x1 - x0)); g.fillRect(bx, y0 - 10 + ((b * 7) % 18) - ((t * 6 + b) % 3), 2, 2); }
  }
  function drawRoomProps(t) {
    drawGlassPipe(t); drawGeyser(t); drawSlide(t);
    drawBench(4260, 316, t); drawBench(5140, 316, t + 1);
    W.rc.forEach(function (c) { if (c.got) return; var by = c.y + Math.sin(t * 3 + c.x) * 2; if (c.gold) { g.fillStyle = 'rgba(255,220,90,' + (0.25 + 0.15 * Math.sin(t * 6)) + ')'; g.beginPath(); g.arc(c.x, by, 15, 0, 7); g.fill(); g.fillStyle = '#7a5a10'; g.beginPath(); g.arc(c.x, by, 9, 0, 7); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(c.x, by, 8, 0, 7); g.fill(); g.fillStyle = '#fff3b0'; g.fillRect(c.x - 5, by - 5, 3, 2); g.fillStyle = '#7a5a10'; g.beginPath(); g.arc(c.x, by, 3.5, 0, 7); g.fill(); g.fillStyle = '#ffd24a'; g.fillRect(c.x - 1, by - 2, 2, 4); } else ball8(c.x, by, 7); });
    drawSteam(t);
    var ex = EXITX, ey = 330;                                       // 綠色水管出口
    g.fillStyle = '#1a1a20'; g.fillRect(ex - 18, ey - 52, 36, 53); g.fillStyle = '#8a929c'; g.fillRect(ex - 16, ey - 38, 32, 38); g.fillStyle = '#d0d6de'; g.fillRect(ex - 14, ey - 38, 5, 38); g.fillStyle = '#5e656e'; g.fillRect(ex + 8, ey - 38, 6, 38);
    g.fillStyle = '#1a1a20'; g.fillRect(ex - 20, ey - 54, 40, 18); g.fillStyle = '#8a929c'; g.fillRect(ex - 18, ey - 52, 36, 14); g.fillStyle = '#d0d6de'; g.fillRect(ex - 16, ey - 52, 5, 14); g.fillStyle = '#5e656e'; g.fillRect(ex + 10, ey - 52, 6, 14);
    g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('出口', ex, ey - 64);
  }
  var DBTN = { y0: 104, dy: 34, w: 150, h: 28, x: function () { return Math.round(WF / 2 - 75); } };
  function starPath(cx, cy, R, r) { g.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); }
  function drawCoin(c, t) {                                          // 隱藏室 2–4 的收集物：雲朵星／魚乾／流星
    var by = c.y + Math.sin(t * 3 + c.x) * 2, x = c.x;
    if (c.r === 2) {                                                  // 魚乾
      var sc = c.gold ? 1.5 : 1; if (c.gold) { g.fillStyle = 'rgba(255,220,90,' + (0.25 + 0.15 * Math.sin(t * 6)) + ')'; g.beginPath(); g.arc(x, by, 16, 0, 7); g.fill(); }
      g.save(); g.translate(x, by); g.scale(sc, sc); g.fillStyle = '#3a2410'; g.beginPath(); g.ellipse(0, 0, 10, 5.5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(8, 0); g.lineTo(14, -5); g.lineTo(14, 5); g.fill();
      g.fillStyle = c.gold ? '#ffd24a' : '#c98a46'; g.beginPath(); g.ellipse(0, 0, 9, 4.5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(8, 0); g.lineTo(13, -4); g.lineTo(13, 4); g.fill();
      g.fillStyle = c.gold ? '#fff3b0' : '#e8b878'; g.fillRect(-6, -2, 9, 1.5); g.fillStyle = '#2a1204'; g.fillRect(-7, -1, 2, 2); g.restore(); return;
    }
    var R = c.gold ? 12 : 8; if (c.gold) { g.fillStyle = 'rgba(255,220,90,' + (0.25 + 0.15 * Math.sin(t * 6)) + ')'; g.beginPath(); g.arc(x, by, 18, 0, 7); g.fill(); }
    g.save(); g.translate(0, 0); g.fillStyle = '#5a3a08'; starPath(x, by, R + 1.5, (R + 1.5) * 0.45); g.fill(); g.fillStyle = c.gold ? '#ffe45a' : (c.r === 1 ? '#fff7b0' : '#ffd24a'); starPath(x, by, R, R * 0.45); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - 2, by - R * 0.5, 2, 2); g.restore();
  }
  function drawExitPipe(ex, ey) {
    g.fillStyle = '#1a1a20'; g.fillRect(ex - 18, ey - 52, 36, 53); g.fillStyle = '#8a929c'; g.fillRect(ex - 16, ey - 38, 32, 38); g.fillStyle = '#d0d6de'; g.fillRect(ex - 14, ey - 38, 5, 38); g.fillStyle = '#5e656e'; g.fillRect(ex + 8, ey - 38, 6, 38);
    g.fillStyle = '#1a1a20'; g.fillRect(ex - 20, ey - 54, 40, 18); g.fillStyle = '#8a929c'; g.fillRect(ex - 18, ey - 52, 36, 14); g.fillStyle = '#d0d6de'; g.fillRect(ex - 16, ey - 52, 5, 14); g.fillStyle = '#5e656e'; g.fillRect(ex + 10, ey - 52, 6, 14);
    g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('出口', ex, ey - 64);
  }
  function drawRoomsExtra(t) {                                       // 隱藏室 2–4：收集物與出口
    W.rc.forEach(function (c) { if (c.r >= 1 && !c.got && !(c.b !== undefined && !W.bx[c.b])) drawCoin(c, t); });
    for (var i = 1; i <= 3; i++) if (cam.x < RXS[i + 1] && cam.x + WF > RXS[i]) drawExitPipe(EXS[i], EXY[i]);
  }
  function drawRoomBg(i, t) {                                        // 隱藏室 2–4 的整片背景（蓋掉天空與水面）
    var x0 = RXS[i], x1 = RXS[i + 1], y0 = Math.floor(cam.y) - 4, hh = H + 8, k, gr;
    if (i === 1) {                                                    // 雲上：藍天白雲海
      gr = g.createLinearGradient(0, y0, 0, y0 + hh); gr.addColorStop(0, '#6cc0ff'); gr.addColorStop(0.7, '#cdeaff'); gr.addColorStop(1, '#f2fbff'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, hh);
      // 太陽光暈
      var sx2 = cam.x + WF * 0.78, sy2 = 70 - cam.y * 0.05, sg = g.createRadialGradient(sx2, sy2, 4, sx2, sy2, 120); sg.addColorStop(0, 'rgba(255,248,190,.95)'); sg.addColorStop(0.25, 'rgba(255,240,170,.45)'); sg.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = sg; g.fillRect(sx2 - 130, sy2 - 130, 260, 260);
      // 遠處淡淡的小雲（慢、半透明）→ 近處大朵蓬鬆雲（快、不透明），三層視差
      [[0.22, 1, 0.5, 9, 0.9, 40], [0.45, 1, 0.85, 7, 1.4, 120], [0.7, 2, 1, 5, 2.2, 260]].forEach(function (L, li) {
        var par = L[0], sc = L[1], al = L[2], cnt = L[3], dr = L[4], yb = L[5], span = WF + 200;
        for (k = 0; k < cnt; k++) {
          var spr = CLOUDS.bg[(k + li) % 4], sw = spr.width * sc, sh = spr.height * sc, off = k * (span / cnt) + (k * 37 % 29) - cam.x * par + t * dr * 6;
          var sxx = (((off % span) + span) % span) - 100, syy = yb + ((k * 83 + li * 41) % 260) - cam.y * 0.08 * (li + 1) + Math.sin(t * 0.5 + k) * 3;
          g.globalAlpha = al; g.drawImage(spr, Math.round(cam.x + sxx), Math.round(syy), sw, sh);
        }
      }); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x0, 440, x1 - x0, 400); return;
    }
    if (i === 2) {                                                    // 魚乾倉庫：木板牆、橫梁、燈
      g.fillStyle = '#5a3a22'; g.fillRect(x0, y0, x1 - x0, hh); g.fillStyle = '#4a2f1b'; for (k = x0; k < x1; k += 28) g.fillRect(k, y0, 2, hh);
      g.fillStyle = '#3a2414'; for (k = 0; k < 2; k++) g.fillRect(x0, 190 + k * 70, x1 - x0, 7);
      for (k = x0; k < x1; k += 62) { var bw = 26 + ((k * 7) % 22), bh = 20 + ((k * 3) % 18); g.fillStyle = '#7a4e2a'; g.fillRect(k + 6, 190 - bh, bw, bh); g.fillStyle = '#5a3a1c'; g.fillRect(k + 6, 190 - bh, bw, 3); g.fillRect(k + 6 + bw / 2 - 1, 190 - bh, 2, bh); if (k % 124 === 0) { g.fillStyle = '#6b4424'; g.fillRect(k + 10, 260 - bh + 4, bw - 6, bh - 4); } }
      g.fillStyle = '#2f1c0e'; for (k = x0; k < x1; k += 220) g.fillRect(k, y0, 14, 150); g.fillRect(x0, 118, x1 - x0, 12);
      for (k = x0 + 30; k < x1; k += 110) { var cw = 34 + ((k * 5) % 14); g.fillStyle = 'rgba(40,22,10,.55)'; g.fillRect(k, 330 - cw, cw, cw); g.fillStyle = 'rgba(90,58,28,.7)'; g.fillRect(k + 2, 330 - cw + 2, cw - 4, cw - 4); g.fillStyle = 'rgba(40,22,10,.6)'; g.fillRect(k, 330 - cw + cw / 2 - 1, cw, 2); g.fillRect(k + cw / 2 - 1, 330 - cw, 2, cw); if (((k - x0) / 110 | 0) % 3 === 1) { g.fillStyle = 'rgba(50,36,24,.7)'; g.fillRect(k + 50, 296, 22, 34); g.fillStyle = 'rgba(30,20,12,.7)'; g.fillRect(k + 50, 304, 22, 3); g.fillRect(k + 50, 320, 22, 3); } }
      for (k = x0 + 120; k < x1; k += 300) { g.strokeStyle = '#1a0c06'; g.lineWidth = 1; g.beginPath(); g.moveTo(k, 130); g.lineTo(k, 152); g.stroke(); var lg = g.createRadialGradient(k, 160, 2, k, 160, 90); lg.addColorStop(0, 'rgba(255,220,130,.55)'); lg.addColorStop(1, 'rgba(255,220,130,0)'); g.fillStyle = lg; g.fillRect(k - 90, 80, 180, 200); g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(k, 160, 6, 0, 7); g.fill(); g.fillStyle = '#4a3220'; g.fillRect(k - 8, 150, 16, 5); }
      for (k = x0 + 40; k < x1; k += 90) { var sway = Math.sin(t * 1.5 + k) * 2; g.strokeStyle = '#a07040'; g.beginPath(); g.moveTo(k, 130); g.lineTo(k + sway, 160); g.stroke(); for (var fi = 0; fi < 3; fi++) { g.fillStyle = '#c98a46'; g.beginPath(); g.ellipse(k + sway * (1 + fi * 0.2), 166 + fi * 16, 4, 9, 0, 0, 7); g.fill(); g.fillStyle = '#8a5a2c'; g.fillRect(k + sway * (1 + fi * 0.2) - 1, 160 + fi * 16, 2, 3); } }
      g.fillStyle = '#150c06'; g.fillRect(x0, 330, x1 - x0, 400); return;
    }
    gr = g.createLinearGradient(0, y0, 0, y0 + hh); gr.addColorStop(0, '#04082a'); gr.addColorStop(0.6, '#1c1660'); gr.addColorStop(1, '#3a2078'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, hh);   // 星星衝刺：夜空
    for (k = 0; k < 140; k++) { var sx = x0 + ((k * 97) % (x1 - x0)), sy = ((k * 53) % 440) - 40; g.globalAlpha = 0.4 + 0.4 * Math.sin(t * 3 + k); g.fillStyle = '#fff'; g.fillRect(sx, sy, 2, 2); } g.globalAlpha = 1;
    g.fillStyle = '#fff7c8'; g.beginPath(); g.arc(x0 + 520, 90, 34, 0, 7); g.fill(); g.fillStyle = '#e8dca0'; g.beginPath(); g.arc(x0 + 508, 82, 7, 0, 7); g.arc(x0 + 532, 100, 5, 0, 7); g.fill();
    var sh = (t * 0.6) % 5; if (sh < 1) { var sx2 = x0 + 700 + sh * 300 + Math.floor(t / 5) * 90; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx2, 40 + sh * 120); g.lineTo(sx2 - 40, 40 + sh * 120 - 24); g.stroke(); }
    g.fillStyle = '#0a0a28'; g.fillRect(x0, 400, x1 - x0, 400);
  }
  /* ---------- 可愛雲（入口＝蝴蝶結貓咪雲、平台＝圓滾滾笑臉雲），用圓形聯集自動描邊上陰影 ---------- */
  var CLOUDS = (function () {
    function blob(circles, w, h, o) {
      var m = []; for (var y = 0; y < h; y++) m.push(new Array(w).fill(0));
      circles.forEach(function (c) { for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var dx = x + .5 - c[0], dy = y + .5 - c[1]; if (dx * dx + dy * dy <= c[2] * c[2]) m[y][x] = 1; } });
      if (o.body) for (var y = o.body[0]; y < o.body[1]; y++) for (var x = o.body[2]; x < o.body[3]; x++) m[y][x] = 1;
      var c = document.createElement('canvas'); c.width = w; c.height = h; var cg = c.getContext('2d');
      function ins(x, y) { return x >= 0 && y >= 0 && x < w && y < h && m[y][x]; }
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (m[y][x]) {
        var edge = !ins(x - 1, y) || !ins(x + 1, y) || !ins(x, y - 1) || !ins(x, y + 1), bot = !ins(x, y + 1) || !ins(x, y + 2);
        cg.fillStyle = edge ? o.line : bot ? o.shade : o.fill; cg.fillRect(x, y, 1, 1);
      }
      return { c: c, g: cg };
    }
    function px(g, x, y, col, w, h) { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); }
    function blush(g, cx, cy, gap) { [cx - gap, cx + gap].forEach(function (x) { px(g, x - 1, cy, '#ff9ab8', 3, 2); px(g, x, cy, '#ffb8cc'); }); }
    function eyesHappy(g, cx, cy, gap) { [cx - gap, cx + gap].forEach(function (x) { px(g, x - 1, cy + 1, '#2b2040'); px(g, x, cy, '#2b2040', 2, 1); px(g, x + 2, cy + 1, '#2b2040'); }); }
    function smile(g, cx, cy) { px(g, cx - 1, cy, '#2b2040'); px(g, cx, cy + 1, '#2b2040', 2, 1); px(g, cx + 2, cy, '#2b2040'); }
    function bow(g, x, y) { px(g, x - 3, y, '#ff6a8a', 3, 3); px(g, x + 3, y, '#ff6a8a', 3, 3); px(g, x, y + 1, '#ff3a66', 3, 2); px(g, x - 3, y, '#ffc0d0'); px(g, x + 5, y, '#ffc0d0'); }
    // 入口：蝴蝶結貓咪雲（金邊）
    var eo = blob([[8, 14, 6], [15, 12, 7.5], [23, 14, 6], [14, 16, 8], [19, 16, 7], [8, 7, 3], [22, 7, 3]], 31, 24, { line: '#b07a2a', fill: '#fffaf0', shade: '#ffe6b0' }), g = eo.g;
    [[13, 13], [17, 13]].forEach(function (e) { px(g, e[0] - 1, e[1], '#2b2040', 2, 3); px(g, e[0] - 1, e[1], '#fff'); });
    blush(g, 15, 16, 7); px(g, 12, 17, '#2b2040'); px(g, 13, 18, '#2b2040'); px(g, 14, 17, '#2b2040'); px(g, 15, 18, '#2b2040'); px(g, 16, 17, '#2b2040'); bow(g, 24, 3);
    var cache = {};
    // 平台：寬度 w 的笑臉雲（頂面接近平的，魚站在上面；底部是一朵朵圓肚子）
    function plat(w) {
      var key = Math.round(w); if (cache[key]) return cache[key];
      var W2 = key + 6, H = 28, cs = [], i = 0; for (var x = 10; x < W2 - 8; x += 11, i++) cs.push([x, 14 + (i % 2 ? 1 : 0), 11]);
      cs.push([W2 - 10, 14, 11]);
      var o = blob(cs, W2, H, { line: '#5a4a8a', fill: '#ffffff', shade: '#d6e2ff', body: [6, 21, 3, W2 - 3] }), gg = o.g;
      for (var fx = Math.min(32, W2 / 2); fx < W2 - 16; fx += 70) { eyesHappy(gg, Math.round(fx), 11, 5); blush(gg, Math.round(fx), 14, 8); smile(gg, Math.round(fx) - 1, 15); }
      return cache[key] = o.c;
    }
    // 背景雲：4 種蓬鬆形狀（淡藍描邊、底部淡藍陰影），其中兩種帶小笑臉
    var SH = [
      { w: 56, h: 30, cs: [[12, 19, 9], [24, 14, 12], [38, 17, 10], [47, 21, 7], [30, 22, 9]], face: 0 },
      { w: 74, h: 36, cs: [[12, 25, 10], [26, 18, 13], [42, 14, 14], [58, 20, 12], [66, 26, 8], [40, 26, 11]], face: 1 },
      { w: 44, h: 26, cs: [[10, 17, 8], [21, 12, 10], [33, 16, 9], [24, 19, 8]], face: 0 },
      { w: 64, h: 32, cs: [[11, 22, 9], [24, 15, 12], [38, 18, 12], [52, 22, 9], [32, 24, 10]], face: 1 }];
    var bgc = SH.map(function (d) { var b = blob(d.cs, d.w, d.h, { line: '#b4cff0', fill: '#ffffff', shade: '#d9e9ff' }); if (false && d.face) { var fx = Math.round(d.w / 2) - 1, fy = Math.round(d.h * 0.58); eyesHappy(b.g, fx, fy - 2, 4); blush(b.g, fx, fy + 1, 7); smile(b.g, fx - 1, fy + 2); } return b.c; });
    return { entry: eo.c, plat: plat, bg: bgc };
  })();
  function drawCloudPlat(q) {
    var sp = CLOUDS.plat(q.w); g.drawImage(sp, Math.round(q.x - 3), Math.round(q.y - 3));
  }
  function drawWhFloor(q) {
    g.fillStyle = '#1a0c06'; g.fillRect(q.x - 1, q.y - 1, q.w + 2, q.h + 2); g.fillStyle = '#5b3b20'; g.fillRect(q.x, q.y, q.w, q.h);
    g.fillStyle = '#3b2410'; for (var xx = q.x + 20; xx < q.x + q.w; xx += 40) g.fillRect(xx, q.y + 8, 2, q.h);
    g.fillStyle = '#8a5a30'; g.fillRect(q.x, q.y, q.w, 8); g.fillStyle = '#b27a44'; g.fillRect(q.x, q.y, q.w, 3); g.fillStyle = '#6b4424'; g.fillRect(q.x, q.y + 8, q.w, 2);
  }
  var DEV = true;                                                  // 測試按鈕：直達終點／直達隱藏室（地圖版只有 ?debug 才有）
  var TB_W = Math.min(100, Math.floor(WF / 2) - 8);        // 測試按鈕寬度（手機窄螢幕要縮小，不然會切到邊）
  var TBTN = [{ k: 'goal', t: '直達終點', x: function () { return Math.round(WF / 2 - TB_W - 4); }, y: 250 }, { k: 'room', t: '水管牆', x: function () { return Math.round(WF / 2 + 4); }, y: 250 }, { k: 'r1', t: '雲上吊環', x: function () { return Math.round(WF / 2 - TB_W - 4); }, y: 280 }, { k: 'r2', t: '魚乾倉庫', x: function () { return Math.round(WF / 2 + 4); }, y: 280 }], TB_Y = 250, TB_H = 24;
  function enterRoom(W, i, ret) {
    var p = W.p; W.qUsed[i] = true; W.ret = ret; W.gs = W.t - 0.55; p.x = ENT[i]; p.y = ENTY[i]; p.vx = p.vy = 0; p.on = true; p.swing = null; p.spinT = 0; W.rsp = { x: ENT[i], y: ENTY[i] };
    cam.x = p.x - WF / 2; cam.y = p.y - H * 0.5; sfx('warp'); W.banner = { txt: ROOM_NAMES[i], t: 0 };
  }
  function warpTest(k) {
    W = newWorld(); var p = W.p; W.started = true;
    if (k === 'goal') { var C = LV.plats[5]; p.x = 3040; p.y = C.y - HBH / 2; W.cpPlat = C; W.zi = 1; W.cp = { x: 3070, y: C.y - HBH / 2 }; }
    else { var ki = k === 'r1' ? 1 : k === 'r2' ? 2 : 0; enterRoom(W, ki, QBS[ki].ret || { x: QBS[ki].x + 70, y: 300 }); W.zi = zoneIdx(p.x); }
    p.vx = 0; p.on = true; cam.x = p.x - WF / 2; cam.y = p.y - H * 0.5;
  }
  var MBTN = { w: 22, h: 14, x: function () { return WF - 28; }, y: 26 };
  function draw() {
    if ((++relT) % 15 === 0) relayout();
    tg.clearRect(0, 0, tv.width, tv.height);
    var p = W.p, t = W.t;
    var TH = themeAt(cam.x + WF / 2);
    (function () { var NB = 12, y0 = 0; for (var bi = 0; bi < NB; bi++) { var u = bi / (NB - 1), c = u < 0.45 ? mixHex(TH.sky[0], TH.sky[1], u / 0.45) : u < 0.78 ? mixHex(TH.sky[1], TH.sky[2], (u - 0.45) / 0.33) : mixHex(TH.sky[2], TH.sky[3], (u - 0.78) / 0.22); g.fillStyle = c; var y1 = Math.round((bi + 1) * H / NB); g.fillRect(0, y0, WF, y1 - y0 + 1); y0 = y1; } })();
    var sx = WF - 56 - cam.x * 0.02, sy = 54 - cam.y * 0.05;
    g.fillStyle = '#7a4a10'; g.beginPath(); g.arc(sx, sy, 16, 0, 7); g.fill(); g.fillStyle = TH.sun; g.beginPath(); g.arc(sx, sy, 14, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(sx - 7, sy - 8, 5, 3);
    // 雲（慢慢飄、視差）
    [[30, 70, 1], [190, 110, 0.8], [340, 52, 1.1], [500, 96, 0.9]].forEach(function (c, ci) {
      var cx = ((c[0] + W.t * (3 + ci) - cam.x * 0.12) % (WF + 160) + WF + 160) % (WF + 160) - 80, cy = c[1] - cam.y * 0.04, k = c[2];
      var bumps = [[-16, 0, 8], [-6, -6, 10], [7, -4, 9], [17, 1, 7]], oc = TH.sky[0] === '#3f86ec' ? '#2a5fbf' : '#6a4a7a';
      [1, 0].forEach(function (pass) { bumps.forEach(function (bm) { g.fillStyle = pass ? oc : 'rgb(' + TH.cloud + ')'; g.beginPath(); g.arc(cx + bm[0] * k, cy + bm[1] * k, (bm[2] + (pass ? 1.5 : 0)) * k, 0, 7); g.fill(); }); g.fillStyle = pass ? oc : 'rgb(' + TH.cloud + ')'; g.fillRect(cx - 17 * k, cy - 1 * k, 34 * k, (8 + (pass ? 1.5 : 0)) * k); });
      g.fillStyle = 'rgba(120,170,235,.55)'; g.fillRect(cx - 15 * k, cy + 5 * k, 31 * k, 2 * k);
    });
    // 遠山兩層（視差）＋ 遠處的魚塭竹竿
    var base = H - 150 - cam.y * 0.1;
    function hill(hx, w, hh, col, dark, eyes) { g.fillStyle = dark; g.beginPath(); g.ellipse(hx + w / 2, base + 60, w / 2 + 2, hh + 2, 0, Math.PI, 0); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(hx + w / 2, base + 60, w / 2, hh, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(hx + w * 0.62, base + 60 - hh * 0.8, w * 0.1, hh * 0.8); g.fillRect(hx + w * 0.78, base + 60 - hh * 0.55, w * 0.08, hh * 0.55); if (eyes) { g.fillStyle = '#16301a'; g.fillRect(hx + w / 2 - 7, base + 60 - hh * 0.55, 4, 9); g.fillRect(hx + w / 2 + 3, base + 60 - hh * 0.55, 4, 9); g.fillStyle = '#fff'; g.fillRect(hx + w / 2 - 6, base + 60 - hh * 0.55 + 1, 2, 3); g.fillRect(hx + w / 2 + 4, base + 60 - hh * 0.55 + 1, 2, 3); } }
    var i, hx, hh;
    for (i = -1; i < 7; i++) { hx = i * 150 - ((cam.x * 0.12) % 150); hh = 46 + ((i + 9) % 3) * 14; hill(hx, 150, hh, TH.hill2, '#1d4a2a', (i + 9) % 3 === 1); }
    for (i = -1; i < 6; i++) { hx = i * 120 - ((cam.x * 0.25) % 120); hh = 28 + ((i + 5) % 3) * 12; hill(hx, 120, hh, TH.hill1, '#1d4a2a', (i + 5) % 3 === 0); }
    var zb = clamp((cam.x + WF / 2 - (ZONES[1].x0 - 150)) / 300, 0, 1);                       // 區 2：遠處古厝屋頂剪影與亮窗
    if (zb > 0) { g.globalAlpha = zb * 0.85; for (i = -1; i < 6; i++) { var rx = i * 96 - ((cam.x * 0.3) % 96), rh = 20 + ((i + 7) % 3) * 8; g.fillStyle = '#4a2c4a'; g.fillRect(rx + 10, base + 46 - rh, 66, rh + 20); g.beginPath(); g.moveTo(rx + 2, base + 46 - rh); g.lineTo(rx + 43, base + 30 - rh); g.lineTo(rx + 84, base + 46 - rh); g.fill(); g.fillStyle = '#ffd27a'; g.fillRect(rx + 24, base + 50 - rh, 5, 6); g.fillRect(rx + 50, base + 50 - rh, 5, 6); } g.globalAlpha = 1; }
    g.fillStyle = '#7f6a4d'; if (zb < 1) for (i = 0; i < 9; i++) { var bx = i * 70 - ((cam.x * 0.4) % 70); g.fillRect(bx, base + 44, 2, 14); }
    g.save(); g.translate(-Math.round(cam.x), -Math.round(cam.y));
    var wy = LV.waterY, wg = g.createLinearGradient(0, wy, 0, LV.bottom + 40); wg.addColorStop(0, TH.water[0]); wg.addColorStop(1, TH.water[1]); g.fillStyle = wg; g.fillRect(cam.x, wy, WF, LV.bottom - wy + 40);
    g.fillStyle = TH.wave; for (i = -1; i < WF / 6 + 2; i++) { var wx = Math.floor(cam.x / 6) * 6 + i * 6; g.fillRect(wx, wy - 1 + Math.round(Math.sin(wx * 0.09 + t * 2.2) * 1.5), 6, 2); }
    g.fillStyle = 'rgba(255,255,255,.28)'; for (i = 0; i < 14; i++) g.fillRect(Math.floor(cam.x / 50) * 50 + i * 50 + ((t * 12) % 50), wy + 8 + (i % 3) * 12, 18, 2);
    for (i = 1; i <= 3; i++) if (cam.x < RXS[i + 1] && cam.x + WF > RXS[i]) drawRoomBg(i, t);
    // 吊環架（移動環有橫軌）
    LV.rings.forEach(function (r) {
      if (r.cx > ROOMX && r.cx < RXS[1]) { drawValve(r, t); return; }
      var a = isMv(r) ? r.ax : 0; g.fillStyle = '#6e4c2c'; g.fillRect(r.cx - a - GDX - 8, r.py - 2, (a + GDX + 8) * 2, 4);
      [-1, 1].forEach(function (sd) { g.fillRect(r.cx + sd * (a + GDX + 6) - 1, r.py, 3, r.cx > RXS[1] ? 16 : wy + 30 - r.py); });
      if (isMv(r)) { g.fillStyle = '#d9a441'; g.fillRect(r.px - 3, r.py - 4, 6, 8); }
    });
    if (cam.x + WF > ROOMX - 100 && cam.x < RXS[1]) drawPipeWall(t);
    // 平台
    LV.plats.forEach(function (q) {
      if (q.st === 'roof') { drawRoof(q); return; }
      if (q.st === 'room') { drawRoomFloor(q); return; }
      if (q.st === 'pipe') { drawPipePlat(q); return; }
      if (q.st === 'cloud') { drawCloudPlat(q); return; }
      if (q.st === 'wh') { drawWhFloor(q); return; }
      var T = 16, xx, yy, rr;
      g.fillStyle = '#1a0c06'; g.fillRect(q.x - 1, q.y - 1, q.w + 2, q.h + 2);
      g.fillStyle = '#c84c0c'; g.fillRect(q.x, q.y, q.w, q.h);
      for (yy = q.y + 8, rr = 0; yy < LV.bottom; yy += 8, rr++) { g.fillStyle = '#5a1e08'; g.fillRect(q.x, yy, q.w, 1); for (xx = q.x + (rr % 2 ? 0 : 8); xx < q.x + q.w; xx += T) g.fillRect(xx, yy - 8 + 1 > q.y ? yy - 7 : q.y, 1, 8); }
      g.fillStyle = '#fc9838'; for (yy = q.y + 8; yy < Math.min(LV.bottom, q.y + 96); yy += 8) for (xx = q.x + 1; xx < q.x + q.w - 1; xx += T) g.fillRect(xx + ((yy - q.y) / 8 % 2 ? 8 : 0) % T, yy + 1, 5, 1);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(q.x + q.w - 4, q.y, 4, q.h);
      g.fillStyle = '#005800'; g.fillRect(q.x - 3, q.y - 6, q.w + 6, 12);
      g.fillStyle = '#00a800'; g.fillRect(q.x - 2, q.y - 5, q.w + 4, 9);
      g.fillStyle = '#80d010'; g.fillRect(q.x - 2, q.y - 5, q.w + 4, 3);
      g.fillStyle = '#005800'; for (xx = q.x - 2; xx < q.x + q.w + 2; xx += 8) { g.fillRect(xx + 2, q.y + 3, 3, 4); g.fillRect(xx + 5, q.y + 4, 1, 3); }
      g.fillStyle = '#00a800'; for (xx = q.x; xx < q.x + q.w; xx += 24) { g.fillRect(xx + 3, q.y - 9, 3, 4); g.fillRect(xx + 7, q.y - 11, 3, 6); g.fillRect(xx + 11, q.y - 8, 3, 3); }
    });
    drawQBlock(t); drawBoxes(t); if (cam.x + WF > ROOMX - 100 && cam.x < RXS[1]) drawRoomProps(t); if (cam.x + WF > RXS[1]) drawRoomsExtra(t);
    // 終點：跟前面一模一樣的吊環（細繩＋小環＋木架），只是掛上去之後拿來曬乾
    var fy = LV.plats[5].y, gx = GOAL.x, gy = GOAL.y, bmY = GOAL.beam, gp = W.done && W.gbonus ? 1 : 0;
    g.fillStyle = '#6e4c2c'; g.fillRect(gx - GDX - 8, bmY - 2, (GDX + 8) * 2, 4); [-1, 1].forEach(function (sd) { g.fillRect(gx + sd * (GDX + 6) - 1, bmY, 3, fy - bmY); });
    if (!gp) {
      g.strokeStyle = '#d8d2e8'; g.lineWidth = 1;
      [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(gx + sd * GDX, bmY); g.lineTo(gx + sd * GDX, gy); g.stroke(); g.strokeStyle = '#e6e1f2'; g.beginPath(); g.arc(gx + sd * GDX, gy + 2, 3.5, 0, 7); g.stroke(); g.strokeStyle = '#d8d2e8'; });
      g.strokeStyle = 'rgba(255,240,150,' + (0.4 + 0.4 * Math.sin(t * 4)) + ')'; g.beginPath(); g.arc(gx, gy, GRAB, 0, 7); g.stroke();
    }
    for (var fi = 0; fi < 4; fi++) { var fx = gx - 54 + fi * 8 + (fi > 1 ? 68 : 0), sw = Math.sin(t * 2 + fi) * 1.5; g.fillStyle = '#9fb0c8'; g.fillRect(fx + sw, fy - 40, 4, 12); g.fillStyle = '#d9e2ef'; g.fillRect(fx + sw + 1, fy - 38, 2, 7); }
    // 吊環（沒被抓的）
    LV.rings.forEach(function (r) {
      if (p.swing && p.swing.ring === r) return;
      var rc = r.kind === 'break' ? '#f0a07a' : '#d8d2e8'; g.strokeStyle = rc; g.lineWidth = 1;
      [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(r.px + sd * GDX, r.py); g.lineTo(r.x + sd * GDX, r.y); g.stroke(); g.strokeStyle = r.kind === 'break' ? '#ffc09a' : '#e6e1f2'; g.beginPath(); g.arc(r.x + sd * GDX, r.y + 2, 3.5, 0, 7); g.stroke(); g.strokeStyle = rc; });
      var near = !p.swing && !p.dead && Math.hypot(p.x - r.x, p.y - HO - r.y) < 70; if (near) { g.strokeStyle = 'rgba(255,240,150,.8)'; g.beginPath(); g.arc(r.x, r.y, GRAB, 0, 7); g.stroke(); }
    });
    // 敵人（矩形組成，先畫一圈深色外框再上色；第 6 欄 1＝細節不描邊）
    W.en.forEach(function (e) {
      var f = Math.floor(t * 8) % 2, dx = e.dir, x = Math.round(e.x), y = Math.round(e.y), OL = '#2f2638';
      function shp(list, ox, oy, fl) {
        var k, q, rx;
        for (k = 0; k < list.length; k++) { q = list[k]; if (q[5]) continue; rx = fl ? -q[0] - q[2] : q[0]; g.fillStyle = OL; g.fillRect(ox + rx - 1, oy + q[1] - 1, q[2] + 2, q[3] + 2); }
        for (k = 0; k < list.length; k++) { q = list[k]; rx = fl ? -q[0] - q[2] : q[0]; g.fillStyle = q[4]; g.fillRect(ox + rx, oy + q[1], q[2], q[3]); }
      }
      if (!e.alive) { if (e.dieT > 1) return; g.save(); g.translate(x, y); g.rotate(e.dieT * 10); g.globalAlpha = 1 - e.dieT; g.translate(-x, -y); }
      var fl = dx < 0;
      if (e.k === 'crow') {
        var cw = f ? [[-6, -12, 9, 8, '#2a2d3a'], [-5, -9, 7, 2, '#444a5e'], [-9, -14, 4, 4, '#14161f']] : [[-6, 3, 9, 8, '#2a2d3a'], [-5, 5, 7, 2, '#444a5e'], [-9, 9, 4, 4, '#14161f']];
        shp([[-12, -1, 5, 4, '#1f212c'], [-8, -3, 14, 8, '#2a2d3a'], [-7, 2, 12, 3, '#3a3e4e'], [4, -7, 8, 7, '#2a2d3a'], [11, -4, 6, 3, '#d2a63a']].concat(cw), x, y, fl);
        g.fillStyle = '#ff5a3a'; g.fillRect(fl ? x - 10 : x + 9, y - 6, 2, 2);
      } else if (e.k === 'mouse') {
        var ml = Math.floor(t * 14) % 2, tl2 = Math.round(Math.sin(t * 10) * 1);
        shp([[-12, -1 + tl2, 6, 1, '#e8a0b0', 1], [-7, -4, 11, 7, '#a9a39a'], [-5, 0, 8, 3, '#d6d0c6', 1], [3, -5, 7, 6, '#b8b2a8'], [4, -8, 3, 3, '#e8a0b0'], [9, -2, 3, 2, '#e8a0b0'], [-5 + ml * 2, 3, 2, 2, '#a9a39a'], [1 - ml * 2, 3, 2, 2, '#a9a39a']], x, y - 1, fl);
        g.fillStyle = '#1d1a22'; g.fillRect(fl ? x - 8 : x + 7, y - 5, 1, 2);
      } else if (e.k === 'tile') {
        var tx = x + (e.warn ? Math.round(Math.sin(t * 60) * 1.5) : 0);
        if (e.warn || e.falling) {
          g.save(); g.translate(tx, y); g.rotate(e.falling ? t * 9 : 0);
          shp([[-8, -5, 16, 10, '#c0643f'], [-8, -5, 16, 3, '#d98a52'], [-6, 1, 12, 2, '#7a3524']], 0, 0, false); g.restore();
          if (e.warn) { g.fillStyle = 'rgba(255,90,90,.9)'; g.fillRect(x - 1, y + 10, 2, 4); g.fillRect(x - 1, y + 16, 2, 2); }
          if (e.falling) { g.fillStyle = 'rgba(255,230,200,.5)'; g.fillRect(x - 1, y - 20, 2, 14); }
        }
      } else if (e.k === 'gull') {
        var wing = f ? [[-6, -12, 9, 8, '#ffffff'], [-5, -9, 7, 2, '#cfd9e2'], [-9, -14, 4, 4, '#5b6472']] : [[-6, 3, 9, 8, '#ffffff'], [-5, 5, 7, 2, '#cfd9e2'], [-9, 9, 4, 4, '#5b6472']];
        shp([[-12, -1, 5, 4, '#b8c4d0'], [-8, -3, 14, 8, '#ffffff'], [-7, 2, 12, 3, '#d7e0e8'], [4, -7, 8, 7, '#ffffff'], [11, -4, 5, 2, '#f4a62a'], [11, -2, 4, 1, '#d9811a'], [8, -6, 2, 2, '#1d1a22', 1]].concat(wing), x, y, fl);
        g.fillStyle = '#fff'; if (!fl) g.fillRect(x + 9, y - 6, 1, 1); else g.fillRect(x - 10, y - 6, 1, 1);
      } else if (e.k === 'cat') {
        var lg = f ? 2 : 0, tl = Math.round(Math.sin(t * 6) * 2);
        shp([[-12, -11 + tl, 3, 10, '#e8923a'], [-8, -5, 14, 9, '#f0a24a'], [-5, -5, 2, 5, '#c26a22', 1], [-1, -5, 2, 6, '#c26a22', 1], [-6, 1, 11, 3, '#f7dcae', 1],
          [3, -10, 10, 9, '#f0a24a'], [3, -13, 3, 4, '#f0a24a'], [10, -13, 3, 4, '#f0a24a'], [4, -12, 1, 2, '#f08aa0', 1], [11, -12, 1, 2, '#f08aa0', 1],
          [9, -5, 5, 4, '#f7dcae'], [-7 + lg, 4, 3, 3, '#e8923a'], [-1 - lg, 4, 3, 3, '#e8923a'], [4 + lg, 4, 3, 3, '#f0a24a'], [9 - lg, 4, 3, 3, '#f0a24a']], x, y - 1, fl);
        var ex = fl ? -6 : 6, nx = fl ? -12 : 12; g.fillStyle = '#1d1a22'; g.fillRect(x + (fl ? -8 : 7), y - 8, 1, 2); g.fillRect(x + (fl ? -12 : 11), y - 8, 1, 2); g.fillStyle = '#f06a8a'; g.fillRect(x + (fl ? -14 : 13), y - 5, 1, 1);
        g.fillStyle = '#fff'; g.fillRect(x + (fl ? -8 : 7), y - 8, 1, 1);
      } else if (e.k === 'otter') {
        var wx = e.s.x, wyy = LV.waterY;
        if (e.warn) {
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; var rr = 6 + (t * 14) % 9; g.beginPath(); g.ellipse(wx, wyy + 2, rr, rr * 0.3, 0, 0, 7); g.stroke();
          shp([[-5, -9, 10, 9, '#8a5a34'], [-3, -4, 6, 4, '#d8b58a'], [-5, -12, 3, 4, '#8a5a34'], [2, -12, 3, 4, '#8a5a34'], [-3, -7, 1, 2, '#1d1a22', 1], [2, -7, 1, 2, '#1d1a22', 1], [-1, -4, 2, 2, '#2a2020', 1]], wx, wyy + 1, false);
          g.fillStyle = '#5ab0cc'; g.fillRect(wx - 8, wyy, 16, 4);
        }
        if (e.boxes) {
          g.save(); g.translate(x, e.boxes[0][1] + 8); g.rotate(clamp(e.vy / 700, -1, 1) * 0.7 * (fl ? -1 : 1));
          shp([[-2, 8, 4, 9, '#6e4528'], [-5, -6, 10, 16, '#8a5a34'], [-3, -1, 6, 10, '#d8b58a'], [-6, -2, 3, 5, '#7a4e2c'], [3, -2, 3, 5, '#7a4e2c'], [-5, -15, 10, 9, '#8a5a34'], [-4, -11, 8, 5, '#d8b58a'], [-5, -18, 3, 4, '#8a5a34'], [2, -18, 3, 4, '#8a5a34'], [-3, -13, 1, 2, '#1d1a22', 1], [2, -13, 1, 2, '#1d1a22', 1], [-1, -10, 2, 2, '#2a2020', 1], [-8, -9, 3, 1, '#f3e4cb', 1], [5, -9, 3, 1, '#f3e4cb', 1]], 0, 0, false);
          g.restore();
        }
      } else if (e.k === 'ball8') {
        if (e.boxes) { g.save(); g.translate(x, y); g.rotate(-x * 0.09); ball8(0, 0, 10); g.restore(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 9, y + 10, 18, 2); }
      } else if (e.k === 'heron') {
        var hy = 448 - e.neck;
        if (e.warn) { g.fillStyle = 'rgba(255,90,90,.9)'; g.fillRect(x - 2, hy - 15, 4, 7); g.fillRect(x - 2, hy - 6, 4, 3); }
        g.fillStyle = '#e8c23a'; g.fillRect(x - 4, 449, 2, 21); g.fillRect(x + 2, 449, 2, 21);             // 腳
        shp([[-13, 441, 6, 5, '#ffffff'], [-9, 436, 19, 14, '#ffffff'], [-8, 441, 13, 8, '#b9c6d4'], [-2, hy, 4, e.neck, '#f2f5f8'], [-4, hy - 4, 9, 8, '#ffffff'],
          [-1, hy - 8, 7, 4, '#2a2d38'], [4, hy - 8, 6, 2, '#2a2d38'], [-15, hy - 1, 11, 2, '#f0b43a'], [-3, hy - 2, 2, 2, '#e0402a', 1]], x, 0, false);
        g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 12, LV.waterY - 1, 24, 2);
      }
      if (!e.alive) g.restore();
    });
    // 魚
    if (p.dead <= 0 && !(p.inv > 0 && !W.done && Math.floor(t * 14) % 2)) {
      if (W.done && W.gbonus) {
        var dry = clamp((W.doneT - 0.5) / 3, 0, 1), sw2 = Math.sin(W.doneT * 2.4) * (1 - dry * 0.6);
        var hst = { aL: 0.75, aR: 0.75, tail: 1.1, ph: W.doneT * 3, wave: 0.8, wp: W.doneT * 2, tw: sw2 * 0.05, sy: 1 - 0.1 * dry, dry: dry }, hx3 = p.x, hy3 = p.y - HO, hps = [-1, 1].map(function (sd) { return toWorld(handLocal(sd, 0.75, hst), hx3, hy3, sw2 * 0.05, p.face); });
        g.strokeStyle = '#d8d2e8'; g.lineWidth = 1;
        hps.forEach(function (hp, i) { g.beginPath(); g.moveTo(GOAL.x + (i ? 1 : -1) * GDX, GOAL.beam); g.lineTo(hp[0], hp[1]); g.stroke(); g.beginPath(); g.arc(hp[0], hp[1] + 2, 3.5, 0, 7); g.stroke(); });
        drawFish(hx3, hy3, sw2 * 0.05, p.face, hst);
        g.strokeStyle = 'rgba(255,240,170,' + (0.5 * (1 - dry)) + ')'; g.lineWidth = 1; for (var hr = 0; hr < 3; hr++) { g.beginPath(); g.moveTo(p.x - 14 + hr * 14, p.y - 40); g.lineTo(p.x - 10 + hr * 14, p.y - 52 - Math.sin(W.doneT * 5 + hr) * 3); g.stroke(); }
      } else if (p.swing) {
        var s = p.swing, rot = -s.th, hx2 = p.x, hy2 = p.y - HO, pull = clamp((1 - s.Lf) / (1 - TUCK), 0, 1);
        var raise = 0.1 + 0.32 * pull + 0.05 * Math.sin(t * 9), st = { aL: raise, aR: raise, tail: 1.6 + 0.8 * Math.abs(s.w), ph: t * 7, wave: 1 + 0.5 * Math.abs(s.w), wp: t * 6, tw: clamp(-s.w * 0.05, -0.22, 0.22), sy: 1 + 0.06 * pull };
        g.strokeStyle = '#d8d2e8'; g.lineWidth = 1;
        [-1, 1].forEach(function (sd) { var hp = toWorld(handLocal(sd, raise, st), hx2, hy2, rot, p.face); g.beginPath(); g.moveTo(s.ring.px + sd * GDX, s.ring.py); g.lineTo(hp[0], hp[1]); g.stroke(); g.beginPath(); g.arc(hp[0], hp[1] + 2, 3.5, 0, 7); g.stroke(); });
        drawFish(hx2, hy2, rot, p.face, st);
        if (s.perf) { g.strokeStyle = 'rgba(255,230,120,' + (0.6 + 0.4 * Math.sin(t * 24)) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(hx2, hy2 + 6, 22, 0, 7); g.stroke(); }
      } else {
        var rot2 = 0, bob = 0, st2 = { leg: 0.12, ph: t * 3, aL: 0.12, aR: 0.12, wave: 0.5, wp: t * 3 };
        if (p.on && Math.abs(p.vx) > 20) { var wk = Math.sin(t * 16); rot2 = wk * 0.06; bob = -Math.abs(wk) * 2; st2 = { leg: 0.6, ph: t * 16, tw: 0.1 * wk, aL: 0.45 * wk, aR: -0.45 * wk, wave: 1.8, wp: t * 16, sy: 1 + 0.03 * Math.cos(t * 32) }; }   // 走路：兩片尾鰭交替踏步、身體扭、雙手前後甩
        else if (!p.on) { rot2 = clamp(p.vy / 900, -0.3, 0.35) * p.face; st2 = { leg: 0.5, ph: t * 12, aL: 0.5, aR: 0.5, wave: 1.5, wp: t * 10, sy: 1 + clamp(-p.vy / 330, -1, 1) * 0.09, tw: clamp(-p.vx * 0.0006, -0.1, 0.1) }; }   // 空中：上升拉長、下落壓扁   // 空中：雙手舉起、尾巴快擺
        if (p.on && p.landT > 0) st2.sy = 1 - 0.14 * p.landT / 0.16;                 // 落地壓扁一下
        if (p.spinT > 0) rot2 = (1 - p.spinT / 0.5) * Math.PI * 2 * p.face;
        if (W.slide) { rot2 = (p.sl || 0) * 0.9; st2 = { leg: 0.2, ph: t * 8, aL: 0.9, aR: 0.9, wave: 1.2, wp: t * 12, tw: -0.12 }; }
        if (p.stun > 0) rot2 = Math.sin(t * 30) * 0.15;
        // 轉動中以身體中心為軸
        g.save(); g.translate(p.x, p.y); g.rotate(rot2); g.translate(-p.x, -p.y); drawFish(p.x, p.y - HO + bob, 0, p.face, st2); g.restore();
      }
    }
    W.fx.forEach(function (f) { g.fillStyle = (f.gold ? 'rgba(255,225,110,' : 'rgba(200,235,255,') + (1 - f.t / f.life) + ')'; g.fillRect(f.x, f.y, 2, 2); });
    W.pops.forEach(function (o) { txt(o.txt, o.x, o.y - o.t * 22, 11, o.col); });
    g.restore();
    // HUD
    g.fillStyle = 'rgba(58,44,32,.82)'; g.fillRect(0, 0, WF, 22);
    g.fillStyle = '#cdbfa8'; g.fillRect(8, 8, WF - 130, 6); g.fillStyle = '#f4b942'; g.fillRect(8, 8, (WF - 130) * clamp(p.x / LV.goalX, 0, 1), 6);
    g.fillStyle = MUS.on ? 'rgba(244,194,74,.9)' : 'rgba(120,110,100,.9)'; g.fillRect(MBTN.x(), MBTN.y, 22, 14); txt(MUS.on ? '♪' : '✕', MBTN.x() + 11, MBTN.y + 7, 11, '#3a2c20');
    var hsp = W.maxHp > 3 ? 12 : 14; for (var hi = 0; hi < W.maxHp; hi++) { var hx = 8 + hi * hsp; g.fillStyle = hi < W.hp ? '#ee4455' : '#5a4a44'; g.fillRect(hx + 1, 26, 3, 3); g.fillRect(hx + 6, 26, 3, 3); g.fillRect(hx, 27, 10, 3); g.fillRect(hx + 1, 30, 8, 2); g.fillRect(hx + 3, 32, 4, 2); g.fillRect(hx + 4, 34, 2, 1); if (hi < W.hp) { g.fillStyle = '#ff9aa5'; g.fillRect(hx + 2, 27, 1, 1); } }
    txt('命 ×' + (W.lives === Infinity ? '∞' : W.lives), 8, 44, 10, W.lives <= 1 && Math.floor(W.t * 4) % 2 ? '#ff6a6a' : '#fff', 'left');
    txt('特技 ' + (W.score + W.fl.pts) + '　擊退 ' + W.kills, WF - 8, 11, 10, '#fff', 'right');
    var near = !p.on && !p.swing && ringNear(p, 60), al = p.swing ? '放開＝放手' : (p.on ? '點＝跳' : (near ? '按住＝抓環' : '點＝空翻'));
    if (!W.done) { g.fillStyle = (inp.a ? 'rgba(244,194,74,.9)' : 'rgba(58,44,32,.6)'); g.fillRect(0, H - 40, WF, 40);
    txt(al, WF / 2, H - 20, 16, '#fff'); }
    if (W.hold && !W.done) txt('點一下繼續往前', WF / 2, 70, 11, '#ffe38a');
    if (W.banner) { var bt = W.banner.t, ba = bt < 0.3 ? bt / 0.3 : bt > 2 ? (2.4 - bt) / 0.4 : 1; g.globalAlpha = Math.max(0, ba); g.fillStyle = 'rgba(30,20,40,.62)'; g.fillRect(0, 96, WF, 36); txt(W.banner.txt, WF / 2, 114, 18, '#ffe38a'); g.globalAlpha = 1; }
    if (p.swing && p.swing.ring.kind === 'break' && p.swing.t > 1) txt('快放手！環要斷了', WF / 2, 70, 11, '#ff9a8a'); else if (p.swing && p.swing.perf) txt('現在放手＝完美！', WF / 2, 70, 11, '#ffe38a');
    else if (p.swing) txt('◀▶ 偏向一邊　放開按鈕放手', WF / 2, 70, 9, '#fff');
    else if (!W.started) {
      txt(LOCK ? '點一下開始（' + DF().name + '）' : '選難度，再點空白處開始', WF / 2, 86, 11, '#fff');
      if (!LOCK) ['easy', 'normal', 'hard'].forEach(function (k, bi) { var d = DFS[k], by = DBTN.y0 + bi * DBTN.dy, on = k === diffKey; g.fillStyle = on ? '#f4c24a' : 'rgba(58,44,32,.78)'; g.fillRect(DBTN.x(), by, DBTN.w, DBTN.h); g.fillStyle = on ? '#7a5532' : 'rgba(255,255,255,.25)'; g.fillRect(DBTN.x(), by + DBTN.h - 3, DBTN.w, 3); txt(d.name + '　' + d.hp + ' 愛心', WF / 2, by + 12, 12, '#fff'); });
      txt('點＝跳　空中靠近吊環按住＝抓', WF / 2, DBTN.y0 + 3 * DBTN.dy + 8, 9, '#fff');
      if (DEV) TBTN.forEach(function (b) { g.fillStyle = '#3aa86a'; g.fillRect(b.x(), b.y, TB_W, TB_H); g.fillStyle = '#1f6a40'; g.fillRect(b.x(), b.y + TB_H - 3, TB_W, 3); txt(b.t, b.x() + TB_W / 2, b.y + 11, 11, '#fff'); });
      txt(diffKey === 'easy' ? '落水不扣愛心・平台自動存檔' : diffKey === 'normal' ? '落水扣 1 顆・平台自動存檔' : '落水扣 1 顆・過三個吊環會存檔', WF / 2, DBTN.y0 + 3 * DBTN.dy + 24, 9, '#ffe38a');
    }
    else if (W.t < 10 && !W.done) txt('自動往前跑　點螢幕跳、靠近吊環按住抓', WF / 2, 70, 10, '#fff');
    if (W.done && W.gbonus && W.doneT <= 3.2) txt(W.doneT < 1.2 ? '抓到大吊環！+' + W.gbonus : '曬太陽中……', WF / 2, 86, 14, '#ffe38a');
    if (W.done && W.doneT > (W.failed ? 1.6 : 3.2)) {
      g.fillStyle = 'rgba(0,0,0,.6)'; var PY = H - 162; if (W.gbonus) PY = Math.min(PY, Math.max(60, Math.round(LV.plats[5].y - cam.y + 14)));   // 勝利：結算字放在紅磚牆上（平台頂面下方）
      g.fillRect(0, PY, WF, 158); txt(W.failed ? '午仔魚曬不成魚乾了…（' + DF().name + '）' : '午仔魚變成深色一夜干！（' + DF().name + '）', WF / 2, PY + 14, 14, W.failed ? '#ff9a8a' : '#f4dd7a');
      txt('特技分 ' + W.score + '　完美放手 ' + W.perfects + '　空翻 ' + W.flips, WF / 2, PY + 35, 9, '#fff'); txt('擊退 ' + W.kills + '　落水 ' + W.falls + '　昏倒 ' + W.faints, WF / 2, PY + 52, 9, '#fff');
      txt(NOTE || ((typeof o !== 'undefined' && o && o.onEnd) ? '' : '點空白處再玩（或按 R）' + (W.titles.length ? '　稱號：' + W.titles.join('、') : '')), WF / 2, PY + 69, 9, NOTE || W.titles.length ? '#ffd24a' : '#cdbfa8');
      var bw = Math.min(WF - 24, 300), bx = (WF - bw) / 2, by = PY + 88, bh = 62, pu = Math.floor(W.doneT * 2.5) % 2; SHOPBAND = { x: bx, y: by, w: bw, h: bh };       // 黃色橫幅＝去賣場買周邊（成功／失敗都有）
      g.fillStyle = '#2a1c10'; g.fillRect(bx, by, bw, bh); g.fillStyle = pu ? '#ffe27a' : '#ffd95a'; g.fillRect(bx + 1, by + 1, bw - 2, bh - 2); g.fillStyle = '#ffeb9a'; g.fillRect(bx + 1, by + 1, bw - 2, 2); g.fillStyle = '#e0a92a'; g.fillRect(bx + 1, by + bh - 4, bw - 2, 3);
      if (W.failed) { txt('想要更多午仔魚嗎', WF / 2, by + 18, 12, '#fff'); txt('來選購午仔魚周邊吧～', WF / 2, by + 43, 10, '#fff'); } else { txt('午仔魚吊環高手！', WF / 2, by + 18, 12, '#fff'); txt('來選購午仔魚周邊吧～', WF / 2, by + 43, 10, '#fff'); }
    } else SHOPBAND = null;
    if (p.dead > 0) { g.fillStyle = 'rgba(30,60,80,' + Math.min(0.5, p.dead) + ')'; g.fillRect(0, 0, WF, H); }
  }

  /* ---------- 輸入 ---------- */
  var ptrs = {};
  var NOTE = '';     // 地圖版結算後由主程式寫入「零用錢 +N」
  var SHOPBAND = null, SHOP_URLS = ['https://www.sunnu.co/products/%E9%AB%94%E6%93%8D%E5%8D%88%E4%BB%94%E9%AD%9A%E8%80%81%E5%B8%BD-1', 'https://www.sunnu.co/products/%E5%8D%88%E4%BB%94%E5%88%BA%E7%B9%A1%E7%9F%ADt'];
  function openShop() { var u = SHOP_URLS[Math.floor(Math.random() * SHOP_URLS.length)]; try { if (typeof o !== 'undefined' && o && o.shopUrl) u = typeof o.shopUrl === 'function' ? o.shopUrl() : o.shopUrl; } catch (_) { } if (!/^https?:\/\//i.test(u || '')) return; sfx('perfect'); try { window.open(u, '_blank', 'noopener'); } catch (_) { } }
  function recalc() { var s = { l: 0, r: 0, a: 0 }; for (var id in ptrs) if (ptrs[id]) s[ptrs[id]] = 1; var was = inp.a; for (var k in s) inp[k] = !!(s[k] || keys[k]); if (inp.a && !was) inp.press = true; }
  var keys = { l: 0, r: 0, a: 0 };
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); audioOn();
    var rc = cv.getBoundingClientRect(), qx = (e.clientX - rc.left) / (rc.width / WF), qy = (e.clientY - rc.top) / (rc.height / H);
    if (qx >= MBTN.x() - 4 && qx <= MBTN.x() + 26 && qy >= MBTN.y - 4 && qy <= MBTN.y + 18) { MUS.on = !MUS.on; try { localStorage.setItem('sunnuGymMusic', MUS.on ? '1' : '0'); } catch (_) { } return; }
    if (!W.started && DEV) { for (var ti = 0; ti < TBTN.length; ti++) if (qx >= TBTN[ti].x() && qx <= TBTN[ti].x() + TB_W && qy >= TBTN[ti].y && qy <= TBTN[ti].y + TB_H) { warpTest(TBTN[ti].k); return; } }
    if (!W.started && !LOCK) { var hit = false; ['easy', 'normal', 'hard'].forEach(function (k, bi) { var by = DBTN.y0 + bi * DBTN.dy; if (qx >= DBTN.x() && qx <= DBTN.x() + DBTN.w && qy >= by && qy <= by + DBTN.h) { setDiff(k); W = newWorld(); hit = true; } }); if (hit) return; }
    if (W.done && W.doneT > (W.failed ? 1.6 : 3.2) && SHOPBAND && qx >= SHOPBAND.x && qx <= SHOPBAND.x + SHOPBAND.w && qy >= SHOPBAND.y && qy <= SHOPBAND.y + SHOPBAND.h) { openShop(); return; }
    if (W.done && W.doneT > (W.failed ? 1.8 : 3.4) && !o.onEnd) { W = newWorld(); return; } try { cv.setPointerCapture(e.pointerId); } catch (_) { } ptrs[e.pointerId] = 'a'; recalc(); });
  function pup(e) { delete ptrs[e.pointerId]; recalc(); }
  /* 手指放開卻沒收到 pointerup（iOS 偶爾會漏）→ 按鍵卡住、放不了手：任何「全部手指離開」的事件都把按住狀態清掉 */
  function clearAll() { ptrs = {}; recalc(); }
  addEventListener('pointerup', function (e) { if (ptrs[e.pointerId]) pup(e); }); addEventListener('pointercancel', function (e) { if (ptrs[e.pointerId]) pup(e); });
  addEventListener('touchend', function (e) { if (!e.touches || e.touches.length === 0) clearAll(); }, true); addEventListener('touchcancel', clearAll, true);
  cv.addEventListener('lostpointercapture', function (e) { if (ptrs[e.pointerId]) pup(e); });
  addEventListener('blur', clearAll); document.addEventListener('visibilitychange', function () { if (document.hidden) clearAll(); });
  cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup); cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  var KM = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', Space: 'a', KeyZ: 'a', ArrowUp: 'a', KeyW: 'a', KeyX: 'a', KeyK: 'a', ShiftLeft: 'a', ShiftRight: 'a', ArrowDown: 'a' };
  function kd(e) { audioOn(); var k = KM[e.code]; if (k) { e.preventDefault(); keys[k] = 1; recalc(); } }
  function ku(e) { var k = KM[e.code]; if (k) { keys[k] = 0; recalc(); } }
  addEventListener('keydown', kd); addEventListener('keyup', ku);

  var last = performance.now();
  function loop(now) {
    if (dead) return; var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!false) { var n = Math.max(1, Math.ceil(dt / (1 / 120))); for (var i = 0; i < n; i++) step(W, inp, dt / n); }
    updCam(dt); draw();
    if (W.done && W.doneT > (W.failed ? 6 : 4.2) && !reported && o.onEnd) { reported = true; o.onEnd({ win: !W.failed, challenge: !W.failed && W.faints === 0 && W.falls === 0, score: W.score, flips: W.flips, perfects: W.perfects, kills: W.kills, falls: W.falls, faints: W.faints, sum: summary() }); }
    raf = requestAnimationFrame(loop);
  }
  function destroy() { dead = true; cancelAnimationFrame(raf); clearInterval(tmr); removeEventListener('keydown', kd); removeEventListener('keyup', ku); try { if (AC) AC.close(); } catch (e) { } AC = null; if (cv.parentNode) cv.parentNode.removeChild(cv); }
  function freeze() { if (dead) return; try { draw(); } catch (e) { } cancelAnimationFrame(raf); clearInterval(tmr); try { if (AC) AC.close(); } catch (e) { } AC = null; }   /* 只停住、保留結算畫面（商品橫幅仍可點），不拆畫布 */
  last = performance.now(); raf = requestAnimationFrame(loop);
  return { destroy: destroy, freeze: freeze, setNote: function (s) { NOTE = s || ''; try { relayout(); draw(); } catch (e) { } }, canvas: cv, get W() { return W; }, step: function (dt) { step(W, inp, dt); }, draw: draw, LV: LV, inp: inp, cam: cam };
  }
  return { create: create };
})();

(window.__SG=window.__SG||{}).gym={GymGame:GymGame};
})();
