// pages/Analytics.js
import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Calendar, Award, Download,
  RefreshCw, BarChart2, Activity, Target, Zap,
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const PALETTE = {
  cyan:    '#22d3ee',
  blue:    '#38bdf8',
  violet:  '#a78bfa',
  emerald: '#34d399',
  rose:    '#fb7185',
  amber:   '#fbbf24',
  slate:   '#475569',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_COLORS = {
  Education:   PALETTE.blue,
  Health:      PALETTE.rose,
  Environment: PALETTE.emerald,
  Community:   PALETTE.violet,
  Fundraiser:  PALETTE.amber,
  Workshop:    PALETTE.cyan,
  Other:       PALETTE.slate,
};

// ── Custom Tooltip ────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(34,211,238,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      fontSize: 12,
    }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || PALETTE.cyan, margin: '3px 0' }}>
          {p.name}: <strong style={{ color: '#f1f5f9' }}>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, trend, sub }) => (
  <div className="card p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-200">
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `radial-gradient(circle at 0% 0%, ${color}15 0%, transparent 60%)` }}
    />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        <TrendingUp size={11} className={trend < 0 ? 'rotate-180' : ''} />
        {Math.abs(trend)}% vs last month
      </div>
    )}
  </div>
);

// ── Section Header ────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, sub, action }) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
        <Icon size={16} className="text-cyan-400" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-100 text-base">{title}</h2>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ── CSV Export ───────────────────────────────────────────────
