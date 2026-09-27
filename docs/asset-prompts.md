# 画像素材の生成プロンプト（Gemini 用）

「街と、その白い壁 〜throw on tako〜」で **まだ ない 絵** を 作るための プロンプトです。
書き方・画風の 指定は 前作 cat-on-escape の `docs/story-prompts.md` と そろえて あります
（前作の 絵と 並べても 同じ 作品に 見えるように）。

ナオ・フミ・タコ一郎〜七郎・タコ大王の 立ち絵と、4つの 背景
（`bg-road` `bg-shotengai` `bg-factory` `bg-tunnel`、それに エンディング用の `bg-road-cats`）は
前作から コピー済みです。

**できた もの**：マキ・チカ・イカ女王・イカ子〜イカ乃（ふつう・やられた）の 立ち絵（1〜5）。
**まだの もの**：背景5枚（6）、タイトル（7）、エンディング（8）、ロゴ（9）。

### 物語の 地図（絵を つくる ときの 前提）

- 4人の 住む 街が、白い 壁で ぐるりと かこまれた。**イカ女王の 城は 街の 中では なく、壁の 外・海の 向こうの 岬**に ある。
- 4人は 壁を こわしながら 街を 出て（トンネル → 壁工場 → 砂浜）、船で 海を わたり、城へ 乗りこむ。

| 面 | 場所（背景） | 相手 |
| --- | --- | --- |
| 1 | 通学路 `bg-road` | イカ子 |
| 2 | 壁で 迷路に なった 商店街 `bg-shotengai` | イカ美 |
| 3 | 街の 外へ ぬける トンネル `bg-tunnel` | イカ乃 |
| 4 | イカの 壁工場（もとは 工場跡） `bg-factory` | イカ里 |
| 5 | 砂浜。遠くに 女王の 城 `bg-beach` | イカ代 |
| 6 | 海の 上 `bg-sea` | イカ江 |
| 7 | イカの 城の 中 `bg-castle` | 親衛隊長 イカ奈 |
| 8 | 女王の 間 `bg-throne` | イカ女王 |

## ストーリー画面の形と、絵の分け方

```
┌────────────────────┐
│   背景（全面）      │ ← 背景の絵（人物なし）
│  ┌────┐   ┌────┐   │ ← 立ち絵（上半身・透過PNG）。左にナオ、右にフミ・マキ・チカ・タコ・イカ
├──┴────┴───┴────┴───┤
│ セリフ窓（下半分）  │ ← 文字はゲームの画面（HTML）で出す
└────────────────────┘
```

- **絵の中に文字は入れません**（ロゴだけ 例外）。タイトル・名前・セリフは ゲームの 画面（HTML）で 重ねます。
- 絵が 無くても 遊べます（背景は 単色、立ち絵は 名前の 札）。**できた ものから 1枚ずつ 入れて 確かめられます。**
- ゲームの 城の 面（投げる 画面）でも、その面の イカの 立ち絵（`ika1-normal` など）と タコの 立ち絵を 使います。

## 作る順番と ファイル

置き場所は すべて `app/images/story/`。ファイル名は `app/story-data.js` の `cast` と `backgrounds` と 同じです。

| 順 | 作るもの | できるファイル | 1枚の形 |
| --- | --- | --- | --- |
| 1 | マキの立ち絵（表情4つ） | `maki-normal` `maki-happy` `maki-surprised` `maki-serious` | 2×2グリッド → 512×512×4 |
| 2 | チカの立ち絵（表情4つ） | `chika-normal` `chika-happy` `chika-surprised` `chika-serious` | 2×2グリッド → 512×512×4 |
| 3 | イカ女王の立ち絵（表情4つ） | `queen-normal` `queen-angry` `queen-surprised` `queen-down` | 2×2グリッド → 512×512×4 |
| 4 | イカ子〜イカ乃（ふつう） | `ika1-normal` 〜 `ika7-normal` | 4×2グリッド（右下は空き）→ 512×512×7 |
| 5 | イカ子〜イカ乃（やられた） | `ika1-down` 〜 `ika7-down` | 4×2グリッド（右下は空き）→ 512×512×7 |
| 6 | 背景5枚 | `bg-wall.jpg` `bg-beach.jpg` `bg-sea.jpg` `bg-castle.jpg` `bg-throne.jpg` | 1024×1536（たて） |
| 7 | タイトル | `title.jpg` | 1024×1536（たて） |
| 8 | エンディング | `ending.jpg` | 1024×1536（たて） |
| 9 | タイトルロゴ | `logo.png` | 1536×768（よこ）→ 背景を抜いた PNG |

**どの プロンプトにも、前作の ナオの 立ち絵（`app/images/story/nao-normal.png` の 元の グリッド、
なければ `nao-normal.png` そのもの）を 参照画像として 添付します。**
イカを 作る ときは タコ一郎（`tako1-normal.png`）も 添付すると、同じ 「ちびキャラ」の 大きさに そろいます。

## 登場人物（新しく 出る ひと）

