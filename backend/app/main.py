from datetime import datetime, timezone
import json
import os
import socket
import uuid
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import (
    init_db,
    get_session,
    TEAM_MEMBERS,
    DEFAULT_ATTENDEES,
    build_default_themes,
    get_sprint_dates,
    SPRINT_ORDER,
)
from app.models import (
    JiraConfig,
    RetroSessionModel,
    SprintPlanningModel,
    TeamModel,
)
from app.services.jira_service import JiraHybridService

app = FastAPI(
    title="Scrum Ceremonies Copilot (Retro & Planning)",
    version="3.0.0",
    description="Diseño minimalista: Retrospectiva con Pulso del Equipo y Sprint Planning por Cards de Temas",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/network-info")
def get_network_info():
    ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"
    return {
        "lan_ip": ip,
        "port": 8000,
        "live_url_base": f"http://{ip}:8000",
    }


# --- Payloads ---
class ConfigUpdatePayload(BaseModel):
    mode: str
    base_url: Optional[str] = None
    email: Optional[str] = None
    api_token: Optional[str] = None
    project_key: Optional[str] = "HJJ"
    default_board_id: Optional[str] = "HJJ"
    ai_provider: Optional[str] = "local"
    ai_api_key: Optional[str] = None
    eazybi_url: Optional[str] = None


class CreateRetroPayload(BaseModel):
    sprint_code: str
    start_date: str
    end_date: str
    meeting_date: str


class UpdateRetroPayload(BaseModel):
    attendees: Optional[List[Dict[str, Any]]] = None
    pulse_items: Optional[List[Dict[str, Any]]] = None
    pulse_ratings: Optional[List[Dict[str, Any]]] = None
    pulse_ai_summary: Optional[str] = None
    notes: Optional[List[str]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    sp_breakdown: Optional[List[Dict[str, Any]]] = None
    sprint_completion_pct: Optional[float] = None


class LivePulseNoteItem(BaseModel):
    type: str = "wind"
    text: str


class LivePulseSubmitPayload(BaseModel):
    author: str
    ratings: Optional[Dict[str, int]] = None
    notes: List[LivePulseNoteItem] = []


class UpdatePlanningPayload(BaseModel):
    vacations: Optional[Dict[str, int]] = None
    themes: Optional[List[Dict[str, Any]]] = None
    historical_velocity: Optional[int] = None


def _sprint_sort_key(code: str) -> int:
    try:
        return SPRINT_ORDER.index(code)
    except ValueError:
        return 999


def get_or_create_default_team(session: Optional[Session] = None) -> Optional[TeamModel]:
    if not session:
        return None
    team = session.exec(select(TeamModel).where(TeamModel.is_active == True)).first()
    if not team:
        team = session.exec(select(TeamModel)).first()
        if team:
            team.is_active = True
            session.add(team)
            session.commit()
            session.refresh(team)
            return team
    if not team:
        initial_members = [
            {"name": "Jackie", "netid": "3gebsx", "email": "3gebsx@aptiv.com"},
            {"name": "Franco", "netid": "3lys5n", "email": "3lys5n@aptiv.com"},
            {"name": "Cotera", "netid": "hzlrl1", "email": "hzlrl1@aptiv.com"},
            {"name": "Gerardo", "netid": "09dini", "email": "09dini@aptiv.com"},
            {"name": "Samantha", "netid": "ckqcxp", "email": "ckqcxp@aptiv.com"},
            {"name": "Maria Paula", "netid": "", "email": "maria.paula@aptiv.com"},
        ]
        team = TeamModel(name="Core Team", is_active=True, members_json=json.dumps(initial_members))
        session.add(team)
        session.commit()
        session.refresh(team)
    return team


def get_current_team_members(session: Optional[Session] = None) -> List[Dict[str, str]]:
    if session:
        try:
            team = get_or_create_default_team(session)
            if team:
                members = json.loads(team.members_json or "[]")
                if members:
                    for m in members:
                        if not m.get("email"):
                            nid = m.get("netid", "").strip()
                            m["email"] = f"{nid}@aptiv.com" if nid else f"{m.get('name', '').lower().replace(' ', '.')}@aptiv.com"
                    return members
        except Exception:
            pass
    return [{"name": m, "netid": "", "email": f"{m.lower().replace(' ', '.')}@aptiv.com"} for m in TEAM_MEMBERS]


def _serialize_retro_with_carryover(
    target: RetroSessionModel, all_sessions: List[RetroSessionModel], session: Optional[Session] = None
) -> Dict[str, Any]:
    own_tasks: List[Dict[str, Any]] = json.loads(target.tasks_json or "[]")
    own_ids = {t.get("id") for t in own_tasks}
    target_idx = _sprint_sort_key(target.sprint_code)

    # Find unchecked tasks from earlier sessions to carry over automatically!
    carried_tasks: List[Dict[str, Any]] = []
    for s in sorted(all_sessions, key=lambda x: _sprint_sort_key(x.sprint_code)):
        if _sprint_sort_key(s.sprint_code) < target_idx:
            prev_tasks = json.loads(s.tasks_json or "[]")
            for pt in prev_tasks:
                if not pt.get("done", False) and pt.get("id") not in own_ids:
                    carried_tasks.append(
                        {
                            **pt,
                            "carried_from_sprint": s.sprint_code,
                        }
                    )

    pulse_ratings = []
    try:
        pulse_ratings = json.loads(getattr(target, "pulse_ratings_json", None) or "[]")
    except Exception:
        pulse_ratings = []

    team_members_data = get_current_team_members(session)
    team_member_names = [m.get("name") for m in team_members_data if m.get("name")] or TEAM_MEMBERS

    return {
        "id": target.id,
        "sprint_code": target.sprint_code,
        "sprint_name": target.sprint_name,
        "start_date": target.start_date,
        "end_date": target.end_date,
        "meeting_date": target.meeting_date,
        "jira_dashboard_url": target.jira_dashboard_url,
        "sprint_completion_pct": target.sprint_completion_pct,
        "velocity_achieved": target.velocity_achieved,
        "avg_velocity": target.avg_velocity,
        "sp_breakdown": json.loads(target.sp_breakdown_json or "[]"),
        "attendees": json.loads(target.attendees_json or "[]"),
        "pulse_items": json.loads(target.pulse_items_json or "[]"),
        "pulse_ratings": pulse_ratings,
        "pulse_ai_summary": target.pulse_ai_summary,
        "notes": json.loads(target.notes_json or "[]"),
        "tasks": carried_tasks + own_tasks,
        "team_members": team_member_names,
        "team_members_detail": team_members_data,
    }


def _serialize_planning(plan: SprintPlanningModel, session: Optional[Session] = None) -> Dict[str, Any]:
    vacations: Dict[str, int] = json.loads(plan.vacations_json or "{}")
    themes: List[Dict[str, Any]] = json.loads(plan.themes_json or "[]")
    created_tickets: List[Dict[str, Any]] = json.loads(plan.created_tickets_json or "[]")

    available_after_triage = plan.base_sp_per_person - plan.triage_deduction_sp  # 20 - 10 = 10 SP

    person_summary = []
    total_team_available = 0
    total_team_planned = 0

    team_members_data = get_current_team_members(session)
    team_member_names = [m.get("name") for m in team_members_data if m.get("name")] or TEAM_MEMBERS

    for member in team_member_names:
        vac_days = int(vacations.get(member, 0))
        vac_sp_deduction = vac_days * 2  # 1 día hábil = 2 SP
        max_sp = max(0, available_after_triage - vac_sp_deduction)
        planned_sp = 0
        member_themes = []

        for th in themes:
            if th.get("active", True) and member in th.get("assignees", []):
                sp_val = int(th.get("sp_per_person", 3))
                planned_sp += sp_val
                member_themes.append(th.get("title", ""))

        total_team_available += max_sp
        total_team_planned += planned_sp

        person_summary.append(
            {
                "name": member,
                "vacation_days": vac_days,
                "max_sp": max_sp,
                "planned_sp": planned_sp,
                "overloaded": planned_sp > max_sp,
                "themes": member_themes,
            }
        )

    return {
        "id": plan.id,
        "sprint_code": plan.sprint_code,
        "sprint_name": plan.sprint_name,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "state": plan.state,
        "base_sp_per_person": plan.base_sp_per_person,
        "triage_deduction_sp": plan.triage_deduction_sp,
        "net_sp_per_person": available_after_triage,
        "historical_velocity": plan.historical_velocity,
        "total_team_available_sp": total_team_available,
        "total_team_planned_sp": total_team_planned,
        "vacations": vacations,
        "themes": themes,
        "person_summary": person_summary,
        "created_tickets": created_tickets,
        "team_members": team_member_names,
        "team_members_detail": team_members_data,
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "3.0.0"}


@app.get("/api/config")
def get_config(session: Session = Depends(get_session)):
    return session.exec(select(JiraConfig)).first()


@app.put("/api/config")
def update_config(payload: ConfigUpdatePayload, session: Session = Depends(get_session)):
    config = session.exec(select(JiraConfig)).first()
    if not config:
        config = JiraConfig()
        session.add(config)

    config.mode = payload.mode
    if payload.base_url is not None:
        config.base_url = payload.base_url
    if payload.email is not None:
        config.email = payload.email
    if payload.api_token is not None:
        config.api_token = payload.api_token
    if payload.project_key is not None:
        config.project_key = payload.project_key
    if payload.default_board_id is not None:
        config.default_board_id = payload.default_board_id
    if payload.ai_provider is not None:
        config.ai_provider = payload.ai_provider
    if payload.ai_api_key is not None:
        config.ai_api_key = payload.ai_api_key
    if payload.eazybi_url is not None:
        config.eazybi_url = payload.eazybi_url
    config.updated_at = datetime.now(timezone.utc)

    session.add(config)
    session.commit()
    session.refresh(config)
    return config


@app.post("/api/config/test-jira")
async def test_jira_connection(
    payload: ConfigUpdatePayload, session: Session = Depends(get_session)
):
    service = JiraHybridService(session)
    cfg = service.config
    base_url = (payload.base_url or cfg.base_url or "https://jiraprod.aptiv.com").strip()
    email = (payload.email or cfg.email or "").strip()
    api_token = (payload.api_token or cfg.api_token or "").strip()
    return await service.test_connection(
        base_url=base_url,
        email=email,
        api_token=api_token,
    )


@app.get("/api/jira/projects")
async def get_jira_projects(session: Session = Depends(get_session)):
    service = JiraHybridService(session)
    return await service.get_projects()


@app.get("/api/jira/boards")
async def get_jira_boards(
    project_key: Optional[str] = None, session: Session = Depends(get_session)
):
    service = JiraHybridService(session)
    return await service.get_boards(project_key)


# =====================================================================
# 1. RETROSPECTIVE ENDPOINTS (TABS, PULSE, NOTES, AUTO-CARRYOVER TASKS)
# =====================================================================
@app.get("/api/retro/sessions")
def list_retro_sessions(session: Session = Depends(get_session)):
    all_sessions = sorted(
        session.exec(select(RetroSessionModel)).all(),
        key=lambda s: _sprint_sort_key(s.sprint_code),
    )
    return [_serialize_retro_with_carryover(s, all_sessions, session) for s in all_sessions]


@app.post("/api/retro/sessions")
def create_retro_session(payload: CreateRetroPayload, session: Session = Depends(get_session)):
    s_dt, e_dt = get_sprint_dates(payload.sprint_code)
    plan = session.exec(
        select(SprintPlanningModel).where(SprintPlanningModel.sprint_code == payload.sprint_code)
    ).first()

    hjj_sp = 27
    hao_sp = 9
    if plan:
        themes = json.loads(plan.themes_json or "[]")
        calc_hjj = 0
        calc_hao = 0
        for th in themes:
            if th.get("active", True):
                sp_total = int(th.get("sp_per_person", 3)) * len(th.get("assignees", []))
                if th.get("board") == "HAO":
                    calc_hao += sp_total
                else:
                    calc_hjj += sp_total
        if calc_hjj + calc_hao > 0:
            hjj_sp = calc_hjj
            hao_sp = calc_hao

    existing = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == payload.sprint_code)
    ).first()
    if existing:
        existing.velocity_achieved = hjj_sp + hao_sp
        existing.sp_breakdown_json = json.dumps(
            [
                {"board": "HJJ", "completed_sp": hjj_sp, "shifted_sp": 0},
                {"board": "HAO", "completed_sp": hao_sp, "shifted_sp": 0},
            ]
        )
        session.add(existing)
        session.commit()
        session.refresh(existing)
        all_s = sorted(
            session.exec(select(RetroSessionModel)).all(),
            key=lambda s: _sprint_sort_key(s.sprint_code),
        )
        return _serialize_retro_with_carryover(existing, all_s, session)

    new_retro = RetroSessionModel(
        sprint_code=payload.sprint_code,
        sprint_name=f"Sprint {payload.sprint_code}",
        start_date=payload.start_date or s_dt,
        end_date=payload.end_date or e_dt,
        meeting_date=payload.meeting_date or e_dt,
        sprint_completion_pct=100.0,
        velocity_achieved=hjj_sp + hao_sp,
        avg_velocity=58,
        sp_breakdown_json=json.dumps(
            [
                {"board": "HJJ", "completed_sp": hjj_sp, "shifted_sp": 0},
                {"board": "HAO", "completed_sp": hao_sp, "shifted_sp": 0},
            ]
        ),
        attendees_json=json.dumps(
            [{"name": m.get("name"), "initials": "".join([part[0] for part in m.get("name", "").split() if part][:2]).upper(), "present": True, "color": "#2b5b8c"} for m in get_current_team_members(session)]
            or DEFAULT_ATTENDEES
        ),
        pulse_items_json=json.dumps([]),
        pulse_ratings_json=json.dumps([]),
        pulse_ai_summary="Add items in Team Pulse and click 'AI Pulse Analysis' to generate a morale summary.",
        notes_json=json.dumps([f"{payload.sprint_code} review"]),
        tasks_json=json.dumps([]),
    )
    session.add(new_retro)
    session.commit()
    session.refresh(new_retro)
    all_s = sorted(
        session.exec(select(RetroSessionModel)).all(),
        key=lambda s: _sprint_sort_key(s.sprint_code),
    )
    return _serialize_retro_with_carryover(new_retro, all_s, session)


