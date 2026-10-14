import { Question } from '../types/quiz';

export const QUESTIONS_BANK: Question[] = [
  // --- Central Vigilance Commission (CVC) & Anti-Corruption Framework ---
  {
    id: 'cvc-01',
    category: 'cvc_acts',
    categoryTitle: 'CVC & Legal Framework',
    question: 'Under the Central Vigilance Commission Act, 2003, what is the statutory composition of the Central Vigilance Commission?',
    options: [
      'A Central Vigilance Commissioner (Chairperson) and not more than two Vigilance Commissioners',
      'A Central Vigilance Commissioner and five Regional Commissioners',
      'A retired Supreme Court Judge and three Members of Parliament',
      'The Cabinet Secretary and two Joint Secretaries'
    ],
    correctAnswer: 0,
    explanation: 'Section 3(2) of the CVC Act, 2003 specifies that the Commission shall consist of a Central Vigilance Commissioner as Chairperson and not more than two Vigilance Commissioners as Members.',
    ruleReference: 'Section 3(2), Central Vigilance Commission Act, 2003',
    difficulty: 'foundation'
  },
  {
    id: 'cvc-02',
    category: 'cvc_acts',
    categoryTitle: 'CVC & Legal Framework',
    question: 'What is the term of office for the Central Vigilance Commissioner and Vigilance Commissioners?',
    options: [
      '3 years from assumption of office or until age 62',
      '4 years from assumption of office or until age 65, whichever is earlier',
      '5 years from assumption of office or until age 65',
      '6 years or until age 70'
    ],
    correctAnswer: 1,
    explanation: 'As per Section 5(1) of the CVC Act, 2003, the Central Vigilance Commissioner and Vigilance Commissioners hold office for a term of 4 years from the date of entering office or until attaining the age of 65 years, whichever is earlier.',
    ruleReference: 'Section 5(1), CVC Act, 2003; CVC Vigilance Manual',
    difficulty: 'intermediate'
  },
  {
    id: 'cvc-03',
    category: 'cvc_acts',
    categoryTitle: 'CVC & Legal Framework',
    question: 'Under the Prevention of Corruption (Amendment) Act, 2018, which section makes the giving of a bribe an explicit, punishable direct offence?',
    options: [
      'Section 7A',
      'Section 8',
      'Section 13',
      'Section 19'
    ],
    correctAnswer: 1,
    explanation: 'The 2018 amendment to the PC Act substituted Section 8 to specifically criminalize the act of bribe-giving (promising or giving undue advantage), punishable with imprisonment up to 7 years or fine or both.',
    ruleReference: 'Section 8, Prevention of Corruption (Amendment) Act, 2018',
    difficulty: 'advanced'
  },
  {
    id: 'cvc-04',
    category: 'cvc_acts',
    categoryTitle: 'CVC & Legal Framework',
    question: 'Under Section 17A of the Prevention of Corruption Act (amended in 2018), what protection is provided to public servants regarding enquiry or investigation?',
    options: [
      'Public servants can never be investigated by police',
      'Prior approval of the competent authority is mandatory before conducting any enquiry/inquiry/investigation into offences relatable to recommendations or decisions taken in discharge of official functions',
      'Only the Supreme Court can grant permission to investigate Group A officers',
      'Investigations can only be initiated during the month of Vigilance Awareness Week'
    ],
    correctAnswer: 1,
    explanation: 'Section 17A mandates prior approval from the appropriate government or competent authority before conducting any inquiry, enquiry or investigation against a public servant where the alleged offence is relatable to any recommendation made or decision taken in discharge of official functions.',
    ruleReference: 'Section 17A, Prevention of Corruption Act, 1988 (as amended in 2018)',
    difficulty: 'advanced'
  },
  {
    id: 'cvc-05',
    category: 'cvc_acts',
    categoryTitle: 'CVC & Legal Framework',
    question: 'According to the CVC Vigilance Manual, what constitutes a "Vigilance Angle"?',
    options: [
      'Only cases where physical cash is recovered from a public servant',
      'Demand/acceptance of gratification, possession of disproportionate assets, gross negligence with improper motive, or flagrant violation of systems to favor someone',
      'Any routine procedural error committed in good faith',
      'Every delay in disposing of a file'
    ],
    correctAnswer: 1,
    explanation: 'Vigilance angle exists when there is evidence of corruption, bribery, misappropriation, flagrant violation of laid-down systems/procedures with mala fide intent, or abuse of official power for private gain.',
    ruleReference: 'Chapter 1, Section 1.2, CVC Vigilance Manual 2021',
    difficulty: 'intermediate'
  },

  // --- PIDPI (Public Interest Disclosure & Protection of Informers) ---
  {
    id: 'pidpi-01',
    category: 'pidpi_whistleblower',
    categoryTitle: 'PIDPI & Whistleblower Protection',
    question: 'Which authority is designated by the Government of India as the designated agency to receive complaints under the PIDPI (Public Interest Disclosure and Protection of Informers) Resolution?',
    options: [
      'Central Vigilance Commission (CVC)',
      'Central Bureau of Investigation (CBI)',
      'Union Public Service Commission (UPSC)',
      'NITI Aayog'
    ],
    correctAnswer: 0,
    explanation: 'Under Government of India Resolution dated 21.04.2004 (PIDPI Resolution), the Central Vigilance Commission (CVC) is the designated agency to receive written complaints or disclosures regarding allegations of corruption or misuse of office.',
    ruleReference: 'GoI Resolution No. 89 dated 21st April 2004 (PIDPI Resolution)',
    difficulty: 'foundation'
  },
  {
    id: 'pidpi-02',
    category: 'pidpi_whistleblower',
    categoryTitle: 'PIDPI & Whistleblower Protection',
    question: 'How must a complaint under the PIDPI Resolution be submitted to ensure protection of the complainant\'s identity?',
    options: [
      'Through a publicly posted message on social media',
      'In a closed/sealed envelope superscribed "Complaint under the Public Interest Disclosure" or "PIDPI", with the complainant\'s name and address provided separately in the cover or an enclosure',
      'Without mentioning any name, address, or signature anywhere (completely anonymous)',
      'By sending an open postcard to the Chief Vigilance Officer'
    ],
    correctAnswer: 1,
    explanation: 'The envelope must be superscribed "Complaint under PIDPI". The complainant must state their name and address in the letter/separate cover so the Commission can verify identity, but CVC will never disclose the complainant\'s identity to the investigated department.',
    ruleReference: 'CVC Guidelines on PIDPI Complaints',
    difficulty: 'intermediate'
  },
  {
    id: 'pidpi-03',
    category: 'pidpi_whistleblower',
    categoryTitle: 'PIDPI & Whistleblower Protection',
    question: 'Does the Central Vigilance Commission take cognizance of anonymous or pseudonymous complaints?',
    options: [
      'Yes, all anonymous complaints are fully investigated',
      'No, as per statutory instructions, no action is to be taken on anonymous/pseudonymous complaints and they should be simply filed',
      'Only if the complaint contains more than 10 pages',
      'Only if sent through a local political representative'
    ],
    correctAnswer: 1,
    explanation: 'As per DoPT OM and CVC Circulars (including Circular No. 07/11/2014), no action should be taken on anonymous/pseudonymous complaints and they are simply consigned to records without investigation.',
    ruleReference: 'DoPT OM No. 104/76/2011-AVD.I & CVC Circular No. 07/11/2014',
    difficulty: 'foundation'
  },

  // --- Preventive Vigilance & Systemic Improvements ---
  {
    id: 'prev-01',
    category: 'preventive_vigilance',
    categoryTitle: 'Preventive Vigilance',
    question: 'What are the three recognized functional facets of Vigilance administration?',
    options: [
      'Preventive, Punitive, and Participative Vigilance',
      'Financial, Political, and Judicial Vigilance',
      'Secret, Open, and Covert Vigilance',
      'Departmental, Police, and Intelligence Vigilance'
    ],
    correctAnswer: 0,
    explanation: 'Vigilance administration functions through three complementary dimensions: Preventive Vigilance (reducing opportunities for corruption), Punitive Vigilance (speedy deterrent punishment), and Participative Vigilance (building awareness & public involvement).',
    ruleReference: 'CVC Vigilance Manual, Concept of Vigilance',
    difficulty: 'foundation'
  },
  {
    id: 'prev-02',
    category: 'preventive_vigilance',
    categoryTitle: 'Preventive Vigilance',
    question: 'What is the primary objective of "Rotational Transfers" of officers and staff posted in sensitive posts?',
    options: [
      'To reduce travel allowance expenditures',
      'To prevent the development of vested interests, eliminate unhealthy nexus with vendors/contractors, and promote transparency',
      'To ensure staff learn every regional language',
      'To provide frequent promotion opportunities'
    ],
    correctAnswer: 1,
    explanation: 'Periodic rotation of personnel holding sensitive appointments (typically every 2 to 3 years) breaks entrenched corrupt nexus, prevents familiarity with potential exploiters, and promotes objective decision-making.',
    ruleReference: 'CVC Circular on Rotational Transfers in Sensitive Posts; Railway Board Guidelines',
    difficulty: 'foundation'
  },
  {
    id: 'prev-03',
    category: 'preventive_vigilance',
    categoryTitle: 'Preventive Vigilance',
    question: 'What is "Splitting of Indents / Works Orders" in government procurement and how is it viewed under financial canons?',
    options: [
      'It is an encouraged practice to save shipping costs',
      'It is a serious irregularity prohibited by GFR, as it is often done to evade sanction of higher competent authorities or avoid open competitive tendering',
      'It is mandatory whenever procurement involves more than two items',
      'It is permissible if approved by a junior subordinate officer'
    ],
    correctAnswer: 1,
    explanation: 'Splitting of requisitions, purchase indents, or work estimates to bring them within the financial powers of a lower authority or to bypass public tender thresholds violates Rule 157 of General Financial Rules (GFR 2017) and is a primary vigilance irregularity.',
    ruleReference: 'Rule 157, General Financial Rules (GFR) 2017 & CVC Guidelines on Tendering',
    difficulty: 'intermediate'
  },
  {
    id: 'prev-04',
    category: 'preventive_vigilance',
    categoryTitle: 'Preventive Vigilance',
    question: 'Which of the following is considered one of the Canons of Financial Propriety?',
    options: [
      'Expenditure should be incurred to exhaust the budget before the financial year ends',
      'Every public officer is expected to exercise the same vigilance in respect of expenditure incurred from public moneys as a person of ordinary prudence would exercise in respect of expenditure of his own money',
      'An authority can exercise its financial powers to pass an order directly benefiting itself',
      'No vouchers or documentation are needed for transactions under ₹50,000'
    ],
    correctAnswer: 1,
    explanation: 'The foremost Canon of Financial Propriety states: "Every public officer is expected to exercise the same vigilance in respect of expenditure incurred from public moneys as a person of ordinary prudence would exercise in respect of expenditure of his own money."',
    ruleReference: 'Rule 21, General Financial Rules (GFR) 2017',
    difficulty: 'intermediate'
  },

  // --- Conduct Rules & Ethics ---
  {
    id: 'conduct-01',
    category: 'conduct_rules',
    categoryTitle: 'Conduct Rules & Integrity',
    question: 'Under Rule 3(1) of the Railway Services (Conduct) Rules, 1966 and CCS (Conduct) Rules, 1964, what are the three foundational duties of every railway/government servant?',
    options: [
      'Maintain absolute integrity; Maintain devotion to duty; Do nothing which is unbecoming of a railway/government servant',
      'Execute all oral instructions without maintaining records; Avoid attending office on Saturdays; Submit weekly news digests',
      'Prioritize private investments; Refuse overtime work; Travel exclusively in first class',
      'Accept gifts from contractors; Recommend relatives for tenders; Disregard written guidelines'
    ],
    correctAnswer: 0,
    explanation: 'Rule 3(1) mandates: Every railway/government servant shall at all times: (i) maintain absolute integrity; (ii) maintain devotion to duty; and (iii) do nothing which is unbecoming of a railway/government servant.',
    ruleReference: 'Rule 3(1), Railway Services (Conduct) Rules 1966 & CCS (Conduct) Rules 1964',
    difficulty: 'foundation'
  },
  {
    id: 'conduct-02',
    category: 'conduct_rules',
    categoryTitle: 'Conduct Rules & Integrity',
    question: 'Under the revised Gift Rules for Central Government / Railway Servants, what is the ceiling beyond which acceptance of gifts on occasions such as weddings from near relatives must be reported to the Government?',
    options: [
      '₹1,000 for all groups',
      '₹25,000 for Group \'A\' and Group \'B\', and ₹15,000 for Group \'C\'',
      '₹5,000 for Group \'A\' and ₹2,000 for Group \'C\'',
      'No reporting is ever required for any amount'
    ],
    correctAnswer: 1,
    explanation: 'As per the amended Conduct Rules (Rule 13), on occasions such as weddings, anniversaries, or religious functions when the making of gifts is conforming with prevailing religious/social practice, a government/railway servant may accept gifts, but must report to the Government if value exceeds ₹25,000 (Group A & B) or ₹15,000 (Group C).',
    ruleReference: 'Rule 13, Railway Services (Conduct) Rules 1966 / CCS (Conduct) Rules',
    difficulty: 'advanced'
  },
  {
    id: 'conduct-03',
    category: 'conduct_rules',
    categoryTitle: 'Conduct Rules & Integrity',
    question: 'Can a government or railway servant engage directly or indirectly in any private trade or business without prior sanction?',
    options: [
      'Yes, as long as it is done during weekends and holidays',
      'No, prior sanction of the Government is strictly required under Rule 15',
      'Yes, provided the income from trade is less than their official salary',
      'Yes, if they register the company under their spouse\'s sole name while actively managing it'
    ],
    correctAnswer: 1,
    explanation: 'Rule 15(1) of the Conduct Rules specifies that no government/railway servant shall, except with the previous sanction of the Government, engage directly or indirectly in any trade or business, or undertake any other employment.',
    ruleReference: 'Rule 15, Railway Services (Conduct) Rules 1966 / CCS (Conduct) Rules 1964',
    difficulty: 'intermediate'
  },
  {
    id: 'conduct-04',
    category: 'conduct_rules',
    categoryTitle: 'Conduct Rules & Integrity',
    question: 'What is the rule regarding acceptance of lavish hospitality or transport from commercial firms or contractors who have official dealings with the department?',
    options: [
      'It is permitted if the food is vegetarian',
      'A public servant must avoid accepting lavish hospitality or frequent hospitality from any individual or commercial firm having official dealings with them',
      'It is mandatory for contractors to host dinner parties for all tender committee members',
      'Public servants can accept free air tickets and five-star resort stays for family holidays'
    ],
    correctAnswer: 1,
    explanation: 'Conduct Rules strictly forbid public servants from accepting lavish or frequent hospitality from any commercial firm, contractor, or person with whom they have official dealings, as it compromises impartiality and creates conflicts of interest.',
    ruleReference: 'Rule 13(4), Railway Services (Conduct) Rules 1966 & CCS (Conduct) Rules',
    difficulty: 'foundation'
  },

  // --- Procurement, Tenders & GeM (Government e-Marketplace) ---
  {
    id: 'proc-01',
    category: 'procurement_gem',
    categoryTitle: 'Procurement & GeM Vigilance',
    question: 'What is the Central Vigilance Commission\'s clear policy regarding negotiations with bidders after opening of commercial tenders?',
    options: [
      'Negotiations should be carried out with all bidders simultaneously to lower the price',
      'Post-tender negotiations are banned, except in exceptional circumstances where negotiations are held strictly with the lowest valid bidder (L1) only',
      'Officers can negotiate with any bidder of their choice irrespective of rank',
      'Bidders can revise their rates upwards after tender opening'
    ],
    correctAnswer: 1,
    explanation: 'CVC has reiterated through multiple circulars (such as Special Chapter on Tendering) that post-tender negotiations are banned. In rare cases where rates are unreasonable or cartels suspected, negotiations may only be conducted with the L1 bidder with recorded reasons.',
    ruleReference: 'CVC Circular No. 98/ORD/1 dated 24.08.2000 & 005/CRD/012',
    difficulty: 'intermediate'
  },
  {
    id: 'proc-02',
    category: 'procurement_gem',
    categoryTitle: 'Procurement & GeM Vigilance',
    question: 'Under Rule 149 of GFR 2017, the procurement of Goods and Services by Ministries or Departments through Government e-Marketplace (GeM) is:',
    options: [
      'Purely optional and discouraged',
      'Mandatory for goods and services available on GeM',
      'Only applicable for purchases over ₹10 Crores',
      'Prohibited for Indian Railways and Defense'
    ],
    correctAnswer: 1,
    explanation: 'Rule 149 of GFR 2017 clearly stipulates that the procurement of goods and services by Ministries or Departments is mandatory for items available on the Government e-Marketplace (GeM).',
    ruleReference: 'Rule 149, General Financial Rules (GFR) 2017',
    difficulty: 'foundation'
  },
  {
    id: 'proc-03',
    category: 'procurement_gem',
    categoryTitle: 'Procurement & GeM Vigilance',
    question: 'What is "Cartelization" among tenderers and how does it violate fair public procurement?',
    options: [
      'Supplying goods in cardboard cartons instead of wooden crates',
      'An illicit agreement among competing bidders to fix prices, rig bids, or share markets, depriving the public exchequer of competitive pricing',
      'Offering volume discounts to government buyers',
      'Participating in international trade exhibitions'
    ],
    correctAnswer: 1,
    explanation: 'Bid rigging or cartelization is an anti-competitive practice where competing firms collude to artificially elevate prices or rotate winning bids, punishable under the Competition Act 2002 and leading to disqualification/banning in government tenders.',
    ruleReference: 'CVC Guidelines on Tendering & Competition Act 2002',
    difficulty: 'intermediate'
  },

  // --- Cyber Vigilance & Digital Integrity ---
  {
    id: 'cyber-01',
    category: 'cyber_vigilance',
    categoryTitle: 'Cyber Vigilance & IT Security',
    question: 'In e-Office, IREPS, or GeM portals, an officer is requested by a colleague to share their Digital Signature Certificate (DSC) USB crypto-token and PIN to approve an urgent indent while on leave. What is the correct rule?',
    options: [
      'The officer can share the token and password since it is for official work',
      'The DSC and its PIN are legally personal to the subscriber; sharing or handing over a DSC token to anyone is a severe violation of the IT Act, 2000 and Conduct Rules',
      'The token can be left plugged into an open desktop with the PIN written on a sticky note',
      'Sharing is permissible if the colleague promises not to tell anyone'
    ],
    correctAnswer: 1,
    explanation: 'Under the Information Technology Act 2000 and CVC Cyber Security guidelines, a Digital Signature Certificate (DSC) is the personal electronic signature of the individual. Any action performed using the token is legally attributed to that individual; sharing tokens or credentials is a punishable disciplinary and cyber offence.',
    ruleReference: 'Section 42 & 66C, Information Technology Act 2000; CVC Guidelines on e-Procurement',
    difficulty: 'intermediate'
  },
  {
    id: 'cyber-02',
    category: 'cyber_vigilance',
    categoryTitle: 'Cyber Vigilance & IT Security',
    question: 'Which of the following practices aligns with Cyber Vigilance protocols in public offices?',
    options: [
      'Using public unsecured Wi-Fi at coffee shops to process confidential personnel or vigilance enquiry files without VPN',
      'Enabling Multi-Factor Authentication (MFA), never sharing OTPs/passwords, locking workstations when stepping away, and reporting phishing attempts immediately',
      'Forwarding sensitive internal tender committee minutes to personal commercial email accounts (Gmail/Yahoo)',
      'Plugging unauthorized personal USB thumb drives into government departmental servers'
    ],
    correctAnswer: 1,
    explanation: 'Cyber vigilance demands stringent adherence to password hygiene, multi-factor authentication, physical workstation locking, avoidance of unofficial personal email IDs for government files, and immediate reporting of security anomalies.',
    ruleReference: 'National Cyber Security Policy & CVC IT Security Guidelines',
    difficulty: 'foundation'
  },

  // --- Practical Case Scenarios & Ethical Dilemmas ---
  {
    id: 'scen-01',
    category: 'practical_scenarios',
    categoryTitle: 'Practical Dilemmas & Scenarios',
    scenario: 'You are appointed as a member of a Departmental Tender Committee. After the technical bids are opened, you discover that one of the participating bidding firms is owned by your first cousin (brother\'s son).',
    question: 'What is your ethical and statutory obligation in this situation?',
    options: [
      'Quietly continue on the committee but try to award slightly lower marks to avoid suspicion',
      'Immediately declare your conflict of interest in writing to the Tender Accepting Authority and recuse yourself from the committee',
      'Advise your cousin privately on how to adjust his financial quote',
      'Ignore the relationship since commercial matters are separate from family ties'
    ],
    correctAnswer: 1,
    explanation: 'Transparency and integrity require that whenever a conflict of interest exists, the officer must immediately disclose the relationship in writing to the competent authority and recuse themselves completely from the decision-making process.',
    ruleReference: 'Rule 4, Railway Services (Conduct) Rules 1966 & CVC Guidelines on Conflict of Interest',
    difficulty: 'intermediate'
  },
  {
    id: 'scen-02',
    category: 'practical_scenarios',
    categoryTitle: 'Practical Dilemmas & Scenarios',
    scenario: 'During Diwali/New Year, a registered vendor delivers a lavish gift hamper containing expensive electronic gadgets, dry fruit boxes, and premium wristwatches to an officer\'s residential address while the officer is at work.',
    question: 'What should the officer do upon discovering this delivery?',
    options: [
      'Distribute the electronic gadgets among friends and keep quiet',
      'Politely return the package immediately to the vendor with a firm written intimation, or deposit it in the department\'s Toshakhana/gift registry with immediate written report to the CVO/competent authority',
      'Keep the gift because it was delivered at home and not at the office desk',
      'Accept the gift and promise the vendor favorable consideration in the next procurement cycle'
    ],
    correctAnswer: 1,
    explanation: 'Gifts from vendors or entities having official dealings are prohibited under Conduct Rules. The item must be returned immediately with a polite written refusal, or deposited with the designated authority accompanied by an immediate written report to the Vigilance/Administrative head.',
    ruleReference: 'Rule 13, Railway Services (Conduct) Rules 1966 / CCS Conduct Rules',
    difficulty: 'foundation'
  },
  {
    id: 'scen-03',
    category: 'practical_scenarios',
    categoryTitle: 'Practical Dilemmas & Scenarios',
    scenario: 'An urgent machine breakdown threatens to stop a production line. The total estimated cost of replacement parts is ₹8,00,000, which requires an open e-tender. A subordinate suggests creating four separate emergency work orders of ₹2,00,000 each under local spot purchase powers to avoid tender delay.',
    question: 'What should the in-charge officer decide?',
    options: [
      'Approve the splitting of orders because production speed justifies any method',
      'Reject the suggestion to split the work order as it constitutes deliberate evasion of tender rules; instead, utilize legitimate emergency/single-tender provisions under emergency powers with proper recorded justifications and competent sanction',
      'Order the parts through a friend\'s company without invoices',
      'Ask the supplier to bill under fictitious stationary items'
    ],
    correctAnswer: 1,
    explanation: 'Splitting indents or purchase orders to fit within lower financial thresholds is a recognized vigilance violation. Emergencies must be handled using the legitimate emergency purchase provisions explicitly provided in financial rules, with documented reasons and proper administrative approvals, rather than bypassing rules through artificial splitting.',
    ruleReference: 'GFR Rule 157 & Canons of Financial Propriety',
    difficulty: 'advanced'
  },
  {
    id: 'scen-04',
    category: 'practical_scenarios',
    categoryTitle: 'Practical Dilemmas & Scenarios',
    scenario: 'An inspecting official is testing a consignment of 1,000 safety-critical components delivered by a contractor. One batch shows dimensions slightly outside specified tolerances. The contractor appeals that the deviation is minor and offers to bear a small informal penalty if the passing certificate is issued today.',
    question: 'What is the correct vigilance-compliant course of action for the inspecting official?',
    options: [
      'Accept the contractor\'s assurance and sign the inspection certificate',
      'Reject the sub-standard batch strictly as per contract specifications, issue a formal rejection memo, and report the integrity breach / inducement offer to higher authorities',
      'Take informal penalty money into an unrecorded staff welfare fund',
      'Ask the contractor to replace the bad pieces without recording any paperwork'
    ],
    correctAnswer: 1,
    explanation: 'Compromising on safety or technical specifications under informal promises or inducements endangers public safety and constitutes gross misconduct under the PC Act. The inspector must strictly adhere to specifications, reject non-conforming items formally, and document the inspection results truthfully.',
    ruleReference: 'CVC Vigilance Manual, Inspection & Quality Assurance Guidelines',
    difficulty: 'advanced'
  }
];

