/* 街と、その白い壁 ―― 見下ろし型の 物理と 描画（ライブラリなし）。window.TakoGame を つくる。
 *
 *   const g = TakoGame.create(canvas, { onStats, onThrow, onTurnEnd });
 *   g.load(level, { boss })          台を 組む（level は stages.js の 1つ）
 *   g.setTako('tako1') / g.setThrower('nao')
 *   g.start()                        描画ループ（load の あと 1回）
 *
 * あそびかた（ビリヤード／モンスト風）：
 *   - 画面の どこでも 引っぱって はなすと、下の 発射口から 反対向きに タコが とびだす
 *   - タコは 台の ふちや ブロックで はねかえり、止まると 場に のこる
 *   - 場の タコに ぶつけると コンボ。コンボの ついた タコが イカに あたると ダメージ アップ
 *   - イカの 体力を 0 に するか、四すみの 穴に おとせば 勝ち
 *   - ブロック：W 白（2回で こわれる）、H かたい（ふつうの タコでは こわれない。二郎・マキの 爆発・ばくはつで こわれる）、R 赤（あたると 爆発）
 */
(() => {
  'use strict';

  // ---------- 台の 大きさ（ワールドの 点。画面には 縮めて 出す） ----------
  const W = 360;
  const H = 640;
  const CELL = 40;            // 図面の 1マス（たて 13マス × よこ 9マス が 上の 520 に のる）
  const LINE_Y = 530;         // 発射ラインより 下は 発射口の ばしょ
  const LAUNCH = { x: 180, y: 590 };
  const POCKET_R = 24;        // 四すみの 穴
  const POCKET_IN = 30;       // イカの 中心が この 距離に 入ったら 落ちる
  const MAX_PULL = 120;       // これ以上 引いても 強さは おなじ（画面の px）
  const MAX_SPEED = 980;
  const STEP = 1 / 120;
  const STOP = 7;             // これより おそく なったら 止まる
  const SPIN = 2.2;           // タコの まわる はやさ（ゆっくり くるくる）

  // ---------- タコ ----------
  // r：大きさ、mass：重さ、fr：まさつ（大きいほど 早く 止まる）、dmg：イカへの ダメージ
  // tap：うごいて いる あいだに タップした ときの わざ、hit：はじめて ぶつかった ときの わざ
  const TAKOS = {
    tako1: { name: 'タコ一郎', short: '一郎', r: 15, mass: 1,   fr: 300, dmg: 1,   note: 'ふつうの タコ',                     color: '#e0533d' },
    tako2: { name: 'タコ二郎', short: '二郎', r: 16, mass: 2,   fr: 320, dmg: 1.3, note: 'おもくて つきぬける。かたい ブロックも こわせる', color: '#d9731f', pierce: true },
    tako3: { name: 'タコ三郎', short: '三郎', r: 15, mass: 1,   fr: 150, dmg: 1,   note: 'よく はねて 長く すべる',           color: '#c0398a', bounce: 1 },
    tako4: { name: 'タコ四郎', short: '四郎', r: 15, mass: 0.9, fr: 300, dmg: 0.9, note: 'タップで 3びきに わかれる',         color: '#3f8f57', tap: 'split' },
    tako5: { name: 'タコ五郎', short: '五郎', r: 15, mass: 1.1, fr: 300, dmg: 1.1, note: 'タップで イカへ まっしぐら',         color: '#2f6fb0', tap: 'dash' },
    tako6: { name: 'タコ六郎', short: '六郎', r: 16, mass: 1,   fr: 300, dmg: 1,   note: 'ぶつかって 1びょう後に 大ばくはつ',   color: '#b8860b', hit: 'bomb' },
    tako7: { name: 'タコ七郎', short: '七郎', r: 15, mass: 1,   fr: 300, dmg: 1,   note: 'スミで ブロックを もろく、イカを よわく', color: '#4b3f63', hit: 'ink' },
    daiou: { name: 'タコ大王', short: '大王', r: 24, mass: 3.2, fr: 280, dmg: 2,   note: '大きな ゆれで まわりを ふきとばす',   color: '#8e1b1b', hit: 'quake' },
  };
  const TAKO_ORDER = ['tako1', 'tako2', 'tako3', 'tako4', 'tako5', 'tako6', 'tako7', 'daiou'];

  // ---------- 投げる 人 ----------
  // power：ダメージの 倍率、wobble：ねらいの ぶれ（ラジアン）、guide：予測線の 長さ、
  // blast：はじめて ぶつかった ときの 爆発の 半径、count／size：いっぺんに 投げる かずと 大きさ
  const THROWERS = {
    nao:   { name: 'ナオ', power: 0.8, wobble: 0,     guide: 1800, note: 'ねらい ◎ ／ 力 △',  color: '#27407a', assist: true },
    fumi:  { name: 'フミ', power: 1.6, wobble: 0.09,  guide: 110, note: 'ねらい △ ／ 力 ◎',  color: '#d9731f' },
    maki:  { name: 'マキ', power: 1.1, wobble: 0.025, guide: 380, note: 'あたると ばくはつ', color: '#1f7a3d', blast: 60 },
    chika: { name: 'チカ', power: 0.6, wobble: 0.03,  guide: 380, note: 'ちいさく 3びき',    color: '#b0457a', count: 3, size: 0.72 },
  };

  // ---------- ブロック ----------
  const KINDS = {
    W: { hp: 2,  fill: '#fbfbf8', side: '#c9d3dc', edge: '#8fa0b3' },   // 白
    H: { hp: 4,  fill: '#dfe7ee', side: '#9fb0c0', edge: '#6d8093' },   // かたい（ふつうに あてても こわれない。二郎・マキの 爆発・ばくはつで こわれる）
    R: { hp: 1,  fill: '#e0533d', side: '#a33b2c', edge: '#7a2519' },   // 赤（爆発）
  };

  // ---------- アイテム（ひろうと なかまや タコが ふえる） ----------
  //   図面の 文字：f フミ・m マキ・c チカ、2〜7 タコ二郎〜七郎、D タコ大王
  //   ブロックの 中に かくす ときは level.hide = { 'r,c': 'f' }（その マスは W か H）
  const ITEMS = {
    f: { type: 'thrower', key: 'fumi' },
    m: { type: 'thrower', key: 'maki' },
    c: { type: 'thrower', key: 'chika' },
    2: { type: 'tako', key: 'tako2' },
    3: { type: 'tako', key: 'tako3' },
    4: { type: 'tako', key: 'tako4' },
    5: { type: 'tako', key: 'tako5' },
    6: { type: 'tako', key: 'tako6' },
    7: { type: 'tako', key: 'tako7' },
    D: { type: 'tako', key: 'daiou' },
  };
  const HIT_PAD = 9;          // イカの あたり判定は 見た目より これだけ 広い（かすっても あたり。道すじは まげない）
  const ASSIST = (4 * Math.PI) / 180;   // ナオの ねらい補正：この 角度 以内なら イカに あたる 向きへ よせる
  const HITSTOP = 0.06;       // あたった 瞬間 とめる 時間（コンボは すこし 長く）

  const IMG = {};
  function img(url) {
    if (!url) return null;
    if (url in IMG) return IMG[url];
    IMG[url] = null;
    if (typeof Image !== 'function') return null;
    const im = new Image();
    im.onload = () => { if (im.naturalWidth > 0) IMG[url] = im; };
    im.src = url;
    return null;
  }
  const faceUrl = (key, face) => 'images/story/' + key + '-' + (face || 'normal') + '.png';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const reduceMotion = () =>
    !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const POCKETS = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H }];

  // =========================================================
  //  図面（文字の 絵）→ ブロックと イカの 位置
  //    9文字 × 13行。W 白・H かたい・R 赤・Q イカ・. と 空白は なにもない
  // =========================================================
  function parseBoard(rows, hide) {
    const blocks = [];
    const items = [];
    let ika = { x: W / 2, y: 120 };
    (rows || []).forEach((row, r) => {
      for (let c = 0; c < row.length && c < 9; c += 1) {
        const ch = row[c];
        const x = c * CELL;
        const y = r * CELL;
        if (ch === 'Q') ika = { x: x + CELL / 2, y: y + CELL / 2 };
        else if (KINDS[ch]) {
          const inside = hide && ITEMS[hide[r + ',' + c]] ? hide[r + ',' + c] : '';
          blocks.push({ kind: ch, x: x + 1, y: y + 1, w: CELL - 2, h: CELL - 2, hp: KINDS[ch].hp, dead: false, inked: false, flash: 0, item: inside });
        } else if (ITEMS[ch]) {
          items.push({ code: ch, x: x + CELL / 2, y: y + CELL / 2, r: 14 });
        }
      }
    });
    return { blocks, ika, items };
  }

  // =========================================================
  function create(canvas, handlers) {
    const Hd = handlers || {};
    const ctx = canvas.getContext('2d');

    let blocks = [];
    let items = [];       // 台の 上の アイテム { code, x, y, r }
    let got = [];         // この レベルで ひろった アイテムの 文字
    let takos = [];       // 場の タコ（うごいて いる ものも 止まった ものも）
    let ika = null;       // { x, y, vx, vy, r, m, hp, maxHp, dead, pocket, inked, fall }
    let effects = [];
    let pending = [];     // { t, fn }
    let level = null;
    let stage = { boss: '' };

    let takoKind = 'tako1';
    let thrower = 'nao';
    let phase = 'aim';    // 'aim' | 'move' | 'done'
    let moveT = 0;
    let quietT = 0;
    let won = false;
    let pocketWin = false;
    let bestCombo = 0;
    let seed = 1;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    let nextId = 1;

    // 画面
    let cssW = 1;
    let cssH = 1;
    let scale = 1;
    let offX = 0;
    let offY = 0;
    let shakeAmt = 0;
    let hitStop = 0;      // あたった 瞬間の 一時停止（のこり 秒）

    // 入力
    let pull = null;      // 画面の px での 引っぱり { x, y }
    let pointer = null;

    function resize() {
      if (!canvas.getBoundingClientRect) return;
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(cssW / (W + 16), cssH / (H + 16));
      offX = (cssW - W * scale) / 2;
      offY = (cssH - H * scale) / 2;
    }

    // ---------- 読みこみ ----------
    function load(lv, st) {
      level = lv;
      stage = Object.assign({ boss: '' }, st || {});
      const b = parseBoard(lv.rows, lv.hide);
      blocks = b.blocks;
      items = b.items;
      got = [];
      const hp = Math.max(1, Number(lv.hp) || 1);
      const big = stage.boss === 'queen';
      ika = { x: b.ika.x, y: b.ika.y, vx: 0, vy: 0, r: big ? 29 : 25, m: big ? 3.2 : 2.4, hp, maxHp: hp, dead: false, pocket: null, inked: false, fall: 0, hurt: 0 };
      takos = [];
      effects = [];
      pending = [];
      won = false;
      pocketWin = false;
      bestCombo = 0;
      seed = 7 + (lv.no || 1) * 131;
      phase = 'aim';
      pull = null;
      if (stage.boss) { img(faceUrl(stage.boss)); img(faceUrl(stage.boss, 'down')); }
      emitStats();
    }
    function setTako(k) { if (TAKOS[k]) { takoKind = k; img(faceUrl(k)); img(faceUrl(k, 'down')); } }
    function setThrower(k) { if (THROWERS[k]) { thrower = k; img(faceUrl(k)); } }

    const stats = () => ({ hp: ika ? Math.max(0, ika.hp) : 0, maxHp: ika ? ika.maxHp : 1, ratio: ika ? clamp(1 - Math.max(0, ika.hp) / ika.maxHp, 0, 1) : 0, won, pocket: pocketWin, combo: bestCombo, phase, got: got.slice() });
    function emitStats() { if (Hd.onStats) Hd.onStats(stats()); }

    // =========================================================
    //  できごと
    // =========================================================
    function popText(x, y, text, color, size) {
      effects.push({ type: 'text', x, y, text, color: color || '#ffffff', size: size || 18, t: 0, life: size ? 1.0 : 0.9 });
    }
    function shake(a) { if (!reduceMotion()) shakeAmt = Math.max(shakeAmt, a); }

    function hurtIka(amount, x, y, combo, hx, hy) {
      if (!ika || ika.dead || won) return;
      const d = Math.max(0.1, amount * (ika.inked ? 1.5 : 1));
      ika.hp = Math.max(0, ika.hp - d);
      ika.hurt = 0.3;
      const shown = Math.round(d * 10) / 10;
      // あたった ところに 火花、大きな 数字、一瞬 とめる、ゆらす
      effects.push({ type: 'spark', x: hx == null ? x : hx, y: hy == null ? y : hy, t: 0, life: 0.35, big: combo > 0 });
      if (combo > 0) popText(x, y - 44, 'コンボ×' + (combo + 1) + '！', '#ffe36e', 22);
      popText(x, y - 14, '−' + shown, combo > 0 ? '#ffe36e' : '#ffffff', combo > 0 ? 32 : 26);
      if (!reduceMotion()) hitStop = Math.max(hitStop, combo > 0 ? HITSTOP + 0.04 : HITSTOP);
      shake(combo > 0 ? Math.min(18, 9 + 3 * combo) : 6);
      if (ika.hp <= 0.001) { ika.hp = 0; win(false); }
      emitStats();
    }

    function win(pocket) {
      if (won) return;
      won = true;
      pocketWin = !!pocket;
      if (ika) ika.dead = true;
      popText(ika ? ika.x : W / 2, ika ? ika.y - 30 : H / 2, pocket ? 'ポケット！ 一発 勝利！' : 'たおした！', '#ffe36e');
      shake(12);
      emitStats();
    }

    function breakBlock(b) {
      if (b.dead) return;
      b.dead = true;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      if (b.item) {
        items.push({ code: b.item, x: cx, y: cy, r: 14 });
        effects.push({ type: 'pop', x: cx, y: cy, t: 0, life: 0.5 });
        popText(cx, cy - 16, 'なにか 出てきた！', '#ffe36e');
      }
      const n = reduceMotion() ? 2 : 7;
      for (let i = 0; i < n; i += 1) {
        const a = rand() * Math.PI * 2;
        const sp = 60 + rand() * 180;
        effects.push({ type: 'shard', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.6 + rand() * 0.3, size: 5 + rand() * 6, rot: rand() * 6, color: b.inked ? '#4b3f63' : KINDS[b.kind].fill });
      }
      if (b.kind === 'R') pending.push({ t: 0.1, fn: () => explode(cx, cy, 85, 2, 'red') });
    }

    /** strong：かたい ブロックも けずれる あたり（二郎・爆発） */
    function hitBlock(b, power, strong) {
      if (b.dead) return;
      b.flash = 0.12;
      if (b.kind === 'H' && !strong) return;
      b.hp -= power;
      if (b.hp <= 0.001) breakBlock(b);
    }

    /** 爆発：半径 R の イカに ダメージ、ブロックを こわし、タコと イカを ふきとばす */
    function explode(x, y, R, dmg, look) {
      effects.push({ type: 'blast', x, y, t: 0, life: 0.45, r: R, look: look || 'red' });
      shake(look === 'quake' ? 12 : 8);
      blocks.forEach((b) => {
        if (b.dead) return;
        const px = clamp(x, b.x, b.x + b.w);
        const py = clamp(y, b.y, b.y + b.h);
        if (Math.hypot(px - x, py - y) > R) return;
        hitBlock(b, look === 'maki' ? 1 : 2, true);   // 爆発は かたい ブロックも けずる
      });
      const push = (o) => {
        const dx = o.x - x;
        const dy = o.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > R + o.r) return false;
        const f = 1 - Math.min(1, d / (R + o.r));
        o.vx += (dx / d) * 520 * f / Math.sqrt(o.m);
        o.vy += (dy / d) * 520 * f / Math.sqrt(o.m);
        return f;
      };
      takos.forEach((t) => { if (!t.dead) { push(t); t.moving = true; } });
      if (ika && !ika.dead) {
        const f = push(ika);
        if (f !== false && dmg > 0) hurtIka(dmg * (0.5 + 0.5 * f), ika.x, ika.y, 0);
      }
    }

    // =========================================================
    //  物理
    // =========================================================
    function spawnTako(kind, x, y, vx, vy, opt) {
      const T = TAKOS[kind];
      const o = opt || {};
      const size = o.size || 1;
      const t = {
        id: nextId++, kind, x, y, vx, vy, r: T.r * size, m: T.mass * size * size, fr: T.fr, bounce: T.bounce ? 0.97 : 0.85,
        power: o.power || 1, blast: o.blast || 0, combo: 0, hits: 0, rot: 0, spin: SPIN * (vx >= 0 ? 1 : -1),
        moving: true, tapped: !T.tap, fuse: -1, dead: false, trail: [], cool: {},
      };
      takos.push(t);
      return t;
    }

    function speedOf(o) { return Math.hypot(o.vx, o.vy); }

    function applyFriction(o, fr, dt) {
      const s = speedOf(o);
      if (s <= 0) return;
      const ns = Math.max(0, s - fr * dt);
      const k = ns / s;
      o.vx *= k;
      o.vy *= k;
    }

    /** 台の ふちで はねかえる */
    function rails(o, e) {
      let hit = false;
      if (o.x - o.r < 0) { o.x = o.r; o.vx = Math.abs(o.vx) * e; hit = true; }
      if (o.x + o.r > W) { o.x = W - o.r; o.vx = -Math.abs(o.vx) * e; hit = true; }
      if (o.y - o.r < 0) { o.y = o.r; o.vy = Math.abs(o.vy) * e; hit = true; }
      if (o.y + o.r > H) { o.y = H - o.r; o.vy = -Math.abs(o.vy) * e; hit = true; }
      return hit;
    }

    /** まるい もの と ブロックの ぶつかり。ぶつかったら ブロックを かえす */
    function circleBlocks(o, e, onHit) {
      for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i];
        if (b.dead) continue;
        const px = clamp(o.x, b.x, b.x + b.w);
        const py = clamp(o.y, b.y, b.y + b.h);
        let dx = o.x - px;
        let dy = o.y - py;
        let d = Math.hypot(dx, dy);
        if (d >= o.r) continue;
        if (d < 0.001) { const s = speedOf(o) || 1; dx = -o.vx / s; dy = -o.vy / s; d = 1; } else { dx /= d; dy /= d; }
        const vn = o.vx * dx + o.vy * dy;
        if (onHit && onHit(b, -vn) === 'pass') continue;   // つきぬけ
        o.x = px + dx * o.r;
        o.y = py + dy * o.r;
        if (vn < 0) { o.vx -= (1 + e) * vn * dx; o.vy -= (1 + e) * vn * dy; }
      }
    }

    /** まるい もの どうし（重さで はじきあう）。ぶつかった ときの 相対速度を かえす */
    function collide(a, b, e) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (d >= min || d < 0.0001) return 0;
      const nx = dx / d;
      const ny = dy / d;
      const pen = min - d;
      const ta = b.m / (a.m + b.m);
      a.x -= nx * pen * ta;
      a.y -= ny * pen * ta;
      b.x += nx * pen * (1 - ta);
      b.y += ny * pen * (1 - ta);
      const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;   // a から b へ 近づく 速さ
      if (rv <= 0) return 0;
      const j = ((1 + e) * rv) / (1 / a.m + 1 / b.m);
      a.vx -= (j / a.m) * nx;
      a.vy -= (j / a.m) * ny;
      b.vx += (j / b.m) * nx;
      b.vy += (j / b.m) * ny;
      return rv;
    }

    function firstHit(t) {
      t.hits += 1;
      if (t.hits > 1) return;
      t.tapped = true;
      const T = TAKOS[t.kind];
      if (t.blast) explode(t.x, t.y, t.blast, 0.5, 'maki');
      if (T.hit === 'bomb') t.fuse = 1.0;
      if (T.hit === 'ink') {
        effects.push({ type: 'ink', x: t.x, y: t.y, t: 0, life: 1.2, r: 90 });
        blocks.forEach((b) => {
          if (b.dead || b.kind === 'R') return;
          const d = Math.hypot(clamp(t.x, b.x, b.x + b.w) - t.x, clamp(t.y, b.y, b.y + b.h) - t.y);
          if (d < 90) { b.inked = true; b.kind = b.kind === 'H' ? 'W' : b.kind; b.hp = Math.min(b.hp, 1); }
        });
        if (ika && !ika.dead && Math.hypot(ika.x - t.x, ika.y - t.y) < 90 + ika.r) { ika.inked = true; popText(ika.x, ika.y - 34, 'スミ！ ダメージ×1.5', '#d9c8ff'); }
      }
      if (T.hit === 'quake') explode(t.x, t.y, 130, 1, 'quake');
    }

    function collect(it) {
      const I = ITEMS[it.code];
      it.taken = true;
      got.push(it.code);
      const label = I.type === 'thrower' ? (THROWERS[I.key].name + 'が なかまに！') : (TAKOS[I.key].name + ' ゲット！');
      popText(it.x, it.y - 18, label, '#ffe36e');
      effects.push({ type: 'pop', x: it.x, y: it.y, t: 0, life: 0.5 });
      if (Hd.onItem) Hd.onItem(it.code, I.type, I.key);
    }

    function stepWorld(dt) {
      // タコ
      takos.forEach((t) => {
        if (t.dead) return;
        const T = TAKOS[t.kind];
        if (t.fuse > 0) {
          t.fuse -= dt;
          if (t.fuse <= 0) { t.dead = true; explode(t.x, t.y, 110, 2.5, 'bomb'); return; }
        }
        if (!t.moving) return;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.rot += t.spin * dt;
        for (let i = 0; i < items.length; i += 1) {
          const it = items[i];
          if (!it.taken && Math.hypot(it.x - t.x, it.y - t.y) < it.r + t.r) collect(it);
        }
        if (rails(t, t.bounce)) firstHit(t);
        circleBlocks(t, t.bounce, (b, vn) => {
          firstHit(t);
          if (vn < 40) return null;
          const pw = T.pierce ? 2 : 1;
          const before = b.hp;
          hitBlock(b, pw, !!T.pierce);                   // 二郎は かたい ブロックも けずる
          if (T.pierce && b.dead && before <= pw) { t.vx *= 0.8; t.vy *= 0.8; return 'pass'; }
          return null;
        });
        applyFriction(t, t.fr, dt);
        t.spin = (speedOf(t) / 400) * SPIN * Math.sign(t.spin || 1) + 0.3 * Math.sign(t.spin || 1);
        if (speedOf(t) < STOP) { t.vx = 0; t.vy = 0; t.moving = false; t.combo = 0; }
        Object.keys(t.cool).forEach((k) => { t.cool[k] -= dt; if (t.cool[k] <= 0) delete t.cool[k]; });
        if (!reduceMotion()) { t.trail.push(t.x, t.y); if (t.trail.length > 20) t.trail.splice(0, 2); }
      });
      // タコ どうし（場の タコに あてると コンボ）
      for (let i = 0; i < takos.length; i += 1) {
        const a = takos[i];
        if (a.dead) continue;
        for (let j = i + 1; j < takos.length; j += 1) {
          const b = takos[j];
          if (b.dead || (!a.moving && !b.moving)) continue;
          const rv = collide(a, b, 0.92);
          if (rv > 25) {
            const key = a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id;
            if (!a.cool[key]) {
              const c = Math.max(a.combo, b.combo) + 1;
              a.combo = c;
              b.combo = c;
              a.cool[key] = 0.2;
              bestCombo = Math.max(bestCombo, c);
              popText((a.x + b.x) / 2, (a.y + b.y) / 2 - 12, 'コンボ ' + c, '#ffe36e');
              firstHit(a);
              firstHit(b);
            }
            a.moving = true;
            b.moving = true;
          }
        }
      }
      // イカ
      if (ika && !ika.pocket) {
        ika.x += ika.vx * dt;
        ika.y += ika.vy * dt;
        rails(ika, 0.6);
        circleBlocks(ika, 0.5, null);
        takos.forEach((t) => {
          if (t.dead) return;
          // かすり判定：見た目より HIT_PAD だけ 広い。ふれて いなくても あたりに なる（道すじは そのまま）
          const dx = ika.x - t.x;
          const dy = ika.y - t.y;
          const dd = Math.hypot(dx, dy) || 1;
          const touch = ika.r + t.r;
          if (t.moving && !t.cool.ika && dd < touch + HIT_PAD) {
            const approach = (t.vx * dx + t.vy * dy) / dd;       // イカへ むかう 速さ
            if (approach > 15 || dd < touch) {
              t.cool.ika = 0.35;
              firstHit(t);
              const P = TAKOS[t.kind];
              const sp = clamp(Math.max(approach, speedOf(t) * 0.6) / 450, 0.5, 1.6);
              const hx = t.x + (dx / dd) * t.r;
              const hy = t.y + (dy / dd) * t.r;
              hurtIka(Math.max(1, P.dmg * t.power * sp) * (1 + 0.5 * t.combo), ika.x, ika.y, t.combo, hx, hy);   // 1回 あてれば かならず 1 は へる
            }
          }
          if (collide(t, ika, 0.85) > 0) t.moving = true;
        });
        applyFriction(ika, 340, dt);
        if (speedOf(ika) < STOP) { ika.vx = 0; ika.vy = 0; }
        // 穴に おちる
        for (let i = 0; i < POCKETS.length; i += 1) {
          const p = POCKETS[i];
          if (Math.hypot(ika.x - p.x, ika.y - p.y) < POCKET_IN) {
            ika.pocket = p;
            ika.vx = 0;
            ika.vy = 0;
            win(true);
            break;
          }
        }
      }
      if (ika && ika.pocket) {
        ika.fall = Math.min(1, ika.fall + dt * 2);
        ika.x += (ika.pocket.x - ika.x) * Math.min(1, dt * 8);
        ika.y += (ika.pocket.y - ika.y) * Math.min(1, dt * 8);
      }
      if (ika && ika.hurt > 0) ika.hurt -= dt;
      blocks.forEach((b) => { if (b.flash > 0) b.flash -= dt; });
      takos = takos.filter((t) => !t.dead);
      if (items.some((it) => it.taken)) items = items.filter((it) => !it.taken);
    }

    function everyoneQuiet() {
      if (pending.length) return false;
      if (takos.some((t) => t.moving || t.fuse > 0)) return false;
      return !ika || ika.pocket || speedOf(ika) < STOP;
    }

    // ---------- 投げる ----------
    function launchFrom() {
      // 発射口に 場の タコが いたら 横へ ずらす
      const r = TAKOS[takoKind].r * (THROWERS[thrower].size || 1);
      for (let k = 0; k < 12; k += 1) {
        const x = LAUNCH.x + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 34;
        const ok = takos.every((t) => Math.hypot(t.x - x, t.y - LAUNCH.y) > t.r + r + 2);
        if (ok) return { x: clamp(x, r + 4, W - r - 4), y: LAUNCH.y };
      }
      return { x: LAUNCH.x, y: LAUNCH.y };
    }

    /** はねかえりを ふくむ 道すじ。イカの かすり判定に 入ったら hit */
    function tracePath(from, dx, dy, max, r, speed) {
      // ほんものと 同じく、まさつと はねかえりで おそく なり、止まる ところで 線も おわる
      const T = TAKOS[takoKind];
      const e = T.bounce ? 0.97 : 0.85;
      let v = speed || MAX_SPEED;
      let x = from.x;
      let y = from.y;
      let dist = 0;
      const pts = [];
      const reach = ika && !ika.dead ? ika.r + r + HIT_PAD : -1;
      while (dist < max) {
        const v2 = v * v - 2 * T.fr * 3;
        if (v2 <= STOP * STOP) break;
        v = Math.sqrt(v2);
        x += dx * 3;
        y += dy * 3;
        dist += 3;
        if (x - r < 0 || x + r > W) { dx = -dx; x = clamp(x, r, W - r); v *= e; }
        if (y - r < 0 || y + r > H) { dy = -dy; y = clamp(y, r, H - r); v *= e; }
        const hitB = blocks.find((b) => !b.dead && x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h);
        if (hitB) {
          const ox = Math.min(x + r - hitB.x, hitB.x + hitB.w - (x - r));
          const oy = Math.min(y + r - hitB.y, hitB.y + hitB.h - (y - r));
          if (ox < oy) dx = -dx; else dy = -dy;
          x += dx * 3;
          y += dy * 3;
          v *= e;
        }
        pts.push(x, y, dist);
        if (reach > 0 && Math.hypot(ika.x - x, ika.y - y) < reach) return { pts, hit: true };
      }
      return { pts, hit: false };
    }

    /** ねらいの 向き。ナオは 4° 以内で イカに あたる 向きが あれば そちらへ よせる */
    function aimDir(a, from, r, max) {
      const base = Math.atan2(a.dy, a.dx);
      const P = THROWERS[thrower];
      const first = tracePath(from, a.dx, a.dy, max, r, a.speed);
      if (!P.assist || first.hit) return { ang: base, path: first, assisted: false };
      for (let o = 0.25; o <= 4.001; o += 0.25) {
        for (const sgn of [1, -1]) {
          const ang = base + ((sgn * o) / 4) * ASSIST;
          const p = tracePath(from, Math.cos(ang), Math.sin(ang), max, r, a.speed);
          if (p.hit) return { ang, path: p, assisted: true };
        }
      }
      return { ang: base, path: first, assisted: false };
    }

    function guideMax(a) { return THROWERS[thrower].guide * (0.55 + 0.45 * a.k); }

    function aimVector() {
      if (!pull) return null;
      const len = Math.hypot(pull.x, pull.y);
      if (len < 14) return null;
      const k = Math.min(1, len / MAX_PULL);
      return { dx: -pull.x / len, dy: -pull.y / len, speed: 250 + (MAX_SPEED - 250) * k, k };
    }

    function throwNow() {
      if (phase !== 'aim' || won) return false;
      const a = aimVector();
      pull = null;
      if (!a) return false;
      const P = THROWERS[thrower];
      const n = P.count || 1;
      const from = launchFrom();
      const dir = aimDir(a, from, TAKOS[takoKind].r * (P.size || 1), guideMax(a));
      for (let i = 0; i < n; i += 1) {
        const off = n > 1 ? (i - (n - 1) / 2) * 0.12 : 0;
        const ang = dir.ang + off + (rand() * 2 - 1) * P.wobble;
        const px = from.x + (n > 1 ? (i - (n - 1) / 2) * 14 : 0);
        spawnTako(takoKind, px, from.y, Math.cos(ang) * a.speed, Math.sin(ang) * a.speed, { power: P.power, blast: P.blast || 0, size: P.size || 1 });
      }
      phase = 'move';
      moveT = 0;
      quietT = 0;
      emitStats();
      if (Hd.onThrow) Hd.onThrow(takoKind, thrower);
      return true;
    }

    function useTap() {
      let used = false;
      takos.slice().forEach((t) => {
        if (t.tapped || t.dead || !t.moving) return;
        const T = TAKOS[t.kind];
        t.tapped = true;
        used = true;
        if (T.tap === 'split') {
          const sp = speedOf(t);
          const ang = Math.atan2(t.vy, t.vx);
          [-0.35, 0.35].forEach((da) => {
            const c = spawnTako(t.kind, t.x, t.y, Math.cos(ang + da) * sp, Math.sin(ang + da) * sp, { power: t.power, blast: 0, size: t.r / T.r });
            c.tapped = true;
            c.combo = t.combo;
          });
          effects.push({ type: 'pop', x: t.x, y: t.y, t: 0, life: 0.35 });
        }
        if (T.tap === 'dash' && ika && !ika.dead) {
          const dx = ika.x - t.x;
          const dy = ika.y - t.y;
          const d = Math.hypot(dx, dy) || 1;
          t.vx = (dx / d) * 900;
          t.vy = (dy / d) * 900;
          effects.push({ type: 'pop', x: t.x, y: t.y, t: 0, life: 0.35 });
        }
      });
      return used;
    }

    function update(dt) {
      if (phase === 'move' && hitStop > 0) {
        hitStop -= dt;                                   // あたった 瞬間：物理は 止めて、火花や 数字だけ うごかす
      } else if (phase === 'move') {
        let acc = dt;
        while (acc > 0) {
          const h = Math.min(STEP, acc);
          acc -= h;
          pending.forEach((p) => { p.t -= h; });
          const due = pending.filter((p) => p.t <= 0);
          pending = pending.filter((p) => p.t > 0);
          due.forEach((p) => p.fn());
          stepWorld(h);
        }
        moveT += dt;
        quietT = everyoneQuiet() ? quietT + dt : 0;
        if (quietT > 0.25 || moveT > 12 || (won && moveT > 0.2 && quietT > 0)) {
          takos.forEach((t) => { t.moving = false; t.vx = 0; t.vy = 0; t.combo = 0; });
          phase = won ? 'done' : 'aim';
          emitStats();
          if (Hd.onTurnEnd) Hd.onTurnEnd(stats());
        }
      } else if (ika && ika.pocket) {
        ika.fall = Math.min(1, ika.fall + dt * 2);
      }
      effects.forEach((e) => {
        e.t += dt;
        if (e.type === 'shard') { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.94; e.vy *= 0.94; e.rot += dt * 6; }
        if (e.type === 'text') e.y -= 30 * dt;
      });
      effects = effects.filter((e) => e.t < e.life);
      shakeAmt *= Math.pow(0.02, dt);
      if (shakeAmt < 0.3) shakeAmt = 0;
    }

    // =========================================================
    //  描画
    // =========================================================
    function draw() {
      ctx.save();
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = '#23506e';
      ctx.fillRect(0, 0, cssW, cssH);
      const sk = shakeAmt ? (Math.random() * 2 - 1) * shakeAmt : 0;
      ctx.translate(offX + sk * scale, offY);
      ctx.scale(scale, scale);

      // 台
      ctx.fillStyle = '#173a52';
      roundRect(-8, -8, W + 16, H + 16, 18);
      ctx.fill();
      ctx.fillStyle = '#a8d4e6';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      for (let x = CELL; x < W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LINE_Y); ctx.stroke(); }
      for (let y = CELL; y < LINE_Y; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // 発射口の ばしょ
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(0, LINE_Y, W, H - LINE_Y);
      ctx.strokeStyle = 'rgba(35,80,110,.5)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, LINE_Y); ctx.lineTo(W, LINE_Y); ctx.stroke();
      ctx.setLineDash([]);
      // 穴
      POCKETS.forEach((p) => {
        ctx.fillStyle = '#10202c';
        ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffe36e';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R + 2, 0, Math.PI * 2); ctx.stroke();
      });

      drawThrower();
      drawEffects('under');
      drawBlocks();
      drawItems();
      drawIka();
      takos.forEach(drawTako);
      if (phase === 'aim' && !won) drawAim();
      drawEffects('over');
      ctx.restore();
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawBlocks() {
      blocks.forEach((b) => {
        if (b.dead) return;
        const K = KINDS[b.kind];
        // よこから 見た 面（下に すこし）で 立体に
        ctx.fillStyle = K.side;
        ctx.fillRect(b.x, b.y + 6, b.w, b.h);
        ctx.fillStyle = K.fill;
        ctx.fillRect(b.x, b.y, b.w, b.h - 2);
        ctx.strokeStyle = K.edge;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 4);
        if (b.kind === 'H') {
          ctx.strokeStyle = 'rgba(109,128,147,.45)';
          ctx.beginPath();
          for (let k = 6; k < b.w + b.h; k += 10) { ctx.moveTo(b.x + Math.max(0, k - b.h), b.y + Math.min(k, b.h - 2)); ctx.lineTo(b.x + Math.min(k, b.w), b.y + Math.max(0, k - b.w)); }
          ctx.stroke();
        }
        if ((b.kind === 'W' && b.hp <= 1) || (b.kind === 'H' && b.hp < KINDS.H.hp)) {
          ctx.strokeStyle = 'rgba(80,90,100,.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.w * 0.25, b.y + 4); ctx.lineTo(b.x + b.w * 0.5, b.y + b.h * 0.45); ctx.lineTo(b.x + b.w * 0.4, b.y + b.h - 6);
          ctx.moveTo(b.x + b.w * 0.5, b.y + b.h * 0.45); ctx.lineTo(b.x + b.w - 5, b.y + b.h * 0.35);
          ctx.stroke();
        }
        if (b.kind === 'R') {
          ctx.fillStyle = '#ffe36e';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', b.x + b.w / 2, b.y + b.h / 2);
        }
        if (b.item) {
          ctx.fillStyle = b.kind === 'R' ? '#ffe36e' : '#d9a300';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('？', b.x + b.w / 2, b.y + b.h / 2 - 1);
        }
        if (b.inked) { ctx.fillStyle = 'rgba(40,30,60,.4)'; ctx.fillRect(b.x, b.y, b.w, b.h - 2); }
        if (b.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(b.x, b.y, b.w, b.h - 2); }
      });
    }

    function drawTakoBody(kind, x, y, r, rot, down, alpha) {
      const T = TAKOS[kind];
      ctx.save();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.translate(x, y);
      ctx.rotate(rot);
      const im = IMG[faceUrl(kind, down ? 'down' : 'normal')] || IMG[faceUrl(kind)];
      if (im) {
        const s = r * 2.9;
        ctx.drawImage(im, -s / 2, -s / 2, s, s);
      } else {
        ctx.fillStyle = T.color;
        for (let i = 0; i < 8; i += 1) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, r * 0.22, r * 0.4, a - Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.2, 0, Math.PI * 2); ctx.arc(r * 0.3, -r * 0.1, r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1b1b1b';
        ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.08, r * 0.09, 0, Math.PI * 2); ctx.arc(r * 0.32, -r * 0.08, r * 0.09, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function drawTako(t) {
      // 影
      ctx.fillStyle = 'rgba(0,0,0,.15)';
      ctx.beginPath(); ctx.ellipse(t.x + 2, t.y + t.r * 0.8, t.r * 0.9, t.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      if (t.moving && t.trail.length > 3) {
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        for (let i = 0; i < t.trail.length; i += 4) ctx.fillRect(t.trail[i] - 2, t.trail[i + 1] - 2, 4, 4);
      }
      if (!t.moving) {       // 場に のこって いる タコ：あてると コンボ の しるし
        ctx.strokeStyle = 'rgba(255,227,110,.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      drawTakoBody(t.kind, t.x, t.y, t.r, t.rot, false, 1);
      if (t.combo > 0 && t.moving) {
        ctx.fillStyle = '#ffe36e';
        ctx.strokeStyle = '#23506e';
        ctx.lineWidth = 3;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText('×' + (t.combo + 1), t.x, t.y - t.r - 6);
        ctx.fillText('×' + (t.combo + 1), t.x, t.y - t.r - 6);
      }
      if (t.fuse > 0) {
        ctx.fillStyle = '#e0533d';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.ceil(t.fuse * 3)), t.x, t.y - t.r - 6);
      }
    }

    function drawItems() {
      const pulse = 1 + Math.sin(Date.now() / 250) * 0.08;
      items.forEach((it) => {
        const I = ITEMS[it.code];
        const r = it.r * pulse;
        ctx.save();
        ctx.fillStyle = 'rgba(255,227,110,.45)';
        ctx.beginPath(); ctx.arc(it.x, it.y, r + 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = I.type === 'thrower' ? THROWERS[I.key].color : TAKOS[I.key].color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(it.x, it.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.clip();
        const im = IMG[faceUrl(I.key)] || img(faceUrl(I.key));
        if (im) {
          if (I.type === 'thrower') ctx.drawImage(im, it.x - r * 1.6, it.y - r * 1.05, r * 3.2, r * 3.2);
          else ctx.drawImage(im, it.x - r * 1.45, it.y - r * 1.45, r * 2.9, r * 2.9);
        } else {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(I.type === 'thrower' ? THROWERS[I.key].name.slice(0, 1) : TAKOS[I.key].short.slice(0, 1), it.x, it.y);
        }
        ctx.restore();
      });
    }

    function drawIka() {
      if (!ika) return;
      const k = ika.pocket ? 1 - ika.fall : 1;
      if (k <= 0.02) return;
      const r = ika.r * k;
      ctx.save();
      ctx.translate(ika.x, ika.y);
      const hk = ika.hurt > 0 ? ika.hurt / 0.3 : 0;
      if (hk > 0) { ctx.translate((Math.random() * 2 - 1) * 4 * hk, (Math.random() * 2 - 1) * 2 * hk); ctx.scale(1 + 0.14 * hk, 1 - 0.08 * hk); }
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(2, r * 0.85, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ika.inked ? '#b9a9d9' : '#fff1ea';
      ctx.strokeStyle = ika.hurt > 0 ? '#e0533d' : '#c07a6a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const im = IMG[faceUrl(stage.boss, ika.dead ? 'down' : 'normal')] || IMG[faceUrl(stage.boss)];
      if (im) {
        const s = r * 2.5;
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(im, -s / 2, -s * 0.36, s, s);
        ctx.restore();
        if (hk > 0) {                                     // 白く 光る
          ctx.save();
          ctx.globalAlpha = 0.75 * hk;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#f3ddd2';
        ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.6, -r * 0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1b1b1b';
        if (ika.dead) { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('× ×', 0, r * 0.2); }
        else { ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.1, r * 0.1, 0, Math.PI * 2); ctx.arc(r * 0.25, r * 0.1, r * 0.1, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
      // 体力の ハート（ひとつ ＝ 1）
      if (!ika.pocket) {
        const n = Math.ceil(ika.maxHp);
        const per = Math.min(11, 150 / n);
        const x0 = ika.x - (n * per) / 2 + per / 2;
        for (let i = 0; i < n; i += 1) {
          const fillR = clamp(ika.hp - i, 0, 1);
          ctx.fillStyle = 'rgba(35,80,110,.35)';
          ctx.beginPath(); ctx.arc(x0 + i * per, ika.y - ika.r - 10, per * 0.42, 0, Math.PI * 2); ctx.fill();
          if (fillR > 0) {
            ctx.fillStyle = '#e0533d';
            ctx.beginPath(); ctx.arc(x0 + i * per, ika.y - ika.r - 10, per * 0.42 * Math.sqrt(fillR), 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    function drawThrower() {
      const P = THROWERS[thrower];
      const im = IMG[faceUrl(thrower)];
      const x = 44;
      const y = H - 46;
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = P.color; ctx.lineWidth = 4; ctx.stroke();
      ctx.clip();
      if (im) ctx.drawImage(im, x - 44, y - 30, 88, 88);
      else {
        ctx.fillStyle = P.color;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(P.name, x, y);
      }
      ctx.restore();
    }

    /** 予測線：台の ふちと ブロックで はねかえる 道すじ（人に よって 長さが ちがう） */
    function drawAim() {
      const P = THROWERS[thrower];
      const from = launchFrom();
      const r = TAKOS[takoKind].r * (P.size || 1);
      const a = aimVector();
      if (!a) {
        // まだ 引いて いない：発射口に タコと、さわる しるし
        drawTakoBody(takoKind, from.x, from.y, r, 0, false, 1);
        ctx.strokeStyle = 'rgba(255,255,255,.95)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(from.x, from.y, r + 10 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        return;
      }
      const max = guideMax(a);
      const dir = aimDir(a, from, r, max);
      const pts = dir.path.pts;
      ctx.fillStyle = dir.assisted ? '#ffe36e' : '#ffffff';
      let next = 14;
      for (let i = 0; i < pts.length; i += 3) {
        if (pts[i + 2] < next) continue;
        next += 14;
        ctx.globalAlpha = Math.max(0.15, 1 - pts[i + 2] / (max + 40));
        ctx.beginPath(); ctx.arc(pts[i], pts[i + 1], 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (dir.path.hit) {                                  // あたる：イカを 光らせる
        ctx.strokeStyle = '#ffe36e';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ika.x, ika.y, ika.r + 6 + Math.sin(Date.now() / 120) * 2, 0, Math.PI * 2); ctx.stroke();
      }
      if (dir.assisted) {
        ctx.fillStyle = '#23506e';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ナオの ねらい補正', from.x, from.y - 28);
      }
      // 引っぱりの 矢じるし（発射口から うしろへ）
      const back = 20 + 50 * a.k;
      ctx.strokeStyle = 'rgba(35,80,110,.7)';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(from.x - Math.cos(dir.ang) * back, from.y - Math.sin(dir.ang) * back); ctx.stroke();
      const n = P.count || 1;
      for (let i = 0; i < n; i += 1) drawTakoBody(takoKind, from.x + (n > 1 ? (i - 1) * 14 : 0), from.y, r, 0, false, 1);
      // つよさ
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(W - 110, H - 22, 96, 10);
      ctx.fillStyle = a.k > 0.95 ? '#e0533d' : '#ffe36e';
      ctx.fillRect(W - 110, H - 22, 96 * a.k, 10);
    }

    function drawEffects(layer) {
      effects.forEach((e) => {
        const k = e.t / e.life;
        if (layer === 'under') {
          if (e.type === 'ink') {
            ctx.fillStyle = `rgba(40,30,60,${0.4 * (1 - k)})`;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r * Math.min(1, k * 4), 0, Math.PI * 2); ctx.fill();
          }
          return;
        }
        if (e.type === 'shard') {
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.translate(e.x, e.y); ctx.rotate(e.rot);
          ctx.fillStyle = e.color; ctx.fillRect(-e.size / 2, -e.size / 2, e.size, e.size);
          ctx.restore();
        } else if (e.type === 'blast') {
          const col = e.look === 'quake' ? '255,255,255' : e.look === 'maki' ? '255,227,110' : '255,120,60';
          ctx.fillStyle = `rgba(${col},${0.45 * (1 - k)})`;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.3 + 0.7 * k), 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `rgba(${col},${1 - k})`;
          ctx.lineWidth = 5;
          ctx.stroke();
        } else if (e.type === 'spark') {
          const n = e.big ? 12 : 8;
          const R = (e.big ? 34 : 24) * (0.4 + k);
          ctx.strokeStyle = e.big ? `rgba(255,227,110,${1 - k})` : `rgba(255,255,255,${1 - k})`;
          ctx.lineWidth = e.big ? 5 : 4;
          ctx.beginPath();
          for (let i = 0; i < n; i += 1) {
            const a = (i / n) * Math.PI * 2;
            ctx.moveTo(e.x + Math.cos(a) * R * 0.45, e.y + Math.sin(a) * R * 0.45);
            ctx.lineTo(e.x + Math.cos(a) * R, e.y + Math.sin(a) * R);
          }
          ctx.stroke();
        } else if (e.type === 'pop') {
          ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(e.x, e.y, 16 + k * 26, 0, Math.PI * 2); ctx.stroke();
        } else if (e.type === 'text') {
          ctx.globalAlpha = Math.min(1, 2 * (1 - k));
          const pop = e.size > 18 ? 1 + 0.35 * Math.max(0, 1 - k * 5) : 1;   // 出た 瞬間 すこし 大きく
          ctx.font = `bold ${Math.round(e.size * pop)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.lineWidth = e.size > 18 ? 6 : 4;
          ctx.strokeStyle = '#23506e';
          ctx.strokeText(e.text, clamp(e.x, 70, W - 70), e.y);
          ctx.fillStyle = e.color;
          ctx.fillText(e.text, clamp(e.x, 70, W - 70), e.y);
          ctx.globalAlpha = 1;
        }
      });
    }

    // =========================================================
    //  入力（画面の どこでも 引っぱって はなす）
    // =========================================================
    function onDown(e) {
      if (pointer) return;
      if (phase === 'move') { useTap(); return; }
      if (phase !== 'aim' || won) return;
      pointer = { id: e.pointerId, sx: e.clientX, sy: e.clientY };
      pull = { x: 0, y: 0 };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* とれなくても つづける */ }
      e.preventDefault();
    }
    function onMove(e) {
      if (!pointer || e.pointerId !== pointer.id) return;
      // 画面の px を 台の 大きさに なおす（画面が 小さくても 同じ 手ごたえ）
      pull = { x: (e.clientX - pointer.sx) / Math.max(0.5, scale), y: (e.clientY - pointer.sy) / Math.max(0.5, scale) };
    }
    function onUp(e) {
      if (!pointer || e.pointerId !== pointer.id) return;
      pointer = null;
      throwNow();
    }

    // キーボード：← → で 向き、↑ ↓ で 強さ、スペースか Enter で 投げる
    const keyAim = { a: -Math.PI / 2, p: 0.7 };
    function onKey(e) {
      if (!canvas.isConnected || canvas.offsetParent === null) return;
      if (e.target && e.target.closest && e.target.closest('button, input, [role="dialog"]')) return;
      if (phase === 'move') { if (e.key === ' ' || e.key === 'Enter') { useTap(); e.preventDefault(); } return; }
      if (phase !== 'aim') return;
      const k = e.key;
      if (k === 'ArrowLeft') keyAim.a -= 0.04;
      else if (k === 'ArrowRight') keyAim.a += 0.04;
      else if (k === 'ArrowUp') keyAim.p += 0.05;
      else if (k === 'ArrowDown') keyAim.p -= 0.05;
      else if (k === ' ' || k === 'Enter') { if (pull) throwNow(); e.preventDefault(); return; }
      else return;
      e.preventDefault();
      keyAim.p = clamp(keyAim.p, 0.15, 1);
      const len = keyAim.p * MAX_PULL;
      pull = { x: -Math.cos(keyAim.a) * len, y: -Math.sin(keyAim.a) * len };
    }

    if (canvas.addEventListener) {
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', () => { pointer = null; pull = null; });
    }
    if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', onKey);
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', resize);

    // ---------- ループ ----------
    let last = 0;
    let running = false;
    let paused = false;
    function frame(now) {
      if (!running) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!paused) update(dt);
      draw();
      requestAnimationFrame(frame);
    }
    function start() {
      resize();
      if (running) return;
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    }

    return {
      load, setTako, setThrower, start, resize,
      pause(v) { paused = !!v; },
      get phase() { return phase; },
      stats,
      bossDown() { if (ika) ika.dead = true; },
      // テスト用（node で 物理だけ まわす）
      _sim: {
        step: update, draw,
        blocks: () => blocks, takos: () => takos, ika: () => ika,
        aim(dx, dy, k, who, kind) {
          if (who) setThrower(who);
          if (kind) setTako(kind);
          const len = Math.max(15, k * MAX_PULL);
          const d = Math.hypot(dx, dy) || 1;
          pull = { x: (-dx / d) * len, y: (-dy / d) * len };
          return throwNow();
        },
        tap: useTap,
        runUntilQuiet(maxT) { let t = 0; while (phase === 'move' && t < (maxT || 15)) { update(1 / 30); t += 1 / 30; } return stats(); },
        save() { return JSON.stringify({ blocks, items, got, takos, ika, won, pocketWin, bestCombo, seed, nextId, phase }); },
        restore(s) { const o = JSON.parse(s); blocks = o.blocks; items = o.items; got = o.got; takos = o.takos; ika = o.ika; won = o.won; pocketWin = o.pocketWin; bestCombo = o.bestCombo; seed = o.seed; nextId = o.nextId; phase = o.phase; effects = []; pending = []; },
      },
    };
  }

  window.TakoGame = { create, TAKOS, TAKO_ORDER, THROWERS, KINDS, ITEMS, parseBoard, W, H, CELL, LAUNCH, LINE_Y };
})();