@app.patch("/api/retro/sessions/{sprint_code}")
def update_retro_session(
    sprint_code: str, payload: UpdateRetroPayload, session: Session = Depends(get_session)
):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective not found")

    all_sessions = session.exec(select(RetroSessionModel)).all()

    if payload.attendees is not None:
        target.attendees_json = json.dumps(payload.attendees)
    if payload.pulse_items is not None:
        target.pulse_items_json = json.dumps(payload.pulse_items)
    if payload.pulse_ratings is not None:
        target.pulse_ratings_json = json.dumps(payload.pulse_ratings)
    if payload.pulse_ai_summary is not None:
        target.pulse_ai_summary = payload.pulse_ai_summary
    if payload.notes is not None:
        target.notes_json = json.dumps(payload.notes)
    if payload.sp_breakdown is not None:
        target.sp_breakdown_json = json.dumps(payload.sp_breakdown)
    if payload.sprint_completion_pct is not None:
        target.sprint_completion_pct = payload.sprint_completion_pct

    if payload.tasks is not None:
        # Separate carried-over tasks from this sprint's own tasks so updates persist cleanly!
        own_tasks = []
        for t in payload.tasks:
            origin = t.get("carried_from_sprint")
            if origin and origin != sprint_code:
                # Update in the origin sprint!
                origin_session = next(
                    (s for s in all_sessions if s.sprint_code == origin), None
                )
                if origin_session:
                    orig_list = json.loads(origin_session.tasks_json or "[]")
                    for ot in orig_list:
                        if ot.get("id") == t.get("id"):
                            ot["done"] = t.get("done", False)
                            ot["assignee"] = t.get("assignee", ot.get("assignee"))
                    origin_session.tasks_json = json.dumps(orig_list)
                    session.add(origin_session)
            else:
                own_tasks.append(t)
        target.tasks_json = json.dumps(own_tasks)

    session.add(target)
    session.commit()
    session.refresh(target)
    all_sessions = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_sessions, session)


