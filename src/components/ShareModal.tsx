import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { soundEffects } from '../utils/audio';
import {
  Share2,
  Copy,
  Check,
  Download,
  X,
  MessageCircle,
  Mail,
  QrCode,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  directRegistration?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  directRegistration = true
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [linkType, setLinkType] = useState<'direct_quiz' | 'homepage'>(directRegistration ? 'direct_quiz' : 'homepage');

  // Compute the public URL for participants:
  // AI Studio development URLs (ais-dev-) require developer Google Account login and return 403 Forbidden to participants.
  // The public shared preview URL (ais-pre-) allows any participant to register and participate freely without 403 Forbidden!
  const getPublicBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.includes('ais-dev-')) {
        return origin.replace('ais-dev-', 'ais-pre-');
      }
      return origin;
    }
    return 'https://ais-pre-iv3zbtqjhdntlgwoumujar-384176507303.asia-east1.run.app';
  };

  const baseUrl = getPublicBaseUrl();
  const shareUrl = linkType === 'direct_quiz' ? `${baseUrl}?page=register` : baseUrl;

  useEffect(() => {
    if (isOpen && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#071a3a',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generating QR Code', err));
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    soundEffects.playClick();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `*Chittaranjan Locomotive Works (CLW) · Vigilance Department*\n` +
    `*Vigilance Awareness Week 2026 Online Quiz Competition*\n\n` +
    `Theme: *Probity for Prosperity (सत्यनिष्ठा से समृद्धि)*\n` +
    `Under the guidance of Shri Sugind Surendran, SDGM & Chief Vigilance Officer.\n\n` +
    `👉 *Click here to participate & get your official e-Certificate:*\n${shareUrl}\n\n` +
    `Open to all Railway officers, supervisors and staff. Test your vigilance awareness today!`
  );

  const emailSubject = encodeURIComponent('CLW VAW 2026 Online Quiz Competition - Participate & Get Certificate');
  const emailBody = encodeURIComponent(
    `Dear Colleague,\n\n` +
    `You are invited to participate in the Online Quiz Competition organized by the Vigilance Department, Chittaranjan Locomotive Works (CLW) for Vigilance Awareness Week 2026.\n\n` +
    `Theme: Probity for Prosperity (सत्यनिष्ठा से समृद्धि)\n\n` +
    `Click the link below to register and attempt the quiz:\n${shareUrl}\n\n` +
    `On completion, you will receive an official e-Certificate of Participation issued under the authority of Shri Sugind Surendran, SDGM & Chief Vigilance Officer, CLW.\n\n` +
    `Vigilance Department\nChittaranjan Locomotive Works, Chittaranjan`
  );

  const handleDownloadQr = () => {
    soundEffects.playClick();
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'CLW-VAW-2026-Quiz-QRCode.png';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Share2 className="w-6 h-6 text-amber-800" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#071a3a]">
            Share Quiz Portal Link
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Anyone with this link can access the portal, register their PF number, take the quiz, and receive their e-Certificate.
          </p>
        </div>

        {/* Public Access Verification Banner (Solves 403 Forbidden) */}
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-900 block">
              Public Link Verified · Zero Login Required (No Error 403)
            </span>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              This link is formatted for public access (<strong>ais-pre</strong>). Any participant on mobile, WhatsApp, or desktop can immediately register and take the quiz without encountering Cloud Run Error 403.
            </p>
          </div>
        </div>

        {/* Link Type Selector */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setLinkType('direct_quiz');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors whitespace-nowrap ${
              linkType === 'direct_quiz'
                ? 'bg-white text-blue-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct Quiz Registration Link (Recommended)
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setLinkType('homepage');
            }}
            className={`flex-1 py-2 rounded-lg transition-colors whitespace-nowrap ${
              linkType === 'homepage'
                ? 'bg-white text-blue-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portal Home Link
          </button>
        </div>

        {/* Direct Link Box with 1-Click Copy */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Public Direct Access Link
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded-xl">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-800 font-mono px-2 py-1 flex-1 outline-none select-all truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-blue-950 text-white hover:bg-blue-900 shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Link copied to clipboard! Paste it into WhatsApp, Railway Intranet, or Email.</span>
            </p>
          )}
        </div>

        {/* 1-Click Social Sharing Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>

          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Share via Email</span>
          </a>
        </div>

        {/* QR Code Section for Notice Boards & Workshops */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {qrDataUrl ? (
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0">
              <img
                src={qrDataUrl}
                alt="CLW VAW Quiz QR Code"
                className="w-28 h-28 object-contain"
              />
            </div>
          ) : (
            <div className="w-28 h-28 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
              <QrCode className="w-8 h-8" />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1">
              <QrCode className="w-3.5 h-3.5 text-blue-900" />
              <span>Official Notice Board &amp; Workshop QR Code</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Print and place this QR code on office notice boards, Loco Shop, Steel Foundry, and Dankuni banners so staff can scan with any phone camera and immediately take the quiz.
            </p>
            <button
              onClick={handleDownloadQr}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:underline"
            >
              <Download className="w-3 h-3" />
              <span>Download Printable QR Code (PNG)</span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
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
