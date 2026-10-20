#!/usr/bin/env python3
"""customer_app launcher ikonu üretici (bağımlılık yok: PNG'yi elle yazıyor).

Neden script: repoda marka görseli yok (logo SVG/PNG yok), PIL de kurulu değil.
Uygulama içi marka işareti `Icons.local_florist` (üç yapraklı çiçek); launcher
ikonu da aynı dili kullanır: mor gradyan zemin + beyaz disk + mor üç yaprak.

Çıktılar:
  assets/icon/app_icon.png          1024² legacy ikon (tam kaplama)
  assets/icon/app_icon_foreground.png 1024² adaptive ön katman (şeffaf, güvenli bölgede)
  assets/icon/app_icon_monochrome.png 1024² Android 13 temalı ikon (silüet)

Kullanım:  python3 scripts/make_app_icon.py
Ardından:  dart run flutter_launcher_icons
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 1024
OUT = Path(__file__).resolve().parents[1] / "apps/customer_app/assets/icon"

# Marka renkleri (app_colors.dart bannerGradient ile birebir aynı duraklar).
TOP = (0x7C, 0x5C, 0xBF)      # bannerGradient açık durağı (#7C5CBF)
BOTTOM = (0x4A, 0x32, 0x98)   # bannerGradient koyu durağı (#4A3298)
WHITE = (0xFF, 0xFF, 0xFF, 255)
TRANSPARENT = (0, 0, 0, 0)


def write_png(path: Path, px: list[list[tuple[int, int, int, int]]]) -> None:
    """RGBA piksel matrisini bağımlılıksız PNG'ye çevirir."""
    h = len(px)
    w = len(px[0])
    raw = b"".join(b"\x00" + b"".join(struct.pack("4B", *px[y][x]) for x in range(w)) for y in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    print(f"wrote {path}  {w}x{h}")


def inside(cx: float, cy: float, r: float, x: int, y: int) -> bool:
    """Yumuşak kenarlı daire içi mi? (anti-alias için 1px geçiş)"""
    d = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
    return d <= r


def trefoil(cx: float, cy: float, scale: float, x: int, y: int) -> bool:
    """Üç yapağı: merkezin etrafında 120° aralıklı üç daire birleşimi."""
    import math

    petal_r = 0.075 * scale
    offset = 0.062 * scale
    for k in range(3):
        a = math.radians(-90 + 120 * k)
        if inside(cx + offset * math.cos(a), cy + offset * math.sin(a), petal_r, x, y):
            return True
    return False


def build(mode: str) -> list[list[tuple[int, int, int, int]]]:
    c = SIZE / 2.0
    px: list[list[tuple[int, int, int, int]]] = []
    for y in range(SIZE):
        t = y / (SIZE - 1)
        bg = tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))
        row = []
        for x in range(SIZE):
            if mode == "mono":
                # Temalı ikon: tek renk silüet (beyaz), şeffaf zemin.
                row.append(WHITE if trefoil(c, c, SIZE, x, y) else TRANSPARENT)
                continue

            disc = inside(c, c, 0.235 * SIZE if mode == "fg" else 0.30 * SIZE, x, y)
            leaf = trefoil(c, c, SIZE, x, y)
            if mode == "fg":
                # Adaptive ön katman: şeffaf zemin + disk + yapraklar mor.
                row.append((BOTTOM[0], BOTTOM[1], BOTTOM[2], 255) if leaf else (WHITE if disc else TRANSPARENT))
            else:
                # Legacy: gradyan zemin + beyaz disk + mor yapraklar.
                row.append((BOTTOM[0], BOTTOM[1], BOTTOM[2], 255) if leaf else (WHITE if disc else bg + (255,)))
        px.append(row)
    return px


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_png(OUT / "app_icon.png", build("legacy"))
    write_png(OUT / "app_icon_foreground.png", build("fg"))
    write_png(OUT / "app_icon_monochrome.png", build("mono"))


if __name__ == "__main__":
    main()
