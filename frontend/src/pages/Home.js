// pages/Home.js
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, CalendarCheck, CalendarClock } from 'lucide-react';
import { eventAPI, participationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { isEventPast } from '../utils/helpers';
import EventCard from '../components/EventCard';
import RegisterModal from '../components/RegisterModal';

const CATEGORIES = ['All','Education','Health','Environment','Community','Fundraiser','Workshop','Other'];

const ADMIN_TABS = [
  { value: 'approved',  label: '📅 Upcoming'  },
  { value: 'completed', label: '✅ Completed'  },
  { value: 'pending',   label: '⏳ Pending'    },
  { value: 'cancelled', label: '❌ Cancelled'  },
];

const VOLUNTEER_TABS = [
  { value: 'current', label: 'Current Events', icon: CalendarCheck },
  { value: 'past',    label: 'Past Events',    icon: CalendarClock  },
];

const EMPTY_FORM = { title:'', description:'', date:'', endDate:'', location:'', category:'Other', maxParticipants:50 };

export default function Home() {
  const { isAdmin }  = useAuth();
  const { on, off }  = useSocket();
  const { notify }   = useNotifications();

  const [events,         setEvents]         = useState([]);
  const [registeredIds,  setRegisteredIds]  = useState(new Set());
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [showCreate,     setShowCreate]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [category,       setCategory]       = useState('All');
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [registerEvent,  setRegisterEvent]  = useState(null);

  const [adminTab,     setAdminTab]     = useState('approved');
  const [volunteerTab, setVolunteerTab] = useState('current');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (isAdmin) {
        params.status = adminTab;
        params.all    = 'true';
      } else {
        params.status = 'approved';
        params.limit  = 200;
      }
      if (category !== 'All') params.category = category;
      const res = await eventAPI.getAll(params);
      setEvents(res.data.events);
    } catch {
      notify('Failed to load events', 'Please refresh the page', 'event_cancelled');
    } finally { setLoading(false); }
  }, [adminTab, category, isAdmin]); // eslint-disable-line

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    participationAPI.myHistory()
      .then(res => setRegisteredIds(new Set(res.data.history.map(p => p.event?._id))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (data) => {
      if (data.type === 'new_event')       fetchEvents();
      if (data.type === 'event_completed') fetchEvents();
      if (data.type === 'event_cancelled') {
        setEvents(prev => prev.map(e =>
          e._id === data.eventId ? { ...e, status: 'cancelled' } : e
        ));
      }
    };
    on('event_update', handler);
    return () => off('event_update', handler);
  }, [on, off, fetchEvents]);

  // Split approved events by date for volunteer view
  const currentEvents = events.filter(e => !isEventPast(e.date));
  const pastEvents    = events.filter(e =>  isEventPast(e.date));
  const volunteerList = volunteerTab === 'current' ? currentEvents : pastEvents;

  const applyFilters = (list) => list.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  const displayEvents = applyFilters(isAdmin ? events : volunteerList);

  const handleRegisterClick = (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (event) setRegisterEvent(event);
  };

  const handleRegisterSubmit = async (eventId, formDetails) => {
    setActionLoading(true);
    try {
      await participationAPI.register(eventId, formDetails);
      setRegisteredIds(prev => new Set([...prev, eventId]));
      setEvents(prev => prev.map(e =>
        e._id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e
      ));
      setRegisterEvent(null);
      notify('Registration Confirmed! 🎫', 'Check your notifications for details', 'registration');
    } catch (err) {
      notify('Registration failed', err.response?.data?.message || '', 'event_cancelled');
    } finally { setActionLoading(false); }
  };

  const handleCancelReg = async (id) => {
    setActionLoading(true);
    try {
      await participationAPI.unregister(id);
      setRegisteredIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setEvents(prev => prev.map(e =>
        e._id === id ? { ...e, currentParticipants: Math.max(0, e.currentParticipants - 1) } : e
      ));
      notify('Registration cancelled', '', 'system');
    } catch (err) {
      notify('Failed', err.response?.data?.message || '', 'event_cancelled');
    } finally { setActionLoading(false); }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await eventAPI.approve(id);
      fetchEvents();
      notify('Event approved! ✅', 'Volunteers can now register', 'event_approved');
    } catch (err) {
      notify('Failed', err.response?.data?.message || '', 'event_cancelled');
    } finally { setActionLoading(false); }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this event as completed?\nAll registered participants will be marked as attended.')) return;
    setActionLoading(true);
    try {
      await eventAPI.complete(id);
      fetchEvents();
      notify('Event completed! 🎉', 'Participants have been notified', 'event_approved');
    } catch (err) {
      notify('Failed', err.response?.data?.message || '', 'event_cancelled');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Enter cancellation reason:\n(Will be shown to all registered participants)');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await eventAPI.cancel(id, reason || 'Cancelled by admin');
      fetchEvents();
      notify('Event cancelled', 'All participants have been notified', 'event_cancelled');
    } catch (err) {
      notify('Failed', err.response?.data?.message || '', 'event_cancelled');
    } finally { setActionLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await eventAPI.create(form);
      notify('Event submitted! 📋', 'Waiting for admin approval', 'event_created');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      if (isAdmin) fetchEvents();
    } catch (err) {
      notify('Failed', err.response?.data?.message || '', 'event_cancelled');
    } finally { setActionLoading(false); }
  };

  const TabBar = ({ tabs, active, onChange, counts }) => (
    <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      {tabs.map(tab => {
        const Icon  = tab.icon;
        const count = counts?.[tab.value];
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              active === tab.value
                ? 'border-brand-400 text-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {Icon && <Icon size={14} />}
            {tab.label}
            {count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                active === tab.value
                  ? 'bg-brand-400/20 text-brand-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="page-container">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-3xl">Events</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Manage, approve and control all events'
              : 'Discover and join upcoming community events'}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> New Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or location..." className="input pl-9" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input sm:w-44">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={fetchEvents} className="btn-outline">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Admin tabs */}
      {isAdmin && (
        <TabBar tabs={ADMIN_TABS} active={adminTab} onChange={setAdminTab} />
      )}

      {/* Volunteer tabs with live counts */}
      {!isAdmin && !loading && (
        <TabBar
          tabs={VOLUNTEER_TABS}
          active={volunteerTab}
          onChange={(v) => { setVolunteerTab(v); setSearch(''); }}
          counts={{ current: currentEvents.length, past: pastEvents.length }}
        />
      )}

      {/* Volunteer empty states */}
      {!isAdmin && !loading && volunteerTab === 'current' && currentEvents.length === 0 && (
        <div className="text-center py-16 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">🗓️</p>
          <h3 className="font-semibold text-base mb-1">No upcoming events right now</h3>
          <p className="text-slate-500 text-sm">Check back soon or create a new event to get started.</p>
        </div>
      )}
      {!isAdmin && !loading && volunteerTab === 'past' && pastEvents.length === 0 && (
        <div className="text-center py-16 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">📚</p>
          <h3 className="font-semibold text-base mb-1">No past events yet</h3>
          <p className="text-slate-500 text-sm">Events that have ended will appear here.</p>
        </div>
      )}

      {/* Events grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-72 card animate-pulse bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : displayEvents.length === 0 && (isAdmin || volunteerList.length > 0) ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="font-semibold text-lg mb-1">No results match your search</h3>
          <p className="text-slate-500 text-sm">Try a different keyword or category.</p>
        </div>
      ) : displayEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayEvents.map(event => (
            <EventCard key={event._id} event={event}
              isRegistered={registeredIds.has(event._id)}
              loading={actionLoading}
              onRegister={handleRegisterClick}
              onCancelReg={handleCancelReg}
              onApprove={handleApprove}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </div>
      ) : null}

      {/* Registration Form Modal */}
      {registerEvent && (
        <RegisterModal
          event={registerEvent}
          loading={actionLoading}
          onClose={() => setRegisterEvent(null)}
          onSubmit={handleRegisterSubmit}
        />
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-in">
            <h2 className="font-bold text-xl mb-1">Create New Event</h2>
            <p className="text-sm text-slate-500 mb-6">It will be submitted for admin approval before going live.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Event Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Community Clean-up Drive" />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input resize-none" rows={3} placeholder="Describe your event..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input type="datetime-local" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Location *</label>
                <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input" placeholder="City Hall Park, Chennai" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
                    {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Max Participants</label>
                  <input type="number" min={1} value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: +e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn-primary flex-1 justify-center">
                  {actionLoading
                    ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    : '📋 Submit for Approval'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}