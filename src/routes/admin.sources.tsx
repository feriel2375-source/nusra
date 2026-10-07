import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, opts } from "@/components/admin/crud";
import { Pill, useAdminCaseOptions } from "@/components/admin/kit";
import { formatDate, reliabilityLabels, sourceTypeLabels } from "@/lib/labels";

export const Route = createFileRoute("/admin/sources")({ component: Page });

function Page() {
  const { canEdit } = Route.useRouteContext();
  const { data: cases = [] } = useAdminCaseOptions();
  const caseOpts: [string, string][] = cases.map((c) => [c.id, `${c.case_number} — ${c.title}`]);
  return (
    <CrudPage
      table="sources" title="المصادر" select="*, case:cases(case_number)" canEdit={canEdit}
      searchKeys={["name", "case.case_number"]}
      filter={{ key: "type", label: "النوع", options: opts(sourceTypeLabels) }}
      defaults={{ type: "MEDIA", reliability: "MEDIUM", is_public: false }}
      fields={[
        { key: "case_id", label: "القضية", type: "select", options: caseOpts },
        { key: "name", label: "اسم المصدر", required: true },
        { key: "type", label: "النوع", type: "select", required: true, options: opts(sourceTypeLabels) },
        { key: "url", label: "الرابط" },
        { key: "reliability", label: "الموثوقية", type: "select", required: true, options: opts(reliabilityLabels) },
        { key: "publication_date", label: "تاريخ النشر", type: "date" },
        { key: "notes", label: "ملاحظات داخلية", type: "textarea" },
        { key: "is_public", label: "يُعرض للعامة (لا تعرض الشهود أو العائلة دون موافقة)", type: "checkbox" },
      ]}
      cols={[
        { label: "المصدر", render: (r) => r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">{r.name}</a> : <span className="font-medium">{r.name}</span> },
        { label: "النوع", render: (r) => sourceTypeLabels[r.type] },
        { label: "الموثوقية", render: (r) => reliabilityLabels[r.reliability] ?? r.reliability },
        { label: "القضية", render: (r) => r.case?.case_number ?? "—" },
        { label: "الظهور", render: (r) => r.is_public ? <Pill className="bg-accent text-accent-foreground">عام</Pill> : <Pill>داخلي</Pill> },
        { label: "التاريخ", render: (r) => formatDate(r.publication_date) },
      ]}
    />
  );
}
