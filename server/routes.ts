import express, { type Request, type Response } from 'express';
import { db, DEPARTMENTS, UNITS, type QuestionItem } from './db.ts';
import { liveQuiz } from './liveQuiz.ts';

export const apiRouter = express.Router();

// Simple in-memory session store for admin tokens
const activeSessions: Record<string, { adminId: number; username: string; expiresAt: number }> = {};

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function getSession(req: Request) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || (req.headers['x-admin-token'] as string);
  if (!token) return null;
  const sess = activeSessions[token];
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) {
    delete activeSessions[token];
    return null;
  }
  // extend session
  sess.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  return sess;
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const sess = getSession(req);
  if (!sess) {
    res.status(401).json({ ok: false, error: 'Admin authentication required.' });
    return;
  }
  next();
}

// --- Public Endpoints ---

// Home info: departments, units, schedules, CVO public settings
apiRouter.get('/home', (_req, res) => {
  const settings = db.getSettings();
  res.json({
    ok: true,
    departments: DEPARTMENTS,
    units: UNITS,
    schedule: db.getSchedules(),
    settings: {
      cvo_name: settings.cvo_name,
      cvo_designation: settings.cvo_designation,
      cvo_organization: settings.cvo_organization,
      seal_text: settings.seal_text,
      logo_url: settings.logo_url,
      has_signature: !!settings.signature_photo,
      signature_photo: settings.signature_photo,
      has_quiz_template: !!settings.quiz_certificate_template,
      quiz_certificate_template: settings.quiz_certificate_template || null,
      has_pledge_template: !!settings.pledge_certificate_template,
      pledge_certificate_template: settings.pledge_certificate_template || null,
      quiz_seconds: settings.quiz_seconds,
      quiz_count: settings.quiz_count,
      slogan_hindi: settings.slogan_hindi || 'सत्यनिष्ठा से समृद्धि',
      slogan_english: settings.slogan_english || 'Probity for Prosperity'
    }
  });
});

// Registration
apiRouter.post('/register', (req, res) => {
  const { pf, name, designation, department, unit, mobile } = req.body || {};
  const cleanPf = String(pf || '').trim().toUpperCase().replace(/\s+/g, '');
  const cleanName = String(name || '').trim();
  const cleanDesig = String(designation || '').trim();
  const cleanDept = String(department || '').trim();
  const cleanUnit = String(unit || '').trim();
  const cleanMobile = String(mobile || '').replace(/\D+/g, '');

  if (!cleanPf || !cleanName || !cleanDesig) {
    res.status(422).json({ ok: false, error: 'Please enter Name, Designation, and valid PF Number.' });
    return;
  }
  if (!cleanDept || !cleanUnit) {
    res.status(422).json({ ok: false, error: 'Please select both Department and Unit.' });
    return;
  }
  if (cleanMobile.length < 10) {
    res.status(422).json({ ok: false, error: 'Please enter a valid 10-digit mobile number.' });
    return;
  }

  const existing = db.getParticipantByPf(cleanPf);
  if (existing) {
    const attempt = db.getAttemptByParticipantId(existing.id);
    res.json({
      ok: true,
      participant: {
        id: existing.id,
        pf: existing.pf_no,
        name: existing.name,
        designation: existing.designation,
        department: existing.department,
        unit: existing.unit_name
      },
      attempt: attempt ? { status: attempt.status, score: attempt.score, max: attempt.max_score } : null
    });
    return;
  }

  const participant = db.registerParticipant({
    pf_no: cleanPf,
    name: cleanName,
    designation: cleanDesig,
    department: cleanDept,
    unit_name: cleanUnit,
    mobile: cleanMobile
  });

  db.logAudit(cleanPf, 'participant_register', `${cleanName} / ${cleanDept} / ${cleanUnit}`, getClientIp(req));

  res.json({
    ok: true,
    participant: {
      id: participant.id,
      pf: participant.pf_no,
      name: participant.name,
      designation: participant.designation,
      department: participant.department,
      unit: participant.unit_name
    },
    attempt: null
  });
});