| キー | 名前 | 見た目 |
| --- | --- | --- |
| `maki` | **マキ** | となりの クラスの ソフトボール部 エース。背は フミより すこし 低い（ナオより 頭ひとつ 高い）。日焼けした 肌、黒髪の 高い ポニーテール。制服の 上に 部の ジャージ（みどり）を はおる。さっぱりした 姉御肌。タコ投げを みんなに 教える |
| `chika` | **チカ** | 商店街の 魚屋の 娘。**小柄**（ナオと 同じか 少し 低い）。こげ茶の 髪を 左右 2つの おだんごに。制服の 上に 魚屋の 紺の 前かけ、頭に 白い 三角巾。手が はやく、小さな タコを 3びき いっぺんに 投げる |
| `queen` | **イカ女王** | 海べりの 白い 城の 主。**大きな うすピンクの イカ**。銀の ティアラ、水色の ひらひらした マント（ヒレの 形）、扇子。お嬢さま ことば。タコ大王とは 海で いっしょに 育った 仲。大王が 陸に 上がって さびしかった。こわすぎない |
| `ika1`〜`ika7` | **イカ子〜イカ乃** | 女王の 手下。タコ一郎たちと 同じ 大きさの ちびキャラの イカ。小物で 見分ける。ほんとうは 女王を 心配して いて、あまり 乗り気では ない。イカ奈は 親衛隊長（7面） |

---

## 共通の画風ブロック（どのプロンプトにも そのまま付ける）

前作と 同じ ものに、**イカの 色**と **城の 白** を 足して あります。

```
【画風（厳守）】
・シンプルな線と色の、フラットな絵本・アニメ調のイラスト
・輪郭線は こい茶色（#3a2a20）の、太さが一定の線。線の強弱・スケッチ風の重ね線は使わない
・塗りは ベタ塗りだけ。グラデーション・テクスチャ・ぼかし・光の反射・細かい影は使わない
  （影を入れるなら、1段だけ暗い色のベタ塗りで小さく）
・色数は少なく。使う色は次のパレットを中心にする
  クリーム #fff8ec／みどり #2f5d3a／うすみどり #9cc5a1／オレンジ #e07b2a／
  きいろ #ffe36e／そら色 #a8d4e6／あか #c0503f／グレー #8d8378／こい茶 #3a2a20
  （制服の紺 #2c3e6b、フミの髪の茶 #b8804a、海の あお #23506e、
    イカの からだの うすピンク #f3ddd2 と そのかげ #e2bfb0、城の ブロックの 白 #fbfbf8 と ふちの 灰 #b9c3cc は 追加してよい）
・絵の中に 文字・ロゴ・数字・吹き出し・効果音の文字を 一切描かない
・人物の顔は 目が大きめ、鼻は小さな点か省略、口は線1本で表情を出す
・健全で明るい雰囲気。こわい場面も、子どもが見て楽しい程度の こわさにする
```

## 共通の立ち絵ブロック（1〜5 に付ける）

```
【立ち絵の構図（厳守）】
・1マスに1人。頭の先から おへそのあたりまでの「上半身」を、正面向きで
・頭の先が マスの上から5%、体の下はしが マスの下はしで 切れる（腰から下は描かない）
・どのマスも 同じ人物・同じ大きさ・同じ位置。変えるのは 顔の表情と 手のしぐさだけ
・マスとマスのあいだは はっきり あける（画像の幅の5%以上）。人物どうしが ふれない
・背景は白一色のベタ塗り。床・影・枠線・区切り線・番号は描かない
```

> **イカは 白く しない**：背景の 白（`tools/make_sprite.py` は R・G・B が すべて 232 より 明るい 画素を 背景と みなす）と
> 見分けが つかず、輪郭線に すきまが あると からだまで 抜けて しまいます。イカの からだは **うすピンク #f3ddd2** に します。
> 女王の 白い ティアラや マントの 白い ところも、同じ 理由で 銀（#c9d3db）や 水色に します。

---

## 1. マキの立ち絵

**ナオと フミの 絵を 添付**して、次を送ります。

```
添付した「ナオ」「フミ」と同じ作品の、新しい仲間「マキ」の立ち絵を、表情ちがいで4つ、
2列×2行のグリッドに並べた1枚の画像としてつくってください。
線の太さ・塗り・顔の描き方は、添付の絵と そろえてください。

【マキ】
・ソフトボール部の エースの 女子高生。背は 高め（ナオより 頭ひとつ 高く、フミより すこし 低い）。肩はばが しっかり
・日焼けした 肌。黒髪の 高い ポニーテールを きいろの ヘアゴムで むすぶ
・制服：白い シャツに 赤い リボン、その上に みどり（#2f5d3a）の 部の ジャージを はおり、前は あけている
・さっぱりした 姉御肌。たのもしい 笑顔

【4つの表情（左上から右へ）】
1. ふつう：口角を 上げた 落ちついた顔。片手に ソフトボール
2. うれしい：歯を 見せて にかっと 笑い、親指を 立てる
3. おどろき：目を 見ひらき、口を 大きく「え」の 形に。ポニーテールが はねる
4. しんけん：まゆを 上げて きりっと。ボールを 顔の 横に かまえ、いまにも 投げる 姿勢

（ここに 共通の立ち絵ブロックを貼る）
（ここに 共通の画風ブロックを貼る）

【サイズ】
・1024×1024ピクセル
```

## 2. チカの立ち絵

**ナオと マキの 絵を 添付**して、次を送ります。

