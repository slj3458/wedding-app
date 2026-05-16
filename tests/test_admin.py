ADMIN_PASSWORD = "gk26"


async def _login(client, password=ADMIN_PASSWORD):
    return await client.post("/api/admin/login", json={"password": password})


async def test_login_correct_password(client):
    r = await _login(client)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "token" in data


async def test_login_wrong_password(client):
    r = await _login(client, "wrongpassword")
    assert r.status_code == 401


async def test_logout_invalidates_token(client):
    token = (await _login(client)).json()["token"]
    r = await client.post(
        "/api/admin/logout", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200
    assert r.json()["success"] is True

    # Token must now be invalid
    r = await client.post(
        "/api/admin/action",
        json={"item_id": 1, "item_type": "guestbook", "action": "delete"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 401


async def test_action_requires_auth(client):
    r = await client.post(
        "/api/admin/action",
        json={"item_id": 1, "item_type": "guestbook", "action": "delete"},
    )
    assert r.status_code == 401


async def test_invalid_token_rejected(client):
    r = await client.post(
        "/api/admin/action",
        json={"item_id": 1, "item_type": "guestbook", "action": "delete"},
        headers={"Authorization": "Bearer notavalidtoken"},
    )
    assert r.status_code == 401


async def test_hide_guestbook_entry(client):
    entry_id = (
        await client.post(
            "/api/guestbook/entry", json={"name": "Alice", "message": "Hello!"}
        )
    ).json()["id"]
    token = (await _login(client)).json()["token"]

    r = await client.post(
        "/api/admin/action",
        json={"item_id": entry_id, "item_type": "guestbook", "action": "hide"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True

    entries = (await client.get("/api/guestbook/entries")).json()["entries"]
    assert all(e["id"] != entry_id for e in entries)
