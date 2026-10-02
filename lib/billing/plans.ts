export type PlanId = "gratis" | "small" | "standard" | "pro";

export type PlanFeature =
  | "manual"
  | "yearWheel"
  | "suggestions"
  | "deviations"
  | "extraUsers"
  | "export"
  | "audit"
  | "remiss";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  blurb: string;
  seats: number;
  featured?: boolean;
  features: Record<PlanFeature, boolean>;
  includes: string[];
}

export const PLANS: Plan[] = [
  {
    id: "gratis",
    name: "Gratis",
    price: "0 kr",
    period: "för alltid",
    blurb: "Börja med manualen. Ingen risk.",
    seats: 1,
    features: {
      manual: true,
      yearWheel: false,
      suggestions: false,
      deviations: false,
      extraUsers: false,
      export: false,
      audit: false,
      remiss: false,
    },
    includes: ["Manualen", "Ett konto", "Spara i molnet"],
  },
  {
    id: "small",
    name: "Small",
    price: "1 490 kr",
    period: "/år",
    blurb: "Manualen plus årshjul och tre personer.",
    seats: 3,
    features: {
      manual: true,
      yearWheel: true,
      suggestions: true,
      deviations: false,
      extraUsers: true,
      export: false,
      audit: false,
      remiss: false,
    },
    includes: ["Allt i Gratis", "Årshjul", "Förbättringsförslag", "Upp till 3 personer"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "2 990 kr",
    period: "/år",
    blurb: "Fullt arbete: avvikelse, revision, export.",
    seats: 10,
    featured: true,
    features: {
      manual: true,
      yearWheel: true,
      suggestions: true,
      deviations: true,
      extraUsers: true,
      export: true,
      audit: true,
      remiss: false,
    },
    includes: ["Allt i Small", "Avvikelser", "Intern revision", "Export", "Upp till 10 personer"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "5 990 kr",
    period: "/år",
    blurb: "Fler personer, remiss och spår på ändringar.",
    seats: 50,
    features: {
      manual: true,
      yearWheel: true,
      suggestions: true,
      deviations: true,
      extraUsers: true,
      export: true,
      audit: true,
      remiss: true,
    },
    includes: ["Allt i Standard", "Remiss", "Upp till 50 personer", "Kommer: lagar och KPI"],
  },
];

export function planOf(id: string | null | undefined): Plan {
  return PLANS.find((item) => item.id === id) ?? PLANS.find((item) => item.id === "standard")!;
}

export function canPlan(id: string | null | undefined, feature: PlanFeature) {
  return planOf(id).features[feature];
}

export function neededPlan(feature: PlanFeature): Plan {
  return PLANS.find((item) => item.features[feature]) ?? PLANS[2];
}
