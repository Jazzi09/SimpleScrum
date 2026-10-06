from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class JiraConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    mode: str = Field(default="demo")  # "demo" | "live"
    base_url: Optional[str] = Field(default="https://stla-ford.atlassian.net")
    email: Optional[str] = Field(default="raquel.avila@empresa.com")
    api_token: Optional[str] = Field(default="")
    project_key: str = Field(default="HJJ")
    default_board_id: str = Field(default="HJJ")
    ai_provider: str = Field(default="local")  # "local" | "gemini" | "openai"
    ai_api_key: Optional[str] = Field(default="")
    eazybi_url: Optional[str] = Field(default="https://jiraprod.aptiv.com/plugins/servlet/eazybi")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RetroSessionModel(SQLModel, table=True):
    """
    Clean 1-Sprint-at-a-Time Retrospective Session:
    - Sprint Completion & SP Breakdown (HJJ / HAO)
    - Team Pulse (Logros, Blockers, Concerns, Aprendizajes + AI Summary)
    - Meeting Notes (Topics)
    - Action Items (Tasks with Assignee selector & automatic carry-over of unchecked tasks)
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    sprint_code: str = Field(index=True, unique=True)  # e.g. "26PI1 S3", "26PI1 S4", "26PI1 S5"
    sprint_name: str
    start_date: str
    end_date: str
    meeting_date: str
    jira_dashboard_url: str = Field(default="https://stla-ford.atlassian.net/dashboards/101")
    sprint_completion_pct: float = Field(default=88.8)
    velocity_achieved: int = Field(default=64)
    avg_velocity: int = Field(default=58)
    sp_breakdown_json: str = Field(default="[]")
    attendees_json: str = Field(default="[]")
    pulse_items_json: str = Field(default="[]")
    pulse_ratings_json: str = Field(default="[]")
    pulse_ai_summary: str = Field(default="")
    notes_json: str = Field(default="[]")
    tasks_json: str = Field(default="[]")


class SprintPlanningModel(SQLModel, table=True):
    """
    Clean Left-Center-Right Sprint Planning State:
    - Left: Base SP (20), Triage deduction (-10 -> 10 SP available/person), Velocity & Vacations
    - Center: Editable Theme Cards (eazyBI, RESIM, Inventory, Ford + Custom) with Priority (High/Mid/Low), SP, Assignees, Description, AC, ASPICE
    - Right: Auto-calculated SP per person + Created Jira Tickets log
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    sprint_code: str = Field(index=True, unique=True)
    sprint_name: str
    start_date: str
    end_date: str
    state: str = Field(default="planning")  # "planning" | "active" | "closed"
    base_sp_per_person: int = Field(default=20)
    triage_deduction_sp: int = Field(default=10)
    historical_velocity: int = Field(default=58)
    vacations_json: str = Field(default="{}")
    themes_json: str = Field(default="[]")
    created_tickets_json: str = Field(default="[]")


class TeamModel(SQLModel, table=True):
    """
    Team configuration with custom members and their corporate NetIDs / usernames.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Core Team")
    is_active: bool = Field(default=True)
    members_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

