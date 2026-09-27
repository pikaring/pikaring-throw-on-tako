# 開発の しくみ（分担と 受け渡しの 決まり）

「街と、その白い壁 〜throw on tako〜」を **3つの担当が 同時に 作る**ための 決まりです。
前作 cat-on-escape の `docs/story-mode.md` と 同じ やり方です。ここに 書いた 形（ファイル・データ・関数）を 守れば、
ほかの 担当を 待たずに 進められます。

公開 URL は `https://pikaring.github.io/throw-on-tako/`（リポジトリ名を `throw-on-tako` に 変える 前提）。

## どんな ゲームか

- 女子高生が **ひっぱって 角度と 強さを 決め**、タコを 投げて イカの 白い 城（壁）を こわす。
- タコは **ゆっくり くるくる 回りながら** 飛ぶ。
- 城は 白い ブロックの 積みかさね。**赤い ブロック**に あてると 爆発。**崩れた ブロックは 地面に ふれると 消える**。
  うまく 支えを ぬけば 一発で 崩れる。
- 城の ブロックを めあての わりあい（`goal`）以上 こわせば クリア。
- 物理演算は 自前（`app/game.js`）。依存ライブラリなし・通信なし。

## 全体の 流れ

```
タイトル ─┬─ はじめから ─→ prologue → stage1 → [1-1 1-2 1-3] → clear1 → stage2 → … → clear8 → ending → タイトル
          ├─ つづきから ─→ 保存した レベルから（面の はじめなら stageN を 先に）
          └─ えらんで あそぶ ─→ クリアした ところまでの レベルを 1つ えらぶ（会話なし）
```

- **1面＝3レベル（3つの 城）、全8面・24レベル**。レベル `n` の 面は `Math.ceil(n / 3)`。
- 面の 1つめを 始める まえに `stageN`、3つめを クリアしたら `clearN` の 場面を 再生する。

## 8つの 面

| 面 | 場所（背景キー） | イカ（`cast`） | 新しく 投げられる タコ |
| --- | --- | --- | --- |
| 1 | 通学路 `road` | イカ子 `ika1` | タコ一郎 `tako1`：ふつう |
| 2 | 商店街 `shotengai` | イカ美 `ika2` | タコ二郎 `tako2`：おもくて つきぬける |
| 3 | 路地裏 `roji` | イカ代 `ika3` | タコ三郎 `tako3`：よく はねる |
| 4 | 公園 `park` | イカ奈 `ika4` | タコ四郎 `tako4`：空中タップで 3びきに わかれる |
| 5 | 河川敷 `river` | イカ江 `ika5` | タコ五郎 `tako5`：空中タップで まっすぐ 下へ |
| 6 | 工場跡 `factory` | イカ里 `ika6` | タコ六郎 `tako6`：あたって 1秒後に 大ばくはつ |
| 7 | トンネル `tunnel` | イカ乃 `ika7` | タコ七郎 `tako7`：スミで まわりを もろく する |
| 8 | イカ女王の 城 `castle` | イカ女王 `queen` | タコ大王 `daiou`：大きな ゆれで 城ごと ゆらす |

## 投げる 人

| キー | 名前 | とくちょう | 使える 面 |
| --- | --- | --- | --- |
| `nao` | ナオ | ねらいが 正確（ぶれ ほぼ なし・予測線 長い）。破壊力 0.7 | 1〜 |
| `fumi` | フミ | 破壊力 1.5。ねらいが ぶれる（予測線 短い） | 1〜 |
| `maki` | マキ | ねらい・力とも 中くらい。あたると 爆発（範囲 広め） | 1〜（タコ投げを 教える 人） |
| `chika` | チカ | 小さい タコを 3びき いっぺんに 投げる（1びき あたりは 弱い） | 2〜（商店街の 魚屋の 娘） |

数値は `app/game.js` の `THROWERS`、タコは `TAKOS`。

## ファイルの 分担（ほかの 担当の ファイルは さわらない）

| 担当 | ファイル | 中身 |
| --- | --- | --- |
| ① 物理と ステージ | `app/game.js`、`app/stages.js`、`tools/sim_check.js` | `window.TakoGame`（物理・描画・入力）、`window.STAGES`（24の 城）、node で 城が 崩れないか・クリアできるかを 確かめる スクリプト |
| ② 画面と 流れ | `app/index.html`、`app/style.css`、`app/main.js`、`app/manifest.json`、`app/story.js`、`app/story.css` | ヘッダー・タコの トレイ・投げる 人の ボタン・モーダル・保存・ストーリーの つなぎ・「えらんで あそぶ」 |
| ③ 紹介ページと 素材 | `index.html`、`assets/*`、`sitemap.xml`、`README.md`、`docs/asset-prompts.md`、`tools/make_icons.py`、`app/images/icon-*.png` | 紹介ページ（CLAUDE.md の 決まり どおり）、画像生成の プロンプト、アイコン |

