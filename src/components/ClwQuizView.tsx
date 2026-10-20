import React, { useState, useEffect } from 'react';
import { api, QuizQuestionData, CertificateData, ParticipantData } from '../services/api';
import { soundEffects } from '../utils/audio';
import { ClwCertificateView } from './ClwCertificateView';
import confetti from 'canvas-confetti';
import { AlertCircle, ArrowLeft, RefreshCw, CheckCircle2, DoorClosed, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClwQuizViewProps {
  participant: ParticipantData;
  initialQuestions: QuizQuestionData[];
  initialSeconds: number;
  initialAnswers: Record<string, string>;
  onHome: () => void;
  onQuit?: (reason?: string) => void;
}

export const ClwQuizView: React.FC<ClwQuizViewProps> = ({
  participant,
  initialQuestions,
  initialSeconds = 45,
  initialAnswers = {},
  onHome,
  onQuit
}) => {
  const [questions] = useState<QuizQuestionData[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);

  // Quit Permanently Modal State
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [quitReason, setQuitReason] = useState('');
  const [isQuitting, setIsQuitting] = useState(false);
  const [quitError, setQuitError] = useState('');

  const currentQ = questions[currentIndex];
  const maxSeconds = initialSeconds || 45;

  const handleConfirmQuit = async () => {
    setIsQuitting(true);
    setQuitError('');
    try {
      soundEffects.playClick();
      await api.quitQuizPermanently(participant.pf, quitReason.trim() || 'Voluntarily quit quiz session');
      if (onQuit) {
        onQuit(quitReason.trim());
      } else {
        onHome();
      }
    } catch (err: any) {
      setQuitError(err.message || 'Failed to quit quiz.');
      setIsQuitting(false);
    }
  };

  // Question countdown timer
  useEffect(() => {
    if (certificate || isSubmitting) return;

    setTimeRemaining(maxSeconds);
    setSelectedOption(null);
    setErrorMessage('');

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGrade('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, certificate, isSubmitting, maxSeconds]);

  const handleSelect = (idx: number) => {
    soundEffects.playClick();
    setSelectedOption(String(idx));
    setErrorMessage('');
  };

  const handleGrade = async (mode: 'answer' | 'skip' | 'timeout') => {
    if (isSubmitting) return;

    if (mode === 'answer' && selectedOption === null) {
      soundEffects.playIncorrect();
      setErrorMessage('Please select an option or choose "Not Answering".');
      return;
    }

    const valueToSave = mode === 'skip' ? 'skip' : (mode === 'answer' ? (selectedOption ?? '') : '');

    setAnswers(prev => ({ ...prev, [String(currentQ.id)]: valueToSave }));

    try {
      soundEffects.playClick();
      // Save answer to server
      await api.saveAnswer(participant.pf, currentQ.id, valueToSave);
    } catch (err: unknown) {
      console.warn('Answer save notice:', err);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed all 20 questions!
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    try {
      soundEffects.playFanfare();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Submit on server
      await api.submitQuiz(participant.pf);

      // Load certificate
      const certRes = await api.getCertificate(participant.pf);
      if (certRes.ok && certRes.certificate) {
        setCertificate(certRes.certificate);
      }
    } catch (err: unknown) {
      console.error('Quiz submission error:', err);
      // Fallback: try fetching certificate anyway
      try {
        const certRes = await api.getCertificate(participant.pf);
        if (certRes.ok && certRes.certificate) {
          setCertificate(certRes.certificate);
        }
      } catch {
        // Proceed gracefully without popup
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (certificate) {
    return <ClwCertificateView cert={certificate} onHome={onHome} />;
  }

  if (isSubmitting) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <RefreshCw className="w-10 h-10 text-blue-950 animate-spin mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Finalising Assessment...</h2>
        <p className="text-xs text-slate-500 mt-1">Generating official participation certificate.</p>
      </div>
    );
  }

  const timerPct = Math.max(0, (timeRemaining / maxSeconds) * 100);
  const isTimerWarning = timeRemaining <= 10;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Quiz Card */}
      <div className="bg-white border border-[#eadcc4] rounded-2xl p-6 sm:p-8 shadow-md">
        
        {/* Quiz Header: Participant Info + Timer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-[#8a6a12] uppercase mb-0.5">
              CLW VAW 2026 ONLINE QUIZ
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#071a3a]">
              Question {currentIndex + 1} of {questions.length}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {participant.name} · PF {participant.pf} · {participant.department} · {participant.unit}
            </div>
          </div>

          {/* Circular Countdown Timer */}
          <div
            className={`relative w-20 h-20 rounded-full flex items-center justify-center font-extrabold font-mono transition-colors shadow-xs ${
              isTimerWarning
                ? 'bg-red-50 text-red-600 ring-4 ring-red-400/40'
                : 'bg-amber-50 text-amber-900 ring-4 ring-amber-400/30'
            }`}
          >
            <div className="text-center">
              <span className="text-2xl leading-none">{timeRemaining}</span>
              <span className="text-[9px] block uppercase font-sans font-semibold tracking-wider opacity-70">
                sec
              </span>
            </div>
          </div>
        </div>

        {/* Answered Questions Progress Bar */}
        <div className="my-5 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Questions Answered: {Object.keys(answers).filter(k => answers[k] && answers[k] !== 'skip').length} of {questions.length}</span>
            </span>
            <span className="font-mono text-emerald-700 font-extrabold">
              {Math.round((Object.keys(answers).filter(k => answers[k] && answers[k] !== 'skip').length / (questions.length || 1)) * 100)}% Answered
            </span>
          </div>
          <div className="w-full bg-[#efe6d6] h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 transition-all duration-300"
              style={{ width: `${(Object.keys(answers).filter(k => answers[k] && answers[k] !== 'skip').length / (questions.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Animated Question & Options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Question Statement */}
            <div className="my-6">
              <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#071a3a] leading-snug">
                {currentQ.question}
              </h2>
            </div>

            {/* 4 Options */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((optionText, idx) => {
                const isSelected = selectedOption === String(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-[#128a45] bg-[#eefbf3] text-[#071a3a] shadow-xs font-semibold ring-2 ring-[#128a45]/30'
                        : 'border-[#eadcc4] bg-white text-slate-800 hover:border-[#d4a017] hover:bg-[#fffdf8]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#128a45] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug mt-1">
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eadcc4]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGrade('skip')}
              className="px-4 py-2.5 rounded-xl border border-[#eadcc4] text-xs font-bold text-[#071a3a] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Not Answering (Skip: 0 Marks)
            </button>
            <button
              type="button"
              onClick={() => setShowQuitModal(true)}
              className="px-3 py-2.5 rounded-xl border border-red-300 text-xs font-bold text-red-700 bg-red-50/60 hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Quit from competition permanently"
            >
              <DoorClosed className="w-3.5 h-3.5 text-red-600" />
              <span>Quit Quiz Permanently</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleGrade('answer')}
            className="px-6 py-2.5 rounded-xl bg-[#128a45] hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <span>{currentIndex === questions.length - 1 ? 'Submit Final Paper' : 'Submit Answer'}</span>
          </button>
        </div>

        {/* Scoring note */}
        <div className="mt-4 text-center text-[11px] text-slate-500">
          Scoring Rule: +100 for Correct Answer · −50 for Negative / Wrong Answer · 0 for "Not Answering (Skip)". You can change your choice freely before clicking submit or timer expires.
        </div>
      </div>

      {/* ===================================================================
          CONFIRM PERMANENT QUIT MODAL (STRICT ADMIN APPROVAL REQUIREMENT)
          =================================================================== */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-400 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-serif font-black text-center text-red-950">
              Quit Quiz Permanently?
            </h3>

            <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1.5">
              <div className="font-bold text-red-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Permanent Forfeiture & Account Lock Warning</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-red-800">
                <li>Your active quiz session will be <strong>permanently terminated and forfeited</strong>.</li>
                <li>Your PF Number (<strong>{participant.pf}</strong>) will be <strong>locked</strong> immediately.</li>
                <li>You will <strong>NOT</strong> be allowed to log in or take the quiz again without <strong>explicit administrative approval</strong> from the Vigilance Officer.</li>
              </ul>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Quitting (Required for Admin Review):
              </label>
              <textarea
                value={quitReason}
                onChange={e => setQuitReason(e.target.value)}
                placeholder="State your reason (e.g. Urgent official call, technical failure, health issue, etc.)"
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50"
              />
            </div>

            {quitError && (
              <div className="mt-2 text-xs text-red-600 font-semibold">
                {quitError}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuitModal(false)}
                disabled={isQuitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                No, Resume Quiz
              </button>
              <button
                type="button"
                onClick={handleConfirmQuit}
                disabled={isQuitting}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isQuitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Exit...</span>
                  </>
                ) : (
                  <>
                    <DoorClosed className="w-3.5 h-3.5" />
                    <span>Yes, Quit Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
