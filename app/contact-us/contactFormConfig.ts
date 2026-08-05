export const contactServices = [
  "Forward Deployed AI Engineer",
  "SOC as a Service",
  "Cyber Security",
  "Virtual CISO",
  "Governance Risk & Compliance",
  "GDPR / Privacy",
  "FERPA",
  "CCPA",
  "Application Development",
  "Staff Augmentation/Project Management",
  "General enquiry",
] as const;

export const contactRegions = [
  "India / Asia",
  "United States of America",
  "EMEA",
  "Global engagement",
] as const;

export const contactFieldLimits = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  company: { max: 120 },
  message: { min: 20, max: 2_000 },
} as const;
