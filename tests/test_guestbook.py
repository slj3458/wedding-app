async def test_post_entry(client):
    r = await client.post(
        "/api/guestbook/entry",
        json={"name": "Bob", "message": "Congratulations!"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Bob"
    assert body["message"] == "Congratulations!"
    assert "id" in body
    assert "created_at" in body


async def test_list_entries_empty(client):
    r = await client.get("/api/guestbook/entries")
    assert r.status_code == 200
    data = r.json()
    assert data["entries"] == []
    assert data["total"] == 0


async def test_list_entries_after_post(client):
    await client.post(
        "/api/guestbook/entry",
        json={"name": "Carol", "message": "Best wishes!"},
    )
    r = await client.get("/api/guestbook/entries")
    data = r.json()
    assert data["total"] == 1
    assert data["entries"][0]["name"] == "Carol"
    assert data["entries"][0]["message"] == "Best wishes!"


async def test_missing_name_returns_422(client):
    r = await client.post("/api/guestbook/entry", json={"message": "No name"})
    assert r.status_code == 422


async def test_missing_message_returns_422(client):
    r = await client.post("/api/guestbook/entry", json={"name": "Eve"})
    assert r.status_code == 422
