import fs from 'fs';
import path from 'path';

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  must_change: boolean;
  created_at: string;
}

export interface QuestionItem {
  id: number;
  department: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number; // 0=A, 1=B, 2=C, 3=D
  sort_order: number;
  source: string;
  created_at: string;
}

export interface ScheduleItem {
  id: number;
  department: string;
  starts_at: string;
  ends_at: string;
  updated_at: string;
}

export interface ParticipantItem {
  id: number;
  pf_no: string;
  name: string;
  designation: string;
  department: string;
  unit_name: string;
  mobile: string;
  created_at: string;
}

export interface AttemptItem {
  id: number;
  participant_id: number;
  status: 'started' | 'submitted';
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  max_score: number;
  duration_seconds?: number;
  question_ids: number[];
  answers_json: Record<string, string>; // questionId -> "0"|"1"|"2"|"3"|"skip"
  rank?: number;
}

export interface AuditLogItem {
  id: number;
  created_at: string;
  actor: string;
  action: string;
  detail: string;
  ip: string;
}

export interface SystemSettings {
  cvo_name: string;
  cvo_designation: string;
  cvo_organization: string;
  signature_photo: string | null; // Base64 data URL
  quiz_certificate_template?: string | null; // Base64 template uploaded by admin
  pledge_certificate_template?: string | null; // Base64 template uploaded by admin
  seal_text: string;
  logo_url: string;
  quiz_seconds: number;
  quiz_count: number;
  enforce_schedule: boolean;
  slogan_hindi?: string;
  slogan_english?: string;
  updated_at: string;
}

