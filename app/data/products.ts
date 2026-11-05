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
