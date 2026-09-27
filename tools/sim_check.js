#!/usr/bin/env node
/* 城の 検証（node tools/sim_check.js [レベル番号 …]）
 *
 *   (a) 静止：何も 投げずに 5秒 まわして、1つも 動かない・消えない
 *   (b) クリア：角度×強さ（×タップの 位置）の グリッドから いちばん よく こわせる 投げを えらぶ、を くり返して、
 *       入れた タコの かず 以内に goal に とどくか。投げる 人は 順番（ナオ→フミ→マキ→チカ→…）
 *       あわせて 毎回 上位 10% の 投げを えらんだ 場合（そこそこ 上手な 人）も 出す（難しさの めやす。合否には 入れない）
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

function makeCanvas(w, h) {
  const ctx = new Proxy({}, { get: () => noop, set: () => true });
  return {
    getContext: () => ctx,
    addEventListener: noop,
    setPointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w || 1200, height: h || 700 }),
  };
}

function newGame(lv) {
  const g = TakoGame.create(makeCanvas(), {});
  g.load(lv, { boss: 'ika1' });
  g._sim.setPhase('aim');
  return g;
}

// ---------- 描画が 例外なく とおるか（たて長・よこ長・ふつう） ----------
function drawCheck(lv) {
  for (const [w, h] of [[390, 560], [1920, 760], [1000, 620]]) {
    const g = TakoGame.create(makeCanvas(w, h), {});
    g.load(lv, { boss: 'ika1' });
    g.resize();
    g._sim.draw();
    g._sim.setPhase('aim');
    g._sim.setPull({ x: -80, y: 60 });
    g._sim.draw();
    g.setTako('tako4');
    g.setThrower('chika');
    g._sim.setPull({ x: -100, y: 60 });
    g._sim.throwNow();
    for (let i = 0; i < 90; i += 1) { g._sim.step(1 / 60); if (i === 40) g._sim.tap(); g._sim.draw(); }
  }
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
  let dbgAt = '';
  while (g.phase !== 'aim' && t < 20) {
    g._sim.step(1 / 60);
    t += 1 / 60;
    if (process.env.SIMDBG && !dbgAt && t > 12) dbgAt = dbgState(g);
    if (!tapped) {
      const ts = g._sim.takos();
      if (!ts.length) tapped = true;
      else if (ts[0].x >= c.tapX) { g._sim.tap(); tapped = true; }
    }
  }
  if (process.env.SIMDBG && t > 12) console.error('long', JSON.stringify(c), t.toFixed(1), g.phase, dbgAt);
  return { t };
}
function dbgState(g) {
  {
    return g._sim.takos().length + ' takos ' +
      g._sim.blocks().filter((b) => !b.dead && b.awake).map((b) => `${b.kind}${b.w / 34 | 0}x${b.h / 34 | 0} @${b.x.toFixed(1)},${b.y.toFixed(1)} v${b.vx.toFixed(1)},${b.vy.toFixed(1)} tip${b.tip} still${b.still.toFixed(2)}`).join(' | ');
  }
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
//   pct = 0    ：毎回 いちばん よい 投げ（クリアできるかの 確認）
//   pct = 0.1  ：毎回 上位 10% の 投げ（「そこそこ 上手な 人」の めやす。難しさの 調整用）
function solve(lv, pct) {
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
    const all = [];
    for (const c of candidates(lv, g, left, thrower)) {
      g._sim.restore(snap);
      const r = runThrow(g, c);
      maxT = Math.max(maxT, r.t);
      // 同じ こわれ方なら ふるい タコ（かんたんな 方）を 優先
      all.push({ score: g.stats().broken - TakoGame.TAKO_ORDER.indexOf(c.tako) * 0.01, c });
    }
    all.sort((a, b) => b.score - a.score);
    const pickd = all[Math.floor(all.length * pct)];
    g._sim.restore(snap);
    runThrow(g, pickd.c);
    left[pickd.c.tako] -= 1;
    used += 1;
    const c = pickd.c;
    log.push(`${c.thrower}:${TakoGame.TAKOS[c.tako].short}@${c.angle}/${c.power}${c.tapX != null ? '/tap' + Math.round(c.tapX) : ''}→${g.stats().broken}`);
  }
  const s = g.stats();
  return { ok: s.ratio >= lv.goal, used, ratio: s.ratio, total, log, maxT };
}

// ---------- 実行 ----------
//   node tools/sim_check.js          ぜんぶ（CPU の かずだけ 並列）
//   node tools/sim_check.js 5 12     レベルを えらんで（投げの 記録も 出す）
function checkLevel(lv, verbose) {
  const t0 = Date.now();
  drawCheck(lv);
  const bad = staticCheck(lv);
  const r = solve(lv, 0);
  const p = solve(lv, 0.1);
  const n = Object.values(lv.takos).reduce((a, b) => a + b, 0);
  const ok = !bad.length && r.ok;
  let line = `| ${lv.no} | ${lv.name} | ${r.total} | ${lv.goal} | ${bad.length ? 'NG ' + bad.slice(0, 4).join(' ') : 'OK'} | ${r.ok ? 'OK' : 'NG'} | ${r.used} / ${n} | ${Math.round(r.ratio * 100)}% | ${p.ok ? p.used + ' / ' + n : 'とどかず'} (${Math.round(p.ratio * 100)}%) | ${((Date.now() - t0) / 1000).toFixed(1)}s |`;
  if (verbose) line += '\n   最良: ' + r.log.join('  ') + `  (1投の 最長 ${Math.max(r.maxT, p.maxT).toFixed(1)}秒)\n   上位10%: ` + p.log.join('  ');
  return { no: lv.no, ok, line };
}

const args = process.argv.slice(2);
if (args[0] === '--worker') {
  const nos = args.slice(1).map(Number);
  STAGES.filter((lv) => nos.includes(lv.no)).forEach((lv) => {
    process.stdout.write(JSON.stringify(checkLevel(lv, true)) + '\n');
  });
  process.exit(0);
}

const pick = args.map(Number).filter(Boolean);
const list = pick.length ? STAGES.filter((lv) => pick.includes(lv.no)) : STAGES;
const verbose = args.includes('-v') || pick.length > 0;
const jobs = Math.max(1, Math.min(list.length, require('os').cpus().length));

console.log('| No | 名前 | ブロック | goal | 静止 | クリア | 最良で 使った タコ | こわした わりあい | 上位10%の 投げで | 計算 |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');

// 重い（うしろの）レベルから 順に くばる
const buckets = Array.from({ length: jobs }, () => []);
list.slice().reverse().forEach((lv, i) => {
  const k = Math.floor(i / jobs) % 2 ? jobs - 1 - (i % jobs) : i % jobs;
  buckets[k].push(lv.no);
});
const { spawn } = require('child_process');
const results = [];
let running = 0;
buckets.filter((b) => b.length).forEach((nos) => {
  running += 1;
  const ch = spawn(process.execPath, [__filename, '--worker', ...nos.map(String)], { stdio: ['ignore', 'pipe', 'inherit'] });
  let buf = '';
  ch.stdout.on('data', (d) => { buf += d; });
  ch.on('close', (code) => {
    buf.split('\n').filter(Boolean).forEach((l) => results.push(JSON.parse(l)));
    if (code) results.push({ no: nos[0], ok: false, line: `| ${nos.join(',')} | (エラーで 止まった) |` });
    running -= 1;
    if (running) return;
    results.sort((a, b) => a.no - b.no);
    results.forEach((r) => console.log(verbose ? r.line : r.line.split('\n')[0]));
    const bad = results.filter((r) => !r.ok);
    console.log(bad.length ? `\nNG: ${bad.map((r) => r.no).join(', ')}` : '\nぜんぶ OK');
    process.exit(bad.length || results.length < list.length ? 1 : 0);
  });
});