const exportCSV = (data, filename) => {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════
export default function Analytics() {
  const { notify } = useNotifications();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState(6);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getStats();
      setData(res.data);
    } catch {
      notify('Failed to load analytics', '', 'event_cancelled');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="page-container">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 card animate-pulse" style={{ background: '#0f172a' }} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-72 card animate-pulse" style={{ background: '#0f172a' }} />
        ))}
      </div>
    </div>
  );

  // ── Normalise API data ──────────────────────────────────────
  const overview     = data?.overview     || {};
  const monthly      = (data?.monthly     || []).slice(-range);
  const categories   = data?.categories   || data?.byCategory || [];
  const topEvents    = data?.topEvents    || [];

  const monthlyChartData = monthly.map(m => ({
    name:         MONTHS[(m._id?.month ?? m.month ?? 1) - 1],
    Events:       m.events       ?? m.eventCount      ?? 0,
    Participants: m.participants  ?? m.participantCount ?? 0,
  }));

  const categoryChartData = categories.map(c => ({
    name:         c._id ?? c.category ?? c.name ?? 'Other',
    Events:       c.count       ?? c.events       ?? 0,
    Participants: c.participants ?? c.participantCount ?? 0,
    fill:         CATEGORY_COLORS[c._id ?? c.category ?? 'Other'] ?? PALETTE.slate,
  }));

  const radarData = categoryChartData.map(c => ({
    subject:  c.name,
    Events:   c.Events,
    Participants: Math.round(c.Participants / Math.max(1, c.Events)),
  }));

  const pieData = categoryChartData.map(c => ({ name: c.name, value: c.Events, fill: c.fill }));

  const totalEvents        = overview.totalEvents        ?? categories.reduce((s, c) => s + (c.count ?? c.events ?? 0), 0);
  const totalParticipants  = overview.totalParticipants  ?? categories.reduce((s, c) => s + (c.participants ?? c.participantCount ?? 0), 0);
  const avgParticipation   = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
  const completionRate     = overview.completionRate     ?? (overview.completedEvents && overview.totalEvents
    ? Math.round((overview.completedEvents / overview.totalEvents) * 100)
    : null);

  return (
    <div className="page-container">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/10 flex items-center justify-center">
              <BarChart2 size={20} className="text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">Platform-wide insights and event performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {[3, 6, 12].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  range === r
                    ? 'bg-cyan-400 text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}M
              </button>
            ))}
          </div>
          <button
            onClick={() => exportCSV(monthlyChartData, 'ngo-analytics.csv')}
            className="btn-outline text-xs gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
          <button onClick={fetchData} className="btn-outline text-xs gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Events"       value={totalEvents}       icon={Calendar} color={PALETTE.cyan}    sub="All time" />
        <StatCard label="Total Participants" value={totalParticipants} icon={Users}    color={PALETTE.blue}    sub="Registrations" />
        <StatCard label="Avg per Event"      value={avgParticipation}  icon={Target}   color={PALETTE.violet}  sub="Participants" />
        <StatCard
          label="Completion Rate"
          value={completionRate !== null ? `${completionRate}%` : '—'}
          icon={Award}
          color={PALETTE.emerald}
          sub="Events completed"
        />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Area Chart — full width on smaller, 2/3 on lg */}
        <div className="card p-6 lg:col-span-2">
          <SectionHeader
            icon={Activity}
            title="Monthly Trend"
            sub={`Events & participations over the last ${range} months`}
          />
          {monthlyChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-500">
              <BarChart2 size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No monthly data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PALETTE.cyan}  stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PALETTE.cyan}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PALETTE.violet} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PALETTE.violet} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Area type="monotone" dataKey="Events"       stroke={PALETTE.cyan}   strokeWidth={2} fill="url(#gradCyan)"   dot={{ r: 3, fill: PALETTE.cyan }}   activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Participants" stroke={PALETTE.violet} strokeWidth={2} fill="url(#gradViolet)" dot={{ r: 3, fill: PALETTE.violet }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — 1/3 */}
        <div className="card p-6">
          <SectionHeader icon={Target} title="By Category" sub="Event distribution" />
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {pieData.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Bar Chart */}
        <div className="card p-6">
          <SectionHeader
            icon={BarChart2}
            title="Category Performance"
            sub="Events vs participants per category"
            action={
              <button
                onClick={() => exportCSV(categoryChartData, 'ngo-categories.csv')}
                className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <Download size={11} /> CSV
              </button>
            }
          />
          {categoryChartData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChartData} barSize={16} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar dataKey="Events" radius={[4,4,0,0]}>
                  {categoryChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
                <Bar dataKey="Participants" fill={PALETTE.violet} radius={[4,4,0,0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar Chart */}
        <div className="card p-6">
          <SectionHeader icon={Zap} title="Category Radar" sub="Avg participants per event by category" />
          {radarData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Radar name="Events"      dataKey="Events"       stroke={PALETTE.cyan}   fill={PALETTE.cyan}   fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Avg Attend." dataKey="Participants" stroke={PALETTE.violet} fill={PALETTE.violet} fillOpacity={0.1}  strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top Events Table ─────────────────────────────────── */}
      {topEvents.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
            <TrendingUp size={16} className="text-cyan-400" />
            <h2 className="font-semibold text-slate-100">Top Events by Participation</h2>
            <span className="text-xs text-slate-500 ml-auto">Most popular events</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {topEvents.map((ev, i) => {
              const pct = Math.min(100, Math.round(((ev.currentParticipants ?? ev.participants ?? 0) / Math.max(1, ev.maxParticipants ?? ev.capacity ?? 100)) * 100));
              return (
                <div key={ev._id ?? i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-800/30 transition-colors">
                  <span className="text-xl font-bold text-slate-600 w-7 flex-shrink-0">
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: pct > 80 ? PALETTE.rose : PALETTE.cyan }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{pct}% full</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-cyan-400">{ev.currentParticipants ?? ev.participants ?? 0}</p>
                    <p className="text-xs text-slate-500">participants</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────── */}
      {!loading && totalEvents === 0 && (
        <div className="text-center py-20 card">
          <BarChart2 size={48} className="mx-auto mb-4 text-slate-700" />
          <h3 className="font-semibold text-slate-300 text-lg mb-2">No analytics yet</h3>
          <p className="text-slate-500 text-sm">Analytics will appear once events are created and approved.</p>
        </div>
      )}
    </div>
  );
}