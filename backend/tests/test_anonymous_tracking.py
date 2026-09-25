import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.models.grievance import District, Department, Category
from app.models.complaint import Complaint, ComplaintStatus

@pytest.mark.asyncio
async def test_anonymous_submission_and_tracking(client: AsyncClient, db_session):
    dist = District(code="BHO", name_en="Bhopal", name_hi="भोपाल", is_active=True)
    dept = Department(code="MPPKVVCL", name_en="Discom", name_hi="विद्युत", is_active=True)
    cat = Category(code="POWER", name_en="Power Cut", name_hi="बिजली", default_sla_hours=24.0, is_active=True)
    db_session.add_all([dist, dept, cat])
    await db_session.commit()

    # 1. Submit anonymous complaint
    sub_resp = await client.post("/api/v1/complaints/submit-anonymous", json={
        "subject": "Transformer Burst",
        "description": "Transformer caught fire near colony gate",
        "district_code": "BHO",
        "location_address": "Arera Colony",
        "category_id": cat.id,
        "priority": "HIGH"
    })
    assert sub_resp.status_code == 201
    data = sub_resp.json()
    assert "complaint_no" in data
    assert "tracking_code" in data
    assert "anonymous_access_token" in data

    complaint_no = data["complaint_no"]
    tracking_code = data["tracking_code"]

    # 2. Track complaint using valid credentials
    track_resp = await client.post("/api/v1/complaints/track-anonymous", json={
        "complaint_no": complaint_no,
        "tracking_code": tracking_code
    })
    assert track_resp.status_code == 200
    track_data = track_resp.json()
    assert "access_token" in track_data

    # 3. Track complaint using invalid credentials -> must fail with 404
    invalid_resp = await client.post("/api/v1/complaints/track-anonymous", json={
        "complaint_no": complaint_no,
        "tracking_code": "WRONG_CODE"
    })
    assert invalid_resp.status_code == 404
