#!/usr/bin/env python3
"""Crop the newest browser window capture down to just the emulated page viewport.

The MCP browser captures the whole window at a HiDPI scale while the emulated
viewport sits in the top-left corner, so we crop that corner and normalise it
back to CSS pixels.
"""
import glob
import os
import sys

from PIL import Image

SHOTS = "/var/folders/t7/zfnzk2c93239h_mvw33t7hq40000gn/T/cursor/screenshots"
CAPTURE_SCALE = 2.0  # window captures come back at 2x device pixels
PAGE_W, PAGE_H = 1440, 900


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/hero.png"
    files = glob.glob(os.path.join(SHOTS, "*.jpeg")) + glob.glob(os.path.join(SHOTS, "*.png"))
    if not files:
        sys.exit("no screenshots found")
    src = max(files, key=os.path.getmtime)

    im = Image.open(src)
    box = (0, 0, round(PAGE_W * CAPTURE_SCALE), round(PAGE_H * CAPTURE_SCALE))
    im.crop(box).resize((PAGE_W, PAGE_H), Image.LANCZOS).save(out)
    print(out)


if __name__ == "__main__":
    main()
