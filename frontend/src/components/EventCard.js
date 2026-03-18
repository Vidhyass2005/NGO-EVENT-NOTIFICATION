// components/EventCard.js
import { useState } from 'react';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, Info, User, Tag, AlignLeft } from 'lucide-react';
import { formatDate, formatDateTime, getStatusColor, getCategoryColor, getCategoryIcon, isEventPast } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function EventCard({
  event, onRegister, onCancelReg, onApprove,
  onComplete, onCancel, isRegistered, loading,
}) {
  const { isAdmin, user } = useAuth();
  const [showDetail, setShowDetail] = useState(false);

  const past      = isEventPast(event.date);
  const isFull    = event.currentParticipants >= event.maxParticipants;
  const isCreator = event.createdBy?._id === user?._id || event.createdBy === user?._id;
  const fillPct   = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));

  const statusColor = {
    pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved:  past
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  }[event.status] || 'bg-slate-100 text-slate-600';

  const statusLabel = {
    pending:   'Pending',
    approved:  past ? 'Past Due' : 'Upcoming',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }[event.status] || event.status;

  return (
    <div
      className={`card overflow-hidden flex flex-col transition-all duration-200 relative
        ${event.status === 'cancelled' ? 'opacity-60' : ''}
        ${showDetail ? 'shadow-xl -translate-y-1' : 'hover:shadow-md hover:-translate-y-0.5'}
      `}
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      {/* Top colour bar */}
      <div className={`h-1.5 ${
        event.status === 'cancelled' ? 'bg-red-400' :
        event.status === 'completed' ? 'bg-blue-400' :
        event.status === 'pending'   ? 'bg-yellow-400' :
        getCategoryColor(event.category).split(' ')[0]
      }`} />

      {/* HOVER DETAIL OVERLAY */}
      {showDetail && (
        <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 rounded-xl overflow-y-auto flex flex-col animate-fade-in">
          <div className={`h-1.5 flex-shrink-0 ${
            event.status === 'cancelled' ? 'bg-red-400' :
            event.status === 'completed' ? 'bg-blue-400' :
            event.status === 'pending'   ? 'bg-yellow-400' :
            getCategoryColor(event.category).split(' ')[0]
          }`} />

          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-start gap-2 flex-wrap mb-3">
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

            <h3 className="font-bold text-base leading-snug mb-3">{event.title}</h3>

            <div className="flex gap-2 mb-3">
              <AlignLeft size={13} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {event.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Calendar size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Start</p>
                  <p className="text-slate-500">{formatDateTime(event.date)}</p>
                </div>
              </div>

              {event.endDate && (
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">End</p>
                    <p className="text-slate-500">{formatDateTime(event.endDate)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-slate-500">{event.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Users size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-slate-500">{event.currentParticipants} registered · {event.maxParticipants - event.currentParticipants} slots left</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <User size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Organised by</p>
                  <p className="text-slate-500">{event.createdBy?.name || 'Unknown'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Tag size={12} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Category</p>
                  <p className="text-slate-500">{event.category}</p>
                </div>
              </div>

              {event.status === 'cancelled' && event.cancelReason && (
                <div className="flex items-start gap-2 text-red-500">
                  <XCircle size={12} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Cancel Reason</p>
                    <p>{event.cancelReason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 mb-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{fillPct}% full</span>
                <span>{event.currentParticipants}/{event.maxParticipants}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${fillPct > 80 ? 'bg-red-400' : 'bg-brand-400'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto">
              {!isAdmin && event.status === 'approved' && !past && (
                isRegistered ? (
                  <button onClick={() => onCancelReg(event._id)} disabled={loading} className="btn-danger text-xs py-1.5 flex-1 justify-center">
                    <XCircle size={13} /> Cancel Registration
                  </button>
                ) : (
                  <button onClick={() => onRegister(event._id)} disabled={loading || isFull} className="btn-primary text-xs py-1.5 flex-1 justify-center">
                    {isFull ? 'Event Full' : 'Register Now'}
                  </button>
                )
              )}
              {!isAdmin && event.status === 'approved' && past && isRegistered && (
                <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                  <CheckCircle size={11} className="inline mr-1" /> You're Registered
                </span>
              )}
              {!isAdmin && isCreator && event.status === 'pending' && (
                <button onClick={() => onCancel(event._id)} disabled={loading} className="btn-outline text-xs py-1.5 flex-1 justify-center">Withdraw</button>
              )}
              {isAdmin && event.status === 'pending' && (
                <button onClick={() => onApprove(event._id)} disabled={loading} className="btn-primary text-xs py-1.5 flex-1 justify-center">
                  <CheckCircle size={13} /> Approve
                </button>
              )}
              {isAdmin && event.status === 'approved' && (
                <button onClick={() => onComplete(event._id)} disabled={loading}
                  className="text-xs py-1.5 flex-1 justify-center inline-flex items-center gap-1.5 font-semibold rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50">
                  🎉 Mark Complete
                </button>
              )}
              {isAdmin && ['pending','approved'].includes(event.status) && (
                <button onClick={() => onCancel(event._id)} disabled={loading} className="btn-danger text-xs py-1.5 flex-1 justify-center">
                  <XCircle size={13} /> Cancel Event
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NORMAL CARD VIEW */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
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
          <Info size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0" title="Hover for details" />
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

        <div className="mb-4">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${fillPct > 80 ? 'bg-red-400' : 'bg-brand-400'}`} style={{ width: `${fillPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{fillPct}% full · By {event.createdBy?.name || 'Unknown'}</p>
        </div>

        {event.status === 'cancelled' && event.cancelReason && (
          <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">
              <XCircle size={11} className="inline mr-1" />Reason: {event.cancelReason}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto">
          {!isAdmin && event.status === 'approved' && !past && (
            isRegistered ? (
              <button onClick={() => onCancelReg(event._id)} disabled={loading} className="btn-danger text-xs py-1.5 flex-1 justify-center">
                <XCircle size={13} /> Cancel Registration
              </button>
            ) : (
              <button onClick={() => onRegister(event._id)} disabled={loading || isFull} className="btn-primary text-xs py-1.5 flex-1 justify-center">
                {isFull ? 'Event Full' : 'Register Now'}
              </button>
            )
          )}
          {!isAdmin && event.status === 'approved' && past && isRegistered && (
            <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
              <CheckCircle size={11} className="inline mr-1" /> You're Registered
            </span>
          )}
          {!isAdmin && isCreator && event.status === 'pending' && (
            <button onClick={() => onCancel(event._id)} disabled={loading} className="btn-outline text-xs py-1.5 flex-1 justify-center">Withdraw</button>
          )}
          {isAdmin && event.status === 'pending' && (
            <button onClick={() => onApprove(event._id)} disabled={loading} className="btn-primary text-xs py-1.5 flex-1 justify-center">
              <CheckCircle size={13} /> Approve
            </button>
          )}
          {isAdmin && event.status === 'approved' && (
            <button onClick={() => onComplete(event._id)} disabled={loading}
              className="text-xs py-1.5 flex-1 justify-center inline-flex items-center gap-1.5 font-semibold rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50">
              🎉 Mark Complete
            </button>
          )}
          {isAdmin && ['pending','approved'].includes(event.status) && (
            <button onClick={() => onCancel(event._id)} disabled={loading} className="btn-danger text-xs py-1.5 flex-1 justify-center">
              <XCircle size={13} /> Cancel Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}