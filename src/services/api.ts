// Client API service for CLW VAW 2026 Quiz Portal

export interface LiveSessionData {
  id: string;
  title: string;
  scheduled_at: string;
  timer_seconds: number;
  question_count: number;
  department?: string;
  status: 'scheduled' | 'lobby' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  participants_count?: number;
  history?: {
    ended_at: string;
    questions?: Array<{
      id: number;
      index: number;
      question: string;
      department?: string;
      options: string[];
      correct_index: number;
    }>;
    leaderboard: any[];
    participant_answers: Record<string, any>;
  };
}

export interface AttemptDetailData {
  attempt: {
    id: number;
    status: string;
    started_at: string;
    submitted_at: string | null;
    score: number | null;
    max_score: number;
    duration_seconds?: number;
    rank?: number;
  };
  participant: {
    id: number;
    pf_no: string;
    name: string;
    designation: string;
    department: string;
    unit_name: string;
    mobile: string;
  };
  questions: {
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
  }[];
}

export interface PublicHomeData {
  ok: boolean;
  departments: string[];
  units: string[];
  schedule: {
    id: number;
    department: string;
    starts_at: string;
    ends_at: string;
    updated_at: string;
  }[];
  live_sessions?: LiveSessionData[];
  settings: {
    cvo_name: string;
    cvo_designation: string;
    cvo_organization?: string;
    organization_name?: string;
    organization_email?: string;
    organization_address?: string;
    contact_address?: string;
    contact_email?: string;
    contact_phone?: string;
    programme_name?: string;
    programme_period?: string;
    registration_enabled?: boolean;
    seal_text: string;
    logo_url: string;
    has_signature: boolean;
    signature_photo?: string | null;
    has_quiz_template?: boolean;
    quiz_certificate_template?: string | null;
    has_pledge_template?: boolean;
    pledge_certificate_template?: string | null;
    quiz_seconds: number;
    quiz_count: number;
    slogan_hindi?: string;
    slogan_english?: string;
  };
}

export interface ParticipantData {
  id: number;
  pf: string;
  name: string;
  designation: string;
  department: string;
  unit: string;
  password?: string;
}

export interface QuizQuestionData {
  id: number;
  question: string;
  options: string[];
}

export interface QuizStartData {
  ok: boolean;
  seconds: number;
  questions: QuizQuestionData[];
  answers: Record<string, string>;
  attemptId: number;
  error?: string;
  done?: boolean;
}

export interface CertificateData {
  certificate_no: string;
  name: string;
  pf: string;
  designation: string;
  department: string;
  unit: string;
  score: number;
  max: number;
  rank?: number;
  duration_seconds?: number;
  submitted_at: string;
  cvo_name: string;
  cvo_designation: string;
  cvo_organization: string;
  signature_photo: string | null;
  quiz_certificate_template?: string | null;
  pledge_certificate_template?: string | null;
  seal_text: string;
  logo_url: string;
  slogan_hindi?: string;
  slogan_english?: string;
  organization_name?: string;
  programme_name?: string;
  programme_period?: string;
}

export interface AdminQuestionItem {
  id: number;
  department: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  sort_order: number;
  source: string;
  created_at: string;
}

export interface AdminSettingsData {
  cvo_name: string;
  cvo_designation: string;
  cvo_organization: string;
  organization_name?: string;
  organization_email?: string;
  organization_address?: string;
  contact_address?: string;
  contact_email?: string;
  contact_phone?: string;
  programme_name?: string;
  programme_period?: string;
  registration_enabled?: boolean;
  signature_photo: string | null;
  quiz_certificate_template?: string | null;
  pledge_certificate_template?: string | null;
  seal_text: string;
  logo_url: string;
  quiz_seconds: number;
  quiz_count: number;
  slogan_hindi?: string;
  slogan_english?: string;
  updated_at: string;
}

