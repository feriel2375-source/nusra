import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/settings")({ component: Page });

const FIELDS: { key: string; label: string; long?: boolean }[] = [
  { key: "platform_name", label: "اسم المنصة" },
  { key: "tagline", label: "الشعار" },
  { key: "description", label: "وصف المنصة", long: true },
  { key: "email", label: "البريد الرسمي" },
  { key: "emergency_note", label: "تنبيه السلامة للمساهمين", long: true },
  { key: "twitter", label: "رابط X" },
  { key: "telegram", label: "رابط تيليغرام" },
];

function Page() {
  const { isAdmin } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: async () => (await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()).data });
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => { if (data) setV((data.data ?? {}) as Record<string, string>); }, [data]);
  if (!isAdmin) return <AdminTitle title="غير مصرح" sub="هذه الصفحة للمديرين فقط." />;
  const save = async () => {
    const { error } = await supabase.from("site_settings").upsert({ id: 1, data: v });
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات"); qc.invalidateQueries({ queryKey: ["site-settings"] });
  };
  return (
    <>
      <AdminTitle title="إعدادات المنصة" />
      <div className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <div className="mt-1.5">{f.long ? <Textarea rows={3} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} /> : <Input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}</div>
          </div>
        ))}
        <Button onClick={save}>حفظ</Button>
      </div>
    </>
  );
}
