// pages/Certificates.js
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, Download, RefreshCw } from 'lucide-react';
import { certificateAPI, participationAPI } from '../services/api';
import { formatDate, downloadBlob } from '../utils/helpers';
import { useNotifications } from '../context/NotificationContext';

export default function Certificates() {
  const [searchParams] = useSearchParams();
  const [certificates, setCertificates] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const { notify } = useNotifications();

  useEffect(() => {
    Promise.all([certificateAPI.getMine(), participationAPI.myHistory()])
      .then(([certRes, histRes]) => {
        setCertificates(certRes.data.certificates);
        setEligible(histRes.data.history.filter(p => !p.certificateGenerated && p.event));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-generate if eventId in URL
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && !loading) handleGenerate(eventId);
  }, [searchParams, loading]); // eslint-disable-line

  const handleGenerate = async (eventId) => {
    setGenerating(eventId);
    try {
      const res = await certificateAPI.generate(eventId);
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `certificate-${eventId}.pdf`);
      notify('Certificate downloaded! 🏆', '', 'certificate_ready');
      const [certRes, histRes] = await Promise.all([certificateAPI.getMine(), participationAPI.myHistory()]);
      setCertificates(certRes.data.certificates);
      setEligible(histRes.data.history.filter(p => !p.certificateGenerated && p.event));
    } catch (err) {
      notify('Failed to generate', err.response?.data?.message || '', 'event_cancelled');
    } finally { setGenerating(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Certificates</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Generate and download participation certificates</p>
      </div>

      {eligible.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Award size={20} className="text-brand-400" /> Available to Generate</h2>
          <div className="space-y-3">
            {eligible.map(({ event }) => (
              <div key={event._id} className="card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-slate-500">{formatDate(event.date)} · {event.location}</p>
                </div>
                <button onClick={() => handleGenerate(event._id)} disabled={generating === event._id}
                  className="btn-primary text-sm flex-shrink-0">
                  {generating === event._id ? <><RefreshCw size={14} className="animate-spin" /> Generating...</> : <><Download size={14} /> Generate & Download</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-semibold text-lg mb-4">My Certificates ({certificates.length})</h2>
      {certificates.length === 0 ? (
        <div className="card text-center py-16">
          <Award size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-semibold mb-1">No certificates yet</h3>
          <p className="text-slate-500 text-sm">Participate in events to earn certificates.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map(({ _id, event }) => (
            <div key={_id} className="card p-5 hover:border-brand-400/50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-400/10 rounded-xl flex items-center justify-center"><Award size={20} className="text-brand-400" /></div>
                <button onClick={() => handleGenerate(event?._id)} disabled={generating === event?._id} className="btn-outline text-xs py-1.5">
                  {generating === event?._id ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />} Download
                </button>
              </div>
              <h3 className="font-semibold mb-1 line-clamp-2">{event?.title}</h3>
              <p className="text-xs text-slate-500">{formatDate(event?.date)}</p>
              <p className="text-xs text-slate-500">{event?.location}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Generated</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
