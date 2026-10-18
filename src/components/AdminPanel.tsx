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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live' | 'questions' | 'signature' | 'dept_units' | 'dbtables' | 'schedule' | 'results' | 'audit' | 'password'>('dashboard');
  const [shareOpen, setShareOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);

  // Live Quiz Control Room State
  const [liveAdminState, setLiveAdminState] = useState<any>(null);
  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(30);
  const [liveQuestionCount, setLiveQuestionCount] = useState<number>(10);
  const [liveDept, setLiveDept] = useState<string>('All');
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [liveActionMsg, setLiveActionMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [adminCountdown, setAdminCountdown] = useState<number | null>(null);

  // Live Quiz Scheduling & Session History State
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionTimer, setNewSessionTimer] = useState(30);
  const [newSessionQuestions, setNewSessionQuestions] = useState(10);
  const [selectedSessionHistory, setSelectedSessionHistory] = useState<any | null>(null);

  // Dynamic Departments & Units State
  const [departments, setDepartments] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [newUnitInput, setNewUnitInput] = useState('');
  const [editingDeptItem, setEditingDeptItem] = useState<{ original: string; current: string } | null>(null);
  const [editingUnitItem, setEditingUnitItem] = useState<{ original: string; current: string } | null>(null);

  // Database Tables Explorer State
  const [selectedDbTable, setSelectedDbTable] = useState<string>('participants');
  const [dbTableData, setDbTableData] = useState<any[] | null>(null);
  const [dbTableLoading, setDbTableLoading] = useState(false);
  const [dbTableSearch, setDbTableSearch] = useState('');
  const [editingDbRow, setEditingDbRow] = useState<any | null>(null);
  const [editingDbJson, setEditingDbJson] = useState('');
  const [dbTableMsg, setDbTableMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Reset User Password State
  const [resetUserModal, setResetUserModal] = useState<{ id: number; name: string; pf: string } | null>(null);
  const [resetUserPass, setResetUserPass] = useState('123');
  const [resetUserMsg, setResetUserMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Attempt Trace Inspection State
  const [inspectAttemptModal, setInspectAttemptModal] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

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
  const templateFileInputRef = useRef<HTMLInputElement>(null);

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
      loadLiveSessions();
    } else if (tab === 'questions') {
      loadQuestions(selectedDeptFilter);
    } else if (tab === 'signature') {
      loadSettings();
    } else if (tab === 'dept_units') {
      loadDepartmentsAndUnits();
    } else if (tab === 'dbtables') {
      loadDbTable(selectedDbTable);
    } else if (tab === 'schedule') {
      loadSchedule();
    } else if (tab === 'results') {
      loadResults();
    } else if (tab === 'audit') {
      loadAudit();
    }
  };

  // --- Live Quiz & Waiting Room Operations ---
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

  const loadLiveSessions = async () => {
    try {
      const res = await api.getLiveSessions();
      if (res.ok) {
        setLiveSessions(res.sessions || []);
      }
    } catch (err) {
      console.error('Failed loading live sessions', err);
    }
  };

  const handleCreateLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim() || !newSessionDate.trim()) {
      setLiveActionMsg({ text: 'Please enter Session Title and Scheduled Date/Time.', isError: true });
      return;
    }
    setLiveLoading(true);
    try {
      soundEffects.playClick();
      const res = await api.adminCreateLiveSession({
        title: newSessionTitle.trim(),
        scheduled_at: newSessionDate.trim(),
        timer_seconds: Number(newSessionTimer) || 30,
        question_count: Number(newSessionQuestions) || 10,
        department: liveDept
      });
      if (res.ok) {
        soundEffects.playCorrect();
        setLiveSessions(res.sessions);
        setNewSessionTitle('');
        setNewSessionDate('');
        setLiveActionMsg({ text: `Created scheduled session "${res.session.title}" successfully!`, isError: false });
      }
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to create live session', isError: true });
      soundEffects.playIncorrect();
    } finally {
      setLiveLoading(false);
    }
  };

  const handleDeleteLiveSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live session?')) return;
    try {
      soundEffects.playClick();
      const res = await api.adminDeleteLiveSession(id);
      if (res.ok) {
        setLiveSessions(res.sessions);
        setLiveActionMsg({ text: 'Session deleted successfully.', isError: false });
      }
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to delete session', isError: true });
    }
  };

  const handleViewSessionHistory = async (id: string) => {
    try {
      soundEffects.playClick();
      const res = await api.adminGetLiveSessionHistory(id);
      if (res.ok) {
        setSelectedSessionHistory(res.session);
      }
    } catch (err: any) {
      alert(err.message || 'Failed loading session history');
    }
  };

  const handleDownloadSessionBackup = async (id: string) => {
    try {
      soundEffects.playClick();
      const res = await api.adminGetLiveSessionBackup(id);
      if (res.ok && res.backup) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.backup, null, 2));
        const a = document.createElement('a');
        a.setAttribute('href', dataStr);
        a.setAttribute('download', `${id}_backup_full.json`);
        document.body.appendChild(a);
        a.click();
        a.remove();
        soundEffects.playCorrect();
      } else {
        alert('No backup data found for this session.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to download session backup');
    }
  };

  const handleAdmitParticipant = async (pf: string) => {
    try {
      soundEffects.playClick();
      const res = await api.adminAdmitLiveParticipant(pf);
      if (res.ok) {
        setLiveAdminState(res.state);
        setLiveActionMsg({ text: `Admitted PF ${pf} into live competition!`, isError: false });
      }
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to admit participant', isError: true });
    }
  };

  const handleAdmitAllWaiting = async () => {
    try {
      soundEffects.playClick();
      const res = await api.adminAdmitAllLive();
      if (res.ok) {
        setLiveAdminState(res.state);
        setLiveActionMsg({ text: `Admitted all ${res.admittedCount} waiting participants into live quiz!`, isError: false });
      }
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to admit all', isError: true });
    }
  };

  const handleToggleAutoAdmit = async () => {
    const nextVal = !liveAdminState?.autoAdmit;
    try {
      soundEffects.playClick();
      const res = await api.adminToggleAutoAdmit(nextVal);
      if (res.ok) {
        setLiveAdminState(res.state);
        setLiveActionMsg({
          text: nextVal ? 'Auto-Admit is now ENABLED. Participants enter immediately!' : 'Auto-Admit is now DISABLED. Participants wait in waiting room.',
          isError: false
        });
      }
    } catch (err: any) {
      setLiveActionMsg({ text: err.message || 'Failed to toggle auto admit', isError: true });
    }
  };

  // --- Dynamic Departments & Units Operations ---
  const loadDepartmentsAndUnits = async () => {
    try {
      const dRes = await api.adminGetDepartments();
      if (dRes.ok) setDepartments(dRes.departments || []);
      const uRes = await api.adminGetUnits();
      if (uRes.ok) setUnits(uRes.units || []);
    } catch (err) {
      console.error('Failed loading departments and units', err);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptInput.trim()) return;
    try {
      soundEffects.playClick();
      const res = await api.adminUpdateDepartments({ action: 'add', name: newDeptInput.trim() });
      if (res.ok) {
        setDepartments(res.departments);
        setNewDeptInput('');
        soundEffects.playCorrect();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed adding department');
    }
  };

  const handleUpdateDept = async (original: string, newName: string) => {
    if (!newName.trim() || newName.trim() === original) {
      setEditingDeptItem(null);
      return;
    }
    try {
      soundEffects.playClick();
      const res = await api.adminUpdateDepartments({ action: 'update', name: original, newName: newName.trim() });
      if (res.ok) {
        setDepartments(res.departments);
        setEditingDeptItem(null);
        soundEffects.playCorrect();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed updating department');
    }
  };

  const handleDeleteDept = async (name: string) => {
    if (!confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      soundEffects.playClick();
      const res = await api.adminUpdateDepartments({ action: 'delete', name });
      if (res.ok) {
        setDepartments(res.departments);
        soundEffects.playCorrect();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed deleting department');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitInput.trim()) return;
    try {
      soundEffects.playClick();
      const res = await api.adminUpdateUnits({ action: 'add', name: newUnitInput.trim() });
      if (res.ok) {
        setUnits(res.units);
        setNewUnitInput('');
        soundEffects.playCorrect();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed adding unit');
    }
  };

  const handleUpdateUnit = async (original: string, newName: string) => {
    if (!newName.trim() || newName.trim() === original) {
      setEditingUnitItem(null);
      return;
    }
    try {
      soundEffects.playClick();
      const res = await api.adminUpdateUnits({ action: 'update', name: original, newName: newName.trim() });
      if (res.ok) {
        setUnits(res.units);
        setEditingUnitItem(null);
        soundEffects.playCorrect();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed updating unit');
    }
  };

  const handleDeleteUnit = async (name: string) => {
    if (!confirm(`Are you sure you want to delete unit "${name}"?`)) return;
    try {
      soundEffects.playClick();
      const res = await api.adminUpdateUnits({ action: 'delete', name });
      if (res.ok) {
        setUnits(res.units);
        soundEffects.playCorrect();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed deleting unit');
    }
  };

  // --- Database Tables Explorer Operations ---
  const loadDbTable = async (tableName: string) => {
    setSelectedDbTable(tableName);
    setDbTableLoading(true);
    setDbTableMsg(null);
    setEditingDbRow(null);
    try {
      const res = await api.adminGetDbTable(tableName);
      if (res.ok) {
        setDbTableData(Array.isArray(res.data) ? res.data : [res.data]);
      }
    } catch (err: any) {
      setDbTableMsg({ text: err.message || 'Failed loading table data', isError: true });
    } finally {
      setDbTableLoading(false);
    }
  };

  const handleSaveDbRowEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDbRow) return;
    try {
      const parsed = JSON.parse(editingDbJson);
      soundEffects.playClick();
      const rowId = editingDbRow.id || editingDbRow.pf_no || editingDbRow.name;
      const res = await api.adminUpdateDbTableRow(selectedDbTable, rowId, parsed);
      if (res.ok) {
        soundEffects.playCorrect();
        setDbTableMsg({ text: 'Database record updated successfully!', isError: false });
        setEditingDbRow(null);
        loadDbTable(selectedDbTable);
      }
    } catch (err: any) {
      setDbTableMsg({ text: 'Invalid JSON or update error: ' + err.message, isError: true });
      soundEffects.playIncorrect();
    }
  };

  const handleDeleteDbRow = async (row: any) => {
    const rowId = row.id || row.pf_no || row.name;
    if (!confirm(`Are you sure you want to delete this record (${rowId}) from table "${selectedDbTable}"?`)) return;
    try {
      soundEffects.playClick();
      const res = await api.adminDeleteDbTableRow(selectedDbTable, rowId);
      if (res.ok) {
        soundEffects.playCorrect();
        setDbTableMsg({ text: 'Record deleted successfully from database!', isError: false });
        loadDbTable(selectedDbTable);
      }
    } catch (err: any) {
      setDbTableMsg({ text: err.message || 'Failed to delete record', isError: true });
      soundEffects.playIncorrect();
    }
  };

  // --- Reset User Password Operation ---
  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserModal) return;
    try {
      soundEffects.playClick();
      const res = await api.adminResetUserPassword(resetUserModal.id, resetUserPass.trim() || '123');
      if (res.ok) {
        soundEffects.playCorrect();
        setResetUserMsg({ text: res.message, isError: false });
        setTimeout(() => {
          setResetUserModal(null);
          setResetUserMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      setResetUserMsg({ text: err.message || 'Failed to reset password', isError: true });
      soundEffects.playIncorrect();
    }
  };

  // --- Inspect Attempt Trace ---
  const handleInspectAttempt = async (attemptId: number) => {
    setInspectLoading(true);
    setInspectAttemptModal(null);
    try {
      soundEffects.playClick();
      const res = await api.adminGetAttemptDetails(attemptId);
      if (res.ok) {
        setInspectAttemptModal(res.details);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load attempt details');
    } finally {
      setInspectLoading(false);
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

  // Real-time ticking countdown timer for Admin Panel
  useEffect(() => {
    if (activeTab !== 'live' || !liveAdminState) {
      setAdminCountdown(null);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      if (liveAdminState.status === 'question' && liveAdminState.questionEndTime) {
        const remaining = Math.max(0, Math.ceil((liveAdminState.questionEndTime - now) / 1000));
        setAdminCountdown(remaining);
      } else if (liveAdminState.status === 'review' && liveAdminState.reviewStartTime) {
        const elapsed = Math.floor((now - liveAdminState.reviewStartTime) / 1000);
        const autoRem = Math.max(0, 5 - elapsed);
        setAdminCountdown(autoRem);
      } else {
        setAdminCountdown(null);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [activeTab, liveAdminState]);

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

  const handleSetLiveQuestionCount = async (count: number) => {
    setLiveQuestionCount(count);
    try {
      soundEffects.playClick();
      await api.adminSetLiveQuestionCount(count);
      loadLiveAdminState();
      setLiveActionMsg({ text: `Question count set to ${count} for live quiz.`, isError: false });
    } catch (err) {
      console.error('Failed setting question count', err);
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
        organization_name: settings.organization_name,
        programme_name: settings.programme_name,
        programme_period: settings.programme_period,
        registration_enabled: settings.registration_enabled,
        signature_photo: settings.signature_photo,
        quiz_certificate_template: settings.quiz_certificate_template,
        seal_text: settings.seal_text,
        quiz_seconds: Number(settings.quiz_seconds),
        quiz_count: Number(settings.quiz_count),
        contact_address: settings.contact_address,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        slogan_hindi: settings.slogan_hindi,
        slogan_english: settings.slogan_english
      });
      if (res.ok) {
        soundEffects.playCorrect();
        setSettings(res.settings);
        setSettingsSuccess('Signature & Certificate configuration saved successfully! All generated certificates now display these settings.');
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

  const handleTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      if (settings) {
        setSettings({ ...settings, quiz_certificate_template: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTemplate = () => {
    if (!settings) return;
    setSettings({ ...settings, quiz_certificate_template: null });
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
          <span>Settings &amp; Certificate</span>
        </button>

        <button
          onClick={() => handleTabChange('dept_units')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'dept_units' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Departments &amp; Units</span>
        </button>

        <button
          onClick={() => handleTabChange('dbtables')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'dbtables' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Database Tables</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
                onClick={() => {
                  soundEffects.playClick();
                  handleTabChange('dept_units');
                }}
                className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-indigo-950 mb-0.5">+ Dept &amp; Unit</div>
                  <div className="text-[11px] text-slate-600">Add &amp; manage master</div>
                </div>
                <Building className="w-5 h-5 text-indigo-800" />
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
              {/* Real-time Live Question Timer Display for Admin */}
              {liveAdminState?.status === 'question' && (
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/50 shadow-inner">
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1">
                      <span>Timer</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl sm:text-2xl font-mono font-black ${
                        (adminCountdown ?? 30) <= 5 ? 'text-rose-400 animate-pulse' : (adminCountdown ?? 30) <= 10 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {adminCountdown !== null ? adminCountdown : (liveAdminState.activeQuestion?.timerSeconds || liveAdminState.timerSeconds)}s
                      </span>
                      <span className="text-[10px] text-slate-400">left</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Review / Auto-Advance Countdown for Admin */}
              {liveAdminState?.status === 'review' && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-400/60 shadow-inner">
                  <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                      Auto-Advance
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-200">
                      Next in {adminCountdown !== null ? adminCountdown : 5}s
                    </div>
                  </div>
                </div>
              )}

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

            {/* Question Count Configurator (Determined by Admin) */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-indigo-950 mb-0.5">
                    Live Quiz Question Count (Determined by Admin)
                  </label>
                  <p className="text-[11px] text-slate-600">
                    Admin sets how many questions to present during this live competition session.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {[5, 10, 15, 20, 25, 30].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSetLiveQuestionCount(cnt)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                        liveQuestionCount === cnt
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-indigo-200/60">
                <span className="text-xs font-semibold text-slate-700">Custom Count:</span>
                <input
                  type="number"
                  min={3}
                  max={questions.length || 100}
                  value={liveQuestionCount}
                  onChange={e => setLiveQuestionCount(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSetLiveQuestionCount(liveQuestionCount)}
                  className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Apply Question Count
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  (Available in Bank: {questions.length} questions)
                </span>
              </div>
            </div>

            {/* Action Buttons Bar - KEPT LIVE AT ALL TIMES */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Start Lobby Button */}
              {(!liveAdminState || liveAdminState.status === 'idle' || liveAdminState.status === 'ended') && (
                <button
                  onClick={handleStartLobby}
                  disabled={liveLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>Open Live Lobby ({liveQuestionCount} Questions, {liveTimerSeconds}s)</span>
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

              {/* Reveal Answer Button - Kept Live during Question, Time Lapsed, or Review */}
              {(liveAdminState?.status === 'question' || liveAdminState?.status === 'time_lapsed' || liveAdminState?.status === 'review') && (
                <button
                  onClick={handleRevealAnswer}
                  disabled={liveLoading}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
                    liveAdminState.status === 'review'
                      ? 'bg-amber-100 border border-amber-300 text-amber-950 hover:bg-amber-200'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                  title="Reveal correct answer and display leaderboard scores to all participants"
                >
                  <Eye className="w-4 h-4" />
                  <span>
                    {liveAdminState.status === 'review'
                      ? '✓ Answer & Scores Revealed'
                      : 'Reveal Correct Answer & Scores'}
                  </span>
                </button>
              )}

              {/* Next Question Button - Kept Live during active question, time lapsed, or review! */}
              {(liveAdminState?.status === 'review' || liveAdminState?.status === 'question' || liveAdminState?.status === 'time_lapsed') && (
                <button
                  onClick={handleNextQuestion}
                  disabled={liveLoading}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  title="Advance immediately to next question (or skip 5-second wait)"
                >
                  <FastForward className="w-4 h-4 text-amber-300" />
                  <span>
                    Next Question ({((liveAdminState.currentIndex || 0) + 2)} of {liveAdminState.questionCount || liveQuestionCount}) [Advance Now]
                  </span>
                </button>
              )}

              {/* 5-Second Auto-Advance Countdown Indicator */}
              {liveAdminState?.status === 'review' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-amber-300 text-xs font-mono border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    {liveAdminState.autoAdvance !== false
                      ? 'Auto-advancing in 5s (or click Next Question)'
                      : 'Auto-advance paused'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !liveAdminState.autoAdvance;
                      await api.adminToggleLiveAutoAdvance(next);
                      loadLiveAdminState();
                    }}
                    className="text-[10px] uppercase font-bold text-amber-400 underline hover:text-white ml-1 cursor-pointer"
                  >
                    {liveAdminState.autoAdvance !== false ? 'Pause' : 'Resume'}
                  </button>
                </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
                    Live Question #{((liveAdminState.activeQuestion.index || 0) + 1)} of {liveAdminState.activeQuestion.total}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Limit: {liveAdminState.activeQuestion.timerSeconds || liveAdminState.timerSeconds}s
                  </span>
                </div>

                {/* Live Ticking Countdown Badge for Admin */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-slate-700">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs text-slate-400 font-semibold">Timer:</span>
                    <span className={`text-sm sm:text-base font-mono font-bold ${
                      (adminCountdown ?? 30) <= 5 ? 'text-rose-400 animate-pulse' : (adminCountdown ?? 30) <= 10 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {liveAdminState.status === 'question'
                        ? `${adminCountdown !== null ? adminCountdown : (liveAdminState.activeQuestion.timerSeconds || liveAdminState.timerSeconds)}s remaining`
                        : liveAdminState.status === 'review'
                        ? `Answer revealed · ${adminCountdown !== null ? adminCountdown : 5}s to next`
                        : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Visual Countdown Bar for Admin */}
              {liveAdminState.status === 'question' && (
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 rounded-full ${
                      (adminCountdown ?? 30) <= 5 ? 'bg-rose-500' : (adminCountdown ?? 30) <= 10 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, ((adminCountdown ?? liveAdminState.timerSeconds) / (liveAdminState.activeQuestion.timerSeconds || liveAdminState.timerSeconds || 30)) * 100))}%`
                    }}
                  />
                </div>
              )}

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

          {/* --- LIVE WAITING ROOM & ADMISSION CONTROL PANEL --- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Live Waiting Room &amp; Participant Admission</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      (liveAdminState?.waitingCount || 0) > 0 ? 'bg-amber-100 text-amber-900 animate-pulse' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {liveAdminState?.waitingCount || 0} Waiting
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Admin can allow participants to join at any point, even after the live quiz has started.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAutoAdmit}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    liveAdminState?.autoAdmit
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="When enabled, participants join immediately without waiting for admin approval"
                >
                  {liveAdminState?.autoAdmit ? '✓ Auto-Admit: ON (Instant Entry)' : 'Auto-Admit: OFF (Approval Required)'}
                </button>

                {(liveAdminState?.waitingCount || 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleAdmitAllWaiting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Admit All ({liveAdminState.waitingCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Waiting Participants Table */}
            {liveAdminState?.waitingList && liveAdminState.waitingList.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">PF Number</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Department &amp; Unit</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liveAdminState.waitingList.map((w: any) => (
                      <tr key={w.pf} className="hover:bg-amber-50/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-950">{w.pf}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{w.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.designation}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.department} · {w.unit}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{w.mobile}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleAdmitParticipant(w.pf)}
                            className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Admit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                Waiting room is currently empty. Participants will appear here when they request to join.
              </div>
            )}
          </div>

          {/* --- LIVE QUIZ SCHEDULE CREATION & SESSION HISTORY --- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-900" />
                <span>Live Quiz Schedule Management &amp; Session History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin can create distinct live quiz schedules. Each session maintains distinct participant history and question-by-question attempt records.
              </p>
            </div>

            {/* Schedule New Live Session Form */}
            <form onSubmit={handleCreateLiveSession} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                + Schedule New Live Competition Session
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Session Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionTitle}
                    onChange={e => setNewSessionTitle(e.target.value)}
                    placeholder="e.g. Workshop Round 1 - Mechanical"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Scheduled Date &amp; Time <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newSessionDate}
                    onChange={e => setNewSessionDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Timer per Q (Sec)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={newSessionTimer}
                    onChange={e => setNewSessionTimer(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={50}
                    value={newSessionQuestions}
                    onChange={e => setNewSessionQuestions(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={liveLoading}
                  className="px-5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Live Quiz Schedule</span>
                </button>
              </div>
            </form>

            {/* List of Scheduled / Past Sessions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Scheduled &amp; Past Live Sessions ({liveSessions.length})
              </h4>

              {liveSessions && liveSessions.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#071a3a] text-white font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Session ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Scheduled At</th>
                        <th className="py-2.5 px-3 text-center">Timer / Qs</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveSessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{sess.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{sess.title}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{sess.scheduled_at}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {sess.timer_seconds}s · {sess.question_count} Qs
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sess.status === 'completed'
                                ? 'bg-slate-100 text-slate-700'
                                : sess.status === 'in_progress'
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {sess.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setLiveTimerSeconds(sess.timer_seconds);
                                setLiveQuestionCount(sess.question_count);
                                handleStartLobby();
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                              title="Start Live Lobby for this session"
                            >
                              Launch Lobby
                            </button>

                            <button
                              type="button"
                              onClick={() => handleViewSessionHistory(sess.id)}
                              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded text-[11px]"
                              title="View Participant Scores & Answers for this Session"
                            >
                              View History
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSessionBackup(sess.id)}
                              className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold rounded text-[11px] inline-flex items-center gap-1"
                              title="Download Full Backup (JSON) with all participants, answers & certificates"
                            >
                              <HardDrive className="w-3 h-3" />
                              <span>Backup JSON</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLiveSession(sess.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  No live quiz schedules created yet. Use the form above to schedule a live quiz competition.
                </div>
              )}
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
                {departments.map((dept, idx) => (
                  <option key={`filter-dept-${dept}-${idx}`} value={dept}>{dept}</option>
                ))}
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
                      {departments.map((dept, idx) => (
                        <option key={`form-dept-${dept}-${idx}`} value={dept}>{dept}</option>
                      ))}
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
              {/* Certificate Template Section */}
              <div className="p-5 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Official Certificate Template (Background Image)
                  </label>
                  {settings.quiz_certificate_template && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      ✓ Custom Template Active
                    </span>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Template Preview Box */}
                  <div className="w-full lg:w-96 aspect-[1.414/1] bg-white border-2 border-slate-300 rounded-xl shadow-xs relative overflow-hidden flex flex-col justify-between p-3 text-center">
                    {settings.quiz_certificate_template ? (
                      <>
                        <img
                          src={settings.quiz_certificate_template}
                          alt="Certificate Template Preview"
                          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                        />
                        <div className="relative z-10 w-full h-full flex flex-col justify-between py-2 text-center pointer-events-none">
                          <div className="h-[30%]" />
                          <div className="space-y-0.5">
                            <div className="font-serif italic font-bold text-sm text-[#071a3a] drop-shadow-xs">
                              [Participant Name]
                            </div>
                            <div className="text-[9px] font-semibold text-slate-800">
                              [Designation]
                            </div>
                            <div className="text-[8px] font-bold font-mono text-slate-700">
                              PF No: 50400123456
                            </div>
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#071a3a] text-amber-300 text-[8px] font-bold rounded-full border border-amber-400">
                                Marks: 100 · Rank: #1
                              </span>
                            </div>
                          </div>
                          <div className="text-[7px] text-slate-500 font-mono">
                            CLW-VAW-2026-00001 · Dynamic Program Overlay
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <div className="text-xs font-bold text-slate-800">
                          Default Built-in Certificate Active
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Upload a custom certificate background (e.g. WhatsApp Image 2026-10-14 at 18.32.24.jpeg) to overlay Participant Name, Designation, PF No, Marks, and Rank.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upload the official certificate template background image. As per Vigilance guidelines, <strong>Participant Name</strong>, <strong>Designation</strong>, <strong>PF No</strong>, <strong>Marks</strong>, and <strong>Rank</strong> will be dynamically generated and imprinted on the certificate.
                    </p>

                    <input
                      type="file"
                      ref={templateFileInputRef}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleTemplateFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => templateFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{settings.quiz_certificate_template ? 'Change Certificate Template' : 'Upload Certificate Template (Image)'}</span>
                      </button>

                      {settings.quiz_certificate_template && (
                        <button
                          type="button"
                          onClick={handleRemoveTemplate}
                          className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                        >
                          Remove Template (Use Default)
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Supports JPEG / PNG / WEBP landscape images (e.g. WhatsApp Image 2026-10-14 at 18.32.24.jpeg).
                    </div>
                  </div>
                </div>
              </div>

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

              {/* Programme & Organization Settings (Updates Dashboard & Certificates) */}
              <div className="p-5 border border-blue-200 rounded-xl bg-blue-50/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-900" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                    Programme &amp; Organization Master Configuration
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Changing these fields automatically changes the public dashboard headers, titles, certificates, and reports.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organization Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.organization_name || ''}
                      onChange={e => setSettings({ ...settings, organization_name: e.target.value })}
                      placeholder="e.g. Chittaranjan Locomotive Works (CLW)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quiz / Programme Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.programme_name || ''}
                      onChange={e => setSettings({ ...settings, programme_name: e.target.value })}
                      placeholder="e.g. Vigilance Awareness Week 2026 Quiz Competition"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Period of Programme / Dates <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.programme_period || ''}
                      onChange={e => setSettings({ ...settings, programme_period: e.target.value })}
                      placeholder="e.g. 27th October to 2nd November 2026"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                  </div>
                </div>

                {/* New User Registration Control Toggle */}
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      New User Registration Access Control
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Enable or disable the public "New Registration" button. When disabled, only already registered users can log in with PF and password (123).
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.registration_enabled !== false}
                      onChange={e => setSettings({ ...settings, registration_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-xs font-bold text-slate-700">
                      {settings.registration_enabled !== false ? 'Registration ENABLED' : 'Registration DISABLED'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Signatory Text Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Officer Full Name (Who Issues Certificate)
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
                    Officer Designation
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
                    Issuing Organization / Division
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

              {/* Office Address & Home Screen Bottom Plate Details */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Home Screen Bottom Plate &amp; Official Contact Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Office / Department Address (Shown in Bottom Plate)
                    </label>
                    <input
                      type="text"
                      value={settings.contact_address || ''}
                      onChange={e => setSettings({ ...settings, contact_address: e.target.value })}
                      placeholder="e.g. Vigilance Department, Administrative Building, Chittaranjan..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={settings.contact_email || ''}
                      onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                      placeholder="e.g. cviclw@gmail.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Contact / Helpline Phone
                  </label>
                  <input
                    type="text"
                    value={settings.contact_phone || ''}
                    onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                    placeholder="e.g. 0341-2525555 / Rly: 22000"
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
                  <span>Save Master Settings &amp; Certificate Config</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB: DYNAMIC DEPARTMENTS & UNITS MANAGEMENT --- */}
      {activeTab === 'dept_units' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-950" />
                <span>Departments &amp; Units Master Management</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin can add new departments/units, rename them, or remove them. The registration form and common schedule update dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Departments Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Departments ({departments.length})</span>
                  </h4>
                </div>

                {/* Add Department Form */}
                <form onSubmit={handleAddDept} className="flex gap-2">
                  <input
                    type="text"
                    value={newDeptInput}
                    onChange={e => setNewDeptInput(e.target.value)}
                    placeholder="Enter new department name..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Departments List */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {departments.map((dept, idx) => (
                    <div key={`dept-manage-${dept}-${idx}`} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 text-xs">
                      {editingDeptItem?.original === dept ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingDeptItem.current}
                            onChange={e => setEditingDeptItem({ ...editingDeptItem, current: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs border border-blue-400 rounded"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateDept(editingDeptItem.original, editingDeptItem.current)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDeptItem(null)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-slate-800">{dept}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingDeptItem({ original: dept, current: dept })}
                              className="p-1 text-slate-500 hover:text-blue-950 hover:bg-slate-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDept(dept)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Units Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Units &amp; Workshops ({units.length})</span>
                  </h4>
                </div>

                {/* Add Unit Form */}
                <form onSubmit={handleAddUnit} className="flex gap-2">
                  <input
                    type="text"
                    value={newUnitInput}
                    onChange={e => setNewUnitInput(e.target.value)}
                    placeholder="Enter new workshop / unit name..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Units List */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {units.map((u, idx) => (
                    <div key={`unit-manage-${u}-${idx}`} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 text-xs">
                      {editingUnitItem?.original === u ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingUnitItem.current}
                            onChange={e => setEditingUnitItem({ ...editingUnitItem, current: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs border border-blue-400 rounded"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateUnit(editingUnitItem.original, editingUnitItem.current)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUnitItem(null)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-slate-800">{u}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingUnitItem({ original: u, current: u })}
                              className="p-1 text-slate-500 hover:text-blue-950 hover:bg-slate-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(u)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: DIRECT DATABASE TABLES EXPLORER & MODIFIER --- */}
      {activeTab === 'dbtables' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-900" />
                  <span>Direct Database Tables Access &amp; Modification</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Directly inspect database tables, edit rows, reset user passwords, and manage database records.
                </p>
              </div>

              {/* Table Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                {['participants', 'attempts', 'questions', 'departments', 'units', 'live_sessions', 'settings'].map(tbl => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => loadDbTable(tbl)}
                    className={`px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                      selectedDbTable === tbl
                        ? 'bg-blue-950 text-white border-blue-900 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>

            {dbTableMsg && (
              <div className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
                dbTableMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                <span>{dbTableMsg.text}</span>
                <button type="button" onClick={() => setDbTableMsg(null)} className="font-bold">✕</button>
              </div>
            )}

            {/* Table Search & Record Count */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dbTableSearch}
                  onChange={e => setDbTableSearch(e.target.value)}
                  placeholder={`Search in table "${selectedDbTable}"...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="text-xs font-mono text-slate-500">
                {dbTableData ? `${dbTableData.length} records in ${selectedDbTable}` : 'Loading...'}
              </div>
            </div>

            {/* Table Display */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
              {dbTableLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading table data...</span>
                </div>
              ) : dbTableData && dbTableData.length > 0 ? (
                <table className="w-full text-left font-mono">
                  <thead className="bg-[#071a3a] text-white">
                    <tr>
                      <th className="py-2.5 px-3">Actions</th>
                      {Object.keys(dbTableData[0] || {}).map(key => (
                        <th key={key} className="py-2.5 px-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                    {dbTableData
                      .filter(row => !dbTableSearch || JSON.stringify(row).toLowerCase().includes(dbTableSearch.toLowerCase()))
                      .slice(0, 50)
                      .map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 font-mono">
                          <td className="py-2 px-3 whitespace-nowrap space-x-1 font-sans">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDbRow(row);
                                setEditingDbJson(JSON.stringify(row, null, 2));
                              }}
                              className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            {selectedDbTable === 'participants' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setResetUserModal({ id: row.id, name: row.name, pf: row.pf_no });
                                  setResetUserPass('123');
                                }}
                                className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100"
                              >
                                Reset Pass
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDbRow(row)}
                              className="px-2 py-0.5 text-rose-700 border border-rose-200 rounded text-[10px] font-bold hover:bg-rose-50"
                            >
                              Del
                            </button>
                          </td>

                          {Object.keys(dbTableData[0] || {}).map(key => (
                            <td key={key} className="py-2 px-3 max-w-xs truncate" title={String(row[key])}>
                              {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  No records in table {selectedDbTable}.
                </div>
              )}
            </div>
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
                    <th className="py-2 px-3 text-right">Actions</th>
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
                      <td className="py-2 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleInspectAttempt(r.pf_no as any)}
                          className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-white rounded font-bold text-[10px] inline-flex items-center gap-1"
                          title="Inspect Attempt Questions & Answers"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Trace Q&amp;A</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetUserModal({ id: 0, name: r.name, pf: r.pf_no });
                            setResetUserPass('123');
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[10px]"
                          title="Reset User Password to default 123"
                        >
                          Reset Pass
                        </button>
                        <a
                          href={`?pf=${encodeURIComponent(r.pf_no)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-500 hover:text-slate-800 inline-block align-middle"
                          title="View Certificate"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
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

      {/* --- MODAL: ATTEMPT QUESTION-BY-QUESTION TRACE --- */}
      {inspectAttemptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Question-by-Question Attempt Trace
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Participant: <strong>{inspectAttemptModal.participant?.name}</strong> ({inspectAttemptModal.participant?.pf_no}) · Score: <strong className="text-blue-900 font-bold">{inspectAttemptModal.attempt?.score} / {inspectAttemptModal.attempt?.max_score}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectAttemptModal(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Department:</span>
                  <span className="font-bold text-slate-800">{inspectAttemptModal.participant?.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Designation:</span>
                  <span className="font-bold text-slate-800">{inspectAttemptModal.participant?.designation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit:</span>
                  <span className="font-bold text-slate-800">{inspectAttemptModal.participant?.unit_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submitted At:</span>
                  <span className="font-mono text-slate-800">{inspectAttemptModal.attempt?.submitted_at?.slice(0, 16)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Attempt Questions ({inspectAttemptModal.questions?.length || 0})
                </h4>

                {inspectAttemptModal.questions?.map((q: any) => (
                  <div
                    key={q.question_index}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      q.is_correct
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : q.is_skipped
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        Q{q.question_index + 1}. {q.question_text}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        q.is_correct
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.is_skipped
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {q.is_correct ? '+100 Correct' : q.is_skipped ? '0 Skipped' : '-50 Wrong'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Answer:</span>
                        <span className={q.is_correct ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {q.selected_option_text || '(Not Answered)'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Correct Answer:</span>
                        <span className="text-emerald-800 font-bold">
                          {q.correct_option_text}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setInspectAttemptModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: RESET USER PASSWORD --- */}
      {resetUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset Participant Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reset login credentials for <strong>{resetUserModal.name}</strong> (PF: {resetUserModal.pf}). Default is <code className="font-bold text-amber-700">123</code>.
            </p>

            <form onSubmit={handleResetUserPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={resetUserPass}
                  onChange={e => setResetUserPass(e.target.value)}
                  placeholder="e.g. 123"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono"
                />
              </div>

              {resetUserMsg && (
                <div className={`p-2.5 rounded-lg text-xs ${
                  resetUserMsg.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {resetUserMsg.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetUserModal(null);
                    setResetUserMsg(null);
                  }}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-xs"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: LIVE SESSION PARTICIPANT HISTORY --- */}
      {selectedSessionHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Live Session History: {selectedSessionHistory.title}
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Session ID: <strong>{selectedSessionHistory.id}</strong> · Scheduled: {selectedSessionHistory.scheduled_at} · Status: <strong>{selectedSessionHistory.status}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionHistory(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Leaderboard Table of Session */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Session Final Leaderboard ({selectedSessionHistory.history?.leaderboard?.length || 0} Participants)
                </h4>

                {selectedSessionHistory.history?.leaderboard && selectedSessionHistory.history.leaderboard.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#071a3a] text-white">
                        <tr>
                          <th className="py-2 px-3">Rank</th>
                          <th className="py-2 px-3">PF No</th>
                          <th className="py-2 px-3">Participant Name</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3 text-right">Score</th>
                          <th className="py-2 px-3 text-right">Time Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {selectedSessionHistory.history.leaderboard.map((lb: any) => (
                          <tr key={lb.id || lb.pf} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold font-mono">#{lb.rank}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-blue-950">{lb.pf}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{lb.name}</td>
                            <td className="py-2 px-3 text-slate-600">{lb.department}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{lb.score} pts</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">{lb.totalTimeTaken}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    No completed quiz history recorded for this session yet.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedSessionHistory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Close Session History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: DB ROW EDITOR --- */}
      {editingDbRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Edit Table Record: {selectedDbTable}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Modify the JSON values below and click Save Changes to persist directly into database.
            </p>

            <form onSubmit={handleSaveDbRowEdit} className="space-y-4">
              <textarea
                rows={12}
                value={editingDbJson}
                onChange={e => setEditingDbJson(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDbRow(null)}
                  className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
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
