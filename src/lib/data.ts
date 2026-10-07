import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Person = Tables<"persons">;
export type CaseRow = Tables<"cases"> & { person: Person | null; sources?: { count: number }[] };
export type UpdateRow = Tables<"case_updates"> & { case: { slug: string; title: string; person: { full_name: string; photo_url: string | null } | null } | null };

const caseSelect = "*, person:persons(*), sources(count)";

export async function fetchPublicCases(): Promise<CaseRow[]> {
  const { data, error } = await supabase
    .from("cases")
    .select(caseSelect)
    .eq("publication_status", "PUBLISHED")
    .order("last_known_update", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CaseRow[];
}

export async function fetchCaseBySlug(slug: string) {
  const { data, error } = await supabase.from("cases").select(caseSelect).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const c = data as unknown as CaseRow;
  const [sources, timeline, updates, help, docs] = await Promise.all([
    supabase.from("sources").select("*").eq("case_id", c.id).order("publication_date", { ascending: false }),
    supabase.from("timeline_events").select("*").eq("case_id", c.id).order("event_date"),
    supabase.from("case_updates").select("*").eq("case_id", c.id).order("created_at", { ascending: false }),
    supabase.from("help_actions").select("*").eq("case_id", c.id),
    supabase.from("documents").select("id,title,file_type,created_at").eq("case_id", c.id),
  ]);
  return {
    case: c,
    sources: sources.data ?? [],
    timeline: timeline.data ?? [],
    updates: updates.data ?? [],
    help: help.data ?? [],
    docs: docs.data ?? [],
  };
}

export async function fetchPublicUpdates(limit = 50): Promise<UpdateRow[]> {
  const { data, error } = await supabase
    .from("case_updates")
    .select("*, case:cases(slug,title,person:persons(full_name,photo_url))")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as UpdateRow[];
}

export function sourceCount(c: CaseRow) {
  return c.sources?.[0]?.count ?? 0;
}
