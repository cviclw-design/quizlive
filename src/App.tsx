import React, { useState, useEffect } from 'react';
import { api, PublicHomeData, ParticipantData, QuizQuestionData, CertificateData } from './services/api';
import { ClwQuizView } from './components/ClwQuizView';
import { ClwCertificateView } from './components/ClwCertificateView';
import { AdminPanel } from './components/AdminPanel';
import { IntegrityPledge } from './components/IntegrityPledge';
import { LiveQuizView } from './components/LiveQuizView';
import { ShareModal } from './components/ShareModal';
import { DriveModal } from './components/DriveModal';
import { soundEffects } from './utils/audio';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Lock,
  Volume2,
  VolumeX,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Share2,
  QrCode,
  HardDrive,
  Zap
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'live' | 'guidelines' | 'schedule' | 'register' | 'quiz' | 'certificate' | 'admin' | 'pledge'>('home');
  const [homeData, setHomeData] = useState<PublicHomeData | null>(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getMuted());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regPf, setRegPf] = useState('');
  const [regDesig, setRegDesig] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Active Quiz State
  const [activeParticipant, setActiveParticipant] = useState<ParticipantData | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);
  const [quizSeconds, setQuizSeconds] = useState(45);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Active Certificate View State
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);
  const [searchPfModal, setSearchPfModal] = useState(false);
  const [searchPfInput, setSearchPfInput] = useState('');
  const [searchPfError, setSearchPfError] = useState('');

  useEffect(() => {
    loadHomeData();

    // Support direct links (e.g. ?page=register or ?pf=12345678)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetPage = params.get('page');
      const targetPf = params.get('pf');

      if (targetPf) {
        api.getCertificate(targetPf).then(res => {
          if (res.ok && res.certificate) {
            setActiveCert(res.certificate);
            setCurrentPage('certificate');
          }
        }).catch(() => {});
      } else if (targetPage === 'register') {
        setCurrentPage('register');
      } else if (targetPage === 'guidelines') {
        setCurrentPage('guidelines');
      } else if (targetPage === 'schedule') {
        setCurrentPage('schedule');
      } else if (targetPage === 'live') {
        setCurrentPage('live');
      } else if (targetPage === 'pledge') {
        setCurrentPage('pledge');
      }
    }
  }, []);

  const loadHomeData = async () => {
    try {
      const res = await api.getHome();
      if (res.ok) {
        setHomeData(res);
      }
    } catch (err) {
      console.error('Failed to load home data', err);
    } finally {
      setLoadingHome(false);
    }
  };

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEffects.playClick();
    }
  };

  const navigateTo = (page: typeof currentPage) => {
    soundEffects.playClick();
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regDept || !regUnit) {
      setRegError('Please select both Department and Unit.');
      return;
    }

    setRegSubmitting(true);
    try {
      soundEffects.playClick();
      const res = await api.register({
        pf: regPf,
        name: regName,
        designation: regDesig,
        department: regDept,
        unit: regUnit,
        mobile: regMobile
      });

      if (res.ok) {
        setActiveParticipant(res.participant);

        // If participant already completed quiz, open their certificate directly
        if (res.attempt && res.attempt.status === 'submitted') {
          const certRes = await api.getCertificate(res.participant.pf);
          if (certRes.ok && certRes.certificate) {
            setActiveCert(certRes.certificate);
            setCurrentPage('certificate');
            return;
          }
        }

        // Start the quiz!
        const startRes = await api.startQuiz(res.participant.pf);
        if (startRes.ok) {
          setQuizQuestions(startRes.questions);
          setQuizSeconds(startRes.seconds || 45);
          setQuizAnswers(startRes.answers || {});
          setCurrentPage('quiz');
        }
      }
    } catch (err: unknown) {
      const message = (err as Error).message || 'Registration failed';
      setRegError(message);
      soundEffects.playIncorrect();
    } finally {
      setRegSubmitting(false);
    }
  };

  // Retrieve existing certificate by PF
  const handleLookupCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchPfError('');
    if (!searchPfInput.trim()) return;

    try {
      soundEffects.playClick();
      const res = await api.getCertificate(searchPfInput.trim());
      if (res.ok && res.certificate) {
        setActiveCert(res.certificate);
        setSearchPfModal(false);
        setSearchPfInput('');
        setCurrentPage('certificate');
      }
    } catch (err: unknown) {
      setSearchPfError((err as Error).message || 'No submitted certificate found for this PF number.');
      soundEffects.playIncorrect();
    }
  };

  const departmentsList = homeData?.departments || [
    'Personnel',
    'Accounts',
    'Stores',
    'Electrical',
    'Mechanical',
    'Security (RPF)',
    'Signal & Telecom',
    'Engineering',
    'Traffic - Commercial & Operating',
    'Civil Engineering',
    'Medical',
    'General Administration',
    'Rajbhasha'
  ];

  const unitsList = homeData?.units || [
    'CLW Headquarters',
    'Administrative Building',
    'Loco Shop',
    'Steel Foundry',
    'Traction Motor Shop',
    '3-Phase Loco Shop',
    'Central Stores Depot',
    'KG Hospital',
    'ELAAU Dankuni',
    'CLW Chittaranjan'
  ];

  const cvoName = homeData?.settings?.cvo_name || 'Sugind Surendran';
  const cvoDesig = homeData?.settings?.cvo_designation || 'SDGM & Chief Vigilance Officer';
  const logoUrl = homeData?.settings?.logo_url || 'https://raw.githubusercontent.com/swrvaw/swrvaw.github.io/gh-pages/static/media/logo.8b9ced028d0a93767ec0.png';

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans flex flex-col">
      {/* SWR / CLW Style Top Bar */}
      <header className="no-print bg-gradient-to-r from-[#071a3a] via-[#123a86] to-[#0b6b3a] text-white shadow-md relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Lockup */}
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Indian Railways Emblem"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full bg-white p-1 border-2 border-[#d4a017] shadow-sm shrink-0"
            />
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-wider uppercase text-amber-200">
                CHITTARANJAN LOCOMOTIVE WORKS
              </div>
              <h1 className="text-sm sm:text-base font-bold leading-tight">
                चित्तरंजन लोकोमोटिव वर्क्स · Vigilance Department
              </h1>
              <div className="text-[11px] sm:text-xs text-slate-300">
                SDGM &amp; CVO: {cvoName}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                setShareModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#ff8a1e] hover:bg-[#e87610] text-[#071a3a] flex items-center gap-1.5 shadow-sm transition-all"
              title="Share Quiz Link & QR Code"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share Link &amp; QR</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setDriveModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
              title="Google Drive Cloud Storage"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Drive</span>
            </button>

            <button
              onClick={handleToggleSound}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                currentPage === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Admin Portal
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 border-t border-white/15 py-2 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => navigateTo('home')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentPage === 'home' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('live')}
            className={`px-3.5 py-1.5 rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 font-bold ${
              currentPage === 'live'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white/50'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>LIVE QUIZ</span>
          </button>
          <button
            onClick={() => navigateTo('guidelines')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentPage === 'guidelines' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Guidelines
          </button>
          <button
            onClick={() => navigateTo('schedule')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentPage === 'schedule' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Quiz Schedule
          </button>
          <button
            onClick={() => navigateTo('register')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentPage === 'register' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            New User Registration
          </button>
          <button
            onClick={() => navigateTo('pledge')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentPage === 'pledge' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Integrity Pledge
          </button>
          <button
            onClick={() => setSearchPfModal(true)}
            className="px-3 py-1.5 rounded-md whitespace-nowrap text-amber-200 hover:text-white hover:bg-white/10 ml-auto flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Certificate</span>
          </button>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1">
        {/* --- PAGE: ADMIN --- */}
        {currentPage === 'admin' && (
          <AdminPanel
            onClose={() => navigateTo('home')}
            onSettingsUpdated={loadHomeData}
          />
        )}

        {/* --- PAGE: ONLINE LIVE QUIZ --- */}
        {currentPage === 'live' && (
          <LiveQuizView
            onViewCertificate={(cert) => {
              setActiveCert(cert);
              setCurrentPage('certificate');
            }}
            onHome={() => navigateTo('home')}
            departmentsList={departmentsList}
          />
        )}

        {/* --- PAGE: ACTIVE QUIZ --- */}
        {currentPage === 'quiz' && activeParticipant && (
          <ClwQuizView
            participant={activeParticipant}
            initialQuestions={quizQuestions}
            initialSeconds={quizSeconds}
            initialAnswers={quizAnswers}
            onHome={() => navigateTo('home')}
          />
        )}

        {/* --- PAGE: CERTIFICATE --- */}
        {currentPage === 'certificate' && activeCert && (
          <ClwCertificateView
            cert={activeCert}
            onHome={() => navigateTo('home')}
          />
        )}

        {/* --- PAGE: INTEGRITY PLEDGE --- */}
        {currentPage === 'pledge' && (
          <IntegrityPledge />
        )}

        {/* --- PAGE: GUIDELINES --- */}
        {currentPage === 'guidelines' && (
          <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-[#071a3a] mb-2">
                Quiz Guidelines &amp; Rules
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Please read before registering. Exactly one quiz attempt is permitted per PF number.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs text-slate-700">
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">1. Registration:</strong>
                  Register your official PF number and select your designated department and unit.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">2. Questions &amp; Marks:</strong>
                  A full paper comprises 20 questions, for a total of 20 maximum marks.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">3. Time Limit:</strong>
                  45 seconds are allotted per question. Timeout automatically advances to next question.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">4. Submission:</strong>
                  Press Submit Answer after choosing your option to lock in your response.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">5. Marking Scheme:</strong>
                  +1 for correct answer · −0.5 for wrong or blank/timeout · 0 for "Not Answering".
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">6. Instant Certificate:</strong>
                  Score is calculated immediately upon completing 20 questions, generating your e-Certificate.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">7. Official CVO Signature:</strong>
                  Participation certificate issued under authority of SDGM &amp; CVO, CLW Chittaranjan.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">8. Recognition:</strong>
                  Top-performing participants will be commended by the Vigilance Organisation.
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-6">
                <strong>Queries / Assistance:</strong> Vigilance Department, Administrative Building, CLW, PO Chittaranjan, Pin 713331 · dycvo@clw.railnet.gov.in · 0341-2525003
              </div>

              <button
                onClick={() => navigateTo('register')}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Continue to Registration →
              </button>
            </div>
          </div>
        )}

        {/* --- PAGE: SCHEDULE --- */}
        {currentPage === 'schedule' && (
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-[#071a3a] mb-2">
                Department Quiz Windows
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Vigilance Awareness Campaign 2026 · Chittaranjan Locomotive Works. Windows configured by the Administrator.
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#071a3a] text-white font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-left">SL</th>
                      <th className="py-2.5 px-3 text-left">Department</th>
                      <th className="py-2.5 px-3 text-left">Starts At</th>
                      <th className="py-2.5 px-3 text-left">Closes At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(homeData?.schedule || []).map((s, i) => (
                      <tr key={s.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{s.department}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{s.starts_at}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{s.ends_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center sm:text-left">
                <button
                  onClick={() => navigateTo('register')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Register Now for Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE: REGISTRATION --- */}
        {currentPage === 'register' && (
          <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-[#071a3a] mb-1">
                New User Registration
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Create your attempt profile. Exactly one quiz attempt is recorded per PF number.
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Name as it should appear on Certificate"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PF Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regPf}
                      onChange={e => setRegPf(e.target.value.toUpperCase())}
                      placeholder="e.g. 50200123456"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regDesig}
                      onChange={e => setRegDesig(e.target.value)}
                      placeholder="e.g. SSE, OS, CVI, Tech-I"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={regMobile}
                      onChange={e => setRegMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department <span className="text-rose-600">*</span>
                    </label>
                    <select
                      required
                      value={regDept}
                      onChange={e => setRegDept(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    >
                      <option value="">-- Select Department --</option>
                      {departmentsList.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit / Workshop <span className="text-rose-600">*</span>
                    </label>
                    <select
                      required
                      value={regUnit}
                      onChange={e => setRegUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    >
                      <option value="">-- Select Unit --</option>
                      {unitsList.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  By registering, you confirm that you will attempt the quiz once, adhering to absolute integrity. Your certificate will feature your Name, PF number, and score.
                </div>

                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('guidelines')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    View Guidelines
                  </button>

                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
                  >
                    {regSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <span>Save &amp; Start Quiz</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- PAGE: HOME HERO --- */}
        {currentPage === 'home' && (
          <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
            
            {/* Main Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#071a3a] via-[#163e8a] to-[#0b6b3a] text-white rounded-3xl p-6 sm:p-12 mb-8 shadow-xl">
              <div className="max-w-3xl relative z-10">
                <div className="text-xs font-extrabold tracking-widest uppercase text-amber-300 mb-1">
                  VIGILANCE AWARENESS WEEK 2026
                </div>
                <div className="text-xl sm:text-2xl text-amber-100 font-serif italic mb-2">
                  सत्यनिष्ठा से समृद्धि · Probity for Prosperity
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-extrabold leading-tight tracking-tight mb-4">
                  Online Quiz Competition
                </h2>
                <div className="inline-block px-4 py-1.5 bg-white/15 border border-white/25 rounded-full text-xs font-semibold mb-5">
                  Official CVC Theme: सत्यनिष्ठा से समृद्धि · Probity for Prosperity · VAW 2026
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-8 max-w-2xl">
                  Organised by the Vigilance Department, Chittaranjan Locomotive Works, Chittaranjan, under Shri {cvoName}, {cvoDesig}. All employees and officers are encouraged to participate.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigateTo('live')}
                    className="px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg shadow-rose-600/40 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-102"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <Zap className="w-4 h-4 text-amber-200" />
                    <span>Join Online Live Quiz</span>
                  </button>

                  <button
                    onClick={() => navigateTo('pledge')}
                    className="px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Take Integrity Pledge
                  </button>

                  <button
                    onClick={() => navigateTo('register')}
                    className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Self-Paced Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigateTo('guidelines')}
                    className="px-5 py-3 bg-white hover:bg-slate-100 text-[#071a3a] text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors"
                  >
                    Read Guidelines
                  </button>

                  <button
                    onClick={() => setSearchPfModal(true)}
                    className="px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors"
                  >
                    View Certificate
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setShareModalOpen(true);
                    }}
                    className="px-5 py-3 bg-[#ff8a1e] hover:bg-[#e67a15] text-[#071a3a] text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Quiz Link &amp; QR</span>
                  </button>
                </div>
              </div>

              {/* Decorative Circle watermark */}
              <div className="hidden lg:block absolute -right-16 -bottom-16 w-80 h-80 rounded-full border-16 border-white/10 pointer-events-none" />
            </div>

            {/* 3 Core Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg mb-3">
                  📖
                </div>
                <h3 className="font-bold text-base text-[#071a3a] mb-1">
                  Quiz Guidelines
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  20 questions, 45 seconds each, +1 correct and -0.5 wrong marking. One attempt per PF number.
                </p>
                <button
                  onClick={() => navigateTo('guidelines')}
                  className="mt-3 text-xs font-semibold text-blue-900 hover:underline"
                >
                  View Details →
                </button>
              </div>

              <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-lg mb-3">
                  🗓️
                </div>
                <h3 className="font-bold text-base text-[#071a3a] mb-1">
                  Department Schedule
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Designated participation windows for CLW Chittaranjan workshops and ELAAU Dankuni.
                </p>
                <button
                  onClick={() => navigateTo('schedule')}
                  className="mt-3 text-xs font-semibold text-blue-900 hover:underline"
                >
                  View Schedule →
                </button>
              </div>

              <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg mb-3">
                  🏅
                </div>
                <h3 className="font-bold text-base text-[#071a3a] mb-1">
                  Official Certificate
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Colourful participation certificate bearing the verified signature photo of SDGM &amp; CVO.
                </p>
                <button
                  onClick={() => setSearchPfModal(true)}
                  className="mt-3 text-xs font-semibold text-blue-900 hover:underline"
                >
                  Retrieve Certificate →
                </button>
              </div>
            </div>

            {/* Department chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">CLW Chittaranjan</span>
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">ELAAU Dankuni</span>
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">Loco Shop</span>
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">Steel Foundry</span>
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">Traction Motor Shop</span>
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">KG Hospital</span>
              <span className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">Vigilance Department</span>
            </div>
          </div>
        )}
      </main>

      {/* Lookup Certificate Modal */}
      {searchPfModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Find Your Certificate
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the PF number used during quiz registration.
            </p>

            <form onSubmit={handleLookupCertificate} className="space-y-3">
              <input
                type="text"
                required
                value={searchPfInput}
                onChange={e => setSearchPfInput(e.target.value.toUpperCase())}
                placeholder="Enter PF Number"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono"
              />

              {searchPfError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg">
                  {searchPfError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSearchPfModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Retrieve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWR / CLW Footer */}
      <footer className="no-print bg-white border-t border-[#eadcc4] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto space-y-2">
          <div>
            Vigilance Department, Chittaranjan Locomotive Works · Administrative Building, PO Chittaranjan, Pin 713331, Dist. Paschim Bardhaman, West Bengal.
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-600 font-medium">
            <span>SDGM &amp; CVO: {cvoName}</span>
            <span>·</span>
            <span>dycvo@clw.railnet.gov.in</span>
            <span>·</span>
            <button
              onClick={() => navigateTo('admin')}
              className="text-blue-900 font-bold hover:underline"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Share & QR Code Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Google Drive Cloud Storage Modal */}
      <DriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
      />
    </div>
  );
}