export interface LiveLeaderboardEntry {
  rank: number;
  id: string;
  pf: string;
  name: string;
  designation: string;
  department: string;
  marks?: number;
  score: number;
  correctCount: number;
  totalTimeTaken: number;
  isSeniorByTime?: boolean;
  lastPointsAwarded?: number;
  lastTimeTaken?: number;
}

export interface PublicLeaderboardItem {
  rank: number;
  pf: string;
  name: string;
  designation: string;
  department: string;
  unit: string;
  score: number;
  max_score: number;
  duration_seconds: number;
  submitted_at: string;
  isSeniorTieBreak?: boolean;
}

export interface LiveQuizPublicState {
  ok: boolean;
  status: 'idle' | 'lobby' | 'question' | 'time_lapsed' | 'review' | 'ended';
  sessionCode: string;
  timerSeconds: number;
  questionCount: number;
  currentIndex: number;
  questionStartTime: number;
  questionEndTime: number;
  participantCount: number;
  autoAdvance?: boolean;
  activeQuestion: {
    id: number;
    index: number;
    total: number;
    question: string;
    options: string[];
    department?: string;
    timerSeconds: number;
    startTime: number;
    endTime: number;
  } | null;
  reviewData: {
    index: number;
    correctIndex: number;
    optionCounts: [number, number, number, number];
  } | null;
  leaderboard: LiveLeaderboardEntry[];
  reviewStartTime?: number;
  sloganHindi: string;
  sloganEnglish: string;
  organizationName?: string;
  programmeName?: string;
  programmePeriod?: string;
}

class ApiService {
  private adminToken: string | null = null;

  constructor() {
    this.adminToken = localStorage.getItem('clw_admin_token');
  }

  public setAdminToken(token: string | null) {
    this.adminToken = token;
    if (token) {
      localStorage.setItem('clw_admin_token', token);
    } else {
      localStorage.removeItem('clw_admin_token');
    }
  }

  public getAdminToken(): string | null {
    return this.adminToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
      headers['x-admin-token'] = this.adminToken;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({ ok: false, error: 'Unexpected server response' }));
    if (!response.ok || data.ok === false) {
      const err = new Error(data.error || 'Request failed');
      (err as unknown as { data: unknown }).data = data;
      throw err;
    }