@app.post("/api/retro/sessions/{sprint_code}/live-submit")
def submit_live_pulse(
    sprint_code: str, payload: LivePulseSubmitPayload, session: Session = Depends(get_session)
):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective not found")

    pulse_items: List[Dict[str, Any]] = json.loads(target.pulse_items_json or "[]")
    pulse_ratings: List[Dict[str, Any]] = json.loads(getattr(target, "pulse_ratings_json", None) or "[]")

    author_name = payload.author.strip() if payload.author and payload.author.strip() else "Anonymous 🕵️"

    # Add notes
    for n in payload.notes:
        text = n.text.strip()
        if text:
            q_type = n.type if n.type in ("wind", "anchor", "rocks", "island", "logro", "blocker", "concern", "aprendizaje") else "wind"
            pulse_items.append(
                {
                    "id": f"p-{int(datetime.now(timezone.utc).timestamp()*1000)}-{uuid.uuid4().hex[:4]}",
                    "type": q_type,
                    "text": text,
                    "author": author_name,
                    "votes": 0,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )

    # Add or update ratings
    if payload.ratings:
        rating_obj = {
            "author": author_name,
            "moral": max(1, min(5, int(payload.ratings.get("moral", 4)))),
            "confianza": max(1, min(5, int(payload.ratings.get("confianza", 4)))),
            "claridad": max(1, min(5, int(payload.ratings.get("claridad", 4)))),
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }
        if author_name not in ("Anonymous 🕵️", "Anonymous", "Anónimo 🕵️", "Anónimo", "Anonimo"):
            found = False
            for idx, r in enumerate(pulse_ratings):
                if r.get("author") == author_name:
                    pulse_ratings[idx] = rating_obj
                    found = True
                    break
            if not found:
                pulse_ratings.append(rating_obj)
        else:
            pulse_ratings.append(rating_obj)

    target.pulse_items_json = json.dumps(pulse_items)
    target.pulse_ratings_json = json.dumps(pulse_ratings)
    session.add(target)
    session.commit()
    session.refresh(target)
    all_s = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_s, session)


