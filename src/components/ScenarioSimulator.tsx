import React, { useState } from 'react';
import { CASE_SCENARIOS_DATA } from '../data/questions';
import { soundEffects } from '../utils/audio';
import { Shield, AlertTriangle, CheckCircle2, XCircle, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';

export const ScenarioSimulator: React.FC = () => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  const activeCase = CASE_SCENARIOS_DATA[activeCaseIndex];
  const chosenOption = selectedOptionIndex !== null ? activeCase.options[selectedOptionIndex] : null;

  const handleSelectOption = (index: number) => {
    soundEffects.playClick();
    setSelectedOptionIndex(index);
    const opt = activeCase.options[index];
    if (opt.verdict === 'correct') {
      soundEffects.playCorrect();
    } else {
      soundEffects.playIncorrect();
    }
  };

  const handleNextCase = () => {
    soundEffects.playClick();
    setSelectedOptionIndex(null);
    setActiveCaseIndex(prev => (prev + 1) % CASE_SCENARIOS_DATA.length);
  };

  const handleReset = () => {
    soundEffects.playClick();
    setSelectedOptionIndex(null);
    setActiveCaseIndex(0);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Intro Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Interactive Ethical Case Studies</span>
          <span>·</span>
          <span>Public Servant Dilemmas</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Workplace Vigilance Scenario Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Test your decision-making in real-world administrative, stores, and operational situations faced by public servants and vigilance authorities.
        </p>
      </div>

      {/* Case Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
        {CASE_SCENARIOS_DATA.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              soundEffects.playClick();
              setActiveCaseIndex(i);
              setSelectedOptionIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeCaseIndex === i
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Case 0{i + 1}: {c.title}
          </button>
        ))}
      </div>

      {/* Active Case Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Department: {activeCase.department}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Scenario {activeCaseIndex + 1} of {CASE_SCENARIOS_DATA.length}
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-3">
          {activeCase.title}
        </h2>

        {/* Narrative background */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed mb-4">
          <strong className="text-slate-900 block mb-1">Background:</strong>
          {activeCase.background}
        </div>

        {/* Dilemma Callout */}
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-sm text-amber-950 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">The Ethical & Vigilance Dilemma:</strong>
            {activeCase.dilemma}
          </div>
        </div>

        {/* Available Options */}
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Choose Your Course of Action:
        </h3>

        <div className="space-y-3 mb-6">
          {activeCase.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            let borderStyle = 'border-slate-200 hover:border-slate-300 bg-white text-slate-800';

            if (isSelected) {
              if (option.verdict === 'correct') {
                borderStyle = 'border-emerald-500 bg-emerald-50/50 text-slate-900 ring-2 ring-emerald-500/30';
              } else if (option.verdict === 'violation') {
                borderStyle = 'border-rose-500 bg-rose-50/50 text-slate-900 ring-2 ring-rose-500/30';
              } else {
                borderStyle = 'border-amber-500 bg-amber-50/50 text-slate-900 ring-2 ring-amber-500/30';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${borderStyle}`}
              >
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center shrink-0 font-semibold mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{option.text}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Analysis & Verdict Feedback Panel */}
        {chosenOption && (
          <div
            className={`p-6 rounded-xl border mb-6 text-xs sm:text-sm leading-relaxed ${
              chosenOption.verdict === 'correct'
                ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                : chosenOption.verdict === 'violation'
                ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                : 'bg-amber-50/40 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {chosenOption.verdict === 'correct' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span className="font-bold text-sm text-emerald-800">
                    Compliant Action (Gold Standard)
                  </span>
                </>
              ) : chosenOption.verdict === 'violation' ? (
                <>
                  <XCircle className="w-5 h-5 text-rose-700" />
                  <span className="font-bold text-sm text-rose-800">
                    Vigilance Violation / Misconduct
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                  <span className="font-bold text-sm text-amber-800">
                    Procedurally Flawed
                  </span>
                </>
              )}
            </div>

            {/* Impact Metric Chips */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-mono font-medium">
              <div className="p-2 bg-white rounded-md border border-slate-200 text-center">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Integrity</span>
                <span className={chosenOption.integrityImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {chosenOption.integrityImpact > 0 ? `+${chosenOption.integrityImpact}` : chosenOption.integrityImpact}
                </span>
              </div>
              <div className="p-2 bg-white rounded-md border border-slate-200 text-center">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Transparency</span>
                <span className={chosenOption.transparencyImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {chosenOption.transparencyImpact > 0 ? `+${chosenOption.transparencyImpact}` : chosenOption.transparencyImpact}
                </span>
              </div>
              <div className="p-2 bg-white rounded-md border border-slate-200 text-center">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Compliance</span>
                <span className={chosenOption.complianceImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {chosenOption.complianceImpact > 0 ? `+${chosenOption.complianceImpact}` : chosenOption.complianceImpact}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-slate-800">
              <div>
                <strong>Expert Rationale: </strong>
                {chosenOption.analysis}
              </div>
              <div>
                <strong>Prescribed Procedure: </strong>
                {chosenOption.correctProcedure}
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-900 border-t border-slate-200/60 mt-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Statutory Authority: {chosenOption.applicableRule}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Simulator</span>
          </button>

          <button
            type="button"
            onClick={handleNextCase}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
          >
            <span>Next Scenario</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
