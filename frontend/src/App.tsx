import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
  Sparkles,
  Plus,
  Download,
  Settings,
  Sun,
  Moon,
  Rocket,
  Palmtree,
  Ticket,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  PlugZap,
  GripVertical,
  X,
  Calendar,
  Info,
  User,
  QrCode,
  Copy,
  Check,
  ThumbsUp,
  Maximize2,
  Minimize2,
  Trash2,
  Wind,
  Anchor,
  Mountain,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  RefreshCw,
  ExternalLink,
  Mail,
  BarChart2,
} from 'lucide-react';
import {
  RetroSession,
  RetroTask,
  SprintPlanningState,
  PlanningThemeCard,
  PulseItem,
  PulseRating,
  JiraConfig,
  TeamMember,
} from './types';
import { RetroLiveView } from './RetroLiveView';

const PI_LIST = ['26PI1', '26PI2', '26PI3', '26PI4'] as const;
const SPRINT_SUB_ITEMS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'DRP'] as const;

const SPRINT_ORDER: string[] = [
  '26PI1 S1', '26PI1 S2', '26PI1 S3', '26PI1 S4', '26PI1 S5', '26PI1 S6', '26PI1 DRP',
  '26PI2 S1', '26PI2 S2', '26PI2 S3', '26PI2 S4', '26PI2 S5', '26PI2 S6', '26PI2 DRP',
  '26PI3 S1', '26PI3 S2', '26PI3 S3', '26PI3 S4', '26PI3 S5', '26PI3 S6', '26PI3 DRP',
  '26PI4 S1', '26PI4 S2', '26PI4 S3', '26PI4 S4', '26PI4 S5', '26PI4 S6', '26PI4 DRP',
];

const SPRINT_CALENDAR: Record<string, [string, string]> = {
  // 26PI1
  '26PI1 S1': ['01/07/26', '01/21/26'],
  '26PI1 S2': ['01/21/26', '02/04/26'],
  '26PI1 S3': ['02/04/26', '02/18/26'],
  '26PI1 S4': ['02/18/26', '03/04/26'],
  '26PI1 S5': ['03/04/26', '03/18/26'],
  '26PI1 S6': ['03/18/26', '03/25/26'],
  '26PI1 DRP': ['03/25/26', '04/01/26'],
  // 26PI2
  '26PI2 S1': ['04/01/26', '04/15/26'],
  '26PI2 S2': ['04/15/26', '04/29/26'],
  '26PI2 S3': ['04/29/26', '05/13/26'],
  '26PI2 S4': ['05/13/26', '05/27/26'],
  '26PI2 S5': ['05/27/26', '06/10/26'],
  '26PI2 S6': ['06/10/26', '06/17/26'],
  '26PI2 DRP': ['06/17/26', '06/24/26'],
  // 26PI3
  '26PI3 S1': ['06/24/26', '07/08/26'],
  '26PI3 S2': ['07/08/26', '07/22/26'],
  '26PI3 S3': ['07/22/26', '08/05/26'],
  '26PI3 S4': ['08/05/26', '08/19/26'],
  '26PI3 S5': ['08/19/26', '09/02/26'],
  '26PI3 S6': ['09/02/26', '09/09/26'],
  '26PI3 DRP': ['09/09/26', '09/23/26'],
  // 26PI4 (Current Sprint 26PI4 S1: 09/23/26 9:02 AM -> 10/07/26 9:02 AM)
  '26PI4 S1': ['09/23/26', '10/07/26'],
  '26PI4 S2': ['10/07/26', '10/21/26'],
  '26PI4 S3': ['10/21/26', '11/04/26'],
  '26PI4 S4': ['11/04/26', '11/18/26'],
  '26PI4 S5': ['11/18/26', '12/02/26'],
  '26PI4 S6': ['12/02/26', '12/16/26'],
  '26PI4 DRP': ['12/16/26', '12/23/26'],
};

function formatShortDate(raw: string, sprintCode?: string, isEnd?: boolean): string {
  if (sprintCode && SPRINT_CALENDAR[sprintCode]) {
    return isEnd ? SPRINT_CALENDAR[sprintCode][1] : SPRINT_CALENDAR[sprintCode][0];
  }
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(raw.trim())) return raw.trim();
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const yy = String(parsed.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  }
  return raw;
}

const PULSE_BADGES: Record<
  string,
  { label: string; icon: string; style: string }
> = {
  logro: {
    label: 'Viento en Velas',
    icon: '💨',
    style: 'bg-emerald-200 text-emerald-950 border-emerald-500/70 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
  },
  wind: {
    label: 'Viento en Velas',
    icon: '💨',
    style: 'bg-emerald-200 text-emerald-950 border-emerald-500/70 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
  },
  blocker: {
    label: 'El Ancla',
    icon: '⚓',
    style: 'bg-rose-200 text-rose-950 border-rose-500/70 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
  },
  anchor: {
    label: 'El Ancla',
    icon: '⚓',
    style: 'bg-rose-200 text-rose-950 border-rose-500/70 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
  },
  concern: {
    label: 'Rocas en el Mar',
    icon: '🪨',
    style: 'bg-amber-200 text-amber-950 border-amber-500/70 dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/45',
  },
  rocks: {
    label: 'Rocas en el Mar',
    icon: '🪨',
    style: 'bg-amber-200 text-amber-950 border-amber-500/70 dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/45',
  },
  aprendizaje: {
    label: 'La Isla (Destino)',
    icon: '🏝️',
    style: 'bg-purple-200 text-purple-950 border-purple-500/70 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40',
  },
  island: {
    label: 'La Isla (Destino)',
    icon: '🏝️',
    style: 'bg-purple-200 text-purple-950 border-purple-500/70 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40',
  },
};

const PARTICIPANT_MEMBERS = [
  { name: 'Maria Paula', initials: 'MP', color: '#10B981' },
  { name: 'Samantha', initials: 'SA', color: '#8B5CF6' },
  { name: 'Jackie', initials: 'JA', color: '#3B82F6' },
  { name: 'Franco', initials: 'FR', color: '#F59E0B' },
  { name: 'Cotera', initials: 'JC', color: '#6366F1' },
  { name: 'Gerardo', initials: 'GD', color: '#EC4899' },
];

const PRIORITY_WEIGHT: Record<'High' | 'Mid' | 'Low', number> = {
  High: 0,
  Mid: 1,
  Low: 2,
};

const ASPICE_OPTIONS = [
  'SUP 1: Quality Assurance',
  'SUP 4: Joint Review',
  'SUP 8: Configuration Management',
  'SUP 9: Problem Resolution Management',
  'SUP 10 : Change Request Management',
  'V/SS-SYS.2',
  'V/SS-SYS.3',
  'V/SS-SYS.4',
  'V-SYS 5: Vehicle Verification',
] as const;

interface PlanningSprintSummary {
  sprint_code: string;
  state: 'planning' | 'active' | 'ended' | 'closed';
  start_date: string;
  end_date: string;
}

const DEFAULT_PLANNING_LIST: PlanningSprintSummary[] = SPRINT_ORDER.slice(
  0,
  SPRINT_ORDER.indexOf('26PI4 S1') + 1
).map((code) => ({
  sprint_code: code,
  state: code === '26PI4 S1' ? 'active' : 'ended',
  start_date: SPRINT_CALENDAR[code][0],
  end_date: SPRINT_CALENDAR[code][1],
}));

interface VelocityCapacityGaugeProps {
  planned: number;
  capacity: number;
  capacityPct: number;
  ringStrokeColor: string;
  capacityStatusColor: string;
  isOverCapacity: boolean;
  isNearLimit: boolean;
  isLowCapacity: boolean;
  darkMode: boolean;
}

function VelocityCapacityGauge({
  planned,
  capacityPct,
  ringStrokeColor,
  capacityStatusColor,
  isOverCapacity,
  isNearLimit,
  isLowCapacity,
  darkMode,
}: VelocityCapacityGaugeProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;
    const duration = 950; // Apple fluid duration

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const t = Math.min(elapsed / duration, 1);
      // Apple iOS quartic deceleration curve: rapid start, silky smooth landing
      const ease = 1 - Math.pow(1 - t, 4);
      setProgress(ease);

      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setProgress(1);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [planned, capacityPct]);

  const currentPct = Math.round(capacityPct * progress);
  const currentPlanned = Math.round(planned * progress);
  // Full circumference = 2 * PI * 40 = 251.3
  const strokeOffset = Math.max(0, 251.3 - Math.min(251.3, (capacityPct * progress / 100) * 251.3));

  return (
    <div className="py-2 flex flex-col items-center justify-center select-none">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={darkMode ? '#1e293b' : '#cbd5e1'}
            strokeWidth="8"
          />
          {/* Active Capacity Arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={ringStrokeColor}
            strokeWidth="8"
            strokeDasharray="251.3"
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-3xl font-extrabold tabular-nums leading-none tracking-tight ${capacityStatusColor}`}>
            {currentPct}%
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
            Capacity
          </span>
        </div>
      </div>
      <div className="text-base font-extrabold tabular-nums mt-1.5 tracking-tight text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5">
        <span>{currentPlanned}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Planned SP
        </span>
      </div>
    </div>
  );
}

interface RetroCompletionGaugeProps {
  targetPct: number;
  darkMode: boolean;
}

function RetroCompletionGauge({ targetPct, darkMode }: RetroCompletionGaugeProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;
    const duration = 950; // Apple fluid duration

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const t = Math.min(elapsed / duration, 1);
      // Apple iOS quartic deceleration curve
      const ease = 1 - Math.pow(1 - t, 4);
      setProgress(ease);

      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setProgress(1);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetPct]);

  const currentPct = targetPct * progress;
  const strokeOffset = 100 - Math.min(100, Math.max(0, currentPct));

  return (
    <div className="py-1 flex flex-col items-center justify-center select-none">
      <div className="relative w-48 h-26 sm:w-52 sm:h-28 flex items-end justify-center">
        <svg
          viewBox="0 0 200 108"
          className="w-full h-full overflow-visible"
        >
          <path
            d="M 20 95 A 80 80 0 0 1 180 95"
            fill="none"
            stroke={darkMode ? '#1e293b' : '#cbd5e1'}
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 20 95 A 80 80 0 0 1 180 95"
            fill="none"
            stroke={darkMode ? '#10b981' : '#059669'}
            strokeWidth="16"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="absolute bottom-1 flex flex-col items-center leading-none">
          <span className="text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-400 tracking-tight">
            {targetPct % 1 === 0 ? currentPct.toFixed(0) : currentPct.toFixed(1)}%
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
            Completed
          </span>
        </div>
      </div>
    </div>
  );
}

interface HalfPieGaugeProps {
  label: string;
  score: number;
  max?: number;
  color: string;
  darkMode: boolean;
}

function HalfPieGauge({ label, score, max = 5, color, darkMode }: HalfPieGaugeProps) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const targetPct = Math.min(100, Math.max(0, (score / max) * 100));

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;
    const duration = 850;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setAnimatedPct(targetPct * ease);

      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setAnimatedPct(targetPct);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [score, max, targetPct]);

  const strokeOffset = 100 - animatedPct;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative w-16 sm:w-20 h-10 sm:h-11 flex items-end justify-center">
        <svg viewBox="0 0 100 58" className="w-full h-full overflow-visible">
          {/* Background track */}
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            stroke={darkMode ? '#334155' : '#e2e8f0'}
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Active arc */}
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="absolute bottom-0 flex items-baseline justify-center leading-none">
          <span className="text-xs sm:text-sm font-black tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
            {score.toFixed(1)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-0.5">
            /5
          </span>
        </div>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mt-1">
        {label}
      </span>
    </div>
  );
}

function SailboatCanvasArt() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-2xl flex items-center justify-center opacity-65 dark:opacity-55 transition-opacity">
      <svg
        viewBox="0 0 800 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#451a03" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Wind lines in Top-Left (Wind in Sails) - muted emerald/slate */}
        <g stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" opacity="0.35">
          <path d="M 25 50 Q 85 38 135 52 T 210 48" strokeDasharray="6 4" />
          <path d="M 15 85 Q 95 68 165 82 T 250 72" />
          <path d="M 35 120 Q 105 105 175 122 T 240 112" strokeDasharray="8 4" />
          <path d="M 25 155 Q 85 142 145 158 T 225 148" />
          {/* Swirls */}
          <path d="M 208 48 A 9 9 0 1 1 202 38" fill="none" />
          <path d="M 248 72 A 11 11 0 1 1 242 62" fill="none" />
        </g>

        {/* The Island in Top-Right (The Island / Goals) - contained inside Top-Right quadrant */}
        <g opacity="0.65">
          {/* Sun with muted warm glow */}
          <circle cx="650" cy="70" r="22" fill="#d97706" fillOpacity="0.15" />
          <circle cx="650" cy="70" r="13" fill="#f59e0b" fillOpacity="0.3" />
          {/* Island Terrain safely above waterline (y=238) and within x=510..720 */}
          <path
            d="M 520 230 Q 585 175 640 190 Q 680 200 715 230 Z"
            fill="#78350f"
            fillOpacity="0.28"
          />
          <path
            d="M 545 230 Q 600 195 650 205 Q 675 210 705 230 Z"
            fill="#b45309"
            fillOpacity="0.22"
          />
          {/* Palm Trunk */}
          <path
            d="M 635 210 Q 638 170 626 142 Q 624 138 621 133"
            stroke="#78350f"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />
          {/* Palm Fronds - muted sage tones */}
          <path
            d="M 621 133 Q 603 128 590 137 M 621 133 Q 612 114 602 110 M 621 133 Q 630 110 644 114 M 621 133 Q 644 123 653 135 M 621 133 Q 634 142 643 155"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
            fill="none"
          />
        </g>

        {/* Ocean Waves Waterline - fluid gentle curves, no dashed line */}
        <g opacity="0.4">
          <path
            d="M 0 238 Q 20 234 40 238 T 80 238 T 120 238 T 160 238 T 200 238 T 240 238 T 280 238 T 320 238 T 360 238 T 400 238 T 440 238 T 480 238 T 520 238 T 560 238 T 600 238 T 640 238 T 680 238 T 720 238 T 760 238 T 800 238"
            stroke="#38bdf8"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M 10 244 Q 35 241 60 244 T 110 244 T 160 244 T 210 244 T 260 244 T 310 244 T 360 244 T 410 244 T 460 244 T 510 244 T 560 244 T 610 244 T 660 244 T 710 244 T 760 244 T 800 244"
            stroke="#0284c7"
            strokeWidth="1"
            opacity="0.6"
            fill="none"
          />
        </g>

        {/* Center: The Sailboat - muted tones */}
        <g id="sailboat" transform="translate(315, 75)" opacity="0.75">
          {/* Mast */}
          <line x1="90" y1="10" x2="90" y2="165" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
          {/* Pennant / Flag at top */}
          <polygon points="90,10 116,17 90,24" fill="#f43f5e" opacity="0.6" />

          {/* Main Sail (billowing right) */}
          <path
            d="M 94 28 Q 155 85 145 150 L 94 152 Z"
            fill="url(#sailGrad)"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          {/* Jib / Front Sail (billowing left) */}
          <path
            d="M 86 35 Q 30 95 35 152 L 86 152 Z"
            fill="url(#sailGrad)"
            stroke="#64748b"
            strokeWidth="1.2"
          />

          {/* Hull of the boat */}
          <path
            d="M 18 155 L 38 190 Q 90 196 148 190 L 168 155 Z"
            fill="url(#hullGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Hull decorative golden stripe */}
          <path
            d="M 26 166 Q 90 172 160 166"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
            fill="none"
          />
        </g>

        {/* The Anchor in Bottom-Left (The Anchor / Blockers) - muted slate red */}
        <g transform="translate(135, 260)" opacity="0.55">
          {/* Chain from boat/surface down to anchor */}
          <path
            d="M 175 -20 Q 155 25 120 75"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.5"
          />
          {/* Anchor top ring */}
          <circle cx="120" cy="75" r="7" stroke="#be123c" strokeWidth="2.2" fill="none" />
          {/* Anchor shank */}
          <line x1="120" y1="82" x2="120" y2="140" stroke="#be123c" strokeWidth="2.8" strokeLinecap="round" />
          {/* Anchor stock / crossbar */}
          <line x1="102" y1="96" x2="138" y2="96" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />
          {/* Anchor curved bottom */}
          <path
            d="M 92 125 Q 120 154 148 125"
            stroke="#be123c"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fluke tips */}
          <polygon points="90,125 96,119 88,118" fill="#be123c" />
          <polygon points="150,125 144,119 152,118" fill="#be123c" />
        </g>

        {/* Rocks in Bottom-Right (Rocks in the Sea / Risks) - muted slate stone */}
        <g transform="translate(480, 290)" opacity="0.6">
          {/* Sharp rock 1 */}
          <polygon
            points="20,105 50,20 75,70 95,40 130,115"
            fill="#1e293b"
            fillOpacity="0.65"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Sharp rock 2 */}
          <polygon
            points="65,115 95,55 120,100 145,65 170,125"
            fill="#0f172a"
            fillOpacity="0.75"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Ocean foam ripples around rocks */}
          <ellipse cx="65" cy="95" rx="35" ry="5" fill="#94a3b8" fillOpacity="0.2" />
          <ellipse cx="125" cy="105" rx="40" ry="6" fill="#94a3b8" fillOpacity="0.2" />
        </g>
      </svg>
    </div>
  );
}

