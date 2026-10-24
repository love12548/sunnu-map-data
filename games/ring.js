(function(){var DofuGame=window.__SG.dofu.DofuGame;var DofuAudio=window.__SG.dofu.DofuAudio;
/* ---- ring_assets.js ---- */
var RingAssets = {"fish": {"w": 74, "h": 83, "pal": {"k": "#8f86b3", "g": "#c9c9cc", "w": "#ffffff", "y": "#f4dd7a", "Y": "#fbf3bd"}, "d": ".110k4.69k7.66k3g2k4.64k3g3k2wk2.62k3g4k2wk3.61k2g5k2w2k2.60k2g6k3wk3.58k3y4g3k2w2k2.58k2gyk2yg3k2w2k2.57k2g2y3g5kw2k3.56k2g10w4k2.55k2g10w5k2.55k2g10w5k2.54k2g9kgw5k2.54k2g4k6w2k2w2k2.54k2g4k6wk3w3k2.52k2g7k2w2k5w2k2.52k2g3kg4wk4wk6.52k2g2k10w3k5.51k2g4k7w8k2.51k2g7w12k2.15g.35k2g3kg3w12k2.14g2.21g.11k4g2k2g3w12k5.11g2.21g.6k9g2k2g3w12k10.5g3.21g.2k9yk2g3k2g3w12k2y3k9.g2.22gk5y7k2g9w11k2y8k6g.20k2gky11k2g3k2g4w11k2y13g2k2.16k3.gy12k2g3k2g4w11k2y13g2k3.14k3y.gky11k2g3k2g4w11k2y12k2gy2k2.13k4.k15g3k2g5w10k16g2k4.11k4.4k13g10w10k14.2g2.k3.12k.17k2g10w10k3.14g.3k.30k2g3k2g5w10k2.50k2g3k2g5w10k2.50k2g3k2g5w10k2.50k2g3k3g5w9k2.50k2g4kg6w9k2.50k2g4k2g5w9k2.50k2g4k2g5w9k2.50k2g4k2g5w9k2.50k2g4k2g5w9k2.50k2g4k2g5w8k2.51k3g10w8k2.52k2g4kg5w8k2.52k2g4k2g4w8k2.51gk2g4k2g4w7k3.51gk3g3k3g3w7k2.52g2k2g4kg4w7k2y.51g2k2g10w6k2y2.50g2k2g4k2g4w6k2y3.49g3k2g3k2g4w5k2y4.50g2k2g3k3g3w5k2y2.53gk3g3k2g4w4k2y.54g2k2g9w4k2y.55gk3g8w4k2.56g2k2g3k2g4w3k2.57gk3g2k2g4w3k2.57g2k3gk2g5w2k2.58g2k2g8w2k2.61k2g8wk2.62k2g8k7.57k3g8k8.57k3g6k2w3k5.56k4g5kwy4.k4.55k5g2k2w4y3.k3.56k7w5.y3k4.55k2wywywy5.2yg2k3.54k2wywyw5y3g4k3.53k3ywyw3kw.kg6k3.53k2y2wywk14.53k2y2wyw2k13.54k2ywy2wk2.65k2y2wywk2.66k2y3wk2.66k3yg2k2.67k2g4k2.67k2g3k2.68k2g2k2.69k2gk2.70k5.70k4.72k2.21"}};

/* ---- ring_sim.js ---- */
/* 古厝呷飯・吊環五仔魚乾：規則與物理（純邏輯，沒有畫面；可用 node 機器人調難度）。
   一場＝體操套路三段，每段都在把五仔魚「曬乾」（曬乾度 0–100）：
     ① 擺盪：吊環左右晃，按住左／右壓住擺幅，魚穩在中間才曬得到太陽（最多 60）。海風陣陣、海鷗來叼魚（點牠趕走）、雲遮住太陽。
     ② 十字支撐：按住＝出力、放開＝休息，把「力量條」維持在會移動的綠區裡（最多 25）。出力過頭會滑掉。
     ③ 大迴旋：三拍節奏，跟著拍子點（最多 10）；最後落地：準星掃過目標，點中最好（最多 5）。
   曬乾度達標＝成功。用法：var s = RingSim.create({diff:'normal'}); 每格 s.step(dt)；s.setPush(-1|0|1)、s.setHold(bool)、s.tap()、s.shoo()；讀 s.s（狀態）、取走 s.s.ev（事件）。 */
var RingSim = (function () {
  var DIFF = {
    easy:   { d1: 16, d2: 9,  bpm: 84,  push: 8.5, wind: 0.5, gust: 2.2, zone: 0.42, zw: 0.19, thr: 44, gl: 0.24, pf: 0.09,  per: 1.4, tz: 0.36, steal: 5,  gulls: [7],        tk: 1 },
    normal: { d1: 18, d2: 10, bpm: 96,  push: 8.0, wind: 0.8, gust: 2.8, zone: 0.33, zw: 0.15, thr: 50, gl: 0.19, pf: 0.07,  per: 1.1, tz: 0.26, steal: 8,  gulls: [5.5, 12.5], tk: 1 },
    hard:   { d1: 20, d2: 11, bpm: 108, push: 7.0, wind: 1.2, gust: 3.6, zone: 0.25, zw: 0.12, thr: 73, gl: 0.15, pf: 0.055, per: 0.9, tz: 0.18, steal: 11, gulls: [5, 11, 16],  tk: 1 }
  };

  var READY = 2.4, CROSS_IN = 1.2, SPIN_IN = 1.8, GULL_T = 2.6, TIMEOUT = 4.5;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function create(o) {
    var df = DIFF[(o && o.diff) || 'normal'] || DIFF.normal;
    var s = {
      phase: 'ready', t: 0, pt: 0, df: df, ev: [], result: null,
      th: 0.32, om: 0, push: 0, wind: 0, gust: null, nextGust: 2.2, gusts: 0,
      dry: 0, stabSum: 0, stabN: 0, crossIn: 0, crossT: 0, steals: 0, shoos: 0, slips: 0, gull: null, gullI: 0, cloud: { at: rnd(5, 8), t: -1 },
      hold: false, x: 0.35, zc: 0.55, stun: 0, spinT: 0, beats: [], bi: 0, hits: [], bpmT: 0, land: null, ang: 0, sunCover: 1, q: 0
    };
    function ev(t, extra) { var e = extra || {}; e.t = t; s.ev.push(e); }
    function addDry(v, cap) { s.dry = clamp(s.dry + v, 0, 100); }
    function startSwing() { s.phase = 'swing'; s.pt = 0; ev('swing'); }
    function startCross() { s.phase = 'cross'; s.pt = 0; s.crossIn = CROSS_IN; s.x = 0.35; s.hold = false; s.dryBase = s.dry; ev('cross'); }
    function startSpin() {
      s.phase = 'spin'; s.pt = 0; s.bi = 0; s.beats = []; s.hits = []; var bt = 60 / df.bpm;
      for (var i = 0; i < 3; i++) s.beats.push({ at: SPIN_IN + i * bt * 1.0 * 1.5, done: false, q: '' });
      ev('spin');
    }
    function startLand() { s.phase = 'land'; s.pt = 0; s.land = { pos: 0, dir: 1, done: false, q: '', tz: df.tz, c: 0.5 + rnd(-0.18, 0.18), timeout: false }; ev('land'); }
    function finish() {
      s.phase = 'done'; s.pt = 0;
      var d = s.dry, win = d >= df.thr, mist = s.steals + s.slips;
      var stars = !win ? 0 : (d >= 88 && mist <= 1) ? 3 : d >= Math.min(84, df.thr + 14) ? 2 : 1;
      var perf = 0, goodB = 0; s.hits.forEach(function (h) { if (h === 'perfect') perf++; else if (h === 'good') goodB++; });
      var stab = s.stabN ? s.stabSum / s.stabN : 0;
      s.result = {
        win: win, stars: stars, score: Math.round(d * 10 + stab * 200 + perf * 50 + (s.land && s.land.q === 'perfect' ? 100 : 0)), dry: Math.round(d), thr: df.thr, steals: s.steals, slips: s.slips, shoos: s.shoos,
        challenge: win && s.steals === 0 && s.slips === 0, judge: { stab: Math.round(stab * 100) / 10, cross: Math.round((s.crossGood || 0) * 100) / 10, beat: Math.round((perf + goodB * 0.6) / 3 * 100) / 10, land: s.land ? (s.land.q === 'perfect' ? 10 : s.land.q === 'good' ? 6 : 2) : 0 }
      };
      ev(win ? 'win' : 'lose');
    }
    function stepSwing(dt) {
      s.pt += dt;
      /* 風：慢慢變化的底風＋偶爾一陣突襲（先有預告） */
      s.wind = df.wind * (Math.sin(s.pt * 0.7 + 0.8) * 0.7 + Math.sin(s.pt * 1.9) * 0.3);
      var gw = 0;
      if (!s.gust && s.pt >= s.nextGust && s.pt < df.d1 - 1.6) { s.gust = { dir: Math.random() < 0.5 ? -1 : 1, t: 0 }; ev('gustWarn', { dir: s.gust.dir }); }
      if (s.gust) { s.gust.t += dt; if (s.gust.t > 0.9 && s.gust.t < 1.8) gw = s.gust.dir * df.gust; if (s.gust.t >= 1.8) { s.gust = null; s.nextGust = s.pt + rnd(2.6, 4.2); s.gusts++; } }
      var acc = -9 * Math.sin(s.th) - 0.35 * s.om + s.wind + gw + s.push * df.push;
      s.om += acc * dt; s.th += s.om * dt; s.th = clamp(s.th, -1.15, 1.15);
      /* 雲遮太陽 */
      if (s.cloud.t < 0 && s.pt >= s.cloud.at) { s.cloud.t = 0; ev('cloud'); }
      if (s.cloud.t >= 0) { s.cloud.t += dt; if (s.cloud.t > 3.4) { s.cloud.t = -2; s.cloud.at = 1e9; } }
      s.sunCover = s.cloud.t >= 0 && s.cloud.t < 3.4 ? 0.35 : 1;
      /* 曬乾：穩在區間內才有；區間外只剩一點點 */
      var u = Math.abs(s.th) / df.zone, q = u < 1 ? 1 - 0.55 * u : 0.12; s.q = q;
      s.stabSum += q * dt; s.stabN += dt;
      addDry(60 / df.d1 * q * s.sunCover * dt);
      /* 海鷗 */
      if (!s.gull && s.gullI < df.gulls.length && s.pt >= df.gulls[s.gullI]) { s.gull = { t: 0, side: Math.random() < 0.5 ? -1 : 1, state: 'in' }; s.gullI++; ev('gull'); }
      if (s.gull) {
        s.gull.t += dt;
        if (s.gull.state === 'in' && s.gull.t >= GULL_T) { s.gull.state = 'dive'; ev('gullDive'); }
        if (s.gull.state === 'dive' && s.gull.t >= GULL_T + 0.45) { s.steals++; addDry(-df.steal); ev('steal'); s.gull.state = 'out'; s.gull.t = 0; }
        if (s.gull.state === 'out' && s.gull.t > 1.4) s.gull = null;
      }
      if (s.pt >= df.d1) { s.dry1 = s.dry; startCross(); }
    }
    function stepCross(dt) {
      s.pt += dt;
      s.om *= Math.pow(0.02, dt); s.th += s.om * dt; s.th *= Math.pow(0.04, dt); s.push = 0;   // 吊環慢慢靜止
      if (s.crossIn > 0) { s.crossIn -= dt; return; }
      s.crossT += dt;
      var t = s.crossT; s.zc = 0.52 + 0.14 * Math.sin(t * 0.9 + 0.5) + 0.05 * Math.sin(t * 2.3);
      if (s.stun > 0) { s.stun -= dt; s.x = Math.max(0.2, s.x - 0.5 * dt); }
      else s.x = clamp(s.x + ((s.hold ? 0.5 : -0.42) + 0.18 * Math.sin(t * 2.7 + 1)) * dt, 0, 1.02);
      var inZ = Math.abs(s.x - s.zc) <= df.zw, below = s.x < s.zc - df.zw;
      s.zoneIn = inZ;
      if (s.stun <= 0) { addDry(25 / df.d2 * (inZ ? 1 : below ? 0.22 : 0) * dt); s.crossGood = ((s.crossGood || 0) * (t - dt) + (inZ ? 1 : below ? 0.2 : 0) * dt) / Math.max(0.0001, t); }
      if (s.x >= 1 && s.stun <= 0) { s.slips++; s.stun = 0.9; addDry(-4); ev('slip'); }
      if (t >= df.d2) startSpin();
    }
    function stepSpin(dt) {
      s.pt += dt; s.th *= Math.pow(0.05, dt);
      var gl = df.gl, bt = 60 / df.bpm, i;
      for (i = 0; i < s.beats.length; i++) { var b = s.beats[i]; if (!b.done && s.pt > b.at + gl) { b.done = true; b.q = 'miss'; s.hits.push('miss'); ev('beat', { i: i, q: 'miss' }); } }
      if (s.beats.every(function (b) { return b.done; }) && s.pt > s.beats[2].at + 0.9) startLand();
    }
    function stepLand(dt) {
      s.pt += dt; var L = s.land;
      if (L.done) { if (s.pt > L.doneAt + 1.0) finish(); return; }
      L.pos += L.dir * dt / df.per * 2; if (L.pos >= 1) { L.pos = 1; L.dir = -1; } if (L.pos <= 0) { L.pos = 0; L.dir = 1; }
      if (s.pt > TIMEOUT) { L.done = true; L.q = 'miss'; L.doneAt = s.pt; L.timeout = true; ev('landing', { q: 'miss' }); }
    }
    return {
      s: s, diff: df,
      step: function (dt) {
        s.t += dt;
        if (s.phase === 'ready') { s.pt += dt; s.th = 0.32 * Math.cos(s.t * 3) * Math.exp(-s.t * 0.1); if (s.pt >= READY) { s.th = 0.32; s.om = 0; startSwing(); } }
        else if (s.phase === 'swing') stepSwing(dt);
        else if (s.phase === 'cross') stepCross(dt);
        else if (s.phase === 'spin') stepSpin(dt);
        else if (s.phase === 'land') stepLand(dt);
        else if (s.phase === 'done') s.pt += dt;
      },
      setPush: function (u) { s.push = s.phase === 'swing' ? clamp(u, -1, 1) : 0; },
      setHold: function (h) { s.hold = !!h; },
      shoo: function () { var G = s.gull; if (G && G.state !== 'out' && s.phase === 'swing') { G.state = 'out'; G.t = 0; s.shoos++; addDry(1.5); ev('shoo'); return true; } return false; },
      tap: function () {
        if (s.phase === 'spin') {
          var gl = df.gl, best = -1, bd = 9, i;
          for (i = 0; i < s.beats.length; i++) { var b = s.beats[i]; if (b.done) continue; var d = Math.abs(s.pt - b.at); if (d < bd) { bd = d; best = i; } }
          if (best < 0 || bd > gl + 0.12) { ev('stray'); return null; }
          var b2 = s.beats[best]; b2.done = true; var q = bd <= df.pf ? 'perfect' : bd <= gl ? 'good' : 'miss'; b2.q = q; s.hits.push(q);
          addDry(q === 'perfect' ? 3.33 : q === 'good' ? 2.1 : 0); s.ang += q === 'miss' ? 0.5 : 1; ev('beat', { i: best, q: q }); return q;
        }
        if (s.phase === 'land' && !s.land.done) {
          var L = s.land, d2 = Math.abs(L.pos - L.c), q2 = d2 <= L.tz * 0.22 ? 'perfect' : d2 <= L.tz * 0.5 ? 'good' : 'miss';
          L.done = true; L.q = q2; L.doneAt = s.pt; addDry(q2 === 'perfect' ? 5 : q2 === 'good' ? 3 : 0); ev('landing', { q: q2 }); return q2;
        }
        return null;
      }
    };
  }
  return { create: create, DIFF: DIFF };
})();

/* ---- ring_game.js ---- */
/* 古厝呷飯・吊環五仔魚乾：遊戲主體（畫面、操作、特效）。
   依賴：RingSim（規則）、RingAssets（魚像素圖，ring_fish_art.py 依使用者給的插畫產生）、DofuAudio（音樂音效，共用豆花的合成器）。
   用法：var g = RingGame.create({ host, diff:'normal', sound:()=>true, onEnd(res){...} }); g.destroy() 結束。
   玩法：吊環五仔魚乾——擺盪壓住左右、十字支撐把力量條維持在綠區、三拍大迴旋、落地；每一段都在曬乾魚。 */
var RingGame = (function () {
  var FONT = 'Cubic11, "PingFang TC", sans-serif', INK = '#3b2a1e';
  var DG = { '0': '01110,10001,10001,10001,10001,10001,01110', '1': '00100,01100,00100,00100,00100,00100,01110', '2': '01110,10001,00001,00010,00100,01000,11111', '3': '11110,00001,00001,01110,00001,00001,11110', '4': '00010,00110,01010,10010,11111,00010,00010', '5': '11111,10000,11110,00001,00001,10001,01110', '6': '00110,01000,10000,11110,10001,10001,01110', '7': '11111,00001,00010,00100,01000,01000,01000', '8': '01110,10001,10001,01110,10001,10001,01110', '9': '01110,10001,10001,01111,00001,00010,01100' };
  function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var dec = function (s) { return s.replace(/(\D)(\d+)/g, function (m, c, n) { return c.repeat(+n); }); };
  function fromRle(d, w, h, pal) { var f = dec(d), c = cvs(w, h), q = c.getContext('2d'); for (var i = 0; i < w * h; i++) { var ch = f[i]; if (ch !== '.' && pal[ch]) { q.fillStyle = pal[ch]; q.fillRect(i % w, (i / w) | 0, 1, 1); } } return c; }
  function fromRows(rows, pal) { var h = rows.length, w = rows[0].length, c = cvs(w, h), q = c.getContext('2d'); for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) { var ch = rows[j][i]; if (ch !== '.' && pal[ch]) { q.fillStyle = pal[ch]; q.fillRect(i, j, 1, 1); } } return c; }
  function mix(a, b, t) { var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), r = [16, 8, 0].map(function (s) { return Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); }); return '#' + ((1 << 24) | (r[0] << 16) | (r[1] << 8) | r[2]).toString(16).slice(1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var STAR = ['....k....', '...kYk...', '...kYk...', 'kkkkYkkkk', 'kYYYYYYYk', '.kYYYYYk.', '..kYYYk..', '.kYYkYYk.', '.kYk.kYk.', '.kk...kk.'];
  var GULL = [
    ['k.............k', 'wk...........kw', 'wwk....k....kww', '.wwkkkkWkkkkww.', '..kwwwWWWwwwk..', '....kWWWWWk....', '.....kWWWk.....'],
    ['...............', '.kk.........kk.', 'wwwkk..k..kkwww', '.wwwwkkWkkwwww.', '..kwwwWWWwwwk..', '....kWWWWWk....', '.....kWWWk.....'],
    ['...............', '...............', 'kk...kkkkk...kk', 'wwkkkWWWWWkkkww', '.kwwwWWWWWwwwk.', '....kWWWWWk....', '.....kWWWk.....']];
  var GPAL = { k: '#6a7078', w: '#cfd6dc', W: '#fbfcfd' };
  /* 魚乾色階：新鮮銀白 → 曬成金褐色 */
  var DRY_TO = { g: '#b98a4a', w: '#f1d08c', y: '#d9a640', Y: '#e8c070', k: '#7d6590' };
  var imgs = null;
  function images() {
    if (imgs) return imgs; var I = {}, F = RingAssets.fish; I.fish = [];
    for (var L = 0; L <= 5; L++) { var pal = {}; for (var k in F.pal) pal[k] = mix(F.pal[k], DRY_TO[k] || F.pal[k], L / 5); I.fish.push(fromRle(F.d, F.w, F.h, pal)); }
    I.star = fromRows(STAR, { k: INK, Y: '#ffd95a' }); I.starE = fromRows(STAR, { k: '#6b5a4a', Y: '#4a3e34' });
    I.gull = GULL.map(function (r) { return fromRows(r, GPAL); });
    imgs = I; return I;
  }
  /* 魚在吊環上的握環點（魚鰭尖，單位＝像素圖座標） */
  var FW = 74, FH = 83, GRIP_X = 37, GRIP_Y = 29, GRIP_DX = 29.5;

  function create(o) {
    var host = o.host, diffKey = o.diff || 'normal', I = images();
    var cw = host.clientWidth || 360, ch = host.clientHeight || 640;
    var scale = 2;
    if (cw >= 560) { var fit = Math.min(6, ch / 312, cw / 176); scale = fit >= 3 ? Math.floor(fit) : Math.max(1, Math.floor(fit * 4) / 4); }
    while (scale > 2 && Math.floor(ch / scale) < 312) scale--;
    if (cw < 560) while (scale > 1 && Math.floor(ch / scale) < 312) scale = 1;
    var WF = Math.max(176, Math.ceil(cw / scale)), W = cw < 560 ? WF : Math.min(WF, 230), OX = Math.floor((WF - W) / 2), H = Math.max(312, Math.floor(ch / scale));
    var cv = cvs(WF, H); cv.style.cssText = 'position:absolute;top:0;left:0;width:' + (WF * scale) + 'px;height:' + (H * scale) + 'px;image-rendering:pixelated;touch-action:none;user-select:none;-webkit-user-select:none;';
    host.appendChild(cv); var g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    var au = DofuAudio.create({ enabled: o.sound });
    var sim = RingSim.create({ diff: diffKey }), S = sim.s, DF = sim.diff;

    /* ——— 版面 ——— */
    var HUD_H = 52, BTN_H = 46, BTN_Y = H - 70, GY = BTN_Y - 52, AY = HUD_H + 14, CX = Math.round(W / 2);
    var L = clamp(GY - 14 - (FH - GRIP_Y) - AY, 50, 120), RC = L + 24;   // 繩長；魚身中心離轉軸的距離
    var st = {
      t: 0, shake: 0, flash: 0, flashCol: '#fff', pops: [], parts: [], banners: [], ended: false, endT: 0, reveal: false, revT: 0, reported: false, paused: false,
      push: 0, keyL: false, keyR: false, ptrHold: false, ptrPush: 0, keyHold: false, musT: 0, musStep: 0, lastPh: '', best: 0, newBest: false,
      angV: 0, dropT: -1, drop: null, dripT: 0, wob: 0, cloudX: [0.15, 0.6, 0.9], beatPing: -1, warnT: 0, gustDir: 0, gustT: 0, lastBeat: -1, sparkles: []
    };
    try { st.best = +localStorage.getItem('sunnuRingBest_' + diffKey) || 0; } catch (e) {}
    var raf = 0, last = 0, dead = false;

    /* ——— 文字 ——— */
    function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    function smallTxt(s, x, y, col, align, shadow) {
      var parts = String(s).match(/\d+(?:\.\d+)?|[^\d]+/g) || [], ws = [], tot = 0; g.font = '11px ' + FONT;
      parts.forEach(function (t) { var w = /^\d/.test(t) ? t.split('').reduce(function (a, c) { return a + (c === '.' ? 3 : 6); }, 0) : g.measureText(t).width; ws.push(w); tot += w; });
      var cx = Math.round(Math.round(x) - (align === 'left' ? 0 : align === 'right' ? tot : tot / 2));
      function pass(dx, dy, c) {
        var px = cx + dx; g.fillStyle = c; g.textAlign = 'left'; g.textBaseline = 'middle';
        parts.forEach(function (t, k) {
          if (/^\d/.test(t)) { var q = px; t.split('').forEach(function (chh) { if (chh === '.') { g.fillRect(q, Math.round(y) + dy + 3, 1, 1); q += 3; return; } var rows = DG[chh].split(','); for (var j = 0; j < 7; j++) { var oy = j + (j > 2) + (j > 4), hh = (j === 2 || j === 4) ? 2 : 1; for (var i = 0; i < 5; i++) if (rows[j][i] === '1') g.fillRect(q + i, Math.round(y) + dy - 4 + oy, 1, hh); } q += 6; }); }
          else g.fillText(t, px, Math.round(y) + dy);
          px += ws[k];
        });
      }
      if (shadow !== false) pass(1, 1, INK); pass(0, 0, col || '#fff6dc');
    }
    function txt(s, x, y, size, col, align, shadow) {
      size = Math.max(1, Math.round(size / 11)) * 11; s = String(s);
      if (size <= 11 && /\d/.test(s)) { smallTxt(s, x, y, col, align, shadow); return; }
      g.font = size + 'px ' + FONT; g.textAlign = align || 'center'; g.textBaseline = 'middle';
      if (shadow !== false) { g.fillStyle = INK; g.fillText(s, x + 1, y + 1); } g.fillStyle = col || '#fff6dc'; g.fillText(s, x, y);
    }
    function ellFill(cx, cy, rx, ry, col) { g.fillStyle = col; for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }
    function pline(x0, y0, x1, y1, c, w) { g.fillStyle = c; var n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (var i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - (w || 2) / 2), Math.round(y0 + (y1 - y0) * i / n), w || 2, 1); }
    function pcirc(cx, cy, r, col, th) { g.fillStyle = col; th = th || 1; for (var a = 0; a < 360; a += 360 / Math.max(24, Math.round(r * 5))) { var rad = a * Math.PI / 180; g.fillRect(Math.round(cx + Math.cos(rad) * r), Math.round(cy + Math.sin(rad) * r), th, th); } }
    function pop(text, x, y, col, big) { st.pops.push({ text: text, x: x, y: y, age: 0, col: col || '#fff6dc', big: !!big }); }
    function banner(text, col, ttl) { st.banners.push({ text: text, col: col || '#ffd95a', age: 0, ttl: ttl || 1.8 }); }
    function burst(x, y, n, cols, sp, grav) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = (0.4 + Math.random()) * (sp || 40); st.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (sp || 40) * 0.5, g: grav == null ? 120 : grav, age: 0, life: 0.5 + Math.random() * 0.6, c: cols[i % cols.length], s: Math.random() < 0.3 ? 2 : 1 }); } }
    function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) {} }
    function col(fn) { g.save(); g.translate(OX, 0); try { fn(); } finally { g.restore(); } }
    function wide(fn) { var w0 = W; W = WF; try { fn(); } finally { W = w0; } }

    /* ——— 操作 ——— */
    function rel(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * WF - OX, y: (e.clientY - r.top) / r.height * H }; }
    function resume() { st.paused = false; last = performance.now(); au.ambient(true); }
    function gullXY() {
      var G = S.gull; if (!G) return null;
      var tx = CX + Math.sin(S.th) * L, ty = AY + Math.cos(S.th) * L + 12, sx = CX + G.side * (W / 2 + 30), sy = AY + 10;
      if (G.state === 'in') { var u = clamp(G.t / 2.6, 0, 1), e = u * u * (3 - 2 * u); return { x: lerp(sx, tx + G.side * 34, e) + Math.sin(G.t * 5) * 4, y: lerp(sy, ty - 32, e) + Math.sin(G.t * 3) * 5 }; }
      if (G.state === 'dive') { var v = clamp((G.t - 2.6) / 0.45, 0, 1); return { x: lerp(tx + G.side * 34, tx, v), y: lerp(ty - 32, ty, v) }; }
      var o2 = G.t; return { x: tx + G.side * (20 + o2 * 90), y: ty - 10 - o2 * 70 };
    }
    function pressAction(p) {
      if (S.phase === 'swing') return;
      if (S.phase === 'cross') { st.ptrHold = true; return; }
      if (S.phase === 'spin' || S.phase === 'land') { var q = sim.tap(); if (q === null && S.phase === 'spin') au.sfx('tap'); }
    }
    function down(e) {
      if (dead) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} var p = rel(e); au.ensure();
      if (st.ended) { if (!st.reveal && st.endT > 0.3) { st.reveal = true; st.revT = 0; } else if (st.reveal && st.revT > 1.2 && !st.reported) st.revT = 99; return; }
      if (st.paused) { resume(); return; }
      if (S.phase === 'swing') {
        var gp = gullXY(); if (gp && Math.hypot(p.x - gp.x, p.y - gp.y) < 26 && sim.shoo()) return;
        st.ptrPush = p.x < CX ? -1 : 1; return;
      }
      pressAction(p);
    }
    function up() { st.ptrHold = false; st.ptrPush = 0; }
    function kd(e) {
      if (dead) return; var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); st.keyL = true; if (S.phase !== 'swing' && !e.repeat) pressAction(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); st.keyR = true; if (S.phase !== 'swing' && !e.repeat) pressAction(); }
      else if (k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); if (!e.repeat) { if (S.phase === 'cross') st.keyHold = true; else if (S.phase === 'swing') { au.ensure(); } else pressAction(); } }
      else if (k === 'p' || k === 'P' || k === 'Escape') { if (!st.ended) { st.paused = !st.paused; if (!st.paused) resume(); else au.ambient(false); } }
    }
    function ku(e) { var k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') st.keyL = false; else if (k === 'ArrowRight' || k === 'd' || k === 'D') st.keyR = false; else if (k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'ArrowDown') st.keyHold = false; }
    function vis() { if (document.hidden && !st.ended && st.t > 0.5) { st.paused = true; au.ambient(false); } else last = performance.now(); }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); document.addEventListener('visibilitychange', vis);

    /* ——— 事件（音效與特效） ——— */
    var PHASE_TIP = { swing: '① 擺盪：壓住左右，別讓魚晃出去！', cross: '② 十字支撐：按住出力，放開休息！', spin: '③ 大迴旋：跟著拍子點！', land: '落地！準星到綠區就點！' };
    function fishPos() { var a = S.th; return { x: CX + Math.sin(a) * L, y: AY + Math.cos(a) * L + 24 }; }
    function handle(ev) {
      var fp = fishPos();
      switch (ev.t) {
        case 'swing': banner(PHASE_TIP.swing, '#fff6dc', 3.2); au.sfx('go'); break;
        case 'cross': banner(PHASE_TIP.cross, '#fff6dc', 3.0); au.sfx('heal'); break;
        case 'spin': banner(PHASE_TIP.spin, '#fff6dc', 2.6); au.sfx('heal'); break;
        case 'land': banner(PHASE_TIP.land, '#ffe9a0', 2.4); au.sfx('go'); break;
        case 'gustWarn': st.warnT = 1.0; st.gustDir = ev.dir; au.sfx('warn'); break;
        case 'cloud': banner('太陽被雲遮住了…', '#d8e6ef', 2.4); break;
        case 'gull': au.sfx('gull'); banner('海鷗來了！點牠趕走！', '#ffe9a0', 2.0); break;
        case 'gullDive': au.sfx('gull'); break;
        case 'steal': au.sfx('steal'); pop('魚被叼一口！', fp.x, fp.y - 20, '#ec6a5c', false); st.shake = 0.4; st.flash = 0.2; st.flashCol = '#ec6a5c'; burst(fp.x, fp.y, 14, ['#c9c9cc', '#ffffff'], 40); buzz(60); break;
        case 'shoo': au.sfx('shoo'); pop('趕走了！', fp.x, fp.y - 26, '#9be28a', false); break;
        case 'slip': au.sfx('freeze'); pop('手滑了！', fp.x, fp.y - 20, '#ec6a5c', true); st.shake = 0.5; buzz(80); break;
        case 'stray': au.sfx('tap'); break;
        case 'beat': {
          var qn = ev.q; st.lastBeat = ev.i;
          if (qn === 'perfect') { au.sfx('perfect', ev.i); pop('完美！', CX, BTN_Y - 52, '#ffd95a', true); burst(CX, BTN_Y - 30, 16, ['#ffd95a', '#fff6dc'], 60); buzz(20); }
          else if (qn === 'good') { au.sfx('good'); pop('不錯', CX, BTN_Y - 52, '#fff6dc', false); }
          else { au.sfx('weak'); pop('漏拍…', CX, BTN_Y - 52, '#ec9a8a', false); }
          break;
        }
        case 'landing': {
          var q2 = ev.q; st.dropT = 0; st.drop = { q: q2, x0: CX + Math.sin(S.th) * L };
          if (q2 === 'perfect') { au.sfx('clear'); pop('完美落地！', CX, GY - 40, '#ffd95a', true); burst(CX, GY - 6, 28, ['#ffd95a', '#fff6dc', '#ffffff'], 80, 80); buzz(30); }
          else if (q2 === 'good') { au.sfx('good'); pop('穩穩落地', CX, GY - 40, '#fff6dc', false); burst(CX, GY - 4, 10, ['#fff6dc'], 40); }
          else { au.sfx('burp'); pop('踉蹌落地…', CX, GY - 40, '#ec9a8a', false); burst(CX, GY - 2, 12, ['#d9c9a0', '#b9a070'], 30); }
          break;
        }
        case 'win': au.sfx('win'); st.ended = true; st.endT = 0; au.ambient(true); burst(CX, GY - 30, 60, ['#ffd95a', '#ffffff', '#f4dd7a', '#ffb35c'], 90, 60); break;
        case 'lose': au.sfx('lose'); st.ended = true; st.endT = 0; st.shake = 0.4; break;
      }
    }
    function finishWin(r) { try { var b = +localStorage.getItem('sunnuRingBest_' + diffKey) || 0; if (r.score > b) { st.newBest = b > 0; localStorage.setItem('sunnuRingBest_' + diffKey, String(r.score)); st.best = r.score; } else st.best = b; } catch (e) {} }

    /* ——— 更新 ——— */
    function update(dt) {
      st.t += dt;
      var push = (st.keyL ? -1 : 0) + (st.keyR ? 1 : 0) + st.ptrPush; sim.setPush(clamp(push, -1, 1)); sim.setHold(st.ptrHold || st.keyHold);
      sim.step(dt);
      var evs = S.ev; S.ev = []; evs.forEach(function (e) { handle(e); if (e.t === 'win' || e.t === 'lose') finishWin(S.result || {}); });
      /* 音樂：遊戲內一個 16 分音符叫一次 */
      if (!st.ended) { var bpm = S.phase === 'spin' || S.phase === 'land' ? DF.bpm : 92, sd = 60 / bpm / 4; st.musT += dt; while (st.musT >= sd) { st.musT -= sd; au.step(st.musStep++, bpm, S.phase === 'ready' ? 0.1 : S.phase === 'swing' ? 0.35 : S.phase === 'cross' ? 0.2 : 0.7); } }
      /* 拍子提示音：每個目標拍子到時叫一次 */
      if (S.phase === 'spin') S.beats.forEach(function (b, i) { if (!b._ping && S.pt >= b.at) { b._ping = true; au.sfx('count', i === 0 ? 0 : 1); } });
      ['shake', 'flash', 'warnT'].forEach(function (k) { st[k] = Math.max(0, st[k] - dt * (k === 'shake' ? 1.6 : k === 'warnT' ? 1 : 1.6)); });
      st.angV += (S.ang - st.angV) * Math.min(1, dt * 7);
      if (st.dropT >= 0) st.dropT += dt;
      /* 水滴：魚還濕的時候一直滴 */
      if (!st.ended && S.dry < 70 && (S.phase === 'swing' || S.phase === 'cross' || S.phase === 'ready')) { st.dripT -= dt; if (st.dripT <= 0) { st.dripT = 0.18 + S.dry / 100 * 0.9 + Math.random() * 0.2; var fp = fishPos(); st.parts.push({ x: fp.x + (Math.random() - 0.5) * 20, y: fp.y + 22, vx: 0, vy: 10, g: 140, age: 0, life: 1.2, c: '#9fd8ef', s: 1, floor: GY }); } }
      st.cloudX = st.cloudX.map(function (x, i) { return (x + dt * (0.006 + i * 0.0035)) % 1.3; });
      st.banners.forEach(function (b) { b.age += dt; }); st.banners = st.banners.filter(function (b) { return b.age < b.ttl; });
      st.pops.forEach(function (p) { p.age += dt; }); st.pops = st.pops.filter(function (p) { return p.age < 1.1; });
      st.parts.forEach(function (q) { q.age += dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.floor && q.y > q.floor) q.age = 99; }); st.parts = st.parts.filter(function (q) { return q.age < q.life; });
      if (st.ended) { st.endT += dt; if (!st.reveal && st.endT > 0.8) { st.reveal = true; st.revT = 0; } if (st.reveal) st.revT += dt; if (!st.reported && st.reveal && st.revT > 6.0) { st.reported = true; if (o.onEnd) { try { o.onEnd(S.result); } catch (e) { if (window.console) console.error(e); } } } }
    }

    /* ——— 畫面：背景（鋪滿整個畫面寬） ——— */
    function prog() { return clamp((S.phase === 'ready' ? 0 : S.phase === 'swing' ? S.pt / DF.d1 * 0.5 : S.phase === 'cross' ? 0.5 + S.crossT / DF.d2 * 0.3 : S.phase === 'spin' ? 0.82 : 0.92) + (S.phase === 'done' ? 0.08 : 0), 0, 1); }
    function drawBackdrop(T) {
      var p = prog(), hz = GY - 46;
      var top = p < 0.5 ? mix('#9fd8ef', '#5fb8ea', p * 2) : mix('#5fb8ea', '#f2b46e', (p - 0.5) * 2), bot = p < 0.5 ? mix('#fbeec2', '#d6f1fb', p * 2) : mix('#d6f1fb', '#fbdca0', (p - 0.5) * 2);
      for (var y = 0; y < hz; y += 2) R(0, y, W, 2, mix(top, bot, Math.pow(y / hz, 1.2)));
      var sx = lerp(W * 0.18, W * 0.82, p), sy = hz - 20 - Math.sin(p * Math.PI) * 78, cover = S.phase === 'swing' && S.sunCover < 1;
      ellFill(sx, sy, 15, 15, mix('#fff7c2', '#ffd27a', p)); ellFill(sx, sy, 11, 11, '#fffbe0');
      if (!cover) for (var i = 0; i < 8; i++) { var a = i * 0.785 + T * 0.2; R(sx + Math.cos(a) * 21, sy + Math.sin(a) * 21, 2, 2, 'rgba(255,247,194,.8)'); }
      for (i = 0; i < 3; i++) { var cx2 = st.cloudX[i] * (W + 80) - 40, cy = HUD_H + 8 + i * 15; ellFill(cx2, cy, 18 + i * 3, 6, '#ffffff'); ellFill(cx2 + 8, cy - 3, 11, 5, '#ffffff'); }
      if (cover) { var cc = clamp(S.cloud.t / 0.6, 0, 1); ellFill(sx - 4, sy, 30 * cc, 10, '#cfd9df'); ellFill(sx + 8, sy - 4, 20 * cc, 8, '#e1eaef'); ellFill(sx - 16, sy + 3, 16 * cc, 7, '#bfccd4'); }
      /* 魚塭：一格一格的水面＋水車 */
      R(0, hz, W, 46, '#5ea6c0'); for (i = 0; i < W; i += 46) { R(i, hz, 2, 46, '#c9a56a'); }
      for (i = 0; i < 6; i++) { var yy = hz + 5 + i * 7, off = (T * (4 + i) + i * 31) % (W + 30); R(off - 20, yy, 16, 1, '#a8d6e6'); R((off + W / 2) % (W + 30) - 20, yy + 2, 10, 1, '#8cc6dc'); }
      R(0, hz, W, 1, '#2f6a82');
      for (i = 0; i < 2; i++) { var wx = 24 + i * (W - 80), wy = hz + 24; R(wx, wy, 14, 2, '#7a5a3a'); var ph = T * 5 + i; for (var k = 0; k < 4; k++) { var aa = ph + k * 1.57; R(wx + 7 + Math.cos(aa) * 7, wy + 1 + Math.sin(aa) * 3, 2, 2, '#e8f4f8'); } }
      /* 古厝：紅磚牆＋燕尾屋脊（在左邊遠處） */
      var hx = 6, hy = hz - 34;
      R(hx, hy + 12, 58, 34, '#b4513f'); for (var by = 0; by < 34; by += 4) { R(hx, hy + 12 + by, 58, 1, '#8c3a2c'); for (var bx = (by / 4 % 2) * 4; bx < 58; bx += 8) R(hx + bx, hy + 12 + by, 1, 4, '#8c3a2c'); }
      R(hx - 4, hy + 6, 66, 7, '#5a3a32'); R(hx - 2, hy + 4, 62, 3, '#6e4a40'); for (i = 0; i < 62; i += 3) R(hx - 2 + i, hy + 6, 1, 6, '#493028');
      R(hx - 6, hy + 2, 6, 3, '#5a3a32'); R(hx - 8, hy, 4, 3, '#5a3a32'); R(hx + 58, hy + 2, 6, 3, '#5a3a32'); R(hx + 62, hy, 4, 3, '#5a3a32');
      R(hx + 24, hy + 26, 10, 20, '#3d2a22'); R(hx + 25, hy + 27, 8, 18, '#6b4a34'); R(hx + 8, hy + 22, 8, 8, '#f6e2a8'); R(hx + 9, hy + 23, 6, 6, '#ffd95a'); R(hx + 42, hy + 22, 8, 8, '#f6e2a8'); R(hx + 43, hy + 23, 6, 6, '#ffd95a');
      /* 曬魚架：竹竿掛一排小魚乾（右邊） */
      var rx = W - 74, ry = hz - 12; R(rx, ry - 2, 3, 22, '#8c6a3e'); R(rx + 56, ry - 2, 3, 22, '#8c6a3e'); R(rx - 2, ry, 63, 2, '#a98250');
      for (i = 0; i < 7; i++) { var fx = rx + 4 + i * 8, sw = Math.sin(T * 1.6 + i) * 1; R(fx, ry + 2, 1, 3, '#7a5a3a'); R(fx - 1 + sw, ry + 5, 4, 8, i % 2 ? '#e3c58a' : '#d6b476'); R(fx + sw, ry + 13, 2, 3, '#b8955a'); }
      /* 沙地曬場 */
      for (y = hz + 46; y < H; y += 2) R(0, y, W, 2, mix('#e9d3a0', '#c9a56a', clamp((y - hz - 46) / Math.max(1, H - hz - 46), 0, 1)));
      R(0, hz + 46, W, 2, '#8c6a3e'); R(0, hz + 47, W, 1, INK);
      for (i = 0; i < 26; i++) { var px = (i * 47 + 13) % W, py = hz + 52 + (i * 31) % Math.max(1, H - hz - 56); R(px, py, 2, 1, '#b48d55'); if (i % 3 === 0) R(px + 3, py + 2, 1, 1, '#f6e6bd'); }
    }
    function drawGround() {
      var mw = 150, mx = CX - mw / 2;   // 體操墊
      R(mx - 1, GY - 1, mw + 2, 14, INK); R(mx, GY, mw, 12, '#3f86c8'); R(mx, GY, mw, 3, '#6cb0e8'); R(mx, GY + 9, mw, 3, '#2d6aa8'); for (var i = mx + 12; i < mx + mw; i += 18) R(i, GY + 3, 1, 6, '#2d6aa8');
      /* 擺盪時的「曬太陽區」：墊子上的綠色區間＋魚現在的位置 */
      if (S.phase === 'swing' || S.phase === 'ready') {
        var zx0 = CX + Math.sin(-DF.zone) * L, zx1 = CX + Math.sin(DF.zone) * L;
        g.globalAlpha = 0.5 + 0.2 * Math.sin(st.t * 4); R(zx0, GY + 1, zx1 - zx0, 10, '#9be28a'); g.globalAlpha = 1; R(zx0, GY, 1, 12, '#3f8a3a'); R(zx1, GY, 1, 12, '#3f8a3a');
        var fx = CX + Math.sin(S.th) * L; R(fx - 1, GY - 2, 3, 14, Math.abs(S.th) < DF.zone ? '#ffffff' : '#ec6a5c');
      }
    }
    /* ——— 畫面：魚＆吊環 ——— */
    function drawFish(x, y, dry) {
      var d = clamp(dry / 100, 0, 1) * 5, lo = Math.floor(d), t = d - lo; g.drawImage(I.fish[lo], Math.round(x), Math.round(y));
      if (t > 0.02 && lo < 5) { g.globalAlpha = t; g.drawImage(I.fish[lo + 1], Math.round(x), Math.round(y)); g.globalAlpha = 1; }
    }
    function drawRig(T) {
      var th = S.th, landed = st.dropT >= 0, fishOnRig = !landed, px = CX + Math.sin(th) * L, py = AY + Math.cos(th) * L;
      /* 吊環繩（上端固定在橫桿上，下端跟著魚擺盪）＋環 */
      [-1, 1].forEach(function (sd) {
        var ax = CX + sd * GRIP_DX, bx = px + sd * GRIP_DX;
        pline(ax, AY, bx, py - 10, '#8f86b3', 2);
        for (var a = 0; a < 360; a += 12) { var rad = a * Math.PI / 180; g.fillStyle = '#c9c9cc'; g.fillRect(Math.round(bx + Math.cos(rad) * 5.5), Math.round(py - 4 + Math.sin(rad) * 8), 2, 2); }
      });
      if (fishOnRig) {
        var rot = S.phase === 'spin' || S.phase === 'land' ? st.angV / 3 * Math.PI * 2 : -th * 0.3, tr = 0;
        if (S.phase === 'cross') { var near = S.x > S.zc + DF.zw; tr = (near ? 1.4 : S.stun > 0 ? 2 : 0.25) * (Math.sin(T * 40) > 0 ? 1 : -1); }
        g.save(); g.translate(Math.round(px + tr), Math.round(py)); g.rotate(rot); drawFish(-GRIP_X, -GRIP_Y, S.dry); g.restore();
      }
      /* 橫桿（吊環架）＋兩根立柱 */
      var bx0 = CX - 58, bx1 = CX + 58;
      R(bx0 - 5, AY - 6, 6, GY - AY + 18, '#8c6a3e'); R(bx0 - 4, AY - 6, 2, GY - AY + 18, '#b88a52'); R(bx1 - 1, AY - 6, 6, GY - AY + 18, '#8c6a3e'); R(bx1 + 3, AY - 6, 2, GY - AY + 18, '#6e4f2c');
      R(bx0 - 7, AY - 8, bx1 - bx0 + 14, 6, INK); R(bx0 - 6, AY - 7, bx1 - bx0 + 12, 4, '#a98250'); R(bx0 - 6, AY - 7, bx1 - bx0 + 12, 1, '#d3a870');
      R(bx0 - 8, GY + 11, 10, 3, INK); R(bx1 - 2, GY + 11, 10, 3, INK);
      if (landed && S.phase !== 'done') {}
      /* 落地的魚 */
      if (landed) {
        var u = clamp(st.dropT / 0.45, 0, 1), fy0 = AY + L - GRIP_Y, fy1 = GY - (FH - 6), yy = lerp(fy0, fy1, u * u), q = st.drop.q, bounce = u >= 1 ? Math.abs(Math.sin((st.dropT - 0.45) * 9)) * Math.max(0, 8 - (st.dropT - 0.45) * 14) : 0;
        var tilt = q === 'miss' && u >= 1 ? Math.sin((st.dropT - 0.45) * 12) * Math.max(0, 0.35 - (st.dropT - 0.45) * 0.5) : 0;
        g.save(); g.translate(Math.round(lerp(st.drop.x0, CX, u)), Math.round(yy - bounce + FH / 2)); g.rotate(tilt); drawFish(-GRIP_X, -FH / 2, S.dry); g.restore();
        if (S.phase === 'done' && S.result && S.result.win && Math.floor(T * 3) % 2) { R(CX - 26, GY - 70, 2, 2, '#fff'); R(CX + 28, GY - 52, 2, 2, '#fff'); R(CX + 14, GY - 80, 2, 2, '#ffd95a'); }
      }
    }
    function drawGull(T) {
      var G = S.gull; if (!G) return; var p = gullXY(); if (!p) return; var f = G.state === 'dive' ? 2 : Math.floor(T * 6) % 3, im = I.gull[f === 2 && G.state !== 'dive' ? 1 : f];
      g.save(); g.translate(Math.round(p.x), Math.round(p.y)); if (G.state === 'out') g.rotate(-0.3 * G.side); g.drawImage(im, -15, -7, 30, 14); g.restore();
      if (G.state === 'in' && Math.floor(T * 4) % 2) txt('點牠！', p.x, p.y - 14, 11, '#ffe9a0');
    }
    /* ——— 畫面：HUD、操作區、結算 ——— */
    function drawHud() {
      R(-OX, 0, WF, HUD_H, 'rgba(36,26,18,.78)'); R(-OX, HUD_H, WF, 1, INK); R(-OX, HUD_H - 1, WF, 1, 'rgba(255,246,220,.2)');
      var idx = { ready: -1, swing: 0, cross: 1, spin: 2, land: 2, done: 3 }[S.phase], names = ['擺盪', '十字撐', '迴旋'];
      for (var i = 0; i < 3; i++) { var done = i < idx, cur = i === idx, x = 8 + i * 52; R(x, 4, 48, 13, INK); R(x + 1, 5, 46, 11, done ? '#ffd95a' : cur ? '#fff6dc' : '#5a4b3f'); txt(names[i], x + 24, 11, 11, done || cur ? INK : '#a89a88', 'center', false); }
      /* 曬乾度 */
      var d = clamp(S.dry / 100, 0, 1), bx = 8, bw = W - 16 - 32, thr = DF.thr / 100;
      R(bx, 19, 30, 14, INK); R(bx + 1, 20, 28, 12, '#d9a640'); R(bx + 1, 20, 28, 2, 'rgba(255,255,255,.3)'); txt('曬乾', bx + 15, 26, 11, '#fff', 'center', true);
      R(bx + 32, 19, bw, 14, INK); R(bx + 33, 20, bw - 2, 12, '#cdbfa8'); R(bx + 33, 20, Math.round((bw - 2) * d), 12, d >= thr ? '#ffc93a' : '#e8b84a'); R(bx + 33, 20, Math.round((bw - 2) * d), 3, 'rgba(255,255,255,.45)');
      R(bx + 33 + Math.round((bw - 2) * thr) - 1, 17, 2, 18, '#ffffff'); txt('目標', bx + 33 + Math.round((bw - 2) * thr), 41, 11, '#ffe9a0', 'center', true);
      smallTxt(Math.round(S.dry) + '%', W - 10, 11, '#fff6dc', 'right');
      /* 階段時間條 */
      var tf = S.phase === 'swing' ? 1 - S.pt / DF.d1 : S.phase === 'cross' ? 1 - S.crossT / DF.d2 : S.phase === 'ready' ? 1 : 0;
      if (S.phase === 'swing' || S.phase === 'cross') { R(bx, 47, W - 16, 3, INK); R(bx + 1, 48, Math.round((W - 18) * clamp(tf, 0, 1)), 1, '#78bfe8'); }
    }
    function bigBtn(x, y, w, h, label, sub, on, colr) {
      var pr = on ? 3 : 0; R(x, y + 4, w, h, INK); R(x, y + pr, w, h, INK); R(x + 1, y + pr + 1, w - 2, h - 2, colr[on ? 1 : 0]); R(x + 1, y + pr + 1, w - 2, 3, colr[2]); R(x + 1, y + pr + h - 5, w - 2, 4, colr[3]);
      txt(label, x + w / 2, y + pr + h / 2 - (sub ? 5 : 0), 22, INK, 'center', false); if (sub) txt(sub, x + w / 2, y + pr + h - 12, 11, '#6b4a1e', 'center', false);
    }
    function drawControls(T) {
      var Y = BTN_Y, hw = (W - 24) / 2, Y_ = ['#ffd95a', '#ffe9a0', '#ffeb9a', '#e0a92a'], B_ = ['#bfe6f5', '#e8f7fd', '#e8f7fd', '#8fc2d8'];
      if (S.phase === 'swing' || S.phase === 'ready') {
        var pl = (st.keyL || st.ptrPush < 0), pr = (st.keyR || st.ptrPush > 0);
        bigBtn(8, Y, hw, BTN_H, '◀', '往左壓', pl, B_); bigBtn(16 + hw, Y, hw, BTN_H, '▶', '往右壓', pr, B_);
      } else if (S.phase === 'cross') bigBtn(8, Y, W - 16, BTN_H, '撐住！', '按住出力・放開休息', st.ptrHold || st.keyHold, Y_);
      else if (S.phase === 'spin') bigBtn(8, Y, W - 16, BTN_H, '點！', '跟著拍子', false, Y_);
      else if (S.phase === 'land') bigBtn(8, Y, W - 16, BTN_H, '落地！', '準星在綠區時點', false, Y_);
    }
    function drawMeters(T) {
      /* 十字支撐：右邊的力量條 */
      if (S.phase === 'cross' && S.crossIn <= 0) {
        var mx = W - 26, my = HUD_H + 22, mh = GY - my - 4;
        R(mx - 1, my - 1, 14, mh + 2, INK); R(mx, my, 12, mh, '#4a3e34');
        var zy0 = my + mh * (1 - (S.zc + DF.zw)), zy1 = my + mh * (1 - (S.zc - DF.zw)); R(mx, zy0, 12, zy1 - zy0, '#86cf62'); R(mx, zy0, 12, 2, '#b6ef9a');
        var cy = my + mh * (1 - clamp(S.x, 0, 1)), danger = S.x > S.zc + DF.zw; R(mx - 3, cy - 1, 18, 3, danger ? (Math.floor(T * 10) % 2 ? '#ff5a4a' : '#fff') : '#ffffff'); R(mx - 3, cy + 2, 18, 1, INK);
        txt('力', mx + 6, my - 9, 11, '#fff6dc'); if (danger) txt('快滑了！', mx - 6, cy - 12, 11, '#ff9a8a', 'right');
      }
      /* 大迴旋：三顆拍子圈，縮小到內圈時點 */
      if (S.phase === 'spin') {
        var cy2 = BTN_Y - 24;
        S.beats.forEach(function (b, i) {
          var x = CX + (i - 1) * 56, dtm = b.at - S.pt, state = b.done ? b.q : '';
          pcirc(x, cy2, 9, 'rgba(255,246,220,.9)', 2);
          if (state) { ellFill(x, cy2, 8, 8, state === 'perfect' ? '#ffd95a' : state === 'good' ? '#9be28a' : '#ec6a5c'); }
          else if (dtm > -0.3 && dtm < 1.5) { var rr = 9 + clamp(dtm, 0, 1.5) * 20; g.globalAlpha = clamp(1.3 - dtm * 0.6, 0.25, 1); pcirc(x, cy2, rr, '#ffd95a', 2); g.globalAlpha = 1; }
          txt(String(i + 1), x, cy2 + 1, 11, state ? INK : '#fff6dc', 'center', !state);
        });
      }
      /* 落地：準星掃過目標 */
      if (S.phase === 'land') {
        var Lm = S.land, bw = 180, bx = CX - bw / 2, by = BTN_Y - 22;
        R(bx - 1, by - 5, bw + 2, 11, INK); R(bx, by - 4, bw, 9, '#4a3e34');
        var tz = Lm.tz * bw; R(bx + Lm.c * bw - tz / 2, by - 4, tz, 9, '#86cf62'); R(bx + Lm.c * bw - tz * 0.11, by - 4, tz * 0.22, 9, '#ffd95a');
        var px = bx + Lm.pos * bw; R(px - 1, by - 8, 3, 17, '#ffffff'); R(px - 2, by - 9, 5, 2, INK); R(px - 2, by + 8, 5, 2, INK);
      }
    }
    function drawWind(T) {
      if (S.phase !== 'swing' && S.phase !== 'ready') return;
      var w = S.wind + (S.gust && S.gust.t > 0.9 && S.gust.t < 1.8 ? S.gust.dir * DF.gust : 0), a = clamp(Math.abs(w) / 2.2, 0, 1), dir = w > 0 ? 1 : -1;
      if (a > 0.12) for (var i = 0; i < 6; i++) { var yy = HUD_H + 14 + i * 22 + (i % 2) * 8, xx = ((T * 70 * dir * (0.6 + a) + i * 61) % (W + 40) + (W + 40)) % (W + 40) - 20; g.globalAlpha = 0.25 + a * 0.45; R(xx, yy, 6 + a * 14, 1, '#ffffff'); g.globalAlpha = 1; }
      if (st.warnT > 0) { if (Math.floor(T * 8) % 2) { txt(st.gustDir > 0 ? '風來了  ▶▶' : '◀◀  風來了', CX, HUD_H + 28, 22, '#ffe9a0'); } }
    }
    function drawParts() { st.parts.forEach(function (q) { g.globalAlpha = clamp(1 - q.age / q.life, 0, 1); g.fillStyle = q.c; g.fillRect(Math.round(q.x), Math.round(q.y), q.s || 1, q.s || 1); g.globalAlpha = 1; }); }
    function drawPops() { st.pops.forEach(function (p) { var u = p.age / 1.1, y = p.y - u * 22; g.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; txt(p.text, p.x, y, p.big ? 22 : 11, p.col); g.globalAlpha = 1; }); }
    function drawBanners() { st.banners.forEach(function (b, i) { var u = b.age / b.ttl, a = u < 0.12 ? u / 0.12 : u > 0.8 ? (1 - u) / 0.2 : 1, y = HUD_H + 16 + i * 20; g.globalAlpha = clamp(a, 0, 1); var w = String(b.text).length * 11 + 16; R(W / 2 - w / 2 - 1, y - 9, w + 2, 20, INK); R(W / 2 - w / 2, y - 8, w, 18, 'rgba(36,26,18,.82)'); txt(b.text, W / 2, y, 11, b.col, 'center', false); g.globalAlpha = 1; }); }
    function drawReady() {
      if (S.phase !== 'ready') return; var n = Math.ceil(2.4 - S.pt);
      txt('吊環五仔魚乾', W / 2, HUD_H + 54, 22, '#fff6dc');
      var w = 176; R(W / 2 - w / 2, HUD_H + 70, w, 54, 'rgba(36,26,18,.72)'); txt('擺盪→十字撐→大迴旋→落地', W / 2, HUD_H + 80, 11, '#ffe9a0', 'center', false); txt('每一段都在把魚曬乾！', W / 2, HUD_H + 96, 11, '#fff6dc', 'center', false); txt('曬乾度達到目標就成功', W / 2, HUD_H + 112, 11, '#fff6dc', 'center', false);
      if (n >= 1) txt(String(n), W / 2, HUD_H + 150, 33, '#ffd95a');
    }
    function drawEnd() {
      if (!st.ended || !st.reveal) return; var r = S.result; if (!r) return; var win = !!r.win, u = clamp(st.revT / 0.5, 0, 1), px = 14, pw = W - 28, py = HUD_H + 8, ph = win ? 206 : 178, pad = 12;
      g.fillStyle = win ? 'rgba(255,230,150,' + 0.18 * u + ')' : 'rgba(36,26,18,' + 0.5 * u + ')'; g.fillRect(-OX, HUD_H + 1, WF, H - HUD_H - 1);
      g.globalAlpha = clamp(st.revT / 0.4, 0, 1);
      R(px - 1, py - 1, pw + 2, ph + 2, INK); R(px, py, pw, ph, '#fff6dc'); R(px + 2, py + 2, pw - 4, ph - 4, '#3a2a1e'); R(px + 3, py + 3, pw - 6, ph - 6, '#4a3626');
      txt(win ? '魚乾曬好了！' : '還沒曬乾……', W / 2, py + 17, 22, win ? '#ffd95a' : '#ec9a8a');
      var ry;
      if (win) { for (var i = 0; i < 3; i++) { var on = i < r.stars; g.drawImage(on ? I.star : I.starE, Math.round(W / 2 - 33 + i * 24), py + 32 + (on ? Math.round(Math.sin(st.revT * 5 + i) * 1.5) : 0), 18, 20); } ry = py + 66; }
      else { txt('曬乾度 ' + r.dry + '%　目標 ' + r.thr + '%', W / 2, py + 40, 11, '#fff6dc'); ry = py + 60; }
      g.font = '11px ' + FONT;
      [['曬乾度', r.dry + '%', '#ffd95a'], ['穩定', r.judge.stab.toFixed(1), '#ffffff'], ['力量', r.judge.cross.toFixed(1), '#ffffff'], ['節奏', r.judge.beat.toFixed(1), '#ffffff'], ['落地', r.judge.land.toFixed(1), '#ffffff'], ['被海鷗叼', r.steals, r.steals ? '#ec6a5c' : '#9be28a'], ['手滑', r.slips, r.slips ? '#ec6a5c' : '#9be28a']].forEach(function (a2, k) {
        var y = ry + k * 15, lw = a2[0].length * 11, vs = String(a2[1]), vw = vs.split('').reduce(function (s2, c2) { return s2 + (c2 === '.' ? 3 : 6); }, 0), x0 = px + pad, x1 = px + pw - pad;
        txt(a2[0], x0, y, 11, '#ffe9a0', 'left'); smallTxt(a2[1], x1, y, a2[2], 'right');
        for (var dx = x0 + lw + 5; dx < x1 - vw - 5; dx += 3) R(dx, y + 4, 1, 1, 'rgba(255,233,160,.38)');
      });
      if (st.best) txt(st.newBest ? '新紀錄！' : '最佳 ' + st.best, W / 2, py + ph - 11, 11, st.newBest ? '#ffd95a' : '#c8b89a');
      g.globalAlpha = 1;
    }
    function drawPause() { if (!st.paused) return; g.fillStyle = 'rgba(36,26,18,.6)'; g.fillRect(-OX, HUD_H + 1, WF, H - HUD_H - 1); txt('暫停', W / 2, H * 0.4, 33, '#ffd95a'); txt('點一下繼續', W / 2, H * 0.4 + 30, 11, '#fff6dc'); }
    function frameDraw() {
      var T = st.t; g.save(); g.imageSmoothingEnabled = false;
      if (st.shake > 0) g.translate(Math.round((Math.random() - 0.5) * 6 * st.shake), Math.round((Math.random() - 0.5) * 6 * st.shake));
      wide(function () { drawBackdrop(T); });
      col(function () { drawGround(); drawRig(T); drawGull(T); drawWind(T); drawParts(); drawPops(); });
      g.restore();
      col(function () { drawHud(); if (!st.ended) drawControls(T); drawMeters(T); drawBanners(); drawReady(); drawEnd(); drawPause(); });
      if (st.flash > 0) { g.globalAlpha = clamp(st.flash * 2.5, 0, 0.5); g.fillStyle = st.flashCol; g.fillRect(0, 0, WF, H); g.globalAlpha = 1; }
    }
    function loop(now) {
      if (dead) return; raf = requestAnimationFrame(loop);
      var dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0.016)); last = now;
      if (!st.paused) { try { update(dt); } catch (e) { if (window.console) console.error(e); } }
      frameDraw();
    }
    function destroy() { dead = true; cancelAnimationFrame(raf); au.destroy(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); document.removeEventListener('visibilitychange', vis); if (cv.parentNode) cv.parentNode.removeChild(cv); }
    au.ambient(true); last = performance.now(); raf = requestAnimationFrame(loop);
    return {
      destroy: destroy, state: st, sim: sim, canvas: cv, layout: { W: W, WF: WF, OX: OX, H: H, scale: scale, L: L, GY: GY, AY: AY },
      freeze: function () { if (dead) return; try { frameDraw(); } catch (e) {} dead = true; cancelAnimationFrame(raf); au.destroy(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); document.removeEventListener('visibilitychange', vis); },
      step: function (dt) { update(dt); }, draw: frameDraw
    };
  }
  return { create: create };
})();

(window.__SG=window.__SG||{}).ring={RingGame:RingGame};
})();
