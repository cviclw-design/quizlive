import React, { useState, useEffect, useRef } from 'react';
import { api, AdminQuestionItem, AdminSettingsData } from '../services/api';
import { soundEffects } from '../utils/audio';
import { ShareModal } from './ShareModal';
import { DriveModal } from './DriveModal';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Lock,
  Image as ImageIcon,
  Search,
  X,
  RefreshCw,
  LogOut,
  Sliders,
  Check,
  Building,
  Share2,
  HardDrive,
  Zap,
  Clock,
  Play,
  FastForward,
  Trophy,
  Flame,
  Eye,
  ExternalLink
} from 'lucide-react';

interface AdminPanelProps {
  onClose?: () => void;
  onSettingsUpdated?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onSettingsUpdated }) => {
  const [admin, setAdmin] = useState<{ id: number; username: string; display_name: string; must_change: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live' | 'questions' | 'signature' | 'schedule' | 'results' | 'audit' | 'password'>('dashboard');
  const [shareOpen, setShareOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);

  // Live Quiz Control Room State
  const [liveAdminState, setLiveAdminState] = useState<any>(null);
  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(30);
  const [liveQuestionCount, setLiveQuestionCount] = useState<number>(10);
  const [liveDept, setLiveDept] = useState<string>('All');
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [liveActionMsg, setLiveActionMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Login form state
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('ClwVaw@2026');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Dashboard state
  const [dashboardCounts, setDashboardCounts] = useState<{
    questions: number;
    participants: number;
    submitted: number;
    audit: number;
    sample_questions: number;
  } | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<AdminQuestionItem[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [questionSearch, setQuestionSearch] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestionItem | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvMode, setCsvMode] = useState<'replace_all' | 'replace_department'>('replace_department');
  const [csvFallbackDept, setCsvFallbackDept] = useState('All');
  const [questionFormError, setQuestionFormError] = useState('');
  const [questionFormSuccess, setQuestionFormSuccess] = useState('');

  // Question form fields
  const [formDept, setFormDept] = useState('All');
  const [formQText, setFormQText] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');
  const [formOptC, setFormOptC] = useState('');
  const [formOptD, setFormOptD] = useState('');
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);

  // Signature & Settings state
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedule state
  const [schedules, setSchedules] = useState<{ id: number; department: string; starts_at: string; ends_at: string }[]>([]);
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  // Results state
  const [results, setResults] = useState<{
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
  }[]>([]);
  const [resultSearch, setResultSearch] = useState('');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<{ id: number; created_at: string; actor: string; action: string; detail: string; ip: string }[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Password change state
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // Initial check
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const res = await api.getAdminMe();
      if (res.ok && res.admin) {
        setAdmin(res.admin);
        loadDashboardData();
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      soundEffects.playClick();
      const res = await api.loginAdmin(loginUser, loginPass);
      if (res.ok) {
        setAdmin(res.admin);
        soundEffects.playCorrect();
        loadDashboardData();
      }
    } catch (err: unknown) {
      setLoginError((err as Error).message || 'Invalid username or password');
      soundEffects.playIncorrect();
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    soundEffects.playClick();
    await api.logoutAdmin();
    setAdmin(null);
    setActiveTab('dashboard');
  };

  const loadDashboardData = async () => {
    try {
      const dash = await api.getDashboard();
      if (dash.ok) {
        setDashboardCounts(dash.counts);
      }
      const st = await api.getAdminSettings();
      if (st.ok) {
        setSettings(st.settings);
      }
    } catch (err) {
      console.error('Failed loading dashboard data', err);
    }
  };

  // Switch tabs and load relevant data
  const handleTabChange = (tab: typeof activeTab) => {
    soundEffects.playClick();
    setActiveTab(tab);
    setQuestionFormError('');
    setQuestionFormSuccess('');
    setSettingsSuccess('');
    setSettingsError('');

    if (tab === 'dashboard') {
      loadDashboardData();
    } else if (tab === 'live') {
      loadLiveAdminState();
    } else if (tab === 'questions') {
      loadQuestions(selectedDeptFilter);
    } else if (tab === 'signature') {
      loadSettings();
    } else if (tab === 'schedule') {
      loadSchedule();
    } else if (tab === 'results') {
      loadResults();
    } else if (tab === 'audit') {
      loadAudit();
    }
  };

  // --- Live Quiz Operations ---
  const loadLiveAdminState = async () => {
    try {
      const res = await api.adminGetLiveState();
      if (res && res.ok) {
        setLiveAdminState(res);
        if (res.timerSeconds) setLiveTimerSeconds(res.timerSeconds);
      }
    } catch (err) {
      console.error('Failed loading live admin state', err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTab === 'live') {
      loadLiveAdminState();
      interval = setInterval(loadLiveAdminState, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  const handleStartLobby = async () => {
    setLiveLoading(true);
    setLiveActionMsg(null);
    try {
      soundEffects.playClick();
      const res = await api.adminStartLiveLobby({
        timerSeconds: liveTimerSeconds,
        questionCount: liveQuestionCount,
        department: liveDept
      });
      setLiveAdminState(res);
      setLiveActionMsg({ text: 'Live Lobby opened! Participants can now register & join.', isError: false });
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to start lobby', isError: true });
    } finally {
      setLiveLoading(false);
    }
  };

  const handleSetLiveTimer = async (seconds: number) => {
    setLiveTimerSeconds(seconds);
    try {
      soundEffects.playClick();
      await api.adminSetLiveTimer(seconds);
      loadLiveAdminState();
    } catch (err) {
      console.error('Failed setting timer', err);
    }
  };

  const handleStartQuestion = async (idx?: number) => {
    setLiveLoading(true);
    setLiveActionMsg(null);
    try {
      soundEffects.playClick();
      const res = await api.adminStartLiveQuestion(idx);
      setLiveAdminState(res);
      setLiveActionMsg({ text: `Question ${res.currentIndex + 1} launched with ${res.timerSeconds}s countdown!`, isError: false });
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to launch question', isError: true });
    } finally {
      setLiveLoading(false);
    }
  };

  const handleRevealAnswer = async () => {
    setLiveLoading(true);
    try {
      soundEffects.playClick();
      const res = await api.adminRevealLiveAnswer();
      setLiveAdminState(res);
      setLiveActionMsg({ text: 'Answer revealed to all participants!', isError: false });
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to reveal answer', isError: true });
    } finally {
      setLiveLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    setLiveLoading(true);
    try {
      soundEffects.playClick();
      const res = await api.adminNextLiveQuestion();
      setLiveAdminState(res);
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to advance to next question', isError: true });
    } finally {
      setLiveLoading(false);
    }
  };

  const handleEndQuiz = async () => {
    if (!window.confirm('Are you sure you want to end the Live Quiz and publish final standings?')) return;
    setLiveLoading(true);
    try {
      soundEffects.playFanfare();
      const res = await api.adminEndLiveQuiz();
      setLiveAdminState(res);
      setLiveActionMsg({ text: 'Quiz ended! Final leaderboard published and certificates ready.', isError: false });
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to end quiz', isError: true });
    } finally {
      setLiveLoading(false);
    }
  };

  const handleResetLive = async () => {
    if (!window.confirm('Reset Live Quiz session? All active scores and lobby participants will be cleared.')) return;
    try {
      soundEffects.playClick();
      const res = await api.adminResetLiveQuiz();
      setLiveAdminState(res);
      setLiveActionMsg({ text: 'Live session reset to Idle.', isError: false });
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to reset session', isError: true });
    }
  };

  // --- Questions CRUD Operations ---
  const loadQuestions = async (dept?: string) => {
    try {
      const res = await api.getAdminQuestions(dept);
      if (res.ok) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed loading questions', err);
    }
  };

  const handleOpenAddQuestion = () => {
    soundEffects.playClick();
    setEditingQuestion(null);
    setFormDept('All');
    setFormQText('');
    setFormOptA('');
    setFormOptB('');
    setFormOptC('');
    setFormOptD('');
    setFormCorrectIndex(0);
    setQuestionFormError('');
    setQuestionFormSuccess('');
    setIsAddingQuestion(true);
  };

  const handleOpenEditQuestion = (q: AdminQuestionItem) => {
    soundEffects.playClick();
    setEditingQuestion(q);
    setFormDept(q.department);
    setFormQText(q.question);
    setFormOptA(q.option_a);
    setFormOptB(q.option_b);
    setFormOptC(q.option_c);
    setFormOptD(q.option_d);
    setFormCorrectIndex(q.correct_index);
    setQuestionFormError('');
    setQuestionFormSuccess('');
    setIsAddingQuestion(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionFormError('');
    setQuestionFormSuccess('');

    if (!formQText.trim() || !formOptA.trim() || !formOptB.trim() || !formOptC.trim() || !formOptD.trim()) {
      setQuestionFormError('Question text and all four options A, B, C, D must be filled.');
      return;
    }

    try {
      soundEffects.playClick();
      if (editingQuestion) {
        // Update existing question
        const res = await api.updateQuestion(editingQuestion.id, {
          department: formDept,
          question: formQText,
          option_a: formOptA,
          option_b: formOptB,
          option_c: formOptC,
          option_d: formOptD,
          correct_index: formCorrectIndex
        });
        if (res.ok) {
          soundEffects.playCorrect();
          setQuestionFormSuccess(`Question ID ${editingQuestion.id} updated successfully!`);
          setIsAddingQuestion(false);
          loadQuestions(selectedDeptFilter);
        }
      } else {
        // Add new question
        const res = await api.addQuestion({
          department: formDept,
          question: formQText,
          option_a: formOptA,
          option_b: formOptB,
          option_c: formOptC,
          option_d: formOptD,
          correct_index: formCorrectIndex
        });
        if (res.ok) {
          soundEffects.playCorrect();
          setQuestionFormSuccess(`New Question added with ID ${res.question.id}!`);
          setIsAddingQuestion(false);
          loadQuestions(selectedDeptFilter);
        }
      }
    } catch (err: unknown) {
      setQuestionFormError((err as Error).message || 'Failed to save question');
      soundEffects.playIncorrect();
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete Question ID ${id}? This action cannot be undone.`)) {
      return;
    }
    try {
      soundEffects.playClick();
      const res = await api.deleteQuestion(id);
      if (res.ok) {
        soundEffects.playCorrect();
        loadQuestions(selectedDeptFilter);
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete question');
      soundEffects.playIncorrect();
    }
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setQuestionFormError('Please paste or select a CSV file.');
      return;
    }
    try {
      soundEffects.playClick();
      const res = await api.uploadQuestionsCsv(csvText, csvMode, csvFallbackDept);
      if (res.ok) {
        soundEffects.playCorrect();
        alert(`Successfully imported ${res.imported} questions into the bank!`);
        setCsvUploadOpen(false);
        setCsvText('');
        loadQuestions(selectedDeptFilter);
      }
    } catch (err: unknown) {
      setQuestionFormError((err as Error).message || 'Failed to import CSV');
      soundEffects.playIncorrect();
    }
  };

  const handleCsvFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCsvText(String(ev.target?.result || ''));
    };
    reader.readAsText(file);
  };

  // --- Signature & Certificate Settings ---
  const loadSettings = async () => {
    try {
      const res = await api.getAdminSettings();
      if (res.ok) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed loading settings', err);
    }
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      if (settings) {
        setSettings({ ...settings, signature_photo: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSettingsSuccess('');
    setSettingsError('');

    try {
      soundEffects.playClick();
      const res = await api.updateAdminSettings({
        cvo_name: settings.cvo_name,
        cvo_designation: settings.cvo_designation,
        cvo_organization: settings.cvo_organization,
        signature_photo: settings.signature_photo,
        seal_text: settings.seal_text,
        quiz_seconds: Number(settings.quiz_seconds),
        quiz_count: Number(settings.quiz_count),
        slogan_hindi: settings.slogan_hindi,
        slogan_english: settings.slogan_english
      });
      if (res.ok) {
        soundEffects.playCorrect();
        setSettings(res.settings);
        setSettingsSuccess('Signature & Certificate configuration saved successfully! All generated certificates now display this signature.');
        if (onSettingsUpdated) {
          onSettingsUpdated();
        }
      }
    } catch (err: unknown) {
      setSettingsError((err as Error).message || 'Failed saving settings');
      soundEffects.playIncorrect();
    }
  };

  const handleRemoveSignature = () => {
    if (!settings) return;
    setSettings({ ...settings, signature_photo: null });
  };

  // --- Schedule ---
  const loadSchedule = async () => {
    try {
      const res = await api.getHome();
      if (res.ok) {
        setSchedules(res.schedule);
      }
    } catch (err) {
      console.error('Failed loading schedule', err);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      soundEffects.playClick();
      const res = await api.saveSchedules(schedules);
      if (res.ok) {
        soundEffects.playCorrect();
        setScheduleSuccess('Quiz schedule windows updated successfully!');
        setTimeout(() => setScheduleSuccess(''), 3000);
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed saving schedules');
      soundEffects.playIncorrect();
    }
  };

  // --- Results (100+ Participants) ---
  const loadResults = async () => {
    try {
      const res = await api.getAdminResults();
      if (res.ok) {
        setResults(res.results);
      }
    } catch (err) {
      console.error('Failed loading results', err);
    }
  };

  // --- Audit ---
  const loadAudit = async () => {
    try {
      const res = await api.getAdminAudit(auditSearch);
      if (res.ok) {
        setAuditLogs(res.rows);
      }
    } catch (err) {
      console.error('Failed loading audit', err);
    }
  };

  // --- Password Change ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });
    try {
      soundEffects.playClick();
      const res = await api.changePassword(curPassword, newPassword);
      if (res.ok) {
        soundEffects.playCorrect();
        setPasswordMsg({ text: 'Admin password updated successfully!', isError: false });
        setCurPassword('');
        setNewPassword('');
      }
    } catch (err: unknown) {
      setPasswordMsg({ text: (err as Error).message || 'Failed updating password', isError: true });
      soundEffects.playIncorrect();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500">Checking administrator privileges...</p>
      </div>
    );
  }

  // --- Login Screen ---
  if (!admin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-900 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Admin Login</h2>
            <p className="text-xs text-slate-500 mt-1">
              Chittaranjan Locomotive Works · Vigilance Department
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 mb-5 leading-relaxed">
            <span className="font-bold block mb-0.5">Authorised Access Only</span>
            Default Login: Username <strong>admin</strong> or <strong>cvoclwcrj@gmail.com</strong>
            <br />
            Password: <strong>ClwVaw@2026</strong>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Official Email
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="admin or cvoclwcrj@gmail.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-2.5 px-4 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loginSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Log In to Vigilance Console</span>
                </>
              )}
            </button>
          </form>

          {onClose && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Back to Public Portal
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Admin Dashboard & Controls ---
  const filteredQuestions = questions.filter(q => {
    const matchesDept = selectedDeptFilter === 'All' || q.department === selectedDeptFilter || q.department === 'All';
    const matchesSearch = !questionSearch || q.question.toLowerCase().includes(questionSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const filteredResults = results.filter(r => {
    if (!resultSearch) return true;
    const term = resultSearch.toLowerCase();
    return (
      r.pf_no.toLowerCase().includes(term) ||
      r.name.toLowerCase().includes(term) ||
      r.department.toLowerCase().includes(term) ||
      r.unit_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Admin Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-950 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">
              Vigilance Administration Console · CLW VAW 2026
            </div>
            <div className="text-base font-bold text-slate-900">
              Shri {admin.display_name} · SDGM &amp; CVO
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEffects.playClick();
              setShareOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#ff8a1e] hover:bg-[#e87610] text-[#071a3a] shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Quiz Link &amp; QR</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setDriveOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors"
            title="Google Drive Cloud Storage"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Public View
            </button>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'dashboard' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleTabChange('live')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'live' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Live Quiz Control Room</span>
        </button>

        <button
          onClick={() => handleTabChange('questions')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'questions' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Manage Questions ({questions.length || dashboardCounts?.questions || '...'})</span>
        </button>

        <button
          onClick={() => handleTabChange('signature')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'signature' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Signature &amp; Certificate Settings</span>
        </button>

        <button
          onClick={() => handleTabChange('schedule')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'schedule' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Quiz Schedules</span>
        </button>

        <button
          onClick={() => handleTabChange('results')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'results' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Participant Results (100+)</span>
        </button>

        <button
          onClick={() => handleTabChange('audit')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Audit Trail</span>
        </button>

        <button
          onClick={() => handleTabChange('password')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'password' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>
      </div>

      {/* --- TAB 1: DASHBOARD --- */}
      {activeTab === 'dashboard' && dashboardCounts && (
        <div className="space-y-6">
          {/* Public Participant URL Callout (Prevents 403 Forbidden) */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#071a3a] to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Public Participant Access · Zero 403 Errors</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Public Participation Link for All Employees (100+ Staff)
                </h3>
                <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
                  The private development URL (<code>ais-dev-</code>) returns Error 403 to staff members. Use this public link (<code>ais-pre-</code>) so anyone can participate freely on their mobile or PC.
                </p>
                <div className="pt-2">
                  <div className="font-mono text-xs text-amber-200 select-all break-all bg-black/40 px-3 py-2 rounded-lg border border-white/10 flex items-center justify-between gap-2">
                    <span>https://ais-pre-iv3zbtqjhdntlgwoumujar-384176507303.asia-east1.run.app?page=register</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setShareOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Open Share Modal &amp; QR</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Active Question Bank
              </div>
              <div className="text-3xl font-extrabold text-blue-950 font-mono">
                {dashboardCounts.questions}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {dashboardCounts.sample_questions} initial sample items
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Registered Participants
              </div>
              <div className="text-3xl font-extrabold text-blue-950 font-mono">
                {dashboardCounts.participants}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Ready for 100+ concurrent staff
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Completed Quizzes
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono">
                {dashboardCounts.submitted}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Certificates generated
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Audit Trail Entries
              </div>
              <div className="text-3xl font-extrabold text-slate-800 font-mono">
                {dashboardCounts.audit}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Full compliance logging
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Administrator Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <button
                onClick={() => {
                  handleTabChange('questions');
                  handleOpenAddQuestion();
                }}
                className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-blue-950 mb-0.5">+ Add Question</div>
                  <div className="text-[11px] text-slate-600">Add question &amp; options</div>
                </div>
                <Plus className="w-5 h-5 text-blue-800" />
              </button>

              <button
                onClick={() => handleTabChange('signature')}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-amber-950 mb-0.5">CVO Signature</div>
                  <div className="text-[11px] text-slate-600">Upload signature photo</div>
                </div>
                <ImageIcon className="w-5 h-5 text-amber-800" />
              </button>

              <button
                onClick={() => handleTabChange('results')}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-950 mb-0.5">Export Results</div>
                  <div className="text-[11px] text-slate-600">Download CSV of all scores</div>
                </div>
                <Download className="w-5 h-5 text-emerald-800" />
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShareOpen(true);
                }}
                className="p-4 rounded-xl border border-[#ff8a1e] bg-amber-50 hover:bg-amber-100/70 text-left transition-colors flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-xs text-[#071a3a] mb-0.5">Share Link &amp; QR</div>
                  <div className="text-[11px] text-slate-600">Get direct link &amp; notice QR</div>
                </div>
                <Share2 className="w-5 h-5 text-[#ff8a1e]" />
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setDriveOpen(true);
                }}
                className="p-4 rounded-xl border border-blue-300 bg-blue-50/70 hover:bg-blue-100/70 text-left transition-colors flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-xs text-blue-950 mb-0.5">Google Drive</div>
                  <div className="text-[11px] text-slate-600">Sync results &amp; files</div>
                </div>
                <HardDrive className="w-5 h-5 text-blue-800" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: ONLINE LIVE QUIZ CONTROL ROOM --- */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Top Control Room Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  liveAdminState?.status === 'question'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : liveAdminState?.status === 'review'
                    ? 'bg-amber-500 text-slate-950'
                    : liveAdminState?.status === 'lobby'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  STATUS: {liveAdminState?.status ? liveAdminState.status.toUpperCase() : 'IDLE'}
                </span>
                <span className="text-xs text-amber-300 font-mono">
                  Room: {liveAdminState?.sessionCode || 'CLW2026'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Live Quiz Control Room
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Start live synchronized quizzes, configure question timers, and monitor real-time participant speed and ranking scores.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="?page=live"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Projector View (Big Screen)</span>
              </a>

              <button
                onClick={loadLiveAdminState}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Refresh Live State"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {liveActionMsg && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs ${
              liveActionMsg.isError
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                {liveActionMsg.isError ? <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{liveActionMsg.text}</span>
              </div>
              <button
                onClick={() => setLiveActionMsg(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Control Room Operations Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Admin Live Controls &amp; Timer Configuration</span>
            </h3>

            {/* Timer Configurator */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-0.5">
                    Question Countdown Timer (Admin Configured per Question)
                  </label>
                  <p className="text-[11px] text-slate-600">
                    Participants answer against this countdown. Speed bonuses are calculated based on seconds remaining.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {[15, 20, 30, 45, 60].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleSetLiveTimer(sec)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                        liveTimerSeconds === sec
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-amber-200/60">
                <span className="text-xs font-semibold text-slate-700">Custom Seconds:</span>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={liveTimerSeconds}
                  onChange={e => setLiveTimerSeconds(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSetLiveTimer(liveTimerSeconds)}
                  className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Apply Timer
                </button>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Start Lobby Button */}
              {(!liveAdminState || liveAdminState.status === 'idle' || liveAdminState.status === 'ended') && (
                <button
                  onClick={handleStartLobby}
                  disabled={liveLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>Open Live Lobby (Allow Registration)</span>
                </button>
              )}

              {/* Start Question 1 (from lobby) */}
              {liveAdminState?.status === 'lobby' && (
                <button
                  onClick={() => handleStartQuestion(0)}
                  disabled={liveLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <Play className="w-4 h-4 text-amber-300" />
                  <span>Launch Question 1 ({liveTimerSeconds}s Timer)</span>
                </button>
              )}

              {/* Reveal Answer (during active question) */}
              {liveAdminState?.status === 'question' && (
                <button
                  onClick={handleRevealAnswer}
                  disabled={liveLoading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Reveal Correct Answer &amp; Scores</span>
                </button>
              )}

              {/* Next Question (during review) */}
              {liveAdminState?.status === 'review' && (
                <button
                  onClick={handleNextQuestion}
                  disabled={liveLoading}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FastForward className="w-4 h-4 text-amber-300" />
                  <span>Next Question ({((liveAdminState.currentIndex || 0) + 2)} of {liveAdminState.questionCount})</span>
                </button>
              )}

              {/* End Quiz Button */}
              {liveAdminState && liveAdminState.status !== 'idle' && liveAdminState.status !== 'ended' && (
                <button
                  onClick={handleEndQuiz}
                  disabled={liveLoading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>End Quiz &amp; Publish Final Podium</span>
                </button>
              )}

              {/* Reset Session */}
              <button
                onClick={handleResetLive}
                disabled={liveLoading}
                className="px-3.5 py-2.5 text-xs text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Reset Session
              </button>
            </div>
          </div>

          {/* Active Question Live Monitor */}
          {liveAdminState?.activeQuestion && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Live Question Monitor: #{((liveAdminState.activeQuestion.index || 0) + 1)} of {liveAdminState.activeQuestion.total}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Time Limit: {liveAdminState.activeQuestion.timerSeconds || liveAdminState.timerSeconds}s
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                {liveAdminState.activeQuestion.question}
              </h4>

              {/* Options Breakdown with Correct Answer and Vote Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveAdminState.activeQuestion.options.map((opt: string, idx: number) => {
                  const isCorrect = liveAdminState.correctIndex === idx || liveAdminState.reviewData?.correctIndex === idx;
                  const count = liveAdminState.reviewData?.optionCounts?.[idx];

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        isCorrect
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold font-mono text-xs ${
                          isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                        }`}>
                          {['A', 'B', 'C', 'D'][idx]}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {count !== undefined && (
                        <span className="font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded-md">
                          {count} votes
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Leaderboard / Scoreboard Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Live Participant Scoreboard ({liveAdminState?.leaderboard?.length || 0} Registered)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Ranked by Score (Marks + Speed Bonus) &amp; Response Timing
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">PF No</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                    <th className="py-2.5 px-3 text-right">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveAdminState?.leaderboard?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No participants registered in live session yet. Open lobby and share public quiz link!
                      </td>
                    </tr>
                  ) : (
                    liveAdminState?.leaderboard?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold">
                          {p.rank === 1 ? '🥇 #1' : p.rank === 2 ? '🥈 #2' : p.rank === 3 ? '🥉 #3' : `#${p.rank}`}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-blue-950">
                          {p.pf}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {p.designation}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {p.department}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {p.score} pts
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {p.totalTimeTaken}s
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: QUESTIONS CRUD MANAGEMENT --- */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Department Filter */}
              <select
                value={selectedDeptFilter}
                onChange={e => {
                  setSelectedDeptFilter(e.target.value);
                  loadQuestions(e.target.value);
                }}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Personnel">Personnel</option>
                <option value="Accounts">Accounts</option>
                <option value="Stores">Stores</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Security (RPF)">Security (RPF)</option>
                <option value="Signal &amp; Telecom">Signal &amp; Telecom</option>
                <option value="Engineering">Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Medical">Medical</option>
                <option value="General Administration">General Administration</option>
                <option value="Rajbhasha">Rajbhasha</option>
              </select>

              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={e => setQuestionSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCsvUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>

              <button
                onClick={handleOpenAddQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Question Add / Edit Modal / Form */}
          {isAddingQuestion && (
            <div className="bg-white border-2 border-blue-900 rounded-xl p-5 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="text-sm font-bold text-blue-950">
                  {editingQuestion ? `Modify Question #${editingQuestion.id}` : 'Add New Question to Quiz Bank'}
                </h3>
                <button
                  onClick={() => setIsAddingQuestion(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formDept}
                      onChange={e => setFormDept(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="All">All Departments (General)</option>
                      <option value="Personnel">Personnel</option>
                      <option value="Accounts">Accounts</option>
                      <option value="Stores">Stores</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Security (RPF)">Security (RPF)</option>
                      <option value="Signal &amp; Telecom">Signal &amp; Telecom</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Medical">Medical</option>
                      <option value="General Administration">General Administration</option>
                      <option value="Rajbhasha">Rajbhasha</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correct Option Answer Key
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['A', 'B', 'C', 'D'].map((letter, idx) => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setFormCorrectIndex(idx)}
                          className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-colors ${
                            formCorrectIndex === idx
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Option {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Statement <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formQText}
                    onChange={e => setFormQText(e.target.value)}
                    placeholder="Enter the complete question text..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Option A</span>
                      {formCorrectIndex === 0 && <span className="text-emerald-700 font-bold text-[10px]">✓ Correct Answer</span>}
                    </label>
                    <input
                      type="text"
                      required
                      value={formOptA}
                      onChange={e => setFormOptA(e.target.value)}
                      placeholder="Choice A text"
                      className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none ${
                        formCorrectIndex === 0 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Option B</span>
                      {formCorrectIndex === 1 && <span className="text-emerald-700 font-bold text-[10px]">✓ Correct Answer</span>}
                    </label>
                    <input
                      type="text"
                      required
                      value={formOptB}
                      onChange={e => setFormOptB(e.target.value)}
                      placeholder="Choice B text"
                      className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none ${
                        formCorrectIndex === 1 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Option C</span>
                      {formCorrectIndex === 2 && <span className="text-emerald-700 font-bold text-[10px]">✓ Correct Answer</span>}
                    </label>
                    <input
                      type="text"
                      required
                      value={formOptC}
                      onChange={e => setFormOptC(e.target.value)}
                      placeholder="Choice C text"
                      className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none ${
                        formCorrectIndex === 2 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Option D</span>
                      {formCorrectIndex === 3 && <span className="text-emerald-700 font-bold text-[10px]">✓ Correct Answer</span>}
                    </label>
                    <input
                      type="text"
                      required
                      value={formOptD}
                      onChange={e => setFormOptD(e.target.value)}
                      placeholder="Choice D text"
                      className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none ${
                        formCorrectIndex === 3 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {questionFormError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    {questionFormError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuestion(false)}
                    className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    {editingQuestion ? 'Update Question' : 'Save Question'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bulk CSV Upload Modal */}
          {csvUploadOpen && (
            <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Bulk Upload Questions via CSV
                </h3>
                <button
                  onClick={() => setCsvUploadOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadCsv} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Format: Department, Question, Option A, Option B, Option C, Option D, Correct (A/B/C/D)</span>
                  <a
                    href="/api/admin/template"
                    className="text-blue-900 font-semibold underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Template</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Import Mode
                    </label>
                    <select
                      value={csvMode}
                      onChange={e => setCsvMode(e.target.value as 'replace_all' | 'replace_department')}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="replace_department">Append / Replace only matching departments</option>
                      <option value="replace_all">Replace Entire Question Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Choose .csv File
                    </label>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleCsvFileChosen}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or Paste CSV Raw Text Below:
                  </label>
                  <textarea
                    rows={5}
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    placeholder="Department,Question,Option A,Option B,Option C,Option D,Correct&#10;Electrical,Sample question text,Choice A,Choice B,Choice C,Choice D,A"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCsvUploadOpen(false)}
                    className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    Upload and Import
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Questions Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredQuestions.length} of {questions.length} questions in bank</span>
              <span>Each attempt randomly serves configured number of items</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-500">#{q.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-blue-950 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {q.department}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Source: {q.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        title="Edit question and options"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, i) => {
                      const isCorrect = i === q.correct_index;
                      return (
                        <div
                          key={i}
                          className={`p-2 rounded-md border flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[11px]">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                              ✓ KEY
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No questions found matching your filter or search criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SIGNATURE & CERTIFICATE SETTINGS --- */}
      {activeTab === 'signature' && settings && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-base font-bold text-slate-900">
                SDGM &amp; CVO Signature &amp; Certificate Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload the official signature photo of the SDGM &amp; Chief Vigilance Officer. This signature will automatically appear on all generated e-Certificates, Canvas PNG downloads, and prints.
              </p>
            </div>

            {settingsSuccess && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            {settingsError && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Signature Photo Section */}
              <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Official Signature Photo of SDGM &amp; CVO
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Signature Preview Box */}
                  <div className="w-72 h-32 bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                    {settings.signature_photo ? (
                      <>
                        <img
                          src={settings.signature_photo}
                          alt="SDGM & CVO Signature"
                          className="max-h-20 max-w-full object-contain pointer-events-none"
                        />
                        <span className="text-[10px] text-emerald-700 font-semibold mt-1">
                          ✓ Uploaded Signature Active
                        </span>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="font-serif italic text-2xl text-blue-950">
                          {settings.cvo_name || 'Sugind Surendran'}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          (Default Scripted Font Active)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upload a clean photograph or scanned image of the SDGM signature (PNG with transparent background recommended, JPEG or SVG also supported).
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleSignatureFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{settings.signature_photo ? 'Change Signature Photo' : 'Upload Signature Photo'}</span>
                      </button>

                      {settings.signature_photo && (
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatory Text Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CVO Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.cvo_name}
                    onChange={e => setSettings({ ...settings, cvo_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.cvo_designation}
                    onChange={e => setSettings({ ...settings, cvo_designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Location
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.cvo_organization}
                    onChange={e => setSettings({ ...settings, cvo_organization: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              {/* Quiz Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Per Question (Seconds)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={settings.quiz_seconds}
                    onChange={e => setSettings({ ...settings, quiz_seconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Questions Per Attempt
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={settings.quiz_count}
                    onChange={e => setSettings({ ...settings, quiz_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seal Stamp Text
                  </label>
                  <input
                    type="text"
                    value={settings.seal_text}
                    onChange={e => setSettings({ ...settings, seal_text: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Signature &amp; Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 4: SCHEDULE MANAGEMENT --- */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Quiz Windows
              </h3>
              <p className="text-xs text-slate-500">
                Control start and end timings for each department.
              </p>
            </div>
            <button
              onClick={handleSaveSchedule}
              className="px-5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Save Schedule Windows
            </button>
          </div>

          {scheduleSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 rounded-lg">
              {scheduleSuccess}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">SL</th>
                  <th className="py-2.5 px-3 text-left">Department</th>
                  <th className="py-2.5 px-3 text-left">Opens (Date &amp; Time)</th>
                  <th className="py-2.5 px-3 text-left">Closes (Date &amp; Time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((sch, i) => (
                  <tr key={sch.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{sch.department}</td>
                    <td className="py-2 px-3">
                      <input
                        type="datetime-local"
                        value={sch.starts_at.replace(' ', 'T').slice(0, 16)}
                        onChange={e => {
                          const updated = [...schedules];
                          updated[i].starts_at = e.target.value.replace('T', ' ') + ':00';
                          setSchedules(updated);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="datetime-local"
                        value={sch.ends_at.replace(' ', 'T').slice(0, 16)}
                        onChange={e => {
                          const updated = [...schedules];
                          updated[i].ends_at = e.target.value.replace('T', ' ') + ':00';
                          setSchedules(updated);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: RESULTS (100+ PARTICIPANTS) --- */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={resultSearch}
                onChange={e => setResultSearch(e.target.value)}
                placeholder="Search by PF number, Name, Department..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/admin/export_results"
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </a>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setDriveOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Sync to Google Drive</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-semibold flex items-center justify-between">
              <span>{filteredResults.length} Participants Recorded</span>
              <span>Sorted by latest registration</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">PF Number</th>
                    <th className="py-2 px-3 text-left">Participant Name</th>
                    <th className="py-2 px-3 text-left">Designation</th>
                    <th className="py-2 px-3 text-left">Department</th>
                    <th className="py-2 px-3 text-left">Unit</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-right">Score</th>
                    <th className="py-2 px-3 text-left">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map(r => (
                    <tr key={r.pf_no} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-950">{r.pf_no}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{r.name}</td>
                      <td className="py-2 px-3 text-slate-600">{r.designation}</td>
                      <td className="py-2 px-3 text-slate-600">{r.department}</td>
                      <td className="py-2 px-3 text-slate-600">{r.unit_name}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'submitted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {r.score !== null && r.score !== undefined ? `${r.score} / ${r.max_score}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] font-mono">
                        {r.submitted_at ? r.submitted_at.slice(0, 16) : '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No participant attempts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: AUDIT TRAIL --- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => {
                  setAuditSearch(e.target.value);
                  loadAudit();
                }}
                placeholder="Search audit trail..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <a
              href="/api/admin/export_audit"
              download
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Audit CSV</span>
            </a>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left">Time</th>
                  <th className="py-2 px-3 text-left">Actor</th>
                  <th className="py-2 px-3 text-left">Action</th>
                  <th className="py-2 px-3 text-left">Detail</th>
                  <th className="py-2 px-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{l.created_at}</td>
                    <td className="py-2 px-3 font-semibold text-blue-950">{l.actor}</td>
                    <td className="py-2 px-3 text-amber-800">{l.action}</td>
                    <td className="py-2 px-3 text-slate-700 font-sans">{l.detail}</td>
                    <td className="py-2 px-3 text-slate-400">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 7: PASSWORD CHANGE --- */}
      {activeTab === 'password' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Change Administrator Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={curPassword}
                onChange={e => setCurPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (minimum 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {passwordMsg.text && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  passwordMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* Share Link & QR Code Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Google Drive Cloud Storage Modal */}
      <DriveModal
        isOpen={driveOpen}
        onClose={() => setDriveOpen(false)}
      />
    </div>
  );
};
