import React, { useState } from 'react';
import { soundEffects } from '../utils/audio';
import { Search, BookMarked, Check, X, ShieldAlert, Scale, ChevronDown, ChevronUp } from 'lucide-react';

const KNOWLEDGE_SECTIONS = [
  {
    id: 'dos_donts',
    title: "Do's & Don'ts for Public Servants",
    badge: 'Code of Conduct',
    description: 'Essential preventive guidelines for officers, supervisors, and inspectors in administrative and commercial postings.',
    items: [
      {
        do: 'Ensure all financial expenditures adhere strictly to the Canons of Financial Propriety (Rule 21, GFR 2017).',
        dont: 'Split purchase indents or work estimates to bypass financial limits of lower authorities.'
      },
      {
        do: 'Declare conflicts of interest immediately in writing and recuse yourself from tender or recruitment committees.',
        dont: 'Participate in any official committee dealing with relatives, friends, or entities where you hold private interest.'
      },
      {
        do: 'Safeguard your personal Digital Signature Certificate (DSC) USB crypto-token and keep passwords strictly confidential.',
        dont: 'Hand over your DSC dongle or share passwords with subordinates or colleagues, even during short leaves.'
      },
      {
        do: 'Promptly return any unsolicited gifts from vendors with a polite written refusal and intimate your CVO.',
        dont: 'Accept lavish festive hampers, electronic gadgets, or hospitality from commercial firms having official dealings.'
      },
      {
        do: 'Ensure timely rotation of personnel serving in sensitive seats as per CVC / Railway Board policy.',
        dont: 'Permit staff to remain entrenched in identical sensitive desks beyond the prescribed tenure.'
      }
    ]
  },
  {
    id: 'pidpi_rules',
    title: 'PIDPI Whistleblower Procedure (Public Interest Disclosure)',
    badge: 'Statutory Resolution',
    description: 'Guidelines issued by Government of India Resolution dated 21.04.2004 protecting bona fide whistleblowers.',
    points: [
      {
        term: 'Designated Agency',
        detail: 'The Central Vigilance Commission (CVC) is the designated authority empowered to receive PIDPI complaints for Central Government & PSU departments.'
      },
      {
        term: 'Sealed Envelope Requirement',
        detail: 'The complaint must be enclosed in a closed envelope clearly superscribed "Complaint under the Public Interest Disclosure" or "PIDPI".'
      },
      {
        term: 'Identity Protection & Verification',
        detail: 'The complainant MUST mention their real name, address, and mobile number in the complaint letter or enclosure so CVC can verify bona fides. However, CVC strictly conceals the complainant identity from the investigated organisation.'
      },
      {
        term: 'No Anonymous Complaints',
        detail: 'Anonymous or pseudonymous complaints are not entertained under PIDPI; any complaint where the sender identity cannot be verified is discarded.'
      },
      {
        term: 'Protection Against Victimization',
        detail: 'If a complainant faces harassment or victimization due to the disclosure, CVC is empowered to issue protective directions to the concerned Ministry/Department.'
      }
    ]
  },
  {
    id: 'glossary',
    title: 'Vigilance Terminology & CVC Glossary',
    badge: 'Key Definitions',
    description: 'Authoritative definitions from the CVC Vigilance Manual 2021.',
    terms: [
      {
        term: 'Vigilance Angle',
        meaning: 'Exists when an officer demands or accepts gratification, amasses disproportionate assets, exercises gross negligence with mala fide intent, or flagrantly bypasses laid-down procedures to confer undue pecuniary advantage.'
      },
      {
        term: 'First Stage Advice (FSA)',
        meaning: 'Advice tendered by the CVC after examining the preliminary investigation report of the CVO/CBI, recommending either Major Penalty, Minor Penalty, or exoneration.'
      },
      {
        term: 'Second Stage Advice (SSA)',
        meaning: 'Advice rendered by the Commission after completion of the oral departmental inquiry, before the Disciplinary Authority passes a final penalty order.'
      },
      {
        term: 'Composite Case',
        meaning: 'A disciplinary or vigilance matter involving both Category "A" (CVC jurisdiction) and Category "B" employees arising out of a common transaction.'
      },
      {
        term: 'Preliminary Enquiry (PE)',
        meaning: 'A fact-finding inquiry conducted to determine whether a prima facie case exists warranting regular departmental action or registration of an FIR.'
      }
    ]
  }
];

