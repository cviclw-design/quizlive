import React, { useState, useEffect } from 'react';
import { Question, QuestionCategory } from '../types/quiz';
import { QUESTIONS_BANK, CATEGORIES_META } from '../data/questions';
import { soundEffects } from '../utils/audio';
import { CertificateView } from './CertificateView';
import confetti from 'canvas-confetti';
import {
  Timer,
  Flag,
  HelpCircle,
  Scissors,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface QuizViewProps {
  initialCategory?: QuestionCategory;
  initialMode?: 'grand' | 'category' | 'sprint';
  onExit?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  initialCategory,
  initialMode = 'grand',
  onExit
}) => {
  const [mode, setMode] = useState<'grand' | 'category' | 'sprint'>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | undefined>(initialCategory);
  const [isInstantFeedback, setIsInstantFeedback] = useState<boolean>(true);

  // Filter questions based on mode and category
  const [questions, setQuestions] = useState<Question[]>(() => {
    let pool = [...QUESTIONS_BANK];
    if (selectedCategory) {
      pool = pool.filter(q => q.category === selectedCategory);
    }
    if (mode === 'sprint') {
      return pool.sort(() => 0.5 - Math.random()).slice(0, 8);
    }
    if (mode === 'grand') {
      // Return balanced mix or full set
      return pool.slice(0, 15);
    }
    return pool;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, number[]>>({});
  const [hintShown, setHintShown] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Lifelines
  const [fiftyFiftyCount, setFiftyFiftyCount] = useState<number>(3);

  // Timer
  const initialTime = mode === 'sprint' ? 90 : questions.length * 60;
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTime);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Participant details for Certificate
  const [participantName, setParticipantName] = useState<string>('');
  const [participantDesignation, setParticipantDesignation] = useState<string>('Public Servant');
  const [participantOrg, setParticipantOrg] = useState<string>('Indian Railways / CLW');
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [certificateId, setCertificateId] = useState<string>('');

  // Reset or initialize when mode or category changes
  useEffect(() => {
    let pool = [...QUESTIONS_BANK];
    if (selectedCategory) {
      pool = pool.filter(q => q.category === selectedCategory);
    }
    if (mode === 'sprint') {
      pool = pool.sort(() => 0.5 - Math.random()).slice(0, 8);
    } else if (mode === 'grand') {
      pool = pool.slice(0, 15);
    }
    setQuestions(pool);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlagged({});
    setEliminatedOptions({});
    setHintShown({});
    setIsFinished(false);
    setShowCertificate(false);
    setFiftyFiftyCount(3);
    const secs = mode === 'sprint' ? 90 : pool.length * 60;
    setTimeRemaining(secs);
    setIsTimerRunning(true);
  }, [mode, selectedCategory]);

  // Countdown timer
  useEffect(() => {
    if (!isTimerRunning || isFinished || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, isFinished, timeRemaining]);

  const currentQuestion = questions[currentIndex];
  const currentSelection = userAnswers[currentIndex];
  const isCurrentAnswered = currentSelection !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (isFinished) return;
    // In instant feedback mode, don't allow re-answering once chosen
    if (isInstantFeedback && isCurrentAnswered) return;

    soundEffects.playClick();
    const updated = { ...userAnswers, [currentIndex]: optionIndex };
    setUserAnswers(updated);

    if (isInstantFeedback) {
      if (optionIndex === currentQuestion.correctAnswer) {
        soundEffects.playCorrect();
      } else {
        soundEffects.playIncorrect();
      }
    }
  };

  const handleToggleFlag = () => {
    soundEffects.playClick();
    setFlagged(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const handleUseFiftyFifty = () => {
    if (fiftyFiftyCount <= 0 || eliminatedOptions[currentIndex]) return;
    soundEffects.playClick();

    const wrongIndices = currentQuestion.options
      .map((_, i) => i)
      .filter(i => i !== currentQuestion.correctAnswer);

    // Pick 2 wrong indices randomly to eliminate
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    setEliminatedOptions(prev => ({
      ...prev,
      [currentIndex]: toEliminate
    }));
    setFiftyFiftyCount(prev => prev - 1);
  };

  const handleToggleHint = () => {
    soundEffects.playClick();
    setHintShown(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const handleFinishQuiz = () => {
    setIsFinished(true);
    setIsTimerRunning(false);

    // Calculate score
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct += 1;
      }
    });

    const pct = Math.round((correct / questions.length) * 100);
    if (pct >= 60) {
      soundEffects.playFanfare();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      soundEffects.playClick();
    }

    setCertificateId(`VAW-2026-QZ-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // Score statistics
  const correctCount = questions.reduce((acc, q, idx) => {
    return userAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);
  const scorePercentage = Math.round((correctCount / questions.length) * 100);
  const passed = scorePercentage >= 60;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (showCertificate) {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return (
      <CertificateView
        type="quiz"
        recipientName={participantName.trim() || 'Officer / Public Servant'}
        designation={participantDesignation.trim()}
        organization={participantOrg.trim()}
        date={today}
        certificateId={certificateId}
        quizScore={correctCount}
        totalQuestions={questions.length}
        onBack={() => setShowCertificate(false)}
      />
    );
  }

  // --- RESULT VIEW ---
  if (isFinished) {
    // Group category scores
    const categoryBreakdown: Record<string, { correct: number; total: number; title: string }> = {};
    questions.forEach((q, idx) => {
      if (!categoryBreakdown[q.category]) {
        categoryBreakdown[q.category] = { correct: 0, total: 0, title: q.categoryTitle };
      }
      categoryBreakdown[q.category].total += 1;
      if (userAnswers[idx] === q.correctAnswer) {
        categoryBreakdown[q.category].correct += 1;
      }
    });

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="text-center sm:text-left">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Assessment Outcome · VAW 2026
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {passed ? 'Assessment Successfully Cleared' : 'Assessment Completed'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {passed
                  ? 'Congratulations! You demonstrated excellent vigilance proficiency and adherence to ethical governance.'
                  : 'Review the detailed rule explanations below to strengthen your understanding of vigilance procedures.'}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 min-w-[140px]">
              <span className="text-3xl font-extrabold text-blue-950 font-mono">
                {scorePercentage}%
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {correctCount} of {questions.length} Correct
              </span>
            </div>
          </div>

          {/* Category Proficiency Breakdown */}
          <div className="py-6 border-b border-slate-200">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Domain Competency Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(categoryBreakdown).map(([catKey, data]) => {
                const pct = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={catKey} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-800">{data.title}</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {data.correct}/{data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${pct >= 75 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Claim Form (for passing score) */}
          {passed && (
            <div className="py-6 border-b border-slate-200 bg-amber-50/40 -mx-6 sm:-mx-8 px-6 sm:px-8">
              <div className="max-w-xl mx-auto text-center mb-4">
                <div className="inline-flex p-2 bg-amber-100 text-amber-900 rounded-full mb-2">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Claim Your Certificate of Vigilance Merit
                </h4>
                <p className="text-xs text-slate-600">
                  Enter your official details to print or download an authenticated CVC Vigilance Awareness Merit Certificate.
                </p>
              </div>

              <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    placeholder="e.g. C. P. CHAUHAN"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={participantDesignation}
                    onChange={e => setParticipantDesignation(e.target.value)}
                    placeholder="e.g. Chief Vigilance Inspector"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Organization / Railway Unit
                  </label>
                  <input
                    type="text"
                    value={participantOrg}
                    onChange={e => setParticipantOrg(e.target.value)}
                    placeholder="e.g. CLW / Indian Railways"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowCertificate(true)}
                  className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Generate Merit Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => {
                soundEffects.playClick();
                // Retake same quiz
                setCurrentIndex(0);
                setUserAnswers({});
                setFlagged({});
                setEliminatedOptions({});
                setHintShown({});
                setIsFinished(false);
                setTimeRemaining(initialTime);
                setIsTimerRunning(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Back to Modules
              </button>
            )}
          </div>
        </div>

        {/* Detailed Answer Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Complete Question Review & Statutory Rationale
            </h3>
            <span className="text-xs text-slate-500">
              {questions.length} Questions
            </span>
          </div>

          {questions.map((q, idx) => {
            const userChoice = userAnswers[idx];
            const isCorrect = userChoice === q.correctAnswer;
            const isUnanswered = userChoice === undefined;

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-500">Q{idx + 1}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{q.categoryTitle}</span>
                  </div>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : isUnanswered ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Unanswered</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                {q.scenario && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 mb-2 italic">
                    <strong>Case Scenario:</strong> {q.scenario}
                  </div>
                )}

                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  {q.question}
                </h4>

                <div className="space-y-1.5 mb-3 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isTargetCorrect = optIdx === q.correctAnswer;
                    const isUserPick = optIdx === userChoice;

                    let rowStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isTargetCorrect) {
                      rowStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium';
                    } else if (isUserPick && !isTargetCorrect) {
                      rowStyle = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-md border flex items-start gap-2 ${rowStyle}`}
                      >
                        <span className="font-mono text-[11px] font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-lg text-xs space-y-1 text-slate-800">
                  <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Statutory Reference: {q.ruleReference}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ PLAY VIEW ---
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top Status & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Mode & Category Breadcrumb */}
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Exit Quiz"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="text-xs text-slate-500">
              {mode === 'grand'
                ? 'VAW 2026 Grand Challenge'
                : mode === 'sprint'
                ? 'Vigilance Sprint (Speed Challenge)'
                : selectedCategory
                ? CATEGORIES_META.find(c => c.id === selectedCategory)?.title
                : 'Custom Practice'}
            </div>
            <div className="text-sm font-bold text-slate-900">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        {/* Lifelines & Timer */}
        <div className="flex items-center gap-3">
          {/* 50:50 Lifeline Button */}
          <button
            type="button"
            onClick={handleUseFiftyFifty}
            disabled={fiftyFiftyCount <= 0 || !!eliminatedOptions[currentIndex]}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              fiftyFiftyCount > 0 && !eliminatedOptions[currentIndex]
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Eliminate two wrong answers"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>50:50 ({fiftyFiftyCount})</span>
          </button>

          {/* Hint Button */}
          <button
            type="button"
            onClick={handleToggleHint}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              hintShown[currentIndex]
                ? 'bg-blue-100 border-blue-300 text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="View rule reference hint"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hint</span>
          </button>

          {/* Flag for Review */}
          <button
            type="button"
            onClick={handleToggleFlag}
            className={`p-2 rounded-lg border transition-colors ${
              flagged[currentIndex]
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Flag question for review"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800">
            <Timer className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs mb-6">
        {/* Category & Difficulty Tag */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
          <span>{currentQuestion.categoryTitle}</span>
          <span className="capitalize">{currentQuestion.difficulty} Level</span>
        </div>

        {/* Case scenario background if present */}
        {currentQuestion.scenario && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 mb-5 leading-relaxed">
            <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Workplace Case Scenario</span>
            </div>
            <p>{currentQuestion.scenario}</p>
          </div>
        )}

        {/* Question Text */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-6">
          {currentQuestion.question}
        </h2>

        {/* Hint Box (if toggled) */}
        {hintShown[currentIndex] && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 mb-5 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Vigilance Hint: </span>
              {currentQuestion.ruleReference}
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, optIdx) => {
            const isEliminated = (eliminatedOptions[currentIndex] || []).includes(optIdx);
            const isSelected = currentSelection === optIdx;
            const isAnswered = isCurrentAnswered;
            const isCorrect = optIdx === currentQuestion.correctAnswer;

            // Determine styling
            let buttonClasses = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';

            if (isEliminated) {
              buttonClasses = 'bg-slate-50 border-dashed border-slate-200 text-slate-300 cursor-not-allowed opacity-40';
            } else if (isInstantFeedback && isAnswered) {
              if (isCorrect) {
                buttonClasses = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium';
              } else if (isSelected && !isCorrect) {
                buttonClasses = 'bg-rose-50 border-rose-300 text-rose-950';
              } else {
                buttonClasses = 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-60';
              }
            } else if (isSelected) {
              buttonClasses = 'bg-blue-50 border-blue-800 text-blue-950 font-medium';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isEliminated || (isInstantFeedback && isAnswered)}
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${buttonClasses}`}
              >
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center shrink-0 font-semibold mt-0.5">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="flex-1 leading-snug">{option}</span>
                {isInstantFeedback && isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isInstantFeedback && isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback Explanation Box */}
        {isInstantFeedback && isCurrentAnswered && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-bold ${currentSelection === currentQuestion.correctAnswer ? 'text-emerald-700' : 'text-rose-700'}`}>
                {currentSelection === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{currentQuestion.ruleReference}</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              soundEffects.playClick();
              setCurrentIndex(prev => prev - 1);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              currentIndex > 0
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setCurrentIndex(prev => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishQuiz}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <span>Submit Assessment</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Palette Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-slate-700">Question Palette</span>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-900 inline-block" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Flagged
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 inline-block" /> Unanswered
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
          {questions.map((_, idx) => {
            const isAnswered = userAnswers[idx] !== undefined;
            const isFlagged = flagged[idx];
            const isCurrent = idx === currentIndex;

            let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
            if (isCurrent) {
              badgeClass = 'ring-2 ring-blue-700 font-bold bg-white text-blue-900';
            } else if (isFlagged) {
              badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
            } else if (isAnswered) {
              badgeClass = 'bg-blue-900 text-white border-transparent';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setCurrentIndex(idx);
                }}
                className={`h-8 rounded-md text-xs font-medium border flex items-center justify-center transition-colors ${badgeClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
