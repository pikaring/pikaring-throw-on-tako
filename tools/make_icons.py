# -*- coding: utf-8 -*-
"""
ゲームの タコ一郎の 立ち絵から、アプリの アイコン一式を つくる。

・海の あおの 角丸の 上に タコを おき、左に 飛んで いく いきおいの 線を 3本 入れる
・右下に 白い ブロックを 3つ 積む（こわす 城の しるし）
・app/images/icon-32 / 180 / 192 / 512.png と、紹介ページ用の
  assets/icon.png（512px）・assets/favicon.png（64px）を 書き出す

つかいかた:
    python3 tools/make_icons.py [タコの 立ち絵の PNG]
例:
    python3 tools/make_icons.py app/images/story/tako1-normal.png

必要なもの: pillow （pip install pillow）
"""
import os
import sys

from PIL import Image, ImageDraw

BASE = 1024                    # 下ごしらえの 大きさ（ここから 縮小する）
BG = (35, 80, 110, 255)        # 紹介ページの --ember-dark と おなじ 海の あお #23506e
LINE = (255, 227, 110, 255)    # きいろ #ffe36e
BLOCK = (251, 251, 248, 255)   # 白い ブロック #fbfbf8
EDGE = (185, 195, 204, 255)    # ブロックの ふち #b9c3cc
TAKO = 0.62                    # タコが アイコンに 占める わりあい（はば）
SHIFT = (0.02, -0.06)          # まんなかから ずらす（上へ。右下の ブロックの ぶん）
OUT = [
    ('app/images/icon-512.png', 512),
    ('app/images/icon-192.png', 192),
    ('app/images/icon-180.png', 180),
    ('app/images/icon-32.png', 32),
    ('assets/icon.png', 512),
    ('assets/favicon.png', 64),
]


def build(tako_path):
    icon = Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    draw.rounded_rectangle([0, 0, BASE - 1, BASE - 1], radius=int(BASE * 0.19), fill=BG)

    # 飛んで いく いきおいの 線（左はしに 3本。前作 cat-on-escape と おなじ 形）
    w = int(BASE * 0.03)
    for y, length in ((0.34, 0.09), (0.46, 0.065), (0.58, 0.09)):
        y0 = int(BASE * y)
        draw.rounded_rectangle(
            [int(BASE * 0.05), y0 - w // 2, int(BASE * (0.05 + length)), y0 + w // 2],
            radius=w // 2, fill=LINE)

    # 右下の 白い ブロック（2つ ならべて、上に 1つ）
    s = int(BASE * 0.12)
    x0, y0 = int(BASE * 0.68), int(BASE * 0.92)
    for bx, by in ((x0, y0 - s), (x0 + s, y0 - s), (x0 + s // 2, y0 - 2 * s)):
        draw.rounded_rectangle([bx, by, bx + s - 6, by + s - 6], radius=int(s * 0.12),
                               fill=BLOCK, outline=EDGE, width=int(BASE * 0.012))

    # タコ（透明な ところで 切りつめてから、はばを そろえる）
    tako = Image.open(tako_path).convert('RGBA')
    box = tako.getchannel('A').getbbox()
    if box:
        tako = tako.crop(box)
    tw = int(BASE * TAKO)
    th = round(tako.height * tw / tako.width)
    tako = tako.resize((tw, th), Image.LANCZOS).rotate(-12, resample=Image.BICUBIC, expand=True)
    x = int((BASE - tako.width) / 2 + BASE * SHIFT[0])
    y = int((BASE - tako.height) / 2 + BASE * SHIFT[1])
    icon.alpha_composite(tako, (x, y))

    # 角丸の 外に はみ出した ところを 切る
    mask = Image.new('L', (BASE, BASE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, BASE - 1, BASE - 1], radius=int(BASE * 0.19), fill=255)
    out = Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    out.paste(icon, (0, 0), mask)
    return out


def main():
    tako_path = sys.argv[1] if len(sys.argv) > 1 else 'app/images/story/tako1-normal.png'
    if not os.path.exists(tako_path):
        print(f'× {tako_path} が ありません')
        return 1
    icon = build(tako_path)
    for path, size in OUT:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        icon.resize((size, size), Image.LANCZOS).save(path)
        print(f'○ {path} ({size}px)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
