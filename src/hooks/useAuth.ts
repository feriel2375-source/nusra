import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
        if (active) setRoles((data ?? []).map((r) => r.role));
      } else setRoles([]);
      if (active) setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load(session?.user ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const isStaff = roles.some((r) => ["reviewer", "editor", "admin"].includes(r));
  const canEdit = roles.some((r) => ["editor", "admin"].includes(r));
  const isAdmin = roles.includes("admin");
  return { user, roles, loading, isStaff, canEdit, isAdmin };
}