```
添付した絵と同じ作品の、新しい仲間「チカ」の立ち絵を、表情ちがいで4つ、
2列×2行のグリッドに並べた1枚の画像としてつくってください。
線の太さ・塗り・顔の描き方は、添付の絵と そろえてください。

【チカ】
・商店街の 魚屋の 娘の 女子高生。小柄で 細身（添付の ナオと 同じくらいか、すこし 低い。マキより ずっと 小さい）
・こげ茶の 髪を 頭の 左右 2つの おだんごに。前髪は ぱっつん
・頭に 白ではなく うすい そら色（#a8d4e6）の 三角巾
・制服：紺の ブレザーを ぬいで、白い シャツを うでまくり、赤い リボン。その上に 魚屋の 紺（#2c3e6b）の 前かけ
・元気で ちゃきちゃき。手が はやい

【4つの表情（左上から右へ）】
1. ふつう：口を むすんだ 気の強そうな顔。片手を 腰に
2. うれしい：目を 細めて にっこり。指の あいだに 小さな オレンジ色の タコを 3びき はさんで 見せる
3. おどろき：目を まんまるに、両手を 口に
4. しんけん：まゆを 寄せて、こぶしを にぎる（「こまる！」と うったえる顔）

（ここに 共通の立ち絵ブロックを貼る）
（ここに 共通の画風ブロックを貼る）

【サイズ】
・1024×1024ピクセル
```

## 3. イカ女王の立ち絵

**ナオの 絵と、前作の タコ大王（`daiou-normal.png`）を 添付**して、次を送ります。

```
添付した絵と同じ作品の、悪役「イカ女王」の立ち絵を、表情ちがいで4つ、
2列×2行のグリッドに並べた1枚の画像としてつくってください。線の太さ・塗りは添付の絵とそろえてください。
大きさは 添付の タコ大王と 同じくらいに。

【イカ女王】
・大きな イカ。からだは うすピンク（#f3ddd2）、かげは #e2bfb0。三角の ヒレの ついた 長い 頭、大きな 目
  （白い からだに しない。背景の 白と 分けたいので）
・頭に 銀色（#c9d3db）の ティアラ（小さな 青い 宝石つき）
・首の まわりに 水色（#a8d4e6）の ひらひらした マント（ヒレの 形）
・足（10本の うち 数本）で 水色の 扇子を 持つ
・お上品で 気位が 高いが、どこか さびしがりで にくめない。こわすぎない

【4つの表情（左上から右へ）】
1. ふつう：目を 細めて すまし顔。扇子で 口もとを かくす
2. おこる：目を つり上げ、からだが すこし 赤く（#c0503f の 小さな ほお）、足を ふり上げる
3. おどろき：目を まんまるに 見ひらき、扇子を とり落としそう
4. やられた：目が うるうる、ティアラが ななめに ずれて、マントが しおれている。涙 ひとつぶ

（ここに 共通の立ち絵ブロックを貼る。ただし「1マスに1人」は「1マスに1ぱい」と読みかえる）
（ここに 共通の画風ブロックを貼る）

【サイズ】
・1024×1024ピクセル
```

## 4. イカ子〜イカ乃（ふつう）

**ナオの 絵、タコ一郎（`tako1-normal.png`）、3の イカ女王の 絵を 添付**して、次を送ります。

```
添付した イカ女王の 手下「イカ子〜イカ乃」の 立ち絵を 7はい、4列×2行のグリッドに並べた
1枚の画像としてつくってください。右下の1マスは 空けておきます。
線の太さ・塗り・イカの形は 添付の イカ女王と、大きさは 添付の タコ一郎と そろえてください。

【7はいに共通】
・イカ女王より ひとまわり 小さい、ちびキャラの イカ。からだは 同じ うすピンク（#f3ddd2）。三角の ヒレの ある 頭、大きな 目
・ティアラも マントも 付けていない（それは 女王だけ）
・上半身（頭と、足が 数本）。正面向き、「〜イカ！」と 胸を はった 得意顔
・7はいを 帽子や 小物で 見分けられるようにする（からだの 色は 変えない）

【7はい（左上から右へ）】
1. イカ子（通学路の 壁の 見はり）：赤い はちまきと 首から さげた ホイッスル。足に 小さな 旗（無地の 赤）
2. イカ美（商店街の はやりもの好き）：頭に のせた ハート形の サングラス、足の 先に イカ墨色の ネイル。足に 自撮りの スマホ
3. イカ代（砂浜の うらない師）：むらさきの ベール。足に 水晶玉
4. イカ奈（城の 親衛隊長）：きいろい サンバイザー。足に 砂場の スコップと バケツ
5. イカ江（海の 上の おしゃべり）：大きな 麦わら帽子。足に メガホン
6. イカ里（壁工場の 工場長）：灰色の 作業帽と ゴーグル。足に クリップボード（紙は 無地）
7. イカ乃（トンネルの イカ墨 好き）：白い コック帽の かわりに 黒い バンダナ。足に フォークに まいた イカ墨パスタ

（ここに 共通の立ち絵ブロックを貼る。ただし「1マスに1人」は「1マスに1ぱい」と読みかえる）
（ここに 共通の画風ブロックを貼る）

【サイズ】
・2048×1024ピクセル
```

