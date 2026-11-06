(function(){
/* ---- shop_game.js ---- */
/* 今日公休怪（找營業）新版：主程式 '找營業' 呼叫，build 時打包成 games/shop.js（按需載入）。
   一回合：① 看線索猜哪間店要開（門縫有光、有人排隊、老闆機車…；公休怪會跑去別家放「假線索」，牠經過才冒出來的就是假的）
           ② 開門時鐵門只開一半：連點用鐵門勾往上推，公休怪吊在鐵門上往下拉；牠頭上冒「！」要停手（硬推會夾到手），撐過去牠會閃到腰
           ③ 推到頂老闆丟出最後一份，看準落下時點一下接住（沒接到會被公休怪撿走）。先拿三份贏，被搶三份輸。
   用法：var g = ShopGame.create({ host, diff:'easy|normal|hard', spr:{girlA,girlB,girlW,mon}, foods:[{n,shop,u}×4], sfx(k,a), say(t), hud(txt,frac,round), onEnd(r) });
         每格呼叫 g.step(dt)；g.destroy()。r = { win, challenge, score, bonus, got, lost, perfect, dodge, pinch, wrong } */
var ShopGame = (function () {
  'use strict';
  // A＝線索時間；tap＝每點推多少；pull／alone＝公休怪有人跟牠拉／沒人時往下拉的速度；react＝開門後多久才衝；mT＝跑完最遠距離要幾秒
  // tele＝「！」停手時間（前 grace 秒是反應時間，之後再點才會夾到）；yank＝兩次猛拉間隔；know＝牠最後站到正確店門口的機率（每回合 +.1）；fakes＝假線索數；catchW＝接食物的時間窗
  var DF = {
    easy:   { A: 2.8, tap: .085, pull: .15, alone: .24, react: .6,  mT: 1.7, tele: .85, grace: .4, yank: [1.4, 2.1], know: .1,  trueN: 3, fakes: 1, same: 0, catchW: .45, dz: .8, perf: .08, sag: .02, labels: 1 },
    normal: { A: 2.3, tap: .07,  pull: .24, alone: .34, react: .4,  mT: 1.4, tele: .62, grace: .32, yank: [1.0, 1.7], know: .25, trueN: 3, fakes: 2, same: .5, catchW: .34, dz: .55, perf: .065, sag: .03, labels: 0 },
    hard:   { A: 1.7, tap: .058, pull: .36, alone: .44, react: .26, mT: 1.2, tele: .5, grace: .27, yank: [.8, 1.4],  know: .4,  trueN: 2, fakes: 2, same: .65, catchW: .26, dz: .4, perf: .05, sag: .04, labels: 0 }
  };
  var TYPES = ['light', 'queue', 'scooter', 'shadow', 'cat', 'rattle'];
  var CLUE_TXT = { light: '門縫有光', queue: '有人在排隊', scooter: '老闆的機車', shadow: '裡面有人影', cat: '貓在等開門', rattle: '鐵門在響' };
  var LOOK = [   // 每間店的門面：招牌、招牌字、遮雨棚、牆、樓上牆、老闆圍裙、老闆髮型
    { sign: '#bd5142', ink: '#fff4da', awn: '#e8564a', wall: '#f3dfc0', up: '#e2c4a4', ap: '#356773', hair: 'perm' },
    { sign: '#356773', ink: '#fff4da', awn: '#4fa3b0', wall: '#e7ece5', up: '#bfd2cf', ap: '#bd5142', hair: 'towel' },
    { sign: '#cc944d', ink: '#3b2a1e', awn: '#f5bf43', wall: '#fff0c9', up: '#e8d3a0', ap: '#64875d', hair: 'cap' },
    { sign: '#64875d', ink: '#fff4da', awn: '#8fbf6a', wall: '#f0e2d0', up: '#d2c2ad', ap: '#cc944d', hair: 'bun' }];
  var TOD = [{ k: 'day', sky: ['#7cc4e4', '#b9e3f0'], dark: 0 }, { k: 'dusk', sky: ['#d9775a', '#f3bf86'], dark: .14 }, { k: 'night', sky: ['#18203a', '#2c3960'], dark: .42 }];
  var BL = ['老闆：昨天來就有開啦！', '老闆：今天颱風你不知道嗎', '老闆：我有貼公告啊', '老闆：Google 沒更新不關我事'];
  var REASON = ['去釣魚了', '老闆娘生日', '媽祖遶境', '補貨中', '颱風假', '貓咪罷工', '裝修中'];
  var K = '#3b2a1e';
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function create(o) {
    var D = DF[o.diff] || DF.normal, host = o.host, dpr = Math.max(1, Math.round(window.devicePixelRatio || 1)), dead = false;
    var sfx = function (k, a) { try { if (o.sfx) o.sfx(k, a); } catch (e) {} }, say = function (t) { try { if (o.say) o.say(t); } catch (e) {} };
    var cv = document.createElement('canvas'), tv = document.createElement('canvas'), g = cv.getContext('2d'), tg = tv.getContext('2d');
    cv.style.cssText = 'position:absolute;image-rendering:pixelated;touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:transparent';
    tv.style.cssText = 'position:absolute;pointer-events:none';
    host.appendChild(cv); host.appendChild(tv);
    var img = {}, monBox = { x: 3, y: 3, w: 18, h: 18 };
    function ld(k, u) { var i = new Image(); i.src = u; img[k] = i; return i; }
    ld('ga', o.spr.girlA); ld('gb', o.spr.girlB); ld('gw', o.spr.girlW);
    ld('mon', o.spr.mon).onload = function () {   // 公休怪的實際範圍（畫小腳、吊在鐵門上用）
      try { var c = document.createElement('canvas'); c.width = c.height = 24; var q = c.getContext('2d'); q.drawImage(img.mon, 0, 0); var d = q.getImageData(0, 0, 24, 24).data, x0 = 24, y0 = 24, x1 = -1, y1 = -1;
        for (var j = 0; j < 24; j++) for (var i = 0; i < 24; i++) if (d[(j * 24 + i) * 4 + 3] > 20) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
        if (x1 >= 0) monBox = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; } catch (e) {}
    };
    o.foods.forEach(function (f, i) { ld('f' + i, f.u); });
    var tod = pick(TOD), LW = 0, LH = 0, S = 1, port = false, shops = [], bands = [], maxD = 100, meterY = 0;

    /* ---------- 版面：手機直式 2×2（兩條街），電腦橫式一排 4 間 ---------- */
    function layout() {
      var cw = host.clientWidth, ch = host.clientHeight; if (!cw || !ch) return false;
      port = cw / ch < 1.0; var target = port ? 200 : 250;
      S = Math.max(1, Math.round(cw * dpr / target)); LW = Math.floor(cw * dpr / S); LH = Math.floor(ch * dpr / S);
      cv.width = LW; cv.height = LH; tv.width = LW * S; tv.height = LH * S;
      var cssW = LW * S / dpr, cssH = LH * S / dpr, l = (cw - cssW) / 2, t = (ch - cssH) / 2;
      [cv, tv].forEach(function (e) { e.style.left = l + 'px'; e.style.top = t + 'px'; e.style.width = cssW + 'px'; e.style.height = cssH + 'px'; });
      var rows = port ? 2 : 1, cols = 4 / rows, m = 4, gap = 3, sw = Math.floor((LW - m * 2 - gap * (cols - 1)) / cols);
      var meterH = 24, avail = LH - meterH, bandH = Math.floor(avail / rows), walk = 16, road = port ? 16 : 20;
      var sh = Math.round(Math.max(sw * .9, Math.min(sw * (port ? 1.08 : 1.45), bandH - walk - road - 26)));
      bands = []; shops = [];
      for (var r = 0; r < rows; r++) {
        var bt = r * bandH, ground = bt + bandH - walk - road;
        bands.push({ top: bt, h: bandH, sy: ground - sh, ground: ground, walk: walk, roadY: ground + walk, roadH: road });
      }
      for (var i = 0; i < 4; i++) {
        var b = bands[Math.floor(i / cols)], x = m + (i % cols) * (sw + gap), y = b.sy, w = sw, h = sh;
        var signH = Math.max(10, Math.round(h * .17)), awnH = Math.max(5, Math.round(h * .09)), dw = Math.round(w * .74 / 2) * 2, dx = x + (w - dw) / 2;
        var dy = y + signH + awnH + 3, th = Math.max(4, Math.round(h * .07)), sTop = dy + th + 2, dH = y + h - sTop;
        shops.push({ i: i, fs: signH >= 16 ? 12 : Math.max(8, signH - 3), x: x, y: y, w: w, h: h, signH: signH, awnH: awnH, dx: dx, dw: dw, dy: dy, th: th, sTop: sTop, dH: dH, band: b,
          door: { x: x + w / 2, y: y + h + Math.round(walk * .72) }, look: LOOK[i], winLit: [Math.random() < .6, Math.random() < .5], ac: Math.random() < .5 ? 0 : 1 });
      }
      meterY = LH - meterH; maxD = 1;
      shops.forEach(function (a) { shops.forEach(function (b) { maxD = Math.max(maxD, Math.hypot(a.door.x - b.door.x, a.door.y - b.door.y)); }); });
      clouds = clouds.length ? clouds : [0, 1, 2].map(function (k) { return { x: rnd(0, 1), y: rnd(.15, .7), w: Math.round(rnd(10, 18)) }; });
      birds = birds.length ? birds : [0, 1, 2].map(function () { return { u: rnd(.1, .9), hop: 0 }; });
      return true;
    }
    var clouds = [], birds = [], scoots = [], parts = [], floats = [];

    /* ---------- 遊戲狀態 ---------- */
    var st = { ph: 'wait', pt: 0, t: 0, R: 0, got: 0, lost: 0, open: -1, prev: -1, L: 0, gold: false, score: 0, perfect: 0, dodge: 0, pinch: 0, wrong: 0, guessOk: 0,
      clues: [[], [], [], []], sched: [], toss: null, banner: null, shake: 0, sumAt: 0, ended: false, bubbles: [], openT: 0, carry: [] };
    var girl = { x: 0, y: 0, tx: 0, ty: 0, face: 1, at: -1, stun: 0, squash: 0, hold: 0, flinch: 0 };
    var mon = { x: 0, y: 0, tx: 0, ty: 0, face: -1, at: -1, plan: [], react: 0, hang: false, hop: 0, dizzy: 0, tele: 0, nextYank: 0, laugh: 0, carry: -1, wander: 0, sign: 0, goal: -1 };
    function doorX(i, who) { var s = shops[i]; return who === 'girl' ? s.door.x - 20 : s.door.x - 2; }   // 人物 x＝圖的左邊；孫女站門左半、公休怪站右半
    function goTo(e, i, who) { e.tx = doorX(i, who); e.ty = shops[i].door.y; e.at = -1; e.goal = i; }
    function near(e) { return Math.abs(e.x - e.tx) < .6 && Math.abs(e.y - e.ty) < .6; }
    function bubble(s, x, y, who, life) { st.bubbles = st.bubbles.filter(function (b) { return b.who !== who; }); st.bubbles.push({ s: s, x: x, y: y, who: who, t: 0, life: life || 1.2 }); }
    function banner(s, col) { st.banner = { s: s, col: col || '#fff4da', t: 0 }; }
    function floatTxt(s, x, y, col) { floats.push({ s: s, x: x, y: y, t: 0, col: col || '#fff4da' }); }
    function burst(x, y, n, cols, sp, grav) { for (var k = 0; k < n; k++) { var a = Math.random() * Math.PI * 2, v = rnd(.3, 1) * (sp || 40); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (grav ? 20 : 0), l: 0, ml: rnd(.35, .7), c: pick(cols), s: Math.random() < .3 ? 2 : 1, g: grav || 0 }); } }
    function hud() { try { o.hud && o.hud('孫女 ' + st.got + '/3 份　公休怪 ' + st.lost + '/3 份' + (st.gold ? '　✨黃金回合' : ''), st.got / 3, st.R); } catch (e) {} }

    function newRound() {
      if (st.R > 0) { var ys = shops.map(function (s) { return s.door.y; }); mon.y = mon.ty = ys.reduce(function (a, b) { return Math.abs(b - mon.y) < Math.abs(a - mon.y) ? b : a; }); mon.x = mon.tx = Math.max(0, Math.min(LW - 24, mon.x)); mon.final = null; }
      st.R++; st.ph = 'intro'; st.pt = 0; st.L = 0; st.toss = null; st.clues = [[], [], [], []]; st.bubbles = []; mon.carry = -1; mon.sign = 0; mon.hang = false; mon.dizzy = 0; mon.tele = 0; mon.laugh = 0;
      var cand = [0, 1, 2, 3].filter(function (i) { return i !== st.prev; }); st.open = pick(cand); st.prev = st.open;
      st.gold = st.R >= 2 && Math.random() < .2;
      var A = D.A, types = shuf(TYPES), tf = D.trueN === 3 ? [.12, .45, .78] : [.3, .78];
      st.sched = tf.map(function (f, k) { return { at: f * A, i: st.open, type: types[k], fake: false }; });
      var nf = st.R === 1 ? 0 : D.fakes, others = shuf([0, 1, 2, 3].filter(function (i) { return i !== st.open; })), fakeTypes = types.slice(D.trueN), same = Math.random() < D.same;
      mon.plan = []; for (var k = 0; k < nf; k++) mon.plan.push({ i: same ? others[0] : others[k % others.length], type: fakeTypes[k % fakeTypes.length], done: false });
      girl.at = -1; girl.goal = -1; girl.stun = 0; girl.hold = 0;
      if (st.R === 1) { girl.x = girl.tx = LW / 2 - 14; girl.y = girl.ty = shops[0].door.y; mon.x = mon.tx = LW / 2 + 14; mon.y = mon.ty = shops[0].door.y; }
      else { girl.tx = girl.x; girl.ty = girl.y; }
      mon.goal = -1; hud();
      say(st.R === 1 ? '看線索！哪一間店要開了？先點那間店去門口等' : st.gold ? '✨ 黃金回合！最後一份搶到分數加倍' : '第 ' + st.R + ' 回合：小心公休怪放的假線索！');
      banner('第 ' + st.R + ' 回合' + (st.gold ? '✨' : ''), st.gold ? '#ffd95a' : '#fff4da');
    }
    function startClue() { st.ph = 'clue'; st.pt = 0; banner('看線索！', '#fff4da'); sfx('tap'); }
    function addClue(i, type, fake) {
      if (st.clues[i].some(function (c) { return c.type === type; })) type = TYPES.filter(function (t) { return !st.clues[i].some(function (c) { return c.type === t; }); })[0] || type;
      var s = shops[i]; st.clues[i].push({ type: type, t: 0, fake: fake });
      burst(s.door.x, s.sTop + s.dH * .5, 6, ['#ffd95a', '#fff4da'], 30); sfx('tick');
      if (D.labels) floatTxt(CLUE_TXT[type], s.door.x, s.sTop + 8, '#fff4da');
    }
    function openShop() {
      st.ph = 'open'; st.pt = 0; st.openT = 0; var s = shops[st.open];
      sfx('shutter'); burst(s.door.x, s.y + s.h - 2, 8, ['#e7ece5', '#c9c9c9'], 26, 30);
      var going = girl.goal === st.open;
      if (!going) { st.wrong++; say(girl.goal < 0 ? '開了！是「' + o.foods[st.open].shop + '」！快點任何地方衝過去！' : '猜錯了！開的是「' + o.foods[st.open].shop + '」，快點任何地方衝過去！'); }
      else { st.guessOk++; say('猜對了！鐵門卡在一半，連點把它推上去！'); }
      bubble('最後一份' + o.foods[st.open].n + '！', s.door.x, s.y + s.signH, 'owner', 1.4);
      mon.react = D.react + rnd(0, .12); mon.nextYank = rnd(D.yank[0], D.yank[1]) * .7;
    }
    function tap(lx, ly) {
      if (dead || st.ended) return;
      var hit = -1; shops.forEach(function (s, i) { if (lx >= s.x - 1 && lx <= s.x + s.w + 1 && ly >= s.y && ly <= s.y + s.h + s.band.walk) hit = i; });
      if (st.ph === 'intro' || st.ph === 'clue') {
        if (hit >= 0) { goTo(girl, hit, 'girl'); sfx('tap'); bubble('這間！', doorX(hit, 'girl'), shops[hit].door.y - 26, 'girl', .7); }
        else if (st.ph === 'clue') floatTxt('點店面選一間', lx, ly - 6, '#ffd95a');
        return;
      }
      if (st.ph === 'open') {
        if (st.pt < .3) return;
        var atDoor = girl.at === st.open;
        if (!atDoor) { if (girl.goal !== st.open) { goTo(girl, st.open, 'girl'); sfx('whoosh'); } return; }
        if (girl.stun > 0) return;
        if (mon.tele > 0 && D.tele - mon.tele < D.grace) return;   // 「！」剛冒出來：給反應時間，這段點了不算推也不會夾
        if (mon.tele > 0) {   // 牠在蓄力還硬推 → 夾到手
          st.pinch++; mon.tele = 0; mon.laugh = .7; mon.nextYank = rnd(D.yank[0], D.yank[1]); st.L = Math.max(0, st.L - .2); girl.stun = .6; st.shake = .25;
          sfx('smash'); sfx('vib', [40, 30, 40]); var s = shops[st.open]; burst(s.door.x, s.sTop + s.dH * (1 - st.L), 10, ['#ff8a7a', '#fff4da', '#c0453c'], 50);
          bubble('好痛！', girl.x + 6, girl.y - 26, 'girl', .9); bubble('嘿嘿！', mon.x + 8, mon.y - 30, 'mon', .9); say('手被夾到了！牠頭上冒「！」的時候要停手'); return;
        }
        st.L += D.tap; girl.squash = .08; girl.hold = .25; sfx('tap');
        if (Math.random() < .3) { var s2 = shops[st.open]; parts.push({ x: girl.x + rnd(4, 14), y: girl.y - 22, vx: rnd(-14, 14), vy: -20, l: 0, ml: .4, c: '#8fd6ff', s: 1, g: 80 }); burst(s2.door.x + rnd(-s2.dw / 2, s2.dw / 2), s2.sTop + s2.dH * (1 - st.L), 2, ['#9aa'], 14, 20); }
        if (Math.random() < .12) floatTxt(pick(['嘿！', '咻！', '推～']), girl.x + 8, girl.y - 30, '#fff4da');
        return;
      }
      if (st.ph === 'toss' && st.toss && !st.toss.done) {
        var T = st.toss, tt = T.t;
        if (tt < .5) return;
        if (tt < T.T - D.catchW) { girl.flinch = .15; floatTxt('還沒～', girl.x + 8, girl.y - 34, '#ffd95a'); return; }
        if (tt <= T.T + .07) catchIt(Math.abs(tt - T.T) <= D.perf);
      }
    }
    function catchIt(perfect) {
      var T = st.toss; T.done = true; st.got++; st.ph = 'result'; st.pt = 0;
      var pts = 100 + (perfect ? 60 : 20) + Math.max(0, Math.round(60 - st.openT * 15)); if (st.gold) pts *= 2; st.score += pts;
      if (perfect) { st.perfect++; banner('完美接住！', '#ffd95a'); sfx('power'); } else { banner('接住了！', '#9ff0b0'); sfx('coin', st.got); }
      sfx('ding'); sfx('vib', [20, 30]); st.carry.push(st.open); girl.carryT = 1.1;
      burst(girl.x + 12, girl.y - 24, 16, ['#ffd95a', '#fff4da', '#ff9a7a', '#9ff0b0'], 60);
      floatTxt('+' + pts, girl.x + 12, girl.y - 36, '#ffd95a'); say('老闆：接好！最後一份' + o.foods[st.open].n + '給你！'); hud();
    }
    function monsterWins(how) {
      st.lost++; st.ph = 'result'; st.pt = 0; st.shake = how === 'slam' ? .35 : .15;
      var s = shops[st.open];
      if (how === 'slam') { st.L = 0; mon.hang = false; mon.sign = 1; mon.x = s.door.x - 12; sfx('smash'); burst(s.door.x, s.y + s.h - 1, 14, ['#e7ece5', '#c9c9c9', '#9aa'], 40, 40); bubble('今日公休！', s.door.x, s.sTop - 2, 'mon', 1.1); }
      else { mon.carry = st.open; sfx('slap'); bubble('嗝～', mon.x + 8, mon.y - 30, 'mon', 1); }
      sfx('hit'); banner(how === 'slam' ? '鐵門被拉下來了…' : '被公休怪撿走了…', '#ffb0a0'); say(how === 'slam' ? '公休怪：今日公休～（' + pick(REASON) + '）' : pick(BL)); hud();
    }

    /* ---------- 更新 ---------- */
    function moveE(e, spd, dt) {
      var dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy); if (d < .01) return false;
      var stp = Math.min(d, spd * dt); e.x += dx / d * stp; e.y += dy / d * stp; if (Math.abs(dx) > .5) e.face = dx > 0 ? 1 : -1; return true;
    }
    var stepT = 0;
    function update(dt) {
      st.t += dt; st.pt += dt;
      clouds.forEach(function (c) { c.x += dt * .012; if (c.x > 1.15) c.x = -.15; });
      birds.forEach(function (b) { b.hop = Math.max(0, b.hop - dt); if (Math.random() < dt * .3) b.hop = .25; });
      bands.forEach(function (b, bi) { if (Math.random() < dt * .45 && scoots.filter(function (q) { return q.b === bi; }).length < 2) { var dir = Math.random() < .5 ? 1 : -1; scoots.push({ b: bi, x: dir > 0 ? -20 : LW + 20, dir: dir, v: rnd(45, 80), col: pick(['#bd5142', '#356773', '#f5bf43', '#e8879f', '#efe6d8']), hel: pick(['#fff4da', '#3b2a1e', '#e8564a', '#4fa3b0']) }); } });
      scoots = scoots.filter(function (q) { q.x += q.dir * q.v * dt; return q.x > -30 && q.x < LW + 30; });
      parts = parts.filter(function (p) { p.l += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; return p.l < p.ml; });
      floats = floats.filter(function (f) { f.t += dt; f.y -= dt * 14; return f.t < .9; });
      st.bubbles = st.bubbles.filter(function (b) { b.t += dt; return b.t < b.life; });
      if (st.banner) { st.banner.t += dt; if (st.banner.t > 1.1) st.banner = null; }
      st.shake = Math.max(0, st.shake - dt); girl.squash = Math.max(0, girl.squash - dt); girl.hold = Math.max(0, girl.hold - dt); girl.flinch = Math.max(0, girl.flinch - dt);
      girl.stun = Math.max(0, girl.stun - dt); mon.laugh = Math.max(0, mon.laugh - dt); girl.carryT = Math.max(0, (girl.carryT || 0) - dt);
      st.clues.forEach(function (l) { l.forEach(function (c) { c.t += dt; }); });
      if (st.gold && st.open >= 0 && (st.ph === 'open' || st.ph === 'toss') && Math.random() < dt * 8) { var gs0 = shops[st.open]; parts.push({ x: gs0.x + rnd(0, gs0.w), y: gs0.y + rnd(0, gs0.signH), vx: 0, vy: -10, l: 0, ml: .5, c: '#ffd95a', s: 1, g: 0 }); }
      // 孫女移動
      var gSpd = maxD / 1.15; if (moveE(girl, gSpd, dt)) { stepT += dt; if (stepT > .16) { stepT = 0; sfx('step'); parts.push({ x: girl.x + 12 - girl.face * 6, y: girl.y - 1, vx: -girl.face * 10, vy: -6, l: 0, ml: .3, c: '#e9dcc4', s: 1, g: 0 }); } }
      else if (girl.goal >= 0) girl.at = girl.goal;
      var ph = st.ph;
      if (ph === 'intro') { if (st.pt > .9) startClue(); }
      else if (ph === 'clue') {
        st.sched.forEach(function (c) { if (!c.done && st.pt >= c.at) { c.done = true; addClue(c.i, c.type, false); } });
        // 公休怪：去別家放假線索 → 最後可能站到正確店門口
        var mSpd = maxD / Math.max(.45, D.A * .32);
        var nx = mon.plan.filter(function (p) { return !p.done; })[0];
        if (nx && st.pt < D.A * .85) {
          if (mon.goal !== nx.i) goTo(mon, nx.i, 'mon');
          if (!moveE(mon, mSpd, dt)) { nx.done = true; addClue(nx.i, nx.type, true); burst(mon.x + 12, mon.y - 10, 8, ['#d8d0e8', '#fff'], 24); if (D.fakes < 2) bubble('嘿嘿', mon.x + 10, mon.y - 26, 'mon', .7); sfx('whoosh'); }
        } else {
          if (mon.final == null) { mon.final = Math.random() < D.know + .1 * (st.R - 1) ? st.open : -1; if (mon.final >= 0) goTo(mon, mon.final, 'mon'); }
          moveE(mon, mSpd * .8, dt);
        }
        if (st.pt >= D.A) { mon.final = null; openShop(); }
      } else if (ph === 'open') {
        var s = shops[st.open];
        st.openT += dt;
        if (st.pt < .3) st.L = Math.min(.5, st.pt / .3 * .5);
        else {
          var gAt = girl.at === st.open && near(girl);
          // 公休怪衝過去、跳上鐵門吊著
          if (!mon.hang && mon.dizzy <= 0) {
            mon.react -= dt;
            if (mon.react <= 0) { if (mon.goal !== st.open) goTo(mon, st.open, 'mon'); if (!moveE(mon, maxD / D.mT, dt)) { mon.hop += dt; if (mon.hop > .15) { mon.hop = 0; mon.hang = true; sfx('jump'); bubble(pick(['公休！', '關門啦！', '下班！']), s.door.x + 10, s.sTop - 2, 'mon', .9); } } }
          }
          if (mon.dizzy > 0) { mon.dizzy -= dt; if (mon.dizzy <= 0) mon.react = .1; }
          if (mon.hang && mon.dizzy <= 0) st.L -= (gAt && girl.stun <= 0 ? D.pull : D.alone) * dt; else st.L -= D.sag * dt;   // 被夾到手那段時間等於沒人跟牠拉
          // 猛拉：「！」→ 有人還在推就夾手；停手就閃到腰
          if (gAt && mon.hang && mon.dizzy <= 0) {
            if (mon.tele > 0) { mon.tele -= dt; if (mon.tele <= 0) { st.dodge++; mon.hang = false; mon.dizzy = D.dz; st.L = Math.min(.99, st.L + .05); sfx('parry'); sfx('combo', st.dodge); banner('公休怪閃到腰！', '#9ff0b0'); bubble('哎唷！', mon.x + 8, mon.y - 26, 'mon', .8); mon.nextYank = rnd(D.yank[0], D.yank[1]); st.score += 30; } }
            else { mon.nextYank -= dt; if (mon.nextYank <= 0) { mon.tele = D.tele; sfx('warn'); } }
          } else mon.tele = 0;
          if (st.L >= 1) {   // 推到頂 → 老闆丟食物
            st.L = 1; st.ph = 'toss'; st.pt = 0; if (mon.hang) { mon.hang = false; mon.dizzy = 1.2; }
            var hx = girl.x + 12, hy = girl.y - 22;
            st.toss = { t: 0, T: .95, x0: s.door.x + 4, y0: s.y + s.h - s.dH * .42, x1: hx, y1: hy, top: Math.min(s.y - 6, hy - 40), done: false };
            sfx('ding'); bubble('接好！', s.door.x, s.y + s.signH, 'owner', 1); banner('推上去了！', '#ffd95a'); say('看準食物落下時點一下接住！');
          } else if (st.L <= 0) monsterWins('slam');
        }
      } else if (ph === 'toss') {
        var T = st.toss; T.t += dt;
        if (!T.done && T.t > T.T + .07) {   // 沒接到 → 撞到頭彈開，公休怪撿走
          T.done = true; T.miss = 0; sfx('bump'); floatTxt('咚！', girl.x + 12, girl.y - 30, '#ffb0a0');
          mon.dizzy = 0; mon.tx = T.x1 + 10; mon.ty = girl.y; mon.goal = -1; monsterWins('miss');
        }
      } else if (ph === 'result') {
        if (st.toss && st.toss.miss != null) { st.toss.miss += dt; moveE(mon, maxD / .5, dt); }
        if (st.pt > 1.3) {
          if (st.got >= 3) { st.ph = 'sum'; st.pt = 0; sfx('win'); say('三份最後一份都搶到了！'); }
          else if (st.lost >= 3) { st.ph = 'over'; st.pt = 0; sfx('lose'); say('三份都被公休怪搶走了！老闆：昨天來就有開啦！'); }
          else newRound();
        }
      } else if (ph === 'sum') { if (st.pt > 2.2) finish(true); }
      else if (ph === 'over') { if (st.pt > 1.2) finish(false); }
      // 公休怪吊在鐵門上時跟著鐵門高度
      if (mon.hang && st.open >= 0) { var s3 = shops[st.open]; mon.x = s3.door.x - 4; mon.y = s3.sTop + s3.dH * (1 - st.L) + 22 - monBox.y; mon.tx = mon.x; mon.ty = mon.y; }
      else if (!mon.hang && mon.dizzy > 0 && st.open >= 0 && st.ph !== 'result') { var s4 = shops[st.open]; mon.ty = s4.door.y; mon.y += (mon.ty - mon.y) * Math.min(1, dt * 12); }
      else if (mon.sign) { var s5 = shops[st.open]; mon.x = s5.door.x - 12; mon.y = s5.sTop + s5.dH * .62 + 12; }
    }
    function finish(win) {
      if (st.ended) return; st.ended = true;
      var r = { win: win, challenge: win && st.wrong === 0 && st.pinch === 0 && st.lost === 0, score: st.score, bonus: win ? Math.min(6, st.perfect + st.dodge + (st.lost === 0 ? 2 : 0)) : st.got,
        got: st.got, lost: st.lost, perfect: st.perfect, dodge: st.dodge, pinch: st.pinch, wrong: st.wrong, rounds: st.R };
      try { o.onEnd && o.onEnd(r); } catch (e) {}
    }

    /* ---------- 繪圖：像素層 ---------- */
    function R(c, x, y, w, h) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    function spr(k, x, y, w, h, flip) { var im = img[k]; if (!im || !im.complete || !im.naturalWidth) return; x = Math.round(x); y = Math.round(y); if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(im, 0, 0, w, h); g.restore(); } else g.drawImage(im, x, y, w, h); }
    function sky() {
      var h0 = bands[0].sy; R(tod.sky[0], 0, 0, LW, h0 * .55); R(tod.sky[1], 0, h0 * .55, LW, LH);
      for (var x = 0; x < LW; x += 2) R(tod.sky[1], x, Math.round(h0 * .55) - 1 - (x % 4 ? 1 : 0), 1, 1);
      if (tod.k === 'night') { for (var k = 0; k < 18; k++) { var sx = (k * 53) % LW, sy = (k * 29) % Math.max(8, h0 * .5); if ((k + Math.floor(st.t * 2)) % 7) R('#fff4da', sx, sy, 1, 1); } R('#fff3a0', LW * .82, 6, 7, 7); R(tod.sky[0], LW * .82 + 3, 5, 6, 6); }
      else if (tod.k === 'dusk') { R('#ffb070', LW * .78, h0 * .45, 12, 8); R('#ffd09a', LW * .78 + 2, h0 * .45 + 1, 8, 6); }
      else { R('#fff3a0', LW * .84, 5, 9, 9); R('#ffd95a', LW * .84 + 1, 6, 7, 7); }
      clouds.forEach(function (c) { var x = c.x * LW, y = c.y * Math.max(10, h0 * .5), col = tod.k === 'night' ? '#3c4a74' : tod.k === 'dusk' ? '#ffd8b8' : '#fff'; R(col, x, y, c.w, 3); R(col, x + 3, y - 2, c.w - 7, 2); R(col, x + 2, y + 3, c.w - 3, 1); });
    }
    function upper(s) {   // 樓上：每棟不一樣（鐵窗＋冷氣、曬衣陽台、春聯小窗＋盆栽、大窗＋水塔），會動的有衣服、窗簾
      var b = s.band, top = Math.max(b.top + (b === bands[0] ? 10 : 0), s.y - 46), x = s.x - 1, w = s.w + 2, h = s.y - top; if (h < 6) return;
      R(s.look.up, x, top, w, h); R('rgba(0,0,0,.12)', x, top, w, 2); R(K, x, top - 1, w, 1);
      var night = tod.dark > .2, glass = '#9cc7d6', litC = '#ffe39a', v = s.i % 4;
      function win(wx, wy, ww, wh, lit, bars) { R(K, wx - 1, wy - 1, ww + 2, wh + 2); R(lit ? litC : glass, wx, wy, ww, wh); if (!lit) R('#c9e6ee', wx, wy, Math.max(1, Math.floor(ww / 3)), wh); if (bars) { for (var gx = wx + 2; gx < wx + ww; gx += 3) R('#5a4a3a', gx, wy, 1, wh); R('#5a4a3a', wx, wy + Math.floor(wh / 2), ww, 1); } }
      var wh = Math.min(h - 8, Math.max(5, Math.round(h * .45))), wy = top + Math.max(3, Math.round((h - wh) / 2) - 2);
      if (v === 0) {   // 鐵窗兩扇＋冷氣＋花台
        var ww = Math.max(6, Math.round(w * .28));
        [x + Math.round(w * .14), x + w - Math.round(w * .14) - ww].forEach(function (wx, k) { win(wx, wy, ww, wh, night && s.winLit[k], true);
          if (k === s.ac && wy + wh + 7 < s.y) { R('#c9c9c9', wx + 1, wy + wh + 2, 8, 5); R('#9a9a9a', wx + 2, wy + wh + 3, 4, 3); R(K, wx + 1, wy + wh + 7, 8, 1); var fan = Math.floor(st.t * 8) % 2; R('#6e6e6e', wx + 3 + fan, wy + wh + 4, 2, 1); }
          else if (wy + wh + 4 < s.y) { R('#8a4a1a', wx + 1, wy + wh + 2, ww - 2, 2); R('#64875d', wx + 2, wy + wh, 2, 2); R('#8fbf6a', wx + ww - 4, wy + wh - 1, 2, 3); R('#e8879f', wx + 3, wy + wh - 1, 1, 1); } });
      } else if (v === 1) {   // 陽台＋曬衣竿，衣服隨風晃
        var bw = Math.round(w * .78), bx = x + Math.round((w - bw) / 2), by = wy;
        R('#5a4a3a', bx, by - 1, bw, 1); win(bx + 2, by + 1, bw - 4, wh - 2, night && s.winLit[0], false); R('rgba(255,255,255,.35)', bx + 2, by + 1, bw - 4, 2);
        R('#b8b0a4', bx - 1, by + wh - 1, bw + 2, 2); for (var q = bx; q < bx + bw; q += 3) R('#8a8278', q, by + wh + 1, 1, 3); R('#8a8278', bx - 1, by + wh + 4, bw + 2, 1);
        var pole = by + 2; R('#c9c9c9', bx - 3, pole, bw + 6, 1);
        ['#e8564a', '#fff4da', '#4fa3b0', '#f5bf43'].forEach(function (cc, k) { var cx = bx + 3 + k * Math.max(5, Math.floor((bw - 6) / 4)), sw2 = Math.round(Math.sin(st.t * 3 + k) * 1); R(cc, cx + sw2, pole + 1, 4, k % 2 ? 6 : 4); R('rgba(0,0,0,.15)', cx + sw2, pole + 1, 1, k % 2 ? 6 : 4); });
      } else if (v === 2) {   // 三扇小窗＋紅春聯＋盆栽
        var n = 3, sw3 = Math.max(4, Math.floor((w - 12) / n) - 3);
        for (var k = 0; k < n; k++) { var wx = x + 6 + k * (sw3 + 3); win(wx, wy, sw3, wh, night && (k + s.i) % 2 === 0, k !== 1); }
        R('#c0453c', x + 2, wy, 2, wh); R('#c0453c', x + w - 4, wy, 2, wh); R('#ffd95a', x + 2, wy + 2, 2, 1); R('#ffd95a', x + w - 4, wy + 2, 2, 1);
        if (wy + wh + 4 < s.y) for (var p2 = 0; p2 < 3; p2++) { var px2 = x + 7 + p2 * Math.floor((w - 14) / 2); R('#a0652f', px2, wy + wh + 2, 4, 3); R(p2 === 1 ? '#e8879f' : '#64875d', px2, wy + wh, 4, 2); }
      } else {   // 大窗＋窗簾飄＋屋頂水塔
        var bw4 = Math.round(w * .62), bx4 = x + Math.round((w - bw4) / 2); win(bx4, wy, bw4, wh, night && s.winLit[1], false);
        var cur = Math.round((Math.sin(st.t * 1.6 + 1) + 1) * 1.5); R('#e8879f', bx4, wy, 3 + cur, wh); R('#e8879f', bx4 + bw4 - 3 - cur, wy, 3 + cur, wh); R('#c86a86', bx4, wy + wh - 1, bw4, 1);
        if (b === bands[0] || top - 9 > b.top) { var tx = x + w - 12; R(K, tx - 1, top - 10, 10, 9); R('#e7ece5', tx, top - 9, 8, 7); R('#c9c9c9', tx, top - 6, 8, 1); R('#9a9a9a', tx + 1, top - 2, 1, 2); R('#9a9a9a', tx + 6, top - 2, 1, 2); }
      }
      if (s.i % 2 === 0 && h > 16) { var vx = s.x + s.w - 2, vy = top + 3, vh = Math.min(h - 4, 22); R(K, vx - 1, vy - 1, 7, vh + 2); R(['#e8564a', '#356773', '#f5bf43', '#64875d'][(s.i + 1) % 4], vx, vy, 5, vh); for (var q2 = vy + 2; q2 < vy + vh - 2; q2 += 5) R(night && Math.floor(st.t * 2 + q2) % 3 ? '#fff3a0' : '#fff4da', vx + 1, q2, 3, 3); }
    }
    function shop(s) {
      var L = s.i === st.open && (st.ph === 'open' || st.ph === 'toss' || st.ph === 'result') ? st.L : 0, lk = s.look, x = s.x, y = s.y, w = s.w, h = s.h;
      var rattle = st.clues[s.i].some(function (c) { return c.type === 'rattle'; }) && st.ph === 'clue', tele = s.i === st.open && mon.tele > 0;
      var jx = (rattle && Math.floor(st.t * 12) % 3 === 0) || tele ? (Math.floor(st.t * 30) % 2 ? 1 : -1) : 0;
      // 牆、柱
      R(lk.wall, x, y + s.signH, w, h - s.signH); R('rgba(0,0,0,.08)', x, y + h - 6, w, 6);
      R('#b8b0a4', x, y + s.signH, 3, h - s.signH); R('#b8b0a4', x + w - 3, y + s.signH, 3, h - s.signH); R('#8a8278', x + 2, y + s.signH, 1, h - s.signH); R('#8a8278', x + w - 3, y + s.signH, 1, h - s.signH);
      // 招牌
      var glow = st.gold && s.i === st.open && (st.ph === 'open' || st.ph === 'toss' || st.ph === 'result');
      R(K, x - 1, y - 1, w + 2, s.signH + 2); R(lk.sign, x, y, w, s.signH); R('rgba(255,255,255,.18)', x, y, w, 2);
      if (glow) { R('#ffd95a', x - 1, y - 1, w + 2, 1); R('#ffd95a', x - 1, y + s.signH, w + 2, 1); }
      var fs = s.fs; spr('f' + s.i, x + 2, y + (s.signH - fs) / 2, fs, fs);
      if (tod.dark > .2 && Math.floor(st.t * 3 + s.i) % 9) { R('rgba(255,240,170,.18)', x, y, w, s.signH); }
      // 遮雨棚（條紋＋波浪邊）
      var ay = y + s.signH; for (var k = 0; k < w; k += 4) R(Math.floor(k / 4) % 2 ? '#fff4da' : lk.awn, x + k, ay, Math.min(4, w - k), s.awnH);
      for (var k2 = 0; k2 < w; k2 += 4) R(Math.floor(k2 / 4) % 2 ? '#fff4da' : lk.awn, x + k2 + 1, ay + s.awnH, 2, 1);
      R('rgba(0,0,0,.15)', x, ay + s.awnH - 1, w, 1);
      // 門框、店內
      var dx = s.dx, dw = s.dw;
      R(K, dx - 1, s.dy - 1, dw + 2, y + h - s.dy + 1);
      var shadowClue = st.clues[s.i].some(function (c) { return c.type === 'shadow'; }), inLit = L > 0 || shadowClue;
      R(inLit ? '#ffe9b0' : '#4a3c34', dx, s.dy, dw, s.th);   // 氣窗
      if (shadowClue && L === 0) { var sx = dx + 2 + ((Math.sin(st.t * 2.2 + s.i) + 1) / 2) * (dw - 8); R('#5a4030', sx, s.dy + 1, 3, s.th - 1); R('#5a4030', sx + 1, s.dy, 2, 1); }
      for (var gx = dx + 3; gx < dx + dw; gx += 4) R('rgba(59,42,30,.5)', gx, s.dy, 1, s.th);
      R('#6e6e6e', dx - 1, s.sTop - 2, dw + 2, 2);   // 捲門盒
      var inT = s.sTop, inH = s.dH;
      if (L > 0) {
        R('#ffe9c0', dx, inT, dw, inH); R('#f5d49a', dx, inT, dw, 3); R('#e8c58a', dx + 2, inT + inH * .25, dw - 4, 1);
        for (var m2 = 0; m2 < 3; m2++) R(['#bd5142', '#356773', '#f5bf43'][m2], dx + 4 + m2 * 6, inT + inH * .25 - 4, 4, 4);   // 架上的東西
        var cy = y + h - Math.round(inH * .38);
        // 老闆
        var ox = s.door.x + Math.round(dw * .14) - 4, oy = cy - 12, toss = st.ph === 'toss' && s.i === st.open && st.toss && st.toss.t < .35;
        R(lk.ap, ox, oy + 7, 9, 6); R('#fff4da', ox + 3, oy + 8, 3, 4); R('#f5d0a0', ox + 2, oy + 1, 6, 6); R(K, ox + 3, oy + 3, 1, 1); R(K, ox + 6, oy + 3, 1, 1); R('#c0453c', ox + 4, oy + 5, 2, 1);
        if (lk.hair === 'perm') { R('#3b2a1e', ox + 1, oy - 1, 8, 3); R('#3b2a1e', ox + 1, oy + 1, 1, 3); R('#3b2a1e', ox + 8, oy + 1, 1, 3); }
        else if (lk.hair === 'towel') { R('#fff', ox + 1, oy, 8, 2); R('#e7ece5', ox + 8, oy + 1, 2, 2); }
        else if (lk.hair === 'cap') { R('#bd5142', ox + 1, oy - 1, 8, 2); R('#bd5142', ox + 7, oy + 1, 3, 1); }
        else { R('#d8d8d8', ox + 2, oy - 1, 6, 2); R('#d8d8d8', ox + 4, oy - 3, 3, 2); }
        if (toss) { R('#f5d0a0', ox - 2, oy + 2, 2, 5); R('#f5d0a0', ox - 3, oy, 2, 2); } else { R('#f5d0a0', ox - 1, oy + 8, 2, 3); }
        // 櫃檯＋食物
        R('#a0652f', dx, cy, dw, y + h - cy); R('#c88a4a', dx, cy, dw, 2); R('#7a4a22', dx, cy + 5, dw, 1);
        if (!(s.i === st.open && (st.ph === 'toss' || (st.ph === 'result' && st.toss)))) spr('f' + s.i, dx + 3, cy - 10, 11, 11);
        if (tod.dark > .2) R('rgba(255,220,140,.15)', dx, inT, dw, inH);
      }
      // 鐵門
      var sh = Math.round(inH * (1 - L)); if (sh > 0) {
        R('#a8bab6', dx + jx, inT, dw, sh); for (var yy = inT + 2; yy < inT + sh; yy += 3) R('#7f9592', dx + jx, yy, dw, 1);
        R('#d6e2df', dx + jx, inT, 2, sh); R('#5f7370', dx + jx, inT + sh - 2, dw, 2); R('#3b2a1e', s.door.x - 2 + jx, inT + sh - 2, 4, 1);   // 下緣把手
        if (L === 0) {   // 公告紙
          var px = s.door.x - 5 + jx, py = inT + Math.round(sh * .3); R('#fff8e0', px, py, 10, 9); R('#bd5142', px + 2, py + 2, 6, 1); R('#bd5142', px + 2, py + 4, 4, 1); R('#bd5142', px + 2, py + 6, 5, 1); R('#9aa', px + 4, py - 1, 2, 1);
        }
      }
      // 鐵門下的光（線索 light）
      if (L === 0 && st.clues[s.i].some(function (c) { return c.type === 'light'; })) {
        var fl = .55 + .25 * Math.sin(st.t * 9 + s.i); R('rgba(255,225,120,' + fl + ')', dx, y + h - 1, dw, 1);
        for (var q = 1; q < 6; q++) R('rgba(255,225,120,' + (fl * (1 - q / 6) * .6) + ')', dx - q, y + h - 1 + q, dw + q * 2, 1);
      }
    }
    function walkRoad(b) {
      var c1 = tod.k === 'night' ? '#8f8270' : '#d8c4a0', c2 = tod.k === 'night' ? '#7c705f' : '#c4ae88';
      R(c1, 0, b.ground, LW, b.walk); for (var x = 0; x < LW; x += 8) R(c2, x, b.ground, 1, b.walk); R(c2, 0, b.ground + Math.floor(b.walk / 2), LW, 1);
      R('#8a7a66', 0, b.ground + b.walk - 2, LW, 2);
      var ac = tod.k === 'night' ? '#3a3a44' : '#5e5e68'; R(ac, 0, b.roadY, LW, b.roadH);
      for (var x2 = 0; x2 < LW; x2 += 12) R('#e8e2c8', x2, b.roadY + Math.floor(b.roadH / 2), 6, 1);
      if (tod.dark > .2) [.25, .75].forEach(function (u) { var lx = Math.round(LW * u); R('#4a4a52', lx, b.ground - 22, 1, 22 + b.walk - 4); R('#4a4a52', lx, b.ground - 22, 4, 1); R('#fff3a0', lx + 3, b.ground - 21, 2, 2); R('rgba(255,240,170,.18)', lx - 6, b.ground - 1, 16, b.walk - 2); });
      scoots.filter(function (q) { return q.b === bands.indexOf(b); }).forEach(function (q) {
        var x = Math.round(q.x), y = b.roadY + (q.dir > 0 ? b.roadH - 5 : Math.max(5, Math.floor(b.roadH / 2) - 1)), f = q.dir;
        R(K, x - 7, y - 1, 3, 3); R(K, x + 5, y - 1, 3, 3); R(q.col, x - 6, y - 5, 13, 4); R(q.col, x + (f > 0 ? 4 : -6), y - 9, 3, 5); R(K, x - 4, y - 6, 6, 1);
        R('#5b3b25', x - 2, y - 11, 4, 5); R('#f5d0a0', x - 1, y - 13, 3, 2); R(q.hel, x - 2, y - 15, 5, 3);
        if (tod.dark > .2) R('rgba(255,240,170,.5)', x + f * 9, y - 6, f * 8, 2);
      });
    }
    function clueSide(s) {   // 人行道上的線索（排隊、機車、貓）
      var ground = s.y + s.h; st.clues[s.i].forEach(function (c) {
        var pop = Math.min(1, c.t / .2), off = Math.round((1 - pop) * 4);
        if (c.type === 'queue') [0, 1].forEach(function (k) { var px = s.x + s.w - 7 - k * 7, py = ground + 12 + off, bob = Math.floor(st.t * 3 + k) % 2;
          R(['#356773', '#e8879f'][k], px, py - 6, 5, 6); R('#5b3b25', px + 1, py, 1, 1); R('#5b3b25', px + 3, py, 1, 1); R('#f5d0a0', px + 1, py - 10 - bob, 4, 4); R(['#3b2a1e', '#8a4a1a'][k], px + 1, py - 11 - bob, 4, 2);
          if (k === 1 && Math.floor(st.t * 1.5) % 2) R('#8fd6ff', px - 1, py - 6, 2, 2); });
        else if (c.type === 'scooter') { var x = s.x + 2, y = ground + 13 + off; R(K, x, y - 2, 3, 3); R(K, x + 11, y - 2, 3, 3); R(s.look.sign, x + 1, y - 6, 12, 4); R(s.look.sign, x + 11, y - 10, 3, 5); R(K, x + 3, y - 7, 6, 1); R('#c9c9c9', x + 11, y - 11, 4, 1); }
        else if (c.type === 'cat') { var cx2 = s.dx + 1, cy2 = s.y + s.h + 9 + off, tl = Math.floor(st.t * 2.5) % 2; R('#d9894a', cx2, cy2 - 5, 6, 5); R('#d9894a', cx2 + 1, cy2 - 8, 4, 3); R('#d9894a', cx2 + 1, cy2 - 9, 1, 1); R('#d9894a', cx2 + 4, cy2 - 9, 1, 1); R(K, cx2 + 2, cy2 - 7, 1, 1); R('#d9894a', cx2 + 6, cy2 - 2 - tl, 2, 1); R('#d9894a', cx2 + 7, cy2 - 4 - tl, 1, 2); }
      });
    }
    function girlDraw() {
      var moving = Math.hypot(girl.tx - girl.x, girl.ty - girl.y) > .5, k = st.ph === 'sum' || (girl.carryT > 0) ? 'gw' : moving ? (Math.floor(st.t * 10) % 2 ? 'gb' : 'ga') : 'ga';
      var sq = girl.squash > 0 ? 2 : 0, x = girl.x, y = girl.y - 24 + sq - (moving && Math.floor(st.t * 10) % 2 ? 1 : 0), fl = girl.face < 0;
      if (girl.stun > 0 && Math.floor(st.t * 16) % 2) g.globalAlpha = .55;
      spr(k, x, y, 24, 24 - sq, fl); g.globalAlpha = 1;
      // 鐵門勾
      if (st.ph === 'open' && girl.at === st.open && near(girl) && girl.stun <= 0) { var s = shops[st.open], ex = s.door.x - 3, ey = s.sTop + s.dH * (1 - st.L) - 1, hx = x + 15, hy = y + 13 - (girl.hold > 0 ? 1 : 0);
        line(hx, hy, ex, ey, '#8a4a1a'); R('#5a4a3a', ex - 1, ey - 1, 3, 2); R('#f5d0a0', hx - 1, hy - 1, 3, 3); }
      if (girl.stun > 0) { R('#ff8a7a', x + 15, y + 8, 3, 3); }
      st.carry.forEach(function (fi, n) { if (n === st.carry.length - 1 && girl.carryT > 0) spr('f' + fi, x + 6, y - 12 - Math.round(Math.sin(st.t * 10) * 1), 12, 12); });
    }
    function line(x0, y0, x1, y1, c) { var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (var k = 0; k <= n; k++) R(c, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 1, 1); }
    function monDraw() {
      var moving = Math.hypot(mon.tx - mon.x, mon.ty - mon.y) > .5, x = mon.x, y = mon.y - 24, bob = moving ? (Math.floor(st.t * 12) % 2 ? -1 : 0) : Math.floor(st.t * 3) % 2 ? -1 : 0;
      if (mon.sign) { spr('mon', x, y, 24, 24); return; }   // 貼在鐵門上當公休牌
      var hang = mon.hang, sh = mon.tele > 0 ? (Math.floor(st.t * 30) % 2 ? 1 : -1) : 0;
      if (hang) { y = mon.y - 24; bob = Math.floor(st.t * 8) % 2; }
      var bx = x + monBox.x, by = y + monBox.y + monBox.h + bob, lg = moving || hang ? Math.floor(st.t * 14) % 2 : 0;
      R(K, bx + 3, by - 1, 2, 4 + lg); R(K, bx + monBox.w - 5, by - 1, 2, 4 + (1 - lg));   // 小腳
      if (hang) { R(K, bx + 1, y + monBox.y - 2, 2, 3); R(K, bx + monBox.w - 3, y + monBox.y - 2, 2, 3); }
      g.save(); if (mon.dizzy > 0 && !hang) { g.translate(Math.round(x + 12), Math.round(y + 24)); g.rotate(Math.sin(st.t * 10) * .12); g.translate(-Math.round(x + 12), -Math.round(y + 24)); }
      spr('mon', x + sh, y + bob, 24, 24); g.restore();
      if (mon.dizzy > 0 && !hang) for (var k = 0; k < 3; k++) { var a = st.t * 6 + k * 2.1; R('#ffd95a', x + 12 + Math.cos(a) * 8, y + monBox.y - 3 + Math.sin(a) * 2, 2, 2); }
      if (mon.carry >= 0) spr('f' + mon.carry, x + 6, y + monBox.y - 12 + bob, 12, 12);
      if (mon.laugh > 0) R('#c0453c', x + 10, y + monBox.y + monBox.h - 5, 4, 2);
    }
    function tossDraw() {
      var T = st.toss; if (!T || (T.done && T.miss == null)) return;
      var u = Math.min(1, T.t / T.T), x, y;
      if (T.miss != null) { var m = Math.min(1, T.miss / .3); x = T.x1 + 6 + m * 10; y = T.y1 - 10 * Math.sin(m * Math.PI) + m * 18; if (T.miss > .35) return; }
      else { x = T.x0 + (T.x1 - T.x0) * u; var top = T.top, a = T.y0, b = T.y1; y = u < .5 ? a + (top - a) * (1 - Math.pow(1 - u * 2, 2)) : top + (b - top) * Math.pow((u - .5) * 2, 2); }
      R('rgba(0,0,0,.18)', x - 4, girl.y - 1, 9, 2);
      spr('f' + st.open, x - 7, y - 7, 14, 14);
      if (!T.done && T.t > .5) { var left = Math.max(0, T.T - T.t), r = Math.round(4 + left * 18), cx = T.x1, cy = T.y1, ok = left <= D.catchW;
        var col = ok ? (left <= D.perf ? '#ffd95a' : '#9ff0b0') : '#fff4da';
        R(col, cx - r, cy, 2, 1); R(col, cx + r - 1, cy, 2, 1); R(col, cx, cy - r, 1, 2); R(col, cx, cy + r - 1, 1, 2); R(col, cx - r + 2, cy - r + 2, 2, 2); R(col, cx + r - 3, cy - r + 2, 2, 2); R(col, cx - r + 2, cy + r - 3, 2, 2); R(col, cx + r - 3, cy + r - 3, 2, 2); }
    }
    function meter() {
      var y = meterY; R('#1b1712', 0, y, LW, LH - y); R('#4a3c34', 0, y, LW, 1);
      var bx = 26, bw = LW - 52, by = y + 13, bh = 6;
      if (st.ph === 'clue' || st.ph === 'intro') {
        var f = st.ph === 'intro' ? 1 : Math.max(0, 1 - st.pt / D.A); R('#4a3c34', bx, by, bw, bh); R('#f5bf43', bx, by, Math.round(bw * f), bh); spr('ga', 4, y + 2, 20, 20); return;
      }
      if (st.ph !== 'open' && st.ph !== 'toss') { spr('ga', 4, y + 2, 20, 20); spr('mon', LW - 24, y + 2, 20, 20); return; }
      var L = Math.max(0, Math.min(1, st.L)), red = mon.tele > 0 && Math.floor(st.t * 10) % 2;
      R(K, bx - 1, by - 1, bw + 2, bh + 2); R(red ? '#c0453c' : '#6e6e6e', bx, by, bw, bh); R('#ffd95a', bx, by, Math.round(bw * L), bh); R('#fff3a0', bx, by, Math.round(bw * L), 1);
      R('#fff4da', bx + Math.round(bw * L) - 1, by - 2, 2, bh + 4);
      spr('ga', 4, y + 2, 20, 20); spr('mon', LW - 24, y + 2, 20, 20);
    }
    function nightTint() { if (tod.dark > 0) { g.fillStyle = 'rgba(16,22,54,' + tod.dark + ')'; g.fillRect(0, 0, LW, meterY); } }
    function lights() {   // 夜晚會亮的東西畫在暗色上面
      if (tod.dark < .2) return;
      shops.forEach(function (s) {
        var L = s.i === st.open && (st.ph === 'open' || st.ph === 'toss' || st.ph === 'result') ? st.L : 0;
        if (Math.floor(st.t * 3 + s.i) % 9) { g.fillStyle = 'rgba(255,240,170,.12)'; g.fillRect(s.x, s.y, s.w, s.signH); }
        if (L > 0) { g.fillStyle = 'rgba(255,230,150,.25)'; g.fillRect(s.dx, s.sTop, s.dw, s.dH * L); g.fillRect(s.dx - 4, s.y + s.h, s.dw + 8, 6); }
        if (L === 0 && st.clues[s.i].some(function (c) { return c.type === 'light'; })) { g.fillStyle = 'rgba(255,225,120,.35)'; g.fillRect(s.dx - 3, s.y + s.h, s.dw + 6, 4); }
        if (st.clues[s.i].some(function (c) { return c.type === 'shadow'; }) && L === 0) { g.fillStyle = 'rgba(255,233,176,.4)'; g.fillRect(s.dx, s.dy, s.dw, s.th); }
      });
    }
    function draw() {
      g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, LW, LH);
      var sx = st.shake > 0 ? Math.round(rnd(-1.5, 1.5)) : 0, sy = st.shake > 0 ? Math.round(rnd(-1, 1)) : 0; g.setTransform(1, 0, 0, 1, sx, sy);
      sky();
      // 電線＋小鳥
      var wy = Math.max(6, bands[0].sy - 50); R('#3b2a1e', 0, wy, LW, 1);
      birds.forEach(function (b) { var bx = b.u * LW, by = wy - 2 - (b.hop > 0 ? 2 : 0); R('#3b2a1e', bx, by, 3, 2); R('#3b2a1e', bx + 2, by - 1, 1, 1); R('#f5bf43', bx + 3, by, 1, 1); });
      bands.forEach(function (b, bi) {
        if (bi > 0) R(tod.k === 'night' ? '#2a2f44' : '#cfc2ae', 0, b.top, LW, b.sy - b.top);
        var bs = shops.filter(function (s) { return s.band === b; }); if (bs.length) { var t0 = Math.max(b.top + (bi ? 0 : 10), bs[0].y - 46); R(tod.k === 'night' ? '#4a4452' : '#b8ab98', 0, t0, LW, b.ground - t0); R(K, 0, t0 - 1, LW, 1); }
        bs.forEach(upper);
        walkRoad(b);
        shops.filter(function (s) { return s.band === b; }).forEach(function (s) { shop(s); clueSide(s); });
      });
      nightTint(); lights();
      // 人物依深度排序
      var ents = [{ y: girl.y + .1, f: girlDraw }, { y: mon.hang || mon.sign ? 9999 : mon.y, f: monDraw }]; ents.sort(function (a, b) { return a.y - b.y; }); ents.forEach(function (e) { e.f(); });
      tossDraw();
      parts.forEach(function (p) { g.globalAlpha = Math.max(0, 1 - p.l / p.ml); R(p.c, p.x, p.y, p.s, p.s); }); g.globalAlpha = 1;
      g.setTransform(1, 0, 0, 1, 0, 0); meter();
    }

    /* ---------- 繪圖：文字層（高解析，Cubic11 用 11 的倍數才清楚） ---------- */
    function font(sz) { tg.font = (sz * dpr) + 'px Cubic11, "PingFang TC", sans-serif'; }
    function T(s, x, y, sz, col, al, stroke) { font(sz); tg.textAlign = al || 'center'; tg.textBaseline = 'middle'; var X = Math.round(x * S), Y = Math.round(y * S); if (stroke) { tg.lineJoin = 'round'; tg.lineWidth = 4 * dpr; tg.strokeStyle = stroke; tg.strokeText(s, X, Y); } tg.fillStyle = col; tg.fillText(s, X, Y); }
    function bub(s, x, y, red) {
      font(11); var w = Math.ceil(tg.measureText(s).width) + 10 * dpr, h = 17 * dpr, X = Math.round(x * S - w / 2), Y = Math.round(y * S - h - 6 * dpr);
      X = Math.max(2 * dpr, Math.min(tv.width - w - 2 * dpr, X)); Y = Math.max(2 * dpr, Y);
      tg.fillStyle = K; tg.fillRect(X - 2 * dpr, Y - 2 * dpr, w + 4 * dpr, h + 4 * dpr); tg.fillStyle = red ? '#ffe0d8' : '#fff'; tg.fillRect(X, Y, w, h);
      var tx = Math.round(Math.max(X + 6 * dpr, Math.min(X + w - 6 * dpr, x * S))); tg.fillStyle = K; tg.beginPath(); tg.moveTo(tx - 5 * dpr, Y + h); tg.lineTo(tx + 5 * dpr, Y + h); tg.lineTo(tx, Y + h + 6 * dpr); tg.fill();
      tg.fillStyle = red ? '#a83227' : K; tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.fillText(s, X + w / 2, Y + h / 2 + dpr);
    }
    function drawText() {
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, tv.width, tv.height);
      shops.forEach(function (s) { T(o.foods[s.i].shop, s.x + (s.w + s.fs + 4) / 2, s.y + s.signH / 2 + .5, 11, s.look.ink, 'center'); });
      st.bubbles.forEach(function (b) { var x = b.x, y = b.y; if (b.who === 'girl') { x = girl.x + 12; y = girl.y - 24; } else if (b.who === 'mon' && !mon.sign) { x = mon.x + 12; y = mon.y - 24 + monBox.y; } bub(b.s, x, y, b.who === 'mon'); });
      if (mon.tele > 0) { var ex = mon.x + 12, ey = mon.y - 24 + monBox.y - 4, pulse = Math.floor(st.t * 12) % 2; T('！', ex, ey - 6, pulse ? 33 : 22, '#ff5a4a', 'center', K); }
      floats.forEach(function (f) { tg.globalAlpha = Math.max(0, 1 - f.t / .9); T(f.s, f.x, f.y, 11, f.col, 'center', K); }); tg.globalAlpha = 1;
      // 下方說明列
      var my = meterY + 6, msg = '', col = '#fff4da';
      if (st.ph === 'intro' || st.ph === 'clue') msg = girl.goal >= 0 ? '在「' + o.foods[girl.goal].shop + '」門口等…' : '看線索，點一間店去門口等';
      else if (st.ph === 'open') { var gAt = girl.at === st.open && near(girl); msg = !gAt ? '點任何地方，衝去開門的店！' : girl.stun > 0 ? '手被夾到了！' : mon.tele > 0 ? '停手！別推！' : '連點！把鐵門推上去'; if (mon.tele > 0) col = '#ff8a7a'; }
      else if (st.ph === 'toss') msg = '食物落到圈圈裡時點一下！';
      if (msg) T(msg, LW / 2, my, 11, col, 'center');
      if (st.banner) { var b = st.banner, sc = b.t < .15 ? .6 + b.t / .15 * .5 : b.t < .25 ? 1.1 - (b.t - .15) : 1; tg.globalAlpha = b.t > .85 ? Math.max(0, 1 - (b.t - .85) / .25) : 1; tg.save(); tg.translate(LW * S / 2, Math.round(bands[0].sy * .5 + 8) * S); tg.scale(sc, sc); T(b.s, 0, 0, 22, b.col, 'center', K); tg.restore(); tg.globalAlpha = 1; }
      if (st.ph === 'sum') summary();
    }
    function summary() {
      var stars = Math.min(3, 1 + (st.lost === 0 ? 1 : 0) + (st.perfect >= 2 ? 1 : 0)), bd = [st.wrong === 0 ? '🔍 線索神探' : '', st.dodge >= 2 ? '💪 閃過猛拉 ' + st.dodge + ' 次' : '', st.perfect >= 1 ? '🎯 完美接住 ' + st.perfect + ' 次' : '', st.lost === 0 ? '⚡ 一份都沒被搶' : ''].filter(Boolean);
      var w = Math.min(LW - 20, 170), h = 74, x = (LW - w) / 2, y = Math.max(8, (meterY - h) / 2), k = Math.min(1, st.pt / .3);
      tg.globalAlpha = k; tg.fillStyle = K; tg.fillRect((x - 2) * S, (y - 2) * S, (w + 4) * S, (h + 4) * S); tg.fillStyle = '#fff4da'; tg.fillRect(x * S, y * S, w * S, h * S);
      T('三份最後一份都搶到了！', LW / 2, y + 12, 11, '#2a7550');
      for (var i = 0; i < 3; i++) { var on = i < stars && st.pt > .3 + i * .25; T('★', LW / 2 + (i - 1) * 20, y + 34, on ? 33 : 22, on ? '#f5bf43' : '#c9bfae', 'center', on ? K : null); }
      T(bd.length ? bd.slice(0, 2).join('　') : '再接再厲，拿下更多徽章', LW / 2, y + 58, 11, K); if (bd.length > 2) T(bd.slice(2).join('　'), LW / 2, y + 68, 11, K);
      tg.globalAlpha = 1;
    }

    /* ---------- 輸入 ---------- */
    function onDown(ev) { if (ev.button > 0) return; ev.preventDefault(); var r = cv.getBoundingClientRect(); tap((ev.clientX - r.left) / r.width * LW, (ev.clientY - r.top) / r.height * LH); }
    function onKey(ev) {
      if (dead || ev.repeat) return; var k = ev.key;
      if (/^[1-4]$/.test(k)) { ev.preventDefault(); var s = shops[+k - 1]; if (st.ph === 'intro' || st.ph === 'clue') tap(s.x + s.w / 2, s.y + s.h / 2); else tap(-99, -99); }
      else if (k === ' ' || k === 'Enter' || k === 'ArrowUp') { ev.preventDefault(); tap(-99, -99); }
    }
    cv.addEventListener('pointerdown', onDown); document.addEventListener('keydown', onKey);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { var gs = girl.goal, ms = mon.goal; if (layout()) { if (gs >= 0) { girl.x = girl.tx = doorX(gs, 'girl'); girl.y = girl.ty = shops[gs].door.y; } else { girl.x = girl.tx = LW / 2 - 14; girl.y = girl.ty = shops[0].door.y; } if (ms >= 0) { mon.x = mon.tx = doorX(ms, 'mon'); mon.y = mon.ty = shops[ms].door.y; } else { mon.x = mon.tx = LW / 2 + 14; mon.y = mon.ty = shops[0].door.y; } } }) : null;
    if (ro) ro.observe(host);

    var api = {
      step: function (dt) {
        if (dead) return; dt = Math.min(.05, Math.max(0, dt || 0));
        if (!LW) { if (!layout()) return; }
        if (st.ph === 'wait') newRound();
        if (!st.ended) update(dt);
        draw(); drawText();
      },
      destroy: function () { dead = true; cv.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); if (ro) ro.disconnect(); },
      tap: tap, st: st, girl: girl, mon: mon, shops: function () { return shops; }, D: D
    };
    return api;
  }
  return { create: create };
})();

(window.__SG=window.__SG||{}).shop={ShopGame:ShopGame};
})();
