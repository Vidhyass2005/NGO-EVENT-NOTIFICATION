// pages/History.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Award, MessageSquare, CheckCircle } from 'lucide-react';
import { isEventPast } from '../utils/helpers';
import { participationAPI } from '../services/api';
import { formatDate, getStatusColor, getCategoryColor, getCategoryIcon } from '../utils/helpers';
import FeedbackModal from '../components/FeedbackModal';

const STAR_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

export default function History() {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchHistory = () => {
    setLoading(true);
    participationAPI.myHistory()
      .then(res => setHistory(res.data.history))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">My History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Events you've registered for</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',        value: history.length,                                              emoji: '📅' },
          { label: 'Attended',     value: history.filter(p => p.status === 'attended').length,         emoji: '✅' },
          { label: 'Certificates', value: history.filter(p => p.certificateGenerated).length,          emoji: '🏆' },
          { label: 'Feedback',     value: history.filter(p => p.feedback?.rating).length,              emoji: '💬' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <span className="text-2xl">{s.emoji}</span>
            <p className="font-bold text-2xl mt-1">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📭</p>
          <h3 className="font-semibold text-lg mb-2">No history yet</h3>
          <Link to="/" className="btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((p) => {
            const { _id, event, status, registeredAt, feedback } = p;
            const hasFeedback = !!feedback?.rating;

            // Show feedback button if: attended, OR event is completed, OR event date is past
            const eventPast   = isEventPast(event?.date);
            const eventDone   = event?.status === 'completed';
            const canFeedback = (status === 'attended' || eventPast || eventDone) && !hasFeedback;

            return (
              <div key={_id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                  {/* Category icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${getCategoryColor(event?.category).split(' ')[0]}`}>
                    {getCategoryIcon(event?.category)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold truncate">{event?.title}</h3>
                      <span className={`badge text-xs capitalize ${getStatusColor(event?.status)}`}>{event?.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event?.date)}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{event?.location}</span>
                      <span>Registered: {formatDate(registeredAt)}</span>
                    </div>

                    {/* Show submitted feedback summary */}
                    {hasFeedback && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-slate-500">Your feedback:</span>
                        <span className="text-base leading-none">{feedback.emoji}</span>
                        <span className="text-sm" style={{ color: STAR_COLORS[feedback.rating] }}>
                          {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                        </span>
                        {feedback.comment && (
                          <span className="text-xs text-slate-400 italic truncate max-w-[200px]">"{feedback.comment}"</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {/* Attendance badge */}
                    <span className={`badge capitalize text-xs ${
                      status === 'attended'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>{status}</span>

                    {/* Feedback button */}
                    {canFeedback && (
                      <button
                        onClick={() => setSelected(p)}
                        className="btn-outline text-xs py-1.5 gap-1 border-indigo-300 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <MessageSquare size={13} /> Give Feedback
                      </button>
                    )}

                    {/* Feedback submitted badge */}
                    {hasFeedback && (
                      <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs gap-1 flex items-center">
                        <CheckCircle size={11} /> Reviewed
                      </span>
                    )}

                    {/* Certificate button */}
                    <Link
                      to={`/certificates?eventId=${event?._id}`}
                      className="btn-outline text-xs py-1.5 gap-1"
                    >
                      <Award size={13} /> Certificate
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {selected && (
        <FeedbackModal
          participation={selected}
          onClose={() => setSelected(null)}
          onSubmitted={fetchHistory}
        />
      )}
    </div>
  );
}