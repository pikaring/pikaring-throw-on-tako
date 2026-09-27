/* 街と、その白い壁 ―― 24の 城（8面 × 3）。window.STAGES をつくる。
 *
 *   図面：いちばん 下の 行が 地面。W 白・H かたい・R 赤（ばくはつ）、'-' 左の ブロックを 右へ のばす、'|' 上の ブロックを 下へ のばす
 *   ルール：土台（いちばん 下の 行に とどく ブロック）以外は 地面に ふれると 消える。
 *           ブロックは 重心が 支えの 外に でると すべり落ちる。
 *   置いた ままで 崩れないこと・入れた タコで クリアできることは `node tools/sim_check.js` で 確かめる。
 */
(() => {
  'use strict';

  const T13 = ['nao', 'fumi', 'maki'];
  const T4 = ['nao', 'fumi', 'maki', 'chika'];

  window.STAGES = [
    // ===== 1面 通学路（タコ一郎） =====
    {
      no: 1, stage: 1, name: '1-1', goal: 0.7,
      rows: [
        '  W  ',
        ' W-- ',
        ' W W ',
        'WWWWW',
      ],
      takos: { tako1: 4 }, throwers: T13,
      hint: 'ひっぱって はなすと 投げられるよ',
    },
    {
      no: 2, stage: 1, name: '1-2', goal: 0.7,
      rows: [
        '   R   ',
        '  W--  ',
        '  W W  ',
        ' W---- ',
        ' W   W ',
        ' |   | ',
        'WWWWWWW',
      ],
      takos: { tako1: 4 }, throwers: T13,
      hint: '赤い ブロックに あてると ばくはつ！',
    },
    {
      no: 3, stage: 1, name: '1-3', goal: 0.75,
      rows: [
        '   W   ',
        '  W--  ',
        '  W W  ',
        '  W--  ',
        '  W W  ',
        '  W--  ',
        ' R W R ',
        'WWWWWWW',
      ],
      takos: { tako1: 4 }, throwers: T13,
      hint: 'ささえを ぬけば、いっぺんに くずれる',
    },

    // ===== 2面 商店街（タコ二郎） =====
    {
      no: 4, stage: 2, name: '2-1', goal: 0.7,
      rows: [
        '  W--  ',
        ' WWWWW ',
        ' WWRWW ',
        ' WWWWW ',
        'WWWWWWW',
      ],
      takos: { tako1: 2, tako2: 2 }, throwers: T4,
      hint: '二郎は おもくて、あつい かべも つきぬける',
    },
    {
      no: 5, stage: 2, name: '2-2', goal: 0.7,
      rows: [
        '  W R W  ',
        '  W----  ',
        '  W W W  ',
        ' H------ ',
        ' WW R WW ',
        ' WWWWWWW ',
      ],
      takos: { tako1: 2, tako2: 3 }, throwers: T4,
      hint: 'かたい 屋根の 下に 赤い はしら',
    },
    {
      no: 6, stage: 2, name: '2-3', goal: 0.7,
      rows: [
        '     R     ',
        ' W-------- ',
        ' WWW   WWW ',
        ' WRW   WRW ',
        ' WWW   WWW ',
        ' H--   H-- ',
        ' WWW   WWW ',
      ],
      takos: { tako1: 2, tako2: 3 }, throwers: T4,
      hint: 'チカは ちいさい タコを 3びき いっぺんに',
    },

    // ===== 3面 路地裏（タコ三郎） =====
    {
      no: 7, stage: 3, name: '3-1', goal: 0.7,
      rows: [
        '      R     ',
        '     W--    ',
        '     WWW    ',
        ' H-------   ',
        '     WWWW   ',
        '  R  WWWW   ',
        '  W  WWWW   ',
      ],
      takos: { tako1: 1, tako2: 2, tako3: 2 }, throwers: T4,
      hint: '三郎は よく はねる。地面で はねさせて 屋根の 下へ',
    },
    {
      no: 8, stage: 3, name: '3-2', goal: 0.7,
      rows: [
        '   W--  W--  ',
        '   WWW  WWW  ',
        '   WWW  WWW  ',
        '   WWWRRWWW  ',
        '   WWWWWWWW  ',
      ],
      takos: { tako1: 1, tako2: 2, tako3: 2 }, throwers: T4,
      hint: 'ひさしの 下の 赤い ブロックを ねらおう',
    },
    {
      no: 9, stage: 3, name: '3-3', goal: 0.7,
      rows: [
        '   W--  W--  ',
        '   W W  W W  ',
        '  H--------- ',
        '  WW R R  WW ',
        '  WW W W  WW ',
        '  WWWW WW WW ',
      ],
      takos: { tako1: 1, tako2: 2, tako3: 2 }, throwers: T4,
      hint: 'せまい すきまに はずませて 赤を',
    },

    // ===== 4面 公園（タコ四郎） =====
    {
      no: 10, stage: 4, name: '4-1', goal: 0.75,
      rows: [
        '  R    R    R ',
        ' W--  W--  W--',
        ' W W  W W  W W',
        ' W--  W--  W--',
        ' W W  W W  W W',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 2 }, throwers: T4,
      hint: '四郎は 空中で タップすると 3びきに わかれる',
    },
    {
      no: 11, stage: 4, name: '4-2', goal: 0.75,
      rows: [
        '       W-      ',
        '      W-W-     ',
        '     W-W-W-    ',
        '    W-R-W-W-   ',
        '   W-W-W-W-W-  ',
        '  W-W-W-W-W-W- ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 3 }, throwers: T4,
      hint: 'ピラミッドの 赤を まとめて ねらう',
    },
    {
      no: 12, stage: 4, name: '4-3', goal: 0.75,
      rows: [
        '   R    R     ',
        '  W--  W--    ',
        '  W W  W W    ',
        ' H----------- ',
        ' WW  R R   WW ',
        ' WW  WWW   WW ',
        ' WWW WWW  WWW ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 3 }, throwers: T4,
      hint: 'はしらの 赤を ねらうと 屋根が おちる',
    },

    // ===== 5面 河川敷（タコ五郎） =====
    {
      no: 13, stage: 5, name: '5-1', goal: 0.75,
      rows: [
        ' W------- ',
        ' H      H ',
        ' | WWWW | ',
        ' | WWWW | ',
        ' | WRRW | ',
        ' | WWWW | ',
        ' | WWWW | ',
        ' | WWWW | ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 2 }, throwers: T4,
      hint: '五郎は 空中で タップすると まっすぐ 下へ',
    },
    {
      no: 14, stage: 5, name: '5-2', goal: 0.75,
      rows: [
        ' W---- W---- ',
        ' H   H H   H ',
        ' | W | | R | ',
        ' |WRW| |WWW| ',
        ' |W-W| |WRW| ',
        ' |WWW| |WWW| ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 2 }, throwers: T4,
      hint: 'いどの 中は 上から しか ねらえない',
    },
    {
      no: 15, stage: 5, name: '5-3', goal: 0.75,
      rows: [
        '   W----    ',
        '   H   H    ',
        '   | R |    ',
        '   | W |    ',
        '   | W |    ',
        '  W-------  ',
        '  WW R  WW  ',
        '  WW W  WW  ',
        '  WWWWWWWW  ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 2 }, throwers: T4,
      hint: 'えんとつの 中へ 五郎を まっすぐ',
    },

    // ===== 6面 工場跡（タコ六郎） =====
    {
      no: 16, stage: 6, name: '6-1', goal: 0.75,
      rows: [
        '     R      ',
        '   H-----   ',
        '   H WW H   ',
        '   | WW |   ',
        ' W | HH | W ',
        ' WW| WW |WW ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1 }, throwers: T4,
      hint: '六郎は あたって すこし したら 大ばくはつ',
    },
    {
      no: 17, stage: 6, name: '6-2', goal: 0.75,
      rows: [
        '  H--  H--  ',
        '  W W  W W  ',
        ' H--------- ',
        ' H WRW WRWH ',
        ' | WWW WWW| ',
        ' | H-- H--| ',
        ' | W W W W| ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 2 }, throwers: T4,
      hint: 'かたい 屋根は 六郎の ばくはつで',
    },
    {
      no: 18, stage: 6, name: '6-3', goal: 0.75,
      rows: [
        '    W-  W-    ',
        '   H--  H--   ',
        '   W W  W W   ',
        '  H--------   ',
        '  W  RR   W   ',
        '  |  HH   |   ',
        ' H----------- ',
        ' H  W  W  W H ',
        ' |  |  |  | | ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 2 }, throwers: T4,
      hint: 'まん中の 赤い ふたつが カギ',
    },

    // ===== 7面 トンネル（タコ七郎） =====
    {
      no: 19, stage: 7, name: '7-1', goal: 0.8,
      rows: [
        '   H--    ',
        '  H---H-- ',
        '  H H H H ',
        '  H------ ',
        '  H  H  H ',
        '  HH HH HH',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1, tako7: 1 }, throwers: T4,
      hint: '七郎の スミが かかると かたい ブロックも もろく なる',
    },
    {
      no: 20, stage: 7, name: '7-2', goal: 0.8,
      rows: [
        '    H-  H-    ',
        '   H--- H--   ',
        '   H  H H H   ',
        '  H---------  ',
        '  H  WRW   H  ',
        '  |  WWW   |  ',
        ' H---------H- ',
        ' H  H   H   H ',
        ' |  |   |   | ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1, tako7: 1 }, throwers: T4,
      hint: 'スミを かけてから 二郎で つきぬけ',
    },
    {
      no: 21, stage: 7, name: '7-3', goal: 0.8,
      rows: [
        '     R-      ',
        '    H---     ',
        '    H  H     ',
        '   H-----    ',
        '   H H  H    ',
        '  H-------   ',
        '  H  H  H    ',
        ' H---------  ',
        ' H  H  H  H  ',
        ' |  |  |  |  ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1, tako7: 1 }, throwers: T4,
      hint: 'かたい ピラミッド。スミで もろく',
    },

    // ===== 8面 イカ女王の 城（タコ大王） =====
    {
      no: 22, stage: 8, name: '8-1', goal: 0.8,
      rows: [
        '   R       R   ',
        '  W--     W--  ',
        '  W W     W W  ',
        '  H--     H--  ',
        '  W W     W W  ',
        ' H------------ ',
        ' WWW  R  WWWW  ',
        ' WWW WWW WWWW  ',
        ' WRW WWW WRWW  ',
        ' WWWWWWWWWWWW  ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1, tako7: 1, daiou: 1 }, throwers: T4,
      hint: 'タコ大王の ゆれで 城ごと ゆらせ！',
    },
    {
      no: 23, stage: 8, name: '8-2', goal: 0.8,
      rows: [
        '      W-      ',
        '     H--      ',
        '     W W      ',
        '  W--H--W--   ',
        '  W W W W W   ',
        '  H--------   ',
        '  WWR WRWW    ',
        ' WWWWWWWWWWW  ',
        ' WHHWWWWWHHW  ',
        ' WWWWRWWWWWW  ',
        'WWWWWWWWWWWWW ',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1, tako7: 1, daiou: 1 }, throwers: T4,
      hint: 'じょうぶな 土台。上から くずそう',
    },
    {
      no: 24, stage: 8, name: '8-3', goal: 0.85,
      rows: [
        '       R       ',
        '      H--      ',
        '      W W      ',
        '    H------    ',
        '   WW R  R WW  ',
        '   WWWWWWWWWW  ',
        '  H-----------  ',
        '  WW  WRW  WW  ',
        '  WW WWWWW WW  ',
        '  WWRWWHWWWRWW ',
        ' WWWWWWWWWWWWWW',
      ],
      takos: { tako1: 1, tako2: 1, tako3: 1, tako4: 1, tako5: 1, tako6: 1, tako7: 1, daiou: 1 }, throwers: T4,
      hint: 'さいごの 城。赤の つながりを さがせ',
    },
  ];
})();
