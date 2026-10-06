export interface JiraConfig {
  id?: number;
  mode: 'demo' | 'live';
  base_url: string;
  email: string;
  api_token: string;
  project_key: string;
  default_board_id: string;
  ai_provider: 'local' | 'gemini' | 'openai';
  ai_api_key: string;
  eazybi_url?: string;
}

export interface TeamMember {
  name: string;
  netid: string;
  email?: string;
}

export interface Attendee {
  name: string;
  initials: string;
  present: boolean;
  color: string;
}

export interface SprintIssueItem {
  key: string;
  summary: string;
  sp: number;
  status: string;
  is_done?: boolean;
  is_added?: boolean;
  is_removed?: boolean;
  url?: string;
}

export interface SpBreakdownItem {
  board: string;
  completed_sp: number;
  shifted_sp?: number;
  total_planned_sp?: number;
  completion_pct?: number;
  added_sp?: number;
  removed_sp?: number;
  issues?: SprintIssueItem[];
  removed_issues?: SprintIssueItem[];
}

export interface PulseRating {
  author: string;
  moral: number;
  confianza: number;
  claridad: number;
  submitted_at?: string;
}

export interface PulseItem {
  id: string;
  type: 'wind' | 'anchor' | 'rocks' | 'island' | 'logro' | 'blocker' | 'concern' | 'aprendizaje';
  text: string;
  author?: string;
  votes?: number;
  created_at?: string;
}

export interface RetroTask {
  id: string;
  text: string;
  done: boolean;
  assignee: string;
  carried_from_sprint?: string;
  ai_suggested?: boolean;
}

export interface RetroSession {
  id: number;
  sprint_code: string;
  sprint_name: string;
  start_date: string;
  end_date: string;
  meeting_date: string;
  jira_dashboard_url: string;
  sprint_completion_pct: number;
  velocity_achieved: number;
  avg_velocity: number;
  sp_breakdown: SpBreakdownItem[];
  attendees: Attendee[];
  pulse_items: PulseItem[];
  pulse_ratings?: PulseRating[];
  pulse_ai_summary: string;
  notes: string[];
  tasks: RetroTask[];
  team_members: string[];
  team_members_detail?: TeamMember[];
}

export interface PlanningThemeCard {
  id: string;
  title: string;
  board: 'HJJ' | 'HAO';
  priority: 'High' | 'Mid' | 'Low';
  sp_per_person: number;
  assignees: string[];
  active: boolean;
  aspice: string;
  description: string;
  acceptance_criteria: string;
}

export interface PersonSpSummary {
  name: string;
  vacation_days: number;
  max_sp: number;
  planned_sp: number;
  overloaded: boolean;
  themes: string[];
}

export interface CreatedJiraTicket {
  key: string;
  board: string;
  theme: string;
  summary: string;
  assignee: string;
  priority: string;
  story_points: number;
  sprint: string;
  aspice: string;
  description: string;
  acceptance_criteria: string;
  status: string;
}

export interface SprintPlanningState {
  id: number;
  sprint_code: string;
  sprint_name: string;
  start_date: string;
  end_date: string;
  state: 'planning' | 'active' | 'ended' | 'closed';
  base_sp_per_person: number;
  triage_deduction_sp: number;
  net_sp_per_person: number;
  historical_velocity: number;
  total_team_available_sp: number;
  total_team_planned_sp: number;
  vacations: Record<string, number>;
  themes: PlanningThemeCard[];
  person_summary: PersonSpSummary[];
  created_tickets: CreatedJiraTicket[];
  team_members: string[];
}
