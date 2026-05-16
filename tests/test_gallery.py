import io
from PIL import Image


def _make_jpeg(w=10, h=10) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color=(200, 100, 50)).save(buf, format="JPEG")
    return buf.getvalue()


async def test_upload_valid_image(client):
    r = await client.post(
        "/api/gallery/upload",
        files={"file": ("photo.jpg", _make_jpeg(), "image/jpeg")},
    )
    assert r.status_code == 200
    body = r.json()
    assert "id" in body
    assert body["filename"].endswith(".jpg")


async def test_upload_invalid_extension(client):
    r = await client.post(
        "/api/gallery/upload",
        files={"file": ("doc.txt", b"not an image", "text/plain")},
    )
    assert r.status_code == 400


async def test_upload_oversized(client):
    big = b"x" * (10 * 1024 * 1024 + 1)
    r = await client.post(
        "/api/gallery/upload",
        files={"file": ("big.jpg", big, "image/jpeg")},
    )
    assert r.status_code == 400


async def test_get_photos_empty(client):
    r = await client.get("/api/gallery/photos")
    assert r.status_code == 200
    data = r.json()
    assert data["photos"] == []
    assert data["total"] == 0


async def test_like_increments_count(client):
    photo_id = (
        await client.post(
            "/api/gallery/upload",
            files={"file": ("photo.jpg", _make_jpeg(), "image/jpeg")},
        )
    ).json()["id"]

    r = await client.post(f"/api/gallery/photo/{photo_id}/like")
    assert r.status_code == 200
    assert r.json()["likes"] == 1

    r = await client.post(f"/api/gallery/photo/{photo_id}/like")
    assert r.json()["likes"] == 2


async def test_thumbnail_created_on_upload(client, tmp_path):
    filename = (
        await client.post(
            "/api/gallery/upload",
            files={"file": ("photo.jpg", _make_jpeg(), "image/jpeg")},
        )
    ).json()["filename"]

    thumb = tmp_path / "thumbnails" / f"{filename}.jpg"
    assert thumb.exists()
