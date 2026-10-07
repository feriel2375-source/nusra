import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage } from "@/components/admin/crud";
import { Pill, useAdminCaseOptions } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/labels";

export const Route = createFileRoute("/admin/documents")({ component: Page });

export const docVisibility: [string, string][] = [["PUBLIC", "عامة"], ["REVIEWERS_ONLY", "للمراجعين فقط"], ["INTERNAL", "داخلية"], ["UNPUBLISHED", "غير منشورة"]];

export async function openDoc(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 120);
  if (error || !data) return toast.error("تعذّر فتح الملف");
  window.open(data.signedUrl, "_blank", "noopener");
}

function Page() {
  const { canEdit } = Route.useRouteContext();
  const { data: cases = [] } = useAdminCaseOptions();
  const caseOpts: [string, string][] = cases.map((c) => [c.id, `${c.case_number} — ${c.title}`]);
  return (
    <CrudPage
      table="documents" title="الوثائق" sub="تُرفع الوثائق من صفحة القضية أو تأتي مع المساهمات" allowCreate={false}
      select="*, case:cases(case_number), submission:submissions(reference_number)" canEdit={canEdit}
      searchKeys={["file_name", "title", "case.case_number"]}
      filter={{ key: "visibility", label: "الظهور", options: docVisibility }}
      fields={[
        { key: "title", label: "العنوان" },
        { key: "case_id", label: "القضية", type: "select", options: caseOpts },
        { key: "visibility", label: "الظهور", type: "select", required: true, options: docVisibility },
      ]}
      cols={[
        { label: "الملف", render: (r) => <span className="font-medium">{r.title || r.file_name}</span> },
        { label: "القضية", render: (r) => r.case?.case_number ?? "—" },
        { label: "المساهمة", render: (r) => r.submission?.reference_number ?? "—" },
        { label: "الظهور", render: (r) => <Pill>{docVisibility.find(([k]) => k === r.visibility)?.[1]}</Pill> },
        { label: "التاريخ", render: (r) => formatDate(r.created_at) },
      ]}
      extraActions={(r) => <Button size="icon" variant="ghost" title="فتح" onClick={() => openDoc(r.file_path)}><Download /></Button>}
    />
  );
}
