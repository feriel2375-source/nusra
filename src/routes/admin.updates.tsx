import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, opts } from "@/components/admin/crud";
import { Pill, useAdminCaseOptions } from "@/components/admin/kit";
import { VerificationBadge } from "@/components/site/bits";
import { formatDate, verificationLabels } from "@/lib/labels";

export const Route = createFileRoute("/admin/updates")({ component: Page });

function Page() {
  const { canEdit } = Route.useRouteContext();
  const { data: cases = [] } = useAdminCaseOptions();
  const caseOpts: [string, string][] = cases.map((c) => [c.id, `${c.case_number} — ${c.title}`]);
  return (
    <CrudPage
      table="case_updates" title="التحديثات" select="*, case:cases(case_number, title)" canEdit={canEdit}
      searchKeys={["title", "case.title", "case.case_number"]}
      filter={{ key: "is_published", label: "النشر", options: [["true", "منشور"], ["false", "غير منشور"]] }}
      defaults={{ update_type: "GENERAL", verification_status: "UNDER_VERIFICATION", visibility: "PUBLIC", is_published: false }}
      fields={[
        { key: "case_id", label: "القضية", type: "select", options: caseOpts, required: true },
        { key: "title", label: "العنوان", required: true },
        { key: "summary", label: "ملخص", type: "textarea" },
        { key: "content", label: "المحتوى", type: "textarea" },
        { key: "update_type", label: "النوع", type: "select", required: true, options: [["GENERAL", "عام"], ["LEGAL", "قانوني"], ["HEALTH", "صحي"], ["FAMILY", "عائلي"], ["RELEASE", "إفراج"], ["TRANSFER", "نقل"]] },
        { key: "verification_status", label: "التحقق", type: "select", required: true, options: opts(verificationLabels) },
        { key: "visibility", label: "الظهور", type: "select", required: true, options: [["PUBLIC", "عام"], ["INTERNAL", "داخلي"]] },
        { key: "is_published", label: "منشور للعامة (بعد المراجعة)", type: "checkbox" },
      ]}
      cols={[
        { label: "العنوان", render: (r) => <span className="font-medium">{r.title}</span> },
        { label: "القضية", render: (r) => r.case?.case_number ?? "—" },
        { label: "التحقق", render: (r) => <VerificationBadge status={r.verification_status} /> },
        { label: "النشر", render: (r) => r.is_published ? <Pill className="bg-accent text-accent-foreground">منشور</Pill> : <Pill>غير منشور</Pill> },
        { label: "التاريخ", render: (r) => formatDate(r.created_at) },
      ]}
    />
  );
}