export interface DatabaseSchema {
  admins: AdminUser[];
  settings: SystemSettings;
  questions: QuestionItem[];
  schedules: ScheduleItem[];
  participants: ParticipantItem[];
  attempts: AttemptItem[];
  audit_log: AuditLogItem[];
  seq: {
    admin: number;
    question: number;
    participant: number;
    attempt: number;
    audit: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'clw_vaw.json');

export const DEPARTMENTS = [
  'Personnel',
  'Accounts',
  'Stores',
  'Electrical',
  'Mechanical',
  'Security (RPF)',
  'Signal & Telecom',
  'Engineering',
  'Vigilance',
  'Engineering',
  'Medical',
  'General Administration',
  'Rajbhasha'
];

export const UNITS = [
  'CLW Headquarters',
  'Administrative Building',
  'Workshop',
  'Steel Foundry',
  'Traction Motor Shop',
  'Fabrication Shop',
  'Stores Depot',
  'KG Hospital',
  'ELAAU Dankuni',
  'Manufacturing',
  'Works Office',
  'Engineering'

];

const INITIAL_QUESTIONS: Omit<QuestionItem, 'id' | 'sort_order' | 'created_at'>[] = [
  {
    department: 'All',
    question: 'Vigilance Awareness Week 2026 is observed around the birth anniversary of which visionary leader?',
    option_a: 'Mahatma Gandhi',
    option_b: 'Sardar Vallabhbhai Patel',
    option_c: 'Dr. B. R. Ambedkar',
    option_d: 'Deshbandhu Chittaranjan Das',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'The theme of Vigilance Awareness Week 2026 is:',
    option_a: 'Vigilance: Our Shared Responsibility',
    option_b: 'Probity for Prosperity (सत्यनिष्ठा से समृद्धि)',
    option_c: 'Probity and Nation Building',
    option_d: 'Integrity for Development',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'The Central Vigilance Commission (CVC) is the apex vigilance body of the Central Government. It was set up in which year on the recommendation of the Santhanam Committee?',
    option_a: '1950',
    option_b: '1964',
    option_c: '1974',
    option_d: '1984',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Chittaranjan Locomotive Works (CLW) is named after:',
    option_a: 'Deshbandhu Chittaranjan Das',
    option_b: 'Chittaranjan Das Gupta',
    option_c: 'Lokmanya Tilak',
    option_d: 'Netaji Subhas Chandra Bose',
    correct_index: 0,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'At a Production Unit of Indian Railways such as CLW, the vigilance organisation is headed by:',
    option_a: 'Principal Chief Engineer (PCE)',
    option_b: 'SDGM & Chief Vigilance Officer (CVO)',
    option_c: 'Principal Financial Adviser (PFA)',
    option_d: 'Chief Security Commissioner (RPF)',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Preventive vigilance is best described as:',
    option_a: 'Punishment after a charge sheet is proved',
    option_b: 'Watchfulness, systemic improvements and transparency to stop irregularities before they occur',
    option_c: 'A purely police and detective function',
    option_d: 'An annual celebration without operational checks',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'PIDPI (Public Interest Disclosure and Protection of Informers) complaints are meant for:',
    option_a: 'Public disclosures of corruption where the complainant’s identity is protected by CVC',
    option_b: 'Posting grievances on public social media handles',
    option_c: 'Filing routine leave or transfer appeals',
    option_d: 'Publishing vendor brochures',
    correct_index: 0,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Under Rule 13 of the Railway Services (Conduct) Rules 1966, a railway servant must avoid accepting gifts from:',
    option_a: 'Any commercial firm, contractor or supplier having official dealings with the railway',
    option_b: 'Blood relatives on official festivals',
    option_c: 'Departmental staff sports club awards',
    option_d: 'The President of India',
    correct_index: 0,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'A Conflict of Interest arises in official duties when:',
    option_a: 'A public servant follows published tender criteria',
    option_b: 'A private or familial interest may compromise or appear to affect an official decision',
    option_c: 'A file is marked through proper departmental hierarchy',
    option_d: 'An officer attends an official inspection during duty hours',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'On Government e-Marketplace (GeM), which procurement practice is strictly prohibited under Rule 157 of GFR?',
    option_a: 'Comparing technical specifications objectively',
    option_b: 'Splitting purchase indents or work estimates to evade higher financial sanction',
    option_c: 'Selecting products under Direct Purchase within allowed thresholds',
    option_d: 'Maintaining complete procurement audit trails',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'What is the Canon of Financial Propriety expected from every public officer handling expenditure?',
    option_a: 'Spend budget quickly before financial year ends without vouchers',
    option_b: 'Exercise the same degree of vigilance and prudence as a person of ordinary prudence would exercise for their own money',
    option_c: 'Approve expenditures that directly benefit their own family',
    option_d: 'Avoid obtaining financial concurrence for high-value tenders',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Under the Information Technology Act 2000, sharing an officer’s Digital Signature Certificate (DSC) USB token and PIN with colleagues is:',
    option_a: 'Permissible if verbally instructed by a supervisor',
    option_b: 'A serious statutory and cyber security violation as DSC is legally personal to the subscriber',
    option_c: 'Encouraged to speed up file movement during annual leaves',
    option_d: 'Acceptable during weekend shifts',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Under Section 8 of the Prevention of Corruption (Amendment) Act 2018, which party is explicitly liable for direct criminal prosecution?',
    option_a: 'Only the receiver of bribe',
    option_b: 'The person who gives or promises to give an undue advantage (bribe-giver)',
    option_c: 'Only foreign companies',
    option_d: 'No one is prosecuted under Section 8',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Inflated measurements in a railway works contract are an irregularity that:',
    option_a: 'Is normal practice on construction sites',
    option_b: 'Can cause wrongful pecuniary loss to the railways and attracts vigilance / DAR proceedings',
    option_c: 'Should be resolved without inspecting the site',
    option_d: 'Falls exclusively under the Rajbhasha branch',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'What is the Central Vigilance Commission’s policy regarding post-tender negotiations?',
    option_a: 'Negotiations can be held with all bidders simultaneously',
    option_b: 'Post-tender negotiations are strictly banned, except in rare exceptional cases solely with the lowest valid bidder (L1)',
    option_c: 'Negotiations can be conducted with any favorite bidder',
    option_d: 'Bidders can increase their rates after price bids open',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Periodic "Rotational Transfers" of railway staff in sensitive posts is implemented primarily to:',
    option_a: 'Reduce office telephone expenses',
    option_b: 'Break entrenched corrupt nexus with suppliers/contractors and uphold impartiality',
    option_c: 'Cancel all past performance records',
    option_d: 'Prevent staff from learning other skills',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'The Integrity Pledge taken during Vigilance Awareness Week is meant to:',
    option_a: 'Grant immunity from past enquiries',
    option_b: 'Reaffirm unconditional commitment to honesty, rule of law, and zero tolerance for corruption',
    option_c: 'Replace official service conduct rules',
    option_d: 'Waive property declaration requirements',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'If a railway employee discovers a suspected fraudulent voucher or cyber irregularity, what should they do?',
    option_a: 'Destroy or shred the documents quietly',
    option_b: 'Promptly bring it to official notice through the proper vigilance / administrative channel',
    option_c: 'Share unverified allegations on private social media groups',
    option_d: 'Ignore it if no direct personal loss is felt',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'Under Rule 15 of Railway Services (Conduct) Rules 1966, engaging in private trade or commercial employment requires:',
    option_a: 'No permission if done on Sundays',
    option_b: 'Previous sanction of the Competent Authority',
    option_c: 'Only a verbal intimation to the peon',
    option_d: 'A note written in personal diary',
    correct_index: 1,
    source: 'sample'
  },
  {
    department: 'All',
    question: 'The core motto "Probity for Prosperity (सत्यनिष्ठा से समृद्धि)" conveys that:',
    option_a: 'Integrity is a shared national duty fundamental to sustainable economic and institutional growth',
    option_b: 'Integrity is required only when vigilance officers are inspecting',
    option_c: 'Rules may be ignored if production volume is high',
    option_d: 'Vigilance is restricted exclusively to the vigilance branch',
    correct_index: 0,
    source: 'sample'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInit();
  }

  private loadOrInit(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading DB_FILE, recreating initial state', err);
      }
    }