    return data as T;
  }

  // --- Public APIs ---
  public async getHome(): Promise<PublicHomeData> {
    return this.request<PublicHomeData>('/home', { method: 'GET' });
  }

  public async register(payload: {
    pf: string;
    name: string;
    designation: string;
    department: string;
    unit: string;
    mobile: string;
    password?: string;
  }) {
    return this.request<{
      ok: boolean;
      participant: ParticipantData;
      attempt: { status: string; score: number; max: number } | null;
    }>('/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async startQuiz(pf: string): Promise<QuizStartData> {
    return this.request<QuizStartData>('/start', {
      method: 'POST',
      body: JSON.stringify({ pf })
    });
  }

  public async saveAnswer(pf: string, question_id: number, selected: string) {
    return this.request<{ ok: boolean }>('/save_answer', {
      method: 'POST',
      body: JSON.stringify({ pf, question_id, selected })
    });
  }

  public async submitQuiz(pf: string) {
    return this.request<{ ok: boolean; score: number; max: number; submitted_at: string }>('/submit', {
      method: 'POST',
      body: JSON.stringify({ pf })
    });
  }

  public async getCertificate(pf: string) {
    return this.request<{ ok: boolean; certificate: CertificateData }>(`/certificate?pf=${encodeURIComponent(pf)}`, {
      method: 'GET'
    });
  }

  public async getLeaderboard() {
    return this.request<{
      ok: boolean;
      mode?: 'live' | 'last_completed' | 'none';
      status?: string;
      sessionTitle?: string | null;
      completedAt?: string;
      leaderboard: PublicLeaderboardItem[];
    }>('/leaderboard', {
      method: 'GET'
    });
  }

  // --- Admin APIs ---
  public async loginAdmin(username: string, password: string) {
    const data = await this.request<{
      ok: boolean;
      token: string;
      admin: { id: number; username: string; display_name: string; must_change: boolean };
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setAdminToken(data.token);
    return data;
  }

  public async logoutAdmin() {
    try {
      await this.request<{ ok: boolean }>('/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    this.setAdminToken(null);
  }

  public async getAdminMe() {
    return this.request<{
      ok: boolean;
      admin: { id: number; username: string; display_name: string; must_change: boolean } | null;
    }>('/me', { method: 'GET' });
  }

  public async getDashboard() {
    return this.request<{
      ok: boolean;
      counts: {
        questions: number;
        participants: number;
        submitted: number;
        audit: number;
        sample_questions: number;
      };
    }>('/admin/dashboard', { method: 'GET' });
  }

  // Question CRUD
  public async getAdminQuestions(department?: string) {
    const query = department && department !== 'All' ? `?department=${encodeURIComponent(department)}` : '';
    return this.request<{ ok: boolean; questions: AdminQuestionItem[] }>(`/admin/questions${query}`, {
      method: 'GET'
    });
  }

  public async addQuestion(question: {
    department: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_index: number;
  }) {
    return this.request<{ ok: boolean; question: AdminQuestionItem }>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(question)
    });
  }

  public async updateQuestion(
    id: number,
    question: {
      department: string;
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_index: number;
    }
  ) {
    return this.request<{ ok: boolean; question: AdminQuestionItem }>(`/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(question)
    });
  }

  public async deleteQuestion(id: number) {
    return this.request<{ ok: boolean; message: string }>(`/admin/questions/${id}`, {
      method: 'DELETE'
    });
  }

  public async uploadQuestionsCsv(csvText: string, mode: 'replace_all' | 'replace_department', fallbackDepartment?: string) {
    return this.request<{ ok: boolean; imported: number }>('/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ csvText, mode, fallbackDepartment })
    });
  }

  // Settings & Signature
  public async getAdminSettings() {
    return this.request<{ ok: boolean; settings: AdminSettingsData }>('/admin/settings', {
      method: 'GET'
    });
  }

  public async updateAdminSettings(settings: Partial<AdminSettingsData>) {
    return this.request<{ ok: boolean; settings: AdminSettingsData }>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  // Schedules
  public async saveSchedules(rows: { department: string; starts_at: string; ends_at: string }[]) {
    return this.request<{ ok: boolean }>('/admin/schedule_save', {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
  }

  // Results & Audit
  public async getAdminResults() {
    return this.request<{
      ok: boolean;
      results: {
        pf_no: string;
        name: string;
        designation: string;
        department: string;
        unit_name: string;
        mobile: string;
        status: string;
        score: number | null;
        max_score: number | null;
        submitted_at: string | null;
      }[];
    }>('/admin/results', { method: 'GET' });
  }

  public async getAdminAudit(search?: string) {
    const q = search ? `?q=${encodeURIComponent(search)}` : '';
    return this.request<{
      ok: boolean;
      total: number;
      rows: { id: number; created_at: string; actor: string; action: string; detail: string; ip: string }[];
    }>(`/admin/audit${q}`, { method: 'GET' });
  }

  public async changePassword(current: string, next: string) {
    return this.request<{ ok: boolean; message: string }>('/admin/change_password', {
      method: 'POST',
      body: JSON.stringify({ current, next })
    });
  }

  // --- Live Quiz APIs ---
  public async getLiveState(): Promise<LiveQuizPublicState> {
    return this.request<LiveQuizPublicState>('/live/state', { method: 'GET' });
  }

  public async joinLiveQuiz(payload: {
    pf: string;
    password?: string;
    name?: string;
    designation?: string;
    mobile?: string;
    department?: string;
    unit?: string;
  }) {
    return this.request<{
      ok: boolean;
      status: 'admitted' | 'waiting';
      message?: string;
      error?: string;
      participant: any;
      state: LiveQuizPublicState;
    }>('/live/join', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async submitLiveAnswer(pf: string, selectedOption: number, clientTimeTaken: number) {
    return this.request<{
      ok: boolean;
      points?: number;
      isCorrect?: boolean;
      timeTaken?: number;
      error?: string;
    }>('/live/submit', {
      method: 'POST',
      body: JSON.stringify({ pf, selectedOption, clientTimeTaken })
    });
  }

  public async getLiveLeaderboard(): Promise<{ ok: boolean; leaderboard: LiveLeaderboardEntry[] }> {
    return this.request<{ ok: boolean; leaderboard: LiveLeaderboardEntry[] }>('/live/leaderboard', {
      method: 'GET'
    });
  }

  public async adminStartLiveLobby(opts?: { timerSeconds?: number; questionCount?: number; department?: string }) {
    return this.request<LiveQuizPublicState>('/live/admin/start_lobby', {
      method: 'POST',
      body: JSON.stringify(opts || {})
    });
  }

  public async adminSetLiveTimer(timerSeconds: number) {
    return this.request<{ ok: boolean; timerSeconds: number }>('/live/admin/set_timer', {
      method: 'POST',
      body: JSON.stringify({ timerSeconds })
    });
  }

  public async adminSetLiveQuestionCount(questionCount: number) {
    return this.request<{ ok: boolean; questionCount: number }>('/live/admin/set_question_count', {
      method: 'POST',
      body: JSON.stringify({ questionCount })
    });
  }

  public async adminStartLiveQuestion(questionIndex?: number) {
    return this.request<LiveQuizPublicState>('/live/admin/start_question', {
      method: 'POST',
      body: JSON.stringify({ questionIndex })
    });
  }

  public async adminRevealLiveAnswer() {
    return this.request<LiveQuizPublicState>('/live/admin/reveal_answer', {
      method: 'POST'
    });
  }

  public async adminNextLiveQuestion() {
    return this.request<LiveQuizPublicState>('/live/admin/next_question', {
      method: 'POST'
    });
  }

  public async adminEndLiveQuiz() {
    return this.request<LiveQuizPublicState>('/live/admin/end_quiz', {
      method: 'POST'
    });
  }

  public async adminResetLiveQuiz() {
    return this.request<LiveQuizPublicState>('/live/admin/reset', {
      method: 'POST'
    });
  }

  public async adminToggleLiveAutoAdvance(enabled: boolean) {
    return this.request<{ ok: boolean; autoAdvance: boolean }>('/live/admin/toggle_auto_advance', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  public async adminGetLiveState() {
    return this.request<any>('/live/admin/state', {
      method: 'GET'
    });
  }

  // User Login & Password
  public async userLogin(pf: string, password?: string) {
    return this.request<{
      ok: boolean;
      participant: ParticipantData;
      attempt: {
        id: number;
        status: string;
        score: number | null;
        max: number;
        rank?: number;
        duration_seconds?: number;
        submitted_at: string | null;
      } | null;
      error?: string;
    }>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ pf, password })
    });
  }

  public async changeUserPassword(pf: string, current_password: string, new_password: string) {
    return this.request<{ ok: boolean; message?: string; error?: string }>('/user/change_password', {
      method: 'POST',
      body: JSON.stringify({ pf, current_password, new_password })
    });
  }

  public async adminResetUserPassword(participantId: number, newPassword?: string) {
    return this.request<{ ok: boolean; message: string }>('/admin/reset_user_password', {
      method: 'POST',
      body: JSON.stringify({ participantId, newPassword })
    });
  }

  // Attempt question-by-question trace
  public async adminGetAttemptDetails(attemptId: number) {
    return this.request<{ ok: boolean; details: AttemptDetailData }>('/admin/attempt_details/' + attemptId, {
      method: 'GET'
    });
  }

  public async userGetAttemptDetails(pf: string) {
    return this.request<{ ok: boolean; details: AttemptDetailData }>('/user/attempt_details/' + encodeURIComponent(pf), {
      method: 'GET'
    });
  }

  // Dynamic Departments & Units
  public async adminGetDepartments() {
    return this.request<{ ok: boolean; departments: string[] }>('/admin/departments', {
      method: 'GET'
    });
  }

  public async adminUpdateDepartments(payload: { action: 'add' | 'update' | 'delete' | 'set'; name?: string; newName?: string; list?: string[] }) {
    return this.request<{ ok: boolean; departments: string[] }>('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async adminGetUnits() {
    return this.request<{ ok: boolean; units: string[] }>('/admin/units', {
      method: 'GET'
    });
  }

  public async adminUpdateUnits(payload: { action: 'add' | 'update' | 'delete' | 'set'; name?: string; newName?: string; list?: string[] }) {
    return this.request<{ ok: boolean; units: string[] }>('/admin/units', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Live Quiz Waiting Room Controls
  public async adminAdmitLiveParticipant(pf: string) {
    return this.request<{ ok: boolean; state: any }>('/live/admin/admit', {
      method: 'POST',
      body: JSON.stringify({ pf })
    });
  }

  public async adminAdmitAllLive() {
    return this.request<{ ok: boolean; admittedCount: number; state: any }>('/live/admin/admit_all', {
      method: 'POST'
    });
  }

  public async adminToggleAutoAdmit(enabled: boolean) {
    return this.request<{ ok: boolean; autoAdmit: boolean; state: any }>('/live/admin/toggle_auto_admit', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  // Live Sessions Management
  public async getLiveSessions() {
    return this.request<{ ok: boolean; sessions: LiveSessionData[] }>('/live/sessions', {
      method: 'GET'
    });
  }

  public async adminCreateLiveSession(data: {
    title: string;
    scheduled_at: string;
    timer_seconds: number;
    question_count: number;
    department?: string;
  }) {
    return this.request<{ ok: boolean; session: LiveSessionData; sessions: LiveSessionData[] }>('/live/admin/create_session', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async adminGetLiveSessionHistory(id: string) {
    return this.request<{ ok: boolean; session: LiveSessionData }>('/live/sessions/' + encodeURIComponent(id) + '/history', {
      method: 'GET'
    });
  }

  public async adminGetLiveSessionParticipantTrace(sessionId: string, pf: string) {
    return this.request<{ ok: boolean; trace: any }>(`/live/sessions/${encodeURIComponent(sessionId)}/participant/${encodeURIComponent(pf)}`, {
      method: 'GET'
    });
  }

  public async adminGetLiveSessionBackup(sessionId: string) {
    return this.request<{ ok: boolean; backup: any }>(`/live/sessions/${encodeURIComponent(sessionId)}/backup`, {
      method: 'GET'
    });
  }

  public async getLiveCertificate(pf: string) {
    return this.request<{ ok: boolean; certificate: any; sessionTitle?: string }>(`/live/certificate/${encodeURIComponent(pf)}`, {
      method: 'GET'
    });
  }

  public async adminDeleteLiveSession(id: string) {
    return this.request<{ ok: boolean; sessions: LiveSessionData[] }>('/live/admin/delete_session', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }

  // Database Table Explorer for Admin
  public async adminGetDbTable(table: string) {
    return this.request<{ ok: boolean; table: string; data: any }>('/admin/db/' + encodeURIComponent(table), {
      method: 'GET'
    });
  }

  public async adminUpdateDbTableRow(table: string, id: any, updates: any) {
    return this.request<{ ok: boolean; message: string }>('/admin/db/' + encodeURIComponent(table) + '/update', {
      method: 'POST',
      body: JSON.stringify({ id, updates })
    });
  }

  public async adminDeleteDbTableRow(table: string, id: any) {
    return this.request<{ ok: boolean; message: string }>('/admin/db/' + encodeURIComponent(table) + '/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }
}

export const api = new ApiService();
