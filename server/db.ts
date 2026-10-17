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
  password?: string; // Default '123'
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

export interface LiveSessionRecord {
  id: string; // e.g. "LIVE-2026-01"
  title: string;
  scheduled_at: string; // e.g. "2026-10-29 11:00"
  duration_minutes?: number;
  timer_seconds: number;
  question_count: number;
  department?: string;
  status: 'scheduled' | 'lobby' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  participants_count?: number;
  history?: {
    ended_at: string;
    leaderboard: any[];
    participant_answers: Record<string, any>;
  };
}

export interface SystemSettings {
  cvo_name: string;
  cvo_designation: string;
  cvo_organization: string;
  organization_name: string;
  programme_name: string;
  programme_period: string;
  registration_enabled: boolean;
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
  departments?: string[];
  units?: string[];
  live_sessions?: LiveSessionRecord[];
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
  'Civil Engineering',
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
        const parsed: DatabaseSchema = JSON.parse(raw);
        // Migrations & defaults
        parsed.departments = Array.from(new Set((parsed.departments && parsed.departments.length > 0 ? parsed.departments : DEPARTMENTS).map(d => d.trim()).filter(Boolean)));
        parsed.units = Array.from(new Set((parsed.units && parsed.units.length > 0 ? parsed.units : UNITS).map(u => u.trim()).filter(Boolean)));
        if (!parsed.live_sessions) {
          parsed.live_sessions = [];
        }
        if (!parsed.settings.organization_name) {
          parsed.settings.organization_name = 'Chittaranjan Locomotive Works (CLW)';
        }
        if (!parsed.settings.programme_name) {
          parsed.settings.programme_name = 'Vigilance Awareness Week 2026 Quiz Competition';
        }
        if (!parsed.settings.programme_period) {
          parsed.settings.programme_period = '27th October to 2nd November 2026';
        }
        if (parsed.settings.registration_enabled === undefined) {
          parsed.settings.registration_enabled = true;
        }
        // Ensure all participants have password default '123'
        if (Array.isArray(parsed.participants)) {
          parsed.participants.forEach(p => {
            if (!p.password) p.password = '123';
          });
        }
        return parsed;
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
        organization_name: 'Chittaranjan Locomotive Works (CLW)',
        programme_name: 'Vigilance Awareness Week 2026 Quiz Competition',
        programme_period: '27th October to 2nd November 2026',
        registration_enabled: true,
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
      departments: [...DEPARTMENTS],
      units: [...UNITS],
      live_sessions: [],
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
    password?: string;
  }): ParticipantItem {
    const existing = this.getParticipantByPf(data.pf_no);
    if (existing) {
      if (data.password && data.password.trim()) {
        existing.password = data.password.trim();
        this.persist();
      }
      return existing;
    }

    this.data.seq.participant++;
    const item: ParticipantItem = {
      id: this.data.seq.participant,
      pf_no: data.pf_no.trim().toUpperCase(),
      name: data.name.trim(),
      designation: data.designation.trim(),
      department: data.department.trim(),
      unit_name: data.unit_name.trim(),
      mobile: data.mobile.trim(),
      password: (data.password && data.password.trim()) || '123',
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
    password?: string;
  }): ParticipantItem {
    return this.registerParticipant({
      pf_no: data.pf,
      name: data.name,
      designation: data.designation,
      department: data.department,
      unit_name: data.unit || 'Chittaranjan Locomotive Works',
      mobile: data.mobile || '9999999999',
      password: data.password || '123'
    });
  }

  // --- Participant Login & Password Reset ---
  public verifyParticipantLogin(pf: string, password: string): { ok: boolean; participant?: ParticipantItem; error?: string } {
    const cleanPf = pf.trim().toUpperCase();
    const p = this.getParticipantByPf(cleanPf);
    if (!p) {
      return { ok: false, error: 'PF Number not registered. Please register first.' };
    }
    const currentPass = (p.password || '123').trim();
    if (currentPass !== password.trim()) {
      return { ok: false, error: 'Incorrect password. Default password is 123, or contact Admin.' };
    }
    return { ok: true, participant: p };
  }

  public resetParticipantPassword(participantId: number, newPassword: string = '123'): boolean {
    const p = this.getParticipantById(participantId);
    if (!p) return false;
    p.password = (newPassword || '123').trim();
    this.persist();
    return true;
  }

  public changeParticipantPassword(pf: string, oldPassword: string, newPassword: string): { ok: boolean; error?: string } {
    const cleanPf = pf.trim().toUpperCase();
    const p = this.getParticipantByPf(cleanPf);
    if (!p) return { ok: false, error: 'Participant not found.' };
    if ((p.password || '123').trim() !== oldPassword.trim()) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    p.password = newPassword.trim();
    this.persist();
    return { ok: true };
  }

  // --- Dynamic Departments & Units ---
  public getDepartments(): string[] {
    if (!this.data.departments || this.data.departments.length === 0) {
      this.data.departments = [...DEPARTMENTS];
    }
    return this.data.departments;
  }

  public setDepartments(list: string[]): string[] {
    const cleaned = Array.from(new Set(list.map(s => s.trim()).filter(Boolean)));
    this.data.departments = cleaned;
    this.persist();
    return this.data.departments;
  }

  public addDepartment(name: string): string[] {
    const clean = name.trim();
    const depts = this.getDepartments();
    if (clean && !depts.includes(clean)) {
      depts.push(clean);
      this.data.departments = depts;
      this.persist();
    }
    return this.getDepartments();
  }

  public deleteDepartment(name: string): string[] {
    this.data.departments = this.getDepartments().filter(d => d !== name.trim());
    this.persist();
    return this.getDepartments();
  }

  public updateDepartment(oldName: string, newName: string): string[] {
    const o = oldName.trim();
    const n = newName.trim();
    if (!n) return this.getDepartments();
    const depts = this.getDepartments();
    const idx = depts.indexOf(o);
    if (idx !== -1) {
      depts[idx] = n;
      this.data.departments = depts;
      // Also update participants with this department
      this.data.participants.forEach(p => {
        if (p.department === o) p.department = n;
      });
      this.persist();
    }
    return this.getDepartments();
  }

  public getUnits(): string[] {
    if (!this.data.units || this.data.units.length === 0) {
      this.data.units = [...UNITS];
    }
    return this.data.units;
  }

  public setUnits(list: string[]): string[] {
    const cleaned = Array.from(new Set(list.map(s => s.trim()).filter(Boolean)));
    this.data.units = cleaned;
    this.persist();
    return this.getUnits();
  }

  public addUnit(name: string): string[] {
    const clean = name.trim();
    const units = this.getUnits();
    if (clean && !units.includes(clean)) {
      units.push(clean);
      this.data.units = units;
      this.persist();
    }
    return this.getUnits();
  }

  public deleteUnit(name: string): string[] {
    this.data.units = this.getUnits().filter(u => u !== name.trim());
    this.persist();
    return this.getUnits();
  }

  public updateUnit(oldName: string, newName: string): string[] {
    const o = oldName.trim();
    const n = newName.trim();
    if (!n) return this.getUnits();
    const units = this.getUnits();
    const idx = units.indexOf(o);
    if (idx !== -1) {
      units[idx] = n;
      this.data.units = units;
      // Also update participants with this unit
      this.data.participants.forEach(p => {
        if (p.unit_name === o) p.unit_name = n;
      });
      this.persist();
    }
    return this.getUnits();
  }

  // --- Detailed Attempt Question-by-Question Trace ---
  public getAttemptDetails(attemptId: number) {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) return null;
    const participant = this.getParticipantById(attempt.participant_id);
    if (!participant) return null;

    const questionsTrace = attempt.question_ids.map((qid, idx) => {
      const q = this.getQuestionById(qid);
      const sel = attempt.answers_json[String(qid)];
      const selNum = (sel === 'skip' || sel === undefined || sel === '') ? -1 : Number(sel);
      const isCorrect = q ? String(q.correct_index) === String(sel) : false;
      const isSkipped = sel === 'skip' || sel === undefined || sel === '';
      const points = isSkipped ? 0 : (isCorrect ? 100 : -50);

      const options = q ? [q.option_a, q.option_b, q.option_c, q.option_d] : [];

      return {
        question_index: idx + 1,
        question_id: qid,
        question_text: q?.question || 'Question not found',
        department: q?.department || 'All',
        options,
        selected_option_index: selNum,
        selected_option_text: selNum >= 0 && options[selNum] ? options[selNum] : (isSkipped ? 'Skipped / Unattempted' : 'Invalid'),
        correct_option_index: q?.correct_index ?? -1,
        correct_option_text: q && options[q.correct_index] ? options[q.correct_index] : '',
        is_correct: isCorrect,
        is_skipped: isSkipped,
        points_awarded: points
      };
    });

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        score: attempt.score,
        max_score: attempt.max_score,
        duration_seconds: attempt.duration_seconds,
        rank: attempt.rank
      },
      participant: {
        id: participant.id,
        pf_no: participant.pf_no,
        name: participant.name,
        designation: participant.designation,
        department: participant.department,
        unit_name: participant.unit_name,
        mobile: participant.mobile
      },
      questions: questionsTrace
    };
  }

  // --- Live Quiz Sessions & History ---
  public getLiveSessions(): LiveSessionRecord[] {
    if (!this.data.live_sessions) {
      this.data.live_sessions = [];
    }
    return this.data.live_sessions;
  }

  public getLiveSessionById(id: string): LiveSessionRecord | undefined {
    return this.getLiveSessions().find(s => s.id === id);
  }

  public createLiveSession(data: {
    title: string;
    scheduled_at: string;
    timer_seconds: number;
    question_count: number;
    department?: string;
  }): LiveSessionRecord {
    if (!this.data.live_sessions) this.data.live_sessions = [];
    const count = this.data.live_sessions.length + 1;
    const session: LiveSessionRecord = {
      id: `LIVE-SESSION-${String(count).padStart(3, '0')}`,
      title: data.title.trim() || `Live Vigilance Quiz #${count}`,
      scheduled_at: data.scheduled_at,
      timer_seconds: Math.max(10, Math.min(180, Number(data.timer_seconds) || 30)),
      question_count: Math.max(3, Math.min(50, Number(data.question_count) || 10)),
      department: data.department || 'All',
      status: 'scheduled',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.data.live_sessions.unshift(session);
    this.persist();
    return session;
  }

  public updateLiveSession(id: string, updates: Partial<LiveSessionRecord>): LiveSessionRecord | null {
    const session = this.getLiveSessionById(id);
    if (!session) return null;
    Object.assign(session, updates);
    this.persist();
    return session;
  }

  public deleteLiveSession(id: string): boolean {
    if (!this.data.live_sessions) return false;
    const initialLen = this.data.live_sessions.length;
    this.data.live_sessions = this.data.live_sessions.filter(s => s.id !== id);
    if (this.data.live_sessions.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Admin Direct Database Table Access & Modification ---
  public getTableData(tableName: string): any {
    switch (tableName) {
      case 'participants':
        return this.data.participants.map(p => {
          const attempt = this.getAttemptByParticipantId(p.id);
          return {
            ...p,
            password: p.password || '123',
            attempt_status: attempt?.status || 'not_started',
            score: attempt?.score ?? null,
            duration_seconds: attempt?.duration_seconds ?? null,
            attempt_id: attempt?.id ?? null
          };
        });
      case 'attempts':
        return this.data.attempts.map(a => {
          const p = this.getParticipantById(a.participant_id);
          return {
            ...a,
            pf_no: p?.pf_no || 'UNKNOWN',
            participant_name: p?.name || 'UNKNOWN',
            department: p?.department || 'UNKNOWN',
            unit_name: p?.unit_name || 'UNKNOWN'
          };
        });
      case 'questions':
        return this.data.questions;
      case 'departments':
        return this.getDepartments();
      case 'units':
        return this.getUnits();
      case 'settings':
        return this.getSettings();
      case 'live_sessions':
        return this.getLiveSessions();
      case 'audit_log':
        return this.data.audit_log.slice(0, 200);
      default:
        return null;
    }
  }

  public updateTableRow(tableName: string, id: any, updates: any): boolean {
    switch (tableName) {
      case 'participants': {
        const p = this.getParticipantById(Number(id));
        if (!p) return false;
        if (updates.pf_no) p.pf_no = String(updates.pf_no).trim().toUpperCase();
        if (updates.name) p.name = String(updates.name).trim();
        if (updates.designation) p.designation = String(updates.designation).trim();
        if (updates.department) p.department = String(updates.department).trim();
        if (updates.unit_name) p.unit_name = String(updates.unit_name).trim();
        if (updates.mobile) p.mobile = String(updates.mobile).trim();
        if (updates.password !== undefined) p.password = String(updates.password).trim() || '123';
        this.persist();
        return true;
      }
      case 'attempts': {
        const a = this.getAttemptById(Number(id));
        if (!a) return false;
        if (updates.score !== undefined) a.score = Number(updates.score);
        if (updates.status) a.status = updates.status;
        if (updates.rank !== undefined) a.rank = Number(updates.rank);
        this.persist();
        return true;
      }
      case 'questions': {
        return !!this.updateQuestion(Number(id), updates);
      }
      case 'settings': {
        this.updateSettings(updates);
        return true;
      }
      case 'live_sessions': {
        return !!this.updateLiveSession(String(id), updates);
      }
      default:
        return false;
    }
  }

  public deleteTableRow(tableName: string, id: any): boolean {
    switch (tableName) {
      case 'participants': {
        const numId = Number(id);
        this.data.participants = this.data.participants.filter(p => p.id !== numId);
        this.data.attempts = this.data.attempts.filter(a => a.participant_id !== numId);
        this.persist();
        return true;
      }
      case 'attempts': {
        const numId = Number(id);
        this.data.attempts = this.data.attempts.filter(a => a.id !== numId);
        this.persist();
        return true;
      }
      case 'questions': {
        return this.deleteQuestion(Number(id));
      }
      case 'live_sessions': {
        return this.deleteLiveSession(String(id));
      }
      default:
        return false;
    }
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
