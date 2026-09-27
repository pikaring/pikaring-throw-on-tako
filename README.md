# throw-on-tako（街と、その白い壁 〜throw on tako〜）

指で **ひっぱって 角度と 強さを 決め**、タコを 投げて **イカ女王の 白い 城** を こわす 物理演算パズルです。
タコは ゆっくり くるくる 回りながら 飛び、城の ブロックに あたると こわれます。
**赤い ブロック** は 爆発し、支えを うしなった ブロックは 落ちて、地面に ふれると 消えます。

前作 [cat-on-escape（猫が消えた街）](https://github.com/pikaring/cat-on-escape) の 続編です。
バックエンドなし（HTML / CSS / Vanilla JavaScript のみ）。物理演算も 自前で、依存ライブラリは ありません。
進み具合は LocalStorage に 保存します。見た目と 操作感は 前作に 合わせて あります。

**紹介ページ → https://pikaring.github.io/throw-on-tako/**
**あそぶ → https://pikaring.github.io/throw-on-tako/app/**

## ファイル

紹介ページ（`/`）と ゲーム本体（`/app/`）に 分かれています。

| ファイル | 役割 |
| --- | --- |
| `index.html` | 紹介ページ。ほかのツールと同じデザイン（`assets/site.css`） |
| `assets/site.css` | 紹介ページの見た目。アクセント色は 海の あお `#2f6fb0`／`#23506e` |
| `assets/icon.png` / `assets/favicon.png` | 紹介ページ・OG画像用（`tools/make_icons.py` が生成） |
| `assets/goods.json` | 紹介ページの 本・グッズの 画像と 価格（`tools/fetch_goods.py` が 書く） |
| `sitemap.xml` | 検索エンジン向け。紹介ページと `/app/` の 2本 |
| `app/index.html` | ゲームの画面（ヘッダー／canvas／タコの トレイ／投げる 人の ボタン／モーダル） |
| `app/style.css` | 大きなUI・高コントラスト |
| `app/main.js` | 画面と 流れ（タコの かず・★・クリア判定・保存・ストーリーの つなぎ・「えらんで あそぶ」） |
| `app/game.js` | `window.TakoGame`。物理演算・描画・入力（ひっぱって 投げる）。タコ（`TAKOS`）と 投げる 人（`THROWERS`）の 数値 |
| `app/stages.js` | `window.STAGES`。24の 城の 図面（文字の 絵）と、使える タコ・人 |
| `app/manifest.json` | ホーム画面に追加したときの設定（PWA） |
| `app/images/icon-*.png` | アプリの アイコン（32・180・192・512px。`tools/make_icons.py` が生成） |
| `app/story-data.js` | ストーリーの台本（登場人物・背景・8面・場面） |
| `app/story.js` / `app/story.css` | タイトル画面とストーリー画面（背景・左右の立ち絵・下半分のセリフ窓） |
| `app/images/story/` | ストーリーの背景と立ち絵。城の 画面の タコ・イカにも 使う（無くても 単色と名前の札で遊べる） |
| `tools/sim_check.js` | node で、城が 置いた ままで 崩れないか・入れた タコで クリアできるかを 確かめる |
| `tools/make_sprite.py` | 生成AIが出した立ち絵（上半身）を、グリッドから切り分けて背景を抜き、512pxにそろえる |
| `tools/make_icons.py` | タコ一郎の 立ち絵から アプリのアイコン一式をつくる |
| `tools/fetch_goods.py` | 紹介ページの本・グッズの画像と価格を Amazon Creators API で取り直す（ほかのサイトと同じもの） |
| `.github/workflows/goods.yml` | 上を毎日3時（JST）に実行して `assets/goods.json` を更新する |
| `docs/dev-plan.md` | 開発の しくみ（ゲームの 中身・分担・データの 形） |
| `docs/asset-prompts.md` | まだ ない 立ち絵・背景・タイトル・ロゴを 画像生成AIで作るときのプロンプト |

## 遊びかた

1. 下の **トレイ** で 投げる タコを、その下の ボタンで **投げる 人** を えらびます。
2. 画面を 指（または マウス）で **うしろへ ひっぱる** と 予測線が 出ます。ひく 向きが 角度、ひく 長さが 強さです。
3. **はなす** と タコが くるくる 回りながら 飛びます。タコ四郎・タコ五郎は、飛んで いる あいだに タップすると わざが 出ます。
4. ぜんぶ 止まったら つぎの 1投。城の ブロックを **めあての わりあい 以上** こわせば クリアです。

- 城は 白い ブロックの 積みかさね。ブロックには 重さが あり、支えを うしなうと 崩れて 落ちます。

| ブロック | とくちょう |
| --- | --- |
| 白 `W` | ふつう。タコが いきおいよく あたれば こわれる |
| かたい `H`（灰色） | なかなか こわれない。おもい タコや 力の 強い 人で |
| 赤 `R` | あたると 爆発して、まわりを まとめて こわす |

- **崩れた ブロックは 地面に ふれると 消えます**（こわした かずに 入ります）。うまく 支えを ぬけば、一発で 城が 崩れます。
- ★：クリアした とき のこった タコが 2ひき 以上で ★3、1ぴきで ★2、0で ★1。城を 100% こわすと ★が 1つ ふえます（最大 ★3）。
- タコが なくなって めあてに とどかなければ「もういちど」。同じ 城に すぐ いどめます。
- 保存キーは `throwontako.story`（`{ level, stars, seenPrologue }`）。サーバーには 何も 送りません。

### タコの わざ

面が すすむごとに、投げられる タコが 1しゅるいずつ ふえます（1面の タコ一郎 → 8面の タコ大王）。
数値は `app/game.js` の `TAKOS`。

| タコ | 仲間に なる 面 | わざ |
| --- | --- | --- |
| タコ一郎 | 1 通学路 | ふつうの タコ |
| タコ二郎 | 2 商店街 | おもくて、ブロックを つきぬける |
| タコ三郎 | 3 トンネル | よく はねる。壁に あたっても もどって、また あたる |
| タコ四郎 | 4 イカの 壁工場 | 空中で タップすると 3びきに わかれる |
| タコ五郎 | 5 砂浜 | 空中で タップすると まっすぐ 下へ おちる |
| タコ六郎 | 6 海の 上 | あたって 1秒ほど したら 大ばくはつ |
| タコ七郎 | 7 イカの 城 | スミを はいて、まわりの ブロックを もろく する |
| タコ大王 | 8 女王の 間 | 大きな からだの ゆれで、城ごと ゆらす |

### 投げる 人の とくちょう

同じ タコでも、投げる 人で 飛びかたと 当たりかたが かわります。数値は `app/game.js` の `THROWERS`。

| 人 | 使える 面 | とくちょう |
| --- | --- | --- |
| ナオ | 1〜 | ねらいが 正確（ぶれ ほぼ なし・予測線が 長い）。破壊力は 0.7 と 弱め |
| フミ | 1〜 | 破壊力 1.5。そのかわり ねらいが ぶれて、予測線が 短い |
| マキ | 1〜 | ねらい・力とも 中くらい。あたると 爆発する（範囲 広め）。タコ投げを 教える 人 |
| チカ | 2〜 | 小さい タコを 3びき いっぺんに 投げる（1ぴき あたりは 弱い） |

## ストーリー「街と、その白い壁」

タコ大王の 事件（前作）から しばらく。猫は 塀の 上で ひなたぼっこ、タコたちは 商店街の 人気者。
ところが ある朝、女子高生の **ナオ**（小柄・黒髪メガネ）と **フミ**（大柄・茶髪のギャル）の 住む 街が、
まっしろな 壁で ぐるりと かこまれて しまいます。

ふつうの やりかたでは こわせない 壁。でも ソフトボール部の エース **マキ** が タコを ぶつけると、壁が くずれた ――
ただし すぐ 元に もどって しまう。タコが 足りない 4人は、商店街の 魚屋の 娘 **チカ** と **タコ大王** の 力を かり、
壁を こわしながら 海の 向こうの **イカ女王** の 城を めざします。

- 全8面・24レベル（1面＝3つの 城）。面の はじめと 3つめの 城の あとに 会話の 場面が あります。

| 面 | 場所 | 相手 | できごと |
| --- | --- | --- | --- |
| 1 | 通学路 | イカ子 | タコで 壁が くずれる。でも すぐ 復活して 外へ 出られない |
| 2 | 迷路の 商店街 | イカ美 | 街の 中にも 壁が ふえて 迷路に。チカが タコ大王を つれて 仲間に |
| 3 | トンネル | イカ乃 | 街の 外へ 出ようと すると じゃま。イカ女王の たくらみが あきらかに |
| 4 | イカの 壁工場 | イカ里 | 壁を つくる 工場を 止める。海へ つづく 吸盤の あと |
| 5 | 砂浜 | イカ代 | 遠くに 女王の 城。イカ代が「女王さまを 止めて」と たのむ |
| 6 | 海の 上 | イカ江 | タコ大王の ジェット噴射で 船を 進める。手下たちは 乗り気で なく、抜け道を おしえる |
| 7 | イカの 城 | 親衛隊長 | 女王の 間の 手前で たたかう |
| 8 | 女王の 間 | イカ女王 | 壁の ほんとうの わけ。タコ大王は 女王と 海へ もどる |

- タイトルで「はじめから」「つづきから」「えらんで あそぶ」（クリアした 城を 会話なしで）を えらべます。

台本は `app/story-data.js` を 書きかえるだけで 変えられます。
まだ ない 絵（親衛隊長・背景〈白い壁・砂浜・海・城の 中・女王の 間〉・タイトル・ロゴ・エンディング）は
`docs/asset-prompts.md` の プロンプトで 作り、`app/images/story/` に 置くと 自動で 出ます。

## アイコン

`tools/make_icons.py` が タコ一郎の 立ち絵（`app/images/story/tako1-normal.png`）から、
海の あおの 角丸に タコと 白い ブロックを のせた アイコンを つくります。

```
pip install pillow
python3 tools/make_icons.py                                   # タコ一郎で
python3 tools/make_icons.py app/images/story/tako2-normal.png # 別の タコで
```

`app/images/icon-32/180/192/512.png` と `assets/icon.png`（512px）・`assets/favicon.png`（64px）を 書き出します。

## 紹介ページの 本・グッズ（Amazonアソシエイト）

`index.html` の `<div class="good" data-asin="...">` が商品カードです。ほかのサイト
（reach-on-sanma・cat-on-escape など）と同じ形式で、リンクは `https://www.amazon.co.jp/dp/ASIN?tag=redcomet-22`。
いまは 前作 cat-on-escape で 実在を 確かめた 4つを そのまま 置いて います。

画像と価格は `assets/goods.json` から後付けで差し込みます（無ければテキストのまま表示）。
生成は `tools/fetch_goods.py`、毎日の更新は `.github/workflows/goods.yml` が担当します。

動かすには、リポジトリの Settings → Secrets and variables → Actions に
`CREATORS_CLIENT_ID` と `CREATORS_CLIENT_SECRET` を登録してください。
登録するまでのあいだ、ワークフローは失敗せずに何もしません（画像と価格が出ないだけで、
アフィリエイトのリンク自体は Secret と関係なく動きます）。

## ライセンス

MIT License

## 公開の 手順

公開 URL は `https://pikaring.github.io/throw-on-tako/` を 前提に 書いて あります
（`index.html` の canonical・OG・JSON-LD、`app/index.html` の canonical、`sitemap.xml`）。

1. **リポジトリ名を `throw-on-tako` に 変える**
   GitHub の Settings → General → Repository name。
   ちがう 名前に する ときは、上の ファイルと この README の URL を ぜんぶ 書きかえる。
2. **GitHub Pages を 有効に する**
   Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`。
   数分後に 紹介ページと `/app/` が 開けるか 確かめる。
3. **Secrets を 登録する**（本・グッズの 画像と 価格を 出す とき）
   `CREATORS_CLIENT_ID` / `CREATORS_CLIENT_SECRET`。Actions の `goods` ワークフローを 1回 手動で 動かすと すぐ 反映される。
4. **`pikaring.github.io` リポジトリ（ポータル）の 側で**
   - 一覧（根の `index.html`）に throw-on-tako の カードを 足す（アイコンは `https://pikaring.github.io/throw-on-tako/assets/icon.png`）。
     ポータルの JSON-LD（`ItemList`）にも 1つ 足す
   - 根の `robots.txt` に `Sitemap: https://pikaring.github.io/throw-on-tako/sitemap.xml` の 行を 足す
     （robots.txt は 根に 1つだけ。このリポジトリには 置かない）
5. **Search Console** で URLプレフィックスの プロパティ `https://pikaring.github.io/throw-on-tako/` を 足し、
   `sitemap.xml` を 送信する（確認ファイルを 置いたら 消さずに 残す）。
6. GA4 は 紹介ページに 入れて あるので、設定は いらない（測定ID `G-3FCFQY4W85` を ほかの サイトと 共用。`/app/` には 入れない）。
7. 実際の 画面の 画像（`assets/og.png`）が できたら、`index.html` の JSON-LD に `screenshot` を 足す（`og:image` は `assets/icon.png` の まま）。
