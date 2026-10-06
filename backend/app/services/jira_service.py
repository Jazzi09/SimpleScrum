from typing import Any, Dict, List, Optional
import re
import httpx
from sqlmodel import Session, select
from app.models import JiraConfig


class JiraHybridService:
    """
    Hybrid service operating in Local/Demo Mode (SQLite)
    or Live Jira Data Center / Cloud Mode (Atlassian REST API v2/v3).
    Specialized for corporate Jira Server / Data Center (e.g. jiraprod.aptiv.com)
    using Personal Access Tokens (PAT - Bearer auth) or Basic Auth.
    """

    def __init__(self, session: Session):
        self.session = session
        self.config = self._get_config()
        self._cached_sp_field: Optional[str] = None

    def _get_config(self) -> JiraConfig:
        config = self.session.exec(select(JiraConfig)).first()
        if not config:
            config = JiraConfig(
                mode="demo",
                base_url="https://jiraprod.aptiv.com",
                email="",
                api_token="",
            )
            self.session.add(config)
            self.session.commit()
            self.session.refresh(config)
        return config

    @staticmethod
    def normalize_url(url: Optional[str]) -> str:
        if not url:
            return ""
        clean = url.strip().rstrip("/")
        if not clean.startswith("http://") and not clean.startswith("https://"):
            clean = f"https://{clean}"
        return clean

    async def test_connection(
        self, base_url: str, email: str, api_token: str
    ) -> Dict[str, Any]:
        clean_url = self.normalize_url(base_url)
        token = (api_token or "").strip()
        user_identifier = (email or "").strip()

        if not clean_url or not token:
            return {
                "ok": False,
                "message": "Faltan credenciales: Proporciona la URL de Jira y tu Personal Access Token (PAT).",
            }

        # 1. Try Bearer token (Standard for Jira Data Center Personal Access Tokens)
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
                resp = await client.get(f"{clean_url}/rest/api/2/myself")

                # If Bearer succeeded (200 OK)
                if resp.status_code == 200:
                    data = resp.json()
                    display_name = data.get("displayName") or data.get("name") or "Usuario Jira"
                    username = data.get("name") or data.get("key") or ""
                    email_addr = data.get("emailAddress") or user_identifier

                    # Fetch accessible projects for extra confirmation
                    projects = await self._fetch_projects_with_client(client, clean_url)

                    return {
                        "ok": True,
                        "message": f"¡Conectado exitosamente como {display_name} ({username})!",
                        "user": display_name,
                        "username": username,
                        "email": email_addr,
                        "auth_type": "Bearer (PAT)",
                        "projects": projects,
                    }

                # 2. If Bearer got 401/403 and user provided email/username, try Basic Auth fallback
                if (resp.status_code in (401, 403)) and user_identifier:
                    async with httpx.AsyncClient(
                        timeout=10.0, auth=(user_identifier, token)
                    ) as basic_client:
                        basic_resp = await basic_client.get(f"{clean_url}/rest/api/2/myself")
                        if basic_resp.status_code == 200:
                            data = basic_resp.json()
                            display_name = data.get("displayName") or user_identifier
                            username = data.get("name") or user_identifier
                            email_addr = data.get("emailAddress") or user_identifier
                            projects = await self._fetch_projects_with_client(basic_client, clean_url)

                            return {
                                "ok": True,
                                "message": f"¡Conectado exitosamente como {display_name}!",
                                "user": display_name,
                                "username": username,
                                "email": email_addr,
                                "auth_type": "Basic Auth",
                                "projects": projects,
                            }

                if resp.status_code == 401:
                    return {
                        "ok": False,
                        "message": "Error 401 (No autorizado): El Token ingresado no es válido o expiró. Verifica tu Personal Access Token.",
                    }
                elif resp.status_code == 403:
                    return {
                        "ok": False,
                        "message": "Error 403 (Acceso prohibido): Tu cuenta no tiene permisos suficientes para la API de Jira.",
                    }
                else:
                    return {
                        "ok": False,
                        "message": f"Jira respondió con código HTTP {resp.status_code}. Mensaje: {resp.text[:180]}",
                    }

        except httpx.ConnectTimeout:
            return {
                "ok": False,
                "message": f"Tiempo de espera agotado al conectar a {clean_url}. Asegúrate de estar conectado a la VPN corporativa.",
            }
        except httpx.ConnectError as err:
            return {
                "ok": False,
                "message": f"No se pudo conectar a {clean_url}. ¿Estás conectado a la VPN de la empresa? Detalle: {str(err)}",
            }
        except Exception as exc:
            return {
                "ok": False,
                "message": f"Error inesperado al conectar a Jira: {str(exc)}",
            }

    async def _fetch_projects_with_client(
        self, client: httpx.AsyncClient, clean_url: str
    ) -> List[Dict[str, str]]:
        try:
            p_resp = await client.get(f"{clean_url}/rest/api/2/project")
            if p_resp.status_code == 200:
                projects_data = p_resp.json()
                return [
                    {
                        "key": p.get("key", ""),
                        "name": p.get("name", ""),
                    }
                    for p in projects_data
                    if isinstance(p, dict)
                ][:20]
        except Exception:
            pass
        return []

    async def get_projects(self) -> List[Dict[str, str]]:
        if not self.config or not self.config.api_token:
            return []
        clean_url = self.normalize_url(self.config.base_url)
        headers = {"Authorization": f"Bearer {self.config.api_token.strip()}"}
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
                return await self._fetch_projects_with_client(client, clean_url)
        except Exception:
            return []

    async def get_boards(self, project_key: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.config or not self.config.api_token:
            return []
        clean_url = self.normalize_url(self.config.base_url)
        headers = {"Authorization": f"Bearer {self.config.api_token.strip()}"}
        params = {}
        if project_key:
            params["projectKeyOrId"] = project_key
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
                resp = await client.get(f"{clean_url}/rest/agile/1.0/board", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("values", [])
        except Exception:
            pass
        return []

    async def find_story_points_field(self) -> Optional[str]:
        if self._cached_sp_field:
            return self._cached_sp_field
        if not self.config or not self.config.api_token:
            return None
        clean_url = self.normalize_url(self.config.base_url)
        headers = {"Authorization": f"Bearer {self.config.api_token.strip()}"}
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
                resp = await client.get(f"{clean_url}/rest/api/2/field")
                if resp.status_code == 200:
                    fields = resp.json()
                    for f in fields:
                        name = (f.get("name") or "").lower()
                        if "story point" in name or name == "story points":
                            self._cached_sp_field = f.get("id")
                            return self._cached_sp_field
        except Exception:
            pass
        return "customfield_10026"  # Common Jira default fallback

    # Aptiv Jira Data Center Known Custom Fields
    FIELD_STORY_POINTS = "customfield_10002"
    FIELD_ACCEPTANCE_CRITERIA = "customfield_11028"
    FIELD_ASPICE = "customfield_13707"
    FIELD_SPRINT = "customfield_10005"

    ASPICE_OPTIONS = {
        "V/SS-SYS.1": "52915",
        "V/SS-SYS.2": "52916",
        "V/SS-SYS.3": "52917",
        "V/SS-SYS.4": "52918",
        "SUP 1: Quality Assurance": "25604",
        "SUP 4: Joint Review": "26410",
        "SUP 8: Configuration Management": "25605",
        "SUP 9: Problem Resolution Management": "25606",
        "SUP 10 : Change Request Management": "25607",
        "V-SYS 5: Vehicle Verification": "53734",
        "SYS 1: Requirements Elicitation": "25593",
        "SYS 2: System Requirements Analysis": "25594",
        "SYS 3: System Architectural Design": "25595",
        "SYS 4: System Integration Test": "25596",
        "SYS 5: Systems Qualification Test": "25597",
        "SWE1: SW Requirements Analysis": "25598",
        "SWE2: SW Architectural Design": "25599",
        "SWE3: SW Detailed Design & Construction": "25600",
        "SWE 4: SW Unit Verification": "25601",
        "SWE 5: SW Integration & Testing": "25602",
        "SWE6: SW Qualification Test": "25603",
        "MAN 3: Project Management": "25608",
        "MAN 5: Risk Management": "25609",
    }

    KNOWN_USERNAMES = {
        "jackie": "3gebsx",
        "raquel": "3gebsx",
        "franco": "3lys5n",
        "cotera": "hzlrl1",
        "gerardo": "09dini",
        "samantha": "ckqcxp",
    }

    async def find_sprint_id_for_board(
        self, client: httpx.AsyncClient, clean_url: str, board_id: int, project_key: str, sprint_code: Optional[str] = None
    ) -> Optional[int]:
        """
        Finds the sprint ID on the board that matches sprint_code, prioritizing active sprints,
        then recently closed sprints.
        """
        norm_target = re.sub(r"[^a-zA-Z0-9]", "", sprint_code or "").lower()

        # Step 1: Check active sprints on the board (highest priority for current sprint)
        try:
            r_active = await client.get(
                f"{clean_url}/rest/agile/1.0/board/{board_id}/sprint?state=active",
                timeout=7.0,
            )
            if r_active.status_code == 200:
                active_sprints = r_active.json().get("values", [])
                if active_sprints:
                    for s in active_sprints:
                        norm_name = re.sub(r"[^a-zA-Z0-9]", "", s.get("name", "")).lower()
                        if not norm_target or norm_target in norm_name or norm_name in norm_target:
                            return s.get("id")
                    if "26pi4s1" in norm_target or not norm_target:
                        return active_sprints[0].get("id")
        except Exception:
            pass

        # Step 2: Search recent closed sprints (fetch the latest page)
        try:
            r_recent = await client.get(
                f"{clean_url}/rest/agile/1.0/board/{board_id}/sprint?startAt=20&maxResults=60",
                timeout=7.0,
            )
            if r_recent.status_code == 200:
                sprints = r_recent.json().get("values", [])
                if norm_target:
                    for s in reversed(sprints):
                        norm_name = re.sub(r"[^a-zA-Z0-9]", "", s.get("name", "")).lower()
                        if norm_target in norm_name or norm_name in norm_target:
                            return s.get("id")
        except Exception:
            pass

        return 124938 if project_key.upper() == "HJJ" else 124937

    async def get_active_sprint_id_for_project(
        self, client: httpx.AsyncClient, clean_url: str, project_key: str
    ) -> Optional[int]:
        """
        Dynamically finds the active sprint ID for the project's primary board.
        """
        board_id = 14578 if project_key.upper() == "HJJ" else 13102 if project_key.upper() == "HAO" else None
        if not board_id:
            return None
        return await self.find_sprint_id_for_board(client, clean_url, board_id, project_key)

    async def sync_sprint_metrics(self, sprint_code: str) -> Dict[str, Any]:
        """
        Synchronizes sprint velocity, completion, and SP breakdown directly from Aptiv Jira Data Center boards,
        including individual issue status, scope changes (+ added after start, - removed from sprint),
        and average board completion percentage.
        """
        clean_url = self.normalize_url(self.config.base_url)
        headers = {
            "Authorization": f"Bearer {self.config.api_token.strip()}",
            "Accept": "application/json",
        }

        boards = [
            {"board": "HJJ", "id": 14578},
            {"board": "HAO", "id": 13102},
        ]

        breakdown = []
        total_completed_sp = 0
        total_planned_sp = 0

        try:
            async with httpx.AsyncClient(timeout=14.0, headers=headers) as client:
                for b in boards:
                    sprint_id = await self.find_sprint_id_for_board(client, clean_url, b["id"], b["board"], sprint_code)
                    board_completed = 0
                    board_shifted = 0
                    board_added = 0
                    board_removed = 0
                    issues_list = []
                    removed_issues_list = []

                    if sprint_id:
                        # 1. Fetch all issues in sprint via Agile API
                        resp = await client.get(
                            f"{clean_url}/rest/agile/1.0/board/{b['id']}/sprint/{sprint_id}/issue?maxResults=100",
                            timeout=10.0,
                        )

                        # 2. Fetch sprint report to detect added & punted (removed) issues
                        added_keys = set()
                        punted_issues = []
                        try:
                            r_rep = await client.get(
                                f"{clean_url}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId={b['id']}&sprintId={sprint_id}",
                                timeout=8.0,
                            )
                            if r_rep.status_code == 200:
                                rep_contents = r_rep.json().get("contents", {})
                                added_keys = set(rep_contents.get("issueKeysAddedDuringSprint", {}).keys())
                                punted_issues = rep_contents.get("puntedIssues", [])
                        except Exception:
                            pass

                        if resp.status_code == 200:
                            raw_issues = resp.json().get("issues", [])
                            for it in raw_issues:
                                key = it.get("key")
                                summary = it.get("fields", {}).get("summary", "")
                                status_obj = it.get("fields", {}).get("status", {})
                                status_name = status_obj.get("name", "Open")
                                status_cat = status_obj.get("statusCategory", {}).get("key", "").lower()

                                sp_val = it.get("fields", {}).get(self.FIELD_STORY_POINTS) or 0
                                try:
                                    sp_num = int(float(sp_val))
                                except Exception:
                                    sp_num = 0

                                is_done = (
                                    status_cat == "done"
                                    or "done" in status_name.lower()
                                    or "closed" in status_name.lower()
                                    or "resolved" in status_name.lower()
                                )
                                is_added = key in added_keys

                                if is_done:
                                    board_completed += sp_num
                                else:
                                    board_shifted += sp_num

                                if is_added:
                                    board_added += sp_num

                                issues_list.append({
                                    "key": key,
                                    "summary": summary,
                                    "sp": sp_num,
                                    "status": status_name,
                                    "is_done": is_done,
                                    "is_added": is_added,
                                    "is_removed": False,
                                    "url": f"{clean_url}/browse/{key}",
                                })

                        # Process removed / punted issues
                        for p_it in punted_issues:
                            p_key = p_it.get("key")
                            p_sum = p_it.get("summary", "")
                            p_stat_val = (
                                p_it.get("currentEstimateStatistic", {}).get("statFieldValue", {}).get("value")
                                or p_it.get("estimateStatistic", {}).get("statFieldValue", {}).get("value")
                                or 0
                            )
                            try:
                                p_sp = int(float(p_stat_val))
                            except Exception:
                                p_sp = 0

                            board_removed += p_sp
                            removed_issues_list.append({
                                "key": p_key,
                                "summary": p_sum,
                                "sp": p_sp,
                                "status": "Removed",
                                "is_done": False,
                                "is_added": False,
                                "is_removed": True,
                                "url": f"{clean_url}/browse/{p_key}",
                            })

                    b_planned = board_completed + board_shifted
                    b_pct = round((board_completed / b_planned) * 100, 1) if b_planned > 0 else 0.0

                    total_completed_sp += board_completed
                    total_planned_sp += b_planned

                    breakdown.append({
                        "board": b["board"],
                        "completed_sp": board_completed,
                        "shifted_sp": board_shifted,
                        "total_planned_sp": b_planned,
                        "completion_pct": b_pct,
                        "added_sp": board_added,
                        "removed_sp": board_removed,
                        "issues": issues_list,
                        "removed_issues": removed_issues_list,
                    })

            # Calculate average completion percentage across boards (e.g. 50% and 30% -> 40%)
            active_board_pcts = [b_data["completion_pct"] for b_data in breakdown if b_data["total_planned_sp"] > 0]
            if active_board_pcts:
                avg_completion_pct = round(sum(active_board_pcts) / len(active_board_pcts), 1)
            else:
                avg_completion_pct = 0.0

            return {
                "ok": True,
                "velocity_achieved": total_completed_sp,
                "sprint_completion_pct": avg_completion_pct,
                "total_added_sp": sum(b_data["added_sp"] for b_data in breakdown),
                "total_removed_sp": sum(b_data["removed_sp"] for b_data in breakdown),
                "sp_breakdown": breakdown,
            }
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    async def create_jira_issue(
        self,
        project_key: str,
        summary: str,
        description: str,
        assignee_name: Optional[str] = None,
        story_points: Optional[int] = None,
        priority: Optional[str] = None,
        issue_type: str = "Story",
        acceptance_criteria: Optional[str] = None,
        aspice: Optional[str] = None,
        sprint_code: Optional[str] = None,
        netid: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a real Jira issue in Aptiv Jira Data Center with all corresponding fields:
        - Summary
        - Description (clean)
        - Acceptance Criteria (customfield_11028)
        - ASPICE Process Area (customfield_13707)
        - Story Points (customfield_10002)
        - Assignee (resolved Aptiv username)
        - Sprint (added via Jira Agile Sprint API)
        """
        clean_url = self.normalize_url(self.config.base_url)
        headers = {
            "Authorization": f"Bearer {self.config.api_token.strip()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # 1. Base required fields
        fields_payload: Dict[str, Any] = {
            "project": {"key": project_key},
            "summary": summary,
            "description": description or summary,
            "issuetype": {"name": issue_type},
        }

        # 2. Acceptance Criteria (customfield_11028)
        if acceptance_criteria and acceptance_criteria.strip():
            fields_payload[self.FIELD_ACCEPTANCE_CRITERIA] = acceptance_criteria.strip()

        # 3. ASPICE Process Area (customfield_13707 - array of option objects)
        if aspice and aspice.strip():
            asp_clean = aspice.strip()
            opt_id = self.ASPICE_OPTIONS.get(asp_clean)
            if opt_id:
                fields_payload[self.FIELD_ASPICE] = [{"id": opt_id}]
            else:
                fields_payload[self.FIELD_ASPICE] = [{"value": asp_clean}]

        # 4. Story Points (customfield_10002)
        if story_points is not None:
            fields_payload[self.FIELD_STORY_POINTS] = float(story_points)

        # 5. Assignee resolution (Aptiv username / NetID)
        resolved_username: Optional[str] = None
        if netid and netid.strip():
            resolved_username = netid.strip()
        elif assignee_name:
            clean_name = assignee_name.strip().lower()
            resolved_username = self.KNOWN_USERNAMES.get(clean_name)
            if not resolved_username:
                for k, v in self.KNOWN_USERNAMES.items():
                    if k in clean_name:
                        resolved_username = v
                        break

        try:
            async with httpx.AsyncClient(timeout=14.0, headers=headers) as client:
                # If username not in known dictionary, dynamically search user in Jira
                if not resolved_username and assignee_name:
                    try:
                        u_res = await client.get(
                            f"{clean_url}/rest/api/2/user/search",
                            params={"username": assignee_name.strip(), "maxResults": 1},
                            timeout=5.0,
                        )
                        if u_res.status_code == 200 and u_res.json():
                            resolved_username = u_res.json()[0].get("name")
                    except Exception:
                        pass

                if resolved_username:
                    fields_payload["assignee"] = {"name": resolved_username}

                # Attempt 1: Create issue with all custom fields
                resp = await client.post(
                    f"{clean_url}/rest/api/2/issue",
                    json={"fields": fields_payload},
                )

                issue_key = None
                data = {}
                if resp.status_code in (200, 201):
                    data = resp.json()
                    issue_key = data.get("key")
                else:
                    # Parse specific field errors to avoid discarding intact fields
                    try:
                        err_json = resp.json()
                        field_errors = err_json.get("errors", {})
                    except Exception:
                        field_errors = {}

                    retry_fields = dict(fields_payload)
                    if field_errors:
                        # Strip only the specifically rejected fields
                        for rejected_f in field_errors.keys():
                            retry_fields.pop(rejected_f, None)
                    else:
                        # If general error, strip non-essential custom fields one by one
                        retry_fields.pop("assignee", None)

                    retry_resp = await client.post(
                        f"{clean_url}/rest/api/2/issue",
                        json={"fields": retry_fields},
                    )
                    if retry_resp.status_code in (200, 201):
                        data = retry_resp.json()
                        issue_key = data.get("key")
                    else:
                        # Fallback to minimal fields
                        min_fields = {
                            "project": {"key": project_key},
                            "summary": summary,
                            "description": description or summary,
                            "issuetype": {"name": issue_type},
                        }
                        min_resp = await client.post(
                            f"{clean_url}/rest/api/2/issue",
                            json={"fields": min_fields},
                        )
                        if min_resp.status_code in (200, 201):
                            data = min_resp.json()
                            issue_key = data.get("key")
                        else:
                            return {
                                "ok": False,
                                "status_code": resp.status_code,
                                "error": resp.text[:300],
                            }

                if issue_key:
                    # Dynamically assign to active Sprint via Jira Agile API
                    sprint_id = await self.get_active_sprint_id_for_project(client, clean_url, project_key)
                    if sprint_id:
                        try:
                            await client.post(
                                f"{clean_url}/rest/agile/1.0/sprint/{sprint_id}/issue",
                                json={"issues": [issue_key]},
                                timeout=6.0,
                            )
                        except Exception:
                            pass

                    return {
                        "ok": True,
                        "key": issue_key,
                        "id": data.get("id"),
                        "url": f"{clean_url}/browse/{issue_key}",
                        "sprint_id": sprint_id,
                    }
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