export const CATEGORIES_META = [
  {
    id: 'cvc_acts',
    title: 'CVC Act & Legal Framework',
    description: 'Statutory powers of CVC, Lokpal, and Prevention of Corruption Act (PC Act 1988/2018).',
    count: 5
  },
  {
    id: 'pidpi_whistleblower',
    title: 'PIDPI & Whistleblower Protection',
    description: 'Whistleblower resolution, sealed envelope procedure, and anonymous complaint handling.',
    count: 3
  },
  {
    id: 'preventive_vigilance',
    title: 'Preventive Vigilance & Systemic Reforms',
    description: 'Rotational transfers, Canons of Financial Propriety, and eliminating corruption opportunities.',
    count: 4
  },
  {
    id: 'conduct_rules',
    title: 'Conduct Rules & Public Integrity',
    description: 'Rule 3 (Devotion & Integrity), Gift rules (Rule 13), Private trade (Rule 15), and hospitality.',
    count: 4
  },
  {
    id: 'procurement_gem',
    title: 'Procurement, GeM & Tenders',
    description: 'GeM Rule 149, Cartelization, Reverse Auction, and CVC post-tender negotiation bans.',
    count: 3
  },
  {
    id: 'cyber_vigilance',
    title: 'Cyber Vigilance & IT Security',
    description: 'Digital Signature (DSC) protection, e-Office protocols, and digital fraud prevention.',
    count: 2
  },
  {
    id: 'practical_scenarios',
    title: 'Case Scenarios & Dilemmas',
    description: 'Realistic workplace ethical dilemmas, conflicts of interest, and correct procedures.',
    count: 4
  }
];

