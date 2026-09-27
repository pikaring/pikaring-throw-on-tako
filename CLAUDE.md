# このリポジトリの きまり

pikaring の ツール群（tap-on-kotoba / tap-on-neko / reach-on-sanma / all-in-texas /
ride-on-qc / eat-on-gpx / rock-on-mj / cat-on-escape / throw-on-tako）は、**見た目も 作りも そろえる**方針です。
新しいページや 節を つくるときは、**先にある ページを 見て 同じ形に 合わせてください**。
迷ったら tap-on-neko と reach-on-sanma が 基準です。

## 紹介ページ（`/index.html`）に かならず 入れるもの

| もの | 形 |
| --- | --- |
| デザイン | `assets/site.css`（4サイト共通。アクセント色だけ 変える） |
| 節の ならび | `hero` → `specs` → `goods`（本・グッズ）→ 中身の節 → `faq` → `cta` → `family` → `footer` |
| ポータルへの リンク | `family` の節に 1つだけ（`https://pikaring.github.io/`。`/portal/` は 引っこし後の 転送ページ） |
| アクセスカウンター | フッターに `<span class="counter">累計アクセス <b id="counter-value">―</b> 回</span>` と GAS を 呼ぶ script |
| アソシエイトの 表示 | フッターに `<span class="disclosure">…</span>` |
| フッター | `GitHub` / `README` / `MIT License · pikaring · 依存ライブラリなし` |
| OG | `og:title` / `og:description` / `og:url` / `og:image`（`assets/icon.png`） |

## 本・グッズ（Amazonアソシエイト）

- カードは `<div class="good" data-asin="ASIN">`、リンクは `https://www.amazon.co.jp/dp/ASIN?tag=redcomet-22`
  （`target="_blank" rel="sponsored noopener"`、文言は「Amazonで見る ↗」）
- 表紙画像と価格は `assets/goods.json` から 後づけ。`tools/fetch_goods.py` が Creators API で 取り、
  `.github/workflows/goods.yml` が 毎日 3:00 JST に 更新する
- Secrets：`CREATORS_CLIENT_ID` / `CREATORS_CLIENT_SECRET`（未登録でも ワークフローは 失敗しない）
- ASIN が わからない ときは 当てずっぽうで 書かない。Creators API の `searchItems` で 実在を 確かめる
- 紙の本が プレミアム価格の ときは Kindle版を 選ぶ

## アプリ（`/app/`）

- 前作 tap-on-neko の 配色・大きなボタン・モーダル・ひらがなの 分かち書きに そろえる
- 画像は 読みこめた ときだけ 使い、だめなら 代わりの 表示で 遊べるようにする
- アイコンは `tools/make_icons.py` が タコ一郎の 顔から つくる
- 物理演算も 自前（ライブラリを 入れない）。くわしくは `docs/dev-plan.md`

## 検索エンジン向け（10サイト 共通）

| もの | 形 |
| --- | --- |
| `sitemap.xml` | サイトの 根（rock-on-mj だけ `docs/`）に 置く。紹介ページと `/app/` の 2本。`<loc>` と `<lastmod>` だけ |
| `rel="canonical"` | 紹介ページと `/app/` の `<head>` に 1つずつ。末尾は `/`（`index.html` は 付けない） |
| JSON-LD | `<head>` の 末尾に 1つ。ゲームは `WebApplication` + `GameApplication`、道具は `UtilitiesApplication`、rock-on-mj は `SoftwareApplication`（Windows）、ポータルは `CollectionPage` + `ItemList` |
| `description` | 探すときの ことば（例：脳トレ／クイズ／議事録）を 入れる。JSON-LD の `description` と 同じ 文にする |

- 一覧（ポータル）は **`pikaring.github.io` リポジトリの 根**。`pikaring/portal` は canonical と
  meta refresh で 根へ 送る だけの 転送ページ（GitHub Pages は 301 を 返せない）。
  `portal/assets/` は 消さない ―― 古い リンクの 画像が 切れる
- `robots.txt` は **`pikaring.github.io` リポジトリの 根に 1つだけ**。
  `/portal/robots.txt` のような 下の 階層に 置いても クローラーは 読まない。
  サイトを 増やしたら そこの `Sitemap:` 行を 足す
- `screenshot` は 実際の 画面の 画像（`assets/og.png`）が ある ときだけ 書く。アイコンで 代用しない
- FAQ の 構造化データは 入れない（Google が 一般サイトでは 出さなく なったため）
- Search Console は URLプレフィックスの プロパティ（`github.io` は ドメイン認証が 使えない）。
  確認ファイルは 消さずに 残す

## アクセス解析（GA4）

- 測定ID は `G-3FCFQY4W85`。10サイトで **プロパティも データストリームも 1つ**
  （どれも `pikaring.github.io` の 下なので 分けない。サイトの 区別は ページパスで 付く）
- 入れるのは **紹介ページ（`/index.html`）だけ**。`/app/` には 入れない。
  アプリには「通信なし」と 書いて あるので、そこを 破らない
- 置きどころは `<head>` の、ホーム画面から 開いた ときの `location.replace('app/')` より **後ろ**、
  JSON-LD より **手前**。こうすると ホーム画面 起動で 紹介ページの 見かけの 表示回数が 増えない
- 測定ID は 公開してよい 値。Secrets には しない
- GAS の アクセスカウンターは そのまま 残す（累計の 表示用）

## GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`