@app.post("/api/retro/sessions/{sprint_code}/pulse/{item_id}/vote")
def vote_pulse_item(
    sprint_code: str, item_id: str, session: Session = Depends(get_session)
):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective not found")

    pulse_items: List[Dict[str, Any]] = json.loads(target.pulse_items_json or "[]")
    found = False
    for item in pulse_items:
        if item.get("id") == item_id:
            item["votes"] = int(item.get("votes", 0)) + 1
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Pulse item not found")

    target.pulse_items_json = json.dumps(pulse_items)
    session.add(target)
    session.commit()
    session.refresh(target)
    all_s = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_s, session)


@app.delete("/api/retro/sessions/{sprint_code}/pulse/{item_id}")
def delete_pulse_item(
    sprint_code: str, item_id: str, session: Session = Depends(get_session)
):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective not found")

    pulse_items: List[Dict[str, Any]] = json.loads(target.pulse_items_json or "[]")
    pulse_items = [it for it in pulse_items if it.get("id") != item_id]
    target.pulse_items_json = json.dumps(pulse_items)
    session.add(target)
    session.commit()
    session.refresh(target)
    all_s = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_s, session)


@app.post("/api/retro/sessions/{sprint_code}/ai-pulse")
def generate_ai_pulse_summary(sprint_code: str, session: Session = Depends(get_session)):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective not found")

    pulse_items: List[Dict[str, Any]] = json.loads(target.pulse_items_json or "[]")
    pulse_ratings: List[Dict[str, Any]] = json.loads(getattr(target, "pulse_ratings_json", None) or "[]")

    velas = [p["text"] for p in pulse_items if p.get("type") in ("wind", "logro")]
    anclas = [p["text"] for p in pulse_items if p.get("type") in ("anchor", "blocker")]
    rocas = [p["text"] for p in pulse_items if p.get("type") in ("rocks", "concern")]
    islas = [p["text"] for p in pulse_items if p.get("type") in ("island", "aprendizaje")]

    avg_moral = round(sum(r.get("moral", 4) for r in pulse_ratings) / len(pulse_ratings), 1) if pulse_ratings else None
    avg_conf = round(sum(r.get("confianza", 4) for r in pulse_ratings) / len(pulse_ratings), 1) if pulse_ratings else None
    avg_clar = round(sum(r.get("claridad", 4) for r in pulse_ratings) / len(pulse_ratings), 1) if pulse_ratings else None

    score = max(45, min(98, 80 + len(velas) * 6 + len(islas) * 3 - len(anclas) * 8 - len(rocas) * 5))
    mood_label = "Positive & Energized" if score >= 75 else "Steady with Challenges" if score >= 60 else "High Friction & Bottlenecks"

    parts = [f"Agile Sailboat: {mood_label} ({score}/100)."]
    if avg_moral is not None:
        parts.append(f"Thermometer: Morale {avg_moral}/5, Trust {avg_conf}/5, Clarity {avg_clar}/5.")
    if velas:
        parts.append(f"💨 Wind: {len(velas)} propeller(s) recorded ({velas[0][:60]}).")
    if anclas or rocas:
        parts.append(
            f"⚓ Drags & Risks: {len(anclas)} anchor(s) and {len(rocas)} rock(s) identified for action items."
        )
    if islas:
        parts.append(f"🏝️ Goal: {islas[0][:70]}.")

    target.pulse_ai_summary = " ".join(parts)
    session.add(target)
    session.commit()
    session.refresh(target)
    all_s = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_s, session)