// Start or Resume Quiz
apiRouter.post('/start', (req, res) => {
  const cleanPf = String(req.body?.pf || '').trim().toUpperCase().replace(/\s+/g, '');
  const participant = db.getParticipantByPf(cleanPf);

  if (!participant) {
    res.status(404).json({ ok: false, error: 'Participant not found. Please register first.' });
    return;
  }

  let attempt = db.getAttemptByParticipantId(participant.id);

  if (attempt) {
    if (attempt.status === 'submitted') {
      res.status(409).json({
        ok: false,
        error: 'This PF number has already completed and submitted the quiz.',
        done: true
      });
      return;
    }
  } else {
    // Check department schedule
    const sched = db.getSchedules().find(s => s.department === participant.department);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (sched) {
      if (now < sched.starts_at) {
        res.status(403).json({ ok: false, error: `The quiz for ${participant.department} department has not opened yet.` });
        return;
      }
      if (now > sched.ends_at) {
        res.status(403).json({ ok: false, error: `The quiz window for ${participant.department} department has closed.` });
        return;
      }
    }

    // Pick questions for this department
    const bank = db.getAllQuestions(participant.department);
    if (!bank || bank.length === 0) {
      res.status(409).json({ ok: false, error: 'No questions have been configured for this department.' });
      return;
    }

    const count = db.getSettings().quiz_count || 20;
    const questionIds = bank.slice(0, count).map(q => q.id);

    attempt = db.createAttempt(participant.id, questionIds);
    db.logAudit(cleanPf, 'quiz_start', `${participant.department} / ${questionIds.length} questions`, getClientIp(req));
  }

  // Hide correct_index from client
  const sanitizedQuestions = attempt.question_ids.map(qid => {
    const q = db.getQuestionById(qid);
    if (!q) return null;
    return {
      id: q.id,
      question: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d]
    };
  }).filter(Boolean);

  res.json({
    ok: true,
    seconds: db.getSettings().quiz_seconds || 45,
    questions: sanitizedQuestions,
    answers: attempt.answers_json,
    attemptId: attempt.id
  });
});

// Save single question answer
apiRouter.post('/save_answer', (req, res) => {
  const { pf, question_id, selected } = req.body || {};
  const cleanPf = String(pf || '').trim().toUpperCase().replace(/\s+/g, '');
  const qid = Number(question_id);
  const selStr = String(selected);

  if (!['0', '1', '2', '3', 'skip', ''].includes(selStr)) {
    res.status(422).json({ ok: false, error: 'Invalid selection value.' });
    return;
  }

  const participant = db.getParticipantByPf(cleanPf);
  const attempt = participant ? db.getAttemptByParticipantId(participant.id) : null;

  if (!attempt) {
    res.status(404).json({ ok: false, error: 'Active quiz attempt not found.' });
    return;
  }
  if (attempt.status !== 'started') {
    res.status(409).json({ ok: false, error: 'This quiz attempt is already submitted.', done: true });
    return;
  }

  db.saveAnswer(attempt.id, qid, selStr);
  res.json({ ok: true });
});

// Submit entire quiz
apiRouter.post('/submit', (req, res) => {
  const cleanPf = String(req.body?.pf || '').trim().toUpperCase().replace(/\s+/g, '');
  const participant = db.getParticipantByPf(cleanPf);
  const attempt = participant ? db.getAttemptByParticipantId(participant.id) : null;

  if (!attempt) {
    res.status(404).json({ ok: false, error: 'Quiz attempt not found.' });
    return;
  }

  if (attempt.status === 'started') {
    const finalized = db.finalizeAttempt(attempt.id);
    db.logAudit(cleanPf, 'quiz_submit', `Score: ${finalized?.score} / ${finalized?.max_score}`, getClientIp(req));
    res.json({
      ok: true,
      score: finalized?.score,
      max: finalized?.max_score,
      submitted_at: finalized?.submitted_at
    });
    return;
  }

  res.json({
    ok: true,
    score: attempt.score,
    max: attempt.max_score,
    submitted_at: attempt.submitted_at
  });
});

