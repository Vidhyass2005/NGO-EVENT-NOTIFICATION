// components/EventCard.js
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDate, getStatusColor, getCategoryColor, getCategoryIcon, isEventPast } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function EventCard({ event, onRegister, onCancelReg, onApprove, onComplete, onCancel, isRegistered, loading }) {
  const { isAdmin, user } = useAuth();
  const past      = isEventPast(event.date);
  const isFull    = event.currentParticipants >= event.maxParticipants;
  const isCreator = event.createdBy?._id === user?._id || event.createdBy === user?._id;
  const fillPct   = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));

  return (
    <div className={`card overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${past && event.status !== 'completed' ? 'opacity-75' : ''}`}>
      <div className={`h-1.5 ${getCategoryColor(event.category).split(' ')[0]}`} />
      <div className="p-5 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`badge text-xs ${getCategoryColor(event.category)}`}>{getCategoryIcon(event.category)} {event.category}</span>
          <span className={`badge text-xs capitalize ${getStatusColor(event.status)}`}>{event.status}</span>
          {past && event.status === 'approved' && <span className="badge text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Past Due</span>}
        </div>

        <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">{event.title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{event.description}</p>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar size={12} className="text-brand-400 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={12} className="text-brand-400 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Users size={12} className="text-brand-400 flex-shrink-0" />
            <span>{event.currentParticipants}/{event.maxParticipants}</span>
            {isFull && <span className="badge text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Full</span>}
          </div>
        </div>

        <div className="mb-3">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${fillPct > 80 ? 'bg-red-400' : 'bg-brand-400'}`} style={{ width: `${fillPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{fillPct}% full · By {event.createdBy?.name || 'Unknown'}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {/* Volunteer: register / cancel */}
          {!isAdmin && event.status === 'approved' && !past && (
            isRegistered
              ? <button onClick={() => onCancelReg(event._id)} disabled={loading} className="btn-danger text-xs py-1.5 flex-1 justify-center">Cancel Registration</button>
              : <button onClick={() => onRegister(event._id)} disabled={loading || isFull} className="btn-primary text-xs py-1.5 flex-1 justify-center">{isFull ? 'Event Full' : 'Register'}</button>
          )}

          {/* Admin: approve pending */}
          {isAdmin && event.status === 'pending' && (
            <button onClick={() => onApprove(event._id)} disabled={loading} className="btn-primary text-xs py-1.5 flex-1 justify-center">✅ Approve</button>
          )}

          {/* Admin: complete approved (esp. past-due) */}
          {isAdmin && event.status === 'approved' && (
            <button onClick={() => onComplete(event._id)} disabled={loading}
              className="btn-outline text-xs py-1.5 flex-1 justify-center border-blue-300 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              🎉 Complete
            </button>
          )}

          {/* Admin: cancel pending/approved */}
          {isAdmin && ['pending','approved'].includes(event.status) && (
            <button onClick={() => onCancel(event._id)} disabled={loading} className="btn-danger text-xs py-1.5 flex-1 justify-center">Cancel</button>
          )}

          {/* Creator can withdraw pending events */}
          {!isAdmin && isCreator && event.status === 'pending' && (
            <button onClick={() => onCancel(event._id)} disabled={loading} className="btn-outline text-xs py-1.5 flex-1 justify-center">Withdraw</button>
          )}
        </div>
      </div>
    </div>
  );
}
