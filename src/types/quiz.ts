export type QuestionCategory =
  | 'cvc_acts'
  | 'preventive_vigilance'
  | 'conduct_rules'
  | 'pidpi_whistleblower'
  | 'procurement_gem'
  | 'cyber_vigilance'
  | 'practical_scenarios';

export interface Question {
  id: string;
  category: QuestionCategory;
  categoryTitle: string;
  question: string;
  scenario?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  ruleReference: string;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
}

export type QuizMode = 'grand' | 'category' | 'sprint' | 'scenarios';

export interface QuizFilter {
  category?: QuestionCategory;
  count?: number;
  mode: QuizMode;
  timed: boolean;
  timePerQuestion?: number; // seconds
}

export interface QuizProgress {
  currentIndex: number;
  selectedAnswers: Record<number, number>; // questionIndex -> optionIndex
  flaggedQuestions: Record<number, boolean>;
  eliminatedOptions: Record<number, number[]>; // questionIndex -> eliminated option indices
  hintsUsed: Record<number, boolean>;
  isCompleted: boolean;
  timeSpentSeconds: number;
}

export interface QuizResultData {
  id: string;
  date: string;
  userName: string;
  designation: string;
  organization: string;
  modeTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  passed: boolean;
  categoryScores: Record<string, { correct: number; total: number }>;
  timeSpentSeconds: number;
  certificateId: string;
}

export interface PledgeRecord {
  id: string;
  fullName: string;
  designation: string;
  organization: string;
  pledgeType: 'public_servant' | 'citizen';
  date: string;
  certificateId: string;
}

export interface CaseScenario {
  id: string;
  title: string;
  department: string;
  dilemma: string;
  background: string;
  options: {
    text: string;
    action: string;
    integrityImpact: number; // -10 to +10
    transparencyImpact: number;
    complianceImpact: number;
    verdict: 'correct' | 'flawed' | 'violation';
    analysis: string;
    correctProcedure: string;
    applicableRule: string;
  }[];
}