export const KnowledgeVault: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('dos_donts');

  const filteredSections = KNOWLEDGE_SECTIONS.map(section => {
    if (!searchTerm.trim()) return section;
    const term = searchTerm.toLowerCase();

    const matchesTitle = section.title.toLowerCase().includes(term) || section.description.toLowerCase().includes(term);
    const filteredItems = section.items?.filter(
      item => item.do.toLowerCase().includes(term) || item.dont.toLowerCase().includes(term)
    );
    const filteredPoints = section.points?.filter(
      p => p.term.toLowerCase().includes(term) || p.detail.toLowerCase().includes(term)
    );
    const filteredTerms = section.terms?.filter(
      t => t.term.toLowerCase().includes(term) || t.meaning.toLowerCase().includes(term)
    );

    const hasContent = matchesTitle || (filteredItems && filteredItems.length > 0) || (filteredPoints && filteredPoints.length > 0) || (filteredTerms && filteredTerms.length > 0);

    if (!hasContent) return null;

    return {
      ...section,
      items: filteredItems || section.items,
      points: filteredPoints || section.points,
      terms: filteredTerms || section.terms
    };
  }).filter(Boolean);

  const toggleExpand = (id: string) => {
    soundEffects.playClick();
    setExpandedSection(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Official Reference Library</span>
          <span>·</span>
          <span>CVC Manual & Statutory Rules</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Vigilance Knowledge Vault
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Quick-reference compendium of CVC circulars, Conduct Rules, PIDPI directives, and Canons of Financial Propriety.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by keywords (e.g. PIDPI, gifts, splitting, DSC, tender, first stage advice)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Accordion / Content Sections */}
      <div className="space-y-4">
        {filteredSections.map(section => {
          if (!section) return null;
          const isExpanded = expandedSection === section.id || !!searchTerm;

          return (
            <div
              key={section.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-colors"
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleExpand(section.id)}
                className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold text-blue-900">{section.badge}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {section.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {section.description}
                  </p>
                </div>

                <div className="p-1 rounded-md text-slate-400 mt-1">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Section Body */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/30 text-xs sm:text-sm">
                  {/* Do's and Don'ts Grid */}
                  {section.items && (
                    <div className="space-y-3">
                      {section.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-start gap-2.5 text-emerald-950">
                            <span className="p-1 rounded-md bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <strong className="block text-emerald-900 text-xs uppercase mb-0.5">DO:</strong>
                              <span className="text-xs leading-relaxed">{item.do}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 text-rose-950 md:border-l md:border-slate-100 md:pl-3">
                            <span className="p-1 rounded-md bg-rose-100 text-rose-800 shrink-0 mt-0.5">
                              <X className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <strong className="block text-rose-900 text-xs uppercase mb-0.5">DON'T:</strong>
                              <span className="text-xs leading-relaxed">{item.dont}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PIDPI Points */}
                  {section.points && (
                    <div className="space-y-3">
                      {section.points.map((p, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                          <strong className="text-blue-950 block mb-1 text-xs sm:text-sm">
                            {idx + 1}. {p.term}
                          </strong>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {p.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Glossary List */}
                  {section.terms && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {section.terms.map((t, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                          <strong className="text-slate-900 block mb-1 text-xs sm:text-sm font-semibold">
                            {t.term}
                          </strong>
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {t.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-8">
            <p className="text-sm text-slate-500">
              No matching vigilance topics found for "{searchTerm}".
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-xs font-semibold text-blue-900 underline"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
