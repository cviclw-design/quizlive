import React, { useRef, useState } from 'react';
import { CertificateData } from '../services/api';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  Share2,
  HardDrive,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ShareModal } from './ShareModal';
import { DriveModal } from './DriveModal';
import { googleSignIn, getAccessToken } from '../services/googleAuth';
import { DriveService } from '../services/driveService';
import { soundEffects } from '../utils/audio';

interface ClwCertificateViewProps {
  cert: CertificateData;
  onHome?: () => void;
}

export const ClwCertificateView: React.FC<ClwCertificateViewProps> = ({ cert, onHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [savingToDrive, setSavingToDrive] = useState(false);
  const [driveSavedUrl, setDriveSavedUrl] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  /**
   * High-resolution 2000px Canvas painter
   */
  const paintCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas element not available'));
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('2D Context not available'));
        return;
      }

      const W = canvas.width; // 2000
      const H = canvas.height; // 1414
      ctx.clearRect(0, 0, W, H);

      // If Admin uploaded a Certificate Template (or default official template)
      const templateSrc = cert.quiz_certificate_template || '/template_cert.jpg';
      if (templateSrc) {
        const tplImg = new Image();
        tplImg.crossOrigin = 'anonymous';
        tplImg.onload = () => {
          // Precise 1536 x 1024 resolution matching template aspect ratio (1.5 / 3:2)
          const W = 1536;
          const H = 1024;
          canvas.width = W;
          canvas.height = H;
          ctx.drawImage(tplImg, 0, 0, W, H);

          // Single line: Participant Name and Designation only
          const singleLineText = cert.designation
            ? `${cert.name}, ${cert.designation}`
            : cert.name;

          // Dynamically adjust font size to guarantee a perfect single line
          let fontSize = 28;
          ctx.font = `bold ${fontSize}px Georgia, "Playfair Display", serif`;
          while (ctx.measureText(singleLineText).width > 820 && fontSize > 16) {
            fontSize -= 1;
            ctx.font = `bold ${fontSize}px Georgia, "Playfair Display", serif`;
          }

          // Render above the dotted line (dotted line is at row y = 612, blank area is y = 556-608)
          ctx.fillStyle = '#071a3a';
          ctx.textAlign = 'center';
          ctx.fillText(singleLineText, W / 2, 598);

          resolve(canvas);
        };
        tplImg.onerror = () => {
          paintStandard();
        };
        tplImg.src = templateSrc;
        return;
      }

      paintStandard();

      function paintStandard() {
        if (!ctx) return;
        // Parchment cream gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#fffdf8');
        bgGrad.addColorStop(1, '#fff5e6');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

      // Double borders: Navy and Gold
      ctx.strokeStyle = '#071a3a';
      ctx.lineWidth = 26;
      ctx.strokeRect(34, 34, W - 68, H - 68);

      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 8;
      ctx.strokeRect(60, 60, W - 120, H - 120);

      // Indian Tricolor Stripe Accent at top inner
      ctx.fillStyle = '#ff8a1e';
      ctx.fillRect(76, 76, W - 152, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(76, 88, W - 152, 8);
      ctx.fillStyle = '#128a45';
      ctx.fillRect(76, 96, W - 152, 12);

      // Draw Indian Railways Logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => finishCanvasPaint(logoImg);
      logoImg.onerror = () => finishCanvasPaint(null);
      logoImg.src = cert.logo_url || 'https://raw.githubusercontent.com/swrvaw/swrvaw.github.io/gh-pages/static/media/logo.8b9ced028d0a93767ec0.png';

      function finishCanvasPaint(logo: HTMLImageElement | null) {
        if (!ctx) return;
        if (logo) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(240, 245, 75, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.clip();
          ctx.drawImage(logo, 165, 170, 150, 150);
          ctx.restore();

          ctx.strokeStyle = '#d4a017';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(240, 245, 78, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Header Texts
        ctx.fillStyle = '#8a6a12';
        ctx.font = '800 26px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('INDIAN RAILWAYS', 360, 210);

        ctx.fillStyle = '#071a3a';
        ctx.font = '800 48px Georgia, serif';
        ctx.fillText('Chittaranjan Locomotive Works', 360, 268);

        ctx.font = '600 26px Outfit, sans-serif';
        ctx.fillStyle = '#445566';
        ctx.fillText('Vigilance Department  ·  Chittaranjan', 360, 314);

        // Ribbon
        ctx.beginPath();
        roundRect(ctx, 620, 350, 760, 52, 26);
        ctx.fillStyle = '#071a3a';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VIGILANCE AWARENESS WEEK 2026', 1000, 384);

        // Certificate Title
        ctx.fillStyle = '#071a3a';
        ctx.font = '800 62px Georgia, serif';
        ctx.fillText('Certificate of Participation', 1000, 485);

        ctx.fillStyle = '#8a6a12';
        ctx.font = '700 22px Outfit, sans-serif';
        const sloganText = `${cert.slogan_hindi || 'सत्यनिष्ठा से समृद्धि'}   ·   ${cert.slogan_english || 'Probity for Prosperity'}`;
        ctx.fillText(sloganText, 1000, 532);

        // Body text 1
        ctx.fillStyle = '#334455';
        ctx.font = '500 28px Outfit, sans-serif';
        ctx.fillText('This is to certify that', 1000, 605);

        // Participant Name
        ctx.fillStyle = '#9a3412';
        ctx.font = 'italic 62px Georgia, serif';
        ctx.fillText(cert.name, 1000, 690);

        // Meta info (PF, Dept, Unit)
        ctx.fillStyle = '#071a3a';
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.fillText(`PF ${cert.pf}   ·   ${cert.designation}   ·   ${cert.department}   ·   ${cert.unit}`, 1000, 750);

        // Participation Statement
        ctx.fillStyle = '#334455';
        ctx.font = '500 24px Outfit, sans-serif';
        const bodyText = 'has participated in the Online Quiz Competition organised by the Vigilance Department, Chittaranjan Locomotive Works, during Vigilance Awareness Week 2026.';
        wrapText(ctx, bodyText, 1000, 805, 1400, 34);

        // Score Box
        ctx.beginPath();
        roundRect(ctx, 320, 940, 1360, 115, 20);
        ctx.fillStyle = '#071a3a';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Marks:  ${cert.score}`, 360, 1005);
        ctx.fillText(`Rank:  #${cert.rank || 1}`, 620, 1005);
        ctx.fillText(`Participation ID:  ${cert.certificate_no}`, 840, 1005);
        ctx.fillText(`Date:  ${new Date(cert.submitted_at || Date.now()).toLocaleDateString('en-IN')}`, 1340, 1005);

        // Official Stamp Seal on left
        ctx.save();
        ctx.beginPath();
        ctx.arc(280, 1220, 68, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4a017';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#8a6a12';
        ctx.font = '800 15px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLW', 280, 1210);
        ctx.fillText('VIGILANCE', 280, 1230);
        ctx.fillText('CHITTARANJAN', 280, 1250);
        ctx.restore();

        // Right: Signature Block (Using uploaded photo if available)
        if (cert.signature_photo) {
          const sigImg = new Image();
          sigImg.crossOrigin = 'anonymous';
          sigImg.onload = () => {
            ctx.drawImage(sigImg, 1340, 1100, 240, 85);
            drawSignText();
          };
          sigImg.onerror = () => {
            drawScriptFallback();
            drawSignText();
          };
          sigImg.src = cert.signature_photo;
        } else {
          drawScriptFallback();
          drawSignText();
        }

        function drawScriptFallback() {
          if (!ctx) return;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#071a3a';
          ctx.font = 'italic 48px Georgia, serif';
          ctx.fillText(cert.cvo_name || 'Sugind Surendran', 1460, 1160);
        }

        function drawSignText() {
          if (!ctx || !canvas) return;
          ctx.strokeStyle = '#d4a017';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(1280, 1195);
          ctx.lineTo(1640, 1195);
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#111827';
          ctx.font = '700 22px Outfit, sans-serif';
          ctx.fillText(cert.cvo_name || 'Sugind Surendran', 1460, 1230);

          ctx.fillStyle = '#4b5563';
          ctx.font = '500 18px Outfit, sans-serif';
          ctx.fillText(cert.cvo_designation || 'SDGM & Chief Vigilance Officer', 1460, 1260);
          ctx.fillText(cert.cvo_organization || 'Chittaranjan Locomotive Works, Chittaranjan', 1460, 1288);

          resolve(canvas);
        }
      }
    }
  });
};

  const handleDownloadPng = async () => {
    soundEffects.playClick();
    try {
      const canvas = await paintCanvas();
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${cert.certificate_no}-${cert.pf}.png`;
      a.click();
    } catch (err) {
      console.error('Download PNG failed', err);
    }
  };

  const handleSaveToDrive = async () => {
    soundEffects.playClick();
    setSavingToDrive(true);
    setDriveError(null);
    setDriveSavedUrl(null);

    try {
      // 1. Ensure token
      let token = await getAccessToken();
      if (!token) {
        const authResult = await googleSignIn();
        if (!authResult) throw new Error('Google Sign-In was cancelled');
        token = authResult.accessToken;
      }

      // 2. Render canvas and convert to Blob
      const canvas = await paintCanvas();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob'));
        }, 'image/png');
      });

      // 3. Upload to Google Drive
      const uploaded = await DriveService.saveCertificateToDrive(
        token,
        cert.certificate_no,
        cert.pf,
        cert.name,
        blob
      );

      soundEffects.playCorrect();
      setDriveSavedUrl(uploaded.webViewLink || 'https://drive.google.com');
    } catch (err: unknown) {
      console.error('Save to Google Drive failed:', err);
      soundEffects.playIncorrect();
      setDriveError((err as Error).message || 'Failed to save certificate to Google Drive');
    } finally {
      setSavingToDrive(false);
    }
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];
    words.forEach(w => {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > max) {
        lines.push(line);
        line = w;
      } else {
        line = t;
      }
    });
    lines.push(line);
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
  }

  const formattedDate = new Date(cert.submitted_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top Action Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Participation Certificate Generated
          </h2>
          <p className="text-xs text-slate-500">
            Issued under authority of {cert.cvo_name || 'Shri Sugind Surendran'}, {cert.cvo_designation || 'SDGM & CVO'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onHome && (
            <button
              onClick={onHome}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print (Landscape PDF)</span>
          </button>

          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG (Landscape)</span>
          </button>

          {/* Save to Google Drive Button */}
          <button
            onClick={handleSaveToDrive}
            disabled={savingToDrive}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            title="Save certificate directly to Google Drive"
          >
            {savingToDrive ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Drive...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>Save to Google Drive</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setShareOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#ff8a1e] hover:bg-[#e87610] text-[#071a3a] text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Quiz Link</span>
          </button>
        </div>
      </div>

      {/* Google Drive Status Notification */}
      {driveSavedUrl && (
        <div className="no-print mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Successfully saved to your Google Drive!</strong>
              <span>Folder: "CLW Vigilance Awareness Week 2026"</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={driveSavedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors"
            >
              <span>Open in Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setDriveModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Browse Files
            </button>
          </div>
        </div>
      )}

      {driveError && (
        <div className="no-print mb-6 p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{driveError}</span>
          </div>
          <button
            onClick={() => setDriveError(null)}
            className="text-xs font-bold text-rose-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* HTML / Printable Certificate Frame */}
      {cert.quiz_certificate_template || true ? (
        <article className="certificate-print-area relative bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden w-full aspect-[1.5/1]">
          {/* Certificate Template Background */}
          <img
            src={cert.quiz_certificate_template || '/template_cert.jpg'}
            alt="Participation Certificate"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
          />

          {/* Participant Name and Designation ONLY - in a SINGLE line, directly ABOVE the dotted line */}
          <div className="absolute top-[55.2%] left-0 right-0 z-10 flex items-center justify-center text-center px-6 sm:px-12 pointer-events-none">
            <span className="font-serif font-bold text-[#071a3a] text-xs sm:text-base md:text-xl lg:text-2xl drop-shadow-xs tracking-wide truncate max-w-[85%]">
              {cert.name}{cert.designation ? `, ${cert.designation}` : ''}
            </span>
          </div>
        </article>
      ) : (
        <article className="certificate-print-area relative bg-[#fffdf8] border-8 border-[#071a3a] rounded-2xl p-6 sm:p-10 shadow-lg text-slate-900 overflow-hidden w-full aspect-[1.414/1] flex flex-col justify-between">
          {/* Inner Gold Border */}
          <div className="border-4 border-[#d4a017] rounded-xl p-6 sm:p-8 text-center relative bg-gradient-to-b from-white/90 via-amber-50/15 to-amber-50/30 flex-1 flex flex-col justify-between">
            
            {/* Top Indian Tricolor Stripe */}
            <div className="absolute top-2 left-6 right-6 h-2 rounded-full overflow-hidden flex shadow-xs">
              <div className="flex-1 bg-[#ff8a1e]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#128a45]" />
            </div>

            {/* Header with Emblem */}
            <div className="flex items-center justify-center gap-4 text-left pt-4 mb-2">
              <img
                src={cert.logo_url || 'https://raw.githubusercontent.com/swrvaw/swrvaw.github.io/gh-pages/static/media/logo.8b9ced028d0a93767ec0.png'}
                alt="Indian Railways Emblem"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full border-2 border-[#d4a017] bg-white p-1 shrink-0 shadow-xs"
              />
              <div>
                <div className="text-[11px] sm:text-xs font-bold tracking-widest text-[#8a6a12] uppercase">
                  INDIAN RAILWAYS
                </div>
                <h1 className="text-xl sm:text-3xl font-serif font-bold text-[#071a3a] leading-tight">
                  Chittaranjan Locomotive Works
                </h1>
                <div className="text-xs text-slate-600 font-medium">
                  Vigilance Department · Chittaranjan
                </div>
              </div>
            </div>

            {/* VAW Ribbon */}
            <div className="my-2">
              <span className="inline-block px-5 py-1.5 bg-[#071a3a] text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-xs">
                VIGILANCE AWARENESS WEEK 2026
              </span>
            </div>

            {/* Certificate Title */}
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#071a3a] mt-1 mb-0.5">
              Certificate of Participation
            </h2>
            <div className="text-xs sm:text-sm text-[#8a6a12] font-bold tracking-wider mb-2">
              {cert.slogan_hindi || 'सत्यनिष्ठा से समृद्धि'} · {cert.slogan_english || 'Probity for Prosperity'}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 italic mb-1">
              This is to certify that
            </p>

            {/* Recipient Name in Calligraphic / Serif Style */}
            <div className="my-2 py-1">
              <div className="text-3xl sm:text-5xl font-serif italic font-bold text-[#9a3412] tracking-wide">
                {cert.name}
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-700 my-3">
              <span className="bg-white border border-amber-300 px-3 py-1 rounded-full">
                PF: {cert.pf}
              </span>
              <span className="bg-white border border-amber-300 px-3 py-1 rounded-full">
                {cert.designation}
              </span>
              <span className="bg-white border border-amber-300 px-3 py-1 rounded-full">
                {cert.department}
              </span>
              <span className="bg-white border border-amber-300 px-3 py-1 rounded-full">
                {cert.unit}
              </span>
            </div>

            {/* Body Paragraph */}
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed mt-2 mb-6">
              has participated in the Online Quiz Competition organised by the Vigilance Department, Chittaranjan Locomotive Works, during Vigilance Awareness Week 2026.
            </p>

            {/* Score & Participation Bar */}
            <div className="max-w-2xl mx-auto bg-[#071a3a] text-white rounded-xl p-3 sm:p-4 flex items-center justify-between gap-4 mb-8 shadow-sm">
              <div className="text-left">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Marks Obtained</span>
                <span className="text-xl sm:text-2xl font-bold font-mono">
                  {cert.score}
                </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Rank</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
                  #{cert.rank || 1}
                </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Participation ID</span>
                <span className="text-xs sm:text-sm font-mono font-bold">
                  {cert.certificate_no}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Date</span>
                <span className="text-xs sm:text-sm font-semibold">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Signatures & Seal Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-amber-200/60 mt-4">
              {/* Left Seal */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#d4a017] flex flex-col items-center justify-center text-center p-2 text-[#8a6a12] select-none transform -rotate-6 bg-white/60 shadow-xs">
                <span className="text-[10px] font-extrabold tracking-wider leading-tight">CLW</span>
                <span className="text-[9px] font-bold tracking-wider leading-tight">VIGILANCE</span>
                <span className="text-[8px] font-semibold tracking-wider leading-tight">CHITTARANJAN</span>
              </div>

              {/* Right: Signature Photo & Signatory */}
              <div className="text-center sm:text-right min-w-[240px]">
                <div className="h-16 flex items-center justify-center sm:justify-end mb-1">
                  {cert.signature_photo ? (
                    <img
                      src={cert.signature_photo || undefined}
                      alt="SDGM & CVO Signature"
                      className="max-h-16 max-w-[200px] object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="font-serif italic text-2xl text-[#071a3a] font-bold">
                      {cert.cvo_name || 'Sugind Surendran'}
                    </div>
                  )}
                </div>

                <div className="w-48 h-px bg-[#d4a017] mx-auto sm:ml-auto mb-1.5" />

                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {cert.cvo_name || 'Sugind Surendran'}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {cert.cvo_designation || 'SDGM & Chief Vigilance Officer'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {cert.cvo_organization || 'Chittaranjan Locomotive Works, Chittaranjan'}
                </div>
              </div>
            </div>

          </div>
        </article>
      )}

      {/* Hidden high-res canvas for 2000px PNG rendering */}
      <canvas ref={canvasRef} width={2000} height={1414} className="hidden" />

      <div className="no-print mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-3">
        <span>Click "Download PNG" for high-resolution certificate, "Print Certificate" for PDF, or "Save to Google Drive" to backup to your cloud.</span>
        <button
          onClick={() => setDriveModalOpen(true)}
          className="text-blue-900 font-bold hover:underline inline-flex items-center gap-1"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Manage Drive Files</span>
        </button>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <DriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
      />
    </div>
  );
};