// Retrieve Certificate
apiRouter.get('/certificate', (req, res) => {
  const cleanPf = String(req.query?.pf || '').trim().toUpperCase().replace(/\s+/g, '');
  const participant = db.getParticipantByPf(cleanPf);
  const attempt = participant ? db.getAttemptByParticipantId(participant.id) : null;

  if (!participant || !attempt || attempt.status !== 'submitted') {
    res.status(404).json({ ok: false, error: 'Certificate is available after completing and submitting the quiz.' });
    return;
  }

  const settings = db.getSettings();
  const certId = `CLW-VAW-2026-${String(attempt.id).padStart(5, '0')}`;

  // Determine Participant Rank
  let rank: number = 1;
  const liveEntry = liveQuiz.getLeaderboard().find(e => e.pf.toUpperCase() === cleanPf);
  if (liveEntry && liveEntry.rank) {
    rank = liveEntry.rank;
  } else if (attempt.rank) {
    rank = attempt.rank;
  } else {
    const all = db.getAllResults().filter(r => r.attempt?.status === 'submitted');
    const idx = all.findIndex(r => r.participant.id === participant.id);
    rank = idx >= 0 ? idx + 1 : 1;
  }

  res.json({
    ok: true,
    certificate: {
      certificate_no: certId,
      name: participant.name,
      pf: participant.pf_no,
      designation: participant.designation,
      department: participant.department,
      unit: participant.unit_name,
      score: attempt.score,
      max: attempt.max_score,
      rank,
      duration_seconds: attempt.duration_seconds || 0,
      submitted_at: attempt.submitted_at,
      cvo_name: settings.cvo_name,
      cvo_designation: settings.cvo_designation,
      cvo_organization: settings.cvo_organization,
      signature_photo: settings.signature_photo,
      quiz_certificate_template: settings.quiz_certificate_template || null,
      pledge_certificate_template: settings.pledge_certificate_template || null,
      seal_text: settings.seal_text,
      logo_url: settings.logo_url,
      slogan_hindi: settings.slogan_hindi || 'सत्यनिष्ठा से समृद्धि',
      slogan_english: settings.slogan_english || 'Probity for Prosperity'
    }
  });
});

