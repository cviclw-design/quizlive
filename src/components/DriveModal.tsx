import React, { useState, useEffect } from 'react';
import { googleSignIn, googleLogout, getAccessToken, initAuth } from '../services/googleAuth';
import { DriveService, DriveFileItem } from '../services/driveService';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';
import { User } from 'firebase/auth';
import {
  Folder,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  LogOut,
  HardDrive
} from 'lucide-react';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'view' | 'backup_results';
}

export const DriveModal: React.FC<DriveModalProps> = ({ isOpen, onClose, initialAction = 'view' }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<DriveFileItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        loadFiles(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setFiles([]);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const loadFiles = async (accessToken: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const driveFiles = await DriveService.listAppFiles(accessToken);
      setFiles(driveFiles);
    } catch (err: unknown) {
      console.error('Error listing Drive files:', err);
      setStatusMessage({ text: (err as Error).message || 'Failed to load files from Google Drive', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    soundEffects.playClick();
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        soundEffects.playCorrect();
        loadFiles(result.accessToken);
      }
    } catch (err: unknown) {
      setStatusMessage({ text: (err as Error).message || 'Failed to sign in with Google', isError: true });
      soundEffects.playIncorrect();
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    soundEffects.playClick();
    await googleLogout();
    setUser(null);
    setToken(null);
    setFiles([]);
    setStatusMessage({ text: 'Signed out from Google Drive' });
  };

  const handleBackupResults = async () => {
    if (!token) return;
    soundEffects.playClick();
    setLoading(true);
    setStatusMessage(null);
    try {
      // Fetch results
      const res = await api.getAdminResults();
      if (!res.ok) throw new Error('Failed to retrieve results from server');

      let csv = 'PF,Name,Designation,Department,Unit,Mobile,Status,Score,Max Marks,Submitted At\n';
      res.results.forEach(r => {
        csv += `"${r.pf_no}","${r.name}","${r.designation}","${r.department}","${r.unit_name}","${r.mobile}","${r.status}",${r.score !== null && r.score !== undefined ? r.score : ''},${r.max_score || ''},"${r.submitted_at || ''}"\n`;
      });

      const uploaded = await DriveService.backupResultsToDrive(token, csv);
      soundEffects.playCorrect();
      setStatusMessage({ text: `Results backup successfully created in Google Drive: ${uploaded.name}` });
      loadFiles(token);
    } catch (err: unknown) {
      soundEffects.playIncorrect();
      setStatusMessage({ text: (err as Error).message || 'Failed to backup results to Drive', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupQuestions = async () => {
    if (!token) return;
    soundEffects.playClick();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.getAdminQuestions();
      if (!res.ok) throw new Error('Failed to retrieve questions from server');

      const jsonStr = JSON.stringify(res.questions, null, 2);
      const uploaded = await DriveService.backupQuestionsToDrive(token, jsonStr);
      soundEffects.playCorrect();
      setStatusMessage({ text: `Question bank backup created in Google Drive: ${uploaded.name}` });
      loadFiles(token);
    } catch (err: unknown) {
      soundEffects.playIncorrect();
      setStatusMessage({ text: (err as Error).message || 'Failed to backup questions to Drive', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (file: DriveFileItem) => {
    if (!token) return;
    soundEffects.playClick();
    setLoading(true);
    try {
      await DriveService.deleteFile(token, file.id);
      soundEffects.playCorrect();
      setStatusMessage({ text: `File "${file.name}" was permanently removed from Google Drive.` });
      setDeleteConfirmFile(null);
      loadFiles(token);
    } catch (err: unknown) {
      soundEffects.playIncorrect();
      setStatusMessage({ text: (err as Error).message || 'Failed to delete file from Drive', isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-950 shrink-0">
            <HardDrive className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#071a3a]">
              Google Drive Cloud Storage
            </h2>
            <p className="text-xs text-slate-500">
              Folder: <span className="font-semibold text-slate-700">CLW Vigilance Awareness Week 2026</span>
            </p>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}
          >
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Auth Section */}
        {!user || !token ? (
          <div className="text-center py-8 px-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
            <HardDrive className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Connect Google Drive
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              Sign in with your Google Account to save quiz certificates, download spreadsheets, and back up vigilance records directly to your Google Drive.
            </p>

            {/* Official Material Google Sign-In Button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:shadow-md hover:bg-slate-50 transition-all font-semibold text-xs text-slate-700 mx-auto cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{loading ? 'Connecting Google Account...' : 'Sign in with Google to Connect Drive'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected User Account Bar */}
            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-9 h-9 rounded-full border border-blue-300"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {user.displayName || 'Google Drive User'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadFiles(token)}
                  disabled={loading}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                  title="Refresh files"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>

            {/* Quick Actions (Backup to Drive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleBackupResults}
                disabled={loading}
                className="p-3.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/50 text-left transition-colors flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-xs text-blue-950 mb-0.5">Backup Results to Drive</div>
                  <div className="text-[11px] text-slate-500">Save 100+ participant scores as CSV</div>
                </div>
                <UploadCloud className="w-4 h-4 text-blue-800" />
              </button>

              <button
                onClick={handleBackupQuestions}
                disabled={loading}
                className="p-3.5 rounded-xl border border-amber-200 bg-white hover:bg-amber-50/50 text-left transition-colors flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-xs text-amber-950 mb-0.5">Backup Questions to Drive</div>
                  <div className="text-[11px] text-slate-500">Save question bank to cloud</div>
                </div>
                <UploadCloud className="w-4 h-4 text-amber-800" />
              </button>
            </div>

            {/* Files List in Drive Folder */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-600" />
                  <span>Files in "CLW Vigilance Awareness Week 2026" ({files.length})</span>
                </span>
                <span className="text-slate-400 font-normal">Synced with Google Drive</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {files.map(f => (
                  <div key={f.id} className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{f.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : ''} · {f.size ? `${Math.round(Number(f.size) / 1024)} KB` : 'Folder / File'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {f.webViewLink && (
                        <a
                          href={f.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteConfirmFile(f)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete file from Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {files.length === 0 && !loading && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No files found in the CLW Vigilance folder yet. Save a certificate or click Backup above.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Confirmation Dialog for Deleting Drive File */}
        {deleteConfirmFile && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-700 mb-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{deleteConfirmFile.name}"</strong> from your Google Drive? This operation modifies your cloud storage and cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmFile(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFile(deleteConfirmFile)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Delete from Drive
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
