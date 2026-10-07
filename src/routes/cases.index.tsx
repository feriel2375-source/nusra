import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/site/bits";
import { CaseCard } from "@/components/site/CaseCard";
import { fetchPublicCases } from "@/lib/data";
import { personStatusLabels, verificationLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "القضايا — نُصرة" },
      { name: "description", content: "تعرّف على القضايا التي يتم توثيقها ومتابعتها على منصة نُصرة." },
      { property: "og:title", content: "القضايا — نُصرة" },
      { property: "og:description", content: "تعرّف على القضايا التي يتم توثيقها ومتابعتها." },
    ],
  }),
  component: CasesPage,
});

const PAGE = 9;
const sel = "h-10 rounded-md border bg-card px-3 text-sm";

function CasesPage() {
  const { data: cases = [], isLoading } = useQuery({ queryKey: ["public-cases"], queryFn: fetchPublicCases });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [ver, setVer] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const types = [...new Set(cases.map((c) => c.case_type))];

  const filtered = useMemo(() => {
    const s = q.trim();
    let list = cases.filter((c) =>
      (!s || c.person?.full_name.includes(s) || c.case_number.toLowerCase().includes(s.toLowerCase()) || c.title.includes(s)) &&
      (!status || c.person_status === status) && (!ver || c.verification_status === ver) && (!type || c.case_type === type));
    list = [...list].sort((a, b) => sort === "added"
      ? new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime()
      : new Date(b.last_known_update ?? 0).getTime() - new Date(a.last_known_update ?? 0).getTime());
    return list;
  }, [cases, q, status, ver, type, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  return (
    <>
      <PageHeader title="القضايا" description="تعرّف على القضايا التي يتم توثيقها ومتابعتها.">
        <div className="mt-6 flex max-w-xl items-center gap-2 rounded-xl border bg-card px-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ابحث بالاسم أو رقم القضية..." className="h-12 flex-1 bg-transparent outline-none" maxLength={100} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <select className={sel} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="الحالة">
            <option value="">كل الحالات</option>
            {Object.entries(personStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={sel} value={ver} onChange={(e) => { setVer(e.target.value); setPage(1); }} aria-label="التحقق">
            <option value="">كل حالات التحقق</option>
            {Object.entries(verificationLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className={sel} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="نوع القضية">
            <option value="">كل الأنواع</option>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className={sel} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب">
            <option value="updated">آخر تحديث</option>
            <option value="added">تاريخ الإضافة</option>
          </select>
        </div>
      </PageHeader>
      <section className="container-page py-10">
        {isLoading ? <p className="text-muted-foreground">جارٍ التحميل…</p> : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">لا توجد قضايا مطابقة.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice((page - 1) * PAGE, page * PAGE).map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        )}
        {pages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => (
              <Button key={i} size="sm" variant={page === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