// Admin Login
apiRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = String(username || '').trim();
  const pass = String(password || '');

  const admin = db.getAdminByUsername(user);
  if (!admin || admin.password_hash !== pass) {
    db.logAudit('anonymous', 'admin_login_failed', `Username: ${user}`, getClientIp(req));
    res.status(401).json({ ok: false, error: 'Invalid username or password.' });
    return;
  }

  const token = `adm_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  activeSessions[token] = {
    adminId: admin.id,
    username: admin.username,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000
  };

  db.logAudit(admin.username, 'admin_login', 'Login successful', getClientIp(req));

  res.json({
    ok: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      display_name: admin.display_name,
      must_change: admin.must_change
    }
  });
});

// Admin Me
apiRouter.get('/me', (req, res) => {
  const sess = getSession(req);
  if (!sess) {
    res.json({ ok: false, admin: null });
    return;
  }
  const admin = db.getAdminById(sess.adminId);
  res.json({
    ok: true,
    admin: admin
      ? {
          id: admin.id,
          username: admin.username,
          display_name: admin.display_name,
          must_change: admin.must_change
        }
      : null
  });
});

// Admin Logout
apiRouter.post('/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || (req.headers['x-admin-token'] as string);
  if (token && activeSessions[token]) {
    db.logAudit(activeSessions[token].username, 'admin_logout', 'Logout', getClientIp(req));
    delete activeSessions[token];
  }
  res.json({ ok: true });
});

// --- Admin Protected Endpoints ---

// Dashboard counts
apiRouter.get('/admin/dashboard', requireAdmin, (_req, res) => {
  res.json({
    ok: true,
    counts: db.getDashboardCounts()
  });
});

// Questions List (CRUD - Read)
apiRouter.get('/admin/questions', requireAdmin, (req, res) => {
  const dept = req.query.department as string;
  const questions = db.getAllQuestions(dept);
  res.json({
    ok: true,
    questions
  });
});

// Add Question (CRUD - Create)
apiRouter.post('/admin/questions', requireAdmin, (req, res) => {
  const { department, question, option_a, option_b, option_c, option_d, correct_index } = req.body || {};

  if (!question?.trim() || !option_a?.trim() || !option_b?.trim() || !option_c?.trim() || !option_d?.trim()) {
    res.status(422).json({ ok: false, error: 'Question text and all four options A, B, C, D are required.' });
    return;
  }

  const cIdx = Number(correct_index);
  if (![0, 1, 2, 3].includes(cIdx)) {
    res.status(422).json({ ok: false, error: 'Correct answer index must be 0 (A), 1 (B), 2 (C), or 3 (D).' });
    return;
  }

  const sess = getSession(req);
  const created = db.addQuestion({
    department: department?.trim() || 'All',
    question: question.trim(),
    option_a: option_a.trim(),
    option_b: option_b.trim(),
    option_c: option_c.trim(),
    option_d: option_d.trim(),
    correct_index: cIdx,
    source: 'admin'
  });

  db.logAudit(sess?.username || 'admin', 'question_add', `Added Q ID ${created.id}: ${created.question.slice(0, 50)}...`, getClientIp(req));
  res.json({ ok: true, question: created });
});

// Update Question (CRUD - Update)
apiRouter.put('/admin/questions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { department, question, option_a, option_b, option_c, option_d, correct_index } = req.body || {};

  if (!question?.trim() || !option_a?.trim() || !option_b?.trim() || !option_c?.trim() || !option_d?.trim()) {
    res.status(422).json({ ok: false, error: 'Question text and all four options A, B, C, D are required.' });
    return;
  }

  const cIdx = Number(correct_index);
  if (![0, 1, 2, 3].includes(cIdx)) {
    res.status(422).json({ ok: false, error: 'Correct answer index must be 0, 1, 2, or 3.' });
    return;
  }

  const updated = db.updateQuestion(id, {
    department: department?.trim() || 'All',
    question: question.trim(),
    option_a: option_a.trim(),
    option_b: option_b.trim(),
    option_c: option_c.trim(),
    option_d: option_d.trim(),
    correct_index: cIdx,
    source: 'admin_edit'
  });

  if (!updated) {
    res.status(404).json({ ok: false, error: 'Question not found.' });
    return;
  }

  const sess = getSession(req);
  db.logAudit(sess?.username || 'admin', 'question_update', `Updated Q ID ${id}: ${updated.question.slice(0, 50)}...`, getClientIp(req));
  res.json({ ok: true, question: updated });
});

// Delete Question (CRUD - Delete)
apiRouter.delete('/admin/questions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const success = db.deleteQuestion(id);

  if (!success) {
    res.status(404).json({ ok: false, error: 'Question not found or already deleted.' });
    return;
  }

  const sess = getSession(req);
  db.logAudit(sess?.username || 'admin', 'question_delete', `Deleted Q ID ${id}`, getClientIp(req));
  res.json({ ok: true, message: `Question ${id} deleted successfully.` });
});

// Bulk Upload Questions via CSV text or JSON rows
apiRouter.post('/admin/upload', requireAdmin, (req, res) => {
  const { csvText, mode, fallbackDepartment } = req.body || {};
  if (!csvText || typeof csvText !== 'string') {
    res.status(422).json({ ok: false, error: 'Please provide CSV content in the request.' });
    return;
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    res.status(422).json({ ok: false, error: 'CSV file must contain a header row and at least one question.' });
    return;
  }

  const parsedQuestions: Omit<QuestionItem, 'id' | 'created_at'>[] = [];
  // Parse rows (simple CSV parser supporting commas & quotes)
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 6) continue;

    // Expected columns: Department, Question, Option A, Option B, Option C, Option D, Correct
    const dept = row[0]?.trim() || fallbackDepartment || 'All';
    const qText = row[1]?.trim();
    const optA = row[2]?.trim();
    const optB = row[3]?.trim();
    const optC = row[4]?.trim();
    const optD = row[5]?.trim();
    const key = (row[6] || '').trim().toUpperCase();

    if (!qText || !optA || !optB || !optC || !optD) continue;

    let cIdx = 0;
    if (key === 'B' || key === '1' || key === optB.toUpperCase()) cIdx = 1;
    else if (key === 'C' || key === '2' || key === optC.toUpperCase()) cIdx = 2;
    else if (key === 'D' || key === '3' || key === optD.toUpperCase()) cIdx = 3;

    parsedQuestions.push({
      department: dept,
      question: qText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_index: cIdx,
      sort_order: i,
      source: 'upload'
    });
  }

  if (parsedQuestions.length === 0) {
    res.status(422).json({ ok: false, error: 'No valid questions could be parsed from the CSV.' });
    return;
  }

  const importedCount = db.replaceQuestions(parsedQuestions, mode || 'replace_all', fallbackDepartment);
  const sess = getSession(req);
  db.logAudit(sess?.username || 'admin', 'question_upload', `${importedCount} questions imported via CSV`, getClientIp(req));

  res.json({ ok: true, imported: importedCount });
});

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// Download Question Template CSV
apiRouter.get('/admin/template', requireAdmin, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="CLW-VAW-question-template.csv"');
  const sampleCsv = `Department,Question,Option A,Option B,Option C,Option D,Correct
