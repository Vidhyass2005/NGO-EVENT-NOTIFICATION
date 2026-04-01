// pages/AdminDashboard.js
import { useState, useEffect, useCallback } from 'react';
import {
  Users, Calendar, CheckCircle, Clock, XCircle,
  TrendingUp, Award, RefreshCw, AlertTriangle,
  BarChart2, Activity, UserPlus, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend,
} from 'recharts';
import API from '../services/api';
import { eventAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { formatDate, getCategoryIcon } from '../utils/helpers';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORY_COLORS = {
  Education:'#38bdf8', Health:'#f87171', Environment:'#4ade80',
  Community:'#a78bfa', Fundraiser:'#fbbf24', Workshop:'#fb923c', Other:'#94a3b8',
};
const STATUS_COLORS = {
  approved:'#4ade80', completed:'#38bdf8', pending:'#fbbf24', cancelled:'#f87171',
};

const StatCard = ({ label, value, Icon, color, sub }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1 text-slate-700 dark:text-slate-200">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { notify } = useNotifications();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [approving, setApproving] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      notify('Failed to load dashboard', err.response?.data?.message || '', 'event_cancelled');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleApprove = async (eventId) => {
    setApproving(eventId);
    try {
      await eventAPI.approve(eventId);
      notify('Event approved! ✅', 'It is now visible to volunteers', 'event_approved');
      fetchDashboard();
    } catch (err) {
      notify('Failed to approve', err.response?.data?.message || '', 'event_cancelled');
    } finally { setApproving(null); }
  };

  const participationChartData = data?.participationsByMonth?.map(m => ({
    name: MONTH_NAMES[m._id.month - 1], count: m.count,
  })) || [];

  const categoryChartData = data?.eventsByCategory?.map(c => ({
    name: c._id, events: c.count, participants: c.participants,
  })) || [];

  const statusChartData = data?.eventsByStatus?.map(s => ({
    name: s._id, value: s.count, color: STATUS_COLORS[s._id] || '#94a3b8',
  })) || [];

  if (loading) return (
    <div className="page-container">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 card animate-pulse bg-slate-100 dark:bg-slate-800" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-72 card animate-pulse bg-slate-100 dark:bg-slate-800" />)}
      </div>
    </div>
  );

  const { stats } = data;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-3xl flex items-center gap-3">
            <BarChart2 size={28} className="text-brand-400" /> Admin Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Complete overview of your NGO platform</p>
        </div>
        <button onClick={fetchDashboard} className="btn-outline"><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Volunteers"  value={stats.totalUsers}          Icon={Users}       color="bg-blue-500"    sub="Registered accounts" />
        <StatCard label="Total Events"      value={stats.totalEvents}         Icon={Calendar}    color="bg-indigo-500"  sub="All time" />
        <StatCard label="Participations"    value={stats.totalParticipations} Icon={TrendingUp}  color="bg-green-500"   sub="Registrations" />
        <StatCard label="Active Events"     value={stats.activeEvents}        Icon={Zap}         color="bg-cyan-500"    sub="Upcoming & open" />
        <StatCard label="Pending Approval"  value={stats.pendingEvents}       Icon={Clock}       color="bg-yellow-500"  sub="Needs your review" />
        <StatCard label="Completed Events"  value={stats.completedEvents}     Icon={CheckCircle} color="bg-emerald-500" sub="Successfully done" />
        <StatCard label="Cancelled Events"  value={stats.cancelledEvents}     Icon={XCircle}     color="bg-red-500"     sub="Cancelled" />
        <StatCard label="Completion Rate"
          value={stats.totalEvents > 0 ? `${Math.round((stats.completedEvents/stats.totalEvents)*100)}%` : '0%'}
          Icon={Award} color="bg-purple-500" sub="Events completed" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-brand-400" />
            <h2 className="font-semibold">Registrations Over Time</h2>
            <span className="text-xs text-slate-400 ml-auto">Last 6 months</span>
          </div>
          {participationChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={participationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Registrations" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: '#22d3ee', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={16} className="text-brand-400" />
            <h2 className="font-semibold">Events by Status</h2>
          </div>
          {statusChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {statusChartData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="capitalize text-slate-600 dark:text-slate-400">{s.name}</span>
                    <span className="font-bold ml-auto text-slate-800 dark:text-slate-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={16} className="text-brand-400" />
            <h2 className="font-semibold">Events by Category</h2>
          </div>
          {categoryChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChartData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="events" name="Events" radius={[4,4,0,0]}>
                  {categoryChartData.map((entry, i) => <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />)}
                </Bar>
                <Bar dataKey="participants" name="Participants" fill="#a78bfa" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-brand-400" />
            <h2 className="font-semibold">Top Events by Participation</h2>
          </div>
          {data.topEvents.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No events yet</div>
          ) : (
            <div className="space-y-3">
              {data.topEvents.map(ev => {
                const pct = Math.min(100, Math.round((ev.currentParticipants / ev.maxParticipants) * 100));
                return (
                  <div key={ev._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base w-5 flex-shrink-0">{getCategoryIcon(ev.category)}</span>
                        <span className="font-medium truncate">{ev.title}</span>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{ev.currentParticipants}/{ev.maxParticipants}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-400' : 'bg-brand-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      {data.pendingApprovals.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-yellow-50 dark:bg-yellow-900/10">
            <AlertTriangle size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-yellow-700 dark:text-yellow-400">
              Pending Approvals ({data.pendingApprovals.length})
            </h2>
            <span className="text-xs text-yellow-600 dark:text-yellow-500 ml-auto">Needs your review</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.pendingApprovals.map(ev => (
              <div key={ev._id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.category} · {formatDate(ev.date)} · by {ev.createdBy?.name}</p>
                </div>
                <button onClick={() => handleApprove(ev._id)} disabled={approving === ev._id} className="btn-primary text-xs py-1.5 px-4 flex-shrink-0">
                  {approving === ev._id
                    ? <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle size={12} /> Approve</>
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <UserPlus size={16} className="text-brand-400" />
            <h2 className="font-semibold">Recent Registrations</h2>
          </div>
          {data.recentRegistrations.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No registrations yet</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentRegistrations.map(p => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-slate-900 font-bold text-xs flex-shrink-0">
                    {p.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">Registered for <span className="text-brand-500">{p.event?.title}</span></p>
                  </div>
                  <span className={`badge text-xs capitalize flex-shrink-0 ${
                    p.status === 'attended'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <Users size={16} className="text-brand-400" />
            <h2 className="font-semibold">Recently Joined Volunteers</h2>
          </div>
          {data.recentUsers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No users yet</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentUsers.map(u => (
                <div key={u._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(u.createdAt)}</p>
                    {u.organization && <p className="text-xs text-slate-500 truncate max-w-[100px]">{u.organization}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}