import json
from sqlmodel import SQLModel, Session, create_engine, select
from app.models import (
    JiraConfig,
    RetroSessionModel,
    SprintPlanningModel,
)

import os

DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_FILE_NAME = os.path.join(DB_DIR, "scrum_clean_v3.db")
SQLITE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

TEAM_MEMBERS = [
    "Maria Paula",
    "Samantha",
    "Jackie",
    "Franco",
    "Cotera",
    "Gerardo",
]

DEFAULT_ATTENDEES = [
    {"name": "Maria Paula", "initials": "MP", "present": True, "color": "#10B981"},
    {"name": "Samantha", "initials": "SA", "present": True, "color": "#8B5CF6"},
    {"name": "Jackie", "initials": "JA", "present": True, "color": "#3B82F6"},
    {"name": "Franco", "initials": "FR", "present": True, "color": "#F59E0B"},
    {"name": "Cotera", "initials": "JC", "present": True, "color": "#6366F1"},
    {"name": "Gerardo", "initials": "GD", "present": True, "color": "#EC4899"},
    {"name": "Alan", "initials": "AM", "present": True, "color": "#14B8A6"},
]

SPRINT_ORDER = [
    f"26PI{pi} {sub}"
    for pi in (1, 2, 3, 4)
    for sub in ("S1", "S2", "S3", "S4", "S5", "S6", "DRP")
]

SPRINT_CALENDAR = {
    # 26PI1
    "26PI1 S1": ("01/07/26", "01/21/26"),
    "26PI1 S2": ("01/21/26", "02/04/26"),
    "26PI1 S3": ("02/04/26", "02/18/26"),
    "26PI1 S4": ("02/18/26", "03/04/26"),
    "26PI1 S5": ("03/04/26", "03/18/26"),
    "26PI1 S6": ("03/18/26", "03/25/26"),
    "26PI1 DRP": ("03/25/26", "04/01/26"),
    # 26PI2
    "26PI2 S1": ("04/01/26", "04/15/26"),
    "26PI2 S2": ("04/15/26", "04/29/26"),
    "26PI2 S3": ("04/29/26", "05/13/26"),
    "26PI2 S4": ("05/13/26", "05/27/26"),
    "26PI2 S5": ("05/27/26", "06/10/26"),
    "26PI2 S6": ("06/10/26", "06/17/26"),
    "26PI2 DRP": ("06/17/26", "06/24/26"),
    # 26PI3
    "26PI3 S1": ("06/24/26", "07/08/26"),
    "26PI3 S2": ("07/08/26", "07/22/26"),
    "26PI3 S3": ("07/22/26", "08/05/26"),
    "26PI3 S4": ("08/05/26", "08/19/26"),
    "26PI3 S5": ("08/19/26", "09/02/26"),
    "26PI3 S6": ("09/02/26", "09/09/26"),
    "26PI3 DRP": ("09/09/26", "09/23/26"),
    # 26PI4 (Current Sprint: 26PI4 S1 starts 09/23/26 9:02 AM -> ends 10/07/26 9:02 AM)
    "26PI4 S1": ("09/23/26", "10/07/26"),
    "26PI4 S2": ("10/07/26", "10/21/26"),
    "26PI4 S3": ("10/21/26", "11/04/26"),
    "26PI4 S4": ("11/04/26", "11/18/26"),
    "26PI4 S5": ("11/18/26", "12/02/26"),
    "26PI4 S6": ("12/02/26", "12/16/26"),
    "26PI4 DRP": ("12/16/26", "12/23/26"),
}


def get_sprint_dates(sprint_code: str) -> tuple[str, str]:
    return SPRINT_CALENDAR.get(sprint_code, ("09/23/26", "10/07/26"))


ASPICE_PROCESS_AREAS = [
    "SUP 1: Quality Assurance",
    "SUP 4: Joint Review",
    "SUP 8: Configuration Management",
    "SUP 9: Problem Resolution Management",
    "SUP 10 : Change Request Management",
    "V/SS-SYS.2",
    "V/SS-SYS.3",
    "V/SS-SYS.4",
    "V-SYS 5: Vehicle Verification",
]


