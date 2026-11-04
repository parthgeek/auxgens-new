export type ProductCard = {
  title: string;
  body: string;
};

export type ProductStep = {
  title: string;
  sub: string;
};

export type ProductStat = {
  value: string;
  label: string;
  note?: string;
};

export type Product = {
  slug: string;
  name: string;
  maker: string;
  logo: {
    src: string;
    alt: string;
    /** Background the logo artwork is designed to sit on. */
    tone: "dark" | "light";
  };
  eyebrow: string;
  tagline: string;
  summary: string;
  highlights: string[];
  hero: {
    lead: string;
    em: string;
    description: string;
  };
  overview: {
    quote: string;
    paragraphs: string[];
  };
  problem: {
    eyebrow: string;
    title: string;
    items: ProductCard[];
  };
  capabilities: {
    eyebrow: string;
    title: string;
    intro: string;
    items: ProductCard[];
  };
  flow: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: ProductStep[];
  };
  stats: {
    items: ProductStat[];
    footnote: string;
  };
  proof: {
    eyebrow: string;
    title: string;
    items: ProductCard[];
  };
  governance: {
    eyebrow: string;
    title: string;
    intro: string;
    items?: ProductCard[];
    tags?: string[];
  };
  partnership: string;
  cta: {
    title: string;
    body: string;
  };
  website: {
    label: string;
    href: string;
  };
};

