"""Stability AI v2beta SD 3.5 Flash img2img client for the caricature booth.

Tuneable constants live at the top so prompts/strength can be adjusted at the
venue with a single-file restart.
"""
import io
import logging
from pathlib import Path

import httpx
from PIL import Image

from ..config import STABILITY_API_KEY

logger = logging.getLogger(__name__)

STABILITY_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
STABILITY_MODEL = "sd3.5-flash"

CARICATURE_PROMPT = (
    "A hand-drawn caricature, cartoonishly exaggerated features, "
    "with white background."
)
NEGATIVE_PROMPT = (
    "photorealistic, blurry, low quality, distorted anatomy, extra limbs"
)

IMAGE_STRENGTH = 0.75
MAX_INPUT_DIM = 1536
INPUT_JPEG_QUALITY = 92
STABILITY_TIMEOUT = 60.0


def _prepare_input(src: Path) -> bytes:
    """Downscale and re-encode as JPEG so the upload stays within Stability's limits."""
    with Image.open(src) as img:
        img = img.convert("RGB")
        longest = max(img.size)
        if longest > MAX_INPUT_DIM:
            scale = MAX_INPUT_DIM / longest
            new_size = (int(img.size[0] * scale), int(img.size[1] * scale))
            img = img.resize(new_size, Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=INPUT_JPEG_QUALITY, optimize=True)
        return buf.getvalue()


async def stylize_via_stability(src: Path, dst: Path) -> None:
    """Send src to Stability SD 3.5 Flash img2img, write the returned JPEG to dst."""
    if not STABILITY_API_KEY:
        raise RuntimeError("STABILITY_API_KEY is not set")

    image_bytes = _prepare_input(src)

    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Accept": "image/*",
    }
    files = {"image": ("selfie.jpg", image_bytes, "image/jpeg")}
    data = {
        "prompt": CARICATURE_PROMPT,
        "negative_prompt": NEGATIVE_PROMPT,
        "mode": "image-to-image",
        "model": STABILITY_MODEL,
        "strength": str(IMAGE_STRENGTH),
        "output_format": "jpeg",
    }

    async with httpx.AsyncClient(timeout=STABILITY_TIMEOUT) as client:
        response = await client.post(
            STABILITY_ENDPOINT, headers=headers, files=files, data=data
        )

    if response.status_code == 200:
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(response.content)
        logger.info("Stability caricature saved: %s (%d bytes)", dst.name, len(response.content))
        return

    if response.status_code == 402:
        raise RuntimeError("Stability API: insufficient credits")
    if response.status_code == 429:
        raise RuntimeError("Stability API: rate limited, retry shortly")

    raise RuntimeError(
        f"Stability API error {response.status_code}: {response.text}"
    )