export const OFFICIAL_PLEDGES = {
  citizen: {
    title: 'Citizen\'s Integrity Pledge',
    hindiTitle: 'नागरिक सत्यनिष्ठा प्रतिज्ञा',
    theme: 'Probity for Prosperity · सत्यनिष्ठा से समृद्धि',
    paragraphs: [
      'I believe that corruption has been one of the major obstacles to economic, political and social progress of our country.',
      'I believe that all stakeholders such as Government, citizens and private sector need to work together to eradicate corruption.',
      'I realize that every citizen should be vigilant and commit to highest standards of honesty and integrity at all times and support the fight against corruption.',
      'I, therefore, pledge to:'
    ],
    commitments: [
      'To follow probity and rule of law in all walks of life;',
      'To neither take nor offer bribe;',
      'To perform all tasks in an honest and transparent manner;',
      'To act in public interest and lead by example displaying integrity in personal conduct;',
      'To report any incident of corruption to the appropriate agency.'
    ]
  },
  public_servant: {
    title: 'Integrity Pledge for Public Servants',
    hindiTitle: 'लोक सेवकों के लिए सत्यनिष्ठा प्रतिज्ञा',
    theme: 'Promoting Ethical Governance & Vigilance in Public Life',
    paragraphs: [
      'I believe that corruption has been one of the major obstacles to economic, political and social progress of our country.',
      'I believe that public servants have a solemn duty to lead by example, uphold the highest ethical standards, and maintain impeccable personal and professional probity.',
      'I commit to supporting the fight against corruption and fostering an organizational culture of transparency, accountability, and fair governance.',
      'I, therefore, pledge that:'
    ],
    commitments: [
      'I shall at all times maintain absolute integrity, devotion to duty, and do nothing unbecoming of a public servant;',
      'I shall strictly adhere to all applicable rules, regulations, and canons of financial propriety;',
      'I shall discharge all official responsibilities with transparency, fairness, and impartiality without fear or favor;',
      'I shall neither seek nor accept any illegal gratification, gift, or favor for myself or others;',
      'I shall protect public assets, prevent waste of public resources, and foster a culture of zero tolerance towards corruption.'
    ]
  }
};