- 台本 `app/story-data.js` は できあがって いる。直す ときは ② が 直す。
- `app/index.html` の 読みこみ順：`story.css` → `style.css`、`story-data.js` → `story.js` → `stages.js` → `game.js` → `main.js`。
- **git の コミットは しない**（まとめ役が まとめて コミットする）。

## ① `window.STAGES` の 形

```js
window.STAGES = [
  {
    no: 1,                 // 1〜24
    stage: 1,              // 面（1〜8）
    name: '1-1',
    goal: 0.7,             // こわす わりあい（0〜1）。これ 以上で クリア
    rows: [                // 城の 図面。いちばん 下の 行が 地面。W 白・H かたい・R 赤、'-' 右へ のばす、'|' 下へ のばす
      '  R  ',
      ' W-- ',
      ' W W ',
      'WWWWW',
    ],
    takos: { tako1: 4 },   // 投げられる タコと かず（面が すすむと 種類も かずも ふえる。いちばん 多くて 8びき）
    throwers: ['nao', 'fumi', 'maki'],   // 使える 人（2面から chika も）
    hint: '赤い ブロックを ねらうと…',  // レベルの はじめに 出す ひとこと（なくても よい）
  },
  // … 24こ
];
```

- タコの かずは 面ごとに ふやす（目安：1面 4 → 8面 8）。その面の 新しい タコは かならず 入れる。
- 図面は **置いた ままで 崩れない**こと、**入れた タコで クリアできる**ことを `tools/sim_check.js` で 確かめる。

## ① `window.TakoGame` の 形（`app/game.js`。下書きは できて いる）

```js
const g = TakoGame.create(canvas, {
  onStats({ broken, total, ratio, phase }) {},   // こわした かずが かわった とき
  onThrow(takoKey, throwerKey) {},               // 投げた とき（② が タコの かずを へらす）
  onTurnEnd({ broken, total, ratio }) {},        // 投げた あと ぜんぶ 止まった とき（② が クリア／つぎ／失敗を 決める）
});
g.load(STAGES[n - 1], { bg: 'images/story/bg-road.jpg', bgColor: '#a8d4e6', boss: 'ika1' });
g.setTako('tako1');
g.setThrower('nao');
g.start();          // 1回だけ（描画ループ）
g.resize();         // 画面の 大きさが かわった とき
g.pause(true);      // モーダルを 出して いる あいだ など
g.phase;            // 'intro' | 'aim' | 'fly' | 'settle'
TakoGame.TAKOS / TakoGame.TAKO_ORDER / TakoGame.THROWERS   // 名前・説明・色（トレイや ボタンの 表示に 使う）
```

- canvas の 大きさは ② の CSS で 決める。`game.js` は `getBoundingClientRect()` に あわせて 描く。
- 画像は `images/story/<キー>-normal.png`（`-down.png`）を 読めた ときだけ 使う。ない ときは 図形で 描く。

## ② 画面と 流れ

- 前作 cat-on-escape の 見た目（ヘッダー・大きな ボタン・モーダル・ひらがなの 分かち書き）に そろえる。
- 画面：上に ヘッダー（面と レベル・こわした わりあいの ゲージ・ひとこと）、まんなかに canvas、下に
  **タコの トレイ**（のこりの かず つき）と **投げる 人の ボタン**、「やりなおす」「タイトル」。
- 星：クリアしたとき のこった タコが 2びき 以上 ★3、1びき ★2、0 ★1。100% こわしたら ★+1（最大 3）。
- タコが なくなって めあてに とどかなければ 「もういちど」。
- 保存キー `throwontako.story`：`{ level, stars: { 1: 3, … }, seenPrologue }`。
- タイトルは `StoryPlayer.showTitle({ onContinue, continueNote, onStory, storyNote, onChallenge, challengeLabel: 'えらんで あそぶ', challengeNote })`。

## ③ 紹介ページと 素材

- CLAUDE.md の「紹介ページに かならず 入れるもの」「検索エンジン向け」「GA4」を すべて 守る。
- 画像が まだ ない もの（`docs/asset-prompts.md` に プロンプトを 書く）：
  マキ・チカ（4表情）、イカ子〜イカ乃（normal・down）、イカ女王（4表情）、`bg-wall.jpg`、`bg-castle.jpg`、`title.jpg`、`logo.png`、`ending.jpg`。
  ナオ・フミ・タコたちと 7つの 背景は 前作から コピー済み。
