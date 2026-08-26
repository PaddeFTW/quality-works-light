"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/features";

export interface OrgSession {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  role: AppRole;
  manualId: string | null;
}

interface OrgContextValue {
  session: OrgSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue>({
  session: null,
  loading: true,
  refresh: async () => undefined,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OrgSession | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, organization_id, organizations ( id, name )")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      setSession({
        userId: user.id,
        email: user.email ?? "",
        fullName: (user.user_metadata?.full_name as string | undefined) || user.email || "",
        organizationId: "",
        organizationName: "",
        role: "viewer",
        manualId: null,
      });
      setLoading(false);
      return;
    }

    const org = membership.organizations as unknown as { id: string; name: string } | { id: string; name: string }[] | null;
    const orgRow = Array.isArray(org) ? org[0] : org;
    const organizationId = membership.organization_id as string;

    const { data: manual } = await supabase
      .from("manuals")
      .select("id")
      .eq("organization_id", organizationId)
      .limit(1)
      .maybeSingle();

    setSession({
      userId: user.id,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string | undefined) || user.email || "",
      organizationId,
      organizationName: orgRow?.name ?? "Företag",
      role: (membership.role as AppRole) || "viewer",
      manualId: manual?.id ?? null,
    });
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <OrgContext.Provider value={{ session, loading, refresh }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgSession() {
  return useContext(OrgContext);
}
