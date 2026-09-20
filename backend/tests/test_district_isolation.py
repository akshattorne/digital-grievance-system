import pytest
from httpx import AsyncClient
from seed import seed_data

@pytest.mark.asyncio
async def test_district_isolation_enforcement(client: AsyncClient, db_session):
    # Seed data directly into test session
    await seed_data(db_session)

    # Login as Indore District Admin
    admin_resp = await client.post("/api/v1/auth/login", json={
        "email": "admin.indore@mp.gov.in",
        "password": "Admin@123"
    })
    assert admin_resp.status_code == 200
    token = admin_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch district complaints - should ONLY return Indore (IND) complaints
    res = await client.get("/api/v1/district-admin/complaints", headers=headers)
    assert res.status_code == 200
    complaints = res.json()
    assert len(complaints) > 0
    for c in complaints:
        assert c["district_code"] == "IND"