> **7はいを 1枚に 並べると くずれやすい**（じっさいに 作った とき、大小の マスが まざったり、
> 小物が となりの イカに 入れかわったり した）。うまく いかない ときは、
> **1回に 2〜4はい（2×2）** に 分けるか、**1ぱいずつ「ふつう｜やられた」の 2×1** で 作ると 安定します。
> そのときは「右の 絵は 左と 同じ イカの やられた顔（目を ×、小物を 落とす）」と 書き、左の 絵を 参照に 添付します。
> 動きの 線・汗・涙の しずくの ような 小さな 記号は 入れない（`make_sprite.py` が 別の キャラと まちがえる）。

## 5. イカ子〜イカ乃（やられた）

**4で できた 絵を 添付**して、次を送ります。

```
添付した 7はいの イカを、同じ並び・同じ帽子と小物のまま、「やられた」表情に描きかえてください。
・目が ぐるぐる、口は 波線。足が へなへなと たれ、帽子が ずれたり、小物を 落としかけたりしている
・口もとに 小さな スミの しみ（こい茶 #3a2a20 の ベタ）
・ほかは 添付の絵と まったく同じ（大きさ・位置・色・線）
・右下の1マスは 空けたまま
```

## 6. 背景（5枚）

背景は **人物を描きません**。下半分には セリフ窓、まんなかの 左右には 立ち絵が 重なるので、
**場所が分かる大事なものは上の40%に入れます**。背景は 投げる 画面（ゲーム）の うしろにも うすく 出ます。

```
【背景の構図（厳守）】
・人物は描かない（遠くの小さな人かげも描かない）
・たて長（2:3）の 1024×1536ピクセル
・その場所だと ひと目で分かる目じるし（建物・壁・城など）は、上の40%に入れる
・下の60%は、地面・道・床・砂浜・海面など 単純な面だけにする（そこに会話の窓と人物が重なる）
・左右のはしに 目立つものを置かない
・奥へ続く道や 水平線で、奥ゆきを出す
```

それぞれ **ナオの絵を添付し、「背景の構図ブロック」と「共通の画風ブロック」を付けて**送ります。
白い 壁は どの 絵でも 同じ 見た目に そろえます：**白い 四角い ブロック（#fbfbf8、境目は 灰 #b9c3cc）を レンガの ように 積み、
ところどころ 赤い ブロック（#c0503f）が まじる。上の ふちは イカの ヒレの ような 三角の ぎざぎざ**。

| ファイル | 場所 | 場面の説明（プロンプトに書く内容） |
| --- | --- | --- |
| `bg-wall` | 街を かこむ 白い壁（オープニング） | 朝の 住宅街の 通学路（前作の 通学路と 同じ ブロック塀と 電柱）。道の 先を、**白い 高い 壁**が 左右 いっぱいに ふさいでいる（上の 見た目の 壁）。壁の 向こうに 空だけが 見える。塀の 上の 猫の 座ぶとんに、猫が 1匹 おどろいて 毛を 逆立てている |
| `bg-beach` | 砂浜（5面） | 昼の 砂浜。まっすぐな 水平線の 海。**海の 向こうの 岬に、白い 城が 小さく 見える**（塔が 3本、塔の 先は イカの 頭の 形の とがった 屋根〈うすピンク #f3ddd2〉、壁に ところどころ 赤い ブロック）。砂浜に 白い 壁が 何枚か 立ち、波打ちぎわに 吸盤の 足あと（まるい あとが 2列）が 城の 方向へ つづく。砂浜の はしに 小さな 漁船が 1そう。下の 60% は 砂浜（#f2d9a0）だけ |
| `bg-sea` | 海の 上（6面） | 海の まんなかから 見た 景色。空と 海と 水平線。水平線の 近くに 白い 城（`bg-beach` と 同じ 城）が すこし 大きく 見える。海面から、白い 壁が 何枚も 島の ように つき出して いる。波は 単純な 白い 線。下の 60% は 海面（#4a90b8 と #23506e の 2色の 横じま）だけ |
| `bg-castle` | イカの 城の 中（7面） | 白い ブロックで できた 城の 大きな ろうか。まっすぐ 奥へ のびる 通路の つきあたりに、**水色の 大きな 両開きの とびら**（女王の 間）。天井から 水色の 旗が 2本 さがる（無地）。柱の 上の かざりは イカの 頭の 形。窓の 外は 海。床は 白と 水色の 市松もよう |
| `bg-throne` | 女王の 間（8面） | 白い 大広間。奥の 段の 上に、**ホタテ貝の 形の 大きな 水色の 玉座**（人は すわって いない）。玉座の うしろの 大きな まるい 窓から 海と 空が 見える。左右に 白い 柱、柱の 上は イカの 頭の 形。床は 水色の じゅうたんが 玉座まで まっすぐ のびる |

### 例：砂浜（`bg-beach`）の組み立て

```
ゲームの会話画面の 背景の絵をつくってください。添付した絵と同じ作品です。
線の太さ・塗り・色は、添付の絵とそろえてください。

【場所】砂浜。海の 向こうに イカ女王の 城
昼の 砂浜。まっすぐな 水平線の 海。海の 向こうの 岬に、白い 城が 小さく 見える
（塔が 3本、塔の 先は イカの 頭の 形の とがった 屋根〈うすピンク #f3ddd2〉、城の 壁に ところどころ 赤い ブロック #c0503f）。
砂浜に、白い 四角い ブロック（#fbfbf8、境目は 灰 #b9c3cc）を 積んだ 壁が 何枚か 立つ。
波打ちぎわに、吸盤の 足あと（まるい あとが 2列）が 城の 方向へ つづく。砂浜の はしに 小さな 漁船が 1そう。

（ここに 背景の構図ブロックを貼る）
（ここに 共通の画風ブロックを貼る）
```

