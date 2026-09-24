#!/usr/bin/env python3
"""
生成微信小程序 tabBar 图标。

为什么用脚本生成而不是放入图片素材：
  1. 项目当前没有任何图片素材，tabBar 又不接受 SVG 或字体图标（iOS 端有兼容问题），
     必须提供 PNG；
  2. 环境未安装 Pillow，故此处用标准库 zlib + struct 直接编码 PNG；
  3. 以脚本生成意味着图标可复现、可微调（改线宽、圆角、颜色即可重跑），
     而不是几个来历不明的二进制文件。

图标为线性几何风格，与全站的中式细线语言一致。

用法：
    python scripts/gen-tabbar-icons.py

输出：
    src/static/tabbar/{home,shop,stone,workshop,user}[-active].png
"""

import math
import os
import struct
import zlib

SIZE = 81  # 微信 tabBar 推荐 81 × 81

# 与 src/styles/_theme-paper.scss 中的 --c-ink-3 / --c-accent 保持一致
COLOR_NORMAL = (0x8A, 0x83, 0x78)
COLOR_ACTIVE = (0x9E, 0x2B, 0x25)

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'static', 'tabbar')


# ---------------------------------------------------------------------------
# PNG 编码（标准库实现）
# ---------------------------------------------------------------------------
def write_png(path, width, height, pixels):
    """pixels: 行优先的 (r, g, b, a) 元组序列"""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0 (None)
        for x in range(width):
            raw.extend(pixels[y * width + x])

    def chunk(tag, data):
        return (
            struct.pack('>I', len(data))
            + tag
            + data
            + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')

    with open(path, 'wb') as fp:
        fp.write(png)


# ---------------------------------------------------------------------------
# 极简抗锯齿画布
#
# 思路：为每个像素计算它到图形「骨架」的距离，再由距离换算覆盖率。
# 覆盖率落在 [0, 1]，天然得到抗锯齿边缘，无需超采样。
# ---------------------------------------------------------------------------
class Canvas:
    def __init__(self, size):
        self.size = size
        self.buf = [0.0] * (size * size)

    def _paint(self, x, y, coverage):
        if coverage <= 0 or x < 0 or y < 0 or x >= self.size or y >= self.size:
            return
        idx = y * self.size + x
        # 取最大值而非累加，避免交叠处叠加过重
        if coverage > self.buf[idx]:
            self.buf[idx] = coverage

    def _stroke(self, dist_fn, half_width):
        """dist_fn(x, y) 返回像素中心到骨架的距离"""
        for y in range(self.size):
            cy = y + 0.5
            for x in range(self.size):
                cx = x + 0.5
                d = dist_fn(cx, cy)
                self._paint(x, y, min(1.0, max(0.0, half_width + 0.5 - d)))

    def line(self, x0, y0, x1, y1, width=5.0):
        dx, dy = x1 - x0, y1 - y0
        length_sq = dx * dx + dy * dy

        def dist(px, py):
            if length_sq == 0:
                return math.hypot(px - x0, py - y0)
            t = max(0.0, min(1.0, ((px - x0) * dx + (py - y0) * dy) / length_sq))
            return math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))

        self._stroke(dist, width / 2.0)

    def circle(self, cx, cy, r, width=5.0):
        self._stroke(lambda px, py: abs(math.hypot(px - cx, py - cy) - r), width / 2.0)

    def arc(self, cx, cy, r, a0, a1, width=5.0):
        """角度区间弧线，用于圆角与弧顶"""
        def dist(px, py):
            ang = math.atan2(py - cy, px - cx)
            while ang < a0:
                ang += 2 * math.pi
            if ang <= a1:
                return abs(math.hypot(px - cx, py - cy) - r)
            # 落在角度外：取到两个端点的最近距离
            p0 = (cx + r * math.cos(a0), cy + r * math.sin(a0))
            p1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
            return min(math.hypot(px - p0[0], py - p0[1]), math.hypot(px - p1[0], py - p1[1]))

        self._stroke(dist, width / 2.0)

    def rounded_rect(self, x, y, w, h, radius, width=5.0):
        """圆角矩形描边"""
        r = radius

        def dist(px, py):
            # 到圆角矩形边界的有符号距离（仅取绝对值即为描边距离）
            qx = abs(px - (x + w / 2)) - (w / 2 - r)
            qy = abs(py - (y + h / 2)) - (h / 2 - r)
            outside = math.hypot(max(qx, 0.0), max(qy, 0.0))
            inside = min(max(qx, qy), 0.0)
            return abs(outside + inside - r)

        self._stroke(dist, width / 2.0)

    def render(self, color):
        r, g, b = color
        out = []
        for c in self.buf:
            a = int(round(c * 255))
            out.append((r, g, b, a))
        return out


