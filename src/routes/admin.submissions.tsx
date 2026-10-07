import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, FilePlus2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Pager, Pill, Table, Td, selectCls, useAdminCaseOptions } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, submissionStatusLabels, submissionTypeLabels } from "@/lib/labels";
import { openDoc } from "./admin.documents";
import type { Database } from "@/integrations/supabase/types";

type Sub = Database["public"]["Tables"]["submissions"]["Row"] & { case: { case_number: string } | null; documents: { id: string; file_name: string; file_path: string }[] };
export const Route = createFileRoute("/admin/submissions")({ component: Page });

const riskLabel: Record<string, string> = { SAFE: "آمن للنشر", ANONYMOUS: "بدون ذكر المصدر", DANGER: "قد يعرّض أحدًا للخطر", UNSURE: "غير متأكد" };

function Page() {
  const { canEdit, user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: cases = [] } = useAdminCaseOptions();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [page, setPage] = useState(1);
  const [cur, setCur] = useState<Sub | null>(null);
  const [notes, setNotes] = useState("");
  const [caseId, setCaseId] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => ((await supabase.from("submissions").select("*, case:cases(case_number), documents(id, file_name, file_path)").order("created_at", { ascending: false })).data ?? []) as Sub[],
  });
  const list = data.filter((s) => (!q || s.reference_number.includes(q) || s.content.includes(q)) && (!st || s.status === st));
  const open = (s: Sub) => { setCur(s); setNotes(s.review_notes ?? ""); setCaseId(s.case_id ?? ""); };
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-submissions"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); };

  const setStatus = async (status: Sub["status"]) => {
    if (!cur) return;
    const { error } = await supabase.from("submissions").update({ status, review_notes: notes || null, case_id: caseId || null, reviewer_id: user.id }).eq("id", cur.id);
    if (error) return toast.error(error.message);
    toast.success(`الحالة: ${submissionStatusLabels[status]}`); setCur(null); refresh();
  };
  const toCase = async () => {
    if (!cur) return;
    const p = (cur.payload ?? {}) as Record<string, string>;
    const name = p["full_name"] || p["name"] || prompt("اسم الشخص:") || "";
    if (!name.trim()) return;
    const { data: person, error: pe } = await supabase.from("persons").insert({ full_name: name.slice(0, 200), country: p["country"] || null }).select().single();
    if (pe) return toast.error(pe.message);
    const { data: c, error } = await supabase.from("cases").insert({ title: `قضية ${name}`.slice(0, 200), slug: `case-${Date.now().toString(36)}`, person_id: person.id, summary: cur.content.slice(0, 1000), unverified_info: cur.content, publication_status: "DRAFT", verification_status: "UNDER_VERIFICATION" }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("submissions").update({ status: "APPROVED", case_id: c.id, reviewer_id: user.id, review_notes: notes || null }).eq("id", cur.id);
    await supabase.from("documents").update({ case_id: c.id }).eq("submission_id", cur.id);
    toast.success("أُنشئت مسودة قضية — راجعها قبل النشر");
    navigate({ to: "/admin/cases/$id", params: { id: c.id } });
  };

  return (
    <>
      <AdminTitle title="المساهمات الواردة" sub="لا يُنشر شيء تلقائيًا؛ كل مساهمة تُراجع يدويًا." />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Input placeholder="رقم المرجع أو نص..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className={selectCls} value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }}><option value="">كل الحالات</option>{Object.entries(submissionStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <Table head={["المرجع", "النوع", "القضية", "السلامة", "مرفقات", "الحالة", "التاريخ", ""]} empty={!list.length}>
        {list.slice((page - 1) * 15, page * 15).map((s) => (
          <tr key={s.id} className="hover:bg-secondary/30">
            <Td className="font-mono text-xs">{s.reference_number}</Td>
            <Td>{submissionTypeLabels[s.submission_type] ?? s.submission_type}</Td>
            <Td>{s.case?.case_number ?? "—"}</Td>
            <Td>{s.risk_answer === "DANGER" ? <Pill className="bg-destructive/15 text-destructive">خطر</Pill> : riskLabel[s.risk_answer] ?? s.risk_answer}</Td>
            <Td>{s.documents.length || "—"}</Td>
            <Td><Pill>{submissionStatusLabels[s.status]}</Pill></Td>
            <Td>{formatDate(s.created_at)}</Td>
            <Td><Button size="sm" variant="outline" onClick={() => open(s)}><Eye />مراجعة</Button></Td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(list.length / 15)} setPage={setPage} />

      <Dialog open={!!cur} onOpenChange={(o) => !o && setCur(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {cur && <>
            <DialogHeader><DialogTitle>مساهمة {cur.reference_number}</DialogTitle></DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2"><Pill>{submissionTypeLabels[cur.submission_type]}</Pill><Pill>{submissionStatusLabels[cur.status]}</Pill><Pill className={cur.risk_answer === "DANGER" ? "bg-destructive/15 text-destructive" : undefined}>{riskLabel[cur.risk_answer] ?? cur.risk_answer}</Pill></div>
              <div className="whitespace-pre-wrap rounded-xl bg-secondary/50 p-4 leading-7">{cur.content}</div>
              {cur.source_description && <p><b>المصدر:</b> {cur.source_description} {cur.can_name_source === false && "(لا يُذكر)"}</p>}
              {(cur.submitter_name || cur.submitter_email) && <p><b>المرسل (سري):</b> {cur.submitter_name} {cur.submitter_email}</p>}
              {cur.payload && Object.keys(cur.payload as object).length > 0 && <details><summary className="cursor-pointer text-primary">بيانات إضافية</summary><pre dir="ltr" className="mt-2 overflow-auto rounded bg-secondary p-2 text-xs">{JSON.stringify(cur.payload, null, 2)}</pre></details>}
              {cur.documents.length > 0 && <div className="flex flex-wrap gap-2">{cur.documents.map((d) => <Button key={d.id} size="sm" variant="outline" onClick={() => openDoc(d.file_path)}>{d.file_name}</Button>)}</div>}
              {canEdit && <>
                <div><Label>ربط بقضية</Label><select className={selectCls + " mt-1.5"} value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">—</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}</select></div>
                <div><Label>ملاحظات المراجعة (داخلية)</Label><Textarea className="mt-1.5" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setStatus("UNDER_REVIEW")}>قيد المراجعة</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus("NEEDS_MORE_INFO")}>تحتاج معلومات</Button>
                  <Button size="sm" onClick={() => setStatus("APPROVED")}>اعتماد</Button>
                  <Button size="sm" variant="destructive" onClick={() => setStatus("REJECTED")}>رفض</Button>
                  {!cur.case_id && <Button size="sm" variant="olive" onClick={toCase}><FilePlus2 />تحويل إلى مسودة قضية</Button>}
                </div>
              </>}
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </>
  );
}
