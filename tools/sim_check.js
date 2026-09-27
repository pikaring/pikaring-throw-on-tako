#!/usr/bin/env node
/* 城の 検証（node tools/sim_check.js [レベル番号 …]）
 *
 *   (a) 静止：何も 投げずに 5秒 まわして、1つも 動かない・消えない
 *   (b) クリア：角度×強さ（×タップの 位置）の グリッドから いちばん よく こわせる 投げを えらぶ、を くり返して、
 *       入れた タコの かず 以内に goal に とどくか。投げる 人は 順番（ナオ→フミ→マキ→チカ→…）
 *
 *   ブラウザの ものは 最小限の スタブ。app/game.js の _sim から 物理だけ まわす。
 *   すべて とおれば 終了コード 0、どれか だめなら 1。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// ---------- ブラウザの スタブ ----------
const noop = () => {};
const sandbox = {
  console, Math, JSON, performance,
  Image: class { set src(v) { this._src = v; } },   // onload は 呼ばない（画像なしの 表示）
  document: { addEventListener: noop },
  requestAnimationFrame: noop,
};
sandbox.window = sandbox;
sandbox.addEventListener = noop;
vm.createContext(sandbox);
for (const f of ['app/stages.js', 'app/game.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
}
const { TakoGame, STAGES } = sandbox;

function makeCanvas() {
  const ctx = new Proxy({}, { get: () => noop, set: () => true });
  return {
    getContext: () => ctx,
    addEventListener: noop,
    setPointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 700 }),
  };
}

function newGame(lv) {
  const g = TakoGame.create(makeCanvas(), {});
  g.load(lv, { boss: 'ika1' });
  g._sim.setPhase('aim');
  return g;
}

// ---------- (a) 静止 ----------
function staticCheck(lv) {
  const g = newGame(lv);
  const before = g._sim.blocks().map((b) => [b.x, b.y]);
  for (let i = 0; i < 600; i += 1) g._sim.physics(1 / 120);
  const bl = g._sim.blocks();
  const bad = [];
  bl.forEach((b, i) => {
    if (b.dead || b.awake || Math.abs(b.x - before[i][0]) > 0.01 || Math.abs(b.y - before[i][1]) > 0.01) {
      bad.push(`${b.kind}@(${Math.round((before[i][0] - bl[0].x) / TakoGame.CELL)},${Math.round(before[i][1])})`);
    }
  });
  return bad;
}

// ---------- 1回 投げて、ぜんぶ 止まるまで まわす ----------
const MAX_PULL = 125;
function runThrow(g, c) {
  g.setTako(c.tako);
  g.setThrower(c.thrower);
  const len = c.power * MAX_PULL;
  g._sim.setPull({ x: -Math.cos(c.angle) * len, y: -Math.sin(c.angle) * len });
  if (!g._sim.throwNow()) return { t: 0 };
  let t = 0;
  let tapped = c.tapX == null;
  while (g.phase !== 'aim' && t < 20) {
    g._sim.step(1 / 60);
    t += 1 / 60;
    if (!tapped) {
      const ts = g._sim.takos();
      if (!ts.length) tapped = true;
      else if (ts[0].x >= c.tapX) { g._sim.tap(); tapped = true; }
    }
  }
  return { t };
}

function castleSpan(g) {
  const bl = g._sim.blocks();
  let lo = Infinity;
  let hi = -Infinity;
  bl.forEach((b) => { lo = Math.min(lo, b.x); hi = Math.max(hi, b.x + b.w); });
  return { lo, hi };
}

const ANGLES = [];
for (let a = -1.25; a <= 0.26; a += 0.075) ANGLES.push(Math.round(a * 1000) / 1000);
const POWERS = [0.72, 0.8, 0.88, 0.95, 1];

function candidates(lv, g, left, thrower) {
  const span = castleSpan(g);
  const out = [];
  Object.keys(left).forEach((tako) => {
    if (!left[tako]) return;
    const T = TakoGame.TAKOS[tako];
    const taps = [null];
    if (T.tap === 'split') taps.push(span.lo - 250, span.lo - 120);
    if (T.tap === 'dive') { for (let k = 0.1; k < 1; k += 0.2) taps.push(span.lo + (span.hi - span.lo) * k); }
    ANGLES.forEach((angle) => POWERS.forEach((power) => taps.forEach((tapX) => {
      out.push({ tako, thrower, angle, power, tapX });
    })));
  });
  return out;
}

// ---------- (b) クリア ----------
function solve(lv) {
  const g = newGame(lv);
  const left = Object.assign({}, lv.takos);
  const total = g.stats().total;
  let used = 0;
  let turn = 0;
  const log = [];
  let maxT = 0;
  while (g.stats().ratio < lv.goal && Object.values(left).some((n) => n > 0)) {
    const thrower = lv.throwers[turn % lv.throwers.length];
    turn += 1;
    const snap = g._sim.save();
    let best = null;
    for (const c of candidates(lv, g, left, thrower)) {
      g._sim.restore(snap);
      const r = runThrow(g, c);
      maxT = Math.max(maxT, r.t);
      const s = g.stats();
      // 同じ こわれ方なら ふるい タコ（かんたんな 方）を 優先。わずかに 強さの 弱い 方も 優先
      const score = s.broken - TakoGame.TAKO_ORDER.indexOf(c.tako) * 0.01;
      if (!best || score > best.score) best = { score, c, broken: s.broken };
    }
    g._sim.restore(snap);
    runThrow(g, best.c);
    left[best.c.tako] -= 1;
    used += 1;
    log.push(`${best.c.thrower}:${TakoGame.TAKOS[best.c.tako].short}@${best.c.angle}/${best.c.power}${best.c.tapX != null ? '/tap' + Math.round(best.c.tapX) : ''}→${g.stats().broken}`);
  }
  const s = g.stats();
  return { ok: s.ratio >= lv.goal, used, ratio: s.ratio, total, log, maxT };
}

// ---------- 実行 ----------
const pick = process.argv.slice(2).map(Number).filter(Boolean);
const list = pick.length ? STAGES.filter((lv) => pick.includes(lv.no)) : STAGES;
const verbose = process.argv.includes('-v') || pick.length > 0;

console.log('| No | 名前 | ブロック | goal | 静止 | クリア | 使った タコ | こわした わりあい | 時間 |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
let allOk = true;
for (const lv of list) {
  const t0 = Date.now();
  const bad = staticCheck(lv);
  const r = solve(lv);
  const n = Object.values(lv.takos).reduce((a, b) => a + b, 0);
  const ok = !bad.length && r.ok;
  if (!ok) allOk = false;
  console.log(`| ${lv.no} | ${lv.name} | ${r.total} | ${lv.goal} | ${bad.length ? 'NG ' + bad.slice(0, 4).join(' ') : 'OK'} | ${r.ok ? 'OK' : 'NG'} | ${r.used} / ${n} | ${Math.round(r.ratio * 100)}% | ${((Date.now() - t0) / 1000).toFixed(1)}s |`);
  if (verbose) console.log('   ' + r.log.join('  ') + `  (1投の 最長 ${r.maxT.toFixed(1)}秒)`);
}
process.exit(allOk ? 0 : 1);