export function App() {
  const isRetroLiveView =
    typeof window !== 'undefined' &&
    (window.location.search.includes('view=retro-live') ||
      window.location.pathname.endsWith('/retro-live') ||
      window.location.hash.includes('retro-live'));

  if (isRetroLiveView) {
    return <RetroLiveView />;
  }

  const [mainTab, setMainTab] = useState<'planning' | 'retro'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tab=retro')) {
      return 'retro';
    }
    return 'planning';
  });
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);
  const [openPiMenu, setOpenPiMenu] = useState<string | null>(null);

  // Retro State (defaults to 26PI3 DRP — 1 sprint behind Planning's 26PI4 S1)
  const [retroSessions, setRetroSessions] = useState<RetroSession[]>([]);
  const [selectedRetroCode, setSelectedRetroCode] = useState<string>('26PI3 DRP');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newPulseType, setNewPulseType] = useState<PulseItem['type']>('wind');
  const [newPulseText, setNewPulseText] = useState<string>('');
  const [newPulseAuthor, setNewPulseAuthor] = useState<string>('Scrum Master');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [isBoatExpanded, setIsBoatExpanded] = useState<boolean>(false);
  const [copiedLiveLink, setCopiedLiveLink] = useState<boolean>(false);
  const [showNewRetroModal, setShowNewRetroModal] = useState<boolean>(false);
  const [newRetroForm, setNewRetroForm] = useState({
    sprint_code: '26PI4 S1',
    start_date: '09/23/26',
    end_date: '10/07/26',
    meeting_date: '10/07/26',
  });

  // Planning State
  const [planningSprints, setPlanningSprints] =
    useState<PlanningSprintSummary[]>(DEFAULT_PLANNING_LIST);
  const [selectedPlanningCode, setSelectedPlanningCode] = useState<string>('26PI4 S1');
  const [planning, setPlanning] = useState<SprintPlanningState | null>(null);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [draggedThemeId, setDraggedThemeId] = useState<string | null>(null);
  const [dragOverThemeId, setDragOverThemeId] = useState<string | null>(null);
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<string | null>(null);
  const [showVacationBox, setShowVacationBox] = useState<boolean>(false);
  const [showCapacityDetails, setShowCapacityDetails] = useState<boolean>(false);
  const [boardFilter, setBoardFilter] = useState<'All' | 'HJJ' | 'HAO'>('All');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string | null>(null);
  const [vacPerson, setVacPerson] = useState<string>('Maria Paula');
  const [vacDays, setVacDays] = useState<number>(2);
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);
  const [activeAssigneeDropdownThemeId, setActiveAssigneeDropdownThemeId] = useState<string | null>(null);
  const [showAddThemeModal, setShowAddThemeModal] = useState<boolean>(false);
  const [newThemeForm, setNewThemeForm] = useState({
    title: '',
    board: 'HJJ' as 'HJJ' | 'HAO',
    priority: 'High' as 'High' | 'Mid' | 'Low',
    sp_per_person: 3,
    assignees: ['Jackie'] as string[],
    aspice: 'V/SS-SYS.4',
    description: '',
    acceptance_criteria: '',
  });

  // Config State
  const [config, setConfig] = useState<JiraConfig | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showJiraModal, setShowJiraModal] = useState<boolean>(false);
  const [jiraTestStatus, setJiraTestStatus] = useState<{
    state: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
    user?: string;
    username?: string;
    auth_type?: string;
    projects?: Array<{ key: string; name: string }>;
  }>({ state: 'idle' });
  const [showTokenPassword, setShowTokenPassword] = useState<boolean>(false);
  const [sessionSkippedThemeIds, setSessionSkippedThemeIds] = useState<string[]>([]);

  // Teams & NetIDs state
  const [teams, setTeams] = useState<Array<{ id: number; name: string; is_active: boolean; members: Array<{ name: string; netid: string; email?: string }> }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamFormName, setTeamFormName] = useState<string>('');
  const [teamFormMembers, setTeamFormMembers] = useState<Array<{ name: string; netid: string; email?: string }>>([]);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberNetid, setNewMemberNetid] = useState<string>('');
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [isSavingTeam, setIsSavingTeam] = useState<boolean>(false);
  const [isSyncingJiraRetro, setIsSyncingJiraRetro] = useState<boolean>(false);
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});
  const [networkInfo, setNetworkInfo] = useState<{
    lan_ip: string;
    port: number;
    live_url_base: string;
  } | null>(null);



  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedPlanningCode) {
      loadPlanning(selectedPlanningCode);
    }
  }, [selectedPlanningCode]);

  useEffect(() => {
    function handleOutsideClick() {
      setActiveAssigneeDropdownThemeId(null);
    }
    if (activeAssigneeDropdownThemeId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [activeAssigneeDropdownThemeId]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  }

  async function refreshPlanningList() {
    try {
      const res = await fetch('/api/planning-list');
      if (res.ok) {
        const listData: PlanningSprintSummary[] = await res.json();
        if (Array.isArray(listData) && listData.length > 0) {
          setPlanningSprints(listData);
          return listData;
        }
      }
    } catch {
      // fallback to current state
    }
    return planningSprints;
  }

  async function loadInitial() {
    const [retrosRes, cfgRes] = await Promise.all([
      fetch('/api/retro/sessions'),
      fetch('/api/config'),
    ]);
    const retrosData: RetroSession[] = await retrosRes.json();
    const cfgData = await cfgRes.json();
    setRetroSessions(retrosData);
    if (retrosData.length > 0) {
      setSelectedRetroCode(retrosData[retrosData.length - 1].sprint_code);
    }
    setConfig(cfgData);
    await refreshPlanningList();
    await loadPlanning(selectedPlanningCode);
    await loadTeams();
    try {
      const netRes = await fetch('/api/network-info');
      if (netRes.ok) {
        setNetworkInfo(await netRes.json());
      }
    } catch {
      // ignore
    }
  }

  // Live polling for Retrospective session to update post-its & avatars in real-time!
  useEffect(() => {
    if (mainTab !== 'retro') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/retro/sessions');
        if (res.ok) {
          const data: RetroSession[] = await res.json();
          setRetroSessions(data);
        }
      } catch {
        // ignore background poll error
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [mainTab]);

  async function loadPlanning(code: string) {
    const res = await fetch(`/api/planning/${encodeURIComponent(code)}`);
    const data: SprintPlanningState = await res.json();
    const cal = SPRINT_CALENDAR[code];
    if (cal) {
      data.start_date = cal[0];
      data.end_date = cal[1];
    }
    setPlanning(data);
    setSessionSkippedThemeIds([]);
    setSelectedThemeIds(data.themes.filter((t) => t.active).map((t) => t.id));
    setPlanningSprints((prev) =>
      prev.map((p) =>
        p.sprint_code === data.sprint_code ? { ...p, state: data.state } : p
      )
    );
  }

  async function handleSelectRetroSprint(code: string) {
    setSelectedRetroCode(code);
    setOpenPiMenu(null);
  }

  async function handleCreateNextRetroFromPlanning() {
    // Find the earliest sprint in planningSprints that is not yet in retroSessions,
    // or fall back to the latest sprint in planningSprints so clicking + New Retro updates it from Planning
    const existingRetroCodes = new Set(retroSessions.map((r) => r.sprint_code));
    const nextPlanningSprint =
      planningSprints.find((p) => !existingRetroCodes.has(p.sprint_code)) ||
      planningSprints[planningSprints.length - 1];

    if (!nextPlanningSprint) return;

    const isAlreadyCreated = existingRetroCodes.has(nextPlanningSprint.sprint_code);
    const code = nextPlanningSprint.sprint_code;
    const cal = SPRINT_CALENDAR[code] || ['09/23/26', '10/07/26'];

    const res = await fetch('/api/retro/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sprint_code: code,
        start_date: cal[0],
        end_date: cal[1],
        meeting_date: cal[1],
      }),
    });
    const created: RetroSession = await res.json();
    const allRes = await fetch('/api/retro/sessions');
    const allData: RetroSession[] = await allRes.json();
    setRetroSessions(allData);
    setSelectedRetroCode(created.sprint_code);
    notify(
      isAlreadyCreated
        ? `Retrospective ${created.sprint_code} synced with active Sprint Planning.`
        : `Retrospective ${created.sprint_code} created from active Sprint Planning.`
    );
  }

  async function handleCreateNextPlanning() {
    const latest = planningSprints[planningSprints.length - 1];
    if (!latest || latest.state !== 'ended') {
      notify('Current sprint must be Ended in Jira before creating a New Planning.');
      return;
    }
    const res = await fetch('/api/planning-next', { method: 'POST' });
    if (!res.ok) {
      notify('Could not create next sprint planning.');
      return;
    }
    const created: SprintPlanningState = await res.json();
    await refreshPlanningList();
    setSelectedPlanningCode(created.sprint_code);
    notify(`New Sprint Planning ${created.sprint_code} initialized.`);
  }

  const currentRetro =
    retroSessions.find((r) => r.sprint_code === selectedRetroCode) ||
    retroSessions[retroSessions.length - 1];

  // =========================================================================
  // RETROSPECTIVE HANDLERS
  // =========================================================================
  async function updateRetro(payload: Record<string, unknown>) {
    if (!currentRetro) return;
    const res = await fetch(
      `/api/retro/sessions/${encodeURIComponent(currentRetro.sprint_code)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const updated = await res.json();
    const allRes = await fetch('/api/retro/sessions');
    const allData = await allRes.json();
    setRetroSessions(allData);
    return updated;
  }

  async function handleToggleAttendee(idx: number) {
    if (!currentRetro) return;
    const updated = currentRetro.attendees.map((a, i) =>
      i === idx ? { ...a, present: !a.present } : a
    );
    await updateRetro({ attendees: updated });
  }

  async function handleAddPulseItem(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRetro || !newPulseText.trim()) return;
    const item: PulseItem = {
      id: `p-${Date.now()}`,
      type: newPulseType,
      text: newPulseText.trim(),
      author: newPulseAuthor || 'Scrum Master',
      votes: 0,
      created_at: new Date().toISOString(),
    };
    await updateRetro({ pulse_items: [...currentRetro.pulse_items, item] });
    setNewPulseText('');
  }

  async function handleVotePulseItem(itemId: string) {
    if (!currentRetro) return;
    setRetroSessions((prev) =>
      prev.map((r) => {
        if (r.sprint_code !== currentRetro.sprint_code) return r;
        return {
          ...r,
          pulse_items: r.pulse_items.map((it) =>
            it.id === itemId ? { ...it, votes: (it.votes || 0) + 1 } : it
          ),
        };
      })
    );
    try {
      const res = await fetch(
        `/api/retro/sessions/${encodeURIComponent(currentRetro.sprint_code)}/pulse/${encodeURIComponent(itemId)}/vote`,
        { method: 'POST' }
      );
      if (res.ok) {
        const updated: RetroSession = await res.json();
        setRetroSessions((prev) =>
          prev.map((r) => (r.sprint_code === updated.sprint_code ? updated : r))
        );
      }
    } catch (err) {
      console.error('Error voting item:', err);
    }
  }

  async function handleDeletePulseItem(itemId: string) {
    if (!currentRetro) return;
    try {
      const res = await fetch(
        `/api/retro/sessions/${encodeURIComponent(currentRetro.sprint_code)}/pulse/${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        const updated: RetroSession = await res.json();
        setRetroSessions((prev) =>
          prev.map((r) => (r.sprint_code === updated.sprint_code ? updated : r))
        );
        notify('Post-it eliminado del barco.');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  }

  function handleCopyLiveLink() {
    if (!currentRetro) return;
    const url = `${window.location.origin}${window.location.pathname}?view=retro-live&sprint=${encodeURIComponent(currentRetro.sprint_code)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLiveLink(true);
      notify('📋 Link de participación copiado al portapapeles.');
      setTimeout(() => setCopiedLiveLink(false), 2500);
    });
  }

  async function handleAiPulseAnalysis() {
    if (!currentRetro) return;
    const res = await fetch(
      `/api/retro/sessions/${encodeURIComponent(currentRetro.sprint_code)}/ai-pulse`,
      { method: 'POST' }
    );
    const updated = await res.json();
    setRetroSessions((prev) =>
      prev.map((r) => (r.sprint_code === updated.sprint_code ? updated : r))
    );
    notify('Team Pulse analysis updated with AI.');
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRetro || !newNoteText.trim()) return;
    await updateRetro({ notes: [...currentRetro.notes, newNoteText.trim()] });
    setNewNoteText('');
  }

  async function handleDeleteNote(idx: number) {
    if (!currentRetro) return;
    const nextNotes = currentRetro.notes.filter((_, i) => i !== idx);
    await updateRetro({ notes: nextNotes });
  }

  async function handleAiSuggestTasks() {
    if (!currentRetro) return;
    const res = await fetch(
      `/api/retro/sessions/${encodeURIComponent(currentRetro.sprint_code)}/ai-tasks`,
      { method: 'POST' }
    );
    const updated = await res.json();
    setRetroSessions((prev) =>
      prev.map((r) => (r.sprint_code === updated.sprint_code ? updated : r))
    );
    notify('Suggested Action Items added to Tasks.');
  }

  async function handleToggleTask(taskId: string) {
    if (!currentRetro) return;
    const updated = currentRetro.tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    await updateRetro({ tasks: updated });
  }

  async function handleDeleteTask(taskId: string) {
    if (!currentRetro) return;
    const updated = currentRetro.tasks.filter((t) => t.id !== taskId);
    await updateRetro({ tasks: updated });
  }

  async function handleChangeTaskAssignee(taskId: string, assignee: string) {
    if (!currentRetro) return;
    const updated = currentRetro.tasks.map((t) =>
      t.id === taskId ? { ...t, assignee } : t
    );
    await updateRetro({ tasks: updated });
  }

  function handleSendTaskEmail(tsk: RetroTask) {
    if (!currentRetro) return;
    const memberDetail =
      (currentRetro.team_members_detail || []).find(
        (m) => m.name.toLowerCase() === tsk.assignee.toLowerCase()
      ) ||
      teams
        .flatMap((t) => t.members)
        .find((m) => m.name.toLowerCase() === tsk.assignee.toLowerCase());

    const targetEmail =
      memberDetail?.email?.trim() ||
      (memberDetail?.netid ? `${memberDetail.netid.trim()}@aptiv.com` : '') ||
      `${tsk.assignee.toLowerCase().replace(/\s+/g, '.')}@aptiv.com`;

    const subject = `[Action Item] ${currentRetro.sprint_code}: Reminder for @${tsk.assignee}`;
    const body = `Hi ${tsk.assignee},\n\nThis is a reminder for your assigned Action Item from Sprint Retrospective (${currentRetro.sprint_code}):\n\n• Task: ${tsk.text}\n• Status: ${tsk.done ? 'Done' : 'Pending'}\n• Sprint: ${currentRetro.sprint_code}\n\nBest regards,\nScrum Team`;
    const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    notify(`Opening Outlook email reminder for @${tsk.assignee} (${targetEmail})...`);
  }

  async function handleAddManualTask(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRetro || !newTaskText.trim()) return;
    const newTask = {
      id: `tsk-${Date.now()}`,
      text: newTaskText.trim(),
      done: false,
      assignee: 'Jackie',
    };
    await updateRetro({ tasks: [...currentRetro.tasks, newTask] });
    setNewTaskText('');
  }

  function handleDownloadRetroReport() {
    if (!currentRetro) return;
    const lines = [
      `# Retrospective Report — ${currentRetro.sprint_code}`,
      `Meeting Date: ${currentRetro.meeting_date}`,
      `Sprint Period: ${currentRetro.start_date} to ${currentRetro.end_date}`,
      `Attendees: ${currentRetro.attendees.filter((a) => a.present).map((a) => a.name).join(', ')}`,
      '',
      `## 1. Metrics & Sprint Completion (${currentRetro.sprint_completion_pct}%)`,
      ...currentRetro.sp_breakdown.map((b) => {
        const planned = b.total_planned_sp ?? (b.completed_sp + (b.shifted_sp || 0));
        const pct = b.completion_pct ?? (planned > 0 ? Math.round((b.completed_sp / planned) * 100) : 0);
        const added = b.added_sp ? ` | +${b.added_sp} SP Added` : '';
        const removed = b.removed_sp ? ` | -${b.removed_sp} SP Removed` : '';
        return `- Board ${b.board} (${pct}%): ${b.completed_sp} SP Done${added}${removed}`;
      }),
      `- Achieved Velocity: ${currentRetro.velocity_achieved} SP (Historical Average: ${currentRetro.avg_velocity} SP)`,
      '',
      `## 2. Team Pulse`,
      `AI Summary: ${currentRetro.pulse_ai_summary}`,
      ...currentRetro.pulse_items.map(
        (p) => `- [${PULSE_BADGES[p.type].label.toUpperCase()}] ${p.text}`
      ),
      '',
      `## 3. Meeting Notes`,
      ...currentRetro.notes.map((n) => `- ${n}`),
      '',
      `## 4. Tasks (Action Items)`,
      ...currentRetro.tasks.map(
        (t) =>
          `- [${t.done ? 'x' : ' '}] ${t.text} (@${t.assignee})${
            t.carried_from_sprint ? ` [Carried over from ${t.carried_from_sprint}]` : ''
          }`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Retro_Report_${currentRetro.sprint_code.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Report for ${currentRetro.sprint_code} downloaded.`);
  }

  async function handleCreateNewRetro(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/retro/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRetroForm),
    });
    const created = await res.json();
    const allRes = await fetch('/api/retro/sessions');
    setRetroSessions(await allRes.json());
    setSelectedRetroCode(created.sprint_code);
    setShowNewRetroModal(false);
    notify(`Retrospective ${created.sprint_code} created (unfinished tasks carried over automatically).`);
  }

  // =========================================================================
  // SPRINT PLANNING HANDLERS
  // =========================================================================
  async function savePlanningChanges(
    nextThemes?: PlanningThemeCard[],
    nextVacations?: Record<string, number>
  ) {
    if (!planning) return;
    const res = await fetch(
      `/api/planning/${encodeURIComponent(planning.sprint_code)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themes: nextThemes ?? planning.themes,
          vacations: nextVacations ?? planning.vacations,
        }),
      }
    );
    const updated = await res.json();
    setPlanning(updated);
  }

  async function handleApplyVacation() {
    if (!planning) return;
    const nextVac = { ...planning.vacations, [vacPerson]: vacDays };
    await savePlanningChanges(undefined, nextVac);
    setShowVacationBox(false);
    notify(`Vacations applied for ${vacPerson} (${vacDays}d / -${vacDays * 2} SP).`);
  }

  function sortThemesByPriority(
    list: PlanningThemeCard[],
    prioritizeId?: string
  ): PlanningThemeCard[] {
    return [...list].sort((a, b) => {
      const wA = PRIORITY_WEIGHT[a.priority] ?? 1;
      const wB = PRIORITY_WEIGHT[b.priority] ?? 1;
      if (wA !== wB) return wA - wB;
      if (prioritizeId) {
        if (a.id === prioritizeId) return -1;
        if (b.id === prioritizeId) return 1;
      }
      return 0;
    });
  }

  async function handleUpdateTheme(
    themeId: string,
    patch: Partial<PlanningThemeCard>
  ) {
    if (!planning) return;
    const PrioritySpMap: Record<string, number> = { High: 4, Mid: 3, Low: 2 };
    let nextThemes = planning.themes.map((th) => {
      if (th.id !== themeId) return th;
      const merged = { ...th, ...patch };
      if (patch.priority && patch.sp_per_person === undefined) {
        merged.sp_per_person = PrioritySpMap[patch.priority] || th.sp_per_person;
      }
      return merged;
    });

    if (patch.priority) {
      nextThemes = sortThemesByPriority(nextThemes, themeId);
    }
    if (patch.active === false) {
      setSessionSkippedThemeIds((prev) =>
        prev.includes(themeId) ? prev : [...prev, themeId]
      );
      setSelectedThemeIds((prev) => prev.filter((id) => id !== themeId));
    } else if (patch.active === true) {
      setSessionSkippedThemeIds((prev) => prev.filter((id) => id !== themeId));
      setSelectedThemeIds((prev) =>
        prev.includes(themeId) ? prev : [...prev, themeId]
      );
    }

    await savePlanningChanges(nextThemes, undefined);
  }

  function handleToggleSelectThemeForTickets(themeId: string) {
    setSelectedThemeIds((prev) =>
      prev.includes(themeId)
        ? prev.filter((id) => id !== themeId)
        : [...prev, themeId]
    );
  }

  async function handleDropThemeCard(targetId: string) {
    if (!planning || !draggedThemeId || draggedThemeId === targetId) {
      setDraggedThemeId(null);
      setDragOverThemeId(null);
      return;
    }
    const movedId = draggedThemeId;
    const items = [...planning.themes];
    const fromIdx = items.findIndex((t) => t.id === draggedThemeId);
    const toIdx = items.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedThemeId(null);
      setDragOverThemeId(null);
      return;
    }
    const [moved] = items.splice(fromIdx, 1);
    const targetCard = planning.themes[toIdx];
    if (targetCard && moved.priority !== targetCard.priority) {
      moved.priority = targetCard.priority;
    }
    items.splice(toIdx, 0, moved);
    setDraggedThemeId(null);
    setDragOverThemeId(null);
    setRecentlyDroppedId(movedId);
    setTimeout(() => setRecentlyDroppedId(null), 700);
    await savePlanningChanges(items, undefined);
  }

  async function handleToggleThemeAssignee(theme: PlanningThemeCard, member: string) {
    const exists = theme.assignees.includes(member);
    const nextAssignees = exists
      ? theme.assignees.filter((m) => m !== member)
      : [...theme.assignees, member];
    await handleUpdateTheme(theme.id, { assignees: nextAssignees });
  }

  async function handleAddCustomTheme(e: React.FormEvent) {
    e.preventDefault();
    if (!planning || !newThemeForm.title.trim()) return;
    const newCard: PlanningThemeCard = {
      id: `theme-${Date.now()}`,
      title: newThemeForm.title.trim(),
      board: newThemeForm.board,
      priority: newThemeForm.priority,
      sp_per_person: newThemeForm.sp_per_person,
      assignees: newThemeForm.assignees,
      active: true,
      aspice: newThemeForm.aspice || 'V/SS-SYS.4',
      description: newThemeForm.description || '',
      acceptance_criteria: newThemeForm.acceptance_criteria || '',
    };
    const nextThemes = sortThemesByPriority(
      [...planning.themes, newCard],
      newCard.id
    );
    await savePlanningChanges(nextThemes, undefined);
    setSelectedThemeIds((prev) => [...prev, newCard.id]);
    setShowAddThemeModal(false);
    setNewThemeForm({
      title: '',
      board: 'HJJ',
      priority: 'High',
      sp_per_person: 3,
      assignees: ['Jackie'],
      aspice: 'V/SS-SYS.4',
      description: '',
      acceptance_criteria: '',
    });
    notify(`Work item "${newCard.title}" added to the Sprint.`);
  }

  async function handleCreateJiraTicketsFromThemes() {
    if (!planning) return;
    const activeSelected = selectedThemeIds.filter((id) =>
      planning.themes.some((t) => t.id === id && t.active)
    );
    if (activeSelected.length === 0) {
      notify('Please select at least one work item card to create Jira tickets.');
      return;
    }
    const res = await fetch(
      `/api/planning/${encodeURIComponent(planning.sprint_code)}/create-jira-tickets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_ids: activeSelected }),
      }
    );
    const updated: SprintPlanningState = await res.json();
    setPlanning(updated);
    notify(
      `Created ${updated.created_tickets.length} tickets in Jira for ${activeSelected.length} selected item(s).`
    );
  }

  async function handleStartSprint() {
    if (!planning) return;
    try {
      const res = await fetch(
        `/api/planning/${encodeURIComponent(planning.sprint_code)}/start-sprint`,
        { method: 'POST' }
      );
      const updated: SprintPlanningState = await res.json();
      setPlanning(updated);
      setPlanningSprints((prev) =>
        prev.map((p) =>
          p.sprint_code === updated.sprint_code ? { ...p, state: updated.state } : p
        )
      );
      notify(`Sprint ${updated.sprint_code} started in Jira.`);
    } catch {
      notify('Error starting sprint in Jira.');
    }
  }

  const activeThemes = planning?.themes.filter((t) => t.active) || [];
  const removedThemes =
    planning?.themes.filter(
      (t) => !t.active && sessionSkippedThemeIds.includes(t.id)
    ) || [];
  const filteredActiveThemes = activeThemes.filter((th) => {
    if (boardFilter !== 'All' && th.board !== boardFilter) return false;
    if (selectedPersonFilter && !th.assignees.includes(selectedPersonFilter)) return false;
    return true;
  });
  const latestPlanningSprint = planningSprints[planningSprints.length - 1];
  const canCreateNewPlanning = true; // Permanently enabled per request

  async function loadTeams() {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        const active = data.find((t: any) => t.is_active) || data[0];
        if (active) {
          setSelectedTeamId(active.id);
          setTeamFormName(active.name);
          setTeamFormMembers(active.members || []);
        }
      }
    } catch (err) {
      console.error('Error loading teams', err);
    }
  }

  function handleSelectTeam(teamId: number) {
    setSelectedTeamId(teamId);
    const found = teams.find((t) => t.id === teamId);
    if (found) {
      setTeamFormName(found.name);
      setTeamFormMembers(found.members || []);
    }
  }

  function handleAddMember() {
    if (!newMemberName.trim()) return;
    const nid = newMemberNetid.trim().toLowerCase();
    const mail =
      newMemberEmail.trim() ||
      (nid
        ? `${nid}@aptiv.com`
        : `${newMemberName.trim().toLowerCase().replace(/\s+/g, '.')}@aptiv.com`);
    setTeamFormMembers((prev) => [
      ...prev,
      { name: newMemberName.trim(), netid: nid, email: mail },
    ]);
    setNewMemberName('');
    setNewMemberNetid('');
    setNewMemberEmail('');
  }

  function handleUpdateMember(
    index: number,
    field: 'name' | 'netid' | 'email',
    value: string
  ) {
    setTeamFormMembers((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, [field]: value } : m))
    );
  }

  function handleRemoveMember(index: number) {
    setTeamFormMembers((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleCreateNewTeam() {
    const name = prompt('Enter new team name:', 'New Team');
    if (!name) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          is_active: false,
          members: [
            { name: 'Jackie', netid: '' },
            { name: 'Alberto Garcia', netid: '' },
            { name: 'Bernardo', netid: '' },
          ],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await loadTeams();
        handleSelectTeam(created.id);
        notify(`Team "${created.name}" created.`);
      }
    } catch {
      notify('Error creating team.');
    }
  }

  async function handleSaveTeam(makeActive: boolean = true) {
    if (!selectedTeamId) return;
    setIsSavingTeam(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamFormName,
          is_active: makeActive,
          members: teamFormMembers,
        }),
      });
      if (config) {
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
      }
      if (res.ok) {
        await loadTeams();
        if (planning) {
          const planRes = await fetch(`/api/planning/${encodeURIComponent(planning.sprint_code)}`);
          if (planRes.ok) {
            const planData = await planRes.json();
            const cal = SPRINT_CALENDAR[planData.sprint_code];
            if (cal) {
              planData.start_date = cal[0];
              planData.end_date = cal[1];
            }
            setPlanning(planData);
          }
        }
        const retroRes = await fetch('/api/retro/sessions');
        if (retroRes.ok) {
          const retros = await retroRes.json();
          setRetroSessions(retros);
        }
        notify('Team members and NetIDs saved successfully!');
      } else {
        const errData = await res.json().catch(() => ({}));
        notify(`Failed to save team: ${errData.detail || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error saving team:', err);
      notify(`Error saving team: ${err?.message || 'Network error'}`);
    } finally {
      setIsSavingTeam(false);
    }
  }

  async function handleDeleteTeam() {
    if (!selectedTeamId || teams.length <= 1) return;
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadTeams();
        notify('Team deleted.');
      }
    } catch {
      notify('Error deleting team.');
    }
  }

  async function handleSyncRetroFromJira() {
    if (!currentRetro) return;
    setIsSyncingJiraRetro(true);
    try {
      const res = await fetch(`/api/retro/sessions/${encodeURIComponent(currentRetro.sprint_code)}/sync-jira`, {
        method: 'POST',
      });
      if (res.ok) {
        const updated: RetroSession = await res.json();
        setRetroSessions((prev) =>
          prev.map((s) => (s.sprint_code === updated.sprint_code ? updated : s))
        );
        setSelectedRetroCode(updated.sprint_code);
        notify(`Synced Sprint ${updated.sprint_code} from Jira! (Completed SP: ${updated.velocity_achieved}, Completion: ${updated.sprint_completion_pct}%)`);
      } else {
        const errData = await res.json().catch(() => ({}));
        notify(`Failed to sync retrospective from Jira: ${errData.detail || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error syncing Jira:', err);
      notify(`Error connecting to Jira to sync sprint: ${err?.message || 'Network error'}`);
    } finally {
      setIsSyncingJiraRetro(false);
    }
  }

  async function handleTestJiraConnection() {
    if (!config) return;
    setJiraTestStatus({ state: 'testing' });
    try {
      const res = await fetch('/api/config/test-jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_url: config.base_url,
          email: config.email,
          api_token: config.api_token,
          mode: config.mode,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setJiraTestStatus({
          state: 'success',
          message: data.message,
          user: data.user,
          username: data.username,
          auth_type: data.auth_type,
          projects: data.projects,
        });
      } else {
        setJiraTestStatus({
          state: 'error',
          message: data.message || 'Error connecting to Jira.',
        });
      }
    } catch (err: any) {
      setJiraTestStatus({
        state: 'error',
        message: `Network error connecting to Jira: ${err?.message || err}`,
      });
    }
  }

  async function handleSaveConfig(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!config) return;
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        notify('Jira configuration saved successfully.');
        setShowSettingsModal(false);
      } else {
        notify('Error saving Jira configuration.');
      }
    } catch {
      notify('Error communicating with the server.');
    }
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        darkMode
          ? 'dark bg-[#121417] text-slate-100'
          : 'bg-[#c5cedb] text-slate-900'
      }`}
    >
      {/* MINIMALIST TOP HEADER */}
      <header
        className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 ${
          darkMode
            ? 'bg-[#1a1d21] border-slate-800'
            : 'bg-[#eef2f7] border-slate-300 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Simple Scrum</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Sprint Ceremonies
              </p>
            </div>
          </div>

          {/* Main Switcher: Sprint Planning | Sprint Retrospective */}
          <div
            className={`flex p-1 rounded-xl border ${
              darkMode
                ? 'bg-[#121417] border-slate-800'
                : 'bg-[#dde3ec] border-slate-300'
            }`}
          >
            <button
              onClick={() => setMainTab('planning')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                mainTab === 'planning'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              Sprint Planning
            </button>
            <button
              onClick={() => setMainTab('retro')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                mainTab === 'retro'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              Sprint Retrospective
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config && (
            <button
              type="button"
              onClick={() => {
                setJiraTestStatus({ state: 'idle' });
                setShowJiraModal(true);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                config.mode === 'live' && config.api_token
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                  : darkMode
                  ? 'bg-[#121417] border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs'
              }`}
              title="Configuración de Jira Corporativo Aptiv"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  config.mode === 'live' && config.api_token
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>
                {config.mode === 'live' && config.api_token
                  ? 'Jira Aptiv Live'
                  : 'Jira Aptiv Off'}
              </span>
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-amber-300'
                : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
            }`}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-2 rounded-xl border ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-white border-slate-300 text-slate-700 shadow-2xs'
            }`}
            title="Team & Ceremony Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="bg-indigo-600 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 pb-6 w-full max-w-none mx-auto">
        {mainTab === 'planning' && planning ? (
          <div className="space-y-3">
            {/* ROW 1 (Option A style): PI Dropdowns on Left + New Planning Button on Right */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mr-1">
                  Sprints:
                </span>
                {PI_LIST.map((pi) => {
                  const existingPlanSet = new Set(
                    planningSprints.map((p) => p.sprint_code)
                  );
                  const availableSubs = SPRINT_SUB_ITEMS.filter((sub) =>
                    existingPlanSet.has(`${pi} ${sub}`)
                  );
                  if (availableSubs.length === 0) return null;

                  const isCurrentPi = selectedPlanningCode.startsWith(pi);
                  const activeSub = isCurrentPi
                    ? selectedPlanningCode.split(' ')[1]
                    : null;
                  const menuKey = `plan-${pi}`;
                  const isOpen = openPiMenu === menuKey;

                  return (
                    <div
                      key={pi}
                      className="relative"
                      onMouseEnter={() => setOpenPiMenu(menuKey)}
                      onMouseLeave={() => setOpenPiMenu(null)}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPiMenu(isOpen ? null : menuKey)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          isCurrentPi
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : darkMode
                            ? 'bg-[#1a1d21] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-[#eef2f7] border-slate-300 text-slate-800 hover:bg-white shadow-2xs'
                        }`}
                      >
                        <span>{isCurrentPi && activeSub ? `${pi} · ${activeSub}` : pi}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="absolute left-0 top-full pt-1.5 z-40 min-w-[155px]">
                          <div
                            className={`p-1.5 rounded-xl border shadow-xl space-y-0.5 ${
                              darkMode
                                ? 'bg-[#1a1d21] border-slate-700'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {availableSubs.map((sub) => {
                              const fullCode = `${pi} ${sub}`;
                              const isSelected = selectedPlanningCode === fullCode;
                              const dates = SPRINT_CALENDAR[fullCode];
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPlanningCode(fullCode);
                                    setOpenPiMenu(null);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between gap-3 transition ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : darkMode
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{sub}</span>
                                  {dates && (
                                    <span
                                      className={`text-[10px] font-semibold tabular-nums ${
                                        isSelected
                                          ? 'text-indigo-100'
                                          : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {dates[0]}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCreateNextPlanning}
                disabled={!canCreateNewPlanning}
                title={
                  canCreateNewPlanning
                    ? 'Create planning for the next sprint'
                    : 'Available once the current sprint is Ended in Jira'
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                  canCreateNewPlanning
                    ? darkMode
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/45 shadow-2xs cursor-pointer'
                      : 'bg-[#bde5d1] hover:bg-[#a6dbc1] text-emerald-950 border-emerald-600/50 shadow-2xs cursor-pointer'
                    : darkMode
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300/45 cursor-not-allowed'
                    : 'bg-[#d5ece0] border-emerald-600/35 text-emerald-900/50 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                New Planning
              </button>
            </div>

            {/* ROW 2 (Option B lower card style): Standalone Card with Current Sprint, Status, Dates & Start Button */}
            <div
              className={`px-4 py-3 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                darkMode
                  ? 'bg-[#1a1d21] border-slate-800'
                  : 'bg-[#eef2f7] border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Sprint
                  </div>
                  <div className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2.5 mt-0.5">
                    <span>Sprint {planning.sprint_code.replace(' ', ' · ')}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        planning.state === 'active'
                          ? darkMode
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-emerald-200 text-emerald-950 border-emerald-500/70'
                          : planning.state === 'ended' || planning.state === 'closed'
                          ? darkMode
                            ? 'bg-slate-700/60 text-slate-300 border-slate-600'
                            : 'bg-slate-300 text-slate-900 border-slate-500/70'
                          : darkMode
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-amber-200 text-amber-950 border-amber-500/70'
                      }`}
                    >
                      {planning.state === 'active'
                        ? 'Started'
                        : planning.state === 'ended' || planning.state === 'closed'
                        ? 'Ended'
                        : 'In Planning'}
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3.5 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                    darkMode
                      ? 'bg-[#121417] border-slate-800 text-slate-300'
                      : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    Start
                  </span>
                  <span className="font-bold tabular-nums tracking-tight text-slate-950 dark:text-slate-100">
                    {formatShortDate(planning.start_date, planning.sprint_code, false)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600 font-bold">
                    →
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    End
                  </span>
                  <span className="font-bold tabular-nums tracking-tight text-slate-950 dark:text-slate-100">
                    {formatShortDate(planning.end_date, planning.sprint_code, true)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartSprint}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" />
                Start Sprint in Jira
              </button>
            </div>

            {/* 3 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* LEFT COLUMN (4 cols) */}
              {(() => {
                const capacity = planning.total_team_available_sp;
                const planned = planning.total_team_planned_sp;
                const isOverCapacity = planned > capacity;
                const isAtCapacity = planned === capacity;
                const capacityMargin = capacity - planned;
                const capacityPct = capacity > 0 ? Math.round((planned / capacity) * 100) : 0;
                const strokeOffset = Math.max(0, 251 - Math.min(251, Math.round((capacityPct / 100) * 251)));
                const velDiff = planned - planning.historical_velocity;
                const devCount = planning.team_members?.length || 6;
                const grossTargetSp = devCount * planning.base_sp_per_person;
                const triageDeductionTotal = devCount * planning.triage_deduction_sp;
                const vacationDeductionTotal = Object.values(planning.vacations || {}).reduce((acc, days) => acc + (days * 2), 0);
                const isNearLimit = capacityPct >= 90 && capacityPct <= 100;
                const isLowCapacity = capacityPct < 50;
                const ringStrokeColor = isOverCapacity
                  ? '#f43f5e'
                  : isNearLimit || isLowCapacity
                  ? '#f59e0b'
                  : '#10b981';
                const capacityStatusColor = isOverCapacity
                  ? 'text-rose-600 dark:text-rose-400'
                  : isNearLimit || isLowCapacity
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-emerald-500 dark:text-emerald-400';

                return (
                  <div
                    className={`lg:col-span-4 p-4 rounded-2xl border flex flex-col justify-between h-full min-h-[580px] space-y-3 ${
                      darkMode
                        ? 'bg-[#1a1d21] border-slate-800'
                        : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="h-7 px-1 flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                        Velocity & Capacity
                      </h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                          isOverCapacity
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400'
                            : isNearLimit || isLowCapacity
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {isOverCapacity
                          ? '⚠️ Over Capacity'
                          : isNearLimit
                          ? '⚠️ Approaching Limit'
                          : isLowCapacity
                          ? '⚠️ Below Capacity'
                          : '✓ Within Capacity'}
                      </span>
                    </div>

                    {/* Centered Circular Progress Ring (Apple fluid animated gauge) */}
                    <VelocityCapacityGauge
                      key={`velocity-gauge-${planning.sprint_code}`}
                      planned={planned}
                      capacity={capacity}
                      capacityPct={capacityPct}
                      ringStrokeColor={ringStrokeColor}
                      capacityStatusColor={capacityStatusColor}
                      isOverCapacity={isOverCapacity}
                      isNearLimit={isNearLimit}
                      isLowCapacity={isLowCapacity}
                      darkMode={darkMode}
                    />

                    {/* Horizontal Math Equation: [Capacity] − [Planned] = [Margin] */}
                    <div
                      className={`p-2.5 rounded-xl border space-y-2 ${
                        darkMode
                          ? 'bg-[#121417] border-slate-800'
                          : 'bg-white border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-0.5">
                        <span>Capacity Balance</span>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-center">
                        {/* 1. Team Capacity */}
                        <div
                          className={`flex-1 py-2 px-1 rounded-lg border ${
                            darkMode
                              ? 'bg-[#181c22] border-slate-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block leading-tight">
                            Capacity
                          </span>
                          <span className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white block mt-1">
                            {capacity} SP
                          </span>
                        </div>

                        {/* Minus sign - centered with optical nudge */}
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none ${
                            darkMode
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="-translate-y-[1px] leading-none">−</span>
                        </span>

                        {/* 2. Planned SP */}
                        <div
                          className={`flex-1 py-2 px-1 rounded-lg border ${
                            darkMode
                              ? 'bg-[#181c22] border-slate-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block leading-tight">
                            Planned
                          </span>
                          <span className="text-sm font-extrabold tabular-nums block mt-1 text-indigo-600 dark:text-indigo-400">
                            {planned} SP
                          </span>
                        </div>

                        {/* Equals sign - centered with optical nudge */}
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none ${
                            darkMode
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="-translate-y-[1px] leading-none">=</span>
                        </span>

                        {/* 3. Margin Result Box */}
                        <div
                          className={`flex-1 py-2 px-1 rounded-lg border ${
                            isOverCapacity
                              ? darkMode
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-rose-50 border-rose-300 text-rose-800'
                              : isAtCapacity
                              ? darkMode
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                              : darkMode
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase block leading-tight">
                            {isOverCapacity
                              ? 'Over'
                              : isAtCapacity
                              ? 'At Limit'
                              : 'Margin'}
                          </span>
                          <span className="text-sm font-extrabold tabular-nums block mt-1">
                            {isOverCapacity
                              ? `+${planned - capacity} SP`
                              : isAtCapacity
                              ? '0 SP'
                              : `+${capacityMargin} SP`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Historical Velocity */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        darkMode
                          ? 'bg-[#121417] border-slate-800'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold block">
                          Historical Velocity:
                        </span>
                        <span
                          className={`text-[10px] font-bold block ${
                            velDiff > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {velDiff > 0
                            ? `+${velDiff} SP vs average`
                            : velDiff < 0
                            ? `−${Math.abs(velDiff)} SP vs average`
                            : 'Exact average'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {planning.historical_velocity} SP
                      </span>
                    </div>

                    {/* Collapsible Capacity Origin */}
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setShowCapacityDetails(!showCapacityDetails)}
                        className={`w-full py-1.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-between transition ${
                          darkMode
                            ? 'bg-[#121417] border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-500" />
                          How capacity is calculated
                        </span>
                        {showCapacityDetails ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {showCapacityDetails && (
                        <div
                          className={`p-2.5 rounded-xl border text-[11px] space-y-1 transition-all ${
                            darkMode
                              ? 'bg-[#121417] border-slate-800 text-slate-400'
                              : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>Base target ({devCount} × 20 SP):</span>
                            <span className="font-bold text-slate-900 dark:text-slate-200">
                              {grossTargetSp} SP
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Triage (~50%):</span>
                            <span className="font-bold text-slate-900 dark:text-slate-200">
                              −{triageDeductionTotal} SP
                            </span>
                          </div>
                          {vacationDeductionTotal > 0 && (
                            <div className="flex justify-between text-amber-600 dark:text-amber-400">
                              <span>Vacation deductions:</span>
                              <span className="font-bold">−{vacationDeductionTotal} SP</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1 font-bold text-slate-900 dark:text-slate-100">
                            <span>= Net Team Capacity:</span>
                            <span>{capacity} SP</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vacation Drawer Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowVacationBox(!showVacationBox)}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                          darkMode
                            ? 'bg-[#121417] border-slate-800 hover:bg-slate-800'
                            : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Palmtree className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                          Add Vacations
                        </span>
                        {showVacationBox ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {showVacationBox && (
                        <div className="p-3 rounded-xl border border-amber-500/50 bg-amber-500/15 space-y-2 text-xs">
                          <div>
                            <label className="block text-slate-900 dark:text-slate-300 font-bold mb-1">
                              Team Member:
                            </label>
                            <div className="relative">
                              <select
                                value={vacPerson}
                                onChange={(e) => setVacPerson(e.target.value)}
                                className={`w-full appearance-none pl-3 pr-9 py-1.5 rounded-lg border font-medium cursor-pointer ${
                                  darkMode
                                    ? 'bg-[#1a1d21] border-slate-700 text-slate-200'
                                    : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              >
                                {planning.team_members.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-900 dark:text-slate-300 font-bold mb-1">
                              Vacation days (1 day = 2 SP):
                            </label>
                            <div className="relative">
                              <select
                                value={vacDays}
                                onChange={(e) => setVacDays(Number(e.target.value))}
                                className={`w-full appearance-none pl-3 pr-9 py-1.5 rounded-lg border font-medium cursor-pointer ${
                                  darkMode
                                    ? 'bg-[#1a1d21] border-slate-700 text-slate-200'
                                    : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                                  <option key={d} value={d}>
                                    {d} {d === 1 ? 'day off' : 'days off'} (-{d * 2} SP)
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          <button
                            onClick={handleApplyVacation}
                            className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                          >
                            Apply Vacations
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* CENTER COLUMN (5 cols) */}
              <div
                className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between h-full min-h-[580px] min-h-0 ${
                  darkMode
                    ? 'bg-[#1a1d21] border-slate-800'
                    : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                }`}
              >
                {(() => {
                  const areAllSelected =
                    filteredActiveThemes.length > 0 &&
                    filteredActiveThemes.every((t) => selectedThemeIds.includes(t.id));

                  function handleToggleSelectAll() {
                    if (areAllSelected) {
                      setSelectedThemeIds((prev) =>
                        prev.filter((id) => !filteredActiveThemes.some((t) => t.id === id))
                      );
                    } else {
                      const idsToAdd = filteredActiveThemes.map((t) => t.id);
                      setSelectedThemeIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
                    }
                  }

                  return (
                    <div className="flex flex-col gap-2 shrink-0 mb-3">
                      {/* Header */}
                      <div className="h-7 px-1 flex items-center justify-between">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                          Sprint Work Items
                        </h3>
                        <button
                          onClick={() => setShowAddThemeModal(true)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                        >
                          + Add Item
                        </button>
                      </div>

                      {/* Quick Board Filter Tabs & Active Filter Pill + Select All aligned right */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className={`inline-flex p-0.5 rounded-lg border text-xs font-bold ${
                              darkMode
                                ? 'bg-[#121417] border-slate-800'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {(['All', 'HJJ', 'HAO'] as const).map((b) => {
                              const count =
                                b === 'All'
                                  ? activeThemes.length
                                  : activeThemes.filter((t) => t.board === b).length;
                              const isCurrent = boardFilter === b;
                              return (
                                <button
                                  key={b}
                                  onClick={() => setBoardFilter(b)}
                                  className={`px-2 py-0.5 rounded-md transition-all ${
                                    isCurrent
                                      ? 'bg-indigo-600 text-white shadow-2xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                  }`}
                                >
                                  {b === 'All' ? 'All Boards' : `Board ${b}`} ({count})
                                </button>
                              );
                            })}
                          </div>

                          {selectedPersonFilter && (
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                                darkMode
                                  ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                                  : 'bg-indigo-50 border-indigo-300 text-indigo-800'
                              }`}
                            >
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{selectedPersonFilter}</span>
                              <button
                                onClick={() => setSelectedPersonFilter(null)}
                                title="Clear person filter"
                                className="ml-0.5 p-0.5 rounded hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-auto"
                        >
                          {areAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const count = filteredActiveThemes.length;
                  const hasSkipped = removedThemes.length > 0;
                  const isCompact = count >= 6 || (count >= 5 && hasSkipped);

                  return (
                    <div
                      className={`flex-1 min-h-0 overflow-y-auto flex flex-col ${
                        isCompact ? 'gap-1.5' : 'gap-2'
                      } pr-1 pt-1.5`}
                    >
                      {filteredActiveThemes.length === 0 ? (
                        <div
                          className={`p-6 rounded-xl border text-center space-y-2 ${
                            darkMode
                              ? 'bg-[#121417]/50 border-slate-800 text-slate-400'
                              : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          <p className="text-xs font-medium">No work items match the active filters.</p>
                          <button
                            onClick={() => {
                              setBoardFilter('All');
                              setSelectedPersonFilter(null);
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline hover:no-underline"
                          >
                            Reset filters
                          </button>
                        </div>
                      ) : (
                        filteredActiveThemes.map((th, thIdx) => {
                        const isExpanded = expandedThemeId === th.id;
                        const isSelectedForTickets = selectedThemeIds.includes(th.id);
                        const prioStyle =
                          th.priority === 'High'
                            ? darkMode
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-rose-200 text-rose-950 border-rose-500/60'
                            : th.priority === 'Mid'
                            ? darkMode
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-200 text-amber-950 border-amber-500/60'
                            : darkMode
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-sky-200 text-sky-950 border-sky-500/60';

                          const isDropdownOpen = activeAssigneeDropdownThemeId === th.id;

                          return (
                            <div
                              key={th.id}
                              draggable
                              onDragStart={() => setDraggedThemeId(th.id)}
                              onDragEnd={() => {
                                setDraggedThemeId(null);
                                setDragOverThemeId(null);
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                if (draggedThemeId && draggedThemeId !== th.id) {
                                  setDragOverThemeId(th.id);
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }}
                              onDragLeave={(e) => {
                                if (dragOverThemeId === th.id) {
                                  setDragOverThemeId(null);
                                }
                              }}
                              onDrop={() => handleDropThemeCard(th.id)}
                              onClick={() => handleToggleSelectThemeForTickets(th.id)}
                              role="button"
                              tabIndex={0}
                              title="Click to select for Jira tickets · Drag to reorder"
                              className={`relative ${
                                isExpanded
                                  ? 'flex-none p-3.5 space-y-2'
                                  : count >= 7
                                  ? 'shrink-0 h-[53px] px-3.5 py-1.5 flex flex-col justify-center'
                                  : count === 6 || (count === 5 && hasSkipped)
                                  ? 'flex-1 min-h-[48px] max-h-[55px] px-3.5 py-1.5 flex flex-col justify-center'
                                  : count === 5
                                  ? 'flex-1 min-h-[56px] max-h-[66px] px-3.5 py-2.5 flex flex-col justify-center'
                                  : count === 4
                                  ? 'flex-1 min-h-[66px] max-h-[80px] px-3.5 py-3 flex flex-col justify-center'
                                  : 'flex-none min-h-[62px] max-h-[70px] px-3.5 py-3 flex flex-col justify-center'
                              } rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                                isDropdownOpen
                                  ? 'z-40'
                                  : !activeAssigneeDropdownThemeId
                                  ? 'z-0 hover:z-10 hover:-translate-y-0.5 hover:shadow-md'
                                  : 'z-0'
                              } ${
                                draggedThemeId === th.id
                                  ? 'opacity-35 scale-[0.98] border-dashed border-indigo-500/80 rotate-1 shadow-inner'
                                  : dragOverThemeId === th.id
                                  ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#1a1d21] bg-indigo-500/15 scale-[1.01] border-indigo-500 shadow-lg'
                                  : recentlyDroppedId === th.id
                                  ? 'ring-2 ring-emerald-500/60 bg-emerald-500/10 scale-[1.01]'
                                  : ''
                              } ${
                                isSelectedForTickets || isDropdownOpen
                                  ? darkMode
                                    ? 'bg-[#121417] border-slate-700 shadow-2xs opacity-100 hover:border-slate-600'
                                    : 'bg-white border-slate-300 shadow-2xs opacity-100 hover:border-slate-400'
                                  : darkMode
                                  ? 'bg-[#121417]/60 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-slate-700'
                                  : 'bg-white/60 border-slate-300/70 opacity-60 hover:opacity-90 hover:border-slate-400'
                              }`}
                            >
                            <div className={`flex items-center justify-between gap-2 ${
                              isCompact ? 'min-h-[28px]' : 'min-h-[32px]'
                            }`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold border shrink-0 ${
                                    th.board === 'HJJ'
                                      ? darkMode
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35'
                                        : 'bg-indigo-200 text-indigo-950 border-indigo-500/60'
                                      : darkMode
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                                        : 'bg-emerald-200 text-emerald-950 border-emerald-500/60'
                                  }`}
                                >
                                  {th.board}
                                </span>
                                <input
                                  type="text"
                                  value={th.title}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    handleUpdateTheme(th.id, { title: e.target.value })
                                  }
                                  className={`font-bold ${
                                    isCompact ? 'text-[13px]' : 'text-sm'
                                  } bg-transparent border-b border-transparent focus:border-[#2b5b8c] focus:outline-none truncate w-full py-0.5`}
                                />
                              </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Static Priority Badge (No arrow, clean label) */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 select-none ${prioStyle}`}
                            >
                              {th.priority}
                            </span>

                            {/* Static SP Badge (No arrow, clean label) */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border shrink-0 select-none ${
                                darkMode
                                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                                  : 'bg-slate-100 border-slate-300 text-slate-900'
                              }`}
                            >
                              {th.sp_per_person} SP
                            </span>

                            {/* Assignee Dropdown Button (Fitted to the word "Assignee", neutral gray like SP) */}
                            <div className={`relative shrink-0 ${isDropdownOpen ? 'z-50' : ''}`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAssigneeDropdownThemeId(
                                    activeAssigneeDropdownThemeId === th.id ? null : th.id
                                  );
                                }}
                                title={
                                  th.assignees.length === 0
                                    ? 'No assignees'
                                    : `Assigned: ${th.assignees.join(', ')}`
                                }
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1 transition shadow-2xs shrink-0 ${
                                  th.assignees.length === 0
                                    ? darkMode
                                      ? 'bg-slate-800/80 border-dashed border-amber-500/50 text-amber-400 hover:bg-slate-800'
                                      : 'bg-slate-100/80 border-dashed border-amber-500/50 text-amber-700 hover:bg-slate-200'
                                    : darkMode
                                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600'
                                    : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200 hover:border-slate-400'
                                }`}
                              >
                                <span>Assignee</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
                              </button>

                              {/* Assignee Checklist Popover */}
                              {activeAssigneeDropdownThemeId === th.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute right-0 ${
                                    thIdx >= filteredActiveThemes.length - 2 &&
                                    filteredActiveThemes.length >= 4
                                      ? 'bottom-full mb-1.5'
                                      : 'top-full mt-1.5'
                                  } w-60 rounded-xl border shadow-2xl p-2 z-50 text-xs space-y-1 ${
                                    darkMode
                                      ? 'bg-[#1a1d21] border-slate-700 text-slate-100 shadow-black/80'
                                      : 'bg-white border-slate-300 text-slate-900 shadow-slate-900/20'
                                  }`}
                                >
                                  <div
                                    className={`px-2 py-1 text-[10px] font-extrabold uppercase border-b flex justify-between ${
                                      darkMode
                                        ? 'border-slate-800 text-slate-400'
                                        : 'border-slate-200 text-slate-500'
                                    }`}
                                  >
                                    <span>Assign Developer</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                      Planned SP
                                    </span>
                                  </div>
                                  <div className="space-y-0.5 pt-1 max-h-48 overflow-y-auto">
                                    {planning.team_members.map((member) => {
                                      const isAssigned = th.assignees.includes(member);
                                      const personInfo = planning.person_summary?.find(
                                        (p) => p.name === member
                                      );
                                      return (
                                        <div
                                          key={member}
                                          onClick={() => handleToggleThemeAssignee(th, member)}
                                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition select-none ${
                                            isAssigned
                                              ? darkMode
                                                ? 'bg-indigo-950/70 text-indigo-200 font-semibold'
                                                : 'bg-indigo-50 text-indigo-900 font-semibold'
                                              : darkMode
                                              ? 'hover:bg-slate-800 text-slate-300'
                                              : 'hover:bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isAssigned}
                                              onChange={() => {}}
                                              className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
                                            />
                                            <span className={isAssigned ? 'font-bold' : ''}>
                                              {member}
                                            </span>
                                          </div>
                                          {personInfo && (
                                            <span
                                              className={`text-[10px] font-mono px-1 py-0.5 rounded font-bold ${
                                                personInfo.overloaded
                                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                  : 'text-slate-400 dark:text-slate-500'
                                              }`}
                                            >
                                              {personInfo.planned_sp}/{personInfo.max_sp} SP
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tightly grouped Details and Delete buttons */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              {/* Details Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedThemeId(isExpanded ? null : th.id);
                                }}
                                title="View/Edit Details, Priority, SP, and ASPICE"
                                className={`p-1 rounded-md transition flex items-center gap-0.5 text-xs font-bold ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white'
                                    : darkMode
                                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Delete/Skip Button (✕) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTheme(th.id, { active: false });
                                }}
                                title="Skip this item in this Sprint (Remove)"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED DETAILS PANEL (Full editing form for Priority, SP, Board, ASPICE, etc.) */}
                        {isExpanded && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`pt-2.5 border-t space-y-2 text-[11px] ${
                              darkMode ? 'border-slate-800' : 'border-slate-200'
                            }`}
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-slate-900 dark:text-slate-400 font-bold mb-0.5">
                                  Priority:
                                </label>
                                <select
                                  value={th.priority}
                                  onChange={(e) =>
                                    handleUpdateTheme(th.id, {
                                      priority: e.target.value as 'High' | 'Mid' | 'Low',
                                    })
                                  }
                                  className={`w-full px-2 py-1 rounded border text-xs font-bold ${
                                    darkMode
                                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                                      : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <option value="High">High</option>
                                  <option value="Mid">Mid</option>
                                  <option value="Low">Low</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-900 dark:text-slate-400 font-bold mb-0.5">
                                  Story Points:
                                </label>
                                <select
                                  value={th.sp_per_person}
                                  onChange={(e) =>
                                    handleUpdateTheme(th.id, {
                                      sp_per_person: Number(e.target.value),
                                    })
                                  }
                                  className={`w-full px-2 py-1 rounded border text-xs font-mono font-bold ${
                                    darkMode
                                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                                      : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                >
                                  {[1, 2, 3, 4, 5, 6, 8].map((sp) => (
                                    <option key={sp} value={sp}>
                                      {sp} SP
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-900 dark:text-slate-400 font-bold mb-0.5">
                                  Jira Board:
                                </label>
                                <select
                                  value={th.board}
                                  onChange={(e) =>
                                    handleUpdateTheme(th.id, {
                                      board: e.target.value as 'HJJ' | 'HAO',
                                    })
                                  }
                                  className={`w-full px-2 py-1 rounded border text-xs ${
                                    darkMode
                                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                                      : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <option value="HJJ">Board HJJ</option>
                                  <option value="HAO">Board HAO</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-900 dark:text-slate-400 font-bold mb-0.5">
                                  ASPICE Area:
                                </label>
                                <select
                                  value={
                                    ASPICE_OPTIONS.includes(
                                      th.aspice as (typeof ASPICE_OPTIONS)[number]
                                    )
                                      ? th.aspice
                                      : 'V/SS-SYS.4'
                                  }
                                  onChange={(e) =>
                                    handleUpdateTheme(th.id, { aspice: e.target.value })
                                  }
                                  className={`w-full px-2 py-1 rounded border text-xs ${
                                    darkMode
                                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                                      : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                >
                                  {ASPICE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-900 dark:text-slate-400 font-bold mb-0.5">
                                Description
                              </label>
                              <textarea
                                rows={2}
                                value={th.description}
                                onChange={(e) =>
                                  handleUpdateTheme(th.id, { description: e.target.value })
                                }
                                className={`w-full px-2 py-1 rounded border ${
                                  darkMode
                                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                                    : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-slate-900 dark:text-slate-400 font-bold mb-0.5">
                                Acceptance Criteria
                              </label>
                              <textarea
                                rows={2}
                                value={th.acceptance_criteria}
                                onChange={(e) =>
                                  handleUpdateTheme(th.id, {
                                    acceptance_criteria: e.target.value,
                                  })
                                }
                                className={`w-full px-2 py-1 rounded border ${
                                  darkMode
                                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                                    : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                </div>
              );
            })()}

                {/* Skipped this Sprint: only visible during current session when items were skipped */}
                {removedThemes.length > 0 && (
                  <div className="pt-3.5 px-1 flex flex-wrap items-center gap-1.5 text-[10px] shrink-0">
                    <span className="text-slate-900 dark:text-slate-400 font-semibold">
                      Skipped this Sprint:
                    </span>
                    {removedThemes.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => handleUpdateTheme(rt.id, { active: true })}
                        className="px-2 py-0.5 rounded-full border border-dashed border-slate-500 text-slate-800 dark:text-slate-400 hover:text-[#2b5b8c] hover:border-[#2b5b8c] flex items-center gap-1 font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> {rt.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Jira Button: 16px above (matching the 16px container padding below) */}
                <div className="flex justify-center pt-4 shrink-0">
                  <button
                    onClick={handleCreateJiraTicketsFromThemes}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    Create Tickets in Jira
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-between h-full min-h-[580px] space-y-3">
                <div
                  className={`p-4 rounded-2xl border space-y-3 flex flex-col flex-1 min-h-0 ${
                    darkMode
                      ? 'bg-[#1a1d21] border-slate-800'
                      : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                  }`}
                >
                {(() => {
                  const overloadedMembers = planning.person_summary?.filter((p) => p.overloaded) || [];
                  return (
                    <div className="h-7 px-1 flex items-center justify-between gap-1 shrink-0">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                        SP Distribution
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {overloadedMembers.length > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md border bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400">
                            ⚠️ {overloadedMembers.length} Overloaded
                          </span>
                        )}
                        {selectedPersonFilter && (
                          <button
                            onClick={() => setSelectedPersonFilter(null)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1 px-1 shrink-0">
                  Click any member to filter items
                </p>

                <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                  {planning.person_summary.map((p) => {
                    const isSelected = selectedPersonFilter === p.name;
                    const personThemes = activeThemes.filter((th) =>
                      th.assignees.includes(p.name)
                    );
                    const totalReferenceSp = Math.max(p.max_sp, p.planned_sp, 1);

                    const tonePalette = p.overloaded
                      ? ['bg-rose-600', 'bg-rose-500', 'bg-rose-400', 'bg-rose-300']
                      : ['bg-indigo-600', 'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-300'];

                    return (
                      <div
                        key={p.name}
                        onClick={() =>
                          setSelectedPersonFilter(isSelected ? null : p.name)
                        }
                        role="button"
                        tabIndex={0}
                        title={`Click to ${isSelected ? 'clear filter' : `filter work items by ${p.name}`}`}
                        className={`px-3 py-2 rounded-xl border space-y-1 text-[11px] cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md bg-indigo-500/10'
                            : p.overloaded
                            ? 'border-rose-500/50 bg-rose-500/10 hover:border-rose-400'
                            : darkMode
                            ? 'bg-[#121417] border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-300 shadow-2xs hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-950 dark:text-slate-100">
                              {p.name}
                            </span>
                            {p.vacation_days > 0 && (
                              <span
                                className={`px-1.5 py-0.5 rounded border font-bold text-[10px] ${
                                  darkMode
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                    : 'bg-amber-200 text-amber-950 border-amber-500/70'
                                }`}
                              >
                                -{p.vacation_days}d (-{p.vacation_days * 2} SP)
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-bold text-[11px] ${
                              p.overloaded
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-indigo-800 dark:text-indigo-400'
                            }`}
                          >
                            {p.overloaded ? 'Overloaded: ' : ''}
                            {p.planned_sp} / {p.max_sp} SP
                          </span>
                        </div>

                        <div
                          className={`w-full h-1.5 rounded-full flex gap-[2px] p-[1px] ${
                            darkMode ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          {personThemes.map((th, idx) => {
                            const segPct = Math.round(
                              (th.sp_per_person / totalReferenceSp) * 100
                            );
                            const toneClass = tonePalette[idx % tonePalette.length];
                            return (
                              <div
                                key={th.id}
                                style={{ width: `${segPct}%` }}
                                title={`${th.sp_per_person} SP — ${th.title}`}
                                className={`group relative h-full transition-all cursor-pointer first:rounded-l-full last:rounded-r-full hover:brightness-110 ${toneClass}`}
                              >
                                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-semibold whitespace-nowrap shadow-md">
                                  {th.sp_per_person} SP · {th.title}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                </div>

                {planning.created_tickets && planning.created_tickets.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border space-y-3 shrink-0 ${
                      darkMode
                        ? 'bg-[#1a1d21] border-slate-800'
                        : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                        Tickets Created ({planning.created_tickets.length})
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                        {planning.sprint_code}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {planning.created_tickets.map((tk) => (
                        <div
                          key={tk.key}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 text-xs"
                        >
                          <div className="truncate pr-2">
                            {tk.url ? (
                              <a
                                href={tk.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-bold underline underline-offset-2 mr-1.5"
                                title="Open ticket in Jira"
                              >
                                {tk.key}
                              </a>
                            ) : (
                              <span className="font-bold mr-1.5 text-slate-800 dark:text-slate-200">{tk.key}</span>
                            )}{' '}
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {tk.theme || tk.summary}
                            </span>
                          </div>
                          <span className="font-bold shrink-0 text-slate-900 dark:text-slate-200">
                            {tk.story_points} SP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : currentRetro ? (
          <div className="space-y-3">
            {/* ROW 1 (Option A style): PI Dropdowns on Left + New Retro Button on Right */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mr-1">
                  Sprints:
                </span>
                {PI_LIST.map((pi) => {
                  const existingRetroSet = new Set(
                    retroSessions.map((r) => r.sprint_code)
                  );
                  const availableSubs = SPRINT_SUB_ITEMS.filter((sub) =>
                    existingRetroSet.has(`${pi} ${sub}`)
                  );
                  if (availableSubs.length === 0) return null;

                  const isCurrentPi = currentRetro.sprint_code.startsWith(pi);
                  const activeSub = isCurrentPi
                    ? currentRetro.sprint_code.split(' ')[1]
                    : null;
                  const menuKey = `retro-${pi}`;
                  const isOpen = openPiMenu === menuKey;

                  return (
                    <div
                      key={pi}
                      className="relative"
                      onMouseEnter={() => setOpenPiMenu(menuKey)}
                      onMouseLeave={() => setOpenPiMenu(null)}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPiMenu(isOpen ? null : menuKey)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          isCurrentPi
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : darkMode
                            ? 'bg-[#1a1d21] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-[#eef2f7] border-slate-300 text-slate-800 hover:bg-white shadow-2xs'
                        }`}
                      >
                        <span>{isCurrentPi && activeSub ? `${pi} · ${activeSub}` : pi}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="absolute left-0 top-full pt-1.5 z-40 min-w-[155px]">
                          <div
                            className={`p-1.5 rounded-xl border shadow-xl space-y-0.5 ${
                              darkMode
                                ? 'bg-[#1a1d21] border-slate-700'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {availableSubs.map((sub) => {
                              const fullCode = `${pi} ${sub}`;
                              const isSelected = currentRetro.sprint_code === fullCode;
                              const dates = SPRINT_CALENDAR[fullCode];
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => handleSelectRetroSprint(fullCode)}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between gap-3 transition ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : darkMode
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{sub}</span>
                                  {dates && (
                                    <span
                                      className={`text-[10px] font-semibold tabular-nums ${
                                        isSelected
                                          ? 'text-indigo-100'
                                          : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {dates[0]}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCreateNextRetroFromPlanning}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 shadow-2xs transition cursor-pointer ${
                  darkMode
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/45'
                    : 'bg-[#bde5d1] hover:bg-[#a6dbc1] text-emerald-950 border-emerald-600/50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                New Retro
              </button>
            </div>

            {/* ROW 2 (Option B lower card style): Standalone Card with Current Sprint, Dates, Attendance & Download */}
            <div
              className={`px-4 py-3 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                darkMode
                  ? 'bg-[#1a1d21] border-slate-800'
                  : 'bg-[#eef2f7] border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Sprint
                  </div>
                  <div className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2.5 mt-0.5">
                    <span>Sprint {currentRetro.sprint_code.replace(' ', ' · ')}</span>
                  </div>
                </div>

                <div
                  className={`px-3.5 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                    darkMode
                      ? 'bg-[#121417] border-slate-800 text-slate-300'
                      : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    Start
                  </span>
                  <span className="font-bold tabular-nums tracking-tight text-slate-950 dark:text-slate-100">
                    {formatShortDate(currentRetro.start_date, currentRetro.sprint_code, false)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600 font-bold">
                    →
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    End
                  </span>
                  <span className="font-bold tabular-nums tracking-tight text-slate-950 dark:text-slate-100">
                    {formatShortDate(currentRetro.end_date, currentRetro.sprint_code, true)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
                    Attendance:
                  </span>
                  <div className="flex -space-x-1">
                    {currentRetro.attendees.map((att, idx) => (
                      <button
                        key={att.name}
                        onClick={() => handleToggleAttendee(idx)}
                        title={`${att.name} (${att.present ? 'Present' : 'Absent'})`}
                        style={{
                          backgroundColor: att.present ? att.color : '#64748b',
                        }}
                        className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1a1d21] transition ${
                          att.present ? 'opacity-100' : 'opacity-40 line-through'
                        }`}
                      >
                        {att.initials}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSyncRetroFromJira}
                  disabled={isSyncingJiraRetro}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    darkMode
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                      : 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 shadow-2xs'
                  }`}
                  title="Sync completed story points, velocity and completion % directly from Jira boards (HJJ & HAO)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingJiraRetro ? 'animate-spin' : ''}`} />
                  {isSyncingJiraRetro ? 'Syncing...' : 'Sync Jira Sprint'}
                </button>

                <button
                  onClick={handleDownloadRetroReport}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Report
                </button>
              </div>
            </div>

            {/* 4 CLEAN CARDS FOR RETROSPECTIVE */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 items-stretch">
                  {/* LEFT COLUMN (3 cols stacked) - SPRINT COMPLETION & AI SUMMARY */}
                  <div
                    className="xl:col-span-3 flex flex-col gap-3 min-h-0 h-full justify-between"
                  >
                    {/* CARD 1: Sprint Completion */}
                    <div
                      className={`p-3.5 rounded-2xl border space-y-2.5 shrink-0 ${
                        darkMode
                          ? 'bg-[#1a1d21] border-slate-800'
                          : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="h-6 px-1 flex items-center justify-between">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                          Sprint Completion
                        </h3>
                        {currentRetro.sp_breakdown && currentRetro.sp_breakdown.length > 1 && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Avg across {currentRetro.sp_breakdown.length} boards
                          </span>
                        )}
                      </div>

                      <RetroCompletionGauge
                        key={`retro-gauge-${currentRetro.sprint_code}`}
                        targetPct={currentRetro.sprint_completion_pct}
                        darkMode={darkMode}
                      />

                      <div className="space-y-1.5 text-xs">
                        {currentRetro.sp_breakdown.map((b) => {
                          const bPlanned =
                            b.total_planned_sp !== undefined
                              ? b.total_planned_sp
                              : b.completed_sp + (b.shifted_sp || 0);
                          const bPct =
                            b.completion_pct !== undefined
                              ? b.completion_pct
                              : bPlanned > 0
                              ? Math.round((b.completed_sp / bPlanned) * 1000) / 10
                              : 0;
                          const isExpanded = !!expandedBoards[b.board];
                          const allIssues = [
                            ...(b.issues || []),
                            ...(b.removed_issues || []),
                          ];

                          return (
                            <div
                              key={b.board}
                              className={`rounded-xl border transition-all ${
                                darkMode
                                  ? 'bg-[#121417] border-slate-800'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedBoards((prev) => ({
                                    ...prev,
                                    [b.board]: !prev[b.board],
                                  }))
                                }
                                className="w-full p-2 flex items-center justify-between text-left hover:bg-slate-500/5 transition rounded-xl cursor-pointer"
                                title="Click to toggle tickets list"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  )}
                                  <span className="font-bold text-xs truncate">
                                    Board {b.board}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                                    {bPct}%
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-xs">
                                  <b className="text-emerald-700 dark:text-emerald-400">
                                    {b.completed_sp} SP Done
                                  </b>
                                  {(b.added_sp || 0) > 0 && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                      title="Added after sprint started"
                                    >
                                      +{b.added_sp} SP
                                    </span>
                                  )}
                                  {(b.removed_sp || 0) > 0 && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                      title="Removed from sprint"
                                    >
                                      -{b.removed_sp} SP
                                    </span>
                                  )}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="px-2 pb-2 pt-1 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5 max-h-56 overflow-y-auto">
                                  {allIssues.length === 0 ? (
                                    <div className="text-center py-2 text-[11px] text-slate-500 italic">
                                      No tickets found. Click &quot;Sync Jira Sprint&quot; to fetch issues.
                                    </div>
                                  ) : (
                                    allIssues.map((it) => {
                                      const isDone = it.is_done;
                                      const isRemoved = it.is_removed;
                                      const isAdded = it.is_added;

                                      return (
                                        <div
                                          key={it.key}
                                          className={`p-2 rounded-lg border text-xs transition-colors ${
                                            isRemoved
                                              ? 'bg-rose-500/5 border-rose-200 dark:border-rose-900/40 opacity-85'
                                              : isAdded
                                              ? 'bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/40'
                                              : darkMode
                                              ? 'bg-[#181a1e] border-slate-800'
                                              : 'bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <a
                                                href={it.url || `https://jiraprod.aptiv.com/browse/${it.key}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {it.key}
                                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                              </a>

                                              {isAdded && (
                                                <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                                                  + Added
                                                </span>
                                              )}
                                              {isRemoved && (
                                                <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                                                  - Removed
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {isDone ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                                  Done
                                                </span>
                                              ) : isRemoved ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                                  Removed
                                                </span>
                                              ) : (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                                                  {it.status || 'WIP'}
                                                </span>
                                              )}
                                              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">
                                                {it.sp} SP
                                              </span>
                                            </div>
                                          </div>

                                          {it.summary && (
                                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
                                              {it.summary}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* SPRINT SCOPE CHANGES - Below boards dropdowns */}
                      {(() => {
                        const totalScopeAdded = (currentRetro.sp_breakdown || []).reduce(
                          (acc, b) => acc + (b.added_sp || 0),
                          0
                        );
                        const totalScopeRemoved = (currentRetro.sp_breakdown || []).reduce(
                          (acc, b) => acc + (b.removed_sp || 0),
                          0
                        );
                        if (totalScopeAdded === 0 && totalScopeRemoved === 0) return null;
                        return (
                          <div className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-[#121417] flex items-center justify-between text-xs shadow-2xs">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              Sprint Scope Changes
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              {totalScopeAdded > 0 && (
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  +{totalScopeAdded} SP Added
                                </span>
                              )}
                              {totalScopeRemoved > 0 && (
                                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                  -{totalScopeRemoved} SP Removed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="pt-2 border-t border-slate-300 dark:border-slate-800 flex justify-between text-xs text-slate-700 dark:text-slate-400 font-medium">
                        <span>Achieved Velocity:</span>
                        <span>
                          <b className="text-slate-900 dark:text-slate-200">
                            {currentRetro.velocity_achieved} SP
                          </b>{' '}
                          (Avg: {currentRetro.avg_velocity} SP)
                        </span>
                      </div>

                      {/* Link to eazyBI Dashboard */}
                      <a
                        href={config?.eazybi_url || 'https://jiraprod.aptiv.com/plugins/servlet/eazybi'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-1.5 py-2 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                        title="Open Team eazyBI Dashboard"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Open eazyBI Dashboard</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>

                    {/* CARD 1B: AI Retro Summary - editable */}
                    <div
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 flex-1 min-h-0 ${
                        darkMode
                          ? 'bg-[#1a1d21] border-slate-800'
                          : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2 min-h-0 flex-1 flex flex-col">
                        <div className="h-6 px-1 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                              AI Summary
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {currentRetro.pulse_ai_summary ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                Editable
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-xs leading-relaxed flex-1 min-h-0 flex flex-col">
                          <textarea
                            value={currentRetro.pulse_ai_summary || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRetroSessions((prev) =>
                                prev.map((r) =>
                                  r.sprint_code === currentRetro.sprint_code
                                    ? { ...r, pulse_ai_summary: val }
                                    : r
                                )
                              );
                            }}
                            onBlur={(e) => {
                              updateRetro({ pulse_ai_summary: e.target.value });
                            }}
                            placeholder="Write or edit AI summary here, or click below to generate..."
                            rows={5}
                            className={`w-full p-2.5 rounded-xl border text-xs leading-relaxed font-medium resize-none focus:outline-none transition flex-1 min-h-[80px] overflow-y-auto ${
                              darkMode
                                ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40'
                                : 'bg-white border-indigo-200 text-indigo-950 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/40 shadow-2xs'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAiSuggestTasks}
                        className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] shrink-0"
                        title="Synthesizes top-voted anchors into actionable tasks"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>Generate Action Items</span>
                      </button>
                    </div>
                  </div>

              {/* CARD 2 (6 cols) - EL BARCO ÁGIL */}
              {(() => {
                const ratingsList = currentRetro.pulse_ratings || [];
                const avgMoral =
                  ratingsList.length > 0
                    ? (
                        ratingsList.reduce((acc, r) => acc + (r.moral || 4), 0) /
                        ratingsList.length
                      ).toFixed(1)
                    : '4.5';
                const avgConfianza =
                  ratingsList.length > 0
                    ? (
                        ratingsList.reduce((acc, r) => acc + (r.confianza || 4), 0) /
                        ratingsList.length
                      ).toFixed(1)
                    : '4.5';
                const avgClaridad =
                  ratingsList.length > 0
                    ? (
                        ratingsList.reduce((acc, r) => acc + (r.claridad || 4), 0) /
                        ratingsList.length
                      ).toFixed(1)
                    : '4.0';

                const participatedNames = new Set(
                  [
                    ...ratingsList.map((r) => r.author),
                    ...currentRetro.pulse_items.map((p) => p.author || ''),
                  ].filter(Boolean)
                );

                const teamParticipation = PARTICIPANT_MEMBERS.map((m) => ({
                  ...m,
                  hasParticipated: participatedNames.has(m.name),
                }));

                const anonymousCount = [
                  ...ratingsList.filter((r) => r.author?.includes('Anónimo')),
                  ...currentRetro.pulse_items.filter((p) => p.author?.includes('Anónimo')),
                ].length;

                const totalCompletedTeam = teamParticipation.filter((m) => m.hasParticipated).length;

                const windItems = currentRetro.pulse_items.filter(
                  (p) => p.type === 'wind' || p.type === 'logro'
                );
                const islandItems = currentRetro.pulse_items.filter(
                  (p) => p.type === 'island' || p.type === 'aprendizaje'
                );
                const anchorItems = currentRetro.pulse_items.filter(
                  (p) => p.type === 'anchor' || p.type === 'blocker'
                );
                const rocksItems = currentRetro.pulse_items.filter(
                  (p) => p.type === 'rocks' || p.type === 'concern'
                );

                const hostOrigin =
                  typeof window !== 'undefined' &&
                  window.location.hostname !== 'localhost' &&
                  window.location.hostname !== '127.0.0.1'
                    ? window.location.origin
                    : networkInfo?.live_url_base || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000');
                const liveUrl = `${hostOrigin}/?view=retro-live&sprint=${encodeURIComponent(currentRetro.sprint_code)}`;

                return (
                  <>
                    <div
                      className={`xl:col-span-6 p-3.5 rounded-2xl border flex flex-col justify-between min-h-0 h-full ${
                        darkMode
                          ? 'bg-[#1a1d21] border-slate-800'
                          : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                      }`}
                    >
                      {/* Header: Title + Actions (No subtitle underneath) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                            Agile Sailboat
                          </h3>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowQrModal(true)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              darkMode
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                            }`}
                            title="Show QR code & copy link"
                          >
                            <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                            <span>QR Code</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsBoatExpanded(true)}
                            className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              darkMode
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                            }`}
                            title="Expand to Fullscreen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Expand</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAiPulseAnalysis}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            title="Synthesize AI Pulse"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Pulse</span>
                          </button>
                        </div>
                      </div>

                      {/* 1. SPRINT THERMOMETER (Visual Half-Pie Gauges, No Emoji) */}
                      <div
                        className={`p-2 rounded-xl border transition shrink-0 mt-2 ${
                          darkMode
                            ? 'bg-[#121417]/80 border-slate-800/80 shadow-inner'
                            : 'bg-white/90 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center pl-3">
                            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              Sprint Thermometer
                            </h4>
                          </div>

                          <div className="flex items-center justify-around sm:justify-end gap-3 sm:gap-6">
                            <HalfPieGauge
                              label="Morale"
                              score={Number(avgMoral)}
                              color={Number(avgMoral) >= 4 ? '#f59e0b' : Number(avgMoral) >= 3 ? '#fbbf24' : '#ef4444'}
                              darkMode={darkMode}
                            />
                            <HalfPieGauge
                              label="Trust"
                              score={Number(avgConfianza)}
                              color={Number(avgConfianza) >= 4 ? '#6366f1' : Number(avgConfianza) >= 3 ? '#818cf8' : '#ef4444'}
                              darkMode={darkMode}
                            />
                            <HalfPieGauge
                              label="Clarity"
                              score={Number(avgClaridad)}
                              color={Number(avgClaridad) >= 4 ? '#10b981' : Number(avgClaridad) >= 3 ? '#34d399' : '#ef4444'}
                              darkMode={darkMode}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. THE SAILBOAT CANVAS & 4 QUADRANTS WITH BACKGROUND ART */}
                      <div className="relative rounded-2xl p-1 overflow-hidden flex-1 min-h-0 flex flex-col justify-between mt-2">
                        {/* Sailboat Graphic Backdrop */}
                        <SailboatCanvasArt />

                        {/* 4 Quadrants Canvas (2x2 Grid) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative z-10 flex-1 min-h-0">
                          {/* Quadrant 1: Wind in Sails (wind) */}
                          <div
                            className={`p-2.5 rounded-xl border flex flex-col min-h-0 backdrop-blur-xs transition ${
                              darkMode
                                ? 'bg-emerald-500/[0.03] border-emerald-500/25'
                                : 'bg-emerald-500/[0.03] border-emerald-500/25 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">💨</span>
                                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                                  Wind in Sails
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  Achievement
                                </span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                                  {windItems.length}
                                </span>
                              </div>
                            </div>

                            {/* Centered normal white question */}
                            <div className="text-center py-1 px-1 shrink-0">
                              <p className="text-[11px] sm:text-xs font-semibold text-slate-100 dark:text-white leading-tight select-none">
                                What helped us move forward?
                              </p>
                            </div>

                            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5">
                              {windItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-2 rounded-lg border text-xs space-y-1 shadow-2xs transition group ${
                                    darkMode
                                      ? 'bg-[#151a22]/90 hover:bg-[#1b222d] border-slate-700/70 text-slate-100'
                                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span
                                      className={`font-bold px-1.5 py-0.5 rounded ${
                                        darkMode
                                          ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      👤 {item.author || 'Team'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-extrabold transition cursor-pointer ${
                                          darkMode
                                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                        title="Vote for this note"
                                      >
                                        <ThumbsUp className="w-2.5 h-2.5 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePulseItem(item.id)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="font-medium leading-relaxed text-slate-200 dark:text-slate-100 break-words">
                                    {item.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quadrant 2: The Island (island) */}
                          <div
                            className={`p-2.5 rounded-xl border flex flex-col min-h-0 backdrop-blur-xs transition ${
                              darkMode
                                ? 'bg-purple-500/[0.03] border-purple-500/25'
                                : 'bg-purple-500/[0.03] border-purple-500/25 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-purple-500/20 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">🏝️</span>
                                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                                  The Island
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                  Destination
                                </span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-800 dark:text-purple-200">
                                  {islandItems.length}
                                </span>
                              </div>
                            </div>

                            {/* Centered normal white question */}
                            <div className="text-center py-1 px-1 shrink-0">
                              <p className="text-[11px] sm:text-xs font-semibold text-slate-100 dark:text-white leading-tight select-none">
                                What did we achieve?
                              </p>
                            </div>

                            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5">
                              {islandItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-2 rounded-lg border text-xs space-y-1 shadow-2xs transition group ${
                                    darkMode
                                      ? 'bg-[#151a22]/90 hover:bg-[#1b222d] border-slate-700/70 text-slate-100'
                                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span
                                      className={`font-bold px-1.5 py-0.5 rounded ${
                                        darkMode
                                          ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      👤 {item.author || 'Team'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-extrabold transition cursor-pointer ${
                                          darkMode
                                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                        title="Vote for this note"
                                      >
                                        <ThumbsUp className="w-2.5 h-2.5 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePulseItem(item.id)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="font-medium leading-relaxed text-slate-200 dark:text-slate-100 break-words">
                                    {item.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quadrant 3: The Anchor (anchor) */}
                          <div
                            className={`p-2.5 rounded-xl border flex flex-col min-h-0 backdrop-blur-xs transition ${
                              darkMode
                                ? 'bg-rose-500/[0.03] border-rose-500/25'
                                : 'bg-rose-500/[0.03] border-rose-500/25 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-rose-500/20 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">⚓</span>
                                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                                  The Anchor
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                  Blockers
                                </span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-800 dark:text-rose-200">
                                  {anchorItems.length}
                                </span>
                              </div>
                            </div>

                            {/* Centered normal white question */}
                            <div className="text-center py-1 px-1 shrink-0">
                              <p className="text-[11px] sm:text-xs font-semibold text-slate-100 dark:text-white leading-tight select-none">
                                What held us back or caused troubles?
                              </p>
                            </div>

                            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5">
                              {anchorItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-2 rounded-lg border text-xs space-y-1 shadow-2xs transition group ${
                                    darkMode
                                      ? 'bg-[#151a22]/90 hover:bg-[#1b222d] border-slate-700/70 text-slate-100'
                                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span
                                      className={`font-bold px-1.5 py-0.5 rounded ${
                                        darkMode
                                          ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      👤 {item.author || 'Team'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-extrabold transition cursor-pointer ${
                                          darkMode
                                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                        title="Vote priority anchor"
                                      >
                                        <ThumbsUp className="w-2.5 h-2.5 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePulseItem(item.id)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="font-medium leading-relaxed text-slate-200 dark:text-slate-100 break-words">
                                    {item.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quadrant 4: Rocks in the Sea (rocks) */}
                          <div
                            className={`p-2.5 rounded-xl border flex flex-col min-h-0 backdrop-blur-xs transition ${
                              darkMode
                                ? 'bg-amber-500/[0.03] border-amber-500/25'
                                : 'bg-amber-500/[0.03] border-amber-500/25 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-amber-500/20 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">🪨</span>
                                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                                  Rocks in the Sea
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  Risks
                                </span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                                  {rocksItems.length}
                                </span>
                              </div>
                            </div>

                            {/* Centered normal white question */}
                            <div className="text-center py-1 px-1 shrink-0">
                              <p className="text-[11px] sm:text-xs font-semibold text-slate-100 dark:text-white leading-tight select-none">
                                What obstacles did we spot?
                              </p>
                            </div>

                            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5">
                              {rocksItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-2 rounded-lg border text-xs space-y-1 shadow-2xs transition group ${
                                    darkMode
                                      ? 'bg-[#151a22]/90 hover:bg-[#1b222d] border-slate-700/70 text-slate-100'
                                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span
                                      className={`font-bold px-1.5 py-0.5 rounded ${
                                        darkMode
                                          ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      👤 {item.author || 'Team'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-extrabold transition cursor-pointer ${
                                          darkMode
                                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                        title="Vote priority risk"
                                      >
                                        <ThumbsUp className="w-2.5 h-2.5 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePulseItem(item.id)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="font-medium leading-relaxed text-slate-200 dark:text-slate-100 break-words">
                                    {item.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Facilitator Quick Add Bar */}
                        <form
                          onSubmit={handleAddPulseItem}
                          className="flex flex-wrap sm:flex-nowrap gap-1.5 pt-2 mt-1.5 border-t border-slate-200 dark:border-slate-800/80 relative z-10 shrink-0"
                        >
                          <select
                            value={newPulseType}
                            onChange={(e) => setNewPulseType(e.target.value as any)}
                            className={`px-2 py-1.5 rounded-lg border text-xs font-bold shrink-0 ${
                              darkMode
                                ? 'bg-[#121417] border-slate-700 text-slate-200'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            <option value="wind">💨 Wind</option>
                            <option value="island">🏝️ Island</option>
                            <option value="anchor">⚓ Anchor</option>
                            <option value="rocks">🪨 Rocks</option>
                          </select>

                          <input
                            type="text"
                            value={newPulseText}
                            onChange={(e) => setNewPulseText(e.target.value)}
                            placeholder="+ Quick add sticky note from screen..."
                            className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                              darkMode
                                ? 'bg-[#121417] border-slate-700 text-white placeholder:text-slate-500'
                                : 'bg-white border-slate-300 placeholder:text-slate-500'
                            }`}
                          />

                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                          >
                            +
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* CARD 3 & 4 (3 cols stacked) - MEETING NOTES & TASKS */}
                    <div
                      className="xl:col-span-3 flex flex-col gap-3 min-h-0 h-full justify-between"
                    >
                      {/* CARD 3: Meeting Notes */}
                      <div
                        className={`p-3.5 rounded-2xl border flex flex-col min-h-0 flex-1 justify-between ${
                          darkMode
                            ? 'bg-[#1a1d21] border-slate-800'
                            : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="h-6 px-1 flex items-center justify-between shrink-0">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                            Meeting Notes
                          </h3>
                        </div>

                        <ul className="space-y-1.5 text-xs leading-relaxed font-medium flex-1 min-h-0 overflow-y-auto pr-1 pt-1">
                          {currentRetro.notes.map((n, idx) => (
                            <li
                              key={idx}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-start justify-between gap-2 group ${
                                darkMode
                                  ? 'bg-[#121417] border-slate-800 text-slate-200'
                                  : 'bg-white border-slate-300 text-slate-800'
                              }`}
                            >
                              <span className="flex-1 break-words">• {n}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(idx)}
                                title="Delete note"
                                className="text-slate-400 hover:text-rose-500 transition shrink-0 mt-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>

                        <form onSubmit={handleAddNote} className="flex gap-1.5 pt-2 shrink-0">
                          <input
                            type="text"
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="+ Write meeting notes..."
                            className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                              darkMode
                                ? 'bg-[#121417] border-slate-700'
                                : 'bg-white border-slate-300 placeholder:text-slate-500'
                            }`}
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                          >
                            +
                          </button>
                        </form>
                      </div>

                      {/* CARD 4: Tasks (Action Items) */}
                      <div
                        className={`p-3.5 rounded-2xl border flex flex-col min-h-0 flex-1 justify-between ${
                          darkMode
                            ? 'bg-[#1a1d21] border-slate-800'
                            : 'bg-[#eef2f7] border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="h-6 px-1 flex items-center justify-between shrink-0">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                            Tasks (Action Items)
                          </h3>
                          <span className="text-xs text-slate-700 dark:text-slate-400 font-bold">
                            {currentRetro.tasks.filter((t) => t.done).length}/
                            {currentRetro.tasks.length} done
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs flex-1 min-h-0 overflow-y-auto pr-1 pt-1">
                          {currentRetro.tasks.map((tsk) => (
                            <div
                              key={tsk.id}
                              className={`p-2 rounded-xl border space-y-1.5 ${
                                tsk.carried_from_sprint
                                  ? 'border-amber-500/50 bg-amber-500/15'
                                  : darkMode
                                  ? 'bg-[#121417] border-slate-800'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {tsk.carried_from_sprint && (
                                <span className="block text-xs font-bold text-amber-800 dark:text-amber-400">
                                  ↪ Carried over from {tsk.carried_from_sprint}:
                                </span>
                              )}

                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={tsk.done}
                                  onChange={() => handleToggleTask(tsk.id)}
                                  className="mt-0.5 rounded accent-emerald-600 cursor-pointer"
                                />
                                <span
                                  className={`flex-1 leading-snug ${
                                    tsk.done ? 'line-through opacity-50' : 'font-semibold'
                                  }`}
                                >
                                  {tsk.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(tsk.id)}
                                  title="Delete task"
                                  className="text-slate-400 hover:text-rose-500 transition shrink-0 mt-0.5 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between pl-5 pt-0.5">
                                <span className="text-slate-700 dark:text-slate-400 font-medium text-[11px]">
                                  Owner:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={tsk.assignee}
                                    onChange={(e) =>
                                      handleChangeTaskAssignee(tsk.id, e.target.value)
                                    }
                                    className={`px-2 py-0.5 rounded border text-xs font-bold ${
                                      darkMode
                                        ? 'bg-slate-800 border-slate-700 text-indigo-300'
                                        : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                    }`}
                                  >
                                    {currentRetro.team_members.map((m) => (
                                      <option key={m} value={m}>
                                        @{m}
                                      </option>
                                    ))}
                                  </select>
                                  {tsk.assignee && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendTaskEmail(tsk)}
                                      className="px-2 py-0.5 rounded border text-[11px] font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 transition cursor-pointer"
                                      title={`Send email reminder to @${tsk.assignee}`}
                                    >
                                      <Mail className="w-3 h-3" />
                                      <span>Remind</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleAddManualTask} className="flex gap-1.5 pt-2 shrink-0">
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="+ Add manual task..."
                            className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                              darkMode
                                ? 'bg-[#121417] border-slate-700'
                                : 'bg-white border-slate-300'
                            }`}
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                          >
                            +
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* MODAL: QR CODE */}
                    {showQrModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                        <div
                          className={`max-w-sm w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
                            darkMode
                              ? 'bg-[#181b22] border-slate-800 text-white'
                              : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">📱</span>
                              <h3 className="text-sm font-extrabold">Join from Laptop or Mobile</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowQrModal(false)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Scan this QR code with your mobile camera or open the link on your laptop to submit your pulse and sailboat sticky notes.
                          </p>

                          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Aptiv Intranet Link
                            </span>
                            <span className="font-mono text-[11px] opacity-80">{networkInfo?.lan_ip ? `${networkInfo.lan_ip}:8000` : 'Local Network'}</span>
                          </div>

                          <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(liveUrl)}`}
                              alt="QR Code"
                              className="w-48 h-48 rounded-lg"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={liveUrl}
                              className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono select-all ${
                                darkMode
                                  ? 'bg-[#121418] border-slate-700 text-slate-300'
                                  : 'bg-slate-100 border-slate-300 text-slate-700'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleCopyLiveLink}
                              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              {copiedLiveLink ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedLiveLink ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODAL: EXPANDED FULLSCREEN BOAT (PROJECTOR MODE) */}
                    {isBoatExpanded && (
                      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white p-6 overflow-y-auto animate-in fade-in">
                        {/* Expanded header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                          <div>
                            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                              Agile Sailboat — Retrospective {currentRetro.sprint_code}
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                Projector Mode
                              </span>
                            </h2>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={handleCopyLiveLink}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Link
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowQrModal(true)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                              QR Code
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsBoatExpanded(false)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              title="Close Fullscreen"
                            >
                              <Minimize2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded 4 quadrants in large view with Sailboat Artwork */}
                        <div className="relative flex-1 py-5">
                          <SailboatCanvasArt />

                          <div className="grid grid-cols-2 gap-5 relative z-10 h-full">
                            {/* Wind in Sails */}
                            <div className="p-4 rounded-2xl border bg-emerald-500/[0.03] border-emerald-500/25 flex flex-col space-y-2.5 backdrop-blur-md">
                              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                                <span className="text-sm font-black text-slate-100 flex items-center gap-2">
                                  💨 Wind in Sails
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    Achievement
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300">
                                    {windItems.length}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center py-0.5">
                                <p className="text-xs font-semibold text-white/90">
                                  What helped us move forward?
                                </p>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                {windItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-xl border bg-[#151a22]/95 border-slate-700/80 text-slate-100 space-y-1.5 shadow-sm"
                                  >
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                        👤 {item.author || 'Team'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold cursor-pointer"
                                      >
                                        <ThumbsUp className="w-3 h-3 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                    </div>
                                    <p className="text-sm font-medium">{item.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* The Island */}
                            <div className="p-4 rounded-2xl border bg-purple-500/[0.03] border-purple-500/25 flex flex-col space-y-2.5 backdrop-blur-md">
                              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                                <span className="text-sm font-black text-slate-100 flex items-center gap-2">
                                  🏝️ The Island
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    Destination
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300">
                                    {islandItems.length}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center py-0.5">
                                <p className="text-xs font-semibold text-white/90">
                                  What did we achieve?
                                </p>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                {islandItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-xl border bg-[#151a22]/95 border-slate-700/80 text-slate-100 space-y-1.5 shadow-sm"
                                  >
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                        👤 {item.author || 'Team'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold cursor-pointer"
                                      >
                                        <ThumbsUp className="w-3 h-3 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                    </div>
                                    <p className="text-sm font-medium">{item.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* The Anchor */}
                            <div className="p-4 rounded-2xl border bg-rose-500/[0.03] border-rose-500/25 flex flex-col space-y-2.5 backdrop-blur-md">
                              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                                <span className="text-sm font-black text-slate-100 flex items-center gap-2">
                                  ⚓ The Anchor
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                    Blockers
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300">
                                    {anchorItems.length}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center py-0.5">
                                <p className="text-xs font-semibold text-white/90">
                                  What held us back or caused troubles?
                                </p>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                {anchorItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-xl border bg-[#151a22]/95 border-slate-700/80 text-slate-100 space-y-1.5 shadow-sm"
                                  >
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                        👤 {item.author || 'Team'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold cursor-pointer"
                                      >
                                        <ThumbsUp className="w-3 h-3 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                    </div>
                                    <p className="text-sm font-medium">{item.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Rocks in the Sea */}
                            <div className="p-4 rounded-2xl border bg-amber-500/[0.03] border-amber-500/25 flex flex-col space-y-2.5 backdrop-blur-md">
                              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                                <span className="text-sm font-black text-slate-100 flex items-center gap-2">
                                  🪨 Rocks in the Sea
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    Risks
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300">
                                    {rocksItems.length}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center py-0.5">
                                <p className="text-xs font-semibold text-white/90">
                                  What obstacles did we spot?
                                </p>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                {rocksItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-xl border bg-[#151a22]/95 border-slate-700/80 text-slate-100 space-y-1.5 shadow-sm"
                                  >
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                        👤 {item.author || 'Team'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleVotePulseItem(item.id)}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold cursor-pointer"
                                      >
                                        <ThumbsUp className="w-3 h-3 text-indigo-400" />
                                        <span>{item.votes || 0}</span>
                                      </button>
                                    </div>
                                    <p className="text-sm font-medium">{item.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Bottom */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-slate-400">Sprint Thermometer:</span>
                            <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                              Morale: {avgMoral} / 5
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                              Trust: {avgConfianza} / 5
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              Clarity: {avgClaridad} / 5
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAiSuggestTasks}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-white" />
                            <span>Synthesize with AI → Generate Action Items</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}
      </main>

      {/* MODAL: ADD MANUAL THEME */}
      {showAddThemeModal && planning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 border shadow-xl space-y-4 ${
              darkMode
                ? 'bg-[#1a1d21] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-sm font-bold">Add New Sprint Work Item</h3>
            <form onSubmit={handleAddCustomTheme} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={newThemeForm.title}
                  onChange={(e) =>
                    setNewThemeForm({ ...newThemeForm, title: e.target.value })
                  }
                  placeholder="Item Title"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-[#121417] border-slate-700'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Board</label>
                  <select
                    value={newThemeForm.board}
                    onChange={(e) =>
                      setNewThemeForm({
                        ...newThemeForm,
                        board: e.target.value as 'HJJ' | 'HAO',
                      })
                    }
                    className={`w-full px-2 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="HJJ">HJJ</option>
                    <option value="HAO">HAO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Priority</label>
                  <select
                    value={newThemeForm.priority}
                    onChange={(e) =>
                      setNewThemeForm({
                        ...newThemeForm,
                        priority: e.target.value as 'High' | 'Mid' | 'Low',
                      })
                    }
                    className={`w-full px-2 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="High">High</option>
                    <option value="Mid">Mid</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">SP</label>
                  <select
                    value={newThemeForm.sp_per_person}
                    onChange={(e) =>
                      setNewThemeForm({
                        ...newThemeForm,
                        sp_per_person: Number(e.target.value),
                      })
                    }
                    className={`w-full px-2 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} SP
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Assignee</label>
                  <select
                    value={newThemeForm.assignees[0] || 'Jackie'}
                    onChange={(e) =>
                      setNewThemeForm({
                        ...newThemeForm,
                        assignees: [e.target.value],
                      })
                    }
                    className={`w-full px-2 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {(planning?.team_members || ['Jackie', 'Franco', 'Cotera', 'Gerardo', 'Samantha']).map(
                      (m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">ASPICE Process Area</label>
                  <select
                    value={newThemeForm.aspice}
                    onChange={(e) =>
                      setNewThemeForm({
                        ...newThemeForm,
                        aspice: e.target.value,
                      })
                    }
                    className={`w-full px-2 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {ASPICE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Description (Jira)</label>
                <textarea
                  rows={2}
                  value={newThemeForm.description}
                  onChange={(e) =>
                    setNewThemeForm({ ...newThemeForm, description: e.target.value })
                  }
                  placeholder="Descripción del trabajo para el ticket de Jira..."
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-[#121417] border-slate-700'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Acceptance Criteria (Jira customfield)</label>
                <textarea
                  rows={2}
                  value={newThemeForm.acceptance_criteria}
                  onChange={(e) =>
                    setNewThemeForm({
                      ...newThemeForm,
                      acceptance_criteria: e.target.value,
                    })
                  }
                  placeholder="Criterios de aceptación (e.g. - Cumplir con los entregables acordados)"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-[#121417] border-slate-700'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddThemeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW RETROSPECTIVE */}
      {showNewRetroModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl max-w-md w-full p-6 border shadow-xl space-y-4 ${
              darkMode
                ? 'bg-[#1a1d21] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-sm font-bold">New Retrospective</h3>
            <p className="text-xs text-slate-400">
              Unfinished tasks from the previous Sprint will automatically carry over.
            </p>
            <form onSubmit={handleCreateNewRetro} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={newRetroForm.sprint_code}
                  onChange={(e) =>
                    setNewRetroForm({ ...newRetroForm, sprint_code: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode
                      ? 'bg-[#121417] border-slate-700'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Start Date</label>
                  <input
                    type="text"
                    value={newRetroForm.start_date}
                    onChange={(e) =>
                      setNewRetroForm({ ...newRetroForm, start_date: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">End Date</label>
                  <input
                    type="text"
                    value={newRetroForm.end_date}
                    onChange={(e) =>
                      setNewRetroForm({ ...newRetroForm, end_date: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRetroModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Create Retrospective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: JIRA CONNECTION (Opened via Jira Aptiv Live/Off button) */}
      {showJiraModal && config && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 text-xs ${
              darkMode
                ? 'bg-[#1a1d21] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlugZap className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">Jira Connection (Aptiv)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJiraModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Operating Mode */}
              <div>
                <label className="block font-bold mb-1.5 uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
                  Operating Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mode: 'live' })}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      config.mode === 'live'
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold shadow-2xs'
                        : darkMode
                        ? 'bg-[#121417] border-slate-800 text-slate-400 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.mode === 'live' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
                    <div>
                      <div className="font-bold">Live Corporate Jira</div>
                      <div className="text-[10px] opacity-75">Real tickets & sprints</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mode: 'demo' })}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      config.mode === 'demo'
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold shadow-2xs'
                        : darkMode
                        ? 'bg-[#121417] border-slate-800 text-slate-400 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.mode === 'demo' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                    <div>
                      <div className="font-bold">Demo / Offline Mode</div>
                      <div className="text-[10px] opacity-75">Fast offline simulation</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveConfig} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">
                    Jira Server URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={config.base_url || 'https://jiraprod.aptiv.com'}
                    onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                    placeholder="https://jiraprod.aptiv.com"
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700 text-slate-100 placeholder:text-slate-600'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold">
                      Personal Access Token (PAT) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Jira: Profile → Personal Access Tokens
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showTokenPassword ? 'text' : 'password'}
                      value={config.api_token || ''}
                      onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
                      placeholder="Paste your Jira Personal Access Token here..."
                      className={`w-full pl-3 pr-10 py-2 rounded-xl border font-mono text-xs ${
                        darkMode
                          ? 'bg-[#121417] border-slate-700 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokenPassword(!showTokenPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={showTokenPassword ? 'Hide token' : 'Show token'}
                    >
                      {showTokenPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Status Banner */}
                {jiraTestStatus.state === 'testing' && (
                  <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Testing connection with {config.base_url || 'jiraprod.aptiv.com'}...</span>
                  </div>
                )}

                {jiraTestStatus.state === 'success' && (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{jiraTestStatus.message}</span>
                    </div>
                    {jiraTestStatus.projects && jiraTestStatus.projects.length > 0 && (
                      <div className="pt-1.5 border-t border-emerald-500/20 text-[11px]">
                        <span className="text-emerald-300 font-bold block mb-1">
                          Accessible projects detected:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {jiraTestStatus.projects.slice(0, 10).map((p) => (
                            <span
                              key={p.key}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30"
                            >
                              {p.key} {p.name ? `· ${p.name}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {jiraTestStatus.state === 'error' && (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs">Connection Failed</div>
                      <div className="text-[11px] leading-relaxed opacity-90">{jiraTestStatus.message}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestJiraConnection}
                    disabled={jiraTestStatus.state === 'testing'}
                    className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      darkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    <PlugZap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Test Connection</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowJiraModal(false)}
                      className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs transition"
                    >
                      Save & Apply
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TEAM & CEREMONY SETTINGS (Opened via gear icon) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div
            className={`rounded-2xl max-w-xl w-full p-6 border shadow-2xl space-y-4 text-xs ${
              darkMode
                ? 'bg-[#1a1d21] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">Team & Ceremony Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* SECTION 1: eazyBI Dashboard Link */}
              <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300">
                    <BarChart2 className="w-3.5 h-3.5" />
                    Team eazyBI Dashboard URL
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Sprint Completion card link
                  </span>
                </div>
                <input
                  type="text"
                  value={config?.eazybi_url || ''}
                  onChange={(e) => {
                    if (config) {
                      setConfig({ ...config, eazybi_url: e.target.value });
                    }
                  }}
                  placeholder="https://jiraprod.aptiv.com/plugins/servlet/eazybi/accounts/..."
                  className={`w-full px-3 py-2 rounded-lg border font-mono text-xs ${
                    darkMode
                      ? 'bg-[#121417] border-slate-700 text-slate-100 placeholder:text-slate-600'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* SECTION 2: Teams, NetIDs and Emails */}
              <div className="flex items-center justify-between pt-1">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Teams, NetIDs & Emails
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateNewTeam}
                    className="px-2.5 py-1 rounded-lg border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New Team
                  </button>
                  {teams.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDeleteTeam}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete current team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Team Selector & Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Select Team
                  </label>
                  <select
                    value={selectedTeamId || ''}
                    onChange={(e) => handleSelectTeam(Number(e.target.value))}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-bold ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamFormName}
                    onChange={(e) => setTeamFormName(e.target.value)}
                    placeholder="e.g. Core Scrum Team"
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-bold ${
                      darkMode
                        ? 'bg-[#121417] border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
                  <span className="col-span-4">Member Name</span>
                  <span className="col-span-3">Jira NetID</span>
                  <span className="col-span-4">Corporate Email</span>
                  <span className="col-span-1"></span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {teamFormMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl border ${
                        darkMode
                          ? 'bg-[#121417] border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                        placeholder="Name"
                        className="col-span-4 px-2 py-1 rounded-lg bg-transparent text-xs font-bold focus:outline-none"
                      />
                      <input
                        type="text"
                        value={member.netid}
                        onChange={(e) => handleUpdateMember(idx, 'netid', e.target.value)}
                        placeholder="NetID"
                        className="col-span-3 px-2 py-1 rounded-lg bg-transparent text-xs font-mono font-semibold focus:outline-none text-indigo-600 dark:text-indigo-400"
                      />
                      <input
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => handleUpdateMember(idx, 'email', e.target.value)}
                        placeholder="netid@aptiv.com"
                        className="col-span-4 px-2 py-1 rounded-lg bg-transparent text-xs font-medium focus:outline-none text-slate-700 dark:text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="col-span-1 p-1 flex justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Remove member"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Member Row */}
                <div
                  className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl border border-dashed ${
                    darkMode
                      ? 'border-slate-700 bg-slate-900/30'
                      : 'border-slate-300 bg-slate-100/50'
                  }`}
                >
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="New Member"
                    className="col-span-4 px-2 py-1 rounded-lg bg-transparent text-xs font-bold focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newMemberNetid}
                    onChange={(e) => setNewMemberNetid(e.target.value)}
                    placeholder="NetID"
                    className="col-span-3 px-2 py-1 rounded-lg bg-transparent text-xs font-mono font-semibold focus:outline-none text-indigo-600 dark:text-indigo-400"
                  />
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Corporate Email"
                    className="col-span-3 px-2 py-1 rounded-lg bg-transparent text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!newMemberName.trim()}
                    className="col-span-2 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>

              {/* Team Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {teamFormMembers.length} active member(s)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTeam(true)}
                    disabled={isSavingTeam}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  >
                    {isSavingTeam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save & Set Active
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
