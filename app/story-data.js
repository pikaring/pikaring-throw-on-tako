/* 街と、その白い壁 〜throw on tako〜 の 台本。形は docs/story-mode.md を 見る。 */
(() => {
  'use strict';

  /** 表情の 表を つくる。faces('nao', ['normal', 'happy']) → { normal: 'images/story/nao-normal.png', … } */
  function faces(key, list) {
    const out = {};
    list.forEach((f) => { out[f] = 'images/story/' + key + '-' + f + '.png'; });
    return out;
  }
  const HERO = ['normal', 'happy', 'surprised', 'serious'];
  const TAKO = ['normal', 'down'];
  const IKA = ['normal', 'down'];

  window.STORY = {
    title: '街と、その白い壁',
    logo: 'images/story/logo.png',   // タイトルの ロゴ（読めなければ title と subtitle の 文字）
    subtitle: '〜throw on tako〜',

    cast: {
      nao:   { name: 'ナオ',     side: 'left',  height: 0.8,  faces: faces('nao', HERO) },
      fumi:  { name: 'フミ',     side: 'right', height: 1,    faces: faces('fumi', HERO) },
      maki:  { name: 'マキ',     side: 'right', height: 0.95, faces: faces('maki', HERO) },
      chika: { name: 'チカ',     side: 'right', height: 0.85, faces: faces('chika', HERO) },
      tako1: { name: 'タコ一郎', side: 'right', size: 0.75,   faces: faces('tako1', TAKO) },
      tako2: { name: 'タコ二郎', side: 'right', size: 0.75,   faces: faces('tako2', TAKO) },
      tako3: { name: 'タコ三郎', side: 'right', size: 0.75,   faces: faces('tako3', TAKO) },
      tako4: { name: 'タコ四郎', side: 'right', size: 0.75,   faces: faces('tako4', TAKO) },
      tako5: { name: 'タコ五郎', side: 'right', size: 0.75,   faces: faces('tako5', TAKO) },
      tako6: { name: 'タコ六郎', side: 'right', size: 0.75,   faces: faces('tako6', TAKO) },
      tako7: { name: 'タコ七郎', side: 'right', size: 0.75,   faces: faces('tako7', TAKO) },
      daiou: { name: 'タコ大王', side: 'right', height: 1,    faces: faces('daiou', ['normal', 'angry', 'down']) },
      ika1:  { name: 'イカ子',   side: 'right', size: 0.8,    faces: faces('ika1', IKA) },
      ika2:  { name: 'イカ美',   side: 'right', size: 0.8,    faces: faces('ika2', IKA) },
      ika3:  { name: 'イカ代',   side: 'right', size: 0.8,    faces: faces('ika3', IKA) },
      ika4:  { name: 'イカ奈',   side: 'right', size: 0.8,    faces: faces('ika4', IKA) },
      ika5:  { name: 'イカ江',   side: 'right', size: 0.8,    faces: faces('ika5', IKA) },
      ika6:  { name: 'イカ里',   side: 'right', size: 0.8,    faces: faces('ika6', IKA) },
      ika7:  { name: 'イカ乃',   side: 'right', size: 0.8,    faces: faces('ika7', IKA) },
      queen: { name: 'イカ女王', side: 'right', height: 1,    faces: faces('queen', ['normal', 'angry', 'surprised', 'down']) },
    },

    backgrounds: {
      title:     { image: 'images/story/title.jpg',        color: '#23506e' },
      wall:      { image: 'images/story/bg-wall.jpg',      color: '#cfd8dc' },   // 街を かこむ 白い壁
      road:      { image: 'images/story/bg-road.jpg',      color: '#a8d4e6' },
      shotengai: { image: 'images/story/bg-shotengai.jpg', color: '#f2c37b' },
      roji:      { image: 'images/story/bg-roji.jpg',      color: '#8d8378' },
      park:      { image: 'images/story/bg-park.jpg',      color: '#9cc5a1' },
      river:     { image: 'images/story/bg-river.jpg',     color: '#e07b2a' },
      factory:   { image: 'images/story/bg-factory.jpg',   color: '#6b6259' },
      tunnel:    { image: 'images/story/bg-tunnel.jpg',    color: '#2b3440' },
      castle:    { image: 'images/story/bg-castle.jpg',    color: '#dfe9f0' },   // イカ女王の 白い城
      roadcats:  { image: 'images/story/bg-road-cats.jpg', color: '#a8d4e6' },   // 壁の ない 通学路（エンディング）
      ending:    { image: 'images/story/ending.jpg',       color: '#ffe36e' },
    },

    // 8つの 面。boss は その面の イカ、tako は その面で 投げられるように なる タコ
    stages: [
      { name: '通学路の 壁',     bg: 'road',      boss: 'ika1',  tako: 'tako1' },
      { name: '商店街の 壁',     bg: 'shotengai', boss: 'ika2',  tako: 'tako2' },
      { name: '路地裏の 壁',     bg: 'roji',      boss: 'ika3',  tako: 'tako3' },
      { name: '公園の 壁',       bg: 'park',      boss: 'ika4',  tako: 'tako4' },
      { name: '河川敷の 壁',     bg: 'river',     boss: 'ika5',  tako: 'tako5' },
      { name: '工場跡の 壁',     bg: 'factory',   boss: 'ika6',  tako: 'tako6' },
      { name: 'トンネルの 壁',   bg: 'tunnel',    boss: 'ika7',  tako: 'tako7' },
      { name: 'イカ女王の 城',   bg: 'castle',    boss: 'queen', tako: 'daiou' },
    ],

    scenes: {
      // ───── オープニング：白い壁 ─────
      prologue: [
        { bg: 'roadcats', left: null, right: null, text: 'タコ大王の 事件から\nしばらく たった 街。' },
        { text: '猫たちは 塀の 上で ひなたぼっこ。\nタコたちは 商店街の\nマスコットとして 大人気。' },
        { left: 'nao', right: 'fumi', who: 'fumi', face: 'happy', text: 'ナオ、おっはー！\nきょうも 二郎の 魚屋、\n行列 すごいって。' },
        { who: 'nao', face: 'happy', text: 'おはよう、フミ。\nタコと 猫と 人が なかよく\nくらす 街に なりましたね。' },
        { text: '…その とき。\nゴゴゴゴゴ……' },
        { bg: 'wall', who: 'fumi', face: 'surprised', text: 'え、ちょ、なにあれ！？\n街の まわりに\nまっしろな 壁が！' },
        { who: 'nao', face: 'surprised', text: '通学路の 先も、\n川の 向こうも…\nぜんぶ ふさがれて います。' },
        { right: 'queen', who: 'queen', face: 'normal', text: 'ごきげんよう、\nタコを あまやかす\n街の みなさま。' },
        { who: 'queen', text: 'わたくしは イカ女王。\nこの 街は、今日から\nイカの ものですわ。' },
        { who: 'queen', face: 'angry', text: 'タコばかり ちやほや されて、\nイカは スルメ あつかい。\nもう がまん なりませんの！' },
        { who: 'queen', face: 'normal', text: '壁の 外へは だれも 出られない。\nみなさんが イカを 心から\n愛するまで ずっと ですわ！' },
        { right: 'fumi', who: 'fumi', face: 'serious', text: 'いや イカも すきだけど…\nこういう やりかたは\nちがくない？' },
        { who: 'nao', face: 'serious', text: '壁を どうにか しないと、\n学校にも 行けません。' },
      ],

      // ───── 1面 通学路 ─────
      stage1: [
        { bg: 'road', left: 'nao', right: 'fumi', text: 'つぎの あさ。\n通学路の 先に、白い 壁が\nそびえて いる。' },
        { who: 'fumi', face: 'normal', text: 'かったー！\nけっても おしても\nびくとも しない。' },
        { who: 'nao', face: 'serious', text: '石でも コンクリートでも\nない ですね。\nすこし… ぷにぷに します。' },
        { right: 'maki', who: 'maki', face: 'happy', text: 'それ、イカの 壁だよ。\nふつうに たたいても\nこわれないって。' },
        { who: 'fumi', face: 'surprised', text: 'マキ！？\nとなりの クラスの\nソフト部 エースの？' },
        { who: 'maki', face: 'normal', text: 'イカの 壁は タコに よわいの。\nタコを 投げて ぶつければ\nこわせる はず。' },
        { right: 'tako1', who: 'tako1', face: 'normal', text: 'まかせるタコ！\nぼくたちを 投げて\nほしいタコ！' },
        { who: 'nao', face: 'surprised', text: 'タコ一郎さん。\n投げられても\nいいんですか。' },
        { who: 'tako1', text: '街の みんなに かわいがって\nもらった おれいタコ。\nやわらかいから へいきタコ！' },
        { right: 'ika1', who: 'ika1', face: 'normal', text: 'ちょっと まったイカ！\nこの 壁は イカ子が\nまもって いるイカ！' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'ひっぱって、はなす。\n角度と 強さを 決めて、\n白い ブロックを ねらって！' },
        { who: 'nao', face: 'serious', text: '赤い ブロックは\nあやしいですね。\nあてて みましょう。' },
      ],

      clear1: [
        { bg: 'road', left: 'nao', right: 'ika1:down', who: 'ika1', face: 'down', text: 'イカ〜ん！\n壁に あなが\nあいたイカ〜！' },
        { who: 'ika1', text: 'でも 女王さまの 壁は\nまだ まだ あるイカ。\nおぼえてろイカ〜！' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'やった！\nタコ投げ、けっこう\nきもちいいじゃん！' },
        { right: 'maki', who: 'maki', face: 'happy', text: 'でしょ。 あたしは\n投げる のは 得意だから、\nこれからも 手つだうよ。' },
        { who: 'nao', face: 'normal', text: '壁の 向こうに\n商店街の ほうへ つづく\n白い 壁が 見えます。' },
      ],

      // ───── 2面 商店街 ─────
      stage2: [
        { bg: 'shotengai', left: 'nao', right: 'fumi', text: '商店街の はずれにも\n白い 壁が たって いた。' },
        { right: 'chika', who: 'chika', face: 'serious', text: 'こまる！ 壁の せいで\n市場から 魚が\nとどかないの！' },
        { who: 'fumi', face: 'surprised', text: 'チカ！ 魚屋さんとこの。\n店の 前、からっぽ\nじゃん…' },
        { who: 'chika', face: 'normal', text: 'だから あたしも 手つだう。\n力は ないけど、\n手は はやいんだ。' },
        { right: 'tako2', who: 'tako2', face: 'normal', text: 'へい らっしゃいタコ！\nチカちゃんの ためなら\nおいらも 飛ぶタコ！' },
        { right: 'chika', who: 'chika', face: 'happy', text: '見てて。\nタコを 3びき いっぺんに\n投げられるから！' },
        { right: 'ika2', who: 'ika2', face: 'normal', text: 'あら、はやりの タコより\nイカの ほうが ずっと\n映えるイカ〜。' },
        { who: 'nao', face: 'serious', text: 'イカ美さん ですね。\n壁を あけて もらいます。' },
      ],

      clear2: [
        { bg: 'shotengai', left: 'nao', right: 'ika2:down', who: 'ika2', face: 'down', text: 'ネイルが…\nイカ墨色に なったイカ…' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'トラックが 通れる！\nこれで 魚が とどくよ！' },
        { who: 'ika2', text: 'ふん。 つぎの 路地裏は\nイカ代ねえさんの なわばり。\nかんたんには いかないイカ！' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'チカ、いっしょに\n行こ！\nチーム タコ投げ 結成！' },
      ],

      // ───── 3面 路地裏 ─────
      stage3: [
        { bg: 'roji', left: 'nao', right: 'fumi', text: 'うす暗い 路地裏の おくにも、\n白い 壁が 行く手を\nふさいで いた。' },
        { right: 'ika3', who: 'ika3', face: 'normal', text: 'うらないの 結果が 出たイカ。\nあなたたちの 運勢は…\n「壁に ぶつかる」イカ。' },
        { who: 'nao', face: 'normal', text: 'いま ちょうど\n壁に ぶつかって います。' },
        { right: 'tako3', who: 'tako3', face: 'normal', text: 'かくれんぼ名人、\nタコ三郎 参上タコ！\nぼくは よく はねるタコ！' },
        { who: 'fumi', face: 'normal', text: 'はねる？\nゴムまり みたいに？' },
        { who: 'tako3', text: '壁に あたっても\nぽよーんと もどって、\nまた あたるタコ！' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'せまい ところは\n三郎の 出番だね。' },
      ],

      clear3: [
        { bg: 'roji', left: 'nao', right: 'ika3:down', who: 'ika3', face: 'down', text: 'この 結果は…\nうらなえ なかったイカ…' },
        { who: 'ika3', text: 'でも 見えるイカ。\n公園で イカ奈が\nまちかまえて いるイカ。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'うらない、\nそこは あたるんだ。' },
      ],

      // ───── 4面 公園 ─────
      stage4: [
        { bg: 'park', left: 'nao', right: 'fumi', text: '公園の まわりにも\n白い 壁が。\nすべり台も 使えない。' },
        { right: 'tako4', who: 'tako4', face: 'normal', text: 'タコ四郎タコ。\n空中で タップ されたら\n3びきに わかれるタコ！' },
        { who: 'nao', face: 'surprised', text: 'わかれる…\nんですか？' },
        { who: 'tako4', text: 'ハトさんたちに\nおしえて もらった\nひみつの わざタコ。' },
        { right: 'ika4', who: 'ika4', face: 'normal', text: 'ここは イカ奈の\nイカした 公園イカ。\nブランコも イカ専用イカ！' },
        { right: 'chika', who: 'chika', face: 'serious', text: '子どもたちが\nこまってる。\nぜったい あける！' },
      ],

      clear4: [
        { bg: 'park', left: 'nao', right: 'ika4:down', who: 'ika4', face: 'down', text: 'ブランコ…\nみんなで こいで\nいいイカ…' },
        { right: 'maki', who: 'maki', face: 'normal', text: '川の ほうから\n風が こない。\nあっちも ふさがれてる。' },
        { who: 'nao', face: 'serious', text: '河川敷へ\n行きましょう。' },
      ],

      // ───── 5面 河川敷 ─────
      stage5: [
        { bg: 'river', left: 'nao', right: 'fumi', text: '夕やけの 河川敷。\n川の 上まで 白い 壁が\nのびて いる。' },
        { right: 'tako5', who: 'tako5', face: 'normal', text: 'つりで きたえた タコ五郎タコ。\n空中で タップ されたら\nまっすぐ 下へ おちるタコ！' },
        { who: 'fumi', face: 'normal', text: 'つりばり みたいに\nしずむって こと？' },
        { who: 'tako5', text: 'そのとおりタコ。\n真上から ずどーんタコ。' },
        { right: 'ika5', who: 'ika5', face: 'normal', text: 'イカ江の 壁は\n高いイカ〜。\n上から じゃないと むりイカ〜。' },
        { right: 'maki', who: 'maki', face: 'happy', text: '自分で 弱点、\nいっちゃってるね。' },
      ],

      clear5: [
        { bg: 'river', left: 'nao', right: 'ika5:down', who: 'ika5', face: 'down', text: 'しゃべりすぎたイカ〜…' },
        { right: 'chika', who: 'chika', face: 'surprised', text: '川の 向こう、\n工場の えんとつから\n白い 煙が 出てる。' },
        { who: 'nao', face: 'serious', text: '壁を つくっている\n場所かも しれません。' },
      ],

      // ───── 6面 工場跡 ─────
      stage6: [
        { bg: 'factory', left: 'nao', right: 'fumi', text: '工場跡では、\n白い ブロックが\nつぎつぎ つくられて いた。' },
        { right: 'ika6', who: 'ika6', face: 'normal', text: 'イカ里の 工場イカ。\nイカの すり身で\n壁を 大量生産ちゅうイカ！' },
        { right: 'tako6', who: 'tako6', face: 'normal', text: '安全 だいいち、\nタコ六郎タコ！\nでも 今日は ちがうタコ。' },
        { who: 'tako6', text: 'ぶつかって しばらく したら\nどかーんと 大ばくはつ\nするタコ！ ヨシ！' },
        { who: 'nao', face: 'surprised', text: '安全とは…\nいったい…' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'ばくはつ なら\nあたしも とくい。\n派手に いこう！' },
      ],

      clear6: [
        { bg: 'factory', left: 'nao', right: 'ika6:down', who: 'ika6', face: 'down', text: 'ライン 停止イカ…\n本日の 生産、\nしゅうりょうイカ…' },
        { who: 'ika6', text: 'のこる 壁は トンネルと、\n女王さまの お城 だけイカ。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'あと ちょっと！' },
      ],

      // ───── 7面 トンネル ─────
      stage7: [
        { bg: 'tunnel', left: 'nao', right: 'fumi', text: 'うら山の トンネル。\n出口が 白い 壁で\nふさがれて いる。' },
        { right: 'tako7', who: 'tako7', face: 'normal', text: 'タコ七郎タコ。\nぶつかると スミを はいて、\nまわりの 壁を もろく するタコ。' },
        { who: 'nao', face: 'normal', text: 'スミを かけた ところは\nつぎの タコで\nこわしやすく なるんですね。' },
        { right: 'ika7', who: 'ika7', face: 'normal', text: 'イカだって スミは\nはけるイカ！\nイカ墨パスタは 最高イカ！' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'それは わかる。\nうちの 店でも 売れてる。' },
        { right: 'fumi', who: 'fumi', face: 'serious', text: 'なかよく なれそう\nなのに…\nとにかく 壁は こわす！' },
      ],

      clear7: [
        { bg: 'tunnel', left: 'nao', right: 'ika7:down', who: 'ika7', face: 'down', text: 'スミが… きれたイカ…' },
        { who: 'ika7', text: '女王さまは ほんとは…\nさびしかった だけ\nなのイカ…' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'その 気もち、\nわしには よく\nわかるダコ。' },
        { who: 'daiou', text: 'さいごは わしを 投げるダコ。\nこの 大きな からだで\n城ごと ゆらして やるダコ！' },
        { who: 'nao', face: 'serious', text: '行きましょう。\nイカ女王の お城へ。' },
      ],

      // ───── 8面 イカ女王の 城 ─────
      stage8: [
        { bg: 'castle', left: 'nao', right: 'fumi', text: '街の まんなかに、\nまっしろな 城が\nそびえて いた。' },
        { right: 'queen', who: 'queen', face: 'normal', text: 'よく ここまで 来ましたわね。\nでも この 城は\nいちばん かたいですわよ。' },
        { who: 'queen', face: 'angry', text: 'タコは 「かわいい」。\nイカは 「おいしい」。\nどうして ですの！？' },
        { right: 'fumi', who: 'fumi', face: 'normal', text: 'え、イカも ふつうに\nかわいい けど？\nヒレとか。' },
        { who: 'queen', face: 'surprised', text: '…え？' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: '女王よ、話は あとダコ。\nまずは その 壁を\nおろして もらうダコ！' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'みんな、さいごの 投球だよ！' },
      ],

      clear8: [
        { bg: 'castle', left: 'nao', right: 'queen:down', who: 'queen', face: 'down', text: 'わたくしの お城が…\nぜんぶ…' },
        { who: 'queen', text: 'わたくしは ただ…\nタコの ように、みんなに\n愛されたかった だけですの。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'だったら 壁じゃなくて、\nお店に おいでよ。\n商店街、いつでも あいてるし。' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'うちの 店で\nイカフェア やろうよ。\nイカの 日 とか！' },
        { who: 'queen', text: 'イカの 日…！\n…考えて さしあげても\nよろしくってよ。' },
        { left: 'nao', who: 'nao', face: 'happy', text: '壁が… とけて\nいきます。' },
      ],

      // ───── エンディング ─────
      ending: [
        { bg: 'roadcats', left: null, right: null, text: 'それから しばらく たった\nある日の あさ。' },
        { text: '白い 壁は すっかり 消え、\n通学路の 先には\nいつもの 空が ひろがって いる。' },
        { left: 'nao', right: 'fumi', who: 'fumi', face: 'happy', text: 'ナオ、おっはー！\n見た？ 商店街の\n「タコと イカの 日」！' },
        { who: 'nao', face: 'happy', text: 'はい。 タコちゃんと\nイカちゃんの ならんだ\nポスターが かわいかったです。' },
        { right: 'queen', who: 'queen', face: 'normal', text: 'ごきげんよう。\nきょうの イカ焼きは\nわたくしの おすすめですわ。' },
        { right: 'chika', who: 'chika', face: 'happy', text: '女王さま、店番 じょうずなんだ。\nイカ子たちも\n配達 手つだって くれてる。' },
        { right: 'maki', who: 'maki', face: 'happy', text: 'ソフト部に タコ投げ部、\nつくっちゃおっかな。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'それは ことわるダコ。\nもう 飛ぶのは\nこりごりダコ。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'あはは！\nでも みんな、\nほんと ありがと！' },
        { left: null, right: null, text: 'タコと イカと 猫と 人。\n街は すこしだけ にぎやかに なった。\n―― おしまい ――' },
        { bg: 'ending', picture: true },
      ],
    },
  };
})();
