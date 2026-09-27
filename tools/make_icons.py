# -*- coding: utf-8 -*-
"""
ナオと タコ一郎の 顔と、タイトルロゴ「街と、その白い壁」から、アプリの アイコン一式を つくる。
（前作 cat-on-escape の tools/make_icons.py と おなじ 図がら）

・海と 空の 色の 角丸の 上に、ロゴ（上）と ナオ・タコ一郎の 顔（下）を ならべる
・小さい アイコン（64px 以下）は ロゴの 文字が つぶれるので、顔だけに する
・app/images/icon-32 / 180 / 192 / 512.png と、紹介ページ用の
  assets/icon.png（512px）・assets/favicon.png（64px）を 書き出す

つかいかた:
    python3 tools/make_icons.py [ナオの立ち絵] [タコ一郎の立ち絵] [ロゴ]
例（なにも わたさなければ これ）:
    python3 tools/make_icons.py app/images/story/nao-happy.png app/images/story/tako1-normal.png app/images/story/logo.png

必要なもの: pillow, numpy （pip install pillow numpy）
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

BASE = 1024                    # 下ごしらえの 大きさ（ここから 縮小する）
SKY_TOP = (196, 236, 250)      # 空の 水色
SKY_BOTTOM = (76, 170, 214)    # 海の あお
RIM = (24, 72, 84)             # ロゴの ふちと おなじ こい あおみどり
HEAD = 0.74                    # 立ち絵の うち つかう 上の わりあい（顔と えり もと）
SMALL = 64                     # これ いかの 大きさは 顔だけの 図がら
OUT = [
    ('app/images/icon-512.png', 512),
    ('app/images/icon-192.png', 192),
    ('app/images/icon-180.png', 180),
    ('app/images/icon-32.png', 32),
    ('assets/icon.png', 512),
    ('assets/favicon.png', 64),
]


def head_of(path, ratio=HEAD):
    """立ち絵の 上の ほう（顔と かみ）を 切りだす"""
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im)[:, :, 3]
    ys, _ = np.nonzero(a > 20)
    top, bottom = ys.min(), ys.max()
    cut = top + int((bottom - top) * ratio)
    cols = np.nonzero(a[top:cut].max(axis=0) > 20)[0]
    return im.crop((cols.min(), top, cols.max() + 1, cut))


def rounded(size, inset=0):
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([inset, inset, size - 1 - inset, size - 1 - inset],
                                           radius=int(size * 0.19), fill=255)
    return mask


def sky():
    grad = np.linspace(0, 1, BASE)[:, None]
    rgb = np.array(SKY_TOP) * (1 - grad) + np.array(SKY_BOTTOM) * grad        # (BASE, 3)
    img = np.repeat(rgb[:, None, :], BASE, axis=1).astype(np.uint8)
    return Image.fromarray(img, 'RGB').convert('RGBA')


def place_heads(canvas, nao, tako, box_top, box_bottom, width_ratio):
    """ナオ（左）と タコ一郎（右・すこし 小さく）の 顔を、下に そろえて ならべる"""
    nao_h = box_bottom - box_top
    tako_h = int(nao_h * 0.82)
    nao = nao.resize((int(nao.width * nao_h / nao.height), nao_h), Image.LANCZOS)
    tako = tako.resize((int(tako.width * tako_h / tako.height), tako_h), Image.LANCZOS)
    overlap = int(tako.width * 0.12)            # すこし 重ねて なかよく
    total = nao.width + tako.width - overlap
    scale = min(1.0, BASE * width_ratio / total)
    if scale < 1:
        nao = nao.resize((int(nao.width * scale), int(nao.height * scale)), Image.LANCZOS)
        tako = tako.resize((int(tako.width * scale), int(tako.height * scale)), Image.LANCZOS)
        overlap = int(overlap * scale)
        total = nao.width + tako.width - overlap
    x0 = (BASE - total) // 2
    canvas.alpha_composite(tako, (x0 + nao.width - overlap, box_bottom - tako.height))
    canvas.alpha_composite(nao, (x0, box_bottom - nao.height))


def build(nao_path, tako_path, logo_path, small):
    canvas = sky()
    nao, tako = head_of(nao_path), head_of(tako_path, 0.9)
    if small:
        place_heads(canvas, nao, tako, int(BASE * 0.06), BASE, 1.04)
    else:
        place_heads(canvas, nao, tako, int(BASE * 0.47), BASE, 0.92)
        logo = Image.open(logo_path).convert('RGBA')
        w = int(BASE * 0.92)
        logo = logo.resize((w, int(logo.height * w / logo.width)), Image.LANCZOS)
        canvas.alpha_composite(logo, ((BASE - w) // 2, int(BASE * 0.05)))
    # ふちに こい あおみどりの わく（ロゴの ふちと おなじ 色）。わくの そとは 角丸で 切る
    ImageDraw.Draw(canvas).rounded_rectangle([0, 0, BASE - 1, BASE - 1], radius=int(BASE * 0.19),
                                             outline=RIM + (255,), width=int(BASE * 0.035))
    out = Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    out.paste(canvas, (0, 0), rounded(BASE))
    return out


def main():
    args = sys.argv[1:]
    nao = args[0] if len(args) > 0 else 'app/images/story/nao-happy.png'
    tako = args[1] if len(args) > 1 else 'app/images/story/tako1-normal.png'
    logo = args[2] if len(args) > 2 else 'app/images/story/logo.png'
    for p in (nao, tako, logo):
        if not os.path.exists(p):
            print(f'× {p} が ありません')
            return 1
    big = build(nao, tako, logo, small=False)
    small = build(nao, tako, logo, small=True)
    for path, size in OUT:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        (small if size <= SMALL else big).resize((size, size), Image.LANCZOS).save(path, optimize=True)
        print(f'○ {path} ({size}px)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
