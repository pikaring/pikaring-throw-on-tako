/* 24の 台を 確かめる（見下ろし型）。
 *
 *   node tools/sim_check.js          ぜんぶの レベル（CPU の かずだけ 並列）
 *   node tools/sim_check.js 5 12     レベルを えらんで、投げの 記録も 出す
 *
 * 確かめる こと：
 *   (a) 何も 投げずに まわしても イカも ブロックも うごかない
 *   (b) 毎回 いちばん よい 投げ（角度×強さ×人×タコ）を えらんで、入れた タコの かず 以内に 勝てる
 *   あわせて「上位 10% の 投げ」を 続けた ときの 結果も 出す（そこそこ 上手な 人の めやす。合否には 入れない）
 */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');

function loadGame() {
  const ctxStub = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  global.window = { devicePixelRatio: 1, addEventListener() {}, matchMedia: () => ({ matches: true }) };
  global.document = { addEventListener() {} };
  global.requestAnimationFrame = () => {};
  const root = path.join(__dirname, '..', 'app');
  for (const f of ['stages.js', 'game.js']) new Function(fs.readFileSync(path.join(root, f), 'utf8'))();
  const canvas = { getContext: () => ctxStub, getBoundingClientRect: () => ({ width: 360, height: 640 }), addEventListener() {}, isConnected: true };
  return { TG: global.window.TakoGame, STAGES: global.window.STAGES, canvas };
}

function checkLevel(no, verbose) {
  const { TG, STAGES, canvas } = loadGame();
  const lv = STAGES[no - 1];
  const g = TG.create(canvas, {});
  const boss = lv.stage === 8 ? 'queen' : 'ika1';
  g.load(lv, { boss });
  const sim = g._sim;
  // (a) 静止
  const before = JSON.stringify(sim.ika());
  sim.step(1);
  const still = JSON.stringify(sim.ika()) === before;

  const kinds = Object.keys(lv.takos);
  const angles = [];
  for (let a = -178; a <= -2; a += 7) angles.push((a * Math.PI) / 180);
  const powers = [0.55, 1];

  function play(pickRank) {
    g.load(lv, { boss });
    const left = Object.assign({}, lv.takos);
    const log = [];
    let used = 0;
    let res = sim.save();
    for (let turn = 0; turn < 20; turn += 1) {
      const have = kinds.filter((k) => left[k] > 0);
      if (!have.length) break;
      const tries = [];
      for (const kind of have) for (const who of lv.throwers) for (const p of powers) for (const a of angles) {
        sim.restore(res);
        sim.aim(Math.cos(a), Math.sin(a), p, who, kind);
        if (TG.TAKOS[kind].tap) { for (let i = 0; i < 9; i += 1) sim.step(1 / 30); sim.tap(); }
        const st = sim.runUntilQuiet(14);
        const score = (st.won ? 1000 : 0) + (st.maxHp - st.hp) * 10 + st.combo;
        tries.push({ score, kind, who, p, a, won: st.won, pocket: st.pocket, hp: st.hp, state: sim.save() });
      }
      tries.sort((x, y) => y.score - x.score);
      const pick = tries[Math.min(tries.length - 1, Math.floor(tries.length * pickRank))];
      res = pick.state;
      left[pick.kind] -= 1;
      used += 1;
      log.push(`${pick.who}/${pick.kind} ${Math.round((pick.a * 180) / Math.PI)}° ${pick.p} → hp ${pick.hp.toFixed(1)}${pick.pocket ? ' ポケット' : ''}`);
      if (pick.won) return { won: true, used, log, pocket: pick.pocket };
    }
    return { won: false, used, log };
  }
  const best = play(0);
  const good = play(0.1);
  return { no, name: lv.name, hp: lv.hp, n: Object.values(lv.takos).reduce((a, b) => a + b, 0), still, best, good, verbose };
}

if (process.argv[2] === '--child') {
  process.on('message', (m) => { process.send(checkLevel(m.no, false)); });
} else {
  const { STAGES } = loadGame();
  const pickNos = process.argv.slice(2).map(Number).filter(Boolean);
  const nos = pickNos.length ? pickNos : STAGES.map((l) => l.no);
  const results = [];
  let next = 0;
  const workers = Math.max(1, Math.min(os.cpus().length, nos.length));
  let alive = workers;
  for (let w = 0; w < workers; w += 1) {
    const c = fork(__filename, ['--child']);
    const feed = () => { if (next < nos.length) c.send({ no: nos[next++] }); else { c.kill(); alive -= 1; if (!alive) report(); } };
    c.on('message', (r) => { results.push(r); feed(); });
    feed();
  }
  function report() {
    results.sort((a, b) => a.no - b.no);
    let ok = true;
    console.log('| No | 名前 | 体力 | タコ | 静止 | 最良 | 上位10% |');
    console.log('|---|---|---|---|---|---|---|');
    results.forEach((r) => {
      const b = r.best.won ? `${r.best.used}/${r.n}${r.best.pocket ? ' 穴' : ''}` : `✕ ${r.best.used}/${r.n}`;
      const g = r.good.won ? `${r.good.used}/${r.n}${r.good.pocket ? ' 穴' : ''}` : '✕';
      console.log(`| ${r.no} | ${r.name} | ${r.hp} | ${r.n} | ${r.still ? 'OK' : 'NG'} | ${b} | ${g} |`);
      if (!r.still || !r.best.won) ok = false;
      if (pickNos.length) { console.log('  最良:', r.best.log.join(' / ')); console.log('  上位10%:', r.good.log.join(' / ')); }
    });
    process.exit(ok ? 0 : 1);
  }
}
