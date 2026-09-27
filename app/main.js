/* 街と、その白い壁 〜The City and Its White Squid〜 ―― 画面と 流れ。
 *
 *   タイトル（StoryPlayer.showTitle）
 *     ├ はじめから   → prologue → stage1 → 1-1 → 1-2 → 1-3 → clear1 → stage2 → … → 8-3 → clear8 → ending → タイトル
 *     ├ つづきから   → 保存した レベル（面の 1つめ なら stageN を 先に）
 *     └ えらんで あそぶ → クリアした レベル＋つぎの 1つ を えらぶ（会話なし）
 *
 * 物理と 描画は game.js の window.TakoGame、城は stages.js の window.STAGES。
 * ない／まだ すくない ときも 動く ように、ここでは 仮の 1レベルを もっている（FALLBACK_STAGES）。
 * 通信は しない。保存は localStorage の throwontako.story だけ。
 */
(() => {
  'use strict';

  const SAVE_KEY = 'throwontako.story';   // { level, stars: { 1: 3, … }, seenPrologue, carry: { 2: { throwers: ['fumi'], takos: { tako2: 1 } } }, scores: { 1: 2300 }, best: { 1: 8400 } }
  const PER_STAGE = 3;                     // 1面 ＝ 3レベル
  const LAST_STORY_LEVEL = 24;             // 24 の あと clear8 → ending

  // 担当① の stages.js が まだ ない ときの 仮の レベル（ここだけで つかう）
  const FALLBACK_STAGES = [
    {
      no: 1, stage: 1, name: '1-1', goal: 0.6,
      rows: [
        ' R ',
        'W-W',
        'W W',
        'WWW',
      ],
      takos: { tako1: 4 },
      throwers: ['nao', 'fumi', 'maki'],
      hint: 'タコを ひっぱって はなすと 投げるよ！',
    },
  ];

  // 投げる 人の 使える 面（stages.js に throwers が ない ときの めやす）
  const THROWER_FROM = { nao: 1, fumi: 1, maki: 1, chika: 2 };
  const THROWER_KEYS = ['nao', 'fumi', 'maki', 'chika'];
  const THROWER_FALLBACK = {
    nao:   { name: 'ナオ', note: 'ねらい ◎ ／ 力 △', color: '#27407a' },
    fumi:  { name: 'フミ', note: 'ねらい △ ／ 力 ◎', color: '#d9731f' },
    maki:  { name: 'マキ', note: 'あたると ばくはつ', color: '#1f7a3d' },
    chika: { name: 'チカ', note: 'ちいさく 3びき', color: '#b0457a' },
  };

  // ---------- データ ----------
  const STAGES = (Array.isArray(window.STAGES) && window.STAGES.length ? window.STAGES : FALLBACK_STAGES)
    .filter((lv) => lv && Array.isArray(lv.rows) && lv.rows.length);
  if (!STAGES.length) STAGES.push(FALLBACK_STAGES[0]);
  const LAST = STAGES.length;
  const TG = window.TakoGame || null;
  const TAKOS = (TG && TG.TAKOS) || {};
  const TAKO_ORDER = (TG && TG.TAKO_ORDER) || Object.keys(TAKOS);
  const THROWERS = (TG && TG.THROWERS) || THROWER_FALLBACK;
  const STORY = window.STORY && typeof window.STORY === 'object' ? window.STORY : {};
  const SP = window.StoryPlayer && typeof window.StoryPlayer.showTitle === 'function' ? window.StoryPlayer : null;

  const levelAt = (n) => STAGES[Math.max(1, Math.min(LAST, n)) - 1];
  const stageOf = (n) => {
    const lv = STAGES[n - 1];
    return (lv && lv.stage) || Math.ceil(n / PER_STAGE);
  };
  const innerOf = (n) => ((n - 1) % PER_STAGE) + 1;
  const levelName = (n) => {
    const lv = STAGES[n - 1];
    return (lv && lv.name) || stageOf(n) + '-' + innerOf(n);
  };
  const stageInfo = (s) => (Array.isArray(STORY.stages) && STORY.stages[s - 1]) || {};
  const stageTitle = (s) => s + '面 ' + (stageInfo(s).name || '');

  // ---------- 保存 ----------
  let save = { level: 1, stars: {}, seenPrologue: false, carry: {}, scores: {}, best: {} };
  function loadSave() {
    try {
      const v = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (v && typeof v === 'object') {
        save.level = Math.max(1, Number(v.level) || 1);
        save.stars = v.stars && typeof v.stars === 'object' ? v.stars : {};
        save.seenPrologue = !!v.seenPrologue;
        save.carry = v.carry && typeof v.carry === 'object' ? v.carry : {};
        save.scores = v.scores && typeof v.scores === 'object' ? v.scores : {};
        save.best = v.best && typeof v.best === 'object' ? v.best : {};
      }
    } catch (e) { /* 読めなくても はじめから */ }
  }
  function writeSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 保存 できなくても つづける */ }
  }
  const starsOf = (n) => Math.max(0, Math.min(3, Number(save.stars[n]) || 0));
  /** えらんで あそぶ で えらべる いちばん 先の レベル（クリア済みの つぎ まで） */
  function maxPickable() {
    let top = 0;
    Object.keys(save.stars).forEach((k) => { if (starsOf(Number(k)) > 0) top = Math.max(top, Number(k)); });
    return Math.min(LAST, top + 1);
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('canvas');
  const stageNameEl = $('stageName');
  const levelNameEl = $('levelName');
  const gauge = $('gauge');
  const gaugeBar = $('gaugeBar');
  const gaugeGoal = $('gaugeGoal');
  const ratioText = $('ratioText');
  const goalText = $('goalText');
  const messageEl = $('message');
  const trayList = $('trayList');
  const trayNote = $('trayNote');
  const throwerList = $('throwerList');
  const endModal = $('endModal');
  const endTitle = $('endTitle');
  const endStars = $('endStars');
  const endText = $('endText');
  const endScore = $('endScore');
  const endMain = $('btnEndMain');
  const endMainText = $('endMainText');
  const endSub = $('btnEndSub');
  const endSubText = $('endSubText');
  const pickModal = $('pickModal');
  const pickList = $('pickList');

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function say(text) { messageEl.textContent = text; }

  // ---------- 顔：画像が 読めた ときだけ 画像、だめなら 色の 丸＋字 ----------
  const imgOk = new Map();   // url → true | false | [待つ もの]
  function whenImage(url, cb) {
    const st = imgOk.get(url);
    if (st === true || st === false) { cb(st); return; }
    if (Array.isArray(st)) { st.push(cb); return; }
    const wait = [cb];
    imgOk.set(url, wait);
    const im = new Image();
    const done = (ok) => { imgOk.set(url, ok); wait.forEach((f) => f(ok)); };
    im.onload = () => done(im.naturalWidth > 0);
    im.onerror = () => done(false);
    im.src = url;
  }
  function makeFace(key, cls, color, letter) {
    const f = el('span', 'face ' + cls);
    f.setAttribute('aria-hidden', 'true');
    f.style.backgroundColor = color || '#777';
    f.textContent = letter || '';
    const url = 'images/story/' + key + '-normal.png';
    whenImage(url, (ok) => {
      if (!ok) return;
      f.textContent = '';
      const im = el('img');
      im.src = url;
      im.alt = '';
      im.draggable = false;
      f.appendChild(im);
      f.classList.add('has-image');
    });
    return f;
  }

  // ---------- ゲーム ----------
  let game = null;
  let mode = 'story';       // 'story' | 'pick'
  let level = 1;            // いま あそんで いる レベル（1〜）
  let lv = null;            // いまの レベルの データ
  let left = {};            // のこりの タコ { tako1: 3, … }
  let takoKey = '';
  let throwerKey = 'nao';
  let unlocked = { nao: true };   // この レベルで 使える 投げる 人（はじめは ナオだけ。アイテムで ふえる）
  // 手に 入れた アイテム（まえの レベルから もちこした ぶん＋この レベルで ひろった ぶん）。
  // クリアすると 同じ 面の つぎの レベルへ もちこす。面が かわると なし（X-1 は いつも ナオと タコ一郎だけ）
  let gained = { throwers: [], takos: {} };
  let ratio = 0;
  let playing = false;      // 投げられる 状態（モーダルや 場面の あいだは false）
  let ended = false;        // この レベルの 結果が でた

  const takoLeft = () => Object.keys(left).reduce((s, k) => s + (left[k] || 0), 0);

  function initGame() {
    if (!TG || typeof TG.create !== 'function' || !canvas.getContext) {
      $('noGame').hidden = false;
      return;
    }
    try {
      game = TG.create(canvas, { onStats, onThrow, onTurnEnd, onItem });
    } catch (e) {
      console.error(e);
      game = null;
      $('noGame').hidden = false;
      return;
    }
    // canvas の 大きさが かわったら（向きや ヘッダーの 高さ）描きなおす
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => { if (game) game.resize(); }).observe(canvas);
    }
  }

  function pauseGame(v) {
    if (game && typeof game.pause === 'function') game.pause(v);
  }

  let started = false;
  /** この レベルに もちこむ アイテム（同じ 面の まえの レベルで 手に 入れた もの） */
  function carryFor(n) {
    const c = innerOf(n) > 1 && save.carry && save.carry[n];
    const throwers = c && Array.isArray(c.throwers) ? c.throwers.filter((k) => THROWER_KEYS.includes(k) && k !== 'nao') : [];
    const takos = {};
    if (c && c.takos && typeof c.takos === 'object') {
      Object.keys(c.takos).forEach((k) => { const v = Math.max(0, Number(c.takos[k]) || 0); if (v && TAKOS[k]) takos[k] = v; });
    }
    return { throwers, takos };
  }

  /** あまった アイテムの タコ（二郎〜大王。一郎は レベルごとに くばられる ので 入れない） */
  function leftoverItems() {
    const takos = {};
    Object.keys(left).forEach((k) => { if (k !== 'tako1' && left[k] > 0) takos[k] = left[k]; });
    return takos;
  }

  /** クリアした ときに、なかまと あまった タコを 同じ 面の つぎの レベルへ もちこす（さいごに クリアした ときの もの） */
  function saveCarry() {
    const nx = level + 1;
    if (nx > LAST || stageOf(nx) !== stageOf(level)) return;
    save.carry[nx] = { throwers: gained.throwers.slice(), takos: leftoverItems() };
  }

  // ---------- 得点 ----------
  // レベルごと：イカへの ダメージ・穴に おとした ボーナス・さいだい コンボ・のこった タコ一郎。
  // 面の さいご（X-3）で、あまった アイテム（タコ二郎〜大王・なかま）を 得点に かえて、面の 合計を ハイスコアと くらべる
  const PT = { dmg: 100, pocket: 1000, pocketHp: 500, combo: 200, tako1: 300, itemTako: 500, mate: 800 };
  const fmtPt = (v) => Number(v || 0).toLocaleString('ja-JP');
  function levelScore(st) {
    const maxHp = Number(st && st.maxHp) || 1;
    const hp = Math.max(0, Number(st && st.hp) || 0);
    const rows = [['イカへの ダメージ', Math.round((maxHp - hp) * PT.dmg)]];
    // 穴に おとすと、のこって いた 体力 1つごとに 大きな ボーナス（たおしきる より ずっと 高い）
    if (st && st.pocket) rows.push(['穴に おとした' + (hp > 0 ? '（のこり ♥' + fmtHp(hp) + '）' : ''), PT.pocket + Math.round(hp * PT.pocketHp)]);
    if (st && st.combo > 1) rows.push(['さいだい コンボ ' + st.combo, st.combo * PT.combo]);
    if (left.tako1 > 0) rows.push(['のこった タコ一郎 ×' + left.tako1, left.tako1 * PT.tako1]);
    return { rows, total: rows.reduce((s, r) => s + r[1], 0) };
  }
  function stageBonus() {
    const rows = [];
    const it = leftoverItems();
    Object.keys(it).forEach((k) => rows.push(['あまった ' + (TAKOS[k] ? TAKOS[k].name : k) + ' ×' + it[k], it[k] * PT.itemTako]));
    if (gained.throwers.length) {
      const names = gained.throwers.map((k) => (THROWERS[k] || THROWER_FALLBACK[k] || { name: k }).name).join('・');
      rows.push(['なかま（' + names + '）', gained.throwers.length * PT.mate]);
    }
    return { rows, total: rows.reduce((s, r) => s + r[1], 0) };
  }
  const bestOf = (s) => Math.max(0, Number(save.best[s]) || 0);
  const isStageEnd = (n) => n >= LAST || stageOf(n + 1) !== stageOf(n);

  function loadLevel(n) {
    level = Math.max(1, Math.min(LAST, n));
    lv = levelAt(level);
    ended = false;
    ratio = 0;
    left = {};
    unlocked = { nao: true };
    throwerKey = 'nao';
    takoKey = 'tako1';
    const tk = lv.takos && typeof lv.takos === 'object' ? lv.takos : { tako1: 4 };
    Object.keys(tk).forEach((k) => { left[k] = Math.max(0, Number(tk[k]) || 0); });
    // まえの レベルで 手に 入れた なかまと タコを もちこす
    const carry = carryFor(level);
    carry.throwers.forEach((k) => { unlocked[k] = true; });
    Object.keys(carry.takos).forEach((k) => { left[k] = (left[k] || 0) + carry.takos[k]; });
    gained = { throwers: carry.throwers.slice(), takos: Object.assign({}, carry.takos) };
    const carryNames = carry.throwers.map((k) => (THROWERS[k] || THROWER_FALLBACK[k] || { name: k }).name)
      .concat(Object.keys(carry.takos).map((k) => (TAKOS[k] ? TAKOS[k].name : k) + (carry.takos[k] > 1 ? '×' + carry.takos[k] : '')));

    const s = stageOf(level);
    const info = stageInfo(s);
    stageNameEl.textContent = stageTitle(s).trim();
    levelNameEl.textContent = levelName(level);
    // ゲージは イカの 体力（のこり）。めあての 線は 使わない
    gaugeGoal.hidden = true;
    goalText.textContent = 'イカの たいりょく';

    buildTray();
    buildThrowers();
    showHp(Number(lv.hp) || 1, Number(lv.hp) || 1);
    const hint = lv.hint || 'タコを ひっぱって、はなすと 投げるよ！';
    say(carryNames.length ? 'まえの レベルから ' + carryNames.join('・') + 'も いっしょ！　' + hint : hint);

    if (game) {
      // 背景の 絵は ストーリーだけで 使う。投げる 画面は 白い ブロックが 見やすい 空色 1色に そろえる
      game.load(lv, { boss: info.boss || '', bossName: castName(info.boss) });
      game.setTako(takoKey);
      game.setThrower(throwerKey);
      if (!started) { started = true; game.start(); }
      game.resize();
    }
  }

  function castName(key) {
    return (key && STORY.cast && STORY.cast[key] && STORY.cast[key].name) || '';
  }

  /** レベルを はじめる（モーダルを とじて 投げられる ように） */
  function playLevel(n) {
    endModal.hidden = true;
    pickModal.hidden = true;
    loadLevel(n);
    playing = true;
    pauseGame(false);
    try { canvas.focus({ preventScroll: true }); } catch (e) { /* なにもしない */ }
  }

  // ---------- タコの トレイ ----------
  function takoList() {
    const keys = Object.keys(left);
    return TAKO_ORDER.filter((k) => keys.includes(k)).concat(keys.filter((k) => !TAKO_ORDER.includes(k)));
  }

  function buildTray() {
    trayList.textContent = '';
    const keys = takoList();
    if (!keys.includes(takoKey) || !left[takoKey]) takoKey = keys.find((k) => left[k] > 0) || keys[0] || 'tako1';
    keys.forEach((k) => {
      const t = TAKOS[k] || { name: k, short: k, note: '', color: '#e0533d' };
      const b = el('button', 'tako');
      b.type = 'button';
      b.dataset.key = k;
      b.setAttribute('role', 'radio');
      b.appendChild(makeFace(k, 'tako__face', t.color, '🐙'));
      b.appendChild(el('span', 'tako__name', t.short || t.name));
      const c = el('span', 'tako__count');
      c.setAttribute('aria-hidden', 'true');
      b.appendChild(c);
      b.addEventListener('click', () => pickTako(k));
      trayList.appendChild(b);
    });
    // 6しゅるい 以上は 1れつの よこスライドに する（おりかえさない）
    trayList.classList.toggle('tray__list--scroll', keys.length >= 6);
    trayList.scrollLeft = 0;
    refreshTray();
  }

  /** スライドの とき：えらんだ タコを 見える 所へ、右に つづきが ある ときは はしを ぼかす */
  function syncTrayScroll() {
    if (!trayList.classList.contains('tray__list--scroll')) return;
    const on = trayList.querySelector('.tako.is-on');
    if (on) {
      const l = on.offsetLeft - trayList.offsetLeft;
      if (l < trayList.scrollLeft) trayList.scrollLeft = l - 8;
      else if (l + on.offsetWidth > trayList.scrollLeft + trayList.clientWidth) trayList.scrollLeft = l + on.offsetWidth - trayList.clientWidth + 8;
    }
    markTrayEnds();
  }
  function markTrayEnds() {
    const max = trayList.scrollWidth - trayList.clientWidth;
    trayList.classList.toggle('is-more-right', trayList.scrollLeft < max - 4);
    trayList.classList.toggle('is-more-left', trayList.scrollLeft > 4);
  }
  trayList.addEventListener('scroll', markTrayEnds, { passive: true });
  // PC の マウス：たての ホイールで よこへ スライド
  trayList.addEventListener('wheel', (e) => {
    if (!trayList.classList.contains('tray__list--scroll') || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    trayList.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
  window.addEventListener('resize', syncTrayScroll);

  function refreshTray() {
    Array.from(trayList.children).forEach((b) => {
      const k = b.dataset.key;
      const n = left[k] || 0;
      const t = TAKOS[k] || { name: k };
      b.querySelector('.tako__count').textContent = String(n);
      b.classList.toggle('is-on', k === takoKey);
      b.classList.toggle('is-empty', n <= 0);
      b.disabled = n <= 0;
      b.setAttribute('aria-checked', k === takoKey ? 'true' : 'false');
      b.setAttribute('aria-label', t.name + ' のこり ' + n + 'ひき');
    });
    const t = TAKOS[takoKey];
    trayNote.textContent = t ? t.name + '：' + (t.note || '') : '';
    syncTrayScroll();
  }

  function pickTako(k) {
    if (!(left[k] > 0)) return;
    takoKey = k;
    if (game) game.setTako(k);
    refreshTray();
  }

  // ---------- 投げる 人 ----------
  function throwersOf() {
    return THROWER_KEYS.filter((k) => unlocked[k]);
  }

  function buildThrowers() {
    throwerList.textContent = '';
    const can = throwersOf();
    if (!can.includes(throwerKey)) throwerKey = can[0] || 'nao';
    THROWER_KEYS.forEach((k) => {
      const p = THROWERS[k] || THROWER_FALLBACK[k];
      const ok = can.includes(k);
      const b = el('button', 'thrower');
      b.type = 'button';
      b.dataset.key = k;
      b.setAttribute('role', 'radio');
      b.appendChild(makeFace(k, 'thrower__face', p.color, p.name.slice(0, 1)));
      const body = el('span', 'thrower__body');
      body.appendChild(el('span', 'thrower__name', p.name));
      const lockNote = 'アイテムで なかまに';
      body.appendChild(el('span', 'thrower__note', ok ? String(p.note || '').replace(/\s*／\s*/g, '\n') : lockNote));
      b.appendChild(body);
      b.disabled = !ok;
      b.classList.toggle('is-locked', !ok);
      b.setAttribute('aria-label', p.name + '（' + (ok ? p.note : lockNote) + '）');
      b.addEventListener('click', () => pickThrower(k));
      throwerList.appendChild(b);
    });
    refreshThrowers();
  }

  function refreshThrowers() {
    Array.from(throwerList.children).forEach((b) => {
      const on = b.dataset.key === throwerKey;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function pickThrower(k) {
    if (!throwersOf().includes(k)) return;
    throwerKey = k;
    if (game) game.setThrower(k);
    refreshThrowers();
    const p = THROWERS[k] || THROWER_FALLBACK[k];
    if (playing && !ended) say(p.name + 'が 投げるよ（' + p.note + '）');
  }

  // ---------- ゲームからの しらせ ----------
  /** イカの 体力を ゲージに（のこりが へるほど バーが みじかく なる） */
  function showHp(hp, max) {
    const m = Math.max(1, max);
    const h = Math.max(0, hp);
    ratio = 1 - h / m;
    const pct = Math.round((h / m) * 100);
    gaugeBar.style.width = pct + '%';
    ratioText.textContent = '♥ ' + fmtHp(h) + ' / ' + fmtHp(m);
    gauge.setAttribute('aria-valuenow', String(pct));
    gauge.setAttribute('aria-valuetext', 'イカの たいりょく のこり ' + fmtHp(h));
    gauge.classList.toggle('is-goal', h <= 0);
  }
  const fmtHp = (v) => String(Math.round(v * 10) / 10);

  function onStats(st) {
    if (!st) return;
    showHp(st.hp, st.maxHp);
  }

  /** 台の アイテムを ひろった */
  function onItem(code, type, key) {
    if (ended || !lv) return;
    if (type === 'thrower') {
      unlocked[key] = true;
      if (!gained.throwers.includes(key)) gained.throwers.push(key);
      buildThrowers();
      const p = THROWERS[key] || THROWER_FALLBACK[key];
      say(p.name + 'が なかまに なった！ 下の ボタンで えらべるよ');
    } else if (type === 'tako') {
      left[key] = (left[key] || 0) + 1;
      gained.takos[key] = (gained.takos[key] || 0) + 1;
      buildTray();
      const t = TAKOS[key];
      say((t ? t.name : key) + 'を ゲット！ ' + (t && t.note ? '（' + t.note + '）' : ''));
    }
  }

  function onThrow(kind) {
    const k = left[kind] != null ? kind : takoKey;
    if (left[k] > 0) left[k] -= 1;
    // なくなったら つぎの タコを えらんで おく
    if (!(left[takoKey] > 0)) {
      const nx = takoList().find((x) => left[x] > 0);
      if (nx) { takoKey = nx; if (game) game.setTako(nx); }
    }
    refreshTray();
    const t = TAKOS[kind];
    say(t && (t.tap) ? 'いけー！（うごいて いる あいだに タップで わざ！）' : 'いけー！');
  }

  function onTurnEnd(st) {
    if (ended || !lv || !st) return;
    showHp(st.hp, st.maxHp);
    if (st.won) { levelClear(st); return; }
    if (takoLeft() <= 0) { levelFail(st); return; }
    const tip = st.combo > 0 ? 'コンボ ' + st.combo + '！ ' : '';
    say(tip + 'イカの のこり ♥' + fmtHp(st.hp) + '　タコ のこり ' + takoLeft() + 'ひき');
  }

  // ---------- クリア／失敗 ----------
  function starCount(st) {
    const n = takoLeft();
    let s = n >= 2 ? 3 : n === 1 ? 2 : 1;
    if (st && st.pocket) s += 1;      // 穴に おとしたら おまけ
    return Math.min(3, s);
  }

  function setStars(node, n) {
    node.textContent = '';
    for (let i = 0; i < 3; i += 1) node.appendChild(el('span', i < n ? '' : 'is-off', '★'));
    node.setAttribute('aria-label', 'ほし ' + n + 'つ');
  }

  function levelClear(st) {
    ended = true;
    playing = false;
    const stars = starCount(st);
    save.stars[level] = Math.max(starsOf(level), stars);
    if (mode === 'story') save.level = level + 1;
    const ls = levelScore(st);
    save.scores[level] = ls.total;
    let stage = null;
    if (isStageEnd(level)) {
      const s = stageOf(level);
      let sum = 0;
      for (let n = 1; n <= LAST; n += 1) if (stageOf(n) === s) sum += Math.max(0, Number(save.scores[n]) || 0);
      const bonus = stageBonus();
      const total = sum + bonus.total;
      const prev = bestOf(s);
      stage = { s, sum, bonus, total, prev, isNew: total > prev };
      if (stage.isNew) save.best[s] = total;
    }
    saveCarry();
    writeSave();
    if (game && typeof game.bossDown === 'function') game.bossDown();

    say('やったー！ ' + levelName(level) + ' クリア！');
    endTitle.textContent = levelName(level) + ' クリア！';
    endStars.hidden = false;
    setStars(endStars, stars);
    endText.textContent = st && st.pocket ? 'イカを 穴に おとした！ 一発 勝利！' : 'イカを たおした！';
    showScore(ls, stage);
    endMain.dataset.go = 'next';
    endSub.dataset.go = 'rest';
    endMainText.textContent = level >= LAST && mode === 'pick' ? 'えらぶ 画面へ' : 'つぎへ';
    endSubText.textContent = 'きょうは ここまで';
    openEnd();
  }

  /** おわりの 画面の 得点表 */
  function showScore(ls, stage) {
    endScore.textContent = '';
    const row = (label, pts, cls) => {
      const r = el('div', 'score__row' + (cls ? ' ' + cls : ''));
      r.appendChild(el('span', 'score__label', label));
      r.appendChild(el('span', 'score__pts', (cls ? '' : '+') + fmtPt(pts)));
      endScore.appendChild(r);
    };
    ls.rows.forEach((r) => row(r[0], r[1]));
    row(levelName(level) + ' の 得点', ls.total, 'is-total');
    if (stage) {
      if (stage.bonus.rows.length) {
        endScore.appendChild(el('p', 'score__head', 'あまった アイテムを 得点に'));
        stage.bonus.rows.forEach((r) => row(r[0], r[1]));
      }
      row(stage.s + '面の 合計', stage.total, 'is-stage');
      row(stage.isNew ? 'ハイスコア 更新！' : 'ハイスコア', stage.isNew ? stage.total : stage.prev, 'is-best' + (stage.isNew ? ' is-new' : ''));
    } else {
      const s = stageOf(level);
      let sum = 0;
      for (let n = 1; n <= level; n += 1) if (stageOf(n) === s) sum += Math.max(0, Number(save.scores[n]) || 0);
      row(s + '面 ここまで', sum, 'is-stage');
      if (bestOf(s)) row('ハイスコア', bestOf(s), 'is-best');
    }
    endScore.hidden = false;
  }

  function levelFail(st) {
    ended = true;
    playing = false;
    say('タコが なくなっちゃった…');
    endTitle.textContent = 'もう すこし！';
    endStars.hidden = true;
    endScore.hidden = true;
    endText.textContent = 'イカの のこり ♥' + fmtHp(st ? st.hp : 0) + '\n場の タコに あてて コンボを ねらおう';
    endMain.dataset.go = 'retry';
    endSub.dataset.go = 'title';
    endMainText.textContent = 'もういちど';
    endSubText.textContent = 'タイトルへ';
    openEnd();
  }

  function openEnd() {
    // ブロックが くずれる ところを すこし 見せてから
    setTimeout(() => {
      if (!ended) return;
      pauseGame(true);
      endModal.hidden = false;
      try { endMain.focus({ preventScroll: true }); } catch (e) { /* なにもしない */ }
    }, 700);
  }

  endMain.addEventListener('click', () => {
    const go = endMain.dataset.go;
    endModal.hidden = true;
    if (go === 'retry') { playLevel(level); return; }
    goNext();
  });

  endSub.addEventListener('click', () => {
    const go = endSub.dataset.go;
    endModal.hidden = true;
    if (go === 'rest') { restHere(); return; }
    showTitle();
  });

  /** クリアの あとの「つぎへ」 */
  function goNext() {
    const done = level;
    if (mode === 'pick') {
      if (done < LAST && done + 1 <= maxPickable()) playLevel(done + 1);
      else openPick();
      return;
    }
    afterStoryClear(done, () => beginStoryLevel(done + 1));
  }

  /** 「きょうは ここまで」：面の おわりなら その 場面を 見てから タイトルへ */
  function restHere() {
    if (mode === 'story') { afterStoryClear(level, showTitle); return; }
    showTitle();
  }

  /** ストーリーで done を クリアした あと。面の 3つめなら clearN、24 の あとは ending まで */
  function afterStoryClear(done, then) {
    const lastOfStage = innerOf(done) === PER_STAGE || done >= LAST;
    const finale = done >= LAST_STORY_LEVEL || done >= LAST;
    const sceneKey = innerOf(done) === PER_STAGE ? 'clear' + stageOf(done) : '';
    if (!lastOfStage) { then(); return; }
    pauseGame(true);
    playScene(sceneKey, () => {
      if (!finale) { then(); return; }
      if (done >= LAST_STORY_LEVEL) playScene('ending', showTitle);
      else {
        // STAGES が まだ そろって いない とき（じゅんび中）
        say('つづきは じゅんび中です。また あそんでね！');
        showTitle();
      }
    });
  }

  // ---------- ストーリーの 流れ ----------
  function playScene(key, done) {
    let called = false;
    const once = () => { if (!called) { called = true; done(); } };
    try {
      if (key && SP && typeof SP.play === 'function' && (typeof SP.has !== 'function' || SP.has(key))) {
        playing = false;
        pauseGame(true);
        SP.play(key, once);
        return;
      }
    } catch (e) { console.error(e); }
    once();
  }

  /** ストーリーの レベルを はじめる。面の 1つめなら 先に stageN */
  function beginStoryLevel(n) {
    mode = 'story';
    const target = Math.max(1, Math.min(LAST, n));
    if (innerOf(target) === 1) {
      loadLevel(target);           // うしろで 城を 組んで おく
      pauseGame(true);
      playing = false;
      playScene('stage' + stageOf(target), () => playLevel(target));
    } else {
      playLevel(target);
    }
  }

  function startFromBeginning() {
    mode = 'story';
    playScene('prologue', () => {
      save.seenPrologue = true;
      writeSave();
      beginStoryLevel(1);
    });
  }

  function continueStory() {
    mode = 'story';
    beginStoryLevel(save.level);
  }

  function showTitle() {
    endModal.hidden = true;
    pickModal.hidden = true;
    playing = false;
    pauseGame(true);
    if (!SP) { openPick(); return; }
    const canContinue = save.seenPrologue && save.level > 1 && save.level <= LAST;
    const cleared = Object.keys(save.stars).filter((k) => starsOf(Number(k)) > 0).length;
    SP.showTitle({
      onContinue: canContinue ? continueStory : undefined,
      continueNote: canContinue ? stageOf(save.level) + '面 ' + levelName(save.level) + ' から' : '',
      onStory: startFromBeginning,
      storyNote: 'オープニングから',
      onChallenge: openPick,
      challengeLabel: 'えらんで あそぶ',
      challengeNote: cleared ? 'クリア ' + cleared + ' ／ ' + LAST : 'レベル 1 から',
    });
  }

  // ---------- えらんで あそぶ ----------
  function openPick() {
    playing = false;
    pauseGame(true);
    endModal.hidden = true;
    pickList.textContent = '';
    const top = Math.max(1, maxPickable());
    const byStage = new Map();
    for (let n = 1; n <= LAST; n += 1) {
      const s = stageOf(n);
      if (!byStage.has(s)) byStage.set(s, []);
      byStage.get(s).push(n);
    }
    let first = null;
    byStage.forEach((list, s) => {
      if (list[0] > top) return;   // まだ 見えない 面は 出さない
      const box = el('section', 'picks__stage');
      const head = el('h3', 'picks__name', stageTitle(s).trim());
      if (bestOf(s)) head.appendChild(el('span', 'picks__best', 'ハイスコア ' + fmtPt(bestOf(s))));
      box.appendChild(head);
      const row = el('div', 'picks__row');
      list.forEach((n) => {
        const b = el('button', 'pick');
        b.type = 'button';
        const st = starsOf(n);
        b.appendChild(el('span', 'pick__name', levelName(n)));
        const stars = el('span', 'pick__stars');
        setStars(stars, st);
        stars.setAttribute('aria-hidden', 'true');
        b.appendChild(stars);
        b.disabled = n > top;
        if (n === top && !st) b.classList.add('is-new');
        b.setAttribute('aria-label', levelName(n) + (n > top ? '（まだ えらべない）' : st ? '（ほし ' + st + 'つ）' : '（まだ クリア していない）'));
        b.addEventListener('click', () => { mode = 'pick'; playLevel(n); });
        if (!b.disabled && (n === top || !first)) first = b;
        row.appendChild(b);
      });
      box.appendChild(row);
      pickList.appendChild(box);
    });
    pickModal.hidden = false;
    try { if (first) first.focus({ preventScroll: true }); } catch (e) { /* なにもしない */ }
  }

  $('btnPickClose').addEventListener('click', () => {
    pickModal.hidden = true;
    if (SP) showTitle();
    else playLevel(level);
  });

  // ---------- したの ボタン ----------
  $('btnRetry').addEventListener('click', () => {
    if (!endModal.hidden || !pickModal.hidden) return;
    playLevel(level);
  });
  $('btnTitle').addEventListener('click', () => showTitle());

  // Esc で モーダルを とじる（えらぶ 画面だけ）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !pickModal.hidden) $('btnPickClose').click();
  });

  // ---------- はじまり ----------
  loadSave();
  initGame();
  loadLevel(Math.min(save.level, LAST));
  pauseGame(true);
  showTitle();
})();