@app.post("/api/retro/sessions/{sprint_code}/ai-tasks")
def generate_ai_tasks_from_notes(sprint_code: str, session: Session = Depends(get_session)):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective not found")

    notes: List[str] = json.loads(target.notes_json or "[]")
    pulse_items: List[Dict[str, Any]] = json.loads(target.pulse_items_json or "[]")
    tasks: List[Dict[str, Any]] = json.loads(target.tasks_json or "[]")
    existing_lower = {t.get("text", "").lower() for t in tasks}

    # Prioritize anchors & rocks sorted by votes descending!
    anchor_candidates = sorted(
        [p for p in pulse_items if p.get("type") in ("anchor", "blocker", "rocks", "concern")],
        key=lambda x: int(x.get("votes", 0)),
        reverse=True,
    )
    candidates = [p["text"] for p in anchor_candidates] + list(notes)

    for note in candidates:
        n_low = note.lower()
        if "eazybi" in n_low or "qlik" in n_low:
            txt = "Plan and create eazyBI Dashboards tickets for Maria Paula, Samantha, and Jackie"
            owner = "Maria Paula"
        elif "resim" in n_low:
            txt = "Create RESIM Package Creation tickets for upcoming releases"
            owner = "Cotera"
        elif "ford" in n_low or "stla" in n_low:
            txt = "Align Ford Activities deliverables and communication matrix"
            owner = "Franco"
        elif "inventory" in n_low or "inventario" in n_low:
            txt = "Review Inventory Project scope for the upcoming Sprint"
            owner = "Jackie"
        elif "triage" in n_low:
            txt = "Monitor Triage load so it stays within 50% of team capacity"
            owner = "Jackie"
        elif "dependencia" in n_low or "dependency" in n_low or "shifting" in n_low or "blocker" in n_low or "freno" in n_low:
            txt = f"Unblock priority bottleneck: {note.strip()[:65]}"
            owner = "Franco"
        elif len(note.strip()) > 10 and "review" not in n_low:
            txt = f"Follow up on: {note.strip()[:65]}"
            owner = "Jackie"
        else:
            continue

        if txt.lower() not in existing_lower:
            tasks.append(
                {
                    "id": f"ai-{int(datetime.now(timezone.utc).timestamp()*1000)}-{len(tasks)}",
                    "text": txt,
                    "done": False,
                    "assignee": owner,
                    "ai_suggested": True,
                }
            )
            existing_lower.add(txt.lower())

    target.tasks_json = json.dumps(tasks)
    session.add(target)
    session.commit()
    session.refresh(target)
    all_s = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_s, session)