Electrical,Under Rule 13 of Conduct Rules, gifts from commercial firms having official dealings are:,Permissible on weekends,Strictly prohibited,Allowed if under Rs 100000,Mandatory,B
Accounts,Canons of Financial Propriety require every public servant to spend public funds with:,Extravagant speed,The same prudence as their own money,No records or vouchers,Oral approvals,B
Personnel,Rotational transfer of staff in sensitive posts is implemented to:,Save on uniforms,Break corrupt nexus and ensure impartiality,Stop all promotions,Reduce work hours,B`;
  res.send(sampleCsv);
});

// Public Leaderboard with Seniority by Timing
apiRouter.get('/leaderboard', (_req, res) => {
  res.json({
    ok: true,
    leaderboard: db.getLeaderboard(50)
  });
});

// Settings, Template & Signature Photo Management (Upload & Configure)
apiRouter.get('/admin/settings', requireAdmin, (_req, res) => {
  res.json({
    ok: true,
    settings: db.getSettings()
  });
});

apiRouter.post('/admin/settings', requireAdmin, (req, res) => {
  const {
    cvo_name,
    cvo_designation,
    cvo_organization,
    signature_photo,
    quiz_certificate_template,
    pledge_certificate_template,
    seal_text,
    quiz_seconds,
    quiz_count
  } = req.body || {};

  const updated = db.updateSettings({
    ...(cvo_name !== undefined && { cvo_name: String(cvo_name).trim() }),
    ...(cvo_designation !== undefined && { cvo_designation: String(cvo_designation).trim() }),
    ...(cvo_organization !== undefined && { cvo_organization: String(cvo_organization).trim() }),
    ...(signature_photo !== undefined && { signature_photo }),
    ...(quiz_certificate_template !== undefined && { quiz_certificate_template }),
    ...(pledge_certificate_template !== undefined && { pledge_certificate_template }),
    ...(seal_text !== undefined && { seal_text: String(seal_text).trim() }),
    ...(quiz_seconds !== undefined && { quiz_seconds: Number(quiz_seconds) || 45 }),
    ...(quiz_count !== undefined && { quiz_count: Number(quiz_count) || 20 })
  });

  const sess = getSession(req);
  db.logAudit(sess?.username || 'admin', 'settings_update', `Updated Certificate Template / Settings (${updated.cvo_name})`, getClientIp(req));

  res.json({ ok: true, settings: updated });
});

// Schedule save
apiRouter.post('/admin/schedule_save', requireAdmin, (req, res) => {
  const rows = req.body?.rows || [];
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(422).json({ ok: false, error: 'No schedule rows provided.' });
    return;
  }

  db.updateSchedules(rows);
  const sess = getSession(req);
  db.logAudit(sess?.username || 'admin', 'schedule_update', `Saved ${rows.length} department schedule windows`, getClientIp(req));
  res.json({ ok: true });
});

// Results list for 100+ participants
apiRouter.get('/admin/results', requireAdmin, (_req, res) => {
  const rows = db.getAllResults().map(r => ({
    pf_no: r.participant.pf_no,
    name: r.participant.name,
    designation: r.participant.designation,
    department: r.participant.department,
    unit_name: r.participant.unit_name,
    mobile: r.participant.mobile,
    status: r.attempt?.status || 'registered',
    score: r.attempt?.score,
    max_score: r.attempt?.max_score,
    submitted_at: r.attempt?.submitted_at
  }));

  res.json({ ok: true, results: rows });
});

// Export Results CSV
apiRouter.get('/admin/export_results', requireAdmin, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="clw-vaw-results.csv"');
  const results = db.getAllResults();

  let csv = 'PF,Name,Designation,Department,Unit,Mobile,Status,Score,Max Marks,Submitted At\n';
  results.forEach(r => {
    const p = r.participant;
    const a = r.attempt;
    csv += `"${p.pf_no}","${p.name}","${p.designation}","${p.department}","${p.unit_name}","${p.mobile}","${a?.status || 'registered'}",${a?.score !== null && a?.score !== undefined ? a.score : ''},${a?.max_score || ''},"${a?.submitted_at || ''}"\n`;
  });

  res.send(csv);
});

// Audit Log & Export
apiRouter.get('/admin/audit', requireAdmin, (req, res) => {
  const q = req.query.q as string;
  const audit = db.getAuditLog(150, q);
  res.json({ ok: true, ...audit });
});

apiRouter.get('/admin/export_audit', requireAdmin, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="clw-vaw-audit.csv"');
  const audit = db.getAuditLog(1000);

  let csv = 'Time,Actor,Action,Detail,IP\n';
  audit.rows.forEach(r => {
    csv += `"${r.created_at}","${r.actor}","${r.action}","${r.detail.replace(/"/g, '""')}","${r.ip}"\n`;
  });

  res.send(csv);
});

