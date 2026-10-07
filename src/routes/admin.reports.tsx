import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, opts } from "@/components/admin/crud";
import { Pill } from "@/components/admin/kit";
import { formatDate, reportStatusLabels, reportTypeLabels } from "@/lib/labels";

export const Route = createFileRoute("/admin/reports")({ component: Page });

const msgStatus: [string, string][] = [["NEW", "جديدة"], ["READ", "مقروءة"], ["REPLIED", "تم الرد"], ["ARCHIVED", "مؤرشفة"]];

function Page() {
  const { canEdit } = Route.useRouteContext();
  return (
    <div className="space-y-12">
      <CrudPage
        table="reports" title="البلاغات" select="*, case:cases(case_number, title)" canEdit={canEdit} allowCreate={false}
        searchKeys={["description", "case.case_number"]}
        filter={{ key: "status", label: "الحالة", options: opts(reportStatusLabels) }}
        fields={[
          { key: "status", label: "الحالة", type: "select", required: true, options: opts(reportStatusLabels) },
          { key: "resolution", label: "الإجراء المتخذ / ملاحظات", type: "textarea" },
        ]}
        cols={[
          { label: "النوع", render: (r) => reportTypeLabels[r.report_type] ?? r.report_type },
          { label: "الوصف", render: (r) => <p className="max-w-md whitespace-pre-wrap">{r.description}</p> },
          { label: "القضية", render: (r) => r.case?.case_number ?? "—" },
          { label: "الحالة", render: (r) => <Pill>{reportStatusLabels[r.status]}</Pill> },
          { label: "التاريخ", render: (r) => formatDate(r.created_at) },
        ]}
      />
      <CrudPage
        table="contact_messages" title="رسائل التواصل" canEdit={canEdit} allowCreate={false}
        searchKeys={["subject", "message", "name", "email"]}
        filter={{ key: "status", label: "الحالة", options: msgStatus }}
        fields={[{ key: "status", label: "الحالة", type: "select", required: true, options: msgStatus }]}
        cols={[
          { label: "المرسل", render: (r) => <div><p className="font-medium">{r.name || "مجهول"}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
          { label: "الموضوع", render: (r) => <div className="max-w-md"><p className="font-medium">{r.subject}</p><p className="whitespace-pre-wrap text-muted-foreground">{r.message}</p></div> },
          { label: "الحالة", render: (r) => <Pill>{msgStatus.find(([k]) => k === r.status)?.[1] ?? r.status}</Pill> },
          { label: "التاريخ", render: (r) => formatDate(r.created_at) },
        ]}
      />
    </div>
  );
}
