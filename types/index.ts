import type { ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface NavItem {
  title: string;
  href: string;
  icon?: ReactNode;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface ShellAction {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export type {
  DocumentVersion,
  ManualAttachment,
  ManualSettings,
  MemberRole,
  Organization,
  OrganizationMember,
  Profile,
  ReviewRequest,
  ReviewStatus,
} from "./domain";