// Admin Password Update
apiRouter.post('/admin/change_password', requireAdmin, (req, res) => {
  const sess = getSession(req);
  if (!sess) {
    res.status(401).json({ ok: false, error: 'Unauthorized.' });
    return;
  }

  const { current, next } = req.body || {};
  if (!next || String(next).length < 8) {
    res.status(422).json({ ok: false, error: 'New password must have at least 8 characters.' });
    return;
  }

  const admin = db.getAdminById(sess.adminId);
  if (!admin || admin.password_hash !== current) {
    res.status(401).json({ ok: false, error: 'Current password is incorrect.' });
    return;
  }

  db.updateAdminPassword(admin.id, String(next));
  db.logAudit(admin.username, 'password_change', 'Admin password updated', getClientIp(req));
  res.json({ ok: true, message: 'Password updated successfully.' });
});

// ==========================================
// --- ONLINE LIVE QUIZ REST API ENDPOINTS ---
// ==========================================

// Public Live Quiz state (current question sanitized, timer, leaderboard, participant counts)
apiRouter.get('/live/state', (_req, res) => {
  res.json(liveQuiz.getPublicState());
});

// Register participant into Live Quiz
apiRouter.post('/live/join', (req, res) => {
  const { name, pf, designation, mobile, department, unit } = req.body || {};
  const cleanPf = String(pf || '').trim().toUpperCase().replace(/\s+/g, '');
  const cleanName = String(name || '').trim();
  const cleanDesig = String(designation || '').trim();
  const cleanMobile = String(mobile || '').replace(/\D+/g, '');
  const cleanDept = String(department || '').trim();

  if (!cleanPf || !cleanName || !cleanDesig) {
    res.status(422).json({ ok: false, error: 'Please enter Name, Designation, and PF Number.' });
    return;
  }
  if (!cleanDept) {
    res.status(422).json({ ok: false, error: 'Please select your Department from the list.' });
    return;
  }
  if (cleanMobile.length < 10) {
    res.status(422).json({ ok: false, error: 'Please enter a valid 10-digit mobile number.' });
    return;
  }

  const participant = liveQuiz.registerParticipant({
    pf: cleanPf,
    name: cleanName,
    designation: cleanDesig,
    mobile: cleanMobile,
    department: cleanDept,
    unit: unit || 'Chittaranjan Locomotive Works'
  });

  liveQuiz.broadcast({
    type: 'participant_joined',
    participantCount: liveQuiz.getPublicState().participantCount,
    leaderboard: liveQuiz.getLeaderboard().slice(0, 10)
  });

  res.json({
    ok: true,
    participant,
    state: liveQuiz.getPublicState()
  });
});

