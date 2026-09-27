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
      shotengai: { image: 'images/story/bg-shotengai.jpg', color: '#f2c37b' },   // 壁で 迷路に なった 商店街
      tunnel:    { image: 'images/story/bg-tunnel.jpg',    color: '#2b3440' },
      factory:   { image: 'images/story/bg-factory.jpg',   color: '#6b6259' },   // イカの 壁工場
      beach:     { image: 'images/story/bg-beach.jpg',     color: '#f2d9a0' },   // 砂浜（遠くに 女王の 城）
      sea:       { image: 'images/story/bg-sea.jpg',       color: '#4a90b8' },   // 海の 上
      castle:    { image: 'images/story/bg-castle.jpg',    color: '#dfe9f0' },   // イカの 城の 中
      throne:    { image: 'images/story/bg-throne.jpg',    color: '#b9c9dc' },   // 女王の 間
      roadcats:  { image: 'images/story/bg-road-cats.jpg', color: '#a8d4e6' },   // 壁の ない 通学路（エンディング）
      ending:    { image: 'images/story/ending.jpg',       color: '#ffe36e' },
    },

    // 8つの 面。boss は その面の 相手、tako は その面で 投げられるように なる タコ
    stages: [
      { name: '通学路の 壁',     bg: 'road',      boss: 'ika1',  tako: 'tako1' },
      { name: '迷路の 商店街',   bg: 'shotengai', boss: 'ika2',  tako: 'tako2' },
      { name: 'トンネルの 壁',   bg: 'tunnel',    boss: 'ika7',  tako: 'tako3' },
      { name: 'イカの 壁工場',   bg: 'factory',   boss: 'ika6',  tako: 'tako4' },
      { name: '砂浜の 壁',       bg: 'beach',     boss: 'ika3',  tako: 'tako5' },
      { name: '海の 上の 壁',    bg: 'sea',       boss: 'ika5',  tako: 'tako6' },
      { name: 'イカの 城',       bg: 'castle',    boss: 'ika4',  tako: 'tako7' },
      { name: '女王の 間',       bg: 'throne',    boss: 'queen', tako: 'daiou' },
    ],

    scenes: {
      // ───── オープニング：白い壁 ─────
      prologue: [
        { bg: 'roadcats', left: null, right: null, text: 'タコ大王の 事件から\nしばらく たった 街。' },
        { text: '猫たちは 塀の 上で ひなたぼっこ。\nタコたちは 商店街の\nマスコットとして 大人気。' },
        { left: 'nao', right: 'fumi', who: 'fumi', face: 'happy', text: 'ナオ、おっはー！\nきょうも 魚屋の タコ大王、\n行列 すごいって。' },
        { who: 'nao', face: 'happy', text: 'おはよう、フミ。\nタコと 猫と 人が なかよく\nくらす 街に なったね。' },
        { text: '…その とき。\nゴゴゴゴゴ……' },
        { bg: 'wall', who: 'fumi', face: 'surprised', text: 'え、ちょ、なにあれ！？\n街の まわりに\nまっしろな 壁が！' },
        { who: 'nao', face: 'surprised', text: '通学路の 先も、\n川の 向こうも…\nぜんぶ ふさがれてる。' },
        { text: 'ホーッホッホッ…\nどこからか、高い\nわらい声が ひびいた。' },
        { who: 'fumi', face: 'serious', text: 'だれ！？\nてか これ、\nどう やって 出んの！？' },
        { who: 'nao', face: 'serious', text: 'この ままじゃ\n学校にも、\n街の 外にも 行けないわ。' },
      ],

      // ───── 1面 通学路：タコで 壁が くずれる ─────
      stage1: [
        { bg: 'wall', left: 'nao', right: 'fumi', text: 'ふたりは そのまま、\n白い 壁の 下まで\nかけよった。' },
        { who: 'fumi', face: 'normal', text: 'かったー！\nけっても おしても\nびくとも しない。' },
        { who: 'nao', face: 'serious', text: '石でも コンクリートでも\nないね。\nすこし… ぷにぷに する。' },
        { text: 'ボン！ ボン！ ボン！\nとなりで、だれかが 壁に\nボールを ぶつけて いる。' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'もう！ 朝練に\n間に合わない じゃん！\nどいてよ、この 壁！' },
        { who: 'fumi', face: 'surprised', text: 'マキ！？\nとなりの クラスの\nソフト部 エースの？' },
        { who: 'maki', text: 'ボール、あと 1こ…\nよし、これで！\nえいっ！' },
        { right: 'tako1', who: 'tako1', face: 'down', text: 'タ、タコ〜〜〜！？\nそれ ボールじゃ\nないタコ〜！' },
        { text: 'べちゃっ。\n…ガラガラガラ！\n白い 壁が くずれ落ちた。' },
        { left: 'nao', right: 'maki', who: 'maki', face: 'surprised', text: 'え… ボールじゃ\nびくとも しなかったのに、\nタコで くずれた！？' },
        { who: 'nao', face: 'serious', text: 'この 壁、\nタコに よわいの かも\nしれない。' },
        { right: 'tako1', who: 'tako1', face: 'normal', text: 'い、いたくは ないタコ。\nやわらかいから へいきタコ。\nもっと 投げて いいタコ！' },
        { right: 'ika1', who: 'ika1', face: 'normal', text: 'ちょっと まったイカ！\nこの 壁は イカ子が\nまもって いるイカ！' },
        { right: 'maki', who: 'maki', face: 'happy', text: 'じゃあ、あの イカに\nタコを ぶつければ いいんだね。\nソフト部 エースに まかせて！' },
      ],

      clear1: [
        { bg: 'road', left: 'nao', right: 'ika1:down', who: 'ika1', face: 'down', text: 'イカ〜ん！\n壁に あなが\nあいたイカ〜！' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'やった！\nこれで 外に…' },
        { text: 'ムニュ… ムニュムニュ…\nくずれた ところから、\n白い 壁が また のびて きた。' },
        { who: 'fumi', face: 'surprised', text: 'うそ、もどった！？\nせっかく あけたのに！' },
        { who: 'ika1', text: 'イカの 壁は すぐ\nふっかつ するイカ。\nおぼえてろイカ〜！' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'こわせる けど、\nタコが ぜんぜん 足りない。\nもっと 一気に 投げないと。' },
        { who: 'nao', face: 'normal', text: 'タコなら…\n商店街の 魚屋さんに、\nタコ大王さんが いるよ。' },
      ],

      // ───── 2面 商店街：壁の 迷路・チカと タコ大王 ─────
      stage2: [
        { bg: 'shotengai', left: 'nao', right: 'fumi', text: '商店街に 来ると、\n道の あちこちに 白い 壁が\nはえて いた。' },
        { who: 'fumi', face: 'surprised', text: 'ちょ、行き止まり！\nこっちも！\n商店街が 迷路じゃん！' },
        { who: 'nao', face: 'serious', text: '壁が ふえてる。\n魚屋さんまで\nたどりつけない。' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'おーい！\nこっち こっち！\nうら道から 来たよ！' },
        { who: 'fumi', face: 'happy', text: 'チカ！\n魚屋さんとこの！' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'はなしは 聞いたダコ。\n街の ピンチなら、\nわしらも 手を かすダコ！' },
        { right: 'chika', who: 'chika', face: 'normal', text: '大王には 感謝してるんだ。\n父ちゃんが 腰を 悪くしてから、\nずっと 店を 手伝って くれてて。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: '市場の 木箱は おもいダコ。\n足が 8本 あれば、\n8箱 いっぺんに はこべるダコ。' },
        { right: 'tako2', who: 'tako2', face: 'normal', text: 'へい らっしゃいタコ！\nおいらは おもいから、\n壁も つきぬけるタコ！' },
        { right: 'chika', who: 'chika', face: 'serious', text: 'あたしも 行く。\n力は ないけど、タコを\n3びき いっぺんに 投げられる！' },
        { right: 'ika2', who: 'ika2', face: 'normal', text: 'あら、はやりの タコより\nイカの ほうが ずっと\n映えるイカ〜。' },
        { who: 'nao', face: 'serious', text: 'あなたが イカ美ね。\n道を あけて もらうわ。' },
      ],

      clear2: [
        { bg: 'shotengai', left: 'nao', right: 'ika2:down', who: 'ika2', face: 'down', text: 'ネイルが…\nイカ墨色に なったイカ…' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'この 壁は 街の 中にも\nどんどん ふえるダコ。\nいっそ 街の 外へ 出るダコ！' },
        { who: 'daiou', text: 'うら山の トンネルなら、\n壁の 外へ\nつながって いるはずダコ。' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'よーし、\nチーム タコ投げ、\n出発！' },
      ],

      // ───── 3面 トンネル：女王の 陰謀 ─────
      stage3: [
        { bg: 'tunnel', left: 'nao', right: 'fumi', text: 'うら山の トンネル。\nこの 先が 街の 外へ\nつづいて いる。' },
        { right: 'tako3', who: 'tako3', face: 'normal', text: 'かくれんぼ名人、\nタコ三郎 参上タコ！\nぼくは よく はねるタコ！' },
        { text: 'ところが、出口の 手前に\nまた 白い 壁。' },
        { right: 'ika7', who: 'ika7', face: 'normal', text: 'ここから 先は\n通さないイカ。\nイカ乃が まもるイカ！' },
        { left: 'nao', who: 'nao', face: 'serious', text: 'どうして こんな\n壁を つくるの？' },
        { who: 'ika7', text: '女王さまの ご命令イカ。\nタコばかり かわいがられて、\nうらやましいんだイカ。' },
        { who: 'ika7', text: 'だから この 街を\nイカの 街に\nかえて やるんだイカ！' },
        { right: 'fumi', who: 'fumi', face: 'serious', text: 'なにそれ！\nやきもちで 街ごと\nとじこめる とか！' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: '…女王。\nまさか、あの…' },
      ],

      clear3: [
        { bg: 'tunnel', left: 'nao', right: 'ika7:down', who: 'ika7', face: 'down', text: 'スミが… きれたイカ…' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: '…なんでも ないダコ。\n先を いそぐダコ。' },
        { text: 'トンネルを ぬけると、\nそこは 古い 工場の\nうらぐち だった。' },
        { left: 'nao', who: 'nao', face: 'surprised', text: 'えんとつから、\n白い 煙が\n出てる。' },
      ],

      // ───── 4面 工場：イカの 壁工場 ─────
      stage4: [
        { bg: 'factory', left: 'nao', right: 'fumi', text: '工場の 中では、\n白い 壁が つぎつぎと\nおくりだされて いた。' },
        { who: 'fumi', face: 'surprised', text: 'ここで 壁、\nつくってたんだ！\nそりゃ ふえる わけだ。' },
        { right: 'maki', who: 'maki', face: 'serious', text: '機械を 止めよう。\nこれ 以上 ふえたら、\n街が うまっちゃう。' },
        { right: 'ika6', who: 'ika6', face: 'normal', text: 'だれイカ！\nイカ里の 工場に\n入って きたのは！' },
        { right: 'tako4', who: 'tako4', face: 'normal', text: 'タコ四郎タコ。\nすべってる ときに タップで\n3びきに わかれるタコ！' },
        { left: 'nao', who: 'nao', face: 'serious', text: '見つかっちゃった。\nでも、ここで\n止めるしか ないわ。' },
      ],

      clear4: [
        { bg: 'factory', left: 'nao', right: 'ika6:down', who: 'ika6', face: 'down', text: 'ライン 停止イカ…\n本日の 生産、\nしゅうりょうイカ…' },
        { right: 'chika', who: 'chika', face: 'surprised', text: 'ねえ、見て。\n床に まるい あとが\nならんでる。' },
        { who: 'nao', face: 'serious', text: '吸盤の あとだ。\n工場の うらから…\n海の ほうへ。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: '海…\nやはり、そうダコか。' },
      ],

      // ───── 5面 砂浜：イカ代の たのみ ─────
      stage5: [
        { bg: 'beach', left: 'nao', right: 'fumi', text: '吸盤の あとを たどって、\n4人は 海べりの\n砂浜に 出た。' },
        { who: 'fumi', face: 'surprised', text: '見て！ 海の 向こう！\nまっしろな お城が\nある！' },
        { who: 'nao', face: 'serious', text: 'あれが、イカ女王の\nお城… なのね。' },
        { right: 'tako5', who: 'tako5', face: 'normal', text: 'つりで きたえた タコ五郎タコ。\nタップ されたら イカへ\nまっしぐらタコ！' },
        { right: 'ika3', who: 'ika3', face: 'normal', text: 'うらないの 結果が 出たイカ。\nあなたたちの 運勢は…\n「壁に ぶつかる」イカ。' },
        { left: 'nao', who: 'nao', face: 'normal', text: 'いま ちょうど\n壁に ぶつかってる。' },
      ],

      clear5: [
        { bg: 'beach', left: 'nao', right: 'ika3:down', who: 'ika3', face: 'down', text: 'この 結果は…\nうらなえ なかったイカ…' },
        { who: 'ika3', text: '…おねがいが あるイカ。\n女王さまを、\n止めて ほしいイカ。' },
        { who: 'ika3', text: '女王さまは、ほんとうは\nやさしい かた なのイカ。\nこのごろ ずっと さみしそうで…' },
        { right: 'fumi', who: 'fumi', face: 'normal', text: 'わかった。\nでも、どう やって\nあそこまで 行くの？' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'あそこに 漁船が あるよ！\nうちの 店の\n知り合いの 船！' },
      ],

      // ───── 6面 海の 上：タコ大王の ジェット ─────
      stage6: [
        { bg: 'sea', left: 'nao', right: 'fumi', text: '4人を のせた 船は、\nタコ大王の ジェット噴射で\n海の 上を つき進む。' },
        { right: 'daiou', who: 'daiou', face: 'angry', text: 'ぶしゅーーっ！\nしっかり つかまって\nいるダコ！' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'はやっ！\nこれ、ぜったい\n遊園地より すごい！' },
        { text: 'ところが、海の 上に\nとつぜん 白い 壁が\nいくつも わきあがった。' },
        { right: 'ika5', who: 'ika5', face: 'normal', text: 'イカ江の 壁イカ〜。\nここから 先は\n通せないイカ〜。' },
        { right: 'tako6', who: 'tako6', face: 'normal', text: '安全 だいいち、タコ六郎タコ。\nぶつかって しばらく したら\n大ばくはつ するタコ！ ヨシ！' },
        { left: 'nao', who: 'nao', face: 'surprised', text: '安全とは…\nいったい…' },
      ],

      clear6: [
        { bg: 'sea', left: 'nao', right: 'ika5:down', who: 'ika5', face: 'down', text: 'やられたイカ〜。\nでも あなたがたなら\n女王さまを 止められるカも。' },
        { who: 'ika5', text: 'お城の うらに、\n小さな 水門が あるイカ〜。\nそこから 入れるイカ〜。' },
        { right: 'maki', who: 'maki', face: 'happy', text: 'ありがと！\nイカたちも、\nほんとは 困ってたんだね。' },
      ],

      // ───── 7面 イカの 城：親衛隊長 ─────
      stage7: [
        { bg: 'castle', left: 'nao', right: 'fumi', text: '水門から、4人は\nイカの 城へ しのびこんだ。' },
        { who: 'nao', face: 'serious', text: 'この 先が、\n女王の 間 みたい。' },
        { right: 'ika4', who: 'ika4', face: 'normal', text: 'そこまでだイカ！\nこの 先は 女王さまの 間。\n一歩も 通さないイカ！' },
        { who: 'ika4', text: 'これまでの イカたちとは\nわけが ちがうわよ。\n親衛隊長 イカ奈が まもる！' },
        { right: 'tako7', who: 'tako7', face: 'normal', text: 'タコ七郎タコ。\nぶつかると スミを はいて、\nまわりの 壁を もろく するタコ。' },
        { right: 'chika', who: 'chika', face: 'serious', text: 'ここまで 来て\nひきかえせない！\nみんな、いくよ！' },
      ],

      clear7: [
        { bg: 'castle', left: 'nao', right: 'ika4:down', who: 'ika4', face: 'down', text: 'む、むねんイカ…\nタコ大王、あなたなら\n女王さまを 止められる…' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'さいごは わしを 投げるダコ。\nこの 大きな からだで、\n壁ごと ゆらして やるダコ。' },
        { who: 'daiou', text: 'それに… 女王とは\nちゃんと 会って\n話さねば ならんダコ。' },
      ],

      // ───── 8面 女王の 間 ─────
      stage8: [
        { bg: 'throne', left: 'nao', right: 'fumi', text: '白い 大広間の おくに、\nイカ女王が まって いた。' },
        { right: 'queen', who: 'queen', face: 'normal', text: 'ごきげんよう。\nよく ここまで\n来ましたわね。' },
        { who: 'queen', face: 'surprised', text: '…あら。\nそこに いるのは…\nタコ大王！？' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'ひさしぶりダコ、女王。\n海で いっしょに\nそだった ころ いらいダコ。' },
        { right: 'queen', who: 'queen', face: 'angry', text: 'あなたが 陸に 上がって、\n人間に かわいがられて いる あいだ、\nわたくしが どんな 気持ちで…！' },
        { who: 'queen', text: 'だから 街ごと イカの 街に\nすれば、あなたも\nもどって くると 思いましたの！' },
        { right: 'maki', who: 'maki', face: 'serious', text: 'みんな、さいごの 投球だよ！' },
      ],

      clear8: [
        { bg: 'throne', left: 'nao', right: 'queen:down', who: 'queen', face: 'down', text: 'わたくしの 壁が…\nぜんぶ…' },
        { who: 'queen', text: 'わたくしは ただ…\nさみしかった だけ\nなのですわ。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: '…すまなかったダコ。\nわしが 海を はなれて、\nひとりに して しまったダコ。' },
        { who: 'daiou', text: 'でも、海には もどれんダコ。\n魚屋の おやじさんが 腰を\n悪くして、店が たいへんダコ。' },
        { right: 'chika', who: 'chika', face: 'surprised', text: '大王…\nそんなに うちの 店の こと、\n考えて くれてたんだ。' },
        { right: 'queen', who: 'queen', face: 'surprised', text: '…でしたら、\nわたくしが 陸に\n上がれば よいのですわ！' },
        { right: 'chika', who: 'chika', face: 'happy', text: 'じゃあ 女王さまも\nうちで はたらく？\n人手は 大かんげい！' },
        { who: 'queen', face: 'normal', text: 'よ、よろしくってよ。\n魚の 目利きなら、\nだれにも まけませんわ。' },
        { left: 'nao', who: 'nao', face: 'happy', text: '壁が… とけて\nいく。' },
      ],

      // ───── エンディング ─────
      ending: [
        { bg: 'roadcats', left: null, right: null, text: 'それから しばらく たった\nある日の あさ。' },
        { text: '白い 壁は すっかり 消え、\n通学路の 先には\nいつもの 空が ひろがって いる。' },
        { left: 'nao', right: 'fumi', who: 'fumi', face: 'happy', text: 'ナオ、おっはー！\n見た？ 魚屋さんの\n「タコと イカの 日」！' },
        { who: 'nao', face: 'happy', text: 'うん。 タコちゃんと\nイカちゃんの ならんだ\nポスター、かわいかった。' },
        { right: 'chika', who: 'chika', face: 'happy', text: '大王と 女王さま、朝いちばんに\n海から 魚を とって きて\nくれるんだ。 父ちゃんも 大よろこび！' },
        { right: 'queen', who: 'queen', face: 'normal', text: 'ごきげんよう。 きょうの\nおすすめは イカですわ。\n…タコも、まあ わるく ないですわ。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'まいど ありダコ！\n腰の ぐあいは どうダコ、\nおやじさん？' },
        { right: 'maki', who: 'maki', face: 'happy', text: 'ソフト部に タコ投げ部、\nつくっちゃおっかな。' },
        { right: 'tako1', who: 'tako1', face: 'normal', text: 'それは ことわるタコ。\nもう 飛ぶのは\nこりごりタコ。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'あはは！\nでも みんな、\nほんと ありがと！' },
        { left: null, right: null, text: '商店街に、タコと イカの\nよび声が ひびいた。\n―― おしまい ――' },
        { bg: 'ending', picture: true },
      ],
    },
  };
})();
