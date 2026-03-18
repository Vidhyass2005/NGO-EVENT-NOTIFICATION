// components/RegisterModal.js
import { useState } from 'react';
import { X, User, Phone, MapPin, Briefcase, Heart, AlertCircle, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const STEPS = ['Personal Info', 'Background', 'Emergency Contact'];

const EMPTY_FORM = {
  fullName:             '',
  phone:                '',
  age:                  '',
  gender:               'Prefer not to say',
  address:              '',
  organization:         '',
  experience:           '',
  motivation:           '',
  emergencyContactName: '',
  emergencyContactPhone:'',
};

// ── Field wrapper — defined OUTSIDE the modal component ──────
// This is the root cause fix: if Field is inside the component,
// React treats it as a new component on every render → unmounts
// the input → cursor disappears after every keystroke.
const Field = ({ label, error, required, children }) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

export default function RegisterModal({ event, onClose, onSubmit, loading }) {
  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.fullName.trim())  e.fullName = 'Full name is required';
      if (!form.phone.trim())     e.phone    = 'Phone number is required';
      else if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
      if (form.age && (isNaN(form.age) || form.age < 5 || form.age > 100)) e.age = 'Enter a valid age (5–100)';
    }
    if (step === 2) {
      if (form.emergencyContactPhone && !/^[0-9+\-\s]{7,15}$/.test(form.emergencyContactPhone.trim()))
        e.emergencyContactPhone = 'Enter a valid phone number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    onSubmit(event._id, form);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-lg max-h-[92vh] overflow-y-auto animate-slide-in">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 pt-6 pb-4 z-10">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg leading-tight">Register for Event</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{event.title}</p>
              <p className="text-xs text-brand-500 mt-1">{formatDate(event.date)} · {event.location}</p>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost p-1.5 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Step progress */}
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step   ? 'bg-green-500 text-white' :
                    i === step ? 'bg-brand-400 text-slate-900' :
                                 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${i === step ? 'text-brand-500 font-medium' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 rounded transition-all ${i < step ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* STEP 0 — Personal Info */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-brand-400" />
                <h3 className="font-semibold text-sm">Personal Information</h3>
              </div>

              <Field label="Full Name" error={errors.fullName} required>
                <input
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  className={`input ${errors.fullName ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Vidhya S"
                />
              </Field>

              <Field label="Phone Number" error={errors.phone} required>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className={`input pl-9 ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" error={errors.age}>
                  <input
                    type="number"
                    min={5} max={100}
                    value={form.age}
                    onChange={e => set('age', e.target.value)}
                    className={`input ${errors.age ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="21"
                  />
                </Field>

                <Field label="Gender">
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </Field>
              </div>

              <Field label="Address">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    className="input pl-9 resize-none"
                    rows={2}
                    placeholder="City, State"
                  />
                </div>
              </Field>
            </>
          )}

          {/* STEP 1 — Background */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-brand-400" />
                <h3 className="font-semibold text-sm">Background & Motivation</h3>
              </div>

              <Field label="Organisation / College">
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.organization}
                    onChange={e => set('organization', e.target.value)}
                    className="input pl-9"
                    placeholder="ABC College / XYZ Company"
                  />
                </div>
              </Field>

              <Field label="Prior Volunteering Experience">
                <textarea
                  value={form.experience}
                  onChange={e => set('experience', e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Briefly describe any past volunteering (or 'None' if first time)..."
                />
              </Field>

              <Field label="Why do you want to join this event?">
                <textarea
                  value={form.motivation}
                  onChange={e => set('motivation', e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Tell us what motivates you to participate..."
                />
              </Field>
            </>
          )}

          {/* STEP 2 — Emergency Contact */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={16} className="text-brand-400" />
                <h3 className="font-semibold text-sm">Emergency Contact</h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2 mb-1">
                In case of any emergency during the event, who should we contact?
              </p>

              <Field label="Contact Person's Name">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.emergencyContactName}
                    onChange={e => set('emergencyContactName', e.target.value)}
                    className="input pl-9"
                    placeholder="Parent / Guardian / Friend"
                  />
                </div>
              </Field>

              <Field label="Contact Phone Number" error={errors.emergencyContactPhone}>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.emergencyContactPhone}
                    onChange={e => set('emergencyContactPhone', e.target.value)}
                    className={`input pl-9 ${errors.emergencyContactPhone ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </Field>

              {/* Summary */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Registration Summary</p>
                {[
                  ['Name',   form.fullName],
                  ['Phone',  form.phone],
                  ['Age',    form.age || '—'],
                  ['Gender', form.gender],
                  ['Org',    form.organization || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{val}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 ? (
              <button type="button" onClick={prevStep} className="btn-outline flex-1 justify-center">
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">
                Cancel
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn-primary flex-1 justify-center">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Registering...</>
                  : '🎫 Confirm Registration'
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}