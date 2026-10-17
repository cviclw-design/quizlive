import React, { useState, useEffect, useRef } from 'react';
import { api, type LiveQuizPublicState, type LiveLeaderboardEntry, type CertificateData } from '../services/api';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
  Volume2,
  VolumeX,
  Share2,
  Printer,
  ChevronRight,
  RefreshCw,
  Flame,
  Medal,
  AlertCircle,
  Eye,
  FastForward,
  Play
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';

interface LiveQuizViewProps {
  onViewCertificate?: (cert: CertificateData) => void;
  onHome?: () => void;
  departmentsList?: string[];
}

export const LiveQuizView: React.FC<LiveQuizViewProps> = ({
  onViewCertificate,
  onHome,
  departmentsList = DEPARTMENTS
}) => {
  // Live State
  const [liveState, setLiveState] = useState<LiveQuizPublicState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Participant Registration State (stored in localStorage for session persistence)
  const [participant, setParticipant] = useState<{
    pf: string;
    name: string;
    designation: string;
    mobile: string;
    department: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('clw_live_participant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Registration / Login Form fields
  const [admissionStatus, setAdmissionStatus] = useState<'admitted' | 'waiting'>('admitted');
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginPf, setLoginPf] = useState('');
  const [loginPassword, setLoginPassword] = useState('123');
  const [regName, setRegName] = useState(participant?.name || '');
  const [regPf, setRegPf] = useState(participant?.pf || '');
  const [regDesig, setRegDesig] = useState(participant?.designation || '');
  const [regMobile, setRegMobile] = useState(participant?.mobile || '');
  const [regDept, setRegDept] = useState(participant?.department || '');
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');

  // Active question answering state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    points?: number;
    isCorrect?: boolean;
    timeTaken?: number;
  } | null>(null);

  // Synced countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const questionStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance 5-second countdown state
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  // Host / Admin status check for on-screen controls
  const [isAdminHost] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('host') || params.has('admin') || Boolean(localStorage.getItem('clw_admin_token'));
    } catch {
      return false;
    }
  });

  // Projector / Big Screen Mode
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEffects.getMuted());
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'all' | 'top10'>('top10');

  // WebSocket connection ref
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial state and establish WebSocket
  useEffect(() => {
    fetchState();
    connectWebSocket();

    // Fallback polling interval every 2.5 seconds to guarantee state sync
    const pollInterval = setInterval(() => {
      fetchState(false);
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // If participant is registered, announce join
        if (participant) {
          ws.send(JSON.stringify({
            type: 'join',
            payload: participant
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWebSocketMessage(msg);
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      ws.onclose = () => {
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        // Ignore WS errors, HTTP fallback polling handles it
      };
    } catch (e) {
      console.warn('WebSocket init failed, using HTTP polling fallback', e);
    }
  };

  const handleWebSocketMessage = (msg: any) => {
    switch (msg.type) {
      case 'sync_state':
        if (msg.state) setLiveState(msg.state);
        break;
      case 'lobby_started':
      case 'quiz_ended':
      case 'session_reset':
      case 'question_count_updated':
        setAutoCountdown(null);
        fetchState(false);
        break;
      case 'question_started':
        setAutoCountdown(null);
        fetchState(false);
        break;
      case 'answer_revealed':
        fetchState(false);
        if (msg.autoAdvance !== false) {
          setAutoCountdown(5);
        }
        break;
      case 'auto_countdown':
        setAutoCountdown(msg.seconds || 5);
        break;
      case 'leaderboard_update':
        if (msg.leaderboard) {
          setLiveState(prev => prev ? { ...prev, leaderboard: msg.leaderboard } : null);
        }
        break;
      case 'answer_acknowledged':
        if (msg.result) {
          setLastSubmissionResult(msg.result);
        }
        break;
      case 'participant_admitted':
        if (participant && (String(msg.pf).toUpperCase() === participant.pf.toUpperCase() || String(msg.participant?.pf).toUpperCase() === participant.pf.toUpperCase())) {
          setAdmissionStatus('admitted');
          fetchState(false);
        }
        break;
    }
  };

  // 1-second interval ticker for auto-advance countdown
  useEffect(() => {
    if (autoCountdown === null || autoCountdown <= 0) return;
    const ticker = setInterval(() => {
      setAutoCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(ticker);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [autoCountdown]);

  const fetchState = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.getLiveState();
      if (res && res.ok) {
        setLiveState(res);
        if (participant && res.leaderboard) {
          const isAdmitted = res.leaderboard.some((p: any) => p.pf?.toUpperCase() === participant.pf.toUpperCase());
          if (isAdmitted) {
            setAdmissionStatus('admitted');
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch live state', err);
      setError('Connecting to Live Quiz server...');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Synchronize timer countdown whenever activeQuestion changes
  useEffect(() => {
    if (!liveState) return;

    if (liveState.status === 'question' && liveState.activeQuestion) {
      const q = liveState.activeQuestion;
      questionStartTimeRef.current = q.startTime || Date.now();
      const totalTime = q.timerSeconds || liveState.timerSeconds || 30;

      // Reset local answering state for new question
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setTimeTaken(null);
      setLastSubmissionResult(null);

      // Start countdown
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const updateTimer = () => {
        const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
        const remaining = Math.max(0, totalTime - elapsed);
        setRemainingSeconds(Number(remaining.toFixed(1)));

        // Tick sound in the last 5 seconds
        if (remaining <= 5 && remaining > 0 && Math.floor(remaining) !== Math.floor(remaining + 0.1)) {
          soundEffects.playClick();
        }

        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          fetchState(false);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 100);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [liveState?.status, liveState?.activeQuestion?.id, liveState?.activeQuestion?.index]);

  // Handle Celebration on Quiz End
  useEffect(() => {
    if (liveState?.status === 'ended') {
      soundEffects.playFanfare();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }, [liveState?.status]);

  // Submit registration or login form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    setSubmittingReg(true);
    try {
      soundEffects.playClick();
      let payload: {
        pf: string;
        password?: string;
        name?: string;
        designation?: string;
        mobile?: string;
        department?: string;
        unit?: string;
      };

      if (isLoginMode) {
        if (!loginPf.trim()) {
          setRegError('Please enter your PF Number.');
          setSubmittingReg(false);
          return;
        }
        payload = {
          pf: loginPf.trim().toUpperCase(),
          password: loginPassword.trim() || '123'
        };
      } else {
        if (!regName.trim() || !regPf.trim() || !regDesig.trim()) {
          setRegError('Please fill in Name, PF No, and Designation.');
          setSubmittingReg(false);
          return;
        }
        if (!regDept) {
          setRegError('Please select your Department from the list.');
          setSubmittingReg(false);
          return;
        }
        if (regMobile.replace(/\D/g, '').length < 10) {
          setRegError('Please enter a valid 10-digit mobile number.');
          setSubmittingReg(false);
          return;
        }
        payload = {
          name: regName.trim(),
          pf: regPf.trim().toUpperCase(),
          designation: regDesig.trim(),
          mobile: regMobile.trim(),
          department: regDept,
          unit: 'Chittaranjan Locomotive Works',
          password: '123'
        };
      }

      const res = await api.joinLiveQuiz(payload);
      if (res.ok) {
        const participantData = res.participant || {
          pf: payload.pf,
          name: payload.name || payload.pf,
          designation: payload.designation || 'Staff',
          department: payload.department || 'CLW',
          mobile: payload.mobile || ''
        };
        setParticipant(participantData);
        setAdmissionStatus(res.status === 'waiting' ? 'waiting' : 'admitted');

        try {
          localStorage.setItem('clw_live_participant', JSON.stringify(participantData));
        } catch {}

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'join',
            payload: participantData
          }));
        }

        fetchState(false);
      } else {
        setRegError(res.message || 'Failed to enter live quiz.');
      }
    } catch (err: any) {
      setRegError(err?.message || 'Failed to enter live quiz.');
    } finally {
      setSubmittingReg(false);
    }
  };

  // Submit or Change Answer to Active Question within Time Limit
  const handleOptionSelect = async (optIndex: number) => {
    if (!participant || liveState?.status !== 'question' || remainingSeconds <= 0) return;

    soundEffects.playClick();
    setSelectedOption(optIndex);
    setIsAnswerSubmitted(true);

    const now = Date.now();
    const elapsed = Math.max(0.1, Number(((now - questionStartTimeRef.current) / 1000).toFixed(2)));
    setTimeTaken(elapsed);

    // Send via WebSocket or HTTP fallback
    try {
      const res = await api.submitLiveAnswer(participant.pf, optIndex, elapsed);
      if (res.ok) {
        setLastSubmissionResult(res);
        if (res.isCorrect) {
          soundEffects.playCorrect();
        }
      }
    } catch (err) {
      console.error('Failed to submit answer', err);
    }
  };

  // Toggle Sound Mute
  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) soundEffects.playClick();
  };

  // Load participant's certificate on end
  const handleOpenCertificate = async () => {
    if (!participant) return;
    try {
      soundEffects.playClick();
      const res = await api.getCertificate(participant.pf);
      if (res.ok && res.certificate && onViewCertificate) {
        onViewCertificate(res.certificate);
      }
    } catch (err) {
      console.error('Failed to get certificate', err);
    }
  };

  // Find current user's position in leaderboard
  const userRankEntry = liveState?.leaderboard.find(
    entry => entry.pf.toUpperCase() === participant?.pf?.toUpperCase()
  );

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all duration-300 ${isProjectorMode ? 'p-2 sm:p-4' : 'p-3 sm:p-6'}`}>
      
      {/* Top Bar with CLW Branding & Live Status */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#071a3a]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600/90 text-white animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                ONLINE LIVE QUIZ
              </span>
              <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">
                CLW VAW 2026
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-bold font-serif text-white tracking-wide">
              Chittaranjan Locomotive Works
            </h1>
            <p className="text-[11px] text-amber-200/90 hidden sm:block">
              {liveState?.sloganHindi || 'सत्यनिष्ठा की संस्कृति से राष्ट्र की समृद्धि'} · {liveState?.sloganEnglish || "Culture of Integrity for Nation's Prosperity"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition-colors"
            title="Toggle Big Screen Projector View"
          >
            {isProjectorMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isProjectorMode ? 'Exit Projector' : 'Projector View'}</span>
          </button>

          {onHome && (
            <button
              onClick={onHome}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Admin / Host Controller Bar (Visible for Admin / Host) */}
      {isAdminHost && (
        <div className="no-print max-w-6xl w-full mx-auto my-3 p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/50 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white uppercase tracking-wider">Admin Live Host Bar:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold font-mono text-[10px] uppercase">
              {liveState?.status || 'IDLE'}
            </span>
            <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
              Room: {liveState?.sessionCode || 'CLW 2026'} · Q{((liveState?.currentIndex || 0) + 1)} of {liveState?.questionCount}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reveal Answer Button */}
            {(liveState?.status === 'question' || liveState?.status === 'time_lapsed' || liveState?.status === 'review') && (
              <button
                type="button"
                onClick={async () => {
                  soundEffects.playClick();
                  await api.adminRevealLiveAnswer();
                  fetchState(false);
                }}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  liveState?.status === 'review'
                    ? 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                }`}
                title="Reveal correct answer to all participants"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{liveState?.status === 'review' ? '✓ Answer Revealed' : 'Reveal Answer & Scores'}</span>
              </button>
            )}

            {/* Next Question Button */}
            {(liveState?.status === 'review' || liveState?.status === 'question' || liveState?.status === 'time_lapsed') && (
              <button
                type="button"
                onClick={async () => {
                  soundEffects.playClick();
                  await api.adminNextLiveQuestion();
                  fetchState(false);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Advance immediately to next question without waiting"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-300" />
                <span>Next Question [Advance Now]</span>
              </button>
            )}

            {/* Launch Question 1 from lobby */}
            {liveState?.status === 'lobby' && (
              <button
                type="button"
                onClick={async () => {
                  soundEffects.playClick();
                  await api.adminStartLiveQuestion(0);
                  fetchState(false);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Play className="w-3.5 h-3.5 text-amber-300" />
                <span>Launch Question 1</span>
              </button>
            )}

            {/* End Quiz */}
            {liveState && liveState.status !== 'idle' && liveState.status !== 'ended' && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('End Live Quiz and publish podium?')) return;
                  soundEffects.playFanfare();
                  await api.adminEndLiveQuiz();
                  fetchState(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                End Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col py-6">

        {/* 1. REGISTRATION OR LOGIN VIEW (If participant not registered yet) */}
        {!participant ? (
          <div className="max-w-xl w-full mx-auto my-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
                Join Online Live Quiz
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter with your official PF Number. Speed and accuracy both award ranking marks!
              </p>

              {/* Mode Toggle Pills: Login vs Register */}
              <div className="mt-4 inline-flex p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(true);
                    setRegError('');
                  }}
                  className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
                    isLoginMode ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quick Log In (PF &amp; Password)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(false);
                    setRegError('');
                  }}
                  className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
                    !isLoginMode ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  New Participant Entry
                </button>
              </div>
            </div>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {isLoginMode ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      PF / Employee No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 11002345"
                      value={loginPf}
                      onChange={e => setLoginPf(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Password (Default: 123) *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password (default: 123)"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Registered employees log in with PF and default password <code className="text-amber-400 font-bold">123</code>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        PF / Employee No. *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 11002345"
                        value={regPf}
                        onChange={e => setRegPf(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Section Engineer"
                        value={regDesig}
                        onChange={e => setRegDesig(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Department *
                      </label>
                      <select
                        required
                        value={regDept}
                        onChange={e => setRegDept(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- Select Department --</option>
                        {departmentsList.map((dept, idx) => (
                          <option key={`live-dept-${dept}-${idx}`} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Mobile Number (10 digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={regMobile}
                        onChange={e => setRegMobile(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingReg ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isLoginMode ? 'Verifying Credentials...' : 'Joining Live Quiz...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isLoginMode ? 'Log In & Enter Live Quiz' : 'Enter Live Quiz Room'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : admissionStatus === 'waiting' ? (
          /* WAITING ROOM VIEW (Waiting for Admin Admission) */
          <div className="max-w-xl w-full mx-auto my-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-400 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                Live Quiz Waiting Room
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-3">
                Waiting for Quiz Admin to Admit You
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Welcome, <strong>{participant.name}</strong> (PF: {participant.pf})! You are in the waiting queue. The Admin can admit you at any moment, even after the live quiz has started.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Checking admission status with server... (Auto-updates when approved)</span>
            </div>

            <button
              onClick={() => {
                setParticipant(null);
                setAdmissionStatus('admitted');
                try {
                  localStorage.removeItem('clw_live_participant');
                } catch {}
              }}
              className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
            >
              Change PF / Registration Details
            </button>
          </div>
        ) : (

          /* 2. MAIN LIVE QUIZ INTERACTION */
          <div className="w-full flex-1 flex flex-col gap-6">

            {/* Participant Quick Badge */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{participant.name}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full border border-slate-700">
                      PF: {participant.pf}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {participant.designation} · {participant.department}
                  </div>
                </div>
              </div>

              {/* Live Rank & Score Badge */}
              <div className="flex items-center gap-4">
                {userRankEntry && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Your Live Rank</span>
                    <span className="text-lg font-mono font-bold text-amber-400 flex items-center justify-end gap-1">
                      <Medal className="w-4 h-4" />
                      #{userRankEntry.rank}
                    </span>
                  </div>
                )}
                <div className="text-right pl-4 border-l border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Score (Marks & Speed)</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {userRankEntry ? userRankEntry.score : 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* A. WAITING IN LOBBY / IDLE */}
            {(liveState?.status === 'idle' || liveState?.status === 'lobby') && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-lg space-y-4">
                  <div className="relative inline-flex items-center justify-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-pulse">
                      <Clock className="w-10 h-10 text-amber-300" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                    Waiting for Admin to Start
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    You are connected! When the Quiz Admin launches the session from the Control Room, questions will appear here with live synced countdowns.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 inline-flex items-center gap-3">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-semibold text-slate-200">
                      {liveState?.participantCount || 1} Participants In Lobby
                    </span>
                  </div>

                  <div className="pt-4 text-xs text-amber-200/90 font-medium bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-left">
                    <span className="font-bold text-amber-300 block mb-1">⚡ Official Scoring & Rules:</span>
                    • <strong>Correct answer:</strong> 100 points + up to 30 Speed Bonus (30 if within 1s, 29 in 2s, 30 − time taken).<br />
                    • <strong>Negative answer:</strong> −50 points.<br />
                    • <strong>Option change:</strong> You can change your choice anytime before timer expires! The last option selected and that time is considered.
                  </div>
                </div>
              </div>
            )}

            {/* B. ACTIVE QUESTION DISPLAY */}
            {liveState?.status === 'question' && liveState.activeQuestion && (
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Question Progress & Countdown Timer Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
                      Question {(liveState.activeQuestion.index || 0) + 1} of {liveState.activeQuestion.total || liveState.questionCount}
                    </span>

                    {/* Countdown Ring / Timer */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl sm:text-3xl font-mono font-bold ${
                          remainingSeconds <= 5 ? 'text-rose-400 animate-bounce' : remainingSeconds <= 10 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {remainingSeconds.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">sec</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-5">
                    <div
                      className={`h-full transition-all duration-100 rounded-full ${
                        remainingSeconds <= 5
                          ? 'bg-rose-500'
                          : remainingSeconds <= 10
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (remainingSeconds / (liveState.activeQuestion.timerSeconds || liveState.timerSeconds || 30)) * 100)}%`
                      }}
                    />
                  </div>

                  {/* Big Question Prompt */}
                  <h2 className="text-lg sm:text-2xl font-serif font-bold text-white leading-relaxed">
                    {liveState.activeQuestion.question}
                  </h2>
                </div>

                {/* 4 Interactive Option Cards - Changeable within time limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {liveState.activeQuestion.options.map((optText, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const optionLetter = ['A', 'B', 'C', 'D'][optIdx];

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionSelect(optIdx)}
                        disabled={remainingSeconds <= 0}
                        className={`p-4 sm:p-5 rounded-xl border text-left flex items-start gap-3.5 transition-all relative overflow-hidden ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-white shadow-lg ring-2 ring-amber-400 scale-[1.01]'
                            : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:border-slate-700'
                        } ${remainingSeconds <= 0 ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-98'}`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {optionLetter}
                        </span>

                        <div className="flex-1 text-sm sm:text-base font-medium leading-snug pt-0.5">
                          {optText}
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 self-center" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Answer status alert with change notice */}
                {isAnswerSubmitted && selectedOption !== null && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Choice <strong className="text-white">Option {['A', 'B', 'C', 'D'][selectedOption]}</strong> recorded at <strong className="text-amber-400 font-mono">{timeTaken}s</strong>.
                      </span>
                    </div>
                    {remainingSeconds > 0 ? (
                      <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
                        ⚡ You can click another option to change before time expires!
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Timer complete · Choice locked</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* C. ANSWER REVEAL & REVIEW */}
            {liveState?.status === 'review' && liveState.reviewData && (
              <div className="flex-1 flex flex-col gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
                  <div className="inline-flex items-center justify-center gap-2 mb-2">
                    {lastSubmissionResult?.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Correct! +{lastSubmissionResult.points} Points
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        Incorrect / Time Expired
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold font-serif text-white mb-4">
                    Correct Answer: Option {['A', 'B', 'C', 'D'][liveState.reviewData.correctIndex]}
                  </h3>

                  {/* Option responses distribution bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto my-4">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => {
                      const count = liveState.reviewData?.optionCounts[idx] || 0;
                      const isCorrect = idx === liveState.reviewData?.correctIndex;

                      return (
                        <div
                          key={letter}
                          className={`p-3 rounded-xl border text-center ${
                            isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-bold block mb-1">
                            Option {letter} {isCorrect && '✓'}
                          </span>
                          <span className="text-xl font-mono font-bold">
                            {count}
                          </span>
                          <span className="text-[10px] text-slate-400 block">votes</span>
                        </div>
                      );
                    })}
                  </div>

                  {autoCountdown !== null && autoCountdown > 0 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs sm:text-sm font-bold font-mono mt-3 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Next question starting in {autoCountdown}s (or waiting for Admin)...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-3">
                      Next question will be launched shortly by the Admin...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* D. QUIZ COMPLETED / GRAND PODIUM */}
            {liveState?.status === 'ended' && (
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Winners Podium Header */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
                    <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
                      Live Quiz Completed!
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-200/90 max-w-xl mx-auto mt-1 mb-6">
                      Official Vigilance Awareness Week 2026 Rankings based on accuracy marks and response speed.
                    </p>

                    {/* Top 3 Podium Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto my-6">
                      {liveState.leaderboard.slice(0, 3).map((winner, idx) => {
                        const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
                        const colors = [
                          'border-amber-400 bg-amber-500/10 text-amber-300',
                          'border-slate-300 bg-slate-300/10 text-slate-200',
                          'border-amber-700 bg-amber-700/10 text-amber-600'
                        ];

                        return (
                          <div
                            key={winner.id}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-between shadow-lg ${colors[idx]}`}
                          >
                            <span className="text-xs font-bold uppercase tracking-wider mb-2">
                              {medals[idx]}
                            </span>
                            <div className="text-base sm:text-lg font-bold text-white text-center">
                              {winner.name}
                            </div>
                            <div className="text-xs text-slate-300 text-center mb-3">
                              PF: {winner.pf} · {winner.department}
                            </div>
                            <div className="w-full pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
                              <span>{winner.score} pts</span>
                              <span>{winner.totalTimeTaken}s</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Certificate CTA */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                      <button
                        onClick={handleOpenCertificate}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>View / Print Official Participation Certificate (Landscape)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE SCOREBOARD / LEADERBOARD (Visible during and after quiz!) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                    Live Scoreboard
                  </h3>
                  <span className="text-xs text-slate-400">
                    ({liveState?.leaderboard.length || 0} Participants)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveLeaderboardTab('top10')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      activeLeaderboardTab === 'top10' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Top 10
                  </button>
                  <button
                    onClick={() => setActiveLeaderboardTab('all')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      activeLeaderboardTab === 'all' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All Rankers
                  </button>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Participant</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell">Designation</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                      <th className="py-2.5 px-3 text-right">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {liveState?.leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                          No participants registered yet. Join above to enter the scoreboard!
                        </td>
                      </tr>
                    ) : (
                      (activeLeaderboardTab === 'top10'
                        ? liveState?.leaderboard.slice(0, 10)
                        : liveState?.leaderboard
                      )?.map((entry) => {
                        const isSelf = entry.pf.toUpperCase() === participant.pf.toUpperCase();
                        const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

                        return (
                          <tr
                            key={entry.id}
                            className={`transition-colors ${
                              isSelf ? 'bg-amber-500/15 font-semibold text-white' : 'hover:bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {medal ? (
                                <span className="mr-1">{medal}</span>
                              ) : (
                                `#${entry.rank}`
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{entry.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-sm">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                PF: {entry.pf}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell">
                              {entry.designation}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {entry.department}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              {entry.score}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              {entry.totalTimeTaken}s
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Vigilance Awareness Week 2026 · Chittaranjan Locomotive Works · Official Central Vigilance Commission Portal
      </footer>

    </div>
  );
};
