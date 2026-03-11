// utils/helpers.js

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const isEventPast = (date) => new Date(date) < new Date();

export const getStatusColor = (status) => ({
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}[status] || 'bg-slate-100 text-slate-600');

export const getCategoryIcon = (category) => ({
  Education: '📚', Health: '🏥', Environment: '🌱',
  Community: '🤝', Fundraiser: '💰', Workshop: '🔧', Other: '📌'
}[category] || '📌');

export const getCategoryColor = (category) => ({
  Education:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Health:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Environment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Community:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Fundraiser:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Workshop:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Other:       'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}[category] || 'bg-slate-100 text-slate-600');

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
};

export const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), filename);
};