def build_default_themes():
    return [
        {
            "id": "theme-eazybi",
            "title": "eazyBI Dashboards",
            "board": "HJJ",
            "priority": "High",
            "sp_per_person": 3,
            "assignees": ["Maria Paula", "Samantha", "Jackie"],
            "active": True,
            "aspice": "V/SS-SYS.4",
            "description": "",
            "acceptance_criteria": "",
        },
        {
            "id": "theme-resim",
            "title": "RESIM Package Creation",
            "board": "HJJ",
            "priority": "High",
            "sp_per_person": 4,
            "assignees": ["Cotera", "Maria Paula", "Gerardo"],
            "active": True,
            "aspice": "V/SS-SYS.4",
            "description": "",
            "acceptance_criteria": "",
        },
        {
            "id": "theme-ford",
            "title": "Ford Activities",
            "board": "HAO",
            "priority": "High",
            "sp_per_person": 3,
            "assignees": ["Franco", "Maria Paula", "Jackie"],
            "active": True,
            "aspice": "V/SS-SYS.4",
            "description": "",
            "acceptance_criteria": "",
        },
        {
            "id": "theme-inventory",
            "title": "Inventory Project",
            "board": "HJJ",
            "priority": "Mid",
            "sp_per_person": 3,
            "assignees": ["Franco", "Jackie"],
            "active": True,
            "aspice": "V/SS-SYS.4",
            "description": "",
            "acceptance_criteria": "",
        },
    ]


def get_session():
    with Session(engine) as session:
        yield session


