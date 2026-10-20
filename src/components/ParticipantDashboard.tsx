import React, { useState, useEffect } from 'react';
import { api, ParticipantData } from '../services/api';
import { IndianRailwaysLogo } from './IndianRailwaysLogo';
import { soundEffects } from '../utils/audio';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  ShieldCheck,
  LogOut,
  Key,
  RefreshCw,
  AlertTriangle,
  Play,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Filter,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParticipantDashboardProps {
  participant: ParticipantData | null;
  onLogout: () => void;
  onStartQuiz: () => void;
  onViewCertificate: () => void;
  onJoinLiveQuiz?: () => void;
  onLoginSuccess: (p: ParticipantData) => void;
  onRegister?: () => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  participant,
  onLogout,
  onStartQuiz,
  onViewCertificate,
  onJoinLiveQuiz,
  onLoginSuccess,
  onRegister
}) => {
  // Login form state (if user is not logged in)
  const [loginPf, setLoginPf] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard data
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    participant: ParticipantData;
    attempt: {
      id: number;
      status: string;
      score: number | null;
      max_score: number;
      percentage?: number | null;
      rank?: number;
      duration_seconds?: number;
      submitted_at: string | null;
    } | null;
    questions: Array<{
      question_index: number;
      question_id: number;
      question_text: string;
      department: string;
      options: string[];
      selected_option_index: number;
      selected_option_text: string;
      correct_option_index: number;
      correct_option_text: string;
      is_correct: boolean;
      is_skipped: boolean;
      points_awarded: number;
    }>;
  } | null>(null);

  // Question filter tab: 'all' | 'correct' | 'incorrect' | 'skipped'
  const [questionFilter, setQuestionFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Re-admission request state
  const [readmissionNote, setReadmissionNote] = useState('');
  const [readmissionSubmitting, setReadmissionSubmitting] = useState(false);
  const [readmissionMsg, setReadmissionMsg] = useState<string | null>(null);

  // Fetch results and attempted questions
  const fetchMyResults = async (pf: string, pass?: string) => {
    setLoading(true);
    try {
      const res = await api.getMyResults(pf, pass);
      if (res.ok) {
        setDashboardData(res);
      }
    } catch (err: any) {
      console.error('Error fetching participant dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (participant?.pf) {
      fetchMyResults(participant.pf, participant.password);
    }
  }, [participant?.pf]);

  // Handle direct login from inside dashboard
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginPf.trim()) {
      setLoginError('Please enter your Employee PF Number.');
      return;
    }

    setLoginLoading(true);
    try {
      soundEffects.playClick();
      const res = await api.userLogin(loginPf.trim(), loginPass.trim() || '123');
      if (res.ok && res.participant) {
        onLoginSuccess(res.participant);
        await fetchMyResults(res.participant.pf, loginPass.trim() || '123');
      } else {
        setLoginError(res.error || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check PF Number and Password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Re-admission request
  const handleRequestReadmission = async () => {
    if (!participant?.pf) return;
    setReadmissionSubmitting(true);
    setReadmissionMsg(null);
    try {
      soundEffects.playClick();
      const res = await api.requestReadmission(participant.pf, participant.password, readmissionNote.trim());
      if (res.ok) {
        setReadmissionMsg('Re-admission request successfully submitted! The Vigilance Administrator will review and approve your account.');
        // Refresh
        await fetchMyResults(participant.pf, participant.password);
      }
    } catch (err: any) {
      setReadmissionMsg(`Request error: ${err.message || 'Failed to submit'}`);
    } finally {
      setReadmissionSubmitting(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!participant?.pf) return;

    if (!newPass || newPass.length < 3) {
      setPassMsg({ type: 'error', text: 'New password must be at least 3 characters.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPassSubmitting(true);
    try {
      soundEffects.playClick();
      const res = await api.changeUserPassword(participant.pf, currentPass, newPass);
      if (res.ok) {
        setPassMsg({ type: 'success', text: 'Password successfully updated! Use your new password next time.' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setPassMsg({ type: 'error', text: res.error || 'Failed to change password.' });
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPassSubmitting(false);
    }
  };

  // =========================================================================
  // CASE 1: PARTICIPANT IS LOGGED OUT (Enforces strict privacy requirement)
  // =========================================================================
  if (!participant) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white border border-[#eadcc4] rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <IndianRailwaysLogo size={68} />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black text-[#071a3a]">
            Login
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 mb-6">
            Authentication Required: Enter your PF Number and Password to access your official results, scorecard, and attempted question review.
          </p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#071a3a] mb-1">
                Employee / PF Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={loginPf}
                onChange={e => setLoginPf(e.target.value.toUpperCase())}
                placeholder="e.g. 50201234567"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#eadcc4] bg-[#fffdfa] text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#071a3a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071a3a] mb-1">
                Password <span className="text-slate-400 font-normal">(Default: 123)</span>
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-[#eadcc4] bg-[#fffdfa] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#071a3a]"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#071a3a] to-[#0f3460] hover:from-[#0a2652] hover:to-[#16437c] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                  <span>Log In to View My Results</span>
                </>
              )}
            </button>

            {onRegister && (
              <div className="pt-1">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={onRegister}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-slate-950" />
                  <span>New Registration</span>
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            Note: Your quiz score and answer breakdown are securely protected. Without logging in, your confidential results cannot be viewed by unauthorized users.
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: LOGGED IN PARTICIPANT DASHBOARD
  // =========================================================================
  const attempt = dashboardData?.attempt;
  const questions = dashboardData?.questions || [];
  const isSubmitted = attempt?.status === 'submitted';
  const isQuit = participant.status === 'quit';
  const isPendingApproval = participant.status === 'pending_approval';

  // Filter questions according to active tab
  const filteredQuestions = questions.filter(q => {
    if (questionFilter === 'correct') return q.is_correct;
    if (questionFilter === 'incorrect') return !q.is_correct && !q.is_skipped;
    if (questionFilter === 'skipped') return q.is_skipped;
    return true;
  });

  const correctCount = questions.filter(q => q.is_correct).length;
  const incorrectCount = questions.filter(q => !q.is_correct && !q.is_skipped).length;
  const skippedCount = questions.filter(q => q.is_skipped).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Top Participant Profile Banner */}
      <div className="bg-gradient-to-r from-[#071a3a] via-[#0f2c59] to-[#071a3a] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden border border-[#d4af37]/30">
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 pointer-events-none flex items-center justify-end pr-6">
          <IndianRailwaysLogo size={240} />
        </div>

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center p-2 shrink-0 shadow-inner">
              <IndianRailwaysLogo size={48} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#d4af37]">
                  INDIAN RAILWAYS · PARTICIPANT PORTAL
                </span>
                {isQuit ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-200 border border-red-500/50">
                    QUIT (LOCKED)
                  </span>
                ) : isPendingApproval ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-200 border border-amber-500/50">
                    RE-ADMISSION PENDING
                  </span>
                ) : isSubmitted ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-500/50">
                    QUIZ COMPLETED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/80 text-blue-200 border border-blue-400/50">
                    ACTIVE CANDIDATE
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-black text-white mt-1">
                {participant.name}
              </h1>
              <div className="text-xs text-white/80 font-medium mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                <span>PF: <strong className="font-mono text-[#d4af37]">{participant.pf}</strong></span>
                <span>·</span>
                <span>{participant.designation}</span>
                <span>·</span>
                <span>{participant.department}</span>
                <span>·</span>
                <span>{participant.unit}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Password & Logout */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Change Password</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BANNER FOR QUIT / PENDING RE-ADMISSION STATUS
          ===================================================================== */}
      {isQuit && (
        <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-red-950">
                Participation Locked: You Previously Quit From The Quiz Competition
              </h3>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                As per competition rules, you voluntarily quit the assessment on <strong>{participant.quit_at || 'record'}</strong>.
                Your account is currently locked. To be re-admitted and attempt the quiz again, you must obtain approval from the Vigilance Administrator.
              </p>

              {participant.quit_reason && (
                <div className="text-[11px] font-mono text-red-700 mt-2 bg-red-100/60 px-3 py-1.5 rounded-lg border border-red-200 inline-block">
                  Recorded Reason: {participant.quit_reason}
                </div>
              )}

              {readmissionMsg && (
                <div className="mt-3 p-3 bg-white border border-emerald-300 text-emerald-800 text-xs font-medium rounded-xl">
                  {readmissionMsg}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-red-200">
                <label className="block text-xs font-bold text-red-950 mb-1">
                  Submit Note / Justification for Re-admission (Optional):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={readmissionNote}
                    onChange={e => setReadmissionNote(e.target.value)}
                    placeholder="e.g. Request permission to re-take quiz due to technical interruption"
                    className="flex-1 px-4 py-2 rounded-xl border border-red-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleRequestReadmission}
                    disabled={readmissionSubmitting}
                    className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {readmissionSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    )}
                    <span>Request Re-admission from Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPendingApproval && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-amber-950">
                Re-admission Request Pending Administrator Approval
              </h3>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Your re-admission request was submitted on <strong>{participant.readmission_requested_at || 'recently'}</strong> and is under review by the Vigilance Officer. Once approved, your account will be unlocked automatically and you can start the quiz.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => fetchMyResults(participant.pf, participant.password)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Approval Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          RESULTS CARD & ATTEMPT SUMMARY (When Quiz Submitted)
          ===================================================================== */}
      {isSubmitted && attempt && (
        <div className="bg-white border border-[#eadcc4] rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#eadcc4]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a6a12]">
                OFFICIAL SCORECARD & ASSESSMENT SUMMARY
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#071a3a] mt-0.5">
                Vigilance Awareness Quiz Performance
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Completed on {attempt.submitted_at || 'Recently'} · Duration: {Math.floor((attempt.duration_seconds || 0) / 60)}m {(attempt.duration_seconds || 0) % 60}s
              </div>
            </div>

            {/* Certificate View Button */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onViewCertificate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#128a45] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#fef08a]" />
                <span>View & Download Certificate</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-2.5 rounded-xl border border-[#eadcc4] bg-[#fffdfa] hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Print this scorecard"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#fbf9f5] border border-[#eadcc4] rounded-2xl p-4 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Score Obtained</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#071a3a] mt-1">
                {attempt.score}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold">Max: {attempt.max_score}</div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-center">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Correct Answers</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">
                {correctCount}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">+{correctCount * 100} marks</div>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-center">
              <div className="text-[11px] font-bold text-red-800 uppercase">Incorrect / Negative</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-red-700 mt-1">
                {incorrectCount}
              </div>
              <div className="text-[11px] text-red-600 font-semibold">-{incorrectCount * 30} negative</div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-center">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Unattempted / Skipped</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 mt-1">
                {skippedCount}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold">0 marks</div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          NOT SUBMITTED YET: CALL TO ACTION
          ===================================================================== */}
      {!isSubmitted && !isQuit && !isPendingApproval && (
        <div className="bg-white border border-[#eadcc4] rounded-3xl p-6 sm:p-8 shadow-sm mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <Play className="w-7 h-7 fill-current ml-0.5" />
          </div>
          <h2 className="text-xl font-serif font-black text-[#071a3a]">
            You Have Not Completed The Vigilance Quiz Yet
          </h2>
          <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 mb-6">
            Test your knowledge of Railway Conduct Rules, CVC Guidelines, and Ethics in Public Procurement. An official digital certificate with QR verification will be issued upon completion!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartQuiz}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#128a45] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Departmental Quiz Now</span>
            </button>
            {onJoinLiveQuiz && (
              <button
                onClick={onJoinLiveQuiz}
                className="px-6 py-3 rounded-xl bg-[#071a3a] hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#d4af37]" />
                <span>Join Live Multiplayer Quiz</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          DETAILED ATTEMPTED QUESTIONS AND ANSWER KEY
          ===================================================================== */}
      {isSubmitted && questions.length > 0 && (
        <div className="bg-white border border-[#eadcc4] rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#eadcc4]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a6a12]">
                EXAM PAPER REVIEW
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-black text-[#071a3a] mt-0.5">
                Attempted Questions & Official Answer Key
              </h3>
              <p className="text-xs text-slate-500">
                Review your answers, correct options, and marks awarded for each question.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
              <button
                onClick={() => setQuestionFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  questionFilter === 'all' ? 'bg-white text-[#071a3a] shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setQuestionFilter('correct')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  questionFilter === 'correct' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Correct ({correctCount})</span>
              </button>
              <button
                onClick={() => setQuestionFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  questionFilter === 'incorrect' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-red-700 hover:text-red-900'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Wrong ({incorrectCount})</span>
              </button>
              <button
                onClick={() => setQuestionFilter('skipped')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  questionFilter === 'skipped' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <span>Skipped ({skippedCount})</span>
              </button>
            </div>
          </div>

          {/* List of Questions */}
          <div className="space-y-4 mt-6">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.question_id || idx}
                className={`border rounded-2xl p-5 transition-all ${
                  q.is_correct
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : q.is_skipped
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#071a3a] text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {q.question_index}
                    </span>
                    <span className="text-[11px] font-bold text-[#8a6a12] uppercase tracking-wider">
                      {q.department || 'General Vigilance'}
                    </span>
                  </div>

                  {/* Points Badge */}
                  <div>
                    {q.is_correct ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+100 Marks</span>
                      </span>
                    ) : q.is_skipped ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Skipped (0 Marks)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>-30 Marks</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h4 className="text-sm sm:text-base font-serif font-bold text-[#071a3a] mb-4 leading-snug">
                  {q.question_text}
                </h4>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  {q.options.map((optText, optIdx) => {
                    const isUserChoice = q.selected_option_index === optIdx;
                    const isCorrectAnswer = q.correct_option_index === optIdx;

                    let optStyle = 'border-slate-200 bg-white text-slate-700';
                    let badge = null;

                    if (isCorrectAnswer) {
                      optStyle = 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/30 font-semibold';
                      badge = (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Correct Answer
                        </span>
                      );
                    }
                    if (isUserChoice && !isCorrectAnswer) {
                      optStyle = 'border-red-500 bg-red-50/90 text-red-950 ring-2 ring-red-500/30 font-semibold';
                      badge = (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1 shrink-0">
                          <XCircle className="w-3 h-3" /> Your Choice (Incorrect)
                        </span>
                      );
                    } else if (isUserChoice && isCorrectAnswer) {
                      badge = (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Your Choice (Correct)
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${optStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isCorrectAnswer
                              ? 'bg-emerald-600 text-white'
                              : isUserChoice
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-snug">{optText}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          PASSWORD CHANGE MODAL
          ===================================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#eadcc4] rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#071a3a] mb-1">
              Change Participant Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter current password and set your new password for PF {participant.pf}.
            </p>

            {passMsg && (
              <div
                className={`mb-4 p-3 text-xs rounded-xl ${
                  passMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password <span className="text-slate-400 font-normal">(Default: 123)</span>
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  required
                  placeholder="••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#071a3a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                  placeholder="At least 3 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#071a3a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#071a3a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#071a3a] hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {passSubmitting ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
