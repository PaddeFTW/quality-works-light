export type DeviationStatus = "open" | "in_progress" | "closed";
export type SuggestionStatus = "new" | "reviewing" | "done" | "rejected";
export type ActivityStatus = "planned" | "done" | "skipped";
export type Severity = "low" | "medium" | "high";

export interface Deviation {
  id: string;
  organizationId: string;
  number: number;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  status: DeviationStatus;
  action: string;
  ownerName: string;
  dueDate: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  organizationId: string;
  number: number;
  title: string;
  description: string;
  status: SuggestionStatus;
  createdBy: string | null;
  createdAt: string;
}

export interface YearActivity {
  id: string;
  organizationId: string;
  title: string;
  kind: string;
  plannedOn: string;
  ownerName: string;
  status: ActivityStatus;
  notes: string;
}

export interface OpsStats {
  openDeviations: number;
  openSuggestions: number;
  upcomingActivities: YearActivity[];
  recentDeviations: Deviation[];
}