// Submit answer for active question
apiRouter.post('/live/submit', (req, res) => {
  const { pf, selectedOption, clientTimeTaken } = req.body || {};
  const result = liveQuiz.recordAnswer(pf, Number(selectedOption), Number(clientTimeTaken));

  if (!result.ok) {
    res.status(400).json(result);
    return;
  }

  liveQuiz.broadcast({
    type: 'leaderboard_update',
    leaderboard: liveQuiz.getLeaderboard()
  });

  res.json(result);
});

// Live Leaderboard (scored on both Marks and Response Timing)
apiRouter.get('/live/leaderboard', (_req, res) => {
  res.json({
    ok: true,
    leaderboard: liveQuiz.getLeaderboard()
  });
});

// Admin Live Controls
apiRouter.post('/live/admin/start_lobby', requireAdmin, (req, res) => {
  const { timerSeconds, questionCount, department } = req.body || {};
  const state = liveQuiz.startLobby({
    timerSeconds: timerSeconds ? Number(timerSeconds) : undefined,
    questionCount: questionCount ? Number(questionCount) : undefined,
    department: department ? String(department) : undefined
  });
  res.json(state);
});

apiRouter.post('/live/admin/set_timer', requireAdmin, (req, res) => {
  const { timerSeconds } = req.body || {};
  if (!timerSeconds) {
    res.status(422).json({ ok: false, error: 'Please provide timerSeconds' });
    return;
  }
  const updated = liveQuiz.setTimer(Number(timerSeconds));
  res.json({ ok: true, timerSeconds: updated });
});

apiRouter.post('/live/admin/set_question_count', requireAdmin, (req, res) => {
  const { questionCount } = req.body || {};
  if (!questionCount) {
    res.status(422).json({ ok: false, error: 'Please provide questionCount' });
    return;
  }
  const updated = liveQuiz.setQuestionCount(Number(questionCount));
  res.json({ ok: true, questionCount: updated });
});

apiRouter.post('/live/admin/start_question', requireAdmin, (req, res) => {
  const { questionIndex } = req.body || {};
  const state = liveQuiz.startQuestion(questionIndex !== undefined ? Number(questionIndex) : undefined);
  res.json(state);
});

apiRouter.post('/live/admin/reveal_answer', requireAdmin, (_req, res) => {
  const state = liveQuiz.revealAnswer();
  res.json(state);
});

apiRouter.post('/live/admin/next_question', requireAdmin, (_req, res) => {
  const state = liveQuiz.nextQuestion();
  res.json(state);
});

apiRouter.post('/live/admin/end_quiz', requireAdmin, (_req, res) => {
  const state = liveQuiz.endQuiz();
  res.json(state);
});

apiRouter.post('/live/admin/reset', requireAdmin, (_req, res) => {
  const state = liveQuiz.resetSession();
  res.json(state);
});

apiRouter.post('/live/admin/toggle_auto_advance', requireAdmin, (req, res) => {
  const { enabled } = req.body || {};
  const current = liveQuiz.setAutoAdvance(Boolean(enabled));
  res.json({ ok: true, autoAdvance: current });
});

apiRouter.get('/live/admin/state', requireAdmin, (_req, res) => {
  res.json(liveQuiz.getAdminState());
});