# =====================================================================
# 2. SPRINT PLANNING ENDPOINTS (CAPACITY, VACATIONS, THEME CARDS, JIRA)
# =====================================================================
@app.get("/api/planning-list")
def list_planning_sprints(session: Session = Depends(get_session)):
    plans = sorted(
        session.exec(select(SprintPlanningModel)).all(),
        key=lambda p: _sprint_sort_key(p.sprint_code),
    )
    return [
        {
            "sprint_code": p.sprint_code,
            "state": p.state,
            "start_date": p.start_date,
            "end_date": p.end_date,
        }
        for p in plans
    ]


@app.post("/api/planning-next")
def create_next_planning_sprint(session: Session = Depends(get_session)):
    plans = sorted(
        session.exec(select(SprintPlanningModel)).all(),
        key=lambda p: _sprint_sort_key(p.sprint_code),
    )
    if not plans:
        raise HTTPException(status_code=400, detail="No existing sprints found")
    latest = plans[-1]
    idx = _sprint_sort_key(latest.sprint_code)
    if idx + 1 >= len(SPRINT_ORDER):
        raise HTTPException(status_code=400, detail="No more sprints in current year")
    next_code = SPRINT_ORDER[idx + 1]
    s_dt, e_dt = get_sprint_dates(next_code)
    active_m = [m.get("name") for m in get_current_team_members(session)] or TEAM_MEMBERS
    new_plan = SprintPlanningModel(
        sprint_code=next_code,
        sprint_name=f"Sprint {next_code}",
        start_date=s_dt,
        end_date=e_dt,
        state="planning",
        base_sp_per_person=20,
        triage_deduction_sp=10,
        historical_velocity=58,
        vacations_json=json.dumps({m: 0 for m in active_m}),
        themes_json=json.dumps(build_default_themes()),
        created_tickets_json=json.dumps([]),
    )
    session.add(new_plan)
    session.commit()
    session.refresh(new_plan)
    return _serialize_planning(new_plan, session)


@app.get("/api/planning/{sprint_code}")
def get_sprint_planning(sprint_code: str, session: Session = Depends(get_session)):
    plan = session.exec(
        select(SprintPlanningModel).where(SprintPlanningModel.sprint_code == sprint_code)
    ).first()
    if not plan:
        s_dt, e_dt = get_sprint_dates(sprint_code)
        plan = SprintPlanningModel(
            sprint_code=sprint_code,
            sprint_name=f"Sprint {sprint_code}",
            start_date=s_dt,
            end_date=e_dt,
            vacations_json=json.dumps({m: 0 for m in TEAM_MEMBERS}),
            themes_json=json.dumps(build_default_themes()),
            created_tickets_json=json.dumps([]),
        )
        session.add(plan)
        session.commit()
        session.refresh(plan)
    return _serialize_planning(plan, session)