## 7. タイトル（キービジュアル）

**ナオ・フミ・マキ・チカの 立ち絵4枚だけを 添付**して、次を送ります
（ほかの 作品の 絵は 添付しない ―― 線や キャラの 雰囲気まで 似て しまう）。

```
ゲームのタイトル画面に使う、たて長の1枚絵（キービジュアル）をつくってください。
添付した4人の女子高生が主人公です。顔・髪型・服・身長は添付の絵とそろえてください。

【物語】
4人が住む街が、ある日とつぜん白い巨大な壁でかこまれた。壁をつくったのは、海べりの白い城に住むイカの女王。
4人は壁をこわして街の外へ出て、海の城を目指す。

【全体の構図：上から下へ、4つの帯を重ねる。高い所から、街ごしに海を見わたす視点】
1. 上の帯（画面の上から0〜30%）：夕方の空と、イカ女王の巨大なシルエット
 ・水平線の上の空いっぱいに、イカの女王が大きくそびえ、街を見おろす。胸から上だけ見える
 ・体は こい あおむらさき（#23506e）の1色のシルエット。細かい模様は描かない
 ・頭はひし形のイカの頭。そこに小さなティアラ、ひだのある高いえり、片方の足で扇子を口もとに
 ・目だけは白く細い半月の形で、にやりと見おろす（こわくない、いたずらっぽい顔）
 ・空は夕方のオレンジ（#e07b2a）から、きいろ（#ffe36e）の横じまのベタ塗り
2. ロゴの帯（画面の上から22〜38%）：ここにタイトルのロゴを重ねる
 ・女王の胸からえりのあたり。細かいものは描かず、シルエットの面だけにする
3. 海と城と壁の帯（画面の上から30〜50%）
 ・いちばん奥は海（海の あお #23506e と そら色 #a8d4e6 の ベタ塗り）。水平線が まっすぐ 横に通る
 ・海べりの岬に、白い城がひとつ建つ。塔の先はイカの頭の形。城は小さく遠くに見える
 ・城の手前に、白い四角いブロックを積んだ高い壁が、画面の左はしから右はしまで横に続く
 （#fbfbf8、境目は灰色 #b9c3cc、ところどころ赤いブロック #c0503f）
 ・壁は街の奥がわだけ。ゆるく弓なりにカーブして、左右のはしは画面の外へ切れる
 ・城は壁の外にある。壁の上から、城と海が見える
4. 街と4人の帯（画面の上から45〜100%）
 ・壁の内がわに、4人の住む街が広がる。低い家並み、商店街のアーケード、公園の緑、川、工場のえんとつ、電柱
 ・街は画面の下まで続く。手前ほど家が大きくなり、4人のうしろで街並みが自然に溶けこむ
 ・手前に壁は描かない。街と4人のあいだに、仕切りやふちを描かない
 ・屋根や塀の上に猫が2〜3匹
 ・4人が並んで立つ（画面の上から50〜90%）
 ・左から順に、ナオ・マキ・フミ・チカ
 ・まんなかの2人（マキ・フミ）は少し手前で大きく、左右の2人（ナオ・チカ）は少しうしろで小さく。
 4人が扇形にかたまり、たがいの肩が少し重なる
 ・4人とも正面向き。ひざから上
 ・4人のまわりを、小さな赤いタコのキャラクターが3〜4匹、くるくる回りながら飛ぶ。
 タコのうしろに、回転を表す白い弧の線を1本ずつ
 ・4人のうしろから、画面の中心へ向かって広がる、きいろ（#ffe36e）の太い集中線をベタ塗りで数本

【4人のポーズ】
・ナオ：小柄。黒髪のショートボブ、赤いふちの丸メガネ、紺のブレザーに赤いリボン。
 片手をまっすぐ前に伸ばし、遠くの海の城を指さす。きりっとした顔
・マキ：背が高め。日焼けした肌、黒髪の高いポニーテールをきいろのヘアゴムでむすぶ。
 みどりの半そでシャツに赤いリボン。タコを1匹ボールのように持ち、ソフトボールの投球フォームでふりかぶる。
 にかっと笑う
・フミ：いちばん背が高い。明るい茶色のゆる巻きロングヘア、きいろのヘアピン2本、金色の小さなピアス、
 大きめのベージュのカーディガン。小さな赤いタコを1匹、両腕でだきかかえ、自信たっぷりの笑顔でウインク
・チカ：いちばん小柄。こげ茶の髪を左右2つのおだんごにして、うすいそら色の三角巾。
 白いシャツをうでまくり、赤いリボン、紺の前かけ。指のあいだに小さなオレンジ色のタコを3匹はさみ、
 前へつき出す。元気な顔
・身長の差：フミ ＞ マキ ＞ ナオ ≧ チカ

【下のはし】
・画面の下から12%は、4人の足もとの街の道路と家の屋根だけ。ボタンを重ねるので、顔・手・タコを入れない

【サイズ】
・たて長（2:3）、1024×1536ピクセル

【画風（厳守）】
・シンプルな線と色の、フラットな絵本・アニメ調のイラスト。添付の4人の絵と同じ線と塗り
・輪郭線はこい茶色（#3a2a20）の、太さが一定の線。線の強弱や、スケッチ風の重ね線は使わない
・塗りはベタ塗りだけ。グラデーション、テクスチャ、ぼかし、光の反射、炎や稲妻のリアルな効果は使わない
・遠くのもの（海・城・壁）も同じ線の太さ・ベタ塗り。ぼかさない
・イカの女王のシルエットと4人と猫とタコ以外の、人物やキャラクターは描かない
・絵の中に文字・ロゴ・数字・看板の文字・吹き出しを一切描かない
・健全で明るい雰囲気。女王は大きいけれど、こわくない
```

