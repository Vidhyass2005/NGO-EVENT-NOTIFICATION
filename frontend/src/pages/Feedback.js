// pages/Feedback.js
// Volunteer view: see all their submitted feedback with ratings
// Admin view: full dashboard — all feedback across all events with stats

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart2, Users, RefreshCw } from 'lucide-react';
import { participationAPI, eventAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getCategoryColor, getCategoryIcon } from '../utils/helpers';

const STAR_COLORS  = ['', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];
const STAR_LABELS  = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const EMOJI_LABELS = { '😞': 'Poor', '😐': 'Average', '🙂': 'Good', '😊': 'Great', '🤩': 'Excellent' };

// Star display component
const Stars = ({ rating, size = 16 }) => (
  <span className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={size}
        fill={s <= rating ? STAR_COLORS[rating] : 'transparent'}
        color={s <= rating ? STAR_COLORS[rating] : '#cbd5e1'}
      />
    ))}
  </span>
);

// Average star rating bar
const RatingBar = ({ label, count, total, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-slate-500 w-16 flex-shrink-0">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${total ? (count / total) * 100 : 0}%`, backgroundColor: color }} />
    </div>
    <span className="text-xs font-medium text-slate-500 w-6 text-right">{count}</span>
  </div>
);

// ─── VOLUNTEER VIEW ───────────────────────────────────────

function VolunteerFeedback() {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    participationAPI.myHistory()
      .then(res => setHistory(res.data.history.filter(p => p.feedback?.rating)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Reviews Given',  value: history.length,                                                             emoji: '💬' },
          { label: 'Avg Rating',     value: history.length ? (history.reduce((s,p) => s + p.feedback.rating, 0) / history.length).toFixed(1) + ' ★' : '—', emoji: '⭐' },
          { label: 'Top Experience', value: history.length ? (Object.entries(history.reduce((acc, p) => { acc[p.feedback.emoji] = (acc[p.feedback.emoji]||0)+1; return acc; }, {})).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—') : '—', emoji: '🏅' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl">{s.emoji}</p>
            <p className="font-bold text-xl mt-1">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <div className="card text-center py-16">
          <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-semibold mb-1">No feedback yet</h3>
          <p className="text-slate-500 text-sm">Attend events and submit feedback from your History page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(({ _id, event, feedback, attendedAt }) => (
            <div key={_id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${getCategoryColor(event?.category).split(' ')[0]}`}>
                  {getCategoryIcon(event?.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-semibold">{event?.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(event?.date)} · {event?.location}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Stars rating={feedback.rating} />
                      <span className="text-sm font-semibold" style={{ color: STAR_COLORS[feedback.rating] }}>
                        {STAR_LABELS[feedback.rating]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-xl">{feedback.emoji}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{EMOJI_LABELS[feedback.emoji]}</span>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic flex-1 min-w-0">
                        "{feedback.comment}"
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Submitted {formatDate(feedback.submittedAt)} · Attended {formatDate(attendedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────

function AdminFeedbackDashboard() {
  const [events,      setEvents]      = useState([]);
  const [selected,    setSelected]    = useState(null); // selected event
  const [feedbacks,   setFeedbacks]   = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingFb,   setLoadingFb]   = useState(false);

  // Load all completed/approved events
  useEffect(() => {
    eventAPI.getAll({ all: 'true' })
      .then(res => {
        const eligible = res.data.events.filter(e => ['approved','completed'].includes(e.status));
        setEvents(eligible);
        if (eligible.length > 0) loadFeedback(eligible[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadFeedback = useCallback(async (event) => {
    setSelected(event);
    setLoadingFb(true);
    try {
      const res = await participationAPI.getEventFeedback(event._id);
      setFeedbacks(res.data.feedbacks);
      // Build stats
      const total = res.data.feedbacks.length;
      const ratingDist = [0,0,0,0,0,0]; // index 1-5
      const emojiDist  = {};
      res.data.feedbacks.forEach(p => {
        ratingDist[p.feedback.rating]++;
        emojiDist[p.feedback.emoji] = (emojiDist[p.feedback.emoji]||0)+1;
      });
      setStats({ total, avgRating: res.data.avgRating, ratingDist, emojiDist });
    } catch (e) { console.error(e); }
    finally { setLoadingFb(false); }
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Event selector */}
      <div className="card p-4">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Select Event</label>
        <select
          className="input"
          value={selected?._id || ''}
          onChange={e => {
            const ev = events.find(x => x._id === e.target.value);
            if (ev) loadFeedback(ev);
          }}
        >
          {events.map(ev => (
            <option key={ev._id} value={ev._id}>{ev.title} — {formatDate(ev.date)}</option>
          ))}
        </select>
      </div>

      {selected && stats && !loadingFb && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Reviews', value: stats.total,      Icon: MessageSquare, color: 'text-brand-400' },
              { label: 'Avg Rating',    value: `${stats.avgRating} / 5`, Icon: Star, color: 'text-yellow-400' },
              { label: '5 Star Reviews',value: stats.ratingDist[5],     Icon: TrendingUp, color: 'text-green-400' },
              { label: 'Response Rate', value: `${selected.currentParticipants > 0 ? Math.round((stats.total / selected.currentParticipants) * 100) : 0}%`, Icon: Users, color: 'text-indigo-400' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="card p-4">
                <Icon size={18} className={`${color} mb-2`} />
                <p className="font-bold text-2xl">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Rating distribution */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-brand-400" /> Rating Distribution</h3>
              <div className="space-y-2.5">
                {[5,4,3,2,1].map(r => (
                  <RatingBar key={r} label={`${r} Star`} count={stats.ratingDist[r]} total={stats.total} color={STAR_COLORS[r]} />
                ))}
              </div>
            </div>

            {/* Emoji breakdown */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4">Experience Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(EMOJI_LABELS).map(([emoji, label]) => {
                  const count = stats.emojiDist[emoji] || 0;
                  const pct   = stats.total ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={emoji} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{emoji}</span>
                      <span className="text-xs text-slate-500 w-16 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Individual feedback list */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold">All Feedback ({feedbacks.length})</h3>
              <button onClick={() => loadFeedback(selected)} className="btn-ghost text-xs py-1">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            {feedbacks.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No feedback submitted for this event yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {feedbacks.map(({ _id, user, feedback }) => (
                  <div key={_id} className="flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center text-slate-900 font-bold text-sm flex-shrink-0">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-sm">{user?.name}</p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-lg">{feedback.emoji}</span>
                          <Stars rating={feedback.rating} size={14} />
                          <span className="text-xs font-semibold" style={{ color: STAR_COLORS[feedback.rating] }}>
                            {STAR_LABELS[feedback.rating]}
                          </span>
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 italic">
                          "{feedback.comment}"
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{formatDate(feedback.submittedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {loadingFb && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {events.length === 0 && (
        <div className="card text-center py-16">
          <BarChart2 size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold mb-1">No events with feedback yet</p>
          <p className="text-slate-500 text-sm">Feedback will appear here once volunteers attend and review events.</p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────

export default function FeedbackPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="font-bold text-3xl flex items-center gap-3">
          <MessageSquare size={28} className="text-brand-400" /> Feedback
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isAdmin ? 'All event feedback across the platform' : 'Your submitted event reviews'}
        </p>
      </div>

      {isAdmin ? <AdminFeedbackDashboard /> : <VolunteerFeedback />}
    </div>
  );
}