export const CASE_SCENARIOS_DATA = [
  {
    id: 'case-01',
    title: 'The Unsolicited Festive Gift Dilemma',
    department: 'Stores & Material Management / CLW',
    background: 'A week prior to the annual festive season, a prominent railway supplier delivers a luxury brass-inlaid hamper containing dry fruits, expensive electronics, and personalized stationery to your residential quarters addressed to your spouse.',
    dilemma: 'The delivery agent states that it is a goodwill gift meant for your family and refuses to take it back without approval from his dispatch manager.',
    options: [
      {
        text: 'Keep the gift quietly at home since it was addressed to your family member and not delivered in the office.',
        action: 'Retain the item without reporting.',
        integrityImpact: -10,
        transparencyImpact: -10,
        complianceImpact: -10,
        verdict: 'violation' as const,
        analysis: 'Accepting gifts from parties having official dealings, even when addressed to family members, is a severe violation of Rule 13 of the Conduct Rules and creates a corrupt obligation.',
        correctProcedure: 'Public servants must never accept gifts or favors from commercial entities dealing with their organization, regardless of the delivery venue or recipient name.',
        applicableRule: 'Rule 13, Railway Services (Conduct) Rules 1966 / CCS Conduct Rules'
      },
      {
        text: 'Politely refuse to accept delivery, or if already delivered in your absence, immediately pack the item and return it with a polite official letter, while sending a formal intimation to your CVO/Controlling Officer.',
        action: 'Return with formal written intimation to CVO.',
        integrityImpact: 10,
        transparencyImpact: 10,
        complianceImpact: 10,
        verdict: 'correct' as const,
        analysis: 'This is the gold standard of vigilance compliance. Refusing or promptly returning the item with a documented letter protects your professional integrity and maintains an auditable record.',
        correctProcedure: 'Inform the sender in writing of your inability to accept gifts, return the package, and submit a copy of the communication to the Chief Vigilance Officer for records.',
        applicableRule: 'CVC Guidelines on Gifts & Hospitality; Rule 13(4) Conduct Rules'
      },
      {
        text: 'Auction the electronic gadget inside the office to raise money for the staff sports fund without telling the vendor.',
        action: 'Informal departmental auction.',
        integrityImpact: -2,
        transparencyImpact: -6,
        complianceImpact: -8,
        verdict: 'flawed' as const,
        analysis: 'While well-intentioned, public servants cannot unilaterally create ad-hoc disposal mechanisms for unsolicited commercial gifts. Proper official Toshakhana deposit or return procedures must be followed.',
        correctProcedure: 'Unsolicited gifts that cannot be returned should be formally deposited into the official Government Toshakhana or central registry through the designated administrative branch.',
        applicableRule: 'Ministry of External Affairs / CVC Toshakhana Regulations'
      }
    ]
  },
  {
    id: 'case-02',
    title: 'The Urgent Production Line Breakdown',
    department: 'Mechanical / Electrical Locomotive Workshop',
    background: 'A critical CNC machine in the wheel shop has broken down. Spares worth ₹9,00,000 are required immediately. An open e-tender normally takes 21 days. The shop supervisor suggests placing four separate spot purchase orders of ₹2,25,000 each with local vendors today.',
    dilemma: 'Management is demanding immediate resumption of production by tomorrow morning.',
    options: [
      {
        text: 'Split the requirement into four separate local purchases under local powers to ensure parts arrive today.',
        action: 'Split purchase indents.',
        integrityImpact: -8,
        transparencyImpact: -9,
        complianceImpact: -10,
        verdict: 'violation' as const,
        analysis: 'Splitting indents or estimates to bring procurement within the financial powers of a lower authority or to evade open competition is an explicit vigilance offence under GFR Rule 157.',
        correctProcedure: 'Never split orders to bypass tender thresholds. The proper procedure is to invoke the formal Emergency Procurement Provisions provided in SOP with approval of the Competent Authority.',
        applicableRule: 'Rule 157, General Financial Rules (GFR) 2017 & CVC Procurement Manual'
      },
      {
        text: 'Invoke the designated Single Tender / Proprietary Article / Emergency Purchase powers under the Schedule of Powers (SOP), record full technical and urgency justifications in writing, and obtain emergency sanction from the General Manager / Competent Authority.',
        action: 'Utilize legitimate emergency powers with written justification.',
        integrityImpact: 10,
        transparencyImpact: 9,
        complianceImpact: 10,
        verdict: 'correct' as const,
        analysis: 'The rules provide legitimate emergency mechanisms for production breakdowns. Exercising these powers transparently with documented reasons preserves both operational continuity and statutory propriety.',
        correctProcedure: 'Prepare an emergency requisition certifying urgency, obtain concurrence from Finance, and secure sanction from the authority empowered to handle emergency procurements without splitting.',
        applicableRule: 'Railway Model SOP (Works & Stores) & GFR Emergency Purchase Clauses'
      },
      {
        text: 'Halt all work and refuse to do anything until an ordinary 21-day open tender completes, completely ignoring the emergency.',
        action: 'Bureaucratic paralysis.',
        integrityImpact: 2,
        transparencyImpact: 4,
        complianceImpact: -4,
        verdict: 'flawed' as const,
        analysis: 'Complete paralysis and failure to utilize existing legitimate emergency provisions leads to massive public loss and reflects a lack of devotion to duty under Rule 3.',
        correctProcedure: 'Vigilance awareness is not about creating paralysis; it is about utilizing lawful, transparent rules to achieve organizational objectives swiftly.',
        applicableRule: 'Rule 3(1)(ii) Devotion to Duty, Railway Services (Conduct) Rules 1966'
      }
    ]
  },
  {
    id: 'case-03',
    title: 'The Digital Signature Sharing Request',
    department: 'Accounts & E-Procurement Wing',
    background: 'You are going on sanctioned earned leave for 3 days. A critical e-tender evaluation report and payment bills need to be digitally signed on the IREPS / GeM portal before month-end closing.',
    dilemma: 'Your immediate superior asks you to leave your USB crypto token (DSC) and PIN with your senior colleague so processing is not held up while you are away.',
    options: [
      {
        text: 'Hand over the crypto token and whisper your password to your trusted colleague since they have your best interests at heart.',
        action: 'Share DSC token and password.',
        integrityImpact: -10,
        transparencyImpact: -10,
        complianceImpact: -10,
        verdict: 'violation' as const,
        analysis: 'Under the Information Technology Act 2000, your DSC is your personal legal signature. Sharing your token or PIN is a serious cyber security and vigilance violation; any action taken will be held against you legally.',
        correctProcedure: 'Never share your DSC token or PIN under any circumstances. Official workflows must be formally delegated or reassigned in the e-Office/IREPS system through administrative leave routing.',
        applicableRule: 'Section 42 & 66C of IT Act 2000; CVC Cyber Security Guidelines'
      },
      {
        text: 'Politely inform your superior that sharing DSC is prohibited by law, and request that the pending matters either be routed to the link/officiating officer configured in the system or processed immediately prior to departure.',
        action: 'Refuse sharing and initiate formal system delegation.',
        integrityImpact: 10,
        transparencyImpact: 10,
        complianceImpact: 10,
        verdict: 'correct' as const,
        analysis: 'Upholding IT security protocols and using built-in system role delegation preserves audit trails and prevents fraudulent unauthorized approvals.',
        correctProcedure: 'Configure the designated link officer in the workflow system before proceeding on leave so files are legally routed to their authorized credentials.',
        applicableRule: 'DoPT e-Office Guidelines & CVC Cyber Vigilance Directives'
      }
    ]
  }
];
