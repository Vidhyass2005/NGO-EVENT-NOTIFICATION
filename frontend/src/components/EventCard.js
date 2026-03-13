// components/EventCard.js
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate, getStatusColor, getCategoryColor, getCategoryIcon, isEventPast } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function EventCard({
  event, onRegister, onCancelReg, onApprove,
  onComplete, onCancel, isRegistered, loading,
}) {
  const { isAdmin, user } = useAuth();
  const past      = isEventPast(event.date);
  const isFull    = event.currentParticipants >= event.maxParticipants;
  const isCreator = event.createdBy?._id === user?._id || event.createdBy === user?._id;
  const fillPct   = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));

  // Status display label
  const statusLabel = {
    pending:   'Pending',
    approved:  past ? 'Past Due' : 'Upcoming',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }[event.status] || event.status;

  const statusColor = {
    pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved:  past
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  }[event.status] || 'bg-slate-100 text-slate-600';

  return (
    <div className={`card overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${event.status === 'cancelled' ? 'opacity-60' : ''}`}>

      {/* Top colour bar — changes by status */}
      <div className={`h-1.5 ${
        event.status === 'cancelled' ? 'bg-red-400' :
        event.status === 'completed' ? 'bg-blue-400' :
        event.status === 'pending'   ? 'bg-yellow-400' :
        getCategoryColor(event.category).split(' ')[0]
      }`} />

      <div className="p-5 flex flex-col flex-1">

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`badge text-xs ${getCategoryColor(event.category)}`}>
            {getCategoryIcon(event.category)} {event.category}
          </span>
          <span className={`badge text-xs capitalize ${statusColor}`}>
            {event.status === 'approved' && past
              ? <><Clock size={10} className="inline mr-1" />Past Due</>
              : statusLabel
            }
          </span>
        </div>

        <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">{event.title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{event.description}</p>

        {/* Details */}
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
            {isFull && (
              <span className="badge text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Full</span>
            )}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mb-4">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fillPct > 80 ? 'bg-red-400' : 'bg-brand-400'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {fillPct}% full · By {event.createdBy?.name || 'Unknown'}
          </p>
        </div>

        {/* Cancel reason banner */}
        {event.status === 'cancelled' && event.cancelReason && (
          <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">
              <XCircle size={11} className="inline mr-1" />
              Reason: {event.cancelReason}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-auto">

          {/* ── VOLUNTEER ACTIONS ── */}
          {!isAdmin && event.status === 'approved' && !past && (
            isRegistered ? (
              <button
                onClick={() => onCancelReg(event._id)}
                disabled={loading}
                className="btn-danger text-xs py-1.5 flex-1 justify-center"
              >
                <XCircle size={13} /> Cancel Registration
              </button>
            ) : (
              <button
                onClick={() => onRegister(event._id)}
                disabled={loading || isFull}
                className="btn-primary text-xs py-1.5 flex-1 justify-center"
              >
                {isFull ? 'Event Full' : 'Register Now'}
              </button>
            )
          )}

          {/* Registered badge for past approved events */}
          {!isAdmin && event.status === 'approved' && past && isRegistered && (
            <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
              <CheckCircle size={11} className="inline mr-1" /> You're Registered
            </span>
          )}

          {/* Creator can withdraw their own pending event */}
          {!isAdmin && isCreator && event.status === 'pending' && (
            <button
              onClick={() => onCancel(event._id)}
              disabled={loading}
              className="btn-outline text-xs py-1.5 flex-1 justify-center"
            >
              Withdraw
            </button>
          )}

          {/* ── ADMIN ACTIONS ── */}

          {/* Approve pending events */}
          {isAdmin && event.status === 'pending' && (
            <button
              onClick={() => onApprove(event._id)}
              disabled={loading}
              className="btn-primary text-xs py-1.5 flex-1 justify-center"
            >
              <CheckCircle size={13} /> Approve
            </button>
          )}

          {/* Manually complete approved events (past-due or early) */}
          {isAdmin && event.status === 'approved' && (
            <button
              onClick={() => onComplete(event._id)}
              disabled={loading}
              className="text-xs py-1.5 flex-1 justify-center inline-flex items-center gap-1.5 font-semibold rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              🎉 Mark Complete
            </button>
          )}

          {/* Cancel — admin can cancel pending OR approved at ANY time */}
          {isAdmin && ['pending', 'approved'].includes(event.status) && (
            <button
              onClick={() => onCancel(event._id)}
              disabled={loading}
              className="btn-danger text-xs py-1.5 flex-1 justify-center"
            >
              <XCircle size={13} /> Cancel Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
