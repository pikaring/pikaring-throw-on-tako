/* タイトル画面と ストーリー画面（前作 cat-on-escape と 同じ しくみ）。window.StoryPlayer を つくる。形は docs/story-mode.md を 見る。
 *
 *   StoryPlayer.showTitle({ storyNote, onStory, onChallenge })  タイトル画面
 *   StoryPlayer.play(key, onDone)                               場面を 再生（おわると 閉じて onDone）
 *   StoryPlayer.has(key)                                        場面が あるか
 *
 * 画像は 読みこめた ときだけ つかう。読めない 背景は 単色、読めない 立ち絵は 名前の 丸い札に なる。
 * DOM は ぜんぶ ここで つくって document.body に くわえる（index.html は さわらない）。
 */
(() => {
  'use strict';

  const TYPE_MS = 30;          // 1文字の はやさ
  const FADE_MS = 350;         // 背景の フェード（story.css の story-fade と そろえる）
  const FIG_MS = 320;          // 立ち絵の 出入り（story.css と そろえる）
  const PRELOAD_WAIT = 600;    // 場面の はじめに 画像を 待つ いちばん 長い 時間
  const DEFAULT_BG = '#23506e';
  const DEFAULT_TITLE = '街と、その白い壁';
  const DEFAULT_SUBTITLE = '〜The City and Its White Squid〜';

  // 札の いろ（立ち絵が 読めない とき）
  const CAST_COLORS = {
    nao: '#27407a',
    fumi: '#d9731f',
    maki: '#1f7a3d',
    chika: '#b0457a',
    daiou: '#8e1b1b',
    queen: '#5b6b8a',
  };
  const TAKO_COLOR = '#c0392b';
  const IKA_COLOR = '#7c8ea3';
  const OTHER_COLOR = '#444c55';

  const FACE_EMOJI = {
    normal: '🙂', happy: '😄', surprised: '😲', serious: '😠', angry: '😡', down: '😵',
  };

  const reduceMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const story = () => (window.STORY && typeof window.STORY === 'object' ? window.STORY : null);

  // ---------- 画像：読めた ときだけ つかう ----------
  // url → 'ok' | 'bad' | [まっている コールバック]
  const imgState = new Map();

  function loadImage(url, cb) {
    if (!url) { cb(false); return; }
    const st = imgState.get(url);
    if (st === 'ok') { cb(true); return; }
    if (st === 'bad') { cb(false); return; }
    if (Array.isArray(st)) { st.push(cb); return; }
    const waiters = [cb];
    imgState.set(url, waiters);
    const img = new Image();
    const done = (ok) => {
      imgState.set(url, ok ? 'ok' : 'bad');   // 読めない ものは おぼえて 再試行しない
      waiters.forEach((fn) => { try { fn(ok); } catch (e) { console.error(e); } });
    };
    img.onload = () => done(img.naturalWidth > 0);
    img.onerror = () => done(false);
    img.src = url;
  }

  const imageReady = (url) => !!url && imgState.get(url) === 'ok';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- データの よみとり ----------
  function castOf(key) {
    const s = story();
    return (s && s.cast && s.cast[key]) || null;
  }
  function castName(key) {
    const c = castOf(key);
    return (c && c.name) || key || '';
  }
  function castColor(key) {
    if (CAST_COLORS[key]) return CAST_COLORS[key];
    if (/^tako/.test(key || '')) return TAKO_COLOR;
    if (/^ika/.test(key || '')) return IKA_COLOR;
    return OTHER_COLOR;
  }
  /** 立ち絵の 立つ 高さ（1 ＝ いちばん 高い）と 大きさ。背の ちがいを 出す */
  function castFit(key) {
    const c = castOf(key) || {};
    const num = (v, d) => (typeof v === 'number' && v > 0 && v <= 1.5 ? v : d);
    return { height: num(c.height, 1), size: num(c.size, 1) };
  }
  function faceUrl(key, face) {
    const c = castOf(key);
    if (!c || !c.faces) return '';
    return c.faces[face] || '';
  }
  function bgOf(key) {
    const s = story();
    const b = (key && s && s.backgrounds && s.backgrounds[key]) || {};
    return { image: b.image || '', color: b.color || DEFAULT_BG };
  }
  // 'nao:happy' → { key: 'nao', face: 'happy' }
  function parseSlot(v) {
    if (v == null || v === '') return null;
    const [key, face] = String(v).split(':');
    return key ? { key, face: face || '' } : null;
  }

  function has(key) {
    const s = story();
    const list = s && s.scenes && s.scenes[key];
    return Array.isArray(list) && list.length > 0;
  }

  // ---------- いま 出ている 画面（1つだけ） ----------
  let current = null;   // { root, destroy() }

  function closeCurrent() {
    if (current) {
      const c = current;
      current = null;
      c.destroy();
    }
  }

  // =========================================================
  //  タイトル画面
  // =========================================================
  function showTitle(opts) {
    const o = opts || {};
    closeCurrent();
    const s = story();

    const root = el('div', 'story-title');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'storyTitleName');

    const bg = bgOf('title');
    const bgLayer = el('div', 'story-title__bg');
    bgLayer.style.backgroundColor = bg.color;
    root.appendChild(bgLayer);
    if (bg.image) {
      loadImage(bg.image, (ok) => {
        if (!ok) return;
        bgLayer.style.backgroundImage = `url("${bg.image}")`;
        root.classList.add('has-image');
      });
    }

    const head = el('div', 'story-title__head');
    const h1 = el('h1', 'story-title__name', (s && s.title) || DEFAULT_TITLE);
    h1.id = 'storyTitleName';
    head.appendChild(h1);
    const sub = el('p', 'story-title__sub', (s && s.subtitle) || DEFAULT_SUBTITLE);
    head.appendChild(sub);
    root.appendChild(head);

    // ロゴの 画像（STORY.logo）が 読めたら、文字の かわりに 出す（読みあげは 文字の まま）
    if (s && s.logo) {
      loadImage(s.logo, (ok) => {
        if (!ok || !head.isConnected) return;
        const img = el('img', 'story-title__logo');
        img.src = s.logo;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        head.insertBefore(img, h1);
        head.classList.add('has-logo');
      });
    }

    const btns = el('div', 'story-title__btns');
    const self = {
      root,
      destroy() { root.remove(); },
    };
    const mk = (cls, icon, text, sub, cb) => {
      const b = el('button', `story-btn ${cls}`);
      b.type = 'button';
      b.appendChild(el('span', 'story-btn__icon', icon)).setAttribute('aria-hidden', 'true');
      b.appendChild(el('span', 'story-btn__text', text));
      if (sub) b.appendChild(el('span', 'story-btn__sub', sub));
      b.addEventListener('click', () => {
        if (current !== self) return;
        closeCurrent();
        if (typeof cb === 'function') cb();
      });
      btns.appendChild(b);
      return b;
    };
    // つづきが あれば「つづきから」「はじめから」を ならべる（onContinue が ある とき）
    let btnStory;
    if (typeof o.onContinue === 'function') {
      btnStory = mk('story-btn--continue', '🔖', 'つづきから', o.continueNote || '', o.onContinue);
      mk('story-btn--story', '📖', 'はじめから', o.storyNote || 'オープニングから', o.onStory);
      btns.classList.add('is-three');
    } else {
      btnStory = mk('story-btn--story', '📖', 'ストーリー', o.storyNote || 'はじめから', o.onStory);
    }
    // 3つめの ボタン（このゲームでは「えらんで あそぶ」）。onChallenge が ない ときは 出さない
    if (typeof o.onChallenge === 'function') {
      mk('story-btn--challenge', o.challengeIcon || '🐙', o.challengeLabel || 'えらんで あそぶ', o.challengeNote || '', o.onChallenge);
    }
    root.appendChild(btns);

    current = self;
    document.body.appendChild(root);
    try { btnStory.focus({ preventScroll: true }); } catch (e) { /* なにもしない */ }
  }

  // =========================================================
  //  ストーリー画面
  // =========================================================
  function play(key, onDone) {
    closeCurrent();
    const done = typeof onDone === 'function' ? onDone : () => {};
    if (!has(key)) { done(); return; }
    const steps = story().scenes[key];

    // --- DOM ---
    const root = el('div', 'story-play');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'ストーリー');

    const stage = el('div', 'story-stage');
    stage.tabIndex = -1;
    root.appendChild(stage);

    const bgBox = el('div', 'story-bgbox');
    const figs = el('div', 'story-figs');
    const win = el('div', 'story-window');
    const nameTag = el('p', 'story-window__name');
    nameTag.hidden = true;
    const textBox = el('p', 'story-window__text');
    textBox.setAttribute('aria-hidden', 'true');     // 1文字ずつ 読みあげ ない よう、全文は live に
    const live = el('p', 'story-sr');
    live.setAttribute('aria-live', 'polite');
    const nextMark = el('span', 'story-window__next', '▼');
    nextMark.setAttribute('aria-hidden', 'true');
    win.append(nameTag, textBox, live, nextMark);
    const skip = el('button', 'story-skip', 'スキップ');
    skip.type = 'button';
    stage.append(bgBox, figs, win, skip);

    // --- 状態 ---
    let idx = -1;                    // いま 出ている コマ
    let bgKey;
    const slots = { left: null, right: null };   // { key, node, inner, face }
    const faceOf = {};               // 人ごとの いまの 表情（はじめは normal）
    let who = null;
    let fullText = '';
    let chars = [];
    let shown = 0;
    let typing = null;
    let started = false;
    let finished = false;
    const timers = new Set();

    const later = (fn, ms) => {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
    };

    // --- 背景 ---
    function setBg(k) {
      bgKey = k;
      const b = bgOf(k);
      const layer = el('div', 'story-bg');
      layer.style.backgroundColor = b.color;
      if (imageReady(b.image)) layer.style.backgroundImage = `url("${b.image}")`;
      else if (b.image) {
        loadImage(b.image, (ok) => {
          if (ok && layer.isConnected) layer.style.backgroundImage = `url("${b.image}")`;
        });
      }
      const olds = Array.from(bgBox.children);
      const fade = olds.length > 0 && !reduceMotion();
      if (fade) layer.classList.add('is-fading');
      bgBox.appendChild(layer);
      if (olds.length) later(() => olds.forEach((n) => n.remove()), fade ? FADE_MS + 30 : 0);
    }

    // --- 立ち絵 ---
    function drawFig(inner, k) {
      const face = faceOf[k] || 'normal';
      // その 表情の 絵が 読めない ときは、ふつうの 顔の 絵で 代わりに 出す（札よりも 絵を 優先）
      let url = faceUrl(k, face);
      if (face !== 'normal' && imgState.get(url) === 'bad' && faceUrl(k, 'normal')) url = faceUrl(k, 'normal');
      inner.textContent = '';
      inner.dataset.face = face;
      if (imageReady(url)) {
        const img = el('img', 'story-fig__img');
        img.src = url;
        img.alt = '';
        img.draggable = false;
        inner.appendChild(img);
        return;
      }
      // 札（画像が 読めない／まだ 読めて いない）
      const badge = el('div', 'story-fig__badge');
      badge.style.backgroundColor = castColor(k);
      badge.appendChild(el('span', 'story-fig__badge-name', castName(k)));
      badge.appendChild(el('span', 'story-fig__badge-face', FACE_EMOJI[face] || FACE_EMOJI.normal));
      inner.appendChild(badge);
      if (url && imgState.get(url) !== 'bad') {
        loadImage(url, (ok) => {
          // 読めなかった 表情は、ふつうの 顔で かき直す
          if ((ok || face !== 'normal') && inner.isConnected && inner.dataset.face === face) drawFig(inner, k);
        });
      }
    }

    function refreshFig(side) {
      const s = slots[side];
      if (!s) return;
      const face = faceOf[s.key] || 'normal';
      if (s.face !== face) { s.face = face; drawFig(s.inner, s.key); }
    }

    function setSlot(side, value) {
      const p = parseSlot(value);
      if (p && p.face) faceOf[p.key] = p.face;
      const cur = slots[side];
      if (cur && p && cur.key === p.key) { refreshFig(side); return; }   // 同じ 人：表情だけ
      if (cur) {                                                        // 前の 人は 退場
        const node = cur.node;
        slots[side] = null;
        if (reduceMotion()) node.remove();
        else {
          node.classList.remove('is-entering', 'is-speaking');
          node.classList.add('is-leaving');
          later(() => node.remove(), FIG_MS);
        }
      }
      if (!p) return;
      const node = el('div', `story-fig story-fig--${side}`);
      const fit = castFit(p.key);
      node.style.setProperty('--drop', String(Math.max(0, 1 - fit.height)));
      node.style.setProperty('--size', String(fit.size));
      const inner = el('div', 'story-fig__inner');
      node.appendChild(inner);
      const face = faceOf[p.key] || 'normal';
      drawFig(inner, p.key);
      if (!reduceMotion()) node.classList.add('is-entering');
      figs.appendChild(node);
      slots[side] = { key: p.key, node, inner, face };
    }

    function refreshSpeaking() {
      ['left', 'right'].forEach((side) => {
        const s = slots[side];
        if (s) s.node.classList.toggle('is-speaking', !!who && s.key === who);
      });
    }

    // --- セリフ ---
    function stopTyping() {
      if (typing) { clearInterval(typing); typing = null; }
    }
    function showAll() {
      stopTyping();
      shown = chars.length;
      textBox.textContent = fullText;
      win.classList.add('is-complete');
    }
    function startText(text) {
      stopTyping();
      fullText = String(text);
      chars = Array.from(fullText);
      shown = 0;
      textBox.textContent = '';
      live.textContent = (who ? castName(who) + '「' : '') + fullText + (who ? '」' : '');
      win.classList.remove('is-complete');
      if (reduceMotion() || !chars.length) { showAll(); return; }
      typing = setInterval(() => {
        shown += 1;
        textBox.textContent = chars.slice(0, shown).join('');
        if (shown >= chars.length) showAll();
      }, TYPE_MS);
    }

    // --- コマ ---
    function apply(step) {
      if (!step || typeof step !== 'object') return false;
      root.classList.remove('is-picture');
      if (step.bg && step.bg !== bgKey) setBg(step.bg);
      if ('left' in step) setSlot('left', step.left);
      if ('right' in step) setSlot('right', step.right);
      if (step.who && step.face) faceOf[step.who] = step.face;
      refreshFig('left');
      refreshFig('right');
      if (step.picture) {                          // 絵だけを 見せる コマ（セリフ窓と 立ち絵を かくし、タップを まつ）
        stopTyping();
        root.classList.add('is-picture');
        live.textContent = '';
        return true;
      }
      const hasText = step.text != null && step.text !== '';
      if (!hasText) return false;
      who = step.who || null;
      nameTag.hidden = !who;
      if (who) {
        nameTag.textContent = castName(who);
        nameTag.style.backgroundColor = castColor(who);
        nameTag.classList.toggle('is-right', !!(slots.right && slots.right.key === who));
      }
      win.classList.toggle('is-narration', !who);
      refreshSpeaking();
      startText(step.text);
      return true;
    }

    function next() {
      if (finished) return;
      for (;;) {
        idx += 1;
        if (idx >= steps.length) { finish(); return; }
        if (apply(steps[idx])) return;           // text が ない コマは すぐ つぎへ
      }
    }

    function advance() {
      if (!started || finished) return;
      if (typing) showAll();
      else next();
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (current === self) closeCurrent();
      done();
    }

    // --- 入力 ---
    root.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('.story-skip')) return;
      advance();
    });
    skip.addEventListener('click', (e) => {
      e.stopPropagation();
      finish();
    });
    const onKey = (e) => {
      if (current !== self) return;
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      if (e.target && e.target.closest && e.target.closest('button')) return;   // ボタンは ボタンの まま
      e.preventDefault();
      if (e.repeat) return;
      advance();
    };
    document.addEventListener('keydown', onKey);

    const self = {
      root,
      destroy() {
        finished = true;
        stopTyping();
        timers.forEach((t) => clearTimeout(t));
        timers.clear();
        document.removeEventListener('keydown', onKey);
        root.remove();
      },
    };
    current = self;

    // はじめの 背景（台本に bg が なければ 単色）
    setBg((steps.find((st) => st && st.bg) || {}).bg);
    document.body.appendChild(root);
    try { stage.focus({ preventScroll: true }); } catch (e) { /* なにもしない */ }

    // 場面の 画像を 先に 読んでおく（待つのは すこしだけ）
    const urls = new Set();
    const faces = {};
    steps.forEach((st) => {
      if (!st || typeof st !== 'object') return;
      if (st.bg) urls.add(bgOf(st.bg).image);
      ['left', 'right'].forEach((side) => {
        const p = parseSlot(st[side]);
        if (!p) return;
        if (p.face) faces[p.key] = p.face;
        urls.add(faceUrl(p.key, faces[p.key] || 'normal'));
      });
      if (st.who) {
        if (st.face) faces[st.who] = st.face;
        urls.add(faceUrl(st.who, faces[st.who] || 'normal'));
      }
    });
    urls.delete('');
    let waiting = urls.size;
    const begin = () => {
      if (started || current !== self) return;
      started = true;
      next();
    };
    if (!waiting) begin();
    else {
      urls.forEach((u) => loadImage(u, () => { waiting -= 1; if (!waiting) begin(); }));
      later(begin, PRELOAD_WAIT);
    }
  }

  window.StoryPlayer = { showTitle, play, has };
})();
