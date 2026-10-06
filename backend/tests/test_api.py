from fastapi.testclient import TestClient
from app.main import app


def test_v3_retro_and_theme_planning():
    with TestClient(app) as client:
        r_health = client.get("/api/health")
        assert r_health.status_code == 200
        assert r_health.json()["version"] == "3.0.0"

        # 1. Verify Retro Sessions & Auto Carry-over of unchecked tasks from 26PI1 S3 -> 26PI1 S4
        r_retros = client.get("/api/retro/sessions")
        assert r_retros.status_code == 200
        retros = r_retros.json()
        assert len(retros) >= 2
        s4 = next(r for r in retros if r["sprint_code"] == "26PI1 S4")
        carried = [t for t in s4["tasks"] if t.get("carried_from_sprint") == "26PI1 S3"]
        assert len(carried) >= 1

        # 2. Verify Sprint Planning Theme Cards & 20 SP - 10 SP Triage = 10 SP per person
        r_plan = client.get("/api/planning/26PI1%20S5")
        assert r_plan.status_code == 200
        plan = r_plan.json()
        assert plan["base_sp_per_person"] == 20
        assert plan["triage_deduction_sp"] == 10
        assert plan["net_sp_per_person"] == 10
        assert len(plan["themes"]) >= 4

        # 3. Verify Creating Jira Tickets from Active Themes (1 per assignee in each active theme)
        r_tickets = client.post("/api/planning/26PI1%20S5/create-jira-tickets")
        assert r_tickets.status_code == 200
        updated_plan = r_tickets.json()
        assert len(updated_plan["created_tickets"]) >= 10
