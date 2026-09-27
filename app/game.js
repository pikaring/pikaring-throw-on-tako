/* 街と、その白い壁 ―― 物理と 描画（ライブラリなし）。window.TakoGame を つくる。
 *
 *   const g = TakoGame.create(canvas, { onStats, onThrow, onTurnEnd });
 *   g.load(level, { bg, boss, bossName })   城を 組む（level は stages.js の 1つ）
 *   g.setTako('tako1') / g.setThrower('nao')  つぎに 投げる タコと 投げる 人
 *   g.start()                                 描画ループ（load の あと 1回）
 *
 * 物理の かんがえ方（あえて 簡単に している）：
 *   - ブロックは 回らない 四角。落ちて いる 間だけ 見た目を すこし かたむける
 *   - 止まった ブロックは 「ねむる」。下の 支えが なくなるか、重心が 支えの 外に でたら 起きて すべり落ちる
 *   - 城の 土台 以外の ブロックが 地面に ふれたら 消える（＝こわした 数に 入る）
 *   - タコは 丸。ブロックの 体力より 強く あたれば つきぬけ、弱ければ はねかえって ブロックを おす
 */
(() => {
  'use strict';

  // ---------- 世界の 大きさ（単位は ワールドの 点。画面には 縮めて 出す） ----------
  const CELL = 34;
  const GROUND = 600;          // 地面の 高さ（y は 下むきが ＋）
  const WORLD_W = 1500;
  const VIEW_H = 660;          // これだけの 高さが かならず 画面に 入る
  const VIEW_MIN_W = 640;      // たて長の 画面でも これだけの 幅は 見せる（城は ねらう あいだ 右上の 小窓に 出す）
  const VIEW_MIN_H = 560;      // よこ長で 拡大しても これだけの 高さは 見せる（城の てっぺんと イカが 入る）
  const CASTLE_X = 930;        // 城の 左はし（城の 幅に あわせて ずらす）
  const ANCHOR = { x: 205, y: 468 };   // タコを かまえる 位置
  const GRAV = 900;
  const MAX_PULL = 125;
  const MAX_SPEED = 1000;
  const STEP = 1 / 120;
  const SPIN = 2.2;            // タコの まわる はやさ（ゆっくり くるくる）
  const BLAST_PUSH = 300;      // 爆発で ブロックを おしとばす いきおい
  const FALL_HURT = 240;       // これより はやく ぶつかると ブロックどうしが きずつく
  const BOMB_R = 135;          // 六郎の 大ばくはつ
  const BOMB_POW = 5.5;
  const QUAKE_R = 260;         // 大王の ゆれ
  const INK_R = 120;          // 七郎の スミの 半径
  const RED_R = 105;           // 赤い ブロックの 爆発の 半径（となりの となりまで とどく）
  const RED_POW = 4.2;         // その 強さ（白は まん中 近くなら こわれる。かたいのは のこる）

  // ---------- タコ ----------
  // mass：重さ（あたった ときの 強さ）、bounce：はねかえり、tap：空中で タップした ときの わざ、hit：あたった ときの わざ
  const TAKOS = {
    tako1: { name: 'タコ一郎', short: '一郎', r: 17, mass: 1,   bounce: 0.3,  note: 'ふつうの タコ',             color: '#e0533d' },
    tako2: { name: 'タコ二郎', short: '二郎', r: 19, mass: 2.3, bounce: 0.15, note: 'おもくて つきぬける',       color: '#d9731f' },
    tako3: { name: 'タコ三郎', short: '三郎', r: 17, mass: 1,   bounce: 0.85, note: 'よく はねる',               color: '#c0398a', life: 9 },
    tako4: { name: 'タコ四郎', short: '四郎', r: 17, mass: 0.9, bounce: 0.3,  note: 'タップで 3びきに わかれる', color: '#3f8f57', tap: 'split' },
    tako5: { name: 'タコ五郎', short: '五郎', r: 17, mass: 1.2, bounce: 0.2,  note: 'タップで まっすぐ 下へ',    color: '#2f6fb0', tap: 'dive' },
    tako6: { name: 'タコ六郎', short: '六郎', r: 18, mass: 1,   bounce: 0.2,  note: 'あたって すこし したら ばくはつ', color: '#b8860b', hit: 'bomb' },
    tako7: { name: 'タコ七郎', short: '七郎', r: 17, mass: 1,   bounce: 0.3,  note: 'スミで まわりを もろく する', color: '#4b3f63', hit: 'ink' },
    daiou: { name: 'タコ大王', short: '大王', r: 30, mass: 3.2,   bounce: 0.1,  note: '大きな ゆれで 城ごと ゆらす', color: '#8e1b1b', hit: 'quake' },
  };
  const TAKO_ORDER = ['tako1', 'tako2', 'tako3', 'tako4', 'tako5', 'tako6', 'tako7', 'daiou'];

  // ---------- 投げる 人 ----------
  // power：破壊力、wobble：ねらいの ぶれ（ラジアン）、guide：予測線の ながさ（0〜1）、
  // blast：あたった ときの 爆発の 半径、count／size：いっぺんに 投げる かずと 大きさ
  const THROWERS = {
    nao:   { name: 'ナオ', power: 0.7,  wobble: 0.008, guide: 1,    note: 'ねらい ◎ ／ 力 △',   color: '#27407a' },
    fumi:  { name: 'フミ', power: 1.5,  wobble: 0.13,  guide: 0.3,  note: 'ねらい △ ／ 力 ◎',   color: '#d9731f' },
    maki:  { name: 'マキ', power: 1.0,  wobble: 0.04,  guide: 0.55, note: 'あたると ばくはつ',  color: '#1f7a3d', blast: 88 },
    chika: { name: 'チカ', power: 0.55, wobble: 0.05,  guide: 0.55, note: 'ちいさく 3びき',     color: '#b0457a', count: 3, size: 0.72 },
  };

  // ---------- ブロック ----------
  const KINDS = {
    W: { hp: 3,   fill: '#fbfbf8', edge: '#b9c3cc' },   // 白い ブロック
    H: { hp: 8,   fill: '#dfe7ee', edge: '#7d8fa0' },   // かたい ブロック
    R: { hp: 1,   fill: '#e0533d', edge: '#8e1b1b' },   // 赤い ブロック（ばくはつ）
  };

  const IMG = {};   // url → Image（読めた ものだけ）
  function img(url) {
    if (!url) return null;
    if (url in IMG) return IMG[url];
    IMG[url] = null;
    const im = new Image();
    im.onload = () => { if (im.naturalWidth > 0) IMG[url] = im; };
    im.src = url;
    return null;
  }
  const faceUrl = (key, face) => 'images/story/' + key + '-' + (face || 'normal') + '.png';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const reduceMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // =========================================================
  //  城の 図面（文字の 絵）→ ブロック
  //    W 白  H かたい  R 赤。 '-' は 左の ブロックを 右へ のばす、'|' は 上の ブロックを 下へ のばす
  //    いちばん 下の 行が 地面に のる
  // =========================================================
  function parseCastle(rows) {
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const x0 = Math.round(Math.min(CASTLE_X, WORLD_W - 90 - w * CELL));
    const top = GROUND - h * CELL;
    const blocks = [];
    for (let r = 0; r < h; r += 1) {
      for (let c = 0; c < rows[r].length; c += 1) {
        const ch = rows[r][c];
        if (!KINDS[ch]) continue;
        let cw = 1;
        while (rows[r][c + cw] === '-') cw += 1;
        let chh = 1;
        while (rows[r + chh] && rows[r + chh][c] === '|') chh += 1;
        const k = KINDS[ch];
        blocks.push({
          kind: ch, x: x0 + c * CELL, y: top + r * CELL, w: cw * CELL, h: chh * CELL,
          hp: k.hp, maxHp: k.hp, vx: 0, vy: 0, awake: false, still: 0, tip: 0, rot: 0,
          base: r + chh === h, dead: false, inked: false, flash: 0, jam: 0, jammed: false, sup: true,
        });
      }
    }
    return blocks;
  }

  // =========================================================
  function create(canvas, handlers) {
    const H = handlers || {};
    const ctx = canvas.getContext('2d');

    let blocks = [];
    let takos = [];
    let effects = [];     // { type, x, y, t, life, … }
    let pending = [];     // { t, fn } 時間差の できごと（赤い ブロックの 連鎖 など）
    let total = 0;
    let broken = 0;
    let topoDirty = true;
    let supTick = 0;  // ブロックが 消えた／うごいた → 支えを しらべなおす
    let level = null;
    let stage = { bg: '', bgColor: '#a8d4e6', boss: '', bossName: '' };
    let boss = null;      // { perch, x, y, vy, down }

    let takoKind = 'tako1';
    let thrower = 'nao';

    // 'intro'（城を 見せる）→ 'aim' → 'fly' → 'settle' → 'aim' | 'done'
    let phase = 'aim';
    let flyT = 0;
    let quietT = 0;

    // カメラ
    let scale = 1;
    let viewW = VIEW_MIN_W;
    let viewH = VIEW_H;
    let camX = 0;
    let camTarget = 0;
    let follow = true;    // 飛んで いる タコを 追う（指で うごかしたら やめる）
    let introT = 0;

    // 入力
    let pull = null;      // { x, y } かまえの ひっぱり（ANCHOR からの ずれ）
    let pointer = null;   // { id, mode: 'aim' | 'pan' | 'tap', sx, lastX }
    let seed = 1;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    // ---------- 大きさ ----------
    let cssW = 0;
    let cssH = 0;
    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(cssH / VIEW_H, cssW / VIEW_MIN_W);
      // よこ長で 世界より 広く 見えて しまう ときは 拡大して 世界の 幅に 収める（高さは VIEW_MIN_H まで）
      if (cssW / scale > WORLD_W) scale = Math.min(cssW / WORLD_W, cssH / VIEW_MIN_H);
      viewW = cssW / scale;
      viewH = cssH / scale;
      camX = clamp(camX, minCam(), maxCam());
    }
    // 見える 幅が 世界より 広い ときは まん中に 置く（外がわも 地面・壁を 描く）
    const minCam = () => Math.min(0, (WORLD_W - viewW) / 2);
    const maxCam = () => Math.max(minCam(), WORLD_W - viewW);
    const worldTop = () => GROUND + 50 - viewH;      // 画面の いちばん上の ワールド y
    const toWorld = (sx, sy) => ({ x: sx / scale + camX, y: sy / scale + worldTop() });

    // ---------- 読みこみ ----------
    function load(lv, st) {
      level = lv;
      stage = Object.assign({ bg: '', bgColor: '#a8d4e6', boss: '', bossName: '' }, st || {});
      blocks = parseCastle(lv.rows);
      takos = [];
      effects = [];
      pending = [];
      total = blocks.length;
      broken = 0;
      topoDirty = true;
      seed = 7 + (lv.no || 1) * 131;
      // イカは いちばん 高い ブロックの 上に すわる
      let perch = null;
      blocks.forEach((b) => { if (!perch || b.y < perch.y || (b.y === perch.y && Math.abs(b.x + b.w / 2 - 1200) < Math.abs(perch.x + perch.w / 2 - 1200))) perch = b; });
      boss = stage.boss ? { perch, x: perch ? perch.x + perch.w / 2 : 1200, y: perch ? perch.y : GROUND, vy: 0, down: false, fall: false, rot: 0 } : null;
      if (stage.bg) img(stage.bg);
      if (stage.boss) { img(faceUrl(stage.boss)); img(faceUrl(stage.boss, 'down')); }
      pull = null;
      phase = 'intro';
      introT = reduceMotion() ? 0.01 : 2.2;
      camX = minCam();
      camTarget = maxCam();
      follow = true;
      emitStats();
    }

    function setTako(k) { if (TAKOS[k]) { takoKind = k; img(faceUrl(k)); img(faceUrl(k, 'down')); } }
    function setThrower(k) { if (THROWERS[k]) { thrower = k; img(faceUrl(k)); } }

    function emitStats() {
      if (H.onStats) H.onStats({ broken, total, ratio: total ? broken / total : 0, phase });
    }

    // =========================================================
    //  物理
    // =========================================================
    const massOf = (b) => (b.w * b.h) / (CELL * CELL) * (b.kind === 'H' ? 2 : 1);

    function destroy(b, why) {
      if (b.dead) return;
      b.dead = true;
      topoDirty = true;
      for (let i = 0; i < blocks.length; i += 1) blocks[i].jammed = false;
      broken += 1;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const n = reduceMotion() ? 2 : 7;
      for (let i = 0; i < n; i += 1) {
        const a = rand() * Math.PI * 2;
        const sp = 80 + rand() * 260;
        effects.push({ type: 'shard', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, t: 0, life: 0.7 + rand() * 0.4,
          size: 6 + rand() * 8, rot: rand() * 6, color: b.inked ? '#4b3f63' : KINDS[b.kind].fill });
      }
      if (why === 'ground') effects.push({ type: 'dust', x: cx, y: GROUND, t: 0, life: 0.5, w: b.w });
      if (b.kind === 'R') pending.push({ t: 0.12, fn: () => explode(cx, cy, RED_R, RED_POW, 'red') });
      emitStats();
    }

    /** 爆発：半径 R の 中の ブロックに ダメージと 外むきの いきおい */
    function explode(x, y, R, power, look) {
      effects.push({ type: 'blast', x, y, t: 0, life: 0.45, r: R, look: look || 'red' });
      shake(look === 'quake' ? 14 : 8);
      blocks.forEach((b) => {
        if (b.dead) return;
        const px = clamp(x, b.x, b.x + b.w);
        const py = clamp(y, b.y, b.y + b.h);
        const d = Math.hypot(px - x, py - y);
        if (d > R) return;
        const f = 1 - d / R;
        hurt(b, power * (0.35 + 0.65 * f));
        if (b.dead) return;
        const cx = b.x + b.w / 2 - x;
        const cy = b.y + b.h / 2 - y;
        const len = Math.hypot(cx, cy) || 1;
        const m = massOf(b);
        wake(b);
        b.vx += (cx / len) * BLAST_PUSH * f / Math.sqrt(m);
        b.vy += ((cy / len) * BLAST_PUSH * f - 100 * f) / Math.sqrt(m);
      });
    }

    function hurt(b, dmg) {
      if (b.dead || dmg <= 0) return;
      b.hp -= dmg;
      b.flash = 0.15;
      if (b.hp <= 0.001) destroy(b, 'hit');
    }

    function wake(b) { if (!b.dead) { b.awake = true; b.still = 0; } }

    let shakeAmt = 0;
    function shake(a) { if (!reduceMotion()) shakeAmt = Math.max(shakeAmt, a); }

    /** 支え：真下で ふれて いる ブロックの 横の はんい。地面なら Infinity */
    function support(b) {
      if (b.y + b.h >= GROUND - 1.5) return { lo: -Infinity, hi: Infinity };
      let lo = Infinity;
      let hi = -Infinity;
      const bottom = b.y + b.h;
      for (let i = 0; i < blocks.length; i += 1) {
        const s = blocks[i];
        if (s === b || s.dead) continue;
        if (Math.abs(s.y - bottom) > 1.5) continue;
        const l = Math.max(s.x, b.x);
        const r = Math.min(s.x + s.w, b.x + b.w);
        if (r - l <= 0.01) continue;                  // collideBlocks と おなじ しきい値（ずれると 宙で 止まる）
        lo = Math.min(lo, l);
        hi = Math.max(hi, r);
      }
      return lo <= hi ? { lo, hi } : null;
    }

    /** dir の がわ（-1 左／1 右）に ぴったり となりあう ブロックが あるか（あれば すべり出せない） */
    function wedged(b, dir) {
      const edge = dir > 0 ? b.x + b.w : b.x;
      for (let i = 0; i < blocks.length; i += 1) {
        const s = blocks[i];
        if (s === b || s.dead) continue;
        const face = dir > 0 ? s.x : s.x + s.w;
        if (Math.abs(face - edge) > 1.5) continue;
        if (Math.min(s.y + s.h, b.y + b.h) - Math.max(s.y, b.y) > b.h * 0.5) return true;
      }
      return false;
    }

    function stepBlocks(dt) {
      // 支えを しらべる（なにも うごいて いない ときは しらべない ―― 軽く する ため）
      let anyAwake = false;
      for (let i = 0; i < blocks.length && !anyAwake; i += 1) if (!blocks[i].dead && blocks[i].awake) anyAwake = true;
      if (anyAwake || topoDirty) {
        // ねむって いる ブロックは 4ステップに 1回（1/30秒）だけ しらべる。起きて いる ものは 毎回
        supTick = (supTick + 1) % 4;
        const all = topoDirty || supTick === 0;
        topoDirty = false;
        for (let i = 0; i < blocks.length; i += 1) {
          const b = blocks[i];
          if (b.dead || (!b.awake && !all)) continue;
          const sp = support(b);
          const cx = b.x + b.w / 2;
          b.sup = !!sp;
          if (!sp) { if (!b.awake) wake(b); b.tip = 0; continue; }
          let tip = 0;
          if (cx < sp.lo - 1) tip = -1; else if (cx > sp.hi + 1) tip = 1;
          if (tip && !b.jammed && !wedged(b, tip)) { wake(b); b.tip = tip; } else b.tip = 0;
        }
      }
      // 起きて いる ブロック：うごかす
      for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i];
        if (b.dead || !b.awake) continue;
        b.vy += GRAV * dt;
        if (b.tip) {                                  // 重心が はみ出して いる → そちらへ すべり落ちる
          b.vx += b.tip * 320 * dt;
          b.rot += b.tip * dt * 2.2;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.flash > 0) b.flash -= dt;
      }
      // ぶつかり（2回 まわして 積みかさねを おちつかせる）
      for (let pass = 0; pass < 2; pass += 1) {
        for (let i = 0; i < blocks.length; i += 1) {
          const a = blocks[i];
          if (a.dead || !a.awake) continue;
          for (let j = 0; j < blocks.length; j += 1) {
            if (i === j) continue;
            const b = blocks[j];
            if (b.dead) continue;
            if (b.awake && j < i) continue;   // 起きて いる 同士は 1回だけ
            if (b.x >= a.x + a.w || a.x >= b.x + b.w || b.y >= a.y + a.h || a.y >= b.y + b.h) continue;   // はなれて いる
            collideBlocks(a, b);
            if (a.dead) break;
          }
        }
      }
      // 地面・世界の はし・ねむり
      for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i];
        if (b.dead || !b.awake) continue;
        if (b.y + b.h >= GROUND) {
          if (!b.base) { destroy(b, 'ground'); continue; }
          b.y = GROUND - b.h;
          if (b.vy > 0) b.vy = 0;
          b.vx *= 0.9;
        }
        if (b.x > WORLD_W + 60 || b.x + b.w < -60) { destroy(b, 'out'); continue; }
        const speed = Math.abs(b.vx) + Math.abs(b.vy);
        // すべり落ちる はずが なにかに つっかえて 動けない → 「つっかえ」として ねむる（まわりが こわれたら また しらべる）
        if (b.tip && speed < 14) { b.jam += dt; if (b.jam > 0.8) { b.jammed = true; b.tip = 0; } } else b.jam = 0;
        if (speed < 14 && !b.tip && b.sup) {
          b.still += dt;
          if (b.still > 0.2) { b.awake = false; b.vx = 0; b.vy = 0; b.still = 0; }
        } else b.still = 0;
        // 見た目の かたむき：宙に うくと まわり、おちつくと もどる
        if (!b.tip) b.rot *= 0.9;
      }
    }

    function collideBlocks(a, b) {
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox <= 0.01 || oy <= 0.01) return;
      const ma = massOf(a);
      const mb = massOf(b);
      let nx = 0;
      let ny = 0;
      const above = a.y + a.h / 2 < b.y + b.h / 2;
      // a が 上なら n は 上むき。数px の 段差は 横から ぶつからずに のりこえる（ひっかかって 止まらない ように）
      if (oy < ox || (above && oy <= 5 && ox > 0.5)) ny = above ? -1 : 1;
      else nx = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
      const pen = ny ? oy : ox;
      // a から 見て b へ むかう 速さ
      const rv = (a.vx - (b.awake ? b.vx : 0)) * -nx + (a.vy - (b.awake ? b.vy : 0)) * -ny;
      if (!b.awake) {
        if (rv > FALL_HURT) {                               // はやく ぶつかった → 相手も 起こして いきおいを わける
          const dmg = (rv - FALL_HURT) / 300 * Math.sqrt(ma);
          hurt(b, dmg);
          hurt(a, dmg * 0.6);
          if (b.dead || a.dead) return;
          wake(b);
          const share = rv * (ma / (ma + mb));
          b.vx += -nx * share;
          b.vy += -ny * share * 0.5;
          a.vx += nx * share;
          a.vy += ny * share;
        } else {                                      // ゆっくり → 動かない 相手として おしもどす
          a.x += nx * pen;
          a.y += ny * pen;
          if (ny) { if (a.vy * ny < 0) a.vy = 0; if (!a.tip) a.vx *= 0.82; } else if (a.vx * nx < 0) a.vx = -a.vx * 0.1;
          return;
        }
      }
      // 起きて いる 同士：重さで おしわける
      const ta = mb / (ma + mb);
      a.x += nx * pen * ta;
      a.y += ny * pen * ta;
      b.x -= nx * pen * (1 - ta);
      b.y -= ny * pen * (1 - ta);
      if (rv > 0) {
        const j = (1.05 * rv) / (1 / ma + 1 / mb);
        a.vx += (nx * j) / ma;
        a.vy += (ny * j) / ma;
        b.vx -= (nx * j) / mb;
        b.vy -= (ny * j) / mb;
      }
      if (ny) { const f = (a.vx - b.vx) * 0.12; a.vx -= f; b.vx += f; }
    }

    // ---------- タコ ----------
    function spawnTako(kind, x, y, vx, vy, opt) {
      const T = TAKOS[kind];
      const o = opt || {};
      const size = o.size || 1;
      takos.push({
        kind, x, y, vx, vy, r: T.r * size, mass: T.mass * size * size, power: o.power || 1, blast: o.blast || 0,
        rot: 0, spin: (vx >= 0 ? 1 : -1) * SPIN, hits: 0, life: 0, rest: 0, fuse: -1, tapped: !T.tap, diving: false,
        dead: false, fade: 0, trail: [], child: !!o.child,
      });
    }

    function stepTakos(dt) {
      for (let i = 0; i < takos.length; i += 1) {
        const t = takos[i];
        if (t.dead) continue;
        const T = TAKOS[t.kind];
        if (t.fade > 0) { t.fade += dt; if (t.fade > 0.5) t.dead = true; continue; }
        t.life += dt;
        t.vy += GRAV * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.rot += t.spin * dt;
        if (t.fuse > 0) {
          t.fuse -= dt;
          if (t.fuse <= 0) { explode(t.x, t.y, BOMB_R, BOMB_POW, 'red'); t.dead = true; continue; }
        }
        // ブロック
        for (let j = 0; j < blocks.length; j += 1) {
          const b = blocks[j];
          if (b.dead) continue;
          const px = clamp(t.x, b.x, b.x + b.w);
          const py = clamp(t.y, b.y, b.y + b.h);
          let dx = t.x - px;
          let dy = t.y - py;
          let d = Math.hypot(dx, dy);
          if (d >= t.r) continue;
          if (d < 0.001) {                             // 中心が 中に 入った：来た 向きの 逆へ
            const sp = Math.hypot(t.vx, t.vy) || 1;
            dx = -t.vx / sp; dy = -t.vy / sp; d = 1;
          } else { dx /= d; dy /= d; }
          const vn = -(t.vx * dx + t.vy * dy);         // ブロックへ むかう 速さ
          const hitting = vn > 70;
          if (hitting) {
            const heavy = t.diving ? 2.2 : 1;
            const dmg = t.mass * heavy * (vn / 150) * t.power * (t.hits ? 0.7 : 1);
            onHit(t, T);
            if (b.dead) continue;
            if (dmg >= b.hp) {                         // つきぬける
              const keep = Math.sqrt(Math.max(0, 1 - b.hp / dmg));
              hurt(b, dmg);
              t.vx *= clamp(keep, 0.2, 0.85);             // つきぬける たびに おそく なる
              t.vy *= clamp(keep, 0.2, 0.85);
              continue;
            }
            hurt(b, dmg);
            const mb = massOf(b);
            wake(b);
            const push = vn * (t.mass * heavy / (t.mass * heavy + mb)) * 1.1;
            b.vx -= dx * push;
            b.vy -= dy * push * 0.6;
            const e = T.bounce;
            t.vx += (1 + e) * vn * dx;
            t.vy += (1 + e) * vn * dy;
            t.vx *= 0.85;
          } else if (vn > 0) {
            t.vx += vn * dx;
            t.vy += vn * dy;
            t.vx *= 0.97;
          }
          t.x = px + dx * t.r;
          t.y = py + dy * t.r;
        }
        // 地面
        if (t.y + t.r >= GROUND) {
          if (t.vy > 120) onHit(t, T);
          t.y = GROUND - t.r;
          if (t.vy > 0) t.vy = -t.vy * T.bounce * 0.8;
          if (Math.abs(t.vy) < 40) t.vy = 0;
          t.vx *= 0.97;
          t.spin = t.vx / t.r * 0.5;
        }
        // おわり：止まった／外へ 出た／時間ぎれ
        const sp = Math.hypot(t.vx, t.vy);
        if (sp < 30) t.rest += dt; else t.rest = 0;
        if (t.rest > 0.5 || t.x > WORLD_W + 200 || t.x < -200 || t.life > (T.life || 7)) {
          if (t.fuse > 0) continue;                    // 導火線が のこって いる あいだは 消さない（ばくはつを 待つ）
          t.fade = 0.001;
        }
        if (!reduceMotion()) {
          t.trail.push(t.x, t.y);
          if (t.trail.length > 24) t.trail.splice(0, 2);
        }
      }
      takos = takos.filter((t) => !t.dead);
    }

    /** はじめて ぶつかった とき（人と タコの わざ） */
    function onHit(t, T) {
      t.hits += 1;
      if (t.hits > 1) return;
      t.tapped = true;
      if (t.blast) explode(t.x, t.y, t.blast, 2.4, 'maki');
      if (T.hit === 'bomb') t.fuse = 1.0;
      if (T.hit === 'ink') {
        effects.push({ type: 'ink', x: t.x, y: t.y, t: 0, life: 1.2, r: INK_R });
        blocks.forEach((b) => {
          if (b.dead) return;
          const d = Math.hypot(clamp(t.x, b.x, b.x + b.w) - t.x, clamp(t.y, b.y, b.y + b.h) - t.y);
          if (d < INK_R && b.kind !== 'R') { b.inked = true; b.hp = Math.min(b.hp, b.maxHp * 0.4); }   // かたいのも 白より もろく
        });
      }
      if (T.hit === 'quake') {
        effects.push({ type: 'blast', x: t.x, y: t.y, t: 0, life: 0.6, r: QUAKE_R, look: 'quake' });
        shake(16);
        blocks.forEach((b) => {
          if (b.dead) return;
          const d = Math.hypot(b.x + b.w / 2 - t.x, b.y + b.h / 2 - t.y);
          if (d > QUAKE_R) return;
          const f = 1 - d / QUAKE_R;
          hurt(b, 1.2 * f);
          if (b.dead) return;
          wake(b);
          b.vx += Math.sign(b.x + b.w / 2 - t.x || 1) * 190 * f / Math.sqrt(massOf(b));
          b.vy -= 130 * f;
        });
      }
    }

    /** 空中で タップ */
    function useTap() {
      let used = false;
      takos.slice().forEach((t) => {
        if (t.tapped || t.dead || t.fade) return;
        const T = TAKOS[t.kind];
        t.tapped = true;
        used = true;
        if (T.tap === 'split') {
          const sp = Math.hypot(t.vx, t.vy);
          const a = Math.atan2(t.vy, t.vx);
          [-0.2, 0.2].forEach((da) => {
            spawnTako(t.kind, t.x, t.y, Math.cos(a + da) * sp, Math.sin(a + da) * sp, { power: t.power, blast: t.blast, size: t.r / T.r, child: true });
            takos[takos.length - 1].tapped = true;
          });
          effects.push({ type: 'pop', x: t.x, y: t.y, t: 0, life: 0.35 });
        }
        if (T.tap === 'dive') {
          t.vx *= 0.25;
          t.vy = 1150;
          t.diving = true;
          effects.push({ type: 'pop', x: t.x, y: t.y, t: 0, life: 0.35 });
        }
      });
      return used;
    }

    // ---------- 投げる ----------
    function launchVector(p) {
      const len = Math.min(MAX_PULL, Math.hypot(p.x, p.y));
      if (len < 1) return { vx: 0, vy: 0 };
      const k = (len / MAX_PULL) * MAX_SPEED;
      return { vx: (-p.x / len) * k, vy: (-p.y / len) * k };
    }

    function throwNow() {
      if (phase !== 'aim' || !pull) return false;
      const len = Math.hypot(pull.x, pull.y);
      if (len < 18) { pull = null; return false; }
      const P = THROWERS[thrower];
      const v = launchVector(pull);
      const n = P.count || 1;
      for (let i = 0; i < n; i += 1) {
        const off = n > 1 ? (i - (n - 1) / 2) * 0.09 : 0;
        const a = Math.atan2(v.vy, v.vx) + off + (rand() * 2 - 1) * P.wobble;
        const s = Math.hypot(v.vx, v.vy) * (n > 1 ? 1 - Math.abs(i - 1) * 0.04 : 1);
        spawnTako(takoKind, ANCHOR.x, ANCHOR.y, Math.cos(a) * s, Math.sin(a) * s, { power: P.power, blast: P.blast || 0, size: P.size || 1 });
      }
      pull = null;
      phase = 'fly';
      flyT = 0;
      quietT = 0;
      follow = true;
      emitStats();
      if (H.onThrow) H.onThrow(takoKind, thrower);
      return true;
    }

    function everyoneQuiet() {
      if (takos.length || pending.length) return false;
      return blocks.every((b) => b.dead || !b.awake);
    }

    function update(dt) {
      if (phase === 'intro') {
        introT -= dt;
        camTarget = introT > 0.9 ? maxCam() : minCam();
        if (introT <= 0) { phase = 'aim'; camTarget = minCam(); emitStats(); }
      }
      if (phase === 'fly' || phase === 'settle') {
        let acc = dt;
        while (acc > 0) {
          const h = Math.min(STEP, acc);
          acc -= h;
          pending.forEach((p) => { p.t -= h; });
          const due = pending.filter((p) => p.t <= 0);
          pending = pending.filter((p) => p.t > 0);
          due.forEach((p) => p.fn());
          stepTakos(h);
          stepBlocks(h);
        }
        flyT += dt;
        if (phase === 'fly' && !takos.length) phase = 'settle';
        if (phase === 'settle') {
          quietT = everyoneQuiet() ? quietT + dt : 0;
          if (quietT > 0.35 || flyT > 14) {
            blocks.forEach((b) => { b.awake = false; b.vx = 0; b.vy = 0; b.tip = 0; });
            topoDirty = true;
            phase = 'aim';
            camTarget = minCam();
            follow = true;
            emitStats();
            if (H.onTurnEnd) H.onTurnEnd({ broken, total, ratio: total ? broken / total : 0 });
          }
        }
        if (follow && takos.length) {
          const lead = takos.reduce((m, t) => (t.x > m.x ? t : m), takos[0]);
          camTarget = clamp(lead.x - viewW * 0.45, minCam(), maxCam());
        }
      } else {
        // 止まって いても ブロックは ひと息 だけ うごかさない（ねむって いる）
      }
      stepBoss(dt);
      stepEffects(dt);
      if (!pointer || pointer.mode !== 'pan') camX += (camTarget - camX) * Math.min(1, dt * (phase === 'intro' ? 2.4 : 4));
      camX = clamp(camX, minCam(), maxCam());
      shakeAmt *= Math.pow(0.02, dt);
      if (shakeAmt < 0.3) shakeAmt = 0;
    }

    function stepBoss(dt) {
      if (!boss) return;
      const p = boss.perch;
      if (!boss.fall && p && !p.dead) {
        boss.x = p.x + p.w / 2;
        boss.y = p.y;
        return;
      }
      if (!boss.fall) { boss.fall = true; boss.down = true; boss.vy = -200; }
      boss.vy += GRAV * dt;
      boss.y = Math.min(GROUND, boss.y + boss.vy * dt);
      boss.rot += dt * 4;
      if (boss.y >= GROUND) { boss.rot *= 0.8; boss.vy = 0; }
    }

    function stepEffects(dt) {
      effects.forEach((e) => {
        e.t += dt;
        if (e.type === 'shard') { e.vy += GRAV * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.rot += dt * 6; }
      });
      effects = effects.filter((e) => e.t < e.life);
    }

    // =========================================================
    //  描画
    // =========================================================
    function draw() {
      const W = cssW;
      const Hh = cssH;
      ctx.save();
      ctx.clearRect(0, 0, W, Hh);
      // 空と 背景（画面に ぴったり、うすく）
      ctx.fillStyle = stage.bgColor || '#a8d4e6';
      ctx.fillRect(0, 0, W, Hh);
      const bg = IMG[stage.bg];
      if (bg) {
        const s = Math.max(W / bg.width, Hh / bg.height);
        const iw = bg.width * s;
        const ih = bg.height * s;
        const par = maxCam() > minCam() ? (camX - minCam()) / (maxCam() - minCam()) : 0;           // すこしだけ 横に ずらす（奥行き）
        ctx.globalAlpha = 0.55;
        ctx.drawImage(bg, (W - iw) / 2 - (par - 0.5) * Math.min(40, (iw - W) / 2 + 0), (Hh - ih) * 0.2, iw, ih);   // 上寄せ（背景の 目じるしは 上の 40% に ある）
        ctx.globalAlpha = 1;
      }
      const sk = shakeAmt ? (Math.random() * 2 - 1) * shakeAmt : 0;
      ctx.translate(sk * scale, 0);
      ctx.scale(scale, scale);
      ctx.translate(-camX, -worldTop());

      // 遠くの 白い 壁（街を かこむ）。背景の 絵が ある ときは 絵に まかせて 描かない
      const x0 = Math.floor((camX - 80) / 68) * 68;
      const x1 = camX + viewW + 80;
      if (!bg) {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(x0, GROUND - 250, x1 - x0, 250);
        ctx.fillStyle = 'rgba(200,210,220,.5)';
        for (let x = x0; x < x1; x += 68) ctx.fillRect(x, GROUND - 250, 2, 250);
      }

      // 地面
      ctx.fillStyle = '#8a6a44';
      ctx.fillRect(x0, GROUND, x1 - x0, 400);
      ctx.fillStyle = '#6f9e57';
      ctx.fillRect(x0, GROUND, x1 - x0, 10);

      drawThrower();
      drawBlocks();
      drawBoss();
      drawEffects('under');
      takos.forEach(drawTako);
      drawEffects('over');
      if (phase === 'aim') drawAim();
      ctx.restore();

      if (phase === 'aim') drawInset();

      // 画面の 上へ 出た タコの しるし
      takos.forEach((t) => {
        const sy = (t.y - worldTop()) * scale;
        if (sy > -t.r * scale) return;
        const sx = (t.x - camX) * scale;
        ctx.fillStyle = TAKOS[t.kind].color;
        ctx.beginPath();
        ctx.moveTo(sx, 4);
        ctx.lineTo(sx - 9, 18);
        ctx.lineTo(sx + 9, 18);
        ctx.closePath();
        ctx.fill();
      });
    }

    /** ねらって いる あいだ 城が 画面の 外なら、右上に 小窓で 城を 見せる（たて長の スマホ むけ） */
    function drawInset() {
      let lo = Infinity;
      let hi = -Infinity;
      let top = GROUND;
      blocks.forEach((b) => {
        if (b.dead) return;
        lo = Math.min(lo, b.x); hi = Math.max(hi, b.x + b.w); top = Math.min(top, b.y);
      });
      if (lo === Infinity || lo < camX + viewW - 40) return;      // 城が もう 見えて いる
      const wx = lo - 50;
      const wy = top - (boss ? 90 : 30);
      const ww = hi - lo + 100;
      const wh = GROUND + 16 - wy;
      const boxW = Math.min(cssW * 0.42, 240);
      const k = Math.min(boxW / ww, (cssH * 0.4) / wh);
      const bw = ww * k;
      const bh = wh * k;
      const bx = cssW - bw - 8;
      const by = 8;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.fillStyle = stage.bgColor || '#a8d4e6';
      ctx.fillRect(bx, by, bw, bh);
      ctx.translate(bx, by);
      ctx.scale(k, k);
      ctx.translate(-wx, -wy);
      ctx.fillStyle = '#8a6a44';
      ctx.fillRect(wx, GROUND, ww, 40);
      blocks.forEach((b) => {
        if (b.dead) return;
        ctx.fillStyle = KINDS[b.kind].fill;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = KINDS[b.kind].edge;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
      });
      drawBoss();
      ctx.restore();
      ctx.strokeStyle = 'rgba(40,40,40,.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
    }

    function drawBlocks() {
      blocks.forEach((b) => {
        if (b.dead) return;
        const K = KINDS[b.kind];
        ctx.save();
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
        if (b.rot) ctx.rotate(b.rot * 0.35);
        const x = -b.w / 2;
        const y = -b.h / 2;
        ctx.fillStyle = K.fill;
        ctx.fillRect(x, y, b.w, b.h);
        // ひび（体力が へった ぶん）
        const lost = 1 - b.hp / b.maxHp;
        if (lost > 0.2 && b.kind !== 'R') {
          ctx.strokeStyle = 'rgba(80,90,100,.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + b.w * 0.2, y + b.h * 0.1);
          ctx.lineTo(x + b.w * 0.45, y + b.h * 0.5);
          ctx.lineTo(x + b.w * 0.35, y + b.h * 0.9);
          if (lost > 0.55) { ctx.moveTo(x + b.w * 0.45, y + b.h * 0.5); ctx.lineTo(x + b.w * 0.85, y + b.h * 0.35); }
          ctx.stroke();
        }
        if (b.kind === 'H') {                                // かたい：ななめの すじ
          ctx.strokeStyle = 'rgba(125,143,160,.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let k = -b.h; k < b.w; k += 12) { ctx.moveTo(x + k, y + b.h); ctx.lineTo(x + k + b.h, y); }
          ctx.save(); ctx.beginPath(); ctx.rect(x, y, b.w, b.h); ctx.clip();
          ctx.beginPath();
          for (let k = -b.h; k < b.w; k += 12) { ctx.moveTo(x + k, y + b.h); ctx.lineTo(x + k + b.h, y); }
          ctx.stroke();
          ctx.restore();
        }
        if (b.kind === 'R') {                                // 赤：ばくはつ マーク
          ctx.fillStyle = '#ffe36e';
          ctx.font = `bold ${Math.min(b.w, b.h) * 0.62}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', 0, 2);
        }
        if (b.inked) { ctx.fillStyle = 'rgba(40,30,60,.45)'; ctx.fillRect(x, y, b.w, b.h); }
        if (b.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x, y, b.w, b.h); }
        ctx.strokeStyle = K.edge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, b.w - 2, b.h - 2);
        ctx.restore();
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
        const s = r * 2.7;
        ctx.drawImage(im, -s / 2, -s / 2, s, s);
      } else {
        // 画像が ない ときの タコ：丸い あたまと 8本の 足
        ctx.fillStyle = T.color;
        for (let i = 0; i < 8; i += 1) {
          const a = Math.PI * 0.15 + (i / 7) * Math.PI * 0.7;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.22, r * 0.42, a - Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, -r * 0.12, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.arc(r * 0.32, -r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1b1b1b';
        if (down) {
          ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = r * 0.08;
          [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(s * r * 0.32 - r * 0.12, -r * 0.32); ctx.lineTo(s * r * 0.32 + r * 0.12, -r * 0.08); ctx.moveTo(s * r * 0.32 + r * 0.12, -r * 0.32); ctx.lineTo(s * r * 0.32 - r * 0.12, -r * 0.08); ctx.stroke(); });
        } else {
          ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.18, r * 0.1, 0, Math.PI * 2); ctx.arc(r * 0.34, -r * 0.18, r * 0.1, 0, Math.PI * 2); ctx.fill();
        }
        if (kind === 'daiou') {                             // ネコみみ
          ctx.fillStyle = '#1b1b1b';
          [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(s * r * 0.3, -r * 0.9); ctx.lineTo(s * r * 0.7, -r * 1.3); ctx.lineTo(s * r * 0.8, -r * 0.6); ctx.fill(); });
        }
      }
      ctx.restore();
    }

    function drawTako(t) {
      if (t.trail.length > 3) {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (let i = 0; i < t.trail.length; i += 4) ctx.fillRect(t.trail[i] - 2, t.trail[i + 1] - 2, 4, 4);
      }
      drawTakoBody(t.kind, t.x, t.y, t.r, t.rot, t.hits > 0, t.fade ? 1 - t.fade * 2 : 1);
      if (t.fuse > 0) {
        ctx.fillStyle = '#ffe36e';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.ceil(t.fuse * 3)), t.x, t.y - t.r - 8);
      }
    }

    function drawThrower() {
      const P = THROWERS[thrower];
      const im = IMG[faceUrl(thrower)];
      const size = 170;
      const cx = ANCHOR.x - 105;   // タコを かまえる 位置が 顔に かからない よう 左に よせる
      const cy = GROUND - size / 2 + 6;
      if (im) ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size);
      else {
        ctx.fillStyle = P.color;
        ctx.beginPath(); ctx.arc(cx, GROUND - 70, 44, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - 34, GROUND - 40, 68, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(P.name, cx, GROUND - 70);
      }
    }

    function drawAim() {
      const P = THROWERS[thrower];
      const p = pull || { x: 0, y: 0 };
      const hx = ANCHOR.x + p.x * 0.6;
      const hy = ANCHOR.y + p.y * 0.6;
      // まだ 引いて いない ときは ここを さわる しるし
      if (!pull) {
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.arc(ANCHOR.x, ANCHOR.y, 42 + Math.sin(performance.now() / 300) * 4, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      const n = P.count || 1;
      for (let i = 0; i < n; i += 1) {
        const off = n > 1 ? (i - 1) * 10 : 0;
        drawTakoBody(takoKind, hx + off, hy - Math.abs(off) * 0.5, TAKOS[takoKind].r * (P.size || 1), 0, false);
      }
      if (!pull || Math.hypot(p.x, p.y) < 18) return;
      // ひっぱりの 線
      ctx.strokeStyle = 'rgba(40,40,40,.6)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(ANCHOR.x, ANCHOR.y); ctx.lineTo(ANCHOR.x + p.x, ANCHOR.y + p.y); ctx.stroke();
      // 予測線（人に よって 長さが ちがう。フミは みじかい）
      const v = launchVector(p);
      let x = ANCHOR.x;
      let y = ANCHOR.y;
      let vx = v.vx;
      let vy = v.vy;
      const dt = 1 / 30;
      const steps = Math.round(40 * P.guide);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < steps; i += 1) {
        vy += GRAV * dt;
        x += vx * dt;
        y += vy * dt;
        if (y > GROUND) break;
        ctx.globalAlpha = 1 - i / (steps + 4);
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // つよさ
      const pw = Math.min(1, Math.hypot(p.x, p.y) / MAX_PULL);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(ANCHOR.x - 50, ANCHOR.y + 60, 100, 12);
      ctx.fillStyle = pw > 0.9 ? '#e0533d' : '#ffe36e';
      ctx.fillRect(ANCHOR.x - 50, ANCHOR.y + 60, 100 * pw, 12);
    }

    function drawBoss() {
      if (!boss) return;
      const url = faceUrl(stage.boss, boss.down ? 'down' : 'normal');
      const im = IMG[url] || IMG[faceUrl(stage.boss)];
      const size = stage.boss === 'queen' ? 96 : 76;
      ctx.save();
      ctx.translate(boss.x, boss.y - size * 0.45);
      ctx.rotate(boss.rot);
      if (im) ctx.drawImage(im, -size / 2, -size / 2, size, size);
      else {
        // 画像が ない ときの イカ：三角の ヒレ・白い からだ・10本の 足
        const s = size / 80;
        ctx.scale(s, s);
        ctx.fillStyle = '#f4f6f8';
        ctx.strokeStyle = '#8fa0b3';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i += 1) {
          ctx.beginPath(); ctx.moveTo(-14 + i * 5.6, 12); ctx.quadraticCurveTo(-18 + i * 7, 30, -16 + i * 6.4, 38); ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, -40); ctx.lineTo(26, -14); ctx.lineTo(18, -10); ctx.lineTo(18, 16); ctx.lineTo(-18, 16); ctx.lineTo(-18, -10); ctx.lineTo(-26, -14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1b1b1b';
        if (boss.down) { ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('× ×', 0, 6); }
        else { ctx.beginPath(); ctx.arc(-7, 0, 3.5, 0, Math.PI * 2); ctx.arc(7, 0, 3.5, 0, Math.PI * 2); ctx.fill(); }
        if (stage.boss === 'queen') {                        // かんむり
          ctx.fillStyle = '#ffd24a';
          ctx.beginPath(); ctx.moveTo(-12, -30); ctx.lineTo(-12, -44); ctx.lineTo(-6, -36); ctx.lineTo(0, -48); ctx.lineTo(6, -36); ctx.lineTo(12, -44); ctx.lineTo(12, -30); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawEffects(layer) {
      effects.forEach((e) => {
        const k = e.t / e.life;
        if (layer === 'under' && e.type === 'ink') {
          ctx.fillStyle = `rgba(40,30,60,${0.45 * (1 - k)})`;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * Math.min(1, k * 4), 0, Math.PI * 2); ctx.fill();
        }
        if (layer !== 'over') return;
        if (e.type === 'shard') {
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.translate(e.x, e.y); ctx.rotate(e.rot);
          ctx.fillStyle = e.color; ctx.fillRect(-e.size / 2, -e.size / 2, e.size, e.size);
          ctx.restore();
        } else if (e.type === 'blast') {
          const col = e.look === 'quake' ? '255,255,255' : e.look === 'maki' ? '255,227,110' : '255,120,60';
          ctx.fillStyle = `rgba(${col},${0.5 * (1 - k)})`;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.3 + 0.7 * k), 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `rgba(${col},${1 - k})`;
          ctx.lineWidth = 6;
          ctx.stroke();
        } else if (e.type === 'dust') {
          ctx.fillStyle = `rgba(230,220,200,${0.7 * (1 - k)})`;
          ctx.beginPath(); ctx.ellipse(e.x, e.y - 6, e.w * (0.6 + k), 12 + k * 10, 0, 0, Math.PI * 2); ctx.fill();
        } else if (e.type === 'pop') {
          ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(e.x, e.y, 20 + k * 30, 0, Math.PI * 2); ctx.stroke();
        }
      });
    }

    // =========================================================
    //  入力
    // =========================================================
    function onDown(e) {
      if (pointer) return;
      const r = canvas.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      const w = toWorld(sx, sy);
      if (phase === 'intro') { introT = 0; return; }
      if (phase === 'fly' || phase === 'settle') {
        if (useTap()) return;
        pointer = { id: e.pointerId, mode: 'pan', lastX: sx };
        follow = false;
      } else if (phase === 'aim' && Math.hypot(w.x - ANCHOR.x, w.y - ANCHOR.y) < 95) {
        pointer = { id: e.pointerId, mode: 'aim', sx: w.x, sy: w.y };
        pull = { x: 0, y: 0 };
        camTarget = minCam();
      } else {
        pointer = { id: e.pointerId, mode: 'pan', lastX: sx };
      }
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* とれなくても つづける */ }
      e.preventDefault();
    }
    function onMove(e) {
      if (!pointer || e.pointerId !== pointer.id) return;
      const r = canvas.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      if (pointer.mode === 'aim') {
        const w = toWorld(sx, sy);
        let px = w.x - pointer.sx;
        let py = w.y - pointer.sy;
        const len = Math.hypot(px, py);
        if (len > MAX_PULL) { px *= MAX_PULL / len; py *= MAX_PULL / len; }
        pull = { x: px, y: py };
      } else if (pointer.mode === 'pan') {
        camX = clamp(camX - (sx - pointer.lastX) / scale, minCam(), maxCam());
        camTarget = camX;
        pointer.lastX = sx;
      }
    }
    function onUp(e) {
      if (!pointer || e.pointerId !== pointer.id) return;
      const mode = pointer.mode;
      pointer = null;
      if (mode === 'aim') { if (!throwNow()) pull = null; }
    }

    // キーボード：← → で 角度、↑ ↓ で 強さ、スペースか Enter で 投げる
    let keyAim = { a: -0.7, p: 0.8 };
    function onKey(e) {
      if (!canvas.isConnected || canvas.offsetParent === null) return;
      if (e.target && e.target.closest && e.target.closest('button, input, [role="dialog"]')) return;
      if (phase === 'fly' || phase === 'settle') {
        if (e.key === ' ' || e.key === 'Enter') { useTap(); e.preventDefault(); }
        return;
      }
      if (phase !== 'aim') return;
      const k = e.key;
      if (k === 'ArrowLeft') keyAim.a -= 0.04;
      else if (k === 'ArrowRight') keyAim.a += 0.04;
      else if (k === 'ArrowUp') keyAim.p += 0.04;
      else if (k === 'ArrowDown') keyAim.p -= 0.04;
      else if (k === ' ' || k === 'Enter') { if (pull) throwNow(); e.preventDefault(); return; }
      else return;
      e.preventDefault();
      keyAim.a = clamp(keyAim.a, -1.5, 0.6);
      keyAim.p = clamp(keyAim.p, 0.2, 1);
      const len = keyAim.p * MAX_PULL;
      pull = { x: -Math.cos(keyAim.a) * len, y: -Math.sin(keyAim.a) * len };
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', () => { pointer = null; pull = null; });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);

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
      stats: () => ({ broken, total, ratio: total ? broken / total : 0 }),
      bossDown() { if (boss && !boss.fall) { boss.down = true; } },
      // テスト用（node で 物理だけ まわす）
      _sim: {
        step: update,
        physics(dt) { stepBlocks(dt); },
        draw,                       // ブロックだけ まわす（置いた ままで 崩れないかの 確認）
        blocks: () => blocks,
        takos: () => takos,
        setPull: (p) => { pull = p; phase = 'aim'; },
        throwNow,
        tap: useTap,
        setPhase: (p) => { phase = p; },
        save: () => ({ blocks: blocks.map((b) => Object.assign({}, b)), seed, broken }),
        restore(s) {
          blocks = s.blocks.map((b) => Object.assign({}, b));
          seed = s.seed; broken = s.broken;
          takos = []; pending = []; effects = [];
          topoDirty = true; phase = 'aim'; pull = null;
          if (boss) boss.perch = blocks.reduce((m, b) => (!b.dead && (!m || b.y < m.y) ? b : m), null);
        },
      },
    };
  }

  window.TakoGame = { create, TAKOS, TAKO_ORDER, THROWERS, KINDS, parseCastle, CELL, GROUND };
})();
