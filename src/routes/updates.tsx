import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/site/bits";
import { UpdateItem } from "@/components/site/CaseCard";
import { fetchPublicUpdates } from "@/lib/data";
import { verificationLabels } from "@/lib/labels";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "آخر التحديثات — نُصرة" },
      { name: "description", content: "تابع أحدث ما طرأ على القضايا الموثقة في نُصرة." },
      { property: "og:title", content: "آخر التحديثات — نُصرة" },
      { property: "og:description", content: "تابع أحدث ما طرأ على القضايا." },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["public-updates", 100], queryFn: () => fetchPublicUpdates(100) });
  const [ver, setVer] = useState("");
  const [type, setType] = useState("");
  const types = [...new Set(data.map((u) => u.update_type))];
  const list = data.filter((u) => (!ver || u.verification_status === ver) && (!type || u.update_type === type));
  return (
    <>
      <PageHeader title="آخر التحديثات" description="تابع أحدث ما حدث في القضايا.">
        <div className="mt-4 flex flex-wrap gap-2">
          <select className="h-10 rounded-md border bg-card px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">كل الأنواع</option>{types.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-card px-3 text-sm" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="">كل حالات التحقق</option>{Object.entries(verificationLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </PageHeader>
      <div className="container-page max-w-3xl space-y-3 py-10">
        {isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}
        {list.map((u) => <UpdateItem key={u.id} u={u} />)}
        {!isLoading && list.length === 0 && <p className="text-center text-muted-foreground">لا توجد تحديثات.</p>}
      </div>
    </>
  );
}
