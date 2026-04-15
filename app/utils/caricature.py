"""Cartoonify pipeline for the caricature booth.

Tuneable constants live at the top of this module so they can be adjusted
quickly at the venue without hunting through the function body.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

MAX_DIM = 1280

BILATERAL_D = 9
BILATERAL_SIGMA_COLOR = 75
BILATERAL_SIGMA_SPACE = 75
BILATERAL_PASSES = 2

EDGE_MEDIAN_KSIZE = 7
EDGE_BLOCK_SIZE = 9
EDGE_C = 2

STYLIZATION_SIGMA_S = 60
STYLIZATION_SIGMA_R = 0.45

OUTPUT_QUALITY = 90


def _downscale(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    longest = max(h, w)
    if longest <= MAX_DIM:
        return img
    scale = MAX_DIM / longest
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def stylize(src: Path, dst: Path) -> None:
    """Read src, apply cartoon pipeline, write JPEG to dst."""
    img = cv2.imdecode(np.fromfile(str(src), dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Could not decode image at {src}")

    img = _downscale(img)

    smooth = img
    for _ in range(BILATERAL_PASSES):
        smooth = cv2.bilateralFilter(
            smooth, BILATERAL_D, BILATERAL_SIGMA_COLOR, BILATERAL_SIGMA_SPACE
        )

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, EDGE_MEDIAN_KSIZE)
    edges = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        EDGE_BLOCK_SIZE,
        EDGE_C,
    )

    stylized = cv2.stylization(
        smooth, sigma_s=STYLIZATION_SIGMA_S, sigma_r=STYLIZATION_SIGMA_R
    )

    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    cartoon = cv2.bitwise_and(stylized, edges_bgr)

    rgb = cv2.cvtColor(cartoon, cv2.COLOR_BGR2RGB)
    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb).save(dst, "JPEG", quality=OUTPUT_QUALITY, optimize=True)
