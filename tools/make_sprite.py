# -*- coding: utf-8 -*-
"""
生成AIが出した「立ち絵」（上半身）の画像を、ストーリー画面で使える形に整える。

make_face.py（顔アイコン用）との ちがい:
・体は 絵の 下の はしで 切れている ので、白い 背景は 上と 左右の ふちからだけ たどって 抜く
  （下の ふちから たどると、ブレザーや カーディガンまで 背景と まちがえて 抜けてしまう）
・体の 下はしは 正方形の 下に そろえたまま、左右の まんなかに 置く（セリフ窓の 上に 立たせるため）
・グリッドに 区切り線が 描かれていても よい。線を 見つけて、マスごとに 切り分ける
・区切り線が ない ときは、絵の かたまり（キャラ）を 見つけて 切り分ける。
  釣り竿の 魚や 湯気のように、となりの マスに はみ出した 小物も、いちばん 近い キャラに つける

つかいかた:
    python3 tools/make_sprite.py 出力先ディレクトリ 入力:列数x行数:出力名[,出力名...] ...

例（2列×2行に 表情4つ。左上から右へ の順に 名前を 書く）:
    python3 tools/make_sprite.py app/images/story nao.jpg:2x2:nao-normal,nao-happy,nao-surprised,nao-serious

必要なもの: pillow, numpy （pip install pillow numpy）
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

SIZE = 512        # 書き出す1枚の大きさ（px）
WHITE = 232       # これより 明るい（R・G・B すべて）画素を 背景の 白と みなす
LINE = 90         # これより 暗い 画素が 列（行）の 8割を こえたら 区切り線と みなす
TOP_MARGIN = 0.03 # 頭の上に あける 余白（1枚の 高さに 対する 割合）


def has_lines(img, cols, rows):
    """グリッドの 区切り線が 描かれているか"""
    a = np.asarray(img).astype(int)
    h, w, _ = a.shape
    dark = a.max(axis=2) < LINE
    col, row = dark.mean(axis=0), dark.mean(axis=1)
    near = lambda prof, n, parts: any(
        prof[max(0, n * k // parts - n // 20):n * k // parts + n // 20].max() > 0.8 for k in range(1, parts))
    return (cols > 1 and near(col, w, cols)) or (rows > 1 and near(row, h, rows))


def label(mask):
    """つながった かたまりに 番号を つける（上下左右）。0 は なし。"""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n += 1
        lab[y0, x0] = n
        queue = deque([(y0, x0)])
        while queue:
            y, x = queue.popleft()
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n
                    queue.append((ny, nx))
    return lab, n


def split_figures(img, cols, count):
    """区切り線が ない グリッドを、キャラごとに 切り分ける。
    大きい かたまり count個を キャラと し、のこりの 小物は いちばん 近い キャラに つける。
    かえす ものは、キャラごとの 切りぬき（RGBA）の ならび（左上から 右へ）。"""
    rgb = np.asarray(img.convert('RGB')).astype(int)
    h, w, _ = rgb.shape
    S = 4                                     # かたまりを さがす ときは 1/4 に ちぢめる（はやさの ため）
    fg = rgb.min(axis=2) < WHITE
    sh, sw = (h + S - 1) // S, (w + S - 1) // S
    small = np.zeros((sh, sw), bool)
    for dy in range(S):
        for dx in range(S):
            part = fg[dy::S, dx::S]
            small[:part.shape[0], :part.shape[1]] |= part
    lab, n = label(small)
    if n < count:
        raise SystemExit('キャラが %d こ しか 見つかりません（%d こ ほしい）' % (n, count))

    sizes = np.bincount(lab.ravel())[1:]
    anchors = list(np.argsort(sizes)[::-1][:count] + 1)
    boxes = {}
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        boxes[i] = (ys.min(), xs.min(), ys.max(), xs.max(), ys.mean(), xs.mean())

    def gap(a, b):
        ay0, ax0, ay1, ax1 = boxes[a][:4]
        by0, bx0, by1, bx1 = boxes[b][:4]
        return max(0, max(ay0, by0) - min(ay1, by1)) ** 2 + max(0, max(ax0, bx0) - min(ax1, bx1)) ** 2

    owner = np.zeros(n + 1, np.int32)         # かたまり → キャラ（anchors の なかの 番号＋1）
    for k, a in enumerate(anchors):
        owner[a] = k + 1
    for i in range(1, n + 1):
        if not owner[i]:
            owner[i] = min(range(count), key=lambda k: gap(i, anchors[k])) + 1

    # ならびを きめる：上から cols こずつ、行の なかは 左から
    by_y = sorted(range(count), key=lambda k: boxes[anchors[k]][4])
    order = []
    for r in range(0, count, cols):
        order += sorted(by_y[r:r + cols], key=lambda k: boxes[anchors[k]][5])

    who = owner[lab]                          # ちぢめた 画面の 各マスが どの キャラか（0 は 背景）
    who_full = np.repeat(np.repeat(who, S, axis=0), S, axis=1)[:h, :w]
    figures = []
    for k in order:
        ys, xs = np.nonzero(who == k + 1)
        y0, y1 = max(0, ys.min() * S - S), min(h, (ys.max() + 1) * S + S)
        x0, x1 = max(0, xs.min() * S - S), min(w, (xs.max() + 1) * S + S)
        crop = cut_out(img.crop((x0, y0, x1, y1)))
        a = np.asarray(crop).copy()
        mine = who_full[y0:y1, x0:x1]
        a[:, :, 3][(mine != 0) & (mine != k + 1)] = 0     # となりの キャラの ものは 消す
        figures.append(Image.fromarray(a, 'RGBA'))
    return figures


def split_cells(img, cols, rows):
    """区切り線に そって マスに 切る（線が 見つからない ところは 等分）。"""
    a = np.asarray(img).astype(int)
    h, w, _ = a.shape
    dark = a.max(axis=2) < LINE

    def cuts(profile, n, parts):
        edges = [0]
        for k in range(1, parts):
            center = n * k // parts
            lo, hi = center - n // 20, center + n // 20
            hits = [i for i in range(lo, hi) if profile[i] > 0.8]
            if hits:
                edges += [min(hits), max(hits) + 1]
            else:
                edges += [center, center]
        edges.append(n)
        return [(edges[i], edges[i + 1]) for i in range(0, len(edges), 2)]

    xs = cuts(dark.mean(axis=0), w, cols)
    ys = cuts(dark.mean(axis=1), h, rows)
    pad = max(3, w // 200)    # 線の にじみを よける
    cells = []
    for y0, y1 in ys:
        for x0, x1 in xs:
            cells.append(img.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad)))
    return cells


def cut_out(cell):
    """上と 左右の ふちから つながる 白を 透明に する。"""
    a = np.asarray(cell.convert('RGB')).astype(int)
    h, w, _ = a.shape
    white = a.min(axis=2) >= WHITE
    bg = np.zeros((h, w), bool)
    queue = deque()
    seeds = [(0, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    for y, x in seeds:
        if white[y, x] and not bg[y, x]:
            bg[y, x] = True
            queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                queue.append((ny, nx))

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # ふちの 1画素は、白っぽさに あわせて すこし 透かす（ギザギザを やわらげる）
    near = np.zeros_like(bg)
    near[1:] |= bg[:-1]; near[:-1] |= bg[1:]; near[:, 1:] |= bg[:, :-1]; near[:, :-1] |= bg[:, 1:]
    edge = near & ~bg
    light = a.min(axis=2)
    alpha[edge] = np.clip((255 - light[edge]) * 255 // max(1, 255 - 150), 60, 255).astype(np.uint8)

    rgba = np.dstack([a.astype(np.uint8), alpha])
    return Image.fromarray(rgba, 'RGBA')


def to_square(sprite):
    """中身を 切りつめ、下はしを そろえて 正方形の 下・まんなかに 置く。"""
    a = np.asarray(sprite)[:, :, 3]
    ys, xs = np.where(a > 0)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)   # 体が 下で 切れて いれば、そのまま 下はし
    body = sprite.crop(box)
    side = max(body.width, int(body.height * (1 + TOP_MARGIN)))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(body, ((side - body.width) // 2, side - body.height))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    out_dir = argv[0]
    os.makedirs(out_dir, exist_ok=True)
    for spec in argv[1:]:
        path, grid, names = spec.rsplit(':', 2)
        cols, rows = (int(n) for n in grid.lower().split('x'))
        names = names.split(',')
        img = Image.open(path).convert('RGB')
        wanted = [n for n in names if n]
        if has_lines(img, cols, rows):
            sprites = [cut_out(cell) for cell, name in zip(split_cells(img, cols, rows), names) if name]
        else:
            sprites = split_figures(img, cols, len(wanted))
        for name, sprite in zip(wanted, sprites):
            dest = os.path.join(out_dir, name + '.png')
            # 色数の すくない 絵なので 256色に へらして 軽くする（見た目は ほぼ 変わらず 1/6 ほどに）
            to_square(sprite).quantize(256, method=Image.Quantize.FASTOCTREE,
                                       dither=Image.Dither.NONE).save(dest, optimize=True)
            print('○', path, '→', dest)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
