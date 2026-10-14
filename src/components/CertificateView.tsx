import React, { useRef, useState, useEffect } from 'react';
import { CrestEmblem, SealStamp } from './CrestEmblem';
import { Printer, Download, ArrowLeft, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface CertificateProps {
  type: 'pledge' | 'quiz';
  recipientName: string;
  designation?: string;
  organization?: string;
  date: string;
  certificateId: string;
  quizScore?: number;
  totalQuestions?: number;
  signaturePhoto?: string | null;
  certificateTemplate?: string | null;
  cvoName?: string;
  cvoDesignation?: string;
  cvoOrganization?: string;
  sloganHindi?: string;
  sloganEnglish?: string;
  onBack?: () => void;
}

export const CertificateView: React.FC<CertificateProps> = ({
  type,
  recipientName,
  designation,
  organization,
  date,
  certificateId,
  quizScore,
  totalQuestions,
  signaturePhoto: initialSig,
  certificateTemplate: initialTpl,
  cvoName: initialCvoName,
  cvoDesignation: initialCvoDesig,
  cvoOrganization: initialCvoOrg,
  sloganHindi: initialSloganHi,
  sloganEnglish: initialSloganEn,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fallback to fetch system settings if props were omitted
  const [signaturePhoto, setSignaturePhoto] = useState<string | null>(initialSig || null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(initialTpl || null);
  const [cvoName, setCvoName] = useState<string>(initialCvoName || 'Sugind Surendran');
  const [cvoDesignation, setCvoDesignation] = useState<string>(initialCvoDesig || 'SDGM & Chief Vigilance Officer');
  const [cvoOrganization, setCvoOrganization] = useState<string>(initialCvoOrg || 'Chittaranjan Locomotive Works, Chittaranjan');
  const [sloganHindi, setSloganHindi] = useState<string>(initialSloganHi || 'सत्यनिष्ठा से समृद्धि');
  const [sloganEnglish, setSloganEnglish] = useState<string>(initialSloganEn || 'Probity for Prosperity');

  useEffect(() => {
    api.getHome().then(res => {
      if (res.ok && res.settings) {
        if (!initialSig && res.settings.signature_photo) setSignaturePhoto(res.settings.signature_photo);
        if (!initialTpl) {
          const tpl = res.settings.pledge_certificate_template || res.settings.quiz_certificate_template || null;
          if (tpl) setTemplateUrl(tpl);
        }
        if (res.settings.cvo_name) setCvoName(res.settings.cvo_name);
        if (res.settings.cvo_designation) setCvoDesignation(res.settings.cvo_designation);
        if (res.settings.cvo_organization) setCvoOrganization(res.settings.cvo_organization);
        if (res.settings.slogan_hindi) setSloganHindi(res.settings.slogan_hindi);
        if (res.settings.slogan_english) setSloganEnglish(res.settings.slogan_english);
      }
    }).catch(() => {});
  }, [initialSig, initialTpl]);

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  /**
   * High-resolution 2000x1414 Landscape Canvas Painter
   */
  const paintLandscapeCanvas = (): Promise<HTMLCanvasElement> => {
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

      // If Admin uploaded a template, paint it as the background and overlay Name & Designation only
      if (templateUrl) {
        const tplImg = new Image();
        tplImg.crossOrigin = 'anonymous';
        tplImg.onload = () => {
          ctx.drawImage(tplImg, 0, 0, W, H);

          // Only name and designation will show through program
          ctx.fillStyle = '#071a3a';
          ctx.font = 'bold italic 76px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(recipientName || 'Valued Public Servant', W / 2, 700);

          if (designation) {
            ctx.fillStyle = '#1e293b';
            ctx.font = '600 34px Outfit, sans-serif';
            ctx.fillText(designation, W / 2, 770);
          }

          // Sub-footer verification
          ctx.fillStyle = '#64748b';
          ctx.font = '500 20px Outfit, sans-serif';
          ctx.fillText(`Pledge ID: ${certificateId}   ·   Date: ${date}`, W / 2, 1340);

          resolve(canvas);
        };
        tplImg.onerror = () => {
          paintStandard();
        };
        tplImg.src = templateUrl;
        return;
      }

      paintStandard();

      function paintStandard() {
        if (!ctx) return;
        // Cream Parchment Background
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#fffefb');
        bgGrad.addColorStop(1, '#fff8ee');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

      // Double Outer Border (Navy & Gold)
      ctx.strokeStyle = '#071a3a';
      ctx.lineWidth = 26;
      ctx.strokeRect(34, 34, W - 68, H - 68);

      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 8;
      ctx.strokeRect(60, 60, W - 120, H - 120);

      // Indian Tricolor Stripe Accent
      ctx.fillStyle = '#ff8a1e';
      ctx.fillRect(76, 76, W - 152, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(76, 88, W - 152, 8);
      ctx.fillStyle = '#128a45';
      ctx.fillRect(76, 96, W - 152, 12);

      // Ornate Corner Accents
      drawCornerAccent(ctx, 80, 110);
      drawCornerAccent(ctx, W - 80, 110, true, false);
      drawCornerAccent(ctx, 80, H - 80, false, true);
      drawCornerAccent(ctx, W - 80, H - 80, true, true);

      // Central Crest / Watermark
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#071a3a';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 320, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Top Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8a6a12';
      ctx.font = '800 24px Outfit, sans-serif';
      ctx.fillText('CENTRAL VIGILANCE COMMISSION  ·  INDIAN RAILWAYS', W / 2, 160);

      ctx.fillStyle = '#071a3a';
      ctx.font = '800 46px Georgia, serif';
      ctx.fillText('Chittaranjan Locomotive Works', W / 2, 215);

      ctx.font = '600 22px Outfit, sans-serif';
      ctx.fillStyle = '#556677';
      ctx.fillText('Vigilance Department  ·  Chittaranjan', W / 2, 250);

      // VAW Ribbon
      ctx.beginPath();
      roundRect(ctx, W / 2 - 380, 280, 760, 48, 24);
      ctx.fillStyle = '#071a3a';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 20px Outfit, sans-serif';
      ctx.fillText('VIGILANCE AWARENESS WEEK 2026', W / 2, 312);

      // Current Year Official Slogan
      ctx.fillStyle = '#8a6a12';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText(`${sloganHindi}  ·  ${sloganEnglish}`, W / 2, 375);

      // Certificate Title
      ctx.fillStyle = '#071a3a';
      ctx.font = '800 60px Georgia, serif';
      ctx.fillText(type === 'pledge' ? 'Certificate of Integrity Pledge' : 'Certificate of Vigilance Merit', W / 2, 455);

      // Body Statement
      ctx.fillStyle = '#445566';
      ctx.font = '500 26px Outfit, sans-serif';
      ctx.fillText('This is to solemnly certify that', W / 2, 535);

      // Recipient Name
      ctx.fillStyle = '#9a3412';
      ctx.font = 'italic 64px Georgia, serif';
      ctx.fillText(recipientName || 'Valued Officer', W / 2, 620);

      // Designation & Organization
      ctx.fillStyle = '#071a3a';
      ctx.font = '700 24px Outfit, sans-serif';
      const meta = [designation, organization || 'Chittaranjan Locomotive Works'].filter(Boolean).join('  ·  ');
      ctx.fillText(meta, W / 2, 675);

      // Pledge Declaration
      ctx.fillStyle = '#334455';
      ctx.font = '500 22px Outfit, sans-serif';
      const pledgeStatement = 'has solemnly taken the official Integrity Pledge, upholding the highest standards of probity, transparency, and ethical governance, and pledging to lead by personal example in the collective fight against corruption in the service of the Nation.';
      wrapText(ctx, pledgeStatement, W / 2, 735, 1480, 32);

      // Verification Bar
      ctx.beginPath();
      roundRect(ctx, 360, 890, 1280, 95, 18);
      ctx.fillStyle = '#071a3a';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Certificate ID:  ${certificateId}`, 400, 948);
      ctx.fillText(`Category:  Public Servant Integrity Commitment`, 850, 948);
      ctx.fillText(`Date:  ${date}`, 1420, 948);

      // Official Stamp on bottom left
      drawOfficialStamp(ctx, 320, 1180, certificateId, date);

      // Right: SDGM & CVO Signature Block
      if (signaturePhoto) {
        const sigImg = new Image();
        sigImg.crossOrigin = 'anonymous';
        sigImg.onload = () => {
          ctx.drawImage(sigImg, 1340, 1070, 240, 85);
          drawSignText();
        };
        sigImg.onerror = () => {
          drawScriptFallback();
          drawSignText();
        };
        sigImg.src = signaturePhoto;
      } else {
        drawScriptFallback();
        drawSignText();
      }

      function drawScriptFallback() {
        if (!ctx) return;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#071a3a';
        ctx.font = 'italic 46px Georgia, serif';
        ctx.fillText(cvoName || 'Sugind Surendran', 1460, 1130);
      }

      function drawSignText() {
        if (!ctx || !canvas) return;
        ctx.strokeStyle = '#d4a017';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1280, 1165);
        ctx.lineTo(1640, 1165);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#111827';
        ctx.font = '700 22px Outfit, sans-serif';
        ctx.fillText(cvoName || 'Sugind Surendran', 1460, 1205);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 18px Outfit, sans-serif';
        ctx.fillText(cvoDesignation || 'SDGM & Chief Vigilance Officer', 1460, 1235);
        ctx.fillText(cvoOrganization || 'Chittaranjan Locomotive Works, Chittaranjan', 1460, 1262);

        resolve(canvas);
      }
    }
  });
};

  const handleDownloadPng = async () => {
    soundEffects.playClick();
    try {
      const canvas = await paintLandscapeCanvas();
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${certificateId}-pledge.png`;
      a.click();
    } catch (err) {
      console.error('Failed to download PNG', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Top Action Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Official Integrity Pledge Certificate</span>
              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                Landscape Mode
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Verified Certificate ID: <span className="font-mono font-bold text-blue-950">{certificateId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG (Landscape)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF (Landscape)</span>
          </button>
        </div>
      </div>

      {/* Landscape Printable Canvas Frame */}
      {templateUrl ? (
        <article className="certificate-print-area relative bg-white border-4 border-[#071a3a] rounded-2xl shadow-2xl overflow-hidden w-full aspect-[1.414/1] flex flex-col justify-between">
          {/* Admin Uploaded Template Background */}
          <img
            src={templateUrl}
            alt="Pledge Certificate Template"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
          />

          {/* Program-Generated Fields Only: Name and Designation */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 text-center pointer-events-none">
            {/* Top spacing allowing template artwork to shine */}
            <div className="h-[40%]" />

            {/* Program Content Center: ONLY Name and Designation */}
            <div className="space-y-2 sm:space-y-4">
              <div className="text-2xl sm:text-4xl md:text-5xl font-serif italic font-bold text-[#071a3a] drop-shadow-xs tracking-wide">
                {recipientName || 'Valued Public Servant'}
              </div>

              {designation && (
                <div className="text-sm sm:text-lg md:text-2xl font-semibold text-slate-800">
                  {designation}
                </div>
              )}
            </div>

            {/* Bottom Sub-footer */}
            <div className="flex items-center justify-between text-[9px] sm:text-xs text-slate-500 font-semibold px-2 sm:px-4">
              <span>Pledge ID: {certificateId}</span>
              <span>Date: {date}</span>
            </div>
          </div>
        </article>
      ) : (
        <article className="certificate-print-area relative bg-[#fffefb] border-8 border-[#071a3a] rounded-2xl p-6 sm:p-10 shadow-2xl text-slate-900 overflow-hidden w-full aspect-[1.414/1] flex flex-col justify-between">
          
          {/* Inner Gold Border */}
          <div className="border-4 border-[#d4a017] rounded-xl p-6 sm:p-8 text-center relative bg-gradient-to-b from-white/90 via-amber-50/15 to-amber-50/30 flex-1 flex flex-col justify-between">
            
            {/* Top Indian Tricolor Stripe */}
            <div className="absolute top-2 left-6 right-6 h-2 rounded-full overflow-hidden flex shadow-xs">
              <div className="flex-1 bg-[#ff8a1e]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#128a45]" />
            </div>

            {/* Header with Emblem */}
            <div className="pt-2">
              <div className="text-[11px] sm:text-xs font-bold tracking-widest text-[#8a6a12] uppercase mb-0.5">
                CENTRAL VIGILANCE COMMISSION · INDIAN RAILWAYS
              </div>
              <h1 className="text-xl sm:text-3xl font-serif font-bold text-[#071a3a] leading-tight">
                Chittaranjan Locomotive Works
              </h1>
              <div className="text-xs text-slate-600 font-medium">
                Vigilance Department · Chittaranjan
              </div>

              {/* VAW Ribbon */}
              <div className="my-2.5">
                <span className="inline-block px-5 py-1 bg-[#071a3a] text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-xs">
                  VIGILANCE AWARENESS WEEK 2026
                </span>
              </div>

              {/* Current Year Official Slogan */}
              <div className="text-xs sm:text-sm text-[#8a6a12] font-bold tracking-wider">
                {sloganHindi} · {sloganEnglish}
              </div>
            </div>

            {/* Certificate Main Title */}
            <div className="my-2">
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#071a3a] mb-1">
                Certificate of Integrity Commitment
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                This is to solemnly certify that
              </p>
            </div>

            {/* Recipient Name in Calligraphic Serif Style */}
            <div className="my-2 py-1">
              <div className="text-3xl sm:text-5xl font-serif italic font-bold text-[#9a3412] tracking-wide">
                {recipientName || 'Valued Public Servant'}
              </div>
              {(designation || organization) && (
                <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                  {[designation, organization].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            {/* Body Paragraph */}
            <p className="max-w-3xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
              has solemnly taken the official Integrity Pledge, affirming unconditional commitment to eradicate corruption, uphold the Canons of Financial Propriety, adhere strictly to Conduct Rules, and act with undivided integrity in service of the Nation.
            </p>

            {/* Certificate Metadata Bar */}
            <div className="max-w-2xl mx-auto w-full bg-[#071a3a] text-white rounded-xl p-3 flex items-center justify-between gap-4 my-2 shadow-sm text-xs">
              <div className="text-left">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Certificate ID</span>
                <span className="font-mono font-bold">{certificateId}</span>
              </div>
              <div className="text-center hidden sm:block">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Category</span>
                <span className="font-semibold">Public Servant Probity</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-200 block uppercase font-medium">Date of Issue</span>
                <span className="font-semibold">{date}</span>
              </div>
            </div>

            {/* Signatures & Seal Row */}
            <div className="flex items-center justify-between gap-6 pt-3 border-t border-amber-200/80 mt-2">
              {/* Left Seal */}
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-[#d4a017] flex flex-col items-center justify-center text-center p-2 text-[#8a6a12] select-none transform -rotate-6 bg-white/60 shadow-xs">
                  <span className="text-[10px] font-extrabold tracking-wider leading-tight">CLW</span>
                  <span className="text-[9px] font-bold tracking-wider leading-tight">VIGILANCE</span>
                  <span className="text-[8px] font-semibold tracking-wider leading-tight">CHITTARANJAN</span>
                </div>
                <div className="text-left text-xs hidden sm:block">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Officially Verified Record</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    CVC Vigilance Awareness 2026
                  </div>
                </div>
              </div>

              {/* Right: Signature Photo of SDGM & CVO */}
              <div className="text-center sm:text-right min-w-[240px]">
                <div className="h-16 flex items-center justify-center sm:justify-end mb-1">
                  {signaturePhoto ? (
                    <img
                      src={signaturePhoto}
                      alt="SDGM & CVO Signature"
                      className="max-h-16 max-w-[200px] object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="font-serif italic text-2xl text-[#071a3a] font-bold">
                      {cvoName || 'Sugind Surendran'}
                    </div>
                  )}
                </div>

                <div className="w-48 h-px bg-[#d4a017] mx-auto sm:ml-auto mb-1.5" />

                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {cvoName || 'Sugind Surendran'}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {cvoDesignation || 'SDGM & Chief Vigilance Officer'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {cvoOrganization || 'Chittaranjan Locomotive Works, Chittaranjan'}
                </div>
              </div>
            </div>

          </div>
        </article>
      )}

      {/* Hidden 2000x1414 Canvas for Export */}
      <canvas ref={canvasRef} width={2000} height={1414} className="hidden" />

      <div className="no-print mt-4 text-center text-xs text-slate-500">
        Tip: In your print window, select "Landscape" orientation and "Save as PDF" to generate your high-resolution official e-certificate.
      </div>
    </div>
  );
};

// Helper Canvas Functions
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

function drawCornerAccent(ctx: CanvasRenderingContext2D, x: number, y: number, flipX = false, flipY = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  if (flipY) ctx.scale(1, -1);
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(40, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 40);
  ctx.stroke();
  ctx.restore();
}

function drawOfficialStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, _certId: string, _date: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 68, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4a017';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8a6a12';
  ctx.font = '800 15px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLW', cx, cy - 10);
  ctx.fillText('VIGILANCE', cx, cy + 10);
  ctx.fillText('CHITTARANJAN', cx, cy + 30);
  ctx.restore();
}
