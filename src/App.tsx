import React, { useState, useEffect, useMemo } from 'react';
import { api, PublicHomeData, ParticipantData, QuizQuestionData, CertificateData, PublicLeaderboardItem } from './services/api';
import { ClwQuizView } from './components/ClwQuizView';
import { ClwCertificateView } from './components/ClwCertificateView';
import { AdminPanel } from './components/AdminPanel';
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
  Zap,
  LogIn,
  UserPlus,
  Trophy,
  Clock,
  Medal
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'live' | 'guidelines' | 'schedule' | 'register' | 'login' | 'quiz' | 'certificate' | 'admin'>('home');
  const [homeData, setHomeData] = useState<PublicHomeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardItem[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getMuted());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // User Login State (PF & Default Password 123)
  const [loginPf, setLoginPf] = useState('');
  const [loginPass, setLoginPass] = useState('123');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regPf, setRegPf] = useState('');
  const [regDesig, setRegDesig] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regPass, setRegPass] = useState('123');
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
      } else if (targetPage === 'login') {
        setCurrentPage('login');
      } else if (targetPage === 'guidelines') {
        setCurrentPage('guidelines');
      } else if (targetPage === 'schedule') {
        setCurrentPage('schedule');
      } else if (targetPage === 'live') {
        setCurrentPage('live');
      }
    }
  }, []);

  const loadHomeData = async () => {
    try {
      const res = await api.getHome();
      if (res.ok) {
        setHomeData(res);
      }
      const lbRes = await api.getLeaderboard().catch(() => null);
      if (lbRes && lbRes.ok) {
        setLeaderboard(lbRes.leaderboard || []);
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

  // Standard Quiz Login handler
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginPf.trim()) {
      setLoginError('Please enter your PF Number.');
      return;
    }

    setLoginSubmitting(true);
    try {
      soundEffects.playClick();
      const res = await api.userLogin(loginPf.trim(), loginPass.trim() || '123');
      if (res.ok && res.participant) {
        setActiveParticipant(res.participant);

        // If completed quiz, open certificate
        if (res.attempt && res.attempt.status === 'submitted') {
          const certRes = await api.getCertificate(res.participant.pf);
          if (certRes.ok && certRes.certificate) {
            setActiveCert(certRes.certificate);
            setCurrentPage('certificate');
            return;
          }
        }

        // Start or resume quiz
        const startRes = await api.startQuiz(res.participant.pf);
        if (startRes.ok) {
          setQuizQuestions(startRes.questions);
          setQuizSeconds(startRes.seconds || 45);
          setQuizAnswers(startRes.answers || {});
          setCurrentPage('quiz');
        }
      }
    } catch (err: unknown) {
      const message = (err as Error).message || 'Login failed. Please check PF Number and Password.';
      setLoginError(message);
      soundEffects.playIncorrect();
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (homeData?.settings?.registration_enabled === false) {
      setRegError('Registration is currently closed by Administrator. Please log in with PF number and password.');
      return;
    }

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
        mobile: regMobile,
        password: regPass.trim() || '123'
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

  const departmentsList = useMemo(() => {
    const list = homeData?.departments && homeData.departments.length > 0
      ? homeData.departments
      : [
          'Personnel',
          'Accounts',
          'Stores',
          'Electrical',
          'Mechanical',
          'Security (RPF)',
          'Signal & Telecom',
          'Civil Engineering',
          'Engineering',
          'Medical',
          'General Administration',
          'Rajbhasha'
        ];
    return Array.from(new Set(list.map(d => String(d).trim()).filter(Boolean)));
  }, [homeData?.departments]);

  const unitsList = useMemo(() => {
    const list = homeData?.units && homeData.units.length > 0
      ? homeData.units
      : [
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
    return Array.from(new Set(list.map(u => String(u).trim()).filter(Boolean)));
  }, [homeData?.units]);

  const orgName = homeData?.settings?.organization_name || 'CHITTARANJAN LOCOMOTIVE WORKS';
  const progName = homeData?.settings?.programme_name || 'Vigilance Awareness Week 2026 Quiz Competition';
  const progPeriod = homeData?.settings?.programme_period || '27th October to 2nd November 2026';
  const regEnabled = homeData?.settings?.registration_enabled !== false;
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
                {orgName}
              </div>
              <h1 className="text-sm sm:text-base font-bold leading-tight">
                {progName}
              </h1>
              <div className="text-[11px] sm:text-xs text-slate-300">
                {cvoDesig}: <span className="text-amber-200 font-semibold">{cvoName}</span> · Period: <span className="text-white font-medium">{progPeriod}</span>
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
            onClick={() => navigateTo('login')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentPage === 'login' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-amber-300" />
            <span>Standard Quiz / Login</span>
          </button>

          <button
            onClick={() => navigateTo('register')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentPage === 'register' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Registration</span>
            {!regEnabled && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/80 text-white font-bold">Closed</span>
            )}
          </button>

          <button
            onClick={() => navigateTo('schedule')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentPage === 'schedule' ? 'bg-white text-[#071a3a] shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Common Schedule
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

        {/* --- PAGE: STANDARD QUIZ LOGIN (PF & Default Password 123) --- */}
        {currentPage === 'login' && (
          <div className="max-w-md mx-auto py-12 px-4">
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#071a3a]">
                    Participant Login
                  </h2>
                  <p className="text-xs text-slate-500">
                    Log in with PF Number &amp; Password (default: 123)
                  </p>
                </div>
              </div>

              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PF Number / Employee Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginPf}
                    onChange={e => setLoginPf(e.target.value.toUpperCase())}
                    placeholder="Enter your registered PF Number"
                    className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-slate-400 font-normal">(Default: 123)</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="Enter password (default: 123)"
                    className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    New participants have default password <code className="text-amber-700 font-bold bg-amber-50 px-1 py-0.5 rounded">123</code>. Admin can reset password anytime.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-[#071a3a] to-[#123a86] hover:from-[#123a86] hover:to-[#071a3a] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loginSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In &amp; Proceed to Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
                  {regEnabled ? (
                    <button
                      type="button"
                      onClick={() => navigateTo('register')}
                      className="text-blue-900 font-semibold hover:underline"
                    >
                      New user? Register here →
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px]">New registration is currently closed</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSearchPfModal(true)}
                    className="text-amber-700 hover:underline"
                  >
                    Find Certificate
                  </button>
                </div>
              </form>
            </div>
          </div>
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
                  <strong className="text-[#071a3a] block mb-1">1. Registration &amp; Login:</strong>
                  Register your official PF number. Default password is <code className="font-bold text-amber-800">123</code>.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">2. Questions &amp; Marks:</strong>
                  A full standard paper comprises 20 questions, for a total of 2000 maximum points.
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
                  +100 for correct answer · −50 for negative/wrong answer · 0 for "Not Answering".
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">6. Instant Certificate:</strong>
                  Score is calculated immediately upon completing 20 questions, generating your official e-Certificate.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">7. Official CVO Signature:</strong>
                  Participation certificate issued under authority of {cvoDesig}, {orgName}.
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40">
                  <strong className="text-[#071a3a] block mb-1">8. Recognition:</strong>
                  Top-performing participants on the Leaderboard will be commended by the Vigilance Organisation.
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-6">
                <strong>Queries / Assistance:</strong> Vigilance Department, Administrative Building, {orgName} · {cvoDesig}: {cvoName}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Participant Login →</span>
                </button>
                {regEnabled && (
                  <button
                    onClick={() => navigateTo('register')}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    New Registration →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE: COMMON SCHEDULE (Unified for all departments) --- */}
        {currentPage === 'schedule' && (
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#071a3a]">
                    Common Programme Schedule
                  </h2>
                  <p className="text-xs text-slate-500">
                    Common Schedule open simultaneously for all Departments &amp; Units
                  </p>
                </div>
              </div>

              {/* Programme Overview Card */}
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-[#071a3a] via-[#123a86] to-[#0b6b3a] text-white shadow-md">
                <div className="text-xs uppercase tracking-widest text-amber-300 font-bold mb-1">
                  {orgName} · Vigilance Awareness Campaign
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  {progName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-300" />
                    <span><strong>Programme Period:</strong> {progPeriod}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span><strong>Applicability:</strong> Common for All Departments &amp; Workshops</span>
                  </div>
                </div>
              </div>

              {/* Departments Included */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Covered Departments &amp; Units (Simultaneous Access)
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {departmentsList.map(dept => (
                    <span key={dept} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-medium">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scheduled Live Quiz Sessions */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    <span>Scheduled Live Quiz Competitions</span>
                  </h4>
                  <button
                    onClick={() => navigateTo('live')}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Enter Live Quiz Room →
                  </button>
                </div>

                {homeData?.live_sessions && homeData.live_sessions.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-[#071a3a] text-white font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Session ID</th>
                          <th className="py-2.5 px-3 text-left">Session Title</th>
                          <th className="py-2.5 px-3 text-left">Scheduled Date &amp; Time</th>
                          <th className="py-2.5 px-3 text-center">Timer / Qs</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-right text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {homeData.live_sessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-amber-50/30">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{sess.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{sess.title}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{sess.scheduled_at}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sess.timer_seconds}s · {sess.question_count} Qs</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sess.status === 'completed'
                                  ? 'bg-slate-100 text-slate-700'
                                  : sess.status === 'in_progress'
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {sess.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => navigateTo('live')}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[11px]"
                              >
                                Join Live
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                    <span>Live Quiz competitions are hosted periodically during the vigilance week.</span>
                    <button
                      onClick={() => navigateTo('live')}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs"
                    >
                      Open Live Quiz Portal
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In for Standard Quiz</span>
                </button>
                <button
                  onClick={() => navigateTo('live')}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Join Live Quiz</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE: REGISTRATION --- */}
        {currentPage === 'register' && (
          <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-serif font-bold text-[#071a3a]">
                  New User Registration
                </h2>
                {!regEnabled && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Registration Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Create your attempt profile for {orgName}. Exactly one quiz attempt is recorded per PF number.
              </p>

              {!regEnabled ? (
                <div className="p-6 bg-rose-50/70 border border-rose-200 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto font-bold text-lg">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-rose-900">
                      New Registrations are Currently Disabled
                    </h3>
                    <p className="text-xs text-rose-700 max-w-md mx-auto mt-1 leading-relaxed">
                      The administrator has closed new user registration. If you have already registered, you can log in directly using your PF number and default password (<strong className="font-mono">123</strong>).
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => navigateTo('login')}
                      className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Proceed to Participant Login</span>
                    </button>
                  </div>
                </div>
              ) : (
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
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-mono uppercase"
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
                        {departmentsList.map((dept, index) => (
                          <option key={`reg-dept-${dept}-${index}`} value={dept}>{dept}</option>
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
                        {unitsList.map((unit, index) => (
                          <option key={`reg-unit-${unit}-${index}`} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Login Password <span className="text-slate-400 font-normal">(Default is 123)</span>
                      </label>
                      <input
                        type="text"
                        value={regPass}
                        onChange={e => setRegPass(e.target.value)}
                        placeholder="Default is 123"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        You can use this password to log in to both the Standard Quiz and Live Quiz.
                      </p>
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
                      onClick={() => navigateTo('login')}
                      className="text-xs text-blue-900 font-semibold hover:underline flex items-center gap-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Already registered? Log in here</span>
                    </button>

                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
                    >
                      {regSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Registering...</span>
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
              )}
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
                  {orgName} · VIGILANCE AWARENESS WEEK 2026
                </div>
                <div className="text-xl sm:text-2xl text-amber-100 font-serif italic mb-2">
                  सत्यनिष्ठा से समृद्धि · Probity for Prosperity
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-extrabold leading-tight tracking-tight mb-3">
                  {progName}
                </h2>
                <div className="inline-block px-4 py-1.5 bg-white/15 border border-white/25 rounded-full text-xs font-semibold mb-4">
                  Programme Period: {progPeriod} · Common for all Departments
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-8 max-w-2xl">
                  Organised by the Vigilance Department, {orgName}, under Shri <strong className="text-amber-200">{cvoName}</strong>, {cvoDesig}. All employees and officers are encouraged to participate.
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
                    onClick={() => navigateTo('login')}
                    className="px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4 text-amber-300" />
                    <span>Standard Quiz Login</span>
                  </button>

                  {regEnabled && (
                    <button
                      onClick={() => navigateTo('register')}
                      className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>New Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => navigateTo('schedule')}
                    className="px-5 py-3 bg-white hover:bg-slate-100 text-[#071a3a] text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors"
                  >
                    Common Schedule
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
                  20 questions, 45 seconds each, +100 correct and -50 negative marking. One attempt per PF number.
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
                  Common Programme Schedule
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {progPeriod} · Unified participation window for all departments and workshops.
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
                  Colourful participation certificate bearing the verified signature photo of {cvoDesig}.
                </p>
                <button
                  onClick={() => setSearchPfModal(true)}
                  className="mt-3 text-xs font-semibold text-blue-900 hover:underline"
                >
                  Retrieve Certificate →
                </button>
              </div>
            </div>

            {/* Enhanced Public Leaderboard Section */}
            <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#071a3a] flex items-center gap-2">
                      <span>Quiz Honour Roll &amp; Leaderboard</span>
                      <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Top Performers
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ranked by Maximum Marks with Time-Taken Seniority Tiebreaker
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateTo('live')}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Live Quiz Room</span>
                  </button>
                  <button
                    onClick={loadHomeData}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh Leaderboard"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Leaderboard Podium for Top 3 */}
              {leaderboard && leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8 pt-4">
                  {/* Rank 2 */}
                  <div className="flex flex-col items-center justify-end text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs mb-1">
                      🥈 2
                    </div>
                    <div className="font-bold text-xs text-slate-800 truncate w-full">{leaderboard[1].name}</div>
                    <div className="text-[10px] text-slate-500 truncate w-full">{leaderboard[1].department}</div>
                    <div className="mt-1 font-mono text-xs font-extrabold text-blue-900">{leaderboard[1].score} pts</div>
                    <div className="text-[10px] text-slate-400 font-mono">{leaderboard[1].duration_seconds}s</div>
                  </div>

                  {/* Rank 1 */}
                  <div className="flex flex-col items-center justify-end text-center p-3 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/70 border-2 border-amber-300 shadow-xs -translate-y-2">
                    <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm mb-1 shadow-xs">
                      🥇 1
                    </div>
                    <div className="font-bold text-xs text-slate-900 truncate w-full">{leaderboard[0].name}</div>
                    <div className="text-[10px] text-amber-800 font-medium truncate w-full">{leaderboard[0].department}</div>
                    <div className="mt-1 font-mono text-xs font-extrabold text-amber-700">{leaderboard[0].score} pts</div>
                    <div className="text-[10px] text-slate-500 font-mono">{leaderboard[0].duration_seconds}s</div>
                  </div>

                  {/* Rank 3 */}
                  <div className="flex flex-col items-center justify-end text-center p-3 rounded-xl bg-amber-50/40 border border-amber-200">
                    <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs mb-1">
                      🥉 3
                    </div>
                    <div className="font-bold text-xs text-slate-800 truncate w-full">{leaderboard[2].name}</div>
                    <div className="text-[10px] text-slate-500 truncate w-full">{leaderboard[2].department}</div>
                    <div className="mt-1 font-mono text-xs font-extrabold text-blue-900">{leaderboard[2].score} pts</div>
                    <div className="text-[10px] text-slate-400 font-mono">{leaderboard[2].duration_seconds}s</div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              {leaderboard && leaderboard.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#071a3a] text-white">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-14">Rank</th>
                        <th className="py-2.5 px-3">Participant</th>
                        <th className="py-2.5 px-3">Department &amp; Unit</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                        <th className="py-2.5 px-3 text-right">Time Taken</th>
                        <th className="py-2.5 px-3 text-center">Tiebreaker</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaderboard.slice(0, 15).map((row) => (
                        <tr key={row.pf} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-2 px-3 text-center font-bold">
                            {row.rank === 1 && <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[11px]">1</span>}
                            {row.rank === 2 && <span className="inline-block px-2 py-0.5 rounded-full bg-slate-300 text-slate-800 font-bold text-[11px]">2</span>}
                            {row.rank === 3 && <span className="inline-block px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px]">3</span>}
                            {row.rank > 3 && <span className="text-slate-500 font-mono">#{row.rank}</span>}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-800">{row.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{row.designation} · {row.pf}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-medium text-slate-700">{row.department}</div>
                            <div className="text-[11px] text-slate-400">{row.unit}</div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-blue-900">
                            {row.score} <span className="text-[10px] text-slate-400 font-normal">/ {row.max_score}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {row.duration_seconds}s
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.isSeniorTieBreak ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Clock className="w-2.5 h-2.5" />
                                Faster Time
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Leaderboard will populate as participants complete the competition.
                </div>
              )}
            </div>

            {/* Department chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              {departmentsList.map((dept, index) => (
                <span key={`dept-chip-${dept}-${index}`} className="bg-white border border-[#eadcc4] px-3 py-1.5 rounded-full shadow-2xs">
                  {dept}
                </span>
              ))}
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
