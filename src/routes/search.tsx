import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, PersonPhoto, VerificationBadge } from "@/components/site/bits";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, personStatusLabels } from "@/lib/labels";
import type { CaseRow } from "@/lib/data";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q.slice(0, 100) : "" }),
  head: () => ({
    meta: [
      { title: "البحث — نُصرة" },
      { name: "description", content: "ابحث في القضايا والأسماء وأرقام القضايا والتحديثات والمصادر العامة." },
      { property: "og:title", content: "البحث — نُصرة" },
      { property: "og:description", content: "ابحث في قضايا نُصرة." },
    ],
  }),
  component: SearchPage,
});

const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim();

async function runSearch(q: string) {
  const t = clean(q);
  if (!t) return { cases: [] as CaseRow[] };
  const like = `%${t}%`;
  const [byCase, byPerson, byUpdate, bySource] = await Promise.all([
    supabase.from("cases").select("id").or(`title.ilike.${like},case_number.ilike.${like},summary.ilike.${like},story.ilike.${like}`),
    supabase.from("persons").select("id").or(`full_name.ilike.${like},display_name.ilike.${like}`),
    supabase.from("case_updates").select("case_id").or(`title.ilike.${like},summary.ilike.${like}`),
    supabase.from("sources").select("case_id").ilike("name", like),
  ]);
  const caseIds = new Set<string>([...(byCase.data ?? []).map((r) => r.id), ...(byUpdate.data ?? []).map((r) => r.case_id), ...(bySource.data ?? []).map((r) => r.case_id!).filter(Boolean)]);
  const personIds = (byPerson.data ?? []).map((r) => r.id);
  let query = supabase.from("cases").select("*, person:persons(*)").eq("publication_status", "PUBLISHED");
  const ors = [];
  if (caseIds.size) ors.push(`id.in.(${[...caseIds].join(",")})`);
  if (personIds.length) ors.push(`person_id.in.(${personIds.join(",")})`);
  if (!ors.length) return { cases: [] };
  query = query.or(ors.join(","));
  const { data } = await query;
  return { cases: (data ?? []) as unknown as CaseRow[] };
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(q);
  const { data, isFetching } = useQuery({ queryKey: ["search", q], queryFn: () => runSearch(q), enabled: !!q });
  return (
    <>
      <PageHeader title="البحث">
        <form className="mt-6 flex max-w-2xl items-center gap-2 rounded-xl border bg-card px-3" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q: input } }); }}>
          <Search className="h-5 w-5 text-muted-foreground" />
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} maxLength={100} placeholder="ابحث عن اسم، رقم قضية، تحديث، مصدر..." className="h-12 flex-1 bg-transparent outline-none" />
        </form>
      </PageHeader>
      <div className="container-page max-w-3xl space-y-3 py-10">
        {isFetching && <p className="text-muted-foreground">جارٍ البحث…</p>}
        {q && data && <p className="text-sm text-muted-foreground">النتائج عن: «{q}» ({data.cases.length})</p>}
        {data?.cases.map((c) => (
          <Link key={c.id} to="/cases/$slug" params={{ slug: c.slug }} className="flex gap-4 rounded-xl border bg-card p-4 transition hover:border-olive">
            <PersonPhoto src={c.person?.photo_url} name={c.person?.full_name ?? ""} className="h-20 w-20 shrink-0 rounded-lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-primary">{c.person?.full_name}</h3><VerificationBadge status={c.verification_status} /></div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{personStatusLabels[c.person_status]} · آخر تحديث {formatDate(c.last_known_update)}</p>
            </div>
          </Link>
        ))}
        {q && data && data.cases.length === 0 && <p className="py-10 text-center text-muted-foreground">لم نجد نتائج مطابقة.</p>}
      </div>
    </>
  );
}
