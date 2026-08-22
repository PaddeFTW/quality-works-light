/** Domain types for Quality Works Light (multi-tenant management system). */

export type MemberRole = "admin" | "editor" | "viewer";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Organization {
  id: string;
  name: string;
  orgNumber?: string | null;
  industry?: string | null;
  slug?: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName?: string | null;
  email?: string | null;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
}

export interface ManualSettings {
  name: string;
  issuer: string;
  reviewer: string;
  approver: string;
  logo: string;
  headerText: string;
  footerText: string;
}

export interface DocumentVersion {
  id: string;
  edition: number;
  content: string;
  publishedAt: string;
  publishedByName?: string;
}

export interface ManualAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  /** Local object URL or remote storage URL */
  url?: string;
  /** Present when selected from disk before upload */
  file?: File;
}

export interface ReviewRequest {
  id: string;
  documentId: string;
  reviewerName: string;
  status: ReviewStatus;
  createdAt: string;
  message?: string;
}
