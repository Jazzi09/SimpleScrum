import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  User,
  RotateCcw,
} from 'lucide-react';
import { RetroSession } from './types';

const PARTICIPANT_MEMBERS = [
  { name: 'Maria Paula', initials: 'MP', color: '#10B981' },
  { name: 'Samantha', initials: 'SA', color: '#8B5CF6' },
  { name: 'Jackie', initials: 'JA', color: '#3B82F6' },
  { name: 'Franco', initials: 'FR', color: '#F59E0B' },
  { name: 'Cotera', initials: 'JC', color: '#6366F1' },
  { name: 'Gerardo', initials: 'GD', color: '#EC4899' },
];

const QUADRANTS = [
  {
    key: 'wind' as const,
    label: 'Wind in Sails',
    sublabel: 'What propelled us forward or went well?',
    icon: '💨',
    color: 'emerald',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    activeBg: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    key: 'island' as const,
    label: 'The Island (Destination)',
    sublabel: 'What did we learn or aim to achieve?',
    icon: '🏝️',
    color: 'purple',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    activeBg: 'bg-purple-600 text-white border-purple-600',
  },
  {
    key: 'anchor' as const,
    label: 'The Anchor (Blockers)',
    sublabel: 'What held us back or caused troubles?',
    icon: '⚓',
    color: 'rose',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    activeBg: 'bg-rose-600 text-white border-rose-600',
  },
  {
    key: 'rocks' as const,
    label: 'Rocks in the Sea',
    sublabel: 'What obstacles did we spot?',
    icon: '🪨',
    color: 'amber',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    activeBg: 'bg-amber-600 text-white border-amber-600',
  },
];

interface FormPostit {
  id: string;
  type: 'wind' | 'anchor' | 'rocks' | 'island';
  text: string;
}