# ---------------------------------------------------------------------------
# 图标定义（均为 81 × 81 画布上的几何线稿）
# ---------------------------------------------------------------------------
def icon_home():
    """首页：中式门楼。横脊 + 两坡屋顶 + 门洞"""
    c = Canvas(SIZE)
    # 屋脊
    c.line(12, 27, 69, 27, 5)
    # 两坡屋檐（微微起翘的直线近似）
    c.line(18, 27, 40.5, 13, 5)
    c.line(63, 27, 40.5, 13, 5)
    # 立柱
    c.line(21, 27, 21, 68, 5)
    c.line(60, 27, 60, 68, 5)
    # 门洞
    c.rounded_rect(33, 42, 15, 26, 5, 5)
    return c.render(COLOR_NORMAL), c.render(COLOR_ACTIVE)


def icon_shop():
    """商城：提袋。袋身 + 提手 + 折线"""
    c = Canvas(SIZE)
    # 袋身
    c.rounded_rect(16, 30, 49, 40, 6, 5)
    # 提手
    c.arc(40.5, 30, 12, math.pi, 2 * math.pi, 5)
    # 袋身横折线
    c.line(16, 43, 65, 43, 4)
    return c.render(COLOR_NORMAL), c.render(COLOR_ACTIVE)


def icon_stone():
    """开石：原石。菱形轮廓 + 内部分面线，取「剖开后见其内里」之意"""
    c = Canvas(SIZE)
    top = (40.5, 12)
    right = (68, 34)
    bottom = (40.5, 69)
    left = (13, 34)
    for a, b in ((top, right), (right, bottom), (bottom, left), (left, top)):
        c.line(a[0], a[1], b[0], b[1], 5)
    # 分面线
    c.line(left[0], left[1], right[0], right[1], 4)
    c.line(top[0], top[1], 40.5, 34, 4)
    c.line(40.5, 34, bottom[0], bottom[1], 4)
    return c.render(COLOR_NORMAL), c.render(COLOR_ACTIVE)


def icon_workshop():
    """工坊：刻刀。刀身斜置 + 刀口横线"""
    c = Canvas(SIZE)
    # 刀杆
    c.line(20, 62, 57, 22, 6)
    # 刀头加宽
    c.line(52, 18, 62, 28, 9)
    # 落刀线
    c.line(14, 68, 52, 68, 5)
    return c.render(COLOR_NORMAL), c.render(COLOR_ACTIVE)


def icon_user():
    """我的：人像。头 + 肩弧"""
    c = Canvas(SIZE)
    c.circle(40.5, 28, 14, 5)
    c.arc(40.5, 74, 25, math.pi * 1.18, math.pi * 1.82, 5)
    return c.render(COLOR_NORMAL), c.render(COLOR_ACTIVE)


ICONS = {
    'home': icon_home,
    'shop': icon_shop,
    'stone': icon_stone,
    'workshop': icon_workshop,
    'user': icon_user,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, builder in ICONS.items():
        normal, active = builder()
        write_png(os.path.join(OUT_DIR, f'{name}.png'), SIZE, SIZE, normal)
        write_png(os.path.join(OUT_DIR, f'{name}-active.png'), SIZE, SIZE, active)
        print(f'generated {name}.png / {name}-active.png')
    print(f'\noutput dir: {os.path.normpath(OUT_DIR)}')


if __name__ == '__main__':
    main()
