/**
 * Which modules are visible in the product.
 * Set enabled: false to hide unfinished modules from the sidebar.
 * Roles control who may open an enabled module.
 */

export type AppRole = "admin" | "editor" | "viewer";

export type ModuleKey =
  | "dashboard"
  | "manual"
  | "swot"
  | "mal"
  | "arshjul"
  | "kompetens"
  | "kund"
  | "leverantor"
  | "lagar"
  | "miljoaspekter"
  | "kontroller"
  | "avvikelse"
  | "forslag"
  | "intern-revision"
  | "ledningsgenomgang"
  | "installningar";

export interface ModuleFeature {
  key: ModuleKey;
  href: string;
  /** Show in navigation when true */
  enabled: boolean;
  /** Minimum role that may see the module */
  minRole: AppRole;
  /** viewer may only read / kvittera */
  viewerAccess: "none" | "read" | "acknowledge";
}

const roleRank: Record<AppRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

export function roleAtLeast(userRole: AppRole, minRole: AppRole) {
  return roleRank[userRole] >= roleRank[minRole];
}

/** Toggle modules here – unfinished = enabled: false */
export const moduleFeatures: ModuleFeature[] = [
  { key: "dashboard", href: "/", enabled: true, minRole: "viewer", viewerAccess: "read" },
  { key: "manual", href: "/manual", enabled: true, minRole: "viewer", viewerAccess: "acknowledge" },
  { key: "swot", href: "/swot", enabled: true, minRole: "editor", viewerAccess: "read" },
  { key: "mal", href: "/mal", enabled: true, minRole: "editor", viewerAccess: "read" },
  { key: "arshjul", href: "/arshjul", enabled: true, minRole: "viewer", viewerAccess: "read" },
  { key: "kompetens", href: "/kompetens", enabled: false, minRole: "editor", viewerAccess: "read" },
  { key: "kund", href: "/kund", enabled: false, minRole: "editor", viewerAccess: "read" },
  { key: "leverantor", href: "/leverantor", enabled: false, minRole: "editor", viewerAccess: "read" },
  { key: "lagar", href: "/lagar", enabled: true, minRole: "editor", viewerAccess: "read" },
  { key: "miljoaspekter", href: "/miljoaspekter", enabled: false, minRole: "editor", viewerAccess: "read" },
  { key: "kontroller", href: "/kontroller", enabled: true, minRole: "editor", viewerAccess: "read" },
  { key: "avvikelse", href: "/avvikelse", enabled: true, minRole: "viewer", viewerAccess: "acknowledge" },
  { key: "forslag", href: "/forslag", enabled: true, minRole: "viewer", viewerAccess: "acknowledge" },
  { key: "intern-revision", href: "/intern-revision", enabled: false, minRole: "editor", viewerAccess: "read" },
  { key: "ledningsgenomgang", href: "/ledningsgenomgang", enabled: false, minRole: "admin", viewerAccess: "none" },
  { key: "installningar", href: "/installningar", enabled: true, minRole: "admin", viewerAccess: "none" },
];

export function isModuleVisible(href: string, role: AppRole = "admin") {
  const feature = moduleFeatures.find((item) => item.href === href);
  if (!feature) return true;
  if (!feature.enabled) return false;
  return roleAtLeast(role, feature.minRole);
}
