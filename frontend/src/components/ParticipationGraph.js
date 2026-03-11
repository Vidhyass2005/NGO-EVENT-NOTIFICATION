// components/ParticipationGraph.js
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ParticipationGraph({ analytics }) {
  const { isDark } = useTheme();
  const text = isDark ? '#94a3b8' : '#64748b';
  const grid = isDark ? '#1e293b' : '#f1f5f9';
  const tooltip = { backgroundColor: isDark ? '#0f172a' : '#fff', borderColor: '#22d3ee', borderWidth: 1, titleColor: isDark ? '#e2e8f0' : '#0f172a', bodyColor: text };
  const scales = { x: { ticks: { color: text }, grid: { color: grid } }, y: { ticks: { color: text }, grid: { color: grid } } };

  if (!analytics?.byCategory) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const categoryBar = {
    labels: analytics.byCategory.map(c => c._id),
    datasets: [
      { label: 'Events', data: analytics.byCategory.map(c => c.count), backgroundColor: COLORS.map(c => c + '99'), borderColor: COLORS, borderWidth: 2, borderRadius: 6 },
      { label: 'Participants', data: analytics.byCategory.map(c => c.totalParticipants), backgroundColor: COLORS.map((_, i) => COLORS[(i+3)%COLORS.length] + '60'), borderColor: COLORS.map((_, i) => COLORS[(i+3)%COLORS.length]), borderWidth: 2, borderRadius: 6 }
    ]
  };

  const monthlyLine = {
    labels: analytics.byMonth?.map(m => `${MONTHS[m._id.month-1]} ${m._id.year}`) || [],
    datasets: [
      { label: 'Events', data: analytics.byMonth?.map(m => m.count) || [], borderColor: '#22d3ee', backgroundColor: '#22d3ee20', fill: true, tension: 0.4, pointBackgroundColor: '#22d3ee', pointRadius: 5 },
      { label: 'Participants', data: analytics.byMonth?.map(m => m.participants) || [], borderColor: '#818cf8', backgroundColor: '#818cf820', fill: true, tension: 0.4, pointBackgroundColor: '#818cf8', pointRadius: 5 }
    ]
  };

  const doughnut = {
    labels: analytics.byCategory.map(c => c._id),
    datasets: [{ data: analytics.byCategory.map(c => c.totalParticipants), backgroundColor: COLORS.map(c => c + 'cc'), borderColor: COLORS, borderWidth: 2, hoverOffset: 6 }]
  };

  const opts = { responsive: true, plugins: { legend: { labels: { color: text } }, tooltip } };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">Monthly Trend</h3>
        <Line data={monthlyLine} options={{ ...opts, scales }} height={70} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">Events by Category</h3>
          <Bar data={categoryBar} options={{ ...opts, scales }} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">Participation Share</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={doughnut} options={{ ...opts }} />
          </div>
        </div>
      </div>
    </div>
  );
}
