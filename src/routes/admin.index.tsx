import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Globe, Clock, ShieldQuestion, Inbox, RefreshCw, Flag, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle } from "@/components/admin/kit";
import { formatDate } from "@/lib/labels";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const count = async (table: "cases" | "submissions" | "case_updates" | "reports" | "documents", f?: (q: any) => any) => {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (f) q = f(q);
  const { count } = await q;
  return count ?? 0;
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: s } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [total, published, review, verifying, subs, ups, reports, docs] = await Promise.all([
        count("cases"), count("cases", (q) => q.eq("publication_status", "PUBLISHED")), count("cases", (q) => q.eq("publication_status", "PENDING_REVIEW")),
        count("cases", (q) => q.eq("verification_status", "UNDER_VERIFICATION")), count("submissions", (q) => q.eq("status", "PENDING")),
        count("case_updates", (q) => q.gte("created_at", weekAgo)), count("reports", (q) => q.eq("status", "NEW")), count("documents", (q) => q.gte("created_at", weekAgo)),
      ]);
      return { total, published, review, verifying, subs, ups, reports, docs };
    },
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8)).data ?? [],
  });
  const { data: series = [] } = useQuery({
    queryKey: ["admin-series"],
    queryFn: async () => {
      const since = new Date(Date.now() - 180 * 86400000).toISOString();
      const [c, sb, u] = await Promise.all([
        supabase.from("cases").select("created_at").gte("created_at", since),
        supabase.from("submissions").select("created_at").gte("created_at", since),
        supabase.from("case_updates").select("created_at").gte("created_at", since),
      ]);
      const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); });
      const bucket = (rows: { created_at: string }[] | null) => months.map((m) => (rows ?? []).filter((r) => r.created_at.startsWith(m)).length);
      const cs = bucket(c.data), ss = bucket(sb.data), us = bucket(u.data);
      return months.map((m, i) => ({ m, cases: cs[i], subs: ss[i], ups: us[i] }));
    },
  });
  const max = Math.max(1, ...series.flatMap((r) => [r.cases, r.subs, r.ups]));

  const cards = [
    ["إجمالي القضايا", s?.total, FolderOpen, "/admin/cases"], ["القضايا المنشورة", s?.published, Globe, "/admin/cases"],
    ["قيد المراجعة", s?.review, Clock, "/admin/cases"], ["قيد التحقق", s?.verifying, ShieldQuestion, "/admin/cases"],
    ["مساهمات جديدة", s?.subs, Inbox, "/admin/submissions"], ["تحديثات هذا الأسبوع", s?.ups, RefreshCw, "/admin/updates"],
    ["بلاغات جديدة", s?.reports, Flag, "/admin/reports"], ["وثائق جديدة", s?.docs, FileText, "/admin/documents"],
  ] as const;

  return (
    <>
      <AdminTitle title="لوحة التحكم" sub={`مرحبًا، ${user.email}. إليك نظرة عامة على المنصة.`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([l, v, I, to]) => (
          <Link key={l} to={to} className="rounded-2xl border bg-card p-5 transition hover:shadow-soft">
            <I className="h-5 w-5 text-olive" /><p className="mt-3 text-3xl font-bold text-primary">{v ?? "…"}</p><p className="text-sm text-muted-foreground">{l}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold text-primary">النشاط خلال 6 أشهر</h2>
          <div className="mt-6 flex h-48 items-end gap-3">
            {series.map((r) => (
              <div key={r.m} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-0.5">
                  <div className="w-2 rounded-t bg-primary" style={{ height: `${(r.cases / max) * 100}%` }} title={`قضايا ${r.cases}`} />
                  <div className="w-2 rounded-t bg-olive" style={{ height: `${(r.subs / max) * 100}%` }} title={`مساهمات ${r.subs}`} />
                  <div className="w-2 rounded-t bg-gold" style={{ height: `${(r.ups / max) * 100}%` }} title={`تحديثات ${r.ups}`} />
                </div>
                <span className="text-[10px] text-muted-foreground" dir="ltr">{r.m.slice(5)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded bg-primary" />القضايا</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded bg-olive" />المساهمات</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded bg-gold" />التحديثات</span>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold text-primary">آخر النشاطات</h2>
          <ul className="mt-4 divide-y text-sm">
            {activity.map((a) => <li key={a.id} className="flex justify-between gap-2 py-2"><span className="font-mono text-xs">{a.action}</span><span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span></li>)}
            {activity.length === 0 && <li className="py-4 text-muted-foreground">لا يوجد نشاط بعد.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