日本語で 構図が くずれる ときは 英語で：

```
Create a portrait key-visual illustration for a game's title screen. The four high-school girls in the
attached images are the heroes; keep their faces, hair, clothes and relative heights exactly.

Story: the girls' hometown was suddenly enclosed by a giant white wall built by the Squid Queen, who lives in
a white castle on the seashore OUTSIDE the town. The girls will break the wall and head for the sea castle.

Viewpoint: from high ground, looking over the town toward the sea. Four stacked bands, top to bottom.
1. TOP (0-30%): evening sky in flat orange (#e07b2a) and yellow (#ffe36e) stripes, and a giant flat
   single-color silhouette of the Squid Queen (deep blue-violet #23506e) rising above the horizon, chest up:
   diamond squid head with a small tiara, tall ruffled collar, a folding fan held near her mouth.
   Only thin white smug half-moon eyes; mischievous, not scary.
2. LOGO BAND (22-38%): her chest/collar area, plain flat silhouette with no detail (a logo goes here).
3. SEA, CASTLE AND WALL (30-50%): the sea at the very back with a straight horizon. On a small cape on the
   shore stands one small, distant white castle with squid-head-shaped tower roofs. In front of it, a tall wall
   of stacked white square blocks (#fbfbf8, grey seams #b9c3cc, a few red blocks #c0503f) runs across the full
   width, curving gently, its ends cropped by the frame. The wall is ONLY on the far side of the town.
   The castle is OUTSIDE the wall, visible beyond it.
4. TOWN AND GIRLS (45-100%): the girls' hometown spreads inside the wall all the way down to the bottom
   edge: low houses, a shopping arcade, park greenery, a river, a factory chimney, utility poles, 2-3 cats
   on roofs. Buildings get larger toward the viewer and blend naturally behind the girls.
   NO wall, border or rim in the foreground.
   The four girls (50-90%) grouped in a fan shape, shoulders slightly overlapping, facing the viewer, knees up.
   Left to right: Nao, Maki, Fumi, Chika; Maki and Fumi slightly closer and larger.
   - Nao: small, black short bob, round red-framed glasses, navy blazer, red bow; arm stretched forward,
     pointing at the distant sea castle; determined.
   - Maki: tall, tanned, high black ponytail with a yellow hair tie, green short-sleeve shirt, red bow;
     winding up a softball pitch with a small red octopus as the ball; big grin.
   - Fumi: tallest, light-brown loose wavy long hair, two yellow hairpins, small gold earring, oversized beige
     cardigan; hugs a small red octopus; confident smile with a wink.
   - Chika: smallest, dark-brown hair in two side buns, pale sky-blue headscarf, white shirt with rolled sleeves,
     red bow, navy apron; thrusts forward three tiny orange octopuses between her fingers; energetic.
   - Height order: Fumi > Maki > Nao >= Chika.
   3-4 small red octopus mascots fly around them, each with one white spin arc.
   A few thick flat yellow (#ffe36e) radial speed lines burst from behind the girls.
Bottom 12%: only streets and rooftops at their feet (buttons go here); no faces, hands or octopuses.

Size: portrait 2:3, 1024x1536.

Style (strict): flat picture-book / anime illustration matching the attached characters. Uniform-width dark
brown outline (#3a2a20), flat fills only; no gradients, textures, blur, glossy highlights or realistic effects.
Distant sea, castle and wall use the same line weight, no depth-of-field blur.
No characters other than the queen silhouette, the four girls, cats and octopuses.
Absolutely no text, letters, numbers, logos, signs with writing or speech bubbles anywhere.
Wholesome and cheerful; the queen is huge but not scary.
```

- **手前に 壁が 出て しまう**：「The town continues to the bottom edge; the girls stand on a street inside the town」を 足す。
- **城が 壁の 内側に 入って しまう**：「castle on the sea side, beyond the wall」と 場所を 2回 書く。
- **4人が くずれる**：先に 女王の シルエットと 街だけを 人物なしで 作り、その絵と 4人を 添付して「この 背景の 手前に 4人を 扇形に」と 頼む。

## 8. エンディング（人物入りの1枚絵）

**ナオ・フミ・マキ・チカ・イカ女王・タコ大王・タコ一郎の 絵を 添付**して、次を送ります。

