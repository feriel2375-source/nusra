import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Archive, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Pager, Pill, Table, Td, selectCls } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerificationBadge } from "@/components/site/bits";
import { formatDate, personStatusLabels, publicationLabels, riskLabels } from "@/lib/labels";

export const Route = createFileRoute("/admin/cases/")({ component: AdminCases });
const PAGE = 15;

function AdminCases() {
  const { canEdit } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [pub, setPub] = useState("");
  const [risk, setRisk] = useState("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const { data = [] } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: async () => (await supabase.from("cases").select("*, person:persons(full_name, photo_url)").order("updated_at", { ascending: false })).data ?? [],
  });
  const list = data.filter((c) => (!q || c.title.includes(q) || c.case_number.includes(q) || c.person?.full_name?.includes(q)) && (!pub || c.publication_status === pub) && (!risk || c.risk_level === risk));
  const pages = Math.ceil(list.length / PAGE);

  const archive = async (ids: string[]) => {
    if (!confirm(`أرشفة ${ids.length} قضية؟`)) return;
    const { error } = await supabase.from("cases").update({ publication_status: "ARCHIVED" }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success("تمت الأرشفة"); setSel([]); qc.invalidateQueries({ queryKey: ["admin-cases"] });
  };
  const create = async () => {
    const name = prompt("اسم الشخص:");
    if (!name?.trim()) return;
    const { data: p, error: pe } = await supabase.from("persons").insert({ full_name: name.trim().slice(0, 200) }).select().single();
    if (pe) return toast.error(pe.message);
    const slug = `case-${Date.now().toString(36)}`;
    const { data: c, error } = await supabase.from("cases").insert({ title: `قضية ${name.trim()}`, slug, person_id: p.id }).select().single();
    if (error) return toast.error(error.message);
    navigate({ to: "/admin/cases/$id", params: { id: c.id } });
  };

  return (
    <>
      <AdminTitle title="إدارة القضايا" sub={`${list.length} قضية`}>
        {canEdit && sel.length > 0 && <Button variant="outline" onClick={() => archive(sel)}><Archive />أرشفة المحدد ({sel.length})</Button>}
        {canEdit && <Button variant="olive" onClick={create}><Plus />قضية جديدة</Button>}
      </AdminTitle>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Input placeholder="ابحث بالاسم أو رقم القضية..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className={selectCls} value={pub} onChange={(e) => { setPub(e.target.value); setPage(1); }}><option value="">كل حالات النشر</option>{Object.entries(publicationLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className={selectCls} value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1); }}><option value="">كل درجات الخطر</option>{Object.entries(riskLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div>
      <Table head={["", "رقم القضية", "الشخص", "الحالة", "النشر", "التحقق", "الخطر", "آخر تحديث", "الإنشاء", "إجراءات"]} empty={!list.length}>
        {list.slice((page - 1) * PAGE, page * PAGE).map((c) => (
          <tr key={c.id} className="hover:bg-secondary/30">
            <Td><input type="checkbox" checked={sel.includes(c.id)} onChange={(e) => setSel(e.target.checked ? [...sel, c.id] : sel.filter((x) => x !== c.id))} aria-label="تحديد" /></Td>
            <Td className="font-mono text-xs">{c.case_number}</Td>
            <Td className="font-medium">{c.person?.full_name ?? c.title}</Td>
            <Td>{personStatusLabels[c.person_status]}</Td>
            <Td><Pill>{publicationLabels[c.publication_status]}</Pill></Td>
            <Td><VerificationBadge status={c.verification_status} /></Td>
            <Td><Pill className={riskLabels[c.risk_level].cls}>{riskLabels[c.risk_level].label}</Pill></Td>
            <Td className="whitespace-nowrap text-xs">{formatDate(c.updated_at)}</Td>
            <Td className="whitespace-nowrap text-xs">{formatDate(c.created_at)}</Td>
            <Td>
              <div className="flex gap-1">
                {c.publication_status === "PUBLISHED" && <Button asChild size="icon" variant="ghost" title="عرض"><Link to="/cases/$slug" params={{ slug: c.slug }}><Eye /></Link></Button>}
                <Button asChild size="icon" variant="ghost" title="مراجعة / تعديل"><Link to="/admin/cases/$id" params={{ id: c.id }}><Pencil /></Link></Button>
                {canEdit && c.publication_status !== "ARCHIVED" && <Button size="icon" variant="ghost" title="أرشفة" onClick={() => archive([c.id])}><Archive /></Button>}
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={pages} setPage={setPage} />
    </>
  );
}