export const products: Product[] = [
  {
    slug: "cyanorisk",
    name: "CyanoRisk",
    maker: "CyanoFabric",
    logo: {
      src: "/cyanofabric-logo-full.png",
      alt: "CyanoFabric",
      tone: "dark",
    },
    eyebrow: "Cyber risk convergence · CyVaR",
    tagline: "Cyber risk, converged and priced.",
    summary:
      "A pro-active CIO–CISO cyber risk convergence platform. CyanoRisk merges the estate, the software, the exposure, the data and the risk register into one graph — and returns CyVaR, a single currency figure per business service for the board.",
    highlights: [
      "One graph across CIO, CTO, CISO, CDO and CRO",
      "Attack-path qualification of every finding",
      "CyVaR — exposure in currency, per business service",
      "Baseline, appetite and a ranked reduction programme",
    ],
    hero: {
      lead: "Know what cyber risk",
      em: "could cost your business.",
      description:
        "CyanoRisk brings your technology, security and business data together to estimate the financial impact of cyber threats. See which risks matter most, explain the potential cost to your board, and focus your budget on reducing that exposure.",
    },
    overview: {
      quote:
        "How much money is your organisation standing to lose to cyber risk right now?",
      paragraphs: [
        "Auxgens is a global cybersecurity partner bringing more than twenty-five years of combined field experience, operating across Asia, EMEA, and the United States, with practitioners certified in CISSP and CISM serving regulated enterprises. CyanoRisk is our proprietary risk convergence platform, and CyVaR is the single figure it produces for the board.",
        "CyanoRisk is a pro-active CIO–CISO cyber risk convergence platform. It merges the five functions that formulate an enterprise — the estate the CIO runs, the software the CTO builds, the exposure the CISO tracks, the data the CDO governs and the risk the CRO reports — into one graph carrying a single owner, score and currency figure for every asset.",
        "Your teams can tell you how many critical findings are open. What matters is the impact in Rupees or Dollars — and that information sits across five or more functions, none of which holds the full picture. CyanoRisk pulls them together and gives you one figure per business service.",
      ],
    },
    problem: {
      eyebrow: "Where enterprise digital risk sits",
      title: "The risk falls between the functions — and no one of them contains it.",
      items: [
        {
          title: "Five accurate records",
          body: "The CMDB, the build system, the scanners, the data catalogue and the risk register each describe a genuine band of the estate — correctly.",
        },
        {
          title: "No single view of loss",
          body: "Ask what the enterprise stands to lose and the answer has to be assembled by hand across functions — by which time it is out of date.",
        },
        {
          title: "Queues, not risk",
          body: "Tens of thousands of open findings ranked by severity score, while the handful of routes that actually reach a crown jewel go unpriced.",
        },
      ],
    },
    capabilities: {
      eyebrow: "What convergence delivers",
      title: "One graph. One number that comes down.",
      intro:
        "CyVaR keeps only what an attacker can actually reach and prices it in terms the finance function already recognises — every figure opens to the asset, the weakness, the route and the assumption behind it.",
      items: [
        {
          title: "One converged register",
          body: "IT, OT, IoT, applications, APIs, crypto, data stores and AI assets — and their weaknesses — brought into a single knowledge graph with one owner per asset.",
        },
        {
          title: "One shared measure",
          body: "Each surviving attack route is walked to the asset it ends at and priced: business interruption, restoration, regulatory penalty, notification and attrition.",
        },
        {
          title: "One reduction programme",
          body: "Actions ranked by the exposure each one removes rather than by severity, so the first lever alone can retire a large share of the enterprise total.",
        },
        {
          title: "Five accountable views",
          body: "The CRO reports one measure; the CIO, CTO, CISO and CDO each work the assets beneath it — with every hop of every route assigned to the team that can break it.",
        },
      ],
    },
    flow: {
      eyebrow: "How it works",
      title: "From every enterprise asset to a control recommendation.",
      intro:
        "Assets and their weaknesses converge into the CyanoAI Risk Cortex, which qualifies, maps and prioritises them before pricing what survives into CyVaR.",
      steps: [
        { title: "Enterprise assets", sub: "IT · OT · IoT · App · API · Crypto · Quantum · DB · AI" },
        { title: "CyanoAI Risk Cortex", sub: "Assets and weaknesses converge" },
        { title: "Weaponised vulnerabilities", sub: "Only what has a working exploit" },
        { title: "Attack paths", sub: "Reachable from where attackers stand" },
        { title: "Knowledge graph", sub: "Every hop, every owner" },
        { title: "Framework mapping", sub: "Auto ATT&CK · D3FEND · ATLAS · kill chain" },
        { title: "Risk-based prioritisation", sub: "Ordered by exposure removed" },
        { title: "UniStack", sub: "One converged stack view" },
        { title: "CyVaR", sub: "Exposure in currency, per service" },
        { title: "Control recommendation", sub: "The cheapest break that wins" },
      ],
    },
    stats: {
      items: [
        { value: "61,400", label: "Open findings across a converged estate" },
        { value: "17", label: "Complete routes to a crown jewel — named, owned and priced" },
        { value: "$4.88M", label: "Average cost of a single data breach worldwide", note: "IBM Cost of a Data Breach, 2024" },
        { value: "1", label: "Number the board asks for — exposure per business service" },
      ],
      footnote:
        "Illustrative volumes for a mid-size enterprise estate. Every score, route and amount is computed from your own environment once connected.",
    },
    proof: {
      eyebrow: "One converged visibility",
      title: "Five functions. Five accountable views.",
      items: [
        { title: "CRO", body: "Risk in currency, appetite breaches, and the trend the board is reported." },
        { title: "CIO", body: "An estate register that finally agrees with the security view." },
        { title: "CTO", body: "The services you build, their components and their pipelines." },
        { title: "CISO", body: "Findings ranked by what they can actually reach, not by rating." },
        { title: "CDO", body: "Stores classified, with the exposure shown beside them." },
      ],
    },
    governance: {
      eyebrow: "Where the number lands",
      title: "Answers your governance file already asks for.",
      intro:
        "Runs on infrastructure you control, sits over your existing tooling, and preserves separation of duties — with an audit trail that records refusals too.",
      items: [
        { title: "Board & audit committee", body: "Exposure per service against a stated tolerance, with evidence the position is inside it." },
        { title: "Sector regulator", body: "A dated, reproducible assessment of controls proportionate to risk on critical systems." },
        { title: "Data protection law", body: "Exposure computed on the regulated data stores themselves." },
        { title: "ISO 27001 / 27005 · NIST CSF", body: "A documented, repeatable risk process with retained inputs, model and assumptions." },
      ],
    },
    partnership:
      "Auxgens brings senior cybersecurity advisory and governance practitioners; CyanoRisk provides the converged graph and the CyVaR measure. Together we take one business service end to end and leave you with a board-ready baseline.",
    cta: {
      title: "Begin with one business service, converged end to end.",
      body: "Request a convergence assessment and leave with your baseline — the grade, the amount in currency, the ranked levers and the first board-ready view, built from your own data.",
    },
    website: {
      label: "cyanofabric.com",
      href: "https://www.cyanofabric.com/",
    },
  },
  {
    slug: "cisoprime",
    name: "CISOPrime",
    maker: "CISOPrime",
    logo: {
      src: "/ciso-prime-logo.png",
      alt: "CISOPrime",
      tone: "light",
    },
    eyebrow: "Cyber & AI risk governance · Assurance",
    tagline: "From governance to assurance.",
    summary:
      "A Cyber & AI Risk Governance and Assurance platform powered by Agentic Decision Intelligence. CISOPrime connects existing security investments to executive decisions, clear accountability and evidence-supported outcomes.",
    highlights: [
      "Cyber risk quantified in dollars",
      "Accountable, human-approved decisions",
      "Continuous assurance across 40+ frameworks",
      "AI governance aligned to NIST AI RMF and ISO 42001",
    ],
    hero: {
      lead: "Make risk decisions",
      em: "you can stand behind.",
      description:
        "CISOPrime helps you manage cyber and AI risk with clear responsibilities and evidence behind each decision. Give every action an owner, track progress, and show your board and auditors how risks are being addressed, with support from Auxgens advisors.",
    },
    overview: {
      quote:
        "Enterprises don't need another tool that simply generates more alerts. They need a way to connect expertise, risk intelligence, accountable decisions and continuous assurance.",
      paragraphs: [
        "In most regulated enterprises today, security teams are drowning in data yet struggling to gain actionable clarity. Fragmented signals, manual compliance tracking and technical risk metrics often leave executive leadership and the board without a clear understanding of financial exposure, operational accountability, and whether cybersecurity investments are actually reducing risk.",
        "With over 25 years of combined field experience across Asia, EMEA and the United States, and backed by CISSP- and CISM-certified practitioners serving highly regulated enterprises, Auxgens brings deep cybersecurity advisory, risk management and governance expertise.",
        "Complementing these services, CISOPrime is a Cyber & AI Risk Governance and Assurance platform, powered by Agentic Decision Intelligence, designed to connect existing security investments with executive decision-making, accountability and evidence-supported outcomes.",
      ],
    },
    problem: {
      eyebrow: "The governance gap",
      title: "More data has not meant more clarity.",
      items: [
        {
          title: "More signals. Less clarity.",
          body: "Disconnected tools and evidence obscure business exposure and priorities.",
        },
        {
          title: "Decisions without ownership.",
          body: "Risks are reported, but approvals, actions and accountability are fragmented.",
        },
        {
          title: "Activity without proof.",
          body: "Audit readiness and remediation status do not, on their own, demonstrate risk reduction.",
        },
      ],
    },
    capabilities: {
      eyebrow: "What we enable",
      title: "Turn risk intelligence into action — and evidence of results.",
      intro:
        "A connected approach to cyber and AI governance for security leaders, regulated enterprises and advisory partners, built on four capabilities.",
      items: [
        {
          title: "Quantify cyber risk in dollars",
          body: "Move beyond technical vulnerabilities and qualitative heat maps. Translate risks into potential business impact and estimated financial exposure, so leadership can prioritise the investments that matter most.",
        },
        {
          title: "Drive accountable decisions",
          body: "Turn assessments and recommendations into structured decisions — with clear ownership, human approvals, due dates, documented rationale and traceability.",
        },
        {
          title: "Continuous governance & assurance",
          body: "Replace reactive, manual audit preparation. Controls and evidence are mapped continuously across 40+ frameworks while risk treatment and control effectiveness are tracked over time.",
        },
        {
          title: "Govern AI with evidence",
          body: "Inventory AI systems, assess their risks, establish approval workflows and align with NIST AI RMF and ISO 42001 — with AI-generated insights grounded in identifiable evidence and assumptions.",
        },
      ],
    },
    flow: {
      eyebrow: "The CISO operating lifecycle",
      title: "One connected path from evidence to verified outcomes.",
      intro:
        "Unlike traditional GRC tools that primarily track requirements and activities, CISOPrime connects the complete governance lifecycle. Decisions remain human-accountable; outcomes are verified only when supported by sufficient evidence.",
      steps: [
        { title: "Evidence", sub: "Signals, assets, controls and proof" },
        { title: "Risk intelligence", sub: "Priorities and business impact" },
        { title: "Governance decisions", sub: "Risk-informed, human-approved" },
        { title: "Accountability", sub: "Owners, approvals and rationale" },
        { title: "Risk treatment", sub: "Actions and progress" },
        { title: "Continuous assurance", sub: "Effectiveness checks over time" },
        { title: "Verified outcomes", sub: "Evidence of results, not activity" },
      ],
    },
    stats: {
      items: [
        { value: "40+", label: "Frameworks with continuously mapped controls and evidence" },
        { value: "7", label: "Connected stages from evidence to verified outcomes" },
        { value: "4", label: "Core capabilities across cyber and AI governance" },
        { value: "25+", label: "Years of combined Auxgens field experience" },
      ],
      footnote:
        "CISO-grade oversight at scale — without significantly expanding headcount.",
    },
    proof: {
      eyebrow: "Why CISOPrime",
      title: "Intelligence with evidence. Governance with accountability.",
      items: [
        {
          title: "Evidence-bounded agentic intelligence",
          body: "AI insights and recommendations tied to identifiable sources, with assumptions and limits made clear.",
        },
        {
          title: "Human-owned governance",
          body: "Documented approvals, responsibilities and decisions — not autonomous risk acceptance.",
        },
        {
          title: "Continuous effectiveness assessment",
          body: "Track whether risk treatment is working, with evidence that supports the conclusion.",
        },
        {
          title: "Executive-ready assurance",
          body: "Connect posture, exposure, decisions, progress and confidence in board-level reporting.",
        },
      ],
    },
    governance: {
      eyebrow: "Frameworks",
      title: "Controls and evidence mapped across 40+ frameworks.",
      intro:
        "Auxgens helps establish and strengthen your governance and compliance programme, while CISOPrime keeps controls, evidence and treatment progress continuously aligned.",
      tags: [
        "SOC 2",
        "ISO 27001",
        "HIPAA",
        "PCI DSS",
        "NIST CSF",
        "FedRAMP",
        "NIST AI RMF",
        "ISO 42001",
      ],
    },
    partnership:
      "Auxgens brings cybersecurity advisory and governance services; CISOPrime provides the technology to connect risk evidence, decisions, treatment and assurance. Together, they help clients operationalise governance and demonstrate results.",
    cta: {
      title: "Make cyber and AI risk decisions count.",
      body: "Whether you're strengthening governance, improving audit readiness, reducing business exposure or scaling CISO-grade oversight, explore a governance and assurance discussion with Auxgens + CISOPrime.",
    },
    website: {
      label: "cisoprime.io",
      href: "https://www.cisoprime.io/",
    },
  },
];

export const getProduct = (slug: string) =>
  products.find((product) => product.slug === slug);
