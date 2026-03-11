// components/FeedbackModal.js
import { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { participationAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const EMOJIS = [
  { emoji: '😞', label: 'Poor'      },
  { emoji: '😐', label: 'Average'   },
  { emoji: '🙂', label: 'Good'      },
  { emoji: '😊', label: 'Great'     },
  { emoji: '🤩', label: 'Excellent' },
];
const STAR_COLORS  = ['','#ef4444','#f97316','#f59e0b','#84cc16','#22c55e'];
const STAR_LABELS  = ['','Poor','Fair','Good','Great','Excellent'];

export default function FeedbackModal({ participation, onClose, onSubmitted }) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [emoji,   setEmoji]   = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify }            = useNotifications();

  const event      = participation?.event;
  const canSubmit  = rating > 0 && emoji;
  const activeColor= STAR_COLORS[hovered || rating] || '#94a3b8';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await participationAPI.submitFeedback(event._id, { rating, emoji, comment });
      notify('Feedback submitted! 🙏', 'Thank you for your review', 'event_approved');
      onSubmitted();
      onClose();
    } catch (err) {
      notify('Failed to submit', err.response?.data?.message || '', 'event_cancelled');
    } finally { setLoading(false); }
  };

  if (!participation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-md animate-slide-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-lg">Rate Your Experience</h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{event?.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Star Rating <span className="text-red-400">*</span></p>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-125 active:scale-95 focus:outline-none">
                  <Star size={32}
                    fill={star <= (hovered||rating) ? activeColor : 'transparent'}
                    color={star <= (hovered||rating) ? activeColor : '#cbd5e1'}
                    className="transition-colors duration-100" />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 text-sm font-medium" style={{ color: STAR_COLORS[rating] }}>{STAR_LABELS[rating]}</span>}
            </div>
          </div>
          {/* Emoji Scale */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Overall Experience <span className="text-red-400">*</span></p>
            <div className="flex items-center justify-between gap-2">
              {EMOJIS.map(({ emoji: e, label }) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-150 flex-1 ${
                    emoji === e ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                  <span className="text-2xl leading-none">{e}</span>
                  <span className={`text-xs font-medium ${emoji === e ? 'text-brand-500' : 'text-slate-500'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Comment */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Comments <span className="text-slate-400 font-normal">(optional)</span></p>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} maxLength={500}
              placeholder="Share your experience, suggestions..." className="input resize-none text-sm" />
            <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/500</p>
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full btn-primary py-3 justify-center text-base">
            {loading ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Feedback</>}
          </button>
          {!canSubmit && <p className="text-xs text-center text-slate-400 -mt-2">Please select a star rating and emoji to continue</p>}
        </div>
      </div>
    </div>
  );
}