export function RetroLiveView() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('scrum_dark_mode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  const [sprintCode, setSprintCode] = useState<string>('26PI3 DRP');
  const [author, setAuthor] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState(PARTICIPANT_MEMBERS);
  const [submittedAuthors, setSubmittedAuthors] = useState<string[]>([]);
  const [ratings, setRatings] = useState({ moral: 4, confianza: 4, claridad: 4 });
  const [notes, setNotes] = useState<FormPostit[]>([
    { id: 'item-1', type: 'wind', text: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [submittedNotesCount, setSubmittedNotesCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('scrum_dark_mode', String(darkMode));
  }, [darkMode]);

  // Load sprint and submitted authors
  useEffect(() => {
    // 1. Fetch team members from teams API
    fetch('/api/teams')
      .then((res) => res.json())
      .then((teams) => {
        if (Array.isArray(teams)) {
          const activeTeam = teams.find((t: any) => t.is_active) || teams[0];
          if (activeTeam && activeTeam.members && activeTeam.members.length > 0) {
            const colors = ['#10B981', '#8B5CF6', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#06B6D4', '#E11D48'];
            const mapped = activeTeam.members.map((m: any, idx: number) => ({
              name: m.name,
              initials: m.name.slice(0, 2).toUpperCase(),
              color: colors[idx % colors.length],
            }));
            setTeamMembers(mapped);
          }
        }
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const sprintParam = params.get('sprint');

    const fetchSessionSubmitted = (sCode: string) => {
      fetch(`/api/retro/sessions/${encodeURIComponent(sCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            const authors = new Set<string>();
            (data.pulse_ratings || []).forEach((r: any) => {
              if (r.author) authors.add(r.author);
            });
            (data.pulse_items || []).forEach((p: any) => {
              if (p.author) authors.add(p.author);
            });
            setSubmittedAuthors(Array.from(authors));
          }
        })
        .catch(() => {});
    };

    if (sprintParam) {
      const code = decodeURIComponent(sprintParam);
      setSprintCode(code);
      fetchSessionSubmitted(code);
    } else {
      fetch('/api/retro/sessions')
        .then((res) => res.json())
        .then((data: RetroSession[]) => {
          if (data && data.length > 0) {
            const latest = data[data.length - 1].sprint_code;
            setSprintCode(latest);
            fetchSessionSubmitted(latest);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleAddExtraNote = () => {
    setNotes((prev) => [
      ...prev,
      { id: `item-${Date.now()}-${prev.length + 1}`, type: 'anchor', text: '' },
    ]);
  };

  const handleRemoveNote = (idx: number) => {
    if (notes.length <= 1) return; // Keep at least 1 mandatory
    setNotes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNoteTypeChange = (
    idx: number,
    type: 'wind' | 'anchor' | 'rocks' | 'island'
  ) => {
    setNotes((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, type } : n))
    );
  };

  const handleNoteTextChange = (idx: number, text: string) => {
    setNotes((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, text } : n))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!author) {
      setErrorMsg('Please select who you are or choose Anonymous to continue.');
      return;
    }

    const validNotes = notes.filter((n) => n.text.trim().length >= 3);
    if (validNotes.length === 0) {
      setErrorMsg(
        'At least 1 sticky note with minimum 3 characters is required to set sail!'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/retro/sessions/${encodeURIComponent(sprintCode)}/live-submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author,
            ratings,
            notes: validNotes.map((n) => ({ type: n.type, text: n.text.trim() })),
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to submit responses to the Sailboat');
      }

      setSubmittedNotesCount(validNotes.length);
      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSubmittedSuccess(false);
    setNotes([{ id: `item-${Date.now()}`, type: 'wind', text: '' }]);
    setErrorMsg(null);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-[#0f1115] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Mobile/Laptop Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-xs ${
          darkMode ? 'bg-[#16181d]/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base font-bold">
            ⛵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight">The Agile Sailboat</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {sprintCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Live Team Participation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
          title="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-6">
        {submittedSuccess ? (
          /* Success Screen */
          <div
            className={`p-6 rounded-3xl border text-center space-y-5 animate-in fade-in zoom-in-95 duration-300 ${
              darkMode
                ? 'bg-[#181b22] border-slate-800 shadow-xl'
                : 'bg-white border-slate-200 shadow-lg'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🎉
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Your contributions are now on the Sailboat!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Thank you, <b className="text-indigo-600 dark:text-indigo-400">{author}</b>. Your
                pulse ratings and {submittedNotesCount} sticky note(s) have just been added to the
                Sprint board in real-time.
              </p>
            </div>

            {/* Quick summary card */}
            <div
              className={`p-4 rounded-2xl border text-left text-xs space-y-2.5 ${
                darkMode ? 'bg-[#121418] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Submission Summary
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div
                  className={`p-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-sm font-black text-amber-500">⚡ {ratings.moral}/5</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Morale
                  </div>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-sm font-black text-indigo-500">
                    🤝 {ratings.confianza}/5
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Trust
                  </div>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-sm font-black text-emerald-500">
                    🎯 {ratings.claridad}/5
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Clarity
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit another sticky note to the Sailboat
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Follow the live discussion on the ceremony screen to vote on priority anchors.
              </p>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Who are you? */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-[#181b22] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Who are you?
                </label>
                {author && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {author}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {teamMembers.map((m) => {
                  const selected = author === m.name;
                  const isSubmitted = submittedAuthors.includes(m.name);
                  return (
                    <button
                      key={m.name}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => !isSubmitted && setAuthor(m.name)}
                      title={isSubmitted ? 'Already submitted for this sprint' : `Select ${m.name}`}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 text-left ${
                        isSubmitted
                          ? darkMode
                            ? 'bg-[#121418]/60 border-slate-800/80 text-slate-600 cursor-not-allowed opacity-60'
                            : 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : selected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs cursor-pointer'
                          : darkMode
                          ? 'bg-[#121418] border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: isSubmitted ? '#64748b' : m.color }}
                        >
                          {m.initials}
                        </span>
                        <span className="truncate">{m.name}</span>
                      </div>
                      {isSubmitted && (
                        <span className="text-[9px] font-semibold text-slate-500 uppercase shrink-0">
                          Done
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Sprint Express Pulse */}
            <div
              className={`p-4 rounded-2xl border space-y-4 ${
                darkMode ? 'bg-[#181b22] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sprint Express Pulse
                </h3>
              </div>

              {/* Rating 1: Team Morale */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-slate-200">
                      Team Morale
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      How energized and motivated did you feel this sprint?
                    </span>
                  </div>
                  <span className="font-extrabold text-amber-500 shrink-0 ml-2">
                    {ratings.moral} / 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { val: 1, label: 'Exhausted', emoji: '😫' },
                    { val: 2, label: 'Low', emoji: '😕' },
                    { val: 3, label: 'Normal', emoji: '😐' },
                    { val: 4, label: 'Motivated', emoji: '🙂' },
                    { val: 5, label: 'Fully Powered!', emoji: '🚀' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setRatings({ ...ratings, moral: btn.val })}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        ratings.moral === btn.val
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs'
                          : darkMode
                          ? 'bg-[#121418] border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-base">{btn.emoji}</div>
                      <div className="text-[10px] font-bold mt-0.5">{btn.val}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 2: Team Support */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-slate-200">
                      Team Support
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      How supported, aligned, and collaborative was the team?
                    </span>
                  </div>
                  <span className="font-extrabold text-indigo-500 shrink-0 ml-2">
                    {ratings.confianza} / 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { val: 1, label: 'Difficult', emoji: '🌧️' },
                    { val: 2, label: 'Low', emoji: '☁️' },
                    { val: 3, label: 'Fair', emoji: '🌤️' },
                    { val: 4, label: 'Good', emoji: '☀️' },
                    { val: 5, label: 'Peak Trust', emoji: '🌟' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setRatings({ ...ratings, confianza: btn.val })}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        ratings.confianza === btn.val
                          ? 'bg-indigo-600 text-white font-black border-indigo-600 shadow-xs'
                          : darkMode
                          ? 'bg-[#121418] border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-base">{btn.emoji}</div>
                      <div className="text-[10px] font-bold mt-0.5">{btn.val}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 3: Clarity of Goals */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-slate-200">
                      Clarity of Goals
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      How clear and achievable were the sprint requirements and goals?
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-500 shrink-0 ml-2">
                    {ratings.claridad} / 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { val: 1, label: 'Confused', emoji: '🌫️' },
                    { val: 2, label: 'Unclear', emoji: '❓' },
                    { val: 3, label: 'Moderate', emoji: '🔍' },
                    { val: 4, label: 'Clear', emoji: '👌' },
                    { val: 5, label: 'Crystal Clear', emoji: '💎' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setRatings({ ...ratings, claridad: btn.val })}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        ratings.claridad === btn.val
                          ? 'bg-emerald-600 text-white font-black border-emerald-600 shadow-xs'
                          : darkMode
                          ? 'bg-[#121418] border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-base">{btn.emoji}</div>
                      <div className="text-[10px] font-bold mt-0.5">{btn.val}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: The Agile Sailboat */}
            <div
              className={`p-4 rounded-2xl border space-y-4 ${
                darkMode ? 'bg-[#181b22] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    The Agile Sailboat
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Minimum 1 sticky note required to set sail.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  Min. 1 required
                </span>
              </div>

              {/* Post-it Cards */}
              <div className="space-y-4">
                {notes.map((note, idx) => {
                  const currentQuad =
                    QUADRANTS.find((q) => q.key === note.type) || QUADRANTS[0];
                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-2xl border space-y-3 transition ${
                        darkMode
                          ? 'bg-[#121418] border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>Sticky Note #{idx + 1}</span>
                          {idx === 0 ? (
                            <span className="text-[10px] font-extrabold text-amber-500">
                              (Required)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">(Optional)</span>
                          )}
                        </span>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNote(idx)}
                            className="text-slate-400 hover:text-rose-500 text-xs p-1 transition cursor-pointer"
                            title="Delete sticky note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Quadrant Selector */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {QUADRANTS.map((quad) => {
                          const isSelected = note.type === quad.key;
                          return (
                            <button
                              key={quad.key}
                              type="button"
                              onClick={() => handleNoteTypeChange(idx, quad.key)}
                              className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? quad.activeBg
                                  : darkMode
                                  ? 'bg-[#1a1d22] border-slate-700/80 text-slate-300 hover:border-slate-600'
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-sm shrink-0">{quad.icon}</span>
                              <span className="truncate">{quad.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {currentQuad.sublabel}
                      </div>

                      {/* Text Input */}
                      <textarea
                        rows={3}
                        value={note.text}
                        onChange={(e) => handleNoteTextChange(idx, e.target.value)}
                        placeholder={`Write your ${currentQuad.label.toLowerCase()} here... (minimum 3 characters)`}
                        className={`w-full p-2.5 rounded-xl border text-xs resize-none leading-relaxed font-medium transition ${
                          darkMode
                            ? 'bg-[#16181d] border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add another note button */}
              <button
                type="button"
                onClick={handleAddExtraNote}
                className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  darkMode
                    ? 'border-slate-700 text-indigo-400 hover:bg-slate-800/60'
                    : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                + Add another sticky note
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !author || notes[0].text.trim().length < 3}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                isSubmitting || !author || notes[0].text.trim().length < 3
                  ? 'bg-slate-400/50 text-slate-300 cursor-not-allowed border border-slate-500/20'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-indigo-500/25 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Submitting to Sailboat...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Inputs to Sailboat
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