```
白い 壁が 消えた あとの、エンディングの絵をつくってください。添付した 人物たちが 出ます。
顔・髪型・服は添付の絵とそろえてください。

【場面】
・朝の 商店街の 魚屋の 店先。空は そら色。白い 壁は もう どこにも ない
・海から やって きた イカ女王と タコ大王（猫耳カチューシャ）が、とれたての 魚が 入った 木箱を ふたりで 店に とどけて いる。
 女王は 少し 照れた 笑顔、大王は 得意げ
・チカが 前かけ すがたで 木箱を うけとり、元気に 笑う
・店の 上に、タコと イカが ならんで 手を つないだ 絵の 大きな ポスター（文字は なし）
・ナオと フミが ならんで 笑って 見て いる。マキの 肩に タコ一郎が のって いる
・店先の 段ボール箱で 猫が 1匹 ねて いる。屋根の 上に 小さな イカが 2〜3ばい 手を ふって いる

【構図】
・たて長（2:3）の 1024×1536ピクセル
・人物は 上の3分の2に。下の3分の1は 道だけ（文字の窓を重ねる）

（ここに 共通の画風ブロックを貼る）
```

---

## 9. タイトルロゴ「街と、その白い壁」

タイトル画面と 紹介ページの ロゴです。**画風ブロックを付けずに、単体で**送ります。
タイトルの絵（7）を添付すると、色がなじみやすくなります。

```
ゲームのタイトルロゴを1枚つくってください。
文字は「街と、その白い壁」（8文字、よこ書き1行）と、その下に小さく「〜throw on tako〜」です。
タコを 投げて 白い 壁を こわす、明るくて すこし とぼけた ゲームの ロゴです。

【いちばん大事：文字】
・「街と、その白い壁」の8文字（読点を ふくむ）を、1文字も まちがえず、読みやすく 書く。漢字の 形を くずさない
・スマホの 小さな 画面（はば 350ピクセルほど）で ひと目で 読めること
・「〜throw on tako〜」は 下に 小さく、まるみの ある 太い 英字で
・ほかの 文字・記号・ロゴ・署名は 一切 入れない

【文字の 形】
・文字は 太くて まるい ポップな 手書き風
・「白い壁」の 3文字は、白い 四角い ブロック（#fbfbf8、ふちは 灰 #b9c3cc）を 積みあげた 形。
  「壁」の 右上の ブロックが 1つ 欠けて、その かけらが 右へ 飛んでいる
・「街と、その」は 海の あお（#23506e）の 文字に、白い ふち取り
・「壁」の 左に、オレンジ色（#e07b2a）の 小さな タコが くるくる 回りながら 飛んで くる（うしろに 回った あとを しめす 弧の 線 2本）
・「白」の 字の 上に、うすピンク（#f3ddd2）の 小さな イカが ちょこんと 乗って いる
・「〜throw on tako〜」は きいろ（#ffe36e）の まるい 帯の 上に、海の あおの 文字

【画風】
・フラットな ベタ塗り、影や グラデーションは 使わない
・輪郭線は こい茶色（#3a2a20）の 太さが 一定の 線
・色は すくなく：海の あお #23506e・白 #fbfbf8・灰 #b9c3cc・きいろ #ffe36e・オレンジ #e07b2a・うすピンク #f3ddd2・こい茶 #3a2a20

【背景と 大きさ】
・背景は ミントグリーン一色（#00ff99）の ベタ塗り（白い ブロックの 文字を 背景と 分けて 抜くため）。ロゴの まわりに 何も 描かない
・ロゴの まわりに 画像の はばの 6% 以上の 余白を あける。ロゴは 画像の ふちに ふれない
・よこ長 1536×768ピクセル
```

### うまくいかないときの言い直し（ロゴ）

| こまりごと | 言い直し |
| --- | --- |
| 漢字が まちがう・くずれる | 「『街』『白』『壁』の 漢字を 正しく。かざりより 読みやすさを 優先して ください」 |
| ブロックの 字が 読めない | 「ブロックの 形は 字の 輪郭の 中だけに。字の 形を 先に 決めて ください」 |
| かざりが 多すぎる | 「タコ・イカ・飛んだ かけら 以外の かざりを 取ってください」 |
| 背景に 絵や もようが 入る | 「背景は ミントグリーン一色に。ロゴの まわりには 何も 描かないで ください」 |

**どうしても 漢字が 崩れる ときは**、かざり（タコ・イカ・ブロックの かけら）だけの 絵に して、
文字は ゲームの 画面（HTML）で 重ねます。

---

## できた絵を ゲームに入れる

### 立ち絵（1〜5）

`tools/make_sprite.py` で マスごとに 切り分けて 背景の 白を 抜きます。
名前は **左上から右へ** の順、`列数x行数` はグリッドの形です。右下が 空きの グリッドは、名前を 7つ だけ 書きます。

```
pip install pillow numpy     # 最初の1回だけ

python3 tools/make_sprite.py app/images/story maki.png:2x2:maki-normal,maki-happy,maki-surprised,maki-serious
python3 tools/make_sprite.py app/images/story chika.png:2x2:chika-normal,chika-happy,chika-surprised,chika-serious
python3 tools/make_sprite.py app/images/story queen.png:2x2:queen-normal,queen-angry,queen-surprised,queen-down
python3 tools/make_sprite.py app/images/story ikas.png:4x2:ika1-normal,ika2-normal,ika3-normal,ika4-normal,ika5-normal,ika6-normal,ika7-normal
python3 tools/make_sprite.py app/images/story ikas-down.png:4x2:ika1-down,ika2-down,ika3-down,ika4-down,ika5-down,ika6-down,ika7-down
```

