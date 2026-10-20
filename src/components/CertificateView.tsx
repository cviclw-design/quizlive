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
  pf?: string;
  rank?: number;
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
  pf,
  rank,
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
  const [organizationName, setOrganizationName] = useState<string>('Chittaranjan Locomotive Works');
  const [programmeName, setProgrammeName] = useState<string>('Vigilance Awareness Week 2026');
  const [programmePeriod, setProgrammePeriod] = useState<string>('2026');
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
        if (res.settings.organization_name) setOrganizationName(res.settings.organization_name);
        if (res.settings.programme_name) setProgrammeName(res.settings.programme_name);
        if (res.settings.programme_period) setProgrammePeriod(res.settings.programme_period);
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

      // Certificate Template (Uploaded by Admin or official template)
      const templateSrc = templateUrl || '/template_cert.jpg';
      if (templateSrc) {
        const tplImg = new Image();
        tplImg.crossOrigin = 'anonymous';
        tplImg.onload = () => {
          const W = 1536;
          const H = 1024;
          canvas.width = W;
          canvas.height = H;
          ctx.drawImage(tplImg, 0, 0, W, H);

          if (type === 'pledge') {
            // 1. Cover "Certificate of Participation" on ribbon with "Certificate of Commitment"
            ctx.save();
            // Golden ribbon pill matching ribbon curve
            ctx.beginPath();
            roundRect(ctx, 420, 395, 696, 68, 34);
            const ribGrad = ctx.createLinearGradient(420, 395, 1116, 463);
            ribGrad.addColorStop(0, '#e5a93b');
            ribGrad.addColorStop(0.3, '#fde68a');
            ribGrad.addColorStop(0.7, '#d97706');
            ribGrad.addColorStop(1, '#b45309');
            ctx.fillStyle = ribGrad;
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#451a03';
            ctx.font = 'bold italic 38px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('Certificate of Commitment', W / 2, 442);
            ctx.restore();

            // 2. Cover quiz competition body with smooth parchment patch and draw pledge wording
            ctx.save();
            const bGrad = ctx.createLinearGradient(340, 625, 1200, 795);
            bGrad.addColorStop(0, 'rgba(250, 247, 238, 0.96)');
            bGrad.addColorStop(0.5, 'rgba(254, 251, 244, 0.98)');
            bGrad.addColorStop(1, 'rgba(250, 246, 237, 0.96)');
            ctx.fillStyle = bGrad;
            roundRect(ctx, 330, 622, 876, 175, 10);
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#1e293b';
            ctx.font = '500 20px "Outfit", sans-serif';
            ctx.fillText('has solemnly taken the Integrity Pledge organized during', W / 2, 650);

            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 24px "Outfit", sans-serif';
            ctx.fillText('Vigilance Awareness Week 2026', W / 2, 682);

            ctx.fillStyle = '#0f172a';
            ctx.font = '600 20px "Outfit", sans-serif';
            ctx.fillText('by Vigilance Department, Chittaranjan Locomotive Works.', W / 2, 712);

            ctx.fillStyle = '#334155';
            ctx.font = 'italic 16px Georgia, serif';
            ctx.fillText('affirming commitment to uphold the highest standards of integrity, transparency,', W / 2, 746);
            ctx.fillText('probity and an ethical workplace in all official dealings.', W / 2, 770);
            ctx.restore();
          }

          // Single line: Participant Name and Designation ONLY, directly above dotted line
          const singleLine = designation
            ? `${recipientName || 'Valued Public Servant'}, ${designation}`
            : (recipientName || 'Valued Public Servant');

          let fontSize = 28;
          ctx.font = `bold ${fontSize}px Georgia, "Playfair Display", serif`;
          while (ctx.measureText(singleLine).width > 820 && fontSize > 16) {
            fontSize -= 1;
            ctx.font = `bold ${fontSize}px Georgia, "Playfair Display", serif`;
          }

          // Render above the dotted line (dotted line is at row y = 612, blank area is y = 556-608)
          ctx.fillStyle = '#071a3a';
          ctx.textAlign = 'center';
          ctx.fillText(singleLine, W / 2, 598);

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
      ctx.font = '800 44px Georgia, serif';
      ctx.fillText(organizationName, W / 2, 215);

      ctx.font = '600 22px Outfit, sans-serif';
      ctx.fillStyle = '#556677';
      ctx.fillText(cvoOrganization, W / 2, 250);

      // Ribbon
      ctx.beginPath();
      roundRect(ctx, W / 2 - 420, 280, 840, 48, 24);
      ctx.fillStyle = '#071a3a';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 20px Outfit, sans-serif';
      ctx.fillText(programmeName.toUpperCase().slice(0, 55), W / 2, 312);

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

      // Right: SDGM & CVO Official Digitally Authorized Sign-off
      drawScriptFallback();
      drawSignText();

      function drawScriptFallback() {
        if (!ctx) return;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0b6b3a';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.fillText('✓ Sd/- Digitally Authorized', 1460, 1090);

        ctx.fillStyle = '#071a3a';
        ctx.font = 'italic bold 46px Georgia, serif';
        ctx.fillText(cvoName || 'Sugind Surendran', 1460, 1140);
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
      {templateUrl || true ? (
        <article className="certificate-print-area relative bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden w-full aspect-[1.5/1]">
          {/* Official Template Background */}
          <img
            src={templateUrl || '/template_cert.jpg'}
            alt="Pledge Certificate Template"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
          />

          {type === 'pledge' && (
            <>
              {/* Ribbon Overlay for Pledge: Certificate of Commitment */}
              <div className="absolute top-[38.2%] left-0 right-0 z-10 flex items-center justify-center pointer-events-none">
                <span className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 text-amber-950 px-6 sm:px-10 py-0.5 sm:py-1 rounded-full font-serif font-bold italic text-xs sm:text-base md:text-xl border-2 border-amber-800 shadow-md">
                  Certificate of Commitment
                </span>
              </div>

              {/* Adapted Pledge Text Overlay */}
              <div className="absolute top-[62%] left-[22%] right-[22%] z-10 text-center bg-[#fdfbf6]/90 rounded-xl p-1.5 sm:p-2 pointer-events-none">
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-800 font-medium leading-tight">
                  has solemnly taken the Integrity Pledge organized during
                </p>
                <p className="text-[11px] sm:text-sm md:text-base font-bold text-rose-700 leading-tight">
                  Vigilance Awareness Week 2026
                </p>
                <p className="text-[9px] sm:text-xs md:text-sm font-semibold text-slate-900 leading-tight">
                  by Vigilance Department, Chittaranjan Locomotive Works.
                </p>
                <p className="text-[8px] sm:text-[10px] md:text-xs italic text-slate-600 mt-0.5 leading-tight">
                  affirming commitment to uphold the highest standards of integrity and probity.
                </p>
              </div>
            </>
          )}

          {/* Participant Name and Designation ONLY - in a SINGLE line, directly ABOVE the dotted line */}
          <div className="absolute top-[55.2%] left-0 right-0 z-10 flex items-center justify-center text-center px-6 sm:px-12 pointer-events-none">
            <span className="font-serif font-bold text-[#071a3a] text-xs sm:text-base md:text-xl lg:text-2xl drop-shadow-xs tracking-wide truncate max-w-[85%]">
              {recipientName || 'Valued Public Servant'}{designation ? `, ${designation}` : ''}
            </span>
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
                {organizationName}
              </h1>
              <div className="text-xs text-slate-600 font-medium">
                {cvoOrganization}
              </div>

              {/* Event Ribbon */}
              <div className="my-2.5">
                <span className="inline-block px-5 py-1 bg-[#071a3a] text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-xs">
                  {programmeName}
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
                      src={signaturePhoto || undefined}
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