@app.patch("/api/planning/{sprint_code}")
def update_sprint_planning(
    sprint_code: str, payload: UpdatePlanningPayload, session: Session = Depends(get_session)
):
    plan = session.exec(
        select(SprintPlanningModel).where(SprintPlanningModel.sprint_code == sprint_code)
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de Sprint no encontrado")

    if payload.vacations is not None:
        plan.vacations_json = json.dumps(payload.vacations)
    if payload.themes is not None:
        plan.themes_json = json.dumps(payload.themes)
    if payload.historical_velocity is not None:
        plan.historical_velocity = payload.historical_velocity

    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _serialize_planning(plan, session)


@app.post("/api/planning/{sprint_code}/reset-themes")
def reset_default_themes(sprint_code: str, session: Session = Depends(get_session)):
    plan = session.exec(
        select(SprintPlanningModel).where(SprintPlanningModel.sprint_code == sprint_code)
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    plan.themes_json = json.dumps(build_default_themes())
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _serialize_planning(plan, session)


class CreateTicketsPayload(BaseModel):
    theme_ids: Optional[List[str]] = None


@app.post("/api/planning/{sprint_code}/create-jira-tickets")
async def create_tickets_from_active_themes(
    sprint_code: str,
    payload: Optional[CreateTicketsPayload] = None,
    session: Session = Depends(get_session),
):
    """
    Uses the active Themes in Sprint Planning (filtered by payload.theme_ids if provided)
    and creates 1 Jira Ticket per Assignee in each selected Theme with identical
    Description, Acceptance Criteria, ASPICE, Priority, Story Points, and Sprint!
    If Live Mode is enabled with a valid Jira token, creates real issues in Jira!
    """
    plan = session.exec(
        select(SprintPlanningModel).where(SprintPlanningModel.sprint_code == sprint_code)
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    cfg = session.exec(select(JiraConfig)).first()
    is_live = bool(cfg and cfg.mode == "live" and cfg.api_token and cfg.api_token.strip())
    service = JiraHybridService(session) if is_live else None

    themes: List[Dict[str, Any]] = json.loads(plan.themes_json or "[]")
    selected_ids = set(payload.theme_ids) if (payload and payload.theme_ids is not None) else None
    created_tickets: List[Dict[str, Any]] = []
    seq = 501

    for th in themes:
        if not th.get("active", True):
            continue
        if selected_ids is not None and th.get("id") not in selected_ids:
            continue
        board = th.get("board", "HJJ")
        title = th.get("title", "Actividad")
        priority = th.get("priority", "High")
        sp = int(th.get("sp_per_person", 3))
        desc = (th.get("description") or "").strip() or f"Trabajo del Sprint {sprint_code} para {title}."
        ac = (th.get("acceptance_criteria") or "").strip() or f"- Cumplir con los requerimientos y entregables definidos para {title}."
        aspice = (th.get("aspice") or "").strip() or "V/SS-SYS.4"

        team_members_data = get_current_team_members(session)
        member_netid_map = {m.get("name", "").lower(): m.get("netid", "").strip() for m in team_members_data}
        assignees = th.get("assignees") if th.get("assignees") and len(th.get("assignees")) > 0 else [None]

        for person in assignees:
            summary = title
            person_netid = member_netid_map.get(person.lower(), "") if person else None
            desc_full = (
                f"{desc}\n\n"
                f"*Acceptance Criteria:*\n{ac}\n\n"
                f"*ASPICE:* {aspice}\n"
                f"*Sprint:* {sprint_code}"
            )

            key = f"{board}-{seq}"
            url = None
            status_text = "Created in Jira"

            if is_live and service:
                # Attempt to create real issue in Aptiv Jira with all dedicated custom fields
                jira_res = await service.create_jira_issue(
                    project_key=board,
                    summary=summary,
                    description=desc,
                    assignee_name=person,
                    story_points=sp,
                    priority=priority,
                    acceptance_criteria=ac,
                    aspice=aspice,
                    sprint_code=sprint_code,
                    netid=person_netid,
                )
                if jira_res.get("ok"):
                    key = jira_res.get("key", key)
                    url = jira_res.get("url")
                    status_text = "Live in Jira"
                else:
                    status_text = f"Simulated (Jira error: {jira_res.get('error', 'check permissions')[:60]})"

            seq += 1
            created_tickets.append(
                {
                    "key": key,
                    "board": board,
                    "theme": title,
                    "summary": summary,
                    "assignee": person,
                    "priority": priority,
                    "story_points": sp,
                    "sprint": sprint_code,
                    "aspice": aspice,
                    "description": desc,
                    "acceptance_criteria": ac,
                    "status": status_text,
                    "url": url,
                }
            )

    plan.created_tickets_json = json.dumps(created_tickets)
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _serialize_planning(plan, session)


@app.post("/api/planning/{sprint_code}/start-sprint")
async def start_sprint_in_jira(sprint_code: str, session: Session = Depends(get_session)):
    plan = session.exec(
        select(SprintPlanningModel).where(SprintPlanningModel.sprint_code == sprint_code)
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    # If tickets haven't been generated yet, generate them automatically on start!
    existing_tickets = json.loads(plan.created_tickets_json or "[]")
    if not existing_tickets:
        await create_tickets_from_active_themes(sprint_code, None, session)
        session.refresh(plan)

    plan.state = "active"
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _serialize_planning(plan, session)


class TeamMemberPayload(BaseModel):
    name: str
    netid: Optional[str] = ""
    email: Optional[str] = ""


class TeamCreateUpdatePayload(BaseModel):
    name: str
    is_active: Optional[bool] = True
    members: List[TeamMemberPayload] = []


@app.get("/api/teams")
def get_teams(session: Session = Depends(get_session)):
    get_or_create_default_team(session)
    teams = session.exec(select(TeamModel)).all()
    res = []
    for t in teams:
        members = []
        try:
            members = json.loads(t.members_json or "[]")
        except Exception:
            pass
        res.append({
            "id": t.id,
            "name": t.name,
            "is_active": t.is_active,
            "members": members,
        })
    return res


@app.post("/api/teams")
def create_team(payload: TeamCreateUpdatePayload, session: Session = Depends(get_session)):
    if payload.is_active:
        for t in session.exec(select(TeamModel)).all():
            t.is_active = False
            session.add(t)
    team = TeamModel(
        name=payload.name,
        is_active=payload.is_active if payload.is_active is not None else True,
        members_json=json.dumps([m.dict() for m in payload.members]),
    )
    session.add(team)
    session.commit()
    session.refresh(team)
    return {
        "id": team.id,
        "name": team.name,
        "is_active": team.is_active,
        "members": json.loads(team.members_json or "[]"),
    }


@app.put("/api/teams/{team_id}")
def update_team(team_id: int, payload: TeamCreateUpdatePayload, session: Session = Depends(get_session)):
    team = session.exec(select(TeamModel).where(TeamModel.id == team_id)).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if payload.is_active:
        for t in session.exec(select(TeamModel)).all():
            if t.id != team.id:
                t.is_active = False
                session.add(t)
    team.name = payload.name
    if payload.is_active is not None:
        team.is_active = payload.is_active
    team.members_json = json.dumps([m.dict() for m in payload.members])
    session.add(team)
    session.commit()
    session.refresh(team)
    return {
        "id": team.id,
        "name": team.name,
        "is_active": team.is_active,
        "members": json.loads(team.members_json or "[]"),
    }


@app.delete("/api/teams/{team_id}")
def delete_team(team_id: int, session: Session = Depends(get_session)):
    team = session.exec(select(TeamModel).where(TeamModel.id == team_id)).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    teams = session.exec(select(TeamModel)).all()
    if len(teams) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only team")
    session.delete(team)
    session.commit()
    active = session.exec(select(TeamModel).where(TeamModel.is_active == True)).first()
    if not active:
        first = session.exec(select(TeamModel)).first()
        if first:
            first.is_active = True
            session.add(first)
            session.commit()
    return {"ok": True}


@app.post("/api/retro/sessions/{sprint_code}/sync-jira")
async def sync_retro_from_jira(sprint_code: str, session: Session = Depends(get_session)):
    target = session.exec(
        select(RetroSessionModel).where(RetroSessionModel.sprint_code == sprint_code)
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Retrospective session not found")

    cfg = session.exec(select(JiraConfig)).first()
    if cfg and cfg.mode == "live" and cfg.api_token:
        service = JiraHybridService(session)
        sync_res = await service.sync_sprint_metrics(sprint_code)
        if sync_res.get("ok"):
            target.velocity_achieved = sync_res["velocity_achieved"]
            target.sprint_completion_pct = sync_res["sprint_completion_pct"]
            target.sp_breakdown_json = json.dumps(sync_res["sp_breakdown"])
            session.add(target)
            session.commit()
            session.refresh(target)
        else:
            raise HTTPException(
                status_code=502,
                detail=f"Jira sync failed: {sync_res.get('error', 'Unable to fetch board sprint metrics')}",
            )

    all_s = session.exec(select(RetroSessionModel)).all()
    return _serialize_retro_with_carryover(target, all_s, session)



frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)


@app.api_route("/retro-live", methods=["GET", "HEAD"])
def get_retro_live_page():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend dist not found")


if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