def init_db():
    SQLModel.metadata.create_all(engine)
    from sqlalchemy import text
    with engine.connect() as conn:
        res = conn.execute(text("PRAGMA table_info(retrosessionmodel)"))
        cols = [r[1] for r in res.fetchall()]
        if "pulse_ratings_json" not in cols:
            conn.execute(text("ALTER TABLE retrosessionmodel ADD COLUMN pulse_ratings_json TEXT DEFAULT '[]'"))
            conn.commit()

        res_cfg = conn.execute(text("PRAGMA table_info(jiraconfig)"))
        cols_cfg = [r[1] for r in res_cfg.fetchall()]
        if "eazybi_url" not in cols_cfg:
            conn.execute(text("ALTER TABLE jiraconfig ADD COLUMN eazybi_url TEXT DEFAULT 'https://jiraprod.aptiv.com/plugins/servlet/eazybi'"))
            conn.commit()

    with Session(engine) as session:
        # 1. Seed JiraConfig
        config = session.exec(select(JiraConfig)).first()
        if not config:
            session.add(
                JiraConfig(
                    mode="demo",
                    base_url="https://stla-ford.atlassian.net",
                    email="jackie@company.com",
                    api_token="",
                    project_key="HJJ",
                    default_board_id="HJJ",
                    ai_provider="local",
                    ai_api_key="",
                )
            )

        # Past sprints up to 26PI3 DRP, plus current sprint 26PI4 S1 in Planning
        idx_pi4_s1 = SPRINT_ORDER.index("26PI4 S1")
        planning_initial_codes = SPRINT_ORDER[: idx_pi4_s1 + 1]  # 26PI1 S1 .. 26PI4 S1
        retro_initial_codes = SPRINT_ORDER[:idx_pi4_s1]  # 26PI1 S1 .. 26PI3 DRP (1 less than planning!)

        # 2. Ensure SprintPlanningModel has all sprints up to 26PI4 S1
        existing_plans = {
            p.sprint_code: p for p in session.exec(select(SprintPlanningModel)).all()
        }
        # Remove any future sprints beyond 26PI4 S1 if accidentally created during testing
        for code, p in list(existing_plans.items()):
            if code not in planning_initial_codes:
                session.delete(p)
                del existing_plans[code]

        default_map = {t["id"]: t for t in build_default_themes()}
        for code in planning_initial_codes:
            s_dt, e_dt = get_sprint_dates(code)
            target_state = "active" if code == "26PI4 S1" else "ended"
            if code not in existing_plans:
                session.add(
                    SprintPlanningModel(
                        sprint_code=code,
                        sprint_name=f"Sprint {code}",
                        start_date=s_dt,
                        end_date=e_dt,
                        state=target_state,
                        base_sp_per_person=20,
                        triage_deduction_sp=10,
                        historical_velocity=58,
                        vacations_json=json.dumps({m: 0 for m in TEAM_MEMBERS}),
                        themes_json=json.dumps(build_default_themes()),
                        created_tickets_json=json.dumps([]),
                    )
                )
            else:
                plan = existing_plans[code]
                plan.start_date = s_dt
                plan.end_date = e_dt
                if code != "26PI4 S1":
                    plan.state = "ended"
                elif plan.state not in ("active", "ended"):
                    plan.state = "active"

                vacs = json.loads(plan.vacations_json or "{}")
                if "Raquel" in vacs:
                    vacs["Jackie"] = vacs.pop("Raquel")
                vacs.pop("Alan", None)
                for m in TEAM_MEMBERS:
                    vacs.setdefault(m, 0)
                plan.vacations_json = json.dumps(vacs)

                themes = json.loads(plan.themes_json or "[]")
                for th in themes:
                    th["assignees"] = [
                        "Jackie" if a == "Raquel" else a
                        for a in th.get("assignees", [])
                        if a != "Alan"
                    ]
                    if th.get("id") == "theme-ford" or th.get("title") in (
                        "Ford Data Delivery",
                        "Ford Activities",
                    ):
                        th["title"] = "Ford Activities"
                        th["board"] = "HAO"
                    elif th.get("id") in (
                        "theme-eazybi",
                        "theme-resim",
                        "theme-inventory",
                    ):
                        th["board"] = "HJJ"
                    if th.get("aspice") not in ASPICE_PROCESS_AREAS:
                        th["aspice"] = "V/SS-SYS.4"
                    if th.get("id") in default_map:
                        th["description"] = default_map[th["id"]]["description"]
                        th["acceptance_criteria"] = default_map[th["id"]][
                            "acceptance_criteria"
                        ]
                prio_order = {"High": 0, "Mid": 1, "Low": 2}
                themes.sort(key=lambda x: prio_order.get(x.get("priority", "Mid"), 1))
                plan.themes_json = json.dumps(themes)
                session.add(plan)

        # 3. Ensure RetroSessionModel has all sprints up to 26PI3 DRP (1 sprint behind Planning!)
        existing_retros = {
            r.sprint_code: r for r in session.exec(select(RetroSessionModel)).all()
        }

        for code in retro_initial_codes:
            s_dt, e_dt = get_sprint_dates(code)
            is_last_retro = code == "26PI3 DRP"
            if code not in existing_retros:
                session.add(
                    RetroSessionModel(
                        sprint_code=code,
                        sprint_name=f"Sprint {code}",
                        start_date=s_dt,
                        end_date=e_dt,
                        meeting_date=e_dt,
                        jira_dashboard_url=f"https://stla-ford.atlassian.net/dashboards/{code.replace(' ', '-')}",
                        sprint_completion_pct=88.8 if is_last_retro else 92.0,
                        velocity_achieved=64 if is_last_retro else 58,
                        avg_velocity=58,
                        sp_breakdown_json=json.dumps(
                            [
                                {"board": "HJJ", "completed_sp": 29, "shifted_sp": 8 if is_last_retro else 2},
                                {"board": "HAO", "completed_sp": 35 if is_last_retro else 29, "shifted_sp": 0},
                            ]
                        ),
                        attendees_json=json.dumps(DEFAULT_ATTENDEES),
                        pulse_items_json=json.dumps(
                            [
                                {"id": f"p-{code}-1", "type": "wind", "text": "Great pace on HAO: achieved 100% of planned SP prior to sprint closing.", "author": "Franco", "votes": 4},
                                {"id": f"p-{code}-2", "type": "wind", "text": "Excellent cross-support on peer testing and technical reviews.", "author": "Maria Paula", "votes": 3},
                                {"id": f"p-{code}-3", "type": "anchor", "text": "External dependency on HJJ delayed 8 SP and required task shifting.", "author": "Jackie", "votes": 7},
                                {"id": f"p-{code}-4", "type": "anchor", "text": "Triage workload during the first 4 days absorbed nearly 50% of capacity.", "author": "Samantha", "votes": 5},
                                {"id": f"p-{code}-5", "type": "rocks", "text": "Potential bottleneck in Ford customer validation during week 2.", "author": "Franco", "votes": 4},
                                {"id": f"p-{code}-6", "type": "island", "text": "Automate RESIM package creation for the upcoming release.", "author": "Cotera", "votes": 5},
                                {"id": f"p-{code}-7", "type": "island", "text": "Standardize Jira Acceptance Criteria template to streamline Planning.", "author": "Jackie", "votes": 2},
                            ]
                            if is_last_retro
                            else [
                                {"id": f"p-{code}-1", "type": "wind", "text": f"Completed key deliverables planned for {code}.", "author": "Team", "votes": 1},
                            ]
                        ),
                        pulse_ratings_json=json.dumps(
                            [
                                {"author": "Maria Paula", "moral": 5, "confianza": 5, "claridad": 4, "submitted_at": "2026-09-30T10:05:00Z"},
                                {"author": "Franco", "moral": 5, "confianza": 4, "claridad": 4, "submitted_at": "2026-09-30T10:07:00Z"},
                                {"author": "Jackie", "moral": 4, "confianza": 5, "claridad": 4, "submitted_at": "2026-09-30T10:08:00Z"},
                                {"author": "Samantha", "moral": 4, "confianza": 4, "claridad": 3, "submitted_at": "2026-09-30T10:09:00Z"},
                            ]
                            if is_last_retro
                            else []
                        ),
                        pulse_ai_summary=(
                            "Agile Sailboat: Positive Morale (85/100). The team felt motivated by the 100% completion on HAO and steady progress on Ford/RESIM deliverables. Main challenges were an external dependency on HJJ (8 SP shifted) and sustained Triage demand."
                            if is_last_retro
                            else f"Steady Morale: Team completed {code} objectives on schedule."
                        ),
                        notes_json=json.dumps(
                            [
                                f"{code} review",
                                "Qlik / eazyBI dashboard activities shifted for next sprint",
                                "It is necessary to start to create RESIM tickets for upcoming releases",
                            ]
                            if is_last_retro
                            else [f"{code} review"]
                        ),
                        tasks_json=json.dumps(
                            [
                                {
                                    "id": "tsk-pi3drp-1",
                                    "text": "Create RESIM Package Creation tickets for upcoming releases",
                                    "done": False,
                                    "assignee": "Cotera",
                                },
                            ]
                            if is_last_retro
                            else []
                        ),
                    )
                )
            else:
                retro = existing_retros[code]
                retro.start_date = s_dt
                retro.end_date = e_dt
                retro.meeting_date = e_dt
                if is_last_retro:
                    if not getattr(retro, "pulse_ratings_json", None) or retro.pulse_ratings_json == "[]":
                        retro.pulse_ratings_json = json.dumps([
                            {"author": "Maria Paula", "moral": 5, "confianza": 5, "claridad": 4, "submitted_at": "2026-09-30T10:05:00Z"},
                            {"author": "Franco", "moral": 5, "confianza": 4, "claridad": 4, "submitted_at": "2026-09-30T10:07:00Z"},
                            {"author": "Jackie", "moral": 4, "confianza": 5, "claridad": 4, "submitted_at": "2026-09-30T10:08:00Z"},
                            {"author": "Samantha", "moral": 4, "confianza": 4, "claridad": 3, "submitted_at": "2026-09-30T10:09:00Z"},
                        ])
                    # Update pulse items if Spanish or old
                    curr_items = json.loads(retro.pulse_items_json or "[]")
                    has_spanish = any("Gran ritmo" in it.get("text", "") or "Dependencia" in it.get("text", "") or "sharath" in it.get("text", "") for it in curr_items)
                    if has_spanish or len(curr_items) <= 4:
                        retro.pulse_items_json = json.dumps([
                            {"id": f"p-{code}-1", "type": "wind", "text": "Great pace on HAO: achieved 100% of planned SP prior to sprint closing.", "author": "Franco", "votes": 4},
                            {"id": f"p-{code}-2", "type": "wind", "text": "Excellent cross-support on peer testing and technical reviews.", "author": "Maria Paula", "votes": 3},
                            {"id": f"p-{code}-3", "type": "anchor", "text": "External dependency on HJJ delayed 8 SP and required task shifting.", "author": "Jackie", "votes": 7},
                            {"id": f"p-{code}-4", "type": "anchor", "text": "Triage workload during the first 4 days absorbed nearly 50% of capacity.", "author": "Samantha", "votes": 5},
                            {"id": f"p-{code}-5", "type": "rocks", "text": "Potential bottleneck in Ford customer validation during week 2.", "author": "Franco", "votes": 4},
                            {"id": f"p-{code}-6", "type": "island", "text": "Automate RESIM package creation for the upcoming release.", "author": "Cotera", "votes": 5},
                            {"id": f"p-{code}-7", "type": "island", "text": "Standardize Jira Acceptance Criteria template to streamline Planning.", "author": "Jackie", "votes": 2},
                        ])
                    if not retro.pulse_ai_summary or "Resumen IA" in retro.pulse_ai_summary or "Frenos" in retro.pulse_ai_summary:
                        retro.pulse_ai_summary = "Agile Sailboat: Positive Morale (85/100). The team felt motivated by the 100% completion on HAO and steady progress on Ford/RESIM deliverables. Main challenges were an external dependency on HJJ (8 SP shifted) and sustained Triage demand."
                session.add(retro)

        session.commit()
