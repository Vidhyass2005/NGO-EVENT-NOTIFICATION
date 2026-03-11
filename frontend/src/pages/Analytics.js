// pages/Analytics.js
import { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, Calendar, Clock } from 'lucide-react';
import { eventAPI } from '../services/api';
import { exportToCSV } from '../utils/helpers';
import ParticipationGraph from '../components/ParticipationGraph';
import { useNotifications } from '../context/NotificationContext';

export default function Analytics() {
  const [analytics, setAnalytics] = useState({});
  const { notify } = useNotifications();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventAPI.analytics()
      .then(res => setAnalytics(res.data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    if (!analytics.byCategory?.length) { notify('No data to export', '', 'event_cancelled'); return; }
    exportToCSV(analytics.byCategory.map(c => ({ Category: c._id, Events: c.count, Participants: c.totalParticipants })), 'ngo-analytics.csv');
    notify('CSV exported! 📊', '', 'event_approved');
  };

  const stats = [
    { label: 'Total Events', value: analytics.totalEvents || 0, Icon: Calendar, color: 'text-brand-400' },
    { label: 'Participations', value: analytics.totalParticipations || 0, Icon: Users, color: 'text-indigo-400' },
    { label: 'Total Users', value: analytics.totalUsers || 0, Icon: TrendingUp, color: 'text-green-400' },
    { label: 'Pending Approval', value: analytics.pendingApprovals || 0, Icon: Clock, color: 'text-yellow-400' },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-3xl">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Event participation insights</p>
        </div>
        <button onClick={handleExport} className="btn-outline"><Download size={16} /> Export CSV</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <Icon size={20} className={color} />
              <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-bold text-3xl">{loading ? '—' : value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {loading
        ? <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
        : <ParticipationGraph analytics={analytics} />
      }

      {!loading && analytics.byCategory?.length > 0 && (
        <div className="card mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold">Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Category', 'Events', 'Participants', 'Avg/Event'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.byCategory.map(cat => (
                  <tr key={cat._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium">{cat._id}</td>
                    <td className="px-6 py-4 text-brand-500 font-semibold">{cat.count}</td>
                    <td className="px-6 py-4">{cat.totalParticipants}</td>
                    <td className="px-6 py-4 text-slate-500">{cat.count > 0 ? Math.round(cat.totalParticipants / cat.count) : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