- `make_sprite.py` は **上と左右の ふちからだけ** 白を たどって 抜き、体の 下はしを 512px 正方形の 下に そろえます。
- マスの 区切り線が 描かれて いても、無くても 大丈夫です（線か、キャラの かたまりを 見つけて 切ります）。
- イカの からだが 抜けて しまう ときは、うすピンクが 白すぎます。
  「イカの からだを もう 少し こい うすピンク（#efd2c4）に」と 頼み直して ください。

### 背景・タイトル・エンディング（6〜8）

切り分けずに、**横1024px の JPEG（品質80）** にして 置きます（1枚 200〜350KB ほど）。

```
python3 -c "from PIL import Image; im=Image.open('wall.png').convert('RGB'); im.resize((1024, round(im.height*1024/im.width)), Image.LANCZOS).save('app/images/story/bg-wall.jpg', quality=80, optimize=True, progressive=True)"
```

`beach.png` → `bg-beach.jpg`、`sea.png` → `bg-sea.jpg`、`castle.png` → `bg-castle.jpg`、`throne.png` → `bg-throne.jpg`、
`title.png` → `title.jpg`、`ending.png` → `ending.jpg` も 同じです。

- 背景の **下半分は セリフ窓で 隠れます**。画面の 縦横比に よって 左右が 少し 切れるので、大事な ものは まんなか寄りに。

### ロゴ（9）

ミントグリーンの 背景を 抜いて、まわりを 切りつめ、横1200px の PNG に します。

```
python3 - <<'PY'
from PIL import Image
im = Image.open('logo-src.png').convert('RGBA')
px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if g > 180 and r < 120 and b < 200 and g - r > 90:   # ミントグリーン → 透明
            px[x, y] = (r, g, b, 0)
im = im.crop(im.getchannel('A').getbbox())
im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS).save('app/images/story/logo.png', optimize=True)
PY
```

`app/images/story/logo.png` が 置かれると、タイトル画面と 紹介ページ（`index.html` の ヒーロー）に 自動で 出ます
（読めない ときは、いまの 文字の まま）。

## うまくいかないときの言い直し

| こまりごと | 言い直し |
| --- | --- |
| 線が細い・スケッチ風になる | 「輪郭線は こい茶色の太い一定の線だけで。線の重ねや かすれは使わないでください」 |
| グラデーションや影が入る | 「塗りは ベタ塗りだけ。グラデーション・光・影を すべて取ってください」 |
| 色が多すぎる | 「使う色を パレットの色だけに しぼってください」 |
| 文字が入る | 「看板・服・箱・ポスターなどに 文字や記号を 描かないでください。無地にしてください」 |
| 表情ごとに顔や服が変わる | 「4マスとも 髪型・服・大きさ・位置を まったく同じにして、顔の表情と手だけを変えてください」 |
| チカが 大きく なる | 「チカは 小柄です。ナオと 同じくらいの 背たけ、細い 肩で 描いてください」 |
| マキが フミと 同じに 見える | 「マキは 黒髪の ポニーテールで 日焼け、みどりの ジャージです。カーディガンは 着せないで」 |
| イカが 白く なる | 「イカの からだは うすピンク（#f3ddd2）で。白は 使わないで ください」 |
| イカ女王が こわすぎる | 「イカ女王は お上品で にくめない 悪役です。目を 大きく、口を 小さく すまして」 |
| 壁や 城が 石や コンクリートに なる | 「壁は 白い 四角い ブロックを 積んだ もの。表面は ベタ塗りの 白で、石の もようは 描かないで」 |
| 背景に人が入る | 「人物は1人も描かないでください。遠くの人かげもなしです」 |

## 英語版の画風ブロック（日本語で うまく出ないとき）

```
Style (strict):
- Simple flat picture-book / anime illustration with clean lines and few colors
- Uniform-width dark brown outline (#3a2a20); no line weight variation, no sketchy strokes
- Flat fills only; no gradients, no textures, no blur, no glossy highlights, no soft shading
  (if a shadow is needed, one flat darker tone, kept small)
- Limited palette: cream #fff8ec, green #2f5d3a, light green #9cc5a1, orange #e07b2a,
  yellow #ffe36e, sky blue #a8d4e6, red #c0503f, grey #8d8378, dark brown #3a2a20
  (also allowed: navy #2c3e6b for uniforms, brown #b8804a for Fumi's hair, sea blue #23506e,
   pale pink #f3ddd2 / #e2bfb0 for squid bodies, block white #fbfbf8 with grey edges #b9c3cc)
- Squid characters are pale pink, never pure white
- Absolutely no text, letters, numbers, logos, speech bubbles or sound-effect lettering anywhere
- Faces: fairly large eyes, tiny dot nose or none, mouth as a single line
- Wholesome and cheerful; villains are silly and likeable, never scary

Character sprite layout (for sheets 1-5):
- One character per cell, bust-up (head to navel), facing front
- Top of the head 5% below the cell top; the body is cut off at the cell bottom (no legs)
- Same character, size and position in every cell; only the facial expression and hand pose change
- Clear gaps between cells (at least 5% of the image width); plain white background,
  no floor, no shadow, no grid lines, no numbers

Background layout (for sheet 6):
- No people at all, not even distant silhouettes
- Portrait 2:3, 1024x1536 pixels
- Put the landmarks that identify the place in the top 40%;
  keep the bottom 60% as simple ground/floor/wall (dialogue box and characters overlay it)
```