    const initial = this.createInitialSchema();
    this.persist(initial);
    return initial;
  }

  private createInitialSchema(): DatabaseSchema {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Initial schedules - default wide open so no participant is blocked
    const schedules: ScheduleItem[] = DEPARTMENTS.map((dept, idx) => ({
      id: idx + 1,
      department: dept,
      starts_at: '2026-08-17 00:00:00',
      ends_at: '2026-11-16 23:59:59',
      updated_at: now
    }));

    // Initial questions
    const questions: QuestionItem[] = INITIAL_QUESTIONS.map((q, idx) => ({
      id: idx + 1,
      ...q,
      sort_order: idx + 1,
      created_at: now
    }));

    return {
      admins: [
        {
          id: 1,
          username: 'admin',
          password_hash: 'ClwVaw@2026', // Stored default password
          display_name: 'Sugind Surendran',
          must_change: false,
          created_at: now
        },
        {
          id: 2,
          username: 'cvoclwcrj@gmail.com',
          password_hash: 'ClwVaw@2026',
          display_name: 'Sugind Surendran',
          must_change: false,
          created_at: now
        }
      ],
      settings: {
        cvo_name: 'Sugind Surendran',
        cvo_designation: 'SDGM & Chief Vigilance Officer',
        cvo_organization: 'Chittaranjan Locomotive Works, Chittaranjan',
        signature_photo: null, // Will store uploaded signature photo base64
        seal_text: 'CLW\nVIGILANCE\nCHITTARANJAN',
        logo_url: 'https://raw.githubusercontent.com/swrvaw/swrvaw.github.io/gh-pages/static/media/logo.8b9ced028d0a93767ec0.png',
        quiz_seconds: 45,
        quiz_count: 20,
        enforce_schedule: false,
        quiz_certificate_template: null,
        pledge_certificate_template: null,
        slogan_hindi: 'सत्यनिष्ठा से समृद्धि',
        slogan_english: 'Probity for Prosperity',
        updated_at: now
      },
      questions,
      schedules,
      participants: [],
      attempts: [],
      audit_log: [
        {
          id: 1,
          created_at: now,
          actor: 'system',
          action: 'init_database',
          detail: 'Database initialized with official CLW VAW 2026 questions bank and settings',
          ip: '127.0.0.1'
        }
      ],
      seq: {
        admin: 2,
        question: questions.length,
        participant: 0,
        attempt: 0,
        audit: 1
      }
    };
  }

  private persist(dataToSave?: DatabaseSchema) {
    const toSave = dataToSave || this.data;
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(toSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error persisting database file', err);
    }
  }

  // --- Audit ---
  public logAudit(actor: string, action: string, detail: string, ip: string = '127.0.0.1') {
    this.data.seq.audit++;
    const log: AuditLogItem = {
      id: this.data.seq.audit,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: actor.slice(0, 100),
      action: action.slice(0, 80),
      detail: detail.slice(0, 2000),
      ip: ip.slice(0, 50)
    };
    this.data.audit_log.unshift(log); // newest first
    if (this.data.audit_log.length > 500) {
      this.data.audit_log.pop();
    }
    this.persist();
  }

  // --- Admin ---
  public getAdminByUsername(username: string): AdminUser | undefined {
    return this.data.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  }

  public getAdminById(id: number): AdminUser | undefined {
    return this.data.admins.find(a => a.id === id);
  }

  public updateAdminPassword(id: number, newPassword: string): boolean {
    const admin = this.getAdminById(id);
    if (!admin) return false;
    admin.password_hash = newPassword;
    admin.must_change = false;
    this.persist();
    return true;
  }

  // --- Settings (Signature, CVO Name, etc.) ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
      updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.persist();
    return this.data.settings;
  }

  // --- Questions (CRUD) ---
  public getAllQuestions(department?: string): QuestionItem[] {
    if (department && department !== 'All') {
      const filtered = this.data.questions.filter(q => q.department === department || q.department === 'All');
      return filtered.sort((a, b) => a.sort_order - b.sort_order);
    }
    return [...this.data.questions].sort((a, b) => a.sort_order - b.sort_order);
  }

  public getQuestionById(id: number): QuestionItem | undefined {
    return this.data.questions.find(q => q.id === id);
  }

  public addQuestion(q: Omit<QuestionItem, 'id' | 'sort_order' | 'created_at'>): QuestionItem {
    this.data.seq.question++;
    const newQ: QuestionItem = {
      id: this.data.seq.question,
      ...q,
      sort_order: this.data.questions.length + 1,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.data.questions.push(newQ);
    this.persist();
    return newQ;
  }

  public updateQuestion(id: number, updates: Partial<Omit<QuestionItem, 'id' | 'created_at'>>): QuestionItem | null {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.data.questions[idx] = {
      ...this.data.questions[idx],
      ...updates
    };
    this.persist();
    return this.data.questions[idx];
  }

  public deleteQuestion(id: number): boolean {
    const initialLen = this.data.questions.length;
    this.data.questions = this.data.questions.filter(q => q.id !== id);
    if (this.data.questions.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public replaceQuestions(newQuestions: Omit<QuestionItem, 'id' | 'created_at'>[], mode: 'replace_all' | 'replace_department', department?: string): number {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (mode === 'replace_all') {
      this.data.questions = [];
    } else if (department && department !== 'All') {
      this.data.questions = this.data.questions.filter(q => q.department !== department);
    }

    newQuestions.forEach(q => {
      this.data.seq.question++;
      this.data.questions.push({
        id: this.data.seq.question,
        ...q,
        created_at: now
      });
    });

    this.persist();
    return newQuestions.length;
  }

  // --- Schedules ---
  public getSchedules(): ScheduleItem[] {
    return this.data.schedules;
  }

  public updateSchedules(rows: { department: string; starts_at: string; ends_at: string }[]): boolean {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    rows.forEach(r => {
      const existing = this.data.schedules.find(s => s.department === r.department);
      if (existing) {
        existing.starts_at = r.starts_at;
        existing.ends_at = r.ends_at;
        existing.updated_at = now;
      } else {
        this.data.schedules.push({
          id: this.data.schedules.length + 1,
          department: r.department,
          starts_at: r.starts_at,
          ends_at: r.ends_at,
          updated_at: now
        });
      }
    });
    this.persist();
    return true;
  }

  // --- Participants & Attempts ---
  public getParticipantByPf(pf: string): ParticipantItem | undefined {
    const clean = pf.trim().toUpperCase();
    return this.data.participants.find(p => p.pf_no === clean);
  }

  public getParticipantById(id: number): ParticipantItem | undefined {
    return this.data.participants.find(p => p.id === id);
  }

  public registerParticipant(data: {
    pf_no: string;
    name: string;
    designation: string;
    department: string;
    unit_name: string;
    mobile: string;
  }): ParticipantItem {
    const existing = this.getParticipantByPf(data.pf_no);
    if (existing) return existing;

    this.data.seq.participant++;
    const item: ParticipantItem = {
      id: this.data.seq.participant,
      pf_no: data.pf_no.trim().toUpperCase(),
      name: data.name.trim(),
      designation: data.designation.trim(),
      department: data.department.trim(),
      unit_name: data.unit_name.trim(),
      mobile: data.mobile.trim(),
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.data.participants.push(item);
    this.persist();
    return item;
  }

  public createParticipant(data: {
    pf: string;
    name: string;
    designation: string;
    department: string;
    unit?: string;
    mobile?: string;
  }): ParticipantItem {
    return this.registerParticipant({
      pf_no: data.pf,
      name: data.name,
      designation: data.designation,
      department: data.department,
      unit_name: data.unit || 'Chittaranjan Locomotive Works',
      mobile: data.mobile || '9999999999'
    });
  }

  public startAttempt(participantId: number, questionIds: number[]): AttemptItem {
    return this.createAttempt(participantId, questionIds);
  }

  public getAttemptByParticipantId(participantId: number): AttemptItem | undefined {
    return this.data.attempts.find(a => a.participant_id === participantId);
  }

  public getAttemptById(id: number): AttemptItem | undefined {
    return this.data.attempts.find(a => a.id === id);
  }

  public createAttempt(participantId: number, questionIds: number[]): AttemptItem {
    this.data.seq.attempt++;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const item: AttemptItem = {
      id: this.data.seq.attempt,
      participant_id: participantId,
      status: 'started',
      started_at: now,
      submitted_at: null,
      score: null,
      max_score: questionIds.length * 100,
      question_ids: questionIds,
      answers_json: {}
    };
    this.data.attempts.push(item);
    this.persist();
    return item;
  }

  public saveAnswer(attemptId: number, questionId: number, selected: string): boolean {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt || attempt.status !== 'started') return false;
    attempt.answers_json[String(questionId)] = selected;
    this.persist();
    return true;
  }

  public finalizeAttempt(attemptId: number): AttemptItem | null {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) return null;

    // Calculate score
    // User Rule: +100 for correct answer, -50 for negative / incorrect answer, 0 for skip / unattempted
    let totalScore = 0;
    attempt.question_ids.forEach(qid => {
      const q = this.getQuestionById(qid);
      const sel = attempt.answers_json[String(qid)];
      if (sel === 'skip' || sel === undefined || sel === '') {
        // 0 marks for skipped or not answered
      } else if (q && String(q.correct_index) === String(sel)) {
        totalScore += 100;
      } else {
        totalScore -= 50; // -50 points for negative answer
      }
    });

    attempt.score = totalScore;
    attempt.status = 'submitted';
    attempt.submitted_at = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Calculate time taken in seconds (used for seniority tie-breaking)
    try {
      const startMs = new Date(attempt.started_at.replace(' ', 'T')).getTime();
      const endMs = new Date(attempt.submitted_at.replace(' ', 'T')).getTime();
      attempt.duration_seconds = Math.max(1, Math.round((endMs - startMs) / 1000));
    } catch {
      attempt.duration_seconds = 60;
    }

    this.persist();
    return attempt;
  }

  // --- Reports & Results ---
  public getAllResults(): {
    participant: ParticipantItem;
    attempt: AttemptItem | null;
    rank?: number;
    isSeniorTieBreak?: boolean;
  }[] {
    const list = this.data.participants.map(p => {
      const att = this.data.attempts.find(a => a.participant_id === p.id) || null;
      return {
        participant: p,
        attempt: att
      };
    });

    // Seniority rule:
    // 1. Submitted attempts first
    // 2. Score DESC (higher marks first)
    // 3. Duration / Time taken ASC (less time taken = senior / higher rank)
    // 4. Participant registration ID ASC
    list.sort((a, b) => {
      const aSubmitted = a.attempt?.status === 'submitted';
      const bSubmitted = b.attempt?.status === 'submitted';
      if (aSubmitted !== bSubmitted) return aSubmitted ? -1 : 1;

      const aScore = a.attempt?.score ?? -999;
      const bScore = b.attempt?.score ?? -999;
      if (bScore !== aScore) {
        return bScore - aScore;
      }

      // Tie-breaker: Seniority decided by timing to solve (less time taken is senior)
      const aDur = a.attempt?.duration_seconds ?? 999999;
      const bDur = b.attempt?.duration_seconds ?? 999999;
      if (aDur !== bDur) {
        return aDur - bDur;
      }

      return a.participant.id - b.participant.id;
    });

    return list.map((item, idx) => {
      const prev = list[idx - 1];
      const next = list[idx + 1];
      const sameMarksAsOther = (prev && prev.attempt?.score === item.attempt?.score) ||
                               (next && next.attempt?.score === item.attempt?.score);
      return {
        ...item,
        rank: idx + 1,
        isSeniorTieBreak: !!sameMarksAsOther
      };
    });
  }

  public getLeaderboard(limit: number = 50) {
    const results = this.getAllResults().filter(r => r.attempt?.status === 'submitted');
    return results.slice(0, limit).map((r, idx) => ({
      rank: idx + 1,
      pf: r.participant.pf_no,
      name: r.participant.name,
      designation: r.participant.designation,
      department: r.participant.department,
      unit: r.participant.unit_name,
      score: r.attempt?.score ?? 0,
      max_score: r.attempt?.max_score ?? 20,
      duration_seconds: r.attempt?.duration_seconds ?? 0,
      submitted_at: r.attempt?.submitted_at ?? '',
      isSeniorTieBreak: r.isSeniorTieBreak
    }));
  }

  public getDashboardCounts() {
    return {
      questions: this.data.questions.length,
      participants: this.data.participants.length,
      submitted: this.data.attempts.filter(a => a.status === 'submitted').length,
      audit: this.data.audit_log.length,
      sample_questions: this.data.questions.filter(q => q.source === 'sample').length
    };
  }

  public getAuditLog(limit: number = 100, search?: string): { total: number; rows: AuditLogItem[] } {
    let logs = this.data.audit_log;
    if (search && search.trim()) {
      const term = search.toLowerCase();
      logs = logs.filter(l =>
        l.actor.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.detail.toLowerCase().includes(term) ||
        l.ip.includes(term)
      );
    }
    return {
      total: logs.length,
      rows: logs.slice(0, limit)
    };
  }
}

export const db = new Database();
