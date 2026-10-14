import React, { useState } from 'react';
import { OFFICIAL_PLEDGES } from '../data/questions';
import { soundEffects } from '../utils/audio';
import { CertificateView } from './CertificateView';
import confetti from 'canvas-confetti';
import { ShieldCheck, Award, CheckCircle, FileText, Globe } from 'lucide-react';

export const IntegrityPledge: React.FC = () => {
  const [pledgeType, setPledgeType] = useState<'public_servant' | 'citizen'>('public_servant');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [organization, setOrganization] = useState('Indian Railways / CLW');
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});
  const [completedRecord, setCompletedRecord] = useState<{
    id: string;
    name: string;
    designation: string;
    organization: string;
    date: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('vaw_pledge_record');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const pledgeData = OFFICIAL_PLEDGES[pledgeType];
  const allChecked = pledgeData.commitments.every((_, idx) => checkedPoints[idx]);

  const handleTogglePoint = (index: number) => {
    soundEffects.playClick();
    setCheckedPoints(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectAll = () => {
    soundEffects.playClick();
    const updated: Record<number, boolean> = {};
    pledgeData.commitments.forEach((_, idx) => {
      updated[idx] = true;
    });
    setCheckedPoints(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundEffects.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const certId = `VAW-2026-PLG-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const record = {
      id: certId,
      name: name.trim(),
      designation: designation.trim(),
      organization: organization.trim(),
      date: today
    };

    setCompletedRecord(record);
    try {
      localStorage.setItem('vaw_pledge_record', JSON.stringify(record));
    } catch {
      // Storage error ignored
    }
  };

  if (completedRecord) {
    return (
      <CertificateView
        type="pledge"
        recipientName={completedRecord.name}
        designation={completedRecord.designation}
        organization={completedRecord.organization}
        date={completedRecord.date}
        certificateId={completedRecord.id}
        onBack={() => setCompletedRecord(null)}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Introduction Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Official Integrity Pledge
              </h1>
              <div className="text-xs text-slate-500 mt-0.5">
                Central Vigilance Commission · Vigilance Awareness Week 2026
              </div>
              <div className="text-xs font-semibold text-amber-900 mt-0.5">
                सत्यनिष्ठा से समृद्धि · Probity for Prosperity
              </div>
            </div>
          </div>

          {/* Type & Language Segmented Switcher */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setPledgeType('public_servant');
                  setCheckedPoints({});
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  pledgeType === 'public_servant'
                    ? 'bg-white text-blue-950 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Public Servant
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setPledgeType('citizen');
                  setCheckedPoints({});
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  pledgeType === 'citizen'
                    ? 'bg-white text-blue-950 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Citizen
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1 shrink-0"
              title="Toggle Hindi / English"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Official Pledge Text Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6 text-sm text-slate-700 leading-relaxed">
          <div className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
            <span>{language === 'en' ? pledgeData.title : pledgeData.hindiTitle}</span>
            <span className="text-xs text-amber-800 font-normal">VAW 2026 Core Theme</span>
          </div>

          {language === 'en' ? (
            <>
              {pledgeData.paragraphs.map((para, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  {para}
                </p>
              ))}
            </>
          ) : (
            <div className="space-y-2 text-slate-800">
              <p>
                मेरा विश्वास है कि हमारे देश की आर्थिक, राजनीतिक तथा सामाजिक प्रगति में भ्रष्टाचार एक बहुत बड़ी बाधा है।
              </p>
              <p>
                मेरा विश्वास है कि भ्रष्टाचार का उन्मूलन करने के लिए सभी हितधारकों जैसे सरकार, नागरिकों तथा निजी क्षेत्र को एक साथ मिलकर कार्य करने की आवश्यकता है।
              </p>
              <p>
                मेरा मानना है कि प्रत्येक नागरिक को सतर्क होना चाहिए तथा उसे सदैव ईमानदारी तथा सत्यनिष्ठा के उच्चतम मानकों के प्रति वचनबद्ध होना चाहिए तथा भ्रष्टाचार के विरुद्ध संघर्ष में साथ देना चाहिए।
              </p>
              <p className="font-medium text-slate-900">अतः, मैं प्रतिज्ञा करता/करती हूँ कि:</p>
            </div>
          )}
        </div>

        {/* Commitment Checklist */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Affirm Your Commitments ({Object.values(checkedPoints).filter(Boolean).length}/{pledgeData.commitments.length})
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-800 hover:text-blue-950 font-medium underline"
            >
              Check All
            </button>
          </div>

          <div className="space-y-2.5">
            {pledgeData.commitments.map((commitment, index) => {
              const isChecked = !!checkedPoints[index];
              return (
                <label
                  key={index}
                  onClick={() => handleTogglePoint(index)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-xs sm:text-sm cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-blue-50/60 border-blue-300 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by label onClick
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                  />
                  <span className="flex-1 leading-snug">{commitment}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Certificate Form */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-6 space-y-4">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Details for Official e-Certificate
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Designation / Role
              </label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder={pledgeType === 'public_servant' ? 'e.g. Chief Vigilance Inspector / SSE' : 'e.g. Concerned Citizen'}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Organization / Unit / Department
              </label>
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. Chittaranjan Locomotive Works (CLW) / Indian Railways"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              An authentic e-Certificate will be instantly generated for download and printing.
            </span>
            <button
              type="submit"
              disabled={!name.trim() || !allChecked}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 ${
                name.trim() && allChecked
                  ? 'bg-blue-900 text-white hover:bg-blue-800 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Commit & Generate Certificate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
