import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { db, type QuestionItem, DEPARTMENTS } from './db.ts';

export interface LiveAnswerRecord {
  selected: number; // 0, 1, 2, 3 or -1
  timeTaken: number; // in seconds, e.g. 3.45
  isCorrect: boolean;
  points: number;
}

export interface LiveParticipant {
  id: string; // unique ID or PF
  pf: string;
  name: string;
  designation: string;
  department: string;
  unit: string;
  mobile: string;
  joinedAt: number;
  marks: number; // Marks obtained (questions answered correctly)
  score: number; // Total points (Base + Speed Bonus)
  correctCount: number;
  totalTimeTaken: number; // Total seconds
  connected: boolean;
  answers: Record<number, LiveAnswerRecord>;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  pf: string;
  name: string;
  designation: string;
  department: string;
  unit?: string;
  marks: number; // Marks obtained
  score: number;
  correctCount: number;
  totalTimeTaken: number; // seconds
  isSeniorByTime?: boolean; // Seniority awarded by faster completion on same marks
  lastPointsAwarded?: number;
  lastTimeTaken?: number;
}

export interface WaitingParticipant {
  pf: string;
  name: string;
  designation: string;
  department: string;
  unit: string;
  mobile: string;
  requestedAt: number;
}

export type LiveQuizStatus = 'idle' | 'lobby' | 'question' | 'time_lapsed' | 'review' | 'ended';

class LiveQuizManager {
  private status: LiveQuizStatus = 'idle';
  private sessionCode: string = 'CLW 2026';
  private activeSessionId: string = 'LIVE-DEFAULT';
  private activeSessionTitle: string = 'Live Vigilance Awareness Quiz';
  private timerSeconds: number = 30; // Configurable by Admin per question (e.g. 15, 20, 30, 45, 60)
  private questionCount: number = 10;
  private questions: QuestionItem[] = [];
  private currentIndex: number = 0;
  private questionStartTime: number = 0;
  private questionEndTime: number = 0;
  private participants: Map<string, LiveParticipant> = new Map();
  private waitingParticipants: Map<string, WaitingParticipant> = new Map();
  private admittedPfSet: Set<string> = new Set();
  private autoAdmit: boolean = false; // Admin controls whether participants are admitted automatically
  private wsClients: Set<WebSocket> = new Set();
  private autoReviewTimeout: NodeJS.Timeout | null = null;
  private autoNextTimeout: NodeJS.Timeout | null = null;
  private autoAdvance: boolean = true; // Automatically reveal answer on time expiry and advance after 5 seconds
  private reviewStartTime: number = 0;

