import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Pager, Pill, Table, Td, selectCls } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/audit-log")({ component: Page });

export const actionLabels: Record<string, string> = {
  CASE_CREATED: "إنشاء قضية", CASE_UPDATED: "تعديل قضية", CASE_PUBLISHED: "نشر قضية", CASE_ARCHIVED: "أرشفة قضية", CASE_DELETED: "حذف قضية",
  VERIFICATION_CHANGED: "تغيير التحقق", SUBMISSION_RECEIVED: "مساهمة جديدة", SUBMISSION_APPROVED: "اعتماد مساهمة", SUBMISSION_REJECTED: "رفض مساهمة",
  SUBMISSION_UPDATED: "تعديل مساهمة", DOCUMENT_UPLOADED: "رفع وثيقة", DOCUMENT_UPDATED: "تعديل وثيقة", DOCUMENT_DELETED: "حذف وثيقة",
  ROLE_GRANTED: "منح صلاحية", ROLE_REVOKED: "سحب صلاحية",
};

function Page() {
  const [a, setA] = useState("");
  const [page, setPage] = useState(1);
  const { data = [] } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const [{ data: logs }, { data: profs }, { data: cs }] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id, email, display_name"),
        supabase.from("cases").select("id, case_number"),
      ]);
      const m = new Map((profs ?? []).map((p) => [p.id, p.display_name || p.email]));
      const cm = new Map((cs ?? []).map((c) => [c.id, c.case_number]));
      return (logs ?? []).map((l) => ({ ...l, caseNo: l.case_id ? cm.get(l.case_id) : undefined, actor: l.actor_id ? m.get(l.actor_id) ?? "عضو فريق" : "زائر / النظام" }));
    },
  });
  const list = data.filter((l) => !a || l.action === a);
  return (
    <>
      <AdminTitle title="سجل النشاط" sub="كل تغيير حساس يُسجَّل تلقائيًا ولا يمكن تعديله." />
      <div className="mb-4 max-w-xs"><select className={selectCls} value={a} onChange={(e) => { setA(e.target.value); setPage(1); }}><option value="">كل الإجراءات</option>{Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <Table head={["الإجراء", "الجهة", "القضية", "المنفّذ", "الوقت", "التفاصيل"]} empty={!list.length}>
        {list.slice((page - 1) * 20, page * 20).map((l) => (
          <tr key={l.id}>
            <Td><Pill>{actionLabels[l.action] ?? l.action}</Pill></Td>
            <Td>{l.entity}</Td>
            <Td>{l.caseNo ?? "—"}</Td>
            <Td>{l.actor}</Td>
            <Td className="whitespace-nowrap">{new Date(l.created_at).toLocaleString("ar")}</Td>
            <Td>{(l.old_value || l.new_value) && <details><summary className="cursor-pointer text-xs text-primary">عرض</summary><pre dir="ltr" className="mt-2 max-h-60 max-w-md overflow-auto rounded bg-secondary p-2 text-[10px]">{JSON.stringify({ old: l.old_value, new: l.new_value }, null, 1)}</pre></details>}</Td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(list.length / 20)} setPage={setPage} />
    </>
  );
}
