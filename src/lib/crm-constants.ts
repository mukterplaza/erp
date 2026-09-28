// =============================================================================
// INSAF CRM — TWO SEPARATE BUSINESS UNITS (SHARED LEAD ENGINE, SEPARATE DATA)
// =============================================================================

export const COMPANY_IBDC = "IBDC";
export const COMPANY_IREL = "IREL";

export interface CompanyDef {
  code: string;
  name: string;
  shortName: string;
  businessType: string;
  leadPrefix: string;
}

export const CRM_COMPANIES: CompanyDef[] = [
  {
    code: COMPANY_IBDC,
    name: "INSAF BUILDING DESIGN & CONSULTANT LTD.",
    shortName: "Insaf Building Design & Consultant",
    businessType: "Building Design, Approval & Engineering Services",
    leadPrefix: "BDL",
  },
  {
    code: COMPANY_IREL,
    name: "INSAF REAL ESTATE LTD.",
    shortName: "Insaf Real Estate",
    businessType: "Real Estate & Property Sales",
    leadPrefix: "REL",
  },
];

// -----------------------------------------------------------------------------
// COMPANY 1 — INSAF BUILDING DESIGN & CONSULTANT LTD. (Service Types ONLY)
// -----------------------------------------------------------------------------
export const IBDC_SERVICE_TYPES = [
  "Architectural Design",
  "Structural Design",
  "Electrical Design",
  "Plumbing Design",
  "Costing & Estimating",
  "RAJUK Plan Approval",
  "Plan Design + RAJUK Approval",
  "Interior Design",
  "3D Visualization & VR",
  "3D View",
  "Construction Management",
  "Package Building Work",
  "Documents",
  "Other",
];

// -----------------------------------------------------------------------------
// COMPANY 2 — INSAF REAL ESTATE LTD. (Property Interest ONLY)
// -----------------------------------------------------------------------------
export const IREL_PROPERTY_TYPES = [
  "Flat",
  "Shop",
  "Office Space",
  "Commercial Space",
  "Apartment",
  "Land/Plot",
  "Investment",
  "Project",
  "Other",
];

export const IREL_PURPOSES = [
  "Own Use",
  "Investment",
  "Resale",
  "Rental Income",
];

// -----------------------------------------------------------------------------
// SHARED CRM VOCABULARY
// -----------------------------------------------------------------------------
export const LEAD_SOURCES = [
  "Facebook",
  "Referral",
  "Website",
  "Direct",
  "Walk-in",
  "Phone Call",
  "WhatsApp",
  "Marketing Campaign",
  "Other",
];

export const LEAD_PRIORITIES = ["Hot", "Warm", "Cold"];

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Follow-up Required",
  "Qualified",
  "Quotation",
  "Negotiating",
  "On Hold",
  "Won",
  "Lost",
];

// A lead stops requiring a next follow-up ONLY when it reaches one of these
export const LEAD_CLOSED_STATUSES = ["Won", "Lost", "On Hold"];

export const FOLLOWUP_METHODS = [
  "Phone Call",
  "WhatsApp",
  "Facebook",
  "SMS",
  "Email",
  "Meeting",
  "Office Visit",
  "Site Visit",
  "Other",
];

export const FOLLOWUP_OUTCOMES = [
  "No Response",
  "Contacted",
  "Interested",
  "Qualified",
  "Need More Information",
  "Quotation Sent",
  "Negotiating",
  "Call Back Later",
  "Not Interested",
  "Won",
  "Lost",
  "Other",
];

// Outcome -> Lead status mapping. "No Response" & "Call Back Later" keep the
// lead ACTIVE (never auto-Lost) so another follow-up can be scheduled.
export const OUTCOME_TO_STATUS: Record<string, string> = {
  "No Response": "Follow-up Required",
  Contacted: "Contacted",
  Interested: "Qualified",
  Qualified: "Qualified",
  "Need More Information": "Follow-up Required",
  "Quotation Sent": "Quotation",
  Negotiating: "Negotiating",
  "Call Back Later": "Follow-up Required",
  "Not Interested": "Lost",
  Won: "Won",
  Lost: "Lost",
  Other: "Follow-up Required",
};

// Outcomes that MUST have a next follow-up date scheduled
export const OUTCOMES_REQUIRING_NEXT_FOLLOWUP = [
  "No Response",
  "Call Back Later",
  "Contacted",
  "Interested",
  "Qualified",
  "Need More Information",
  "Quotation Sent",
  "Negotiating",
  "Other",
];

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`).getTime();
  const b = new Date(`${toIso}T00:00:00`).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

export const REAL_ESTATE_BUDGET_RANGES = [
  { label: "Below ৳50 Lakh", min: 0, max: 5000000 },
  { label: "৳50 Lakh – ৳1 Crore", min: 5000000, max: 10000000 },
  { label: "৳1 Crore – ৳2 Crore", min: 10000000, max: 20000000 },
  { label: "Above ৳2 Crore", min: 20000000, max: Number.MAX_SAFE_INTEGER },
];

export function getBudgetRangeLabel(budget: number): string {
  const found = REAL_ESTATE_BUDGET_RANGES.find(
    (r) => budget >= r.min && budget < r.max
  );
  return found ? found.label : "Not Specified";
}

// Legacy service values migrated into valid IBDC service types
export function normalizeIbdcService(rawService: string): string {
  if (!rawService) return "Other";
  if (IBDC_SERVICE_TYPES.includes(rawService)) return rawService;
  const s = rawService.toLowerCase();
  if (s.includes("full construction") || s.includes("construction")) {
    return "Construction Management";
  }
  if (s.includes("architectural") && s.includes("structural")) {
    return "Plan Design + RAJUK Approval";
  }
  if (s.includes("architectural")) return "Architectural Design";
  if (s.includes("structural")) return "Structural Design";
  if (s.includes("interior")) return "Interior Design";
  if (s.includes("rajuk")) return "RAJUK Plan Approval";
  if (s.includes("3d")) return "3D View";
  if (s.includes("estimat") || s.includes("costing")) return "Costing & Estimating";
  return "Other";
}

export function isValidCategoryForCompany(
  companyCode: string,
  value: string
): boolean {
  if (companyCode === COMPANY_IBDC) {
    return IBDC_SERVICE_TYPES.includes(value);
  }
  if (companyCode === COMPANY_IREL) {
    return IREL_PROPERTY_TYPES.includes(value);
  }
  return false;
}