  public initWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws) => {
      this.wsClients.add(ws);

      // Send initial state on connection
      ws.send(JSON.stringify({
        type: 'sync_state',
        state: this.getPublicState()
      }));

      ws.on('message', (messageRaw) => {
        try {
          const data = JSON.parse(messageRaw.toString());
          this.handleClientMessage(ws, data);
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.wsClients.delete(ws);
      });
    });

    console.log('Live Quiz WebSocket server initialized on /ws');
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'join': {
        const joinResult = this.requestJoinLive(data.payload);
        if (joinResult.status === 'admitted') {
          ws.send(JSON.stringify({
            type: 'join_success',
            participant: joinResult.participant,
            state: this.getPublicState()
          }));
          this.broadcast({
            type: 'participant_joined',
            participantCount: this.participants.size,
            leaderboard: this.getLeaderboard().slice(0, 10)
          });
        } else {
          ws.send(JSON.stringify({
            type: 'waiting_room',
            message: 'Waiting for administrator to admit you into the live quiz.',
            waitingParticipant: joinResult.participant
          }));
        }
        break;
      }

      case 'submit_answer': {
        const result = this.recordAnswer(
          data.payload?.pf,
          data.payload?.selectedOption,
          data.payload?.clientTimeTaken
        );
        if (result.ok) {
          ws.send(JSON.stringify({
            type: 'answer_acknowledged',
            result
          }));
          // Broadcast live scoreboard update during quiz
          this.broadcast({
            type: 'leaderboard_update',
            leaderboard: this.getLeaderboard()
          });
        }
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      }
    }
  }

  public broadcast(payload: any) {
    const serialized = JSON.stringify(payload);
    for (const ws of this.wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(serialized);
        } catch (e) {
          console.error('Failed to send ws broadcast:', e);
        }
      }
    }
  }

  // --- Waiting Room & Admission ---
  public requestJoinLive(data: {
    pf: string;
    password?: string;
    name?: string;
    designation?: string;
    department?: string;
    unit?: string;
    mobile?: string;
  }): { ok: boolean; status: 'admitted' | 'waiting'; participant?: any; error?: string } {
    const cleanPf = String(data.pf || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanPf) return { ok: false, status: 'waiting', error: 'Please enter a valid PF number.' };

    const cleanMobile = String(data.mobile || '').replace(/\D+/g, '');
    if (cleanMobile && cleanMobile.length !== 10) {
      return { ok: false, status: 'waiting', error: 'Mobile number must not be more than 10 digits (exactly 10 digits required).' };
    }

    // Check DB registration
    let dbP = db.getParticipantByPf(cleanPf);
    if (!dbP) {
      if (!data.name || !data.designation || !data.department) {
        return { ok: false, status: 'waiting', error: 'Participant not registered. Please enter Name, Designation, and Department.' };
      }
      dbP = db.registerParticipant({
        pf_no: cleanPf,
        name: data.name,
        designation: data.designation,
        department: data.department,
        unit_name: data.unit || 'Chittaranjan Locomotive Works',
        mobile: cleanMobile || '9999999999',
        password: data.password || '123'
      });
    } else if (data.name && data.name.trim().toLowerCase() !== dbP.name.trim().toLowerCase()) {
      // Prevent duplicate PF hijacking by a different employee
      return {
        ok: false,
        status: 'waiting',
        error: `PF Number is unique and already assigned to another participant (${dbP.name}). Duplicate PF numbers are strictly not allowed.`
      };
    }

    // Verify password if supplied or default 123
    if (data.password && data.password.trim()) {
      const v = db.verifyParticipantLogin(cleanPf, data.password);
      if (!v.ok) {
        return { ok: false, status: 'waiting', error: v.error };
      }
    }

    // Check if auto-admit is ON or participant already admitted
    if (this.autoAdmit || this.admittedPfSet.has(cleanPf)) {
      this.admittedPfSet.add(cleanPf);
      this.waitingParticipants.delete(cleanPf);
      const lp = this.registerParticipant({
        pf: dbP.pf_no,
        name: dbP.name,
        designation: dbP.designation,
        department: dbP.department,
        unit: dbP.unit_name,
        mobile: dbP.mobile
      });
      return { ok: true, status: 'admitted', participant: lp };
    }

    // Otherwise place into Waiting Room!
    const waiting: WaitingParticipant = {
      pf: dbP.pf_no,
      name: dbP.name,
      designation: dbP.designation,
      department: dbP.department,
      unit: dbP.unit_name,
      mobile: dbP.mobile,
      requestedAt: Date.now()
    };
    this.waitingParticipants.set(cleanPf, waiting);

    this.broadcast({
      type: 'waiting_room_updated',
      waitingCount: this.waitingParticipants.size,
      waitingList: Array.from(this.waitingParticipants.values())
    });

    return {
      ok: true,
      status: 'waiting',
      participant: waiting
    };
  }

  public admitParticipant(pf: string): boolean {
    const cleanPf = String(pf || '').trim().toUpperCase().replace(/\s+/g, '');
    const waiting = this.waitingParticipants.get(cleanPf);
    this.admittedPfSet.add(cleanPf);
    this.waitingParticipants.delete(cleanPf);

    let participantObj: LiveParticipant | null = null;
    if (waiting) {
      participantObj = this.registerParticipant({
        pf: waiting.pf,
        name: waiting.name,
        designation: waiting.designation,
        department: waiting.department,
        unit: waiting.unit,
        mobile: waiting.mobile
      });
    } else {
      const dbP = db.getParticipantByPf(cleanPf);
      if (dbP) {
        participantObj = this.registerParticipant({
          pf: dbP.pf_no,
          name: dbP.name,
          designation: dbP.designation,
          department: dbP.department,
          unit: dbP.unit_name,
          mobile: dbP.mobile
        });
      }
    }

    this.broadcast({
      type: 'participant_admitted',
      pf: cleanPf,
      participant: participantObj,
      state: this.getPublicState()
    });

    return true;
  }

  public admitAllWaiting(): number {
    const list = Array.from(this.waitingParticipants.values());
    list.forEach(w => {
      this.admittedPfSet.add(w.pf);
      this.registerParticipant({
        pf: w.pf,
        name: w.name,
        designation: w.designation,
        department: w.department,
        unit: w.unit,
        mobile: w.mobile
      });
    });
    this.waitingParticipants.clear();

    this.broadcast({
      type: 'all_admitted',
      count: list.length,
      state: this.getPublicState()
    });

    return list.length;
  }

  public setAutoAdmit(enabled: boolean): boolean {
    this.autoAdmit = Boolean(enabled);
    if (this.autoAdmit && this.waitingParticipants.size > 0) {
      this.admitAllWaiting();
    }
    this.broadcast({
      type: 'auto_admit_updated',
      autoAdmit: this.autoAdmit
    });
    return this.autoAdmit;
  }

  // --- Participant Operations ---
  public registerParticipant(data: {
    pf: string;
    name: string;
    designation: string;
    mobile: string;
    department: string;
    unit?: string;
  }): LiveParticipant {
    const cleanPf = String(data.pf || '').trim().toUpperCase().replace(/\s+/g, '');
    const cleanName = String(data.name || '').trim();
    const cleanDesig = String(data.designation || '').trim();
    const cleanMobile = String(data.mobile || '').replace(/\D+/g, '');
    const cleanDept = String(data.department || '').trim();
    const cleanUnit = String(data.unit || 'Chittaranjan Locomotive Works').trim();

    let p = this.participants.get(cleanPf);
    if (!p) {
      p = {
        id: cleanPf,
        pf: cleanPf,
        name: cleanName,
        designation: cleanDesig,
        department: cleanDept,
        unit: cleanUnit,
        mobile: cleanMobile,
        joinedAt: Date.now(),
        marks: 0,
        score: 0,
        correctCount: 0,
        totalTimeTaken: 0,
        connected: true,
        answers: {}
      };
      this.participants.set(cleanPf, p);
    } else {
      // Re-connecting participant - update details
      p.name = cleanName || p.name;
      p.designation = cleanDesig || p.designation;
      p.department = cleanDept || p.department;
      p.connected = true;
    }

    return p;
  }

  public recordAnswer(
    pf: string,
    selectedOption: number,
    clientTimeTaken?: number
  ): { ok: boolean; error?: string; points?: number; isCorrect?: boolean; timeTaken?: number } {
    if (this.status !== 'question') {
      return { ok: false, error: 'Question is not currently active for answers.' };
    }

    const cleanPf = String(pf || '').trim().toUpperCase().replace(/\s+/g, '');
    const participant = this.participants.get(cleanPf);
    if (!participant) {
      return { ok: false, error: 'Participant not found. Please register first.' };
    }

    const currentQ = this.questions[this.currentIndex];
    if (!currentQ) {
      return { ok: false, error: 'No active question.' };
    }

    const now = Date.now();
    const serverTimeTakenSeconds = Math.max(0.1, (now - this.questionStartTime) / 1000);

    // Enforce time limit: Participant can submit or change option only within the question timer
    if (serverTimeTakenSeconds > this.timerSeconds + 1.5) {
      return { ok: false, error: 'Time limit has expired for this question.' };
    }

    const timeTaken = clientTimeTaken !== undefined && clientTimeTaken > 0 && clientTimeTaken <= this.timerSeconds + 2
      ? Number(clientTimeTaken.toFixed(2))
      : Number(Math.min(this.timerSeconds, serverTimeTakenSeconds).toFixed(2));

    const isCorrect = selectedOption === currentQ.correct_index;

    // Within time limit participant can change the option!
    // If option changed, revert previous answer's points, marks, and timeTaken.
    const previousAnswer = participant.answers[this.currentIndex];
    if (previousAnswer) {
      participant.score -= previousAnswer.points;
      if (previousAnswer.isCorrect) {
        participant.marks = Math.max(0, participant.marks - 1);
        participant.correctCount = Math.max(0, participant.correctCount - 1);
      }
      participant.totalTimeTaken = Math.max(0, Number((participant.totalTimeTaken - previousAnswer.timeTaken).toFixed(2)));
    }

    // SCORING RULES SPECIFIED BY USER:
    // 1. Correct Answer: Base 100 points
    // 2. Speed Bonus: 30 for answer within 1 second, 29 if answered in 2 seconds (30 minus time taken)
    //    Formula: Math.max(0, 31 - Math.max(1, Math.ceil(timeTaken)))
    //    E.g.: <= 1s -> 30 bonus -> 130 total
    //    E.g.: 2s -> 29 bonus -> 129 total
    //    E.g.: 30s -> 1 bonus -> 101 total
    //    E.g.: > 30s -> 0 bonus -> 100 total
    // 3. Negative Answer: MINUS 30 points (-30)
    // 4. If option changed within time limit, last option selected and that time is considered for points.
    let points = 0;
    if (isCorrect) {
      const elapsedSeconds = Math.max(1, Math.ceil(timeTaken));
      const speedBonus = Math.max(0, 31 - elapsedSeconds);
      points = 100 + speedBonus;
      participant.marks += 1;
      participant.correctCount += 1;
    } else {
      // Negative answer: -30 points for each wrong attempt
      points = -30;
    }

    participant.score += points;
    participant.totalTimeTaken = Number((participant.totalTimeTaken + timeTaken).toFixed(2));
    participant.answers[this.currentIndex] = {
      selected: selectedOption,
      timeTaken,
      isCorrect,
      points
    };

    return {
      ok: true,
      points,
      isCorrect,
      timeTaken
    };
  }

  // --- Admin Live Controls ---
  public startLobby(options?: { sessionId?: string; title?: string; timerSeconds?: number; questionCount?: number; department?: string }) {
    if (this.autoReviewTimeout) {
      clearTimeout(this.autoReviewTimeout);
      this.autoReviewTimeout = null;
    }

    if (options?.sessionId) {
      this.activeSessionId = options.sessionId;
    } else {
      this.activeSessionId = `LIVE-${Date.now().toString().slice(-6)}`;
    }
    if (options?.title) {
      this.activeSessionTitle = options.title;
    }

    if (options?.timerSeconds) {
      this.timerSeconds = Math.max(10, Math.min(180, Number(options.timerSeconds)));
    }
    if (options?.questionCount) {
      this.questionCount = Math.max(3, Math.min(50, Number(options.questionCount)));
    }

    // Select questions from DB
    const all = db.getAllQuestions(options?.department || 'All');
    // Shuffle and pick questionCount
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    this.questions = shuffled.slice(0, this.questionCount);
    if (this.questions.length === 0) {
      this.questions = all.slice(0, 10);
    }

    this.status = 'lobby';
    this.currentIndex = 0;
    this.questionStartTime = 0;
    this.questionEndTime = 0;

    // Reset scores for all registered participants or fresh start
    for (const p of this.participants.values()) {
      p.marks = 0;
      p.score = 0;
      p.correctCount = 0;
      p.totalTimeTaken = 0;
      p.answers = {};
    }

    this.broadcast({
      type: 'lobby_started',
      state: this.getPublicState()
    });

    return this.getPublicState();
  }

  public setTimer(seconds: number) {
    this.timerSeconds = Math.max(10, Math.min(180, Number(seconds)));
    this.broadcast({
      type: 'timer_updated',
      timerSeconds: this.timerSeconds
    });
    return this.timerSeconds;
  }

  public startQuestion(targetIndex?: number) {
    if (this.autoReviewTimeout) {
      clearTimeout(this.autoReviewTimeout);
      this.autoReviewTimeout = null;
    }

    if (this.questions.length === 0) {
      this.questions = db.getAllQuestions('All').slice(0, this.questionCount || 10);
    }

    if (targetIndex !== undefined) {
      this.currentIndex = targetIndex;
    }

    if (this.currentIndex >= this.questions.length) {
      return this.endQuiz();
    }

    this.status = 'question';
    this.questionStartTime = Date.now();
    this.questionEndTime = this.questionStartTime + (this.timerSeconds * 1000);

    // When question timer elapses:
    // Automatically show the right answer and scores, wait 5 seconds and advance to next question
    this.autoReviewTimeout = setTimeout(() => {
      if (this.status === 'question' || this.status === 'time_lapsed') {
        this.revealAnswer();

        if (this.autoAdvance) {
          this.triggerAutoNextCountdown(5);
        }
      }
    }, this.timerSeconds * 1000);

    const q = this.questions[this.currentIndex];

    this.broadcast({
      type: 'question_started',
      index: this.currentIndex,
      total: this.questions.length,
      timerSeconds: this.timerSeconds,
      startTime: this.questionStartTime,
      endTime: this.questionEndTime,
      question: {
        id: q.id,
        index: this.currentIndex,
        total: this.questions.length,
        question: q.question,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        department: q.department
      },
      leaderboard: this.getLeaderboard().slice(0, 10)
    });

    return this.getPublicState();
  }

  public setQuestionCount(count: number) {
    this.questionCount = Math.max(3, Math.min(100, Number(count) || 10));
    if (this.status === 'idle' || this.status === 'lobby') {
      const all = db.getAllQuestions('All');
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      this.questions = shuffled.slice(0, this.questionCount);
    }
    this.broadcast({
      type: 'question_count_updated',
      questionCount: this.questionCount,
      state: this.getPublicState()
    });
    return this.questionCount;
  }

  public revealAnswer() {
    if (this.autoReviewTimeout) {
      clearTimeout(this.autoReviewTimeout);
      this.autoReviewTimeout = null;
    }

    this.status = 'review';
    this.reviewStartTime = Date.now();
    const currentQ = this.questions[this.currentIndex];
    if (!currentQ) return this.getPublicState();

    // Calculate response counts for A, B, C, D
    const counts: [number, number, number, number] = [0, 0, 0, 0];
    for (const p of this.participants.values()) {
      const ans = p.answers[this.currentIndex];
      if (ans && ans.selected >= 0 && ans.selected <= 3) {
        counts[ans.selected]++;
      }
    }

    this.broadcast({
      type: 'answer_revealed',
      index: this.currentIndex,
      correctIndex: currentQ.correct_index,
      optionCounts: counts,
      leaderboard: this.getLeaderboard(),
      autoAdvance: this.autoAdvance,
      reviewStartTime: this.reviewStartTime
    });

    // When answer is revealed, if autoAdvance is enabled, start 5s countdown
    if (this.autoAdvance) {
      this.triggerAutoNextCountdown(5);
    }

    return this.getPublicState();
  }

  public triggerAutoNextCountdown(seconds: number = 5) {
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }

    this.broadcast({
      type: 'auto_countdown',
      seconds,
      message: `Answer revealed! Question ${this.currentIndex + 2} starts in ${seconds}s (or Admin can click Next Question)...`
    });

    this.autoNextTimeout = setTimeout(() => {
      if (this.status === 'review') {
        this.nextQuestion();
      }
    }, seconds * 1000);
  }

  public setAutoAdvance(enabled: boolean) {
    this.autoAdvance = Boolean(enabled);
    if (!this.autoAdvance && this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }
    this.broadcast({
      type: 'auto_advance_updated',
      autoAdvance: this.autoAdvance
    });
    return this.autoAdvance;
  }

  public nextQuestion() {
    if (this.autoReviewTimeout) {
      clearTimeout(this.autoReviewTimeout);
      this.autoReviewTimeout = null;
    }
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }

    this.currentIndex += 1;
    if (this.currentIndex >= this.questions.length) {
      return this.endQuiz();
    }
    return this.startQuestion(this.currentIndex);
  }

  public endQuiz() {
    if (this.autoReviewTimeout) {
      clearTimeout(this.autoReviewTimeout);
      this.autoReviewTimeout = null;
    }
    if (this.autoNextTimeout) {
      clearTimeout(this.autoNextTimeout);
      this.autoNextTimeout = null;
    }

    this.status = 'ended';

    // Store participant results into main attempts database so certificates can be issued
    const finalLeaderboard = this.getLeaderboard();
    for (const p of finalLeaderboard) {
      try {
        let dbParticipant = db.getParticipantByPf(p.pf);
        if (!dbParticipant) {
          dbParticipant = db.createParticipant({
            pf: p.pf,
            name: p.name,
            designation: p.designation,
            department: p.department,
            unit: 'Chittaranjan Locomotive Works',
            mobile: '9999999999'
          });
        }
        if (dbParticipant) {
          const attempt = db.startAttempt(dbParticipant.id, this.questions.map(q => q.id));
          if (attempt) {
            // Populate answers
            const participantObj = this.participants.get(p.pf);
            if (participantObj) {
              for (let i = 0; i < this.questions.length; i++) {
                const ans = participantObj.answers[i];
                if (ans) {
                  db.saveAnswer(attempt.id, this.questions[i].id, String(ans.selected));
                }
              }
            }
            db.finalizeAttempt(attempt.id);
            // Persist exact live score, rank, and duration on attempt
            attempt.score = p.score;
            attempt.rank = p.rank;
            attempt.duration_seconds = Math.round(p.totalTimeTaken);
          }
        }
      } catch (e) {
        console.error('Error saving live quiz attempt to DB for participant', p.pf, e);
      }
    }

    // Save live session history into db
    const answersRecord: Record<string, any> = {};
    for (const [pf, p] of this.participants.entries()) {
      answersRecord[pf] = {
        name: p.name,
        designation: p.designation,
        department: p.department,
        unit: p.unit,
        marks: p.marks,
        score: p.score,
        correctCount: p.correctCount,
        totalTimeTaken: p.totalTimeTaken,
        answers: p.answers
      };
    }

    try {
      db.saveLiveSessionResult(this.activeSessionId, {
        title: this.activeSessionTitle || `Live Quiz Session ${this.activeSessionId}`,
        timer_seconds: this.timerSeconds,
        question_count: this.questionCount,
        participants_count: this.participants.size,
        history: {
          ended_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          questions: this.questions.map((q, idx) => ({
            id: q.id,
            index: idx,
            question: q.question,
            department: q.department,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correct_index: q.correct_index
          })),
          leaderboard: finalLeaderboard,
          participant_answers: answersRecord,
          certificates: finalLeaderboard.map((lb) => ({
            certificate_no: `CLW/VAW2026/LIVE/${this.activeSessionId}/${lb.pf}`,
            name: lb.name,
            pf_no: lb.pf,
            designation: lb.designation,
            department: lb.department,
            unit: lb.unit,
            score: lb.score,
            max_score: this.questions.length * 100,
            rank: lb.rank,
            date: new Date().toISOString().slice(0, 10),
            session_id: this.activeSessionId,
            session_title: this.activeSessionTitle
          }))
        }
      });
    } catch (e) {
      console.error('Error saving live session to DB:', e);
    }

    this.broadcast({
      type: 'quiz_ended',
      leaderboard: finalLeaderboard,
      podium: finalLeaderboard.slice(0, 3)
    });

    return this.getPublicState();
  }

  public resetSession() {
    if (this.autoReviewTimeout) {
      clearTimeout(this.autoReviewTimeout);
      this.autoReviewTimeout = null;
    }
    this.status = 'idle';
    this.currentIndex = 0;
    this.questions = [];
    this.participants.clear();
    this.waitingParticipants.clear();
    this.admittedPfSet.clear();

    this.broadcast({
      type: 'session_reset',
      state: this.getPublicState()
    });

    return this.getPublicState();
  }

  // --- State Serializers ---
  public getLeaderboard(): LeaderboardEntry[] {
    const list = Array.from(this.participants.values());

    // Sort by:
    // 1. Total score DESC (100 base + speed bonus up to 30, minus 30 for negative answer)
    // 2. Marks obtained DESC (correct count)
    // 3. Tie-breaker: Seniority decided by timing to solve question (less time taken = senior / higher rank)
    // 4. Earlier joinedAt ASC
    list.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.marks !== a.marks) {
        return b.marks - a.marks;
      }
      if (a.totalTimeTaken !== b.totalTimeTaken) {
        return a.totalTimeTaken - b.totalTimeTaken;
      }
      return a.joinedAt - b.joinedAt;
    });

    return list.map((p, idx) => {
      const prev = list[idx - 1];
      const next = list[idx + 1];
      const isSeniorByTime = (next && next.marks === p.marks && p.totalTimeTaken < next.totalTimeTaken) ||
                             (prev && prev.marks === p.marks && p.totalTimeTaken > prev.totalTimeTaken);
      const lastAnswer = p.answers[this.currentIndex];
      return {
        rank: idx + 1,
        id: p.id,
        pf: p.pf,
        name: p.name,
        designation: p.designation,
        department: p.department,
        unit: p.unit || 'Chittaranjan Locomotive Works',
        marks: p.marks,
        score: p.score,
        correctCount: p.correctCount,
        totalTimeTaken: p.totalTimeTaken,
        isSeniorByTime: !!isSeniorByTime,
        lastPointsAwarded: lastAnswer?.points,
        lastTimeTaken: lastAnswer?.timeTaken
      };
    });
  }

  public getPublicState() {
    const currentQ = this.questions[this.currentIndex];
    const settings = db.getSettings();

    // Hide correct answer during 'question' state
    const sanitizedQuestion = currentQ ? {
      id: currentQ.id,
      index: this.currentIndex,
      total: this.questions.length,
      question: currentQ.question,
      options: [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d],
      department: currentQ.department,
      timerSeconds: this.timerSeconds,
      startTime: this.questionStartTime,
      endTime: this.questionEndTime
    } : null;

    // Review counts & correct answer if status is review or ended
    let reviewData = null;
    if ((this.status === 'review' || this.status === 'ended') && currentQ) {
      const counts: [number, number, number, number] = [0, 0, 0, 0];
      for (const p of this.participants.values()) {
        const ans = p.answers[this.currentIndex];
        if (ans && ans.selected >= 0 && ans.selected <= 3) {
          counts[ans.selected]++;
        }
      }
      reviewData = {
        index: this.currentIndex,
        correctIndex: currentQ.correct_index,
        optionCounts: counts
      };
    }

    return {
      ok: true,
      status: this.status,
      sessionCode: this.sessionCode,
      activeSessionId: this.activeSessionId,
      activeSessionTitle: this.activeSessionTitle,
      timerSeconds: this.timerSeconds,
      questionCount: this.questions.length || this.questionCount,
      currentIndex: this.currentIndex,
      questionStartTime: this.questionStartTime,
      questionEndTime: this.questionEndTime,
      participantCount: this.participants.size,
      waitingCount: this.waitingParticipants.size,
      autoAdmit: this.autoAdmit,
      activeQuestion: sanitizedQuestion,
      reviewData,
      leaderboard: this.getLeaderboard(),
      autoAdvance: this.autoAdvance,
      reviewStartTime: this.reviewStartTime,
      sloganHindi: settings.slogan_hindi || 'सत्यनिष्ठा से समृद्धि',
      sloganEnglish: settings.slogan_english || 'Probity for Prosperity',
      organizationName: settings.organization_name || 'Chittaranjan Locomotive Works (CLW)',
      programmeName: settings.programme_name || 'Vigilance Awareness Week 2026 Quiz Competition',
      programmePeriod: settings.programme_period || '2026'
    };
  }

  public getAdminState() {
    const pub = this.getPublicState();
    const currentQ = this.questions[this.currentIndex];
    return {
      ...pub,
      correctIndex: currentQ ? currentQ.correct_index : null,
      participantsList: Array.from(this.participants.values()),
      waitingParticipants: Array.from(this.waitingParticipants.values()),
      admittedPfList: Array.from(this.admittedPfSet),
      autoAdmit: this.autoAdmit
    };
  }
}

export const liveQuiz = new LiveQuizManager();
