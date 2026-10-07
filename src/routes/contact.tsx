import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/bits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — نُصرة" },
      { name: "description", content: "تواصل مع فريق نُصرة لاستفسار عام أو تصحيح معلومة أو طلب حذف أو تعديل." },
      { property: "og:title", content: "تواصل معنا — نُصرة" },
      { property: "og:description", content: "تواصل مع فريق نُصرة." },
    ],
  }),
  component: Contact,
});

const types = ["استفسار عام", "تصحيح معلومة", "طلب حذف/تعديل", "مشكلة تقنية", "معلومة عن قضية"];
const schema = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().email("البريد الإلكتروني غير صالح").max(255),
  subject: z.string().trim().min(3, "الموضوع قصير جدًا").max(200),
  message: z.string().trim().min(10, "الرسالة قصيرة جدًا").max(5000),
});

function Contact() {
  const [f, setF] = useState({ name: "", email: "", type: types[0], subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.rpc("submit_contact", { _name: p.data.name, _email: p.data.email, _type: f.type, _subject: p.data.subject, _message: p.data.message });
    setBusy(false);
    if (error) return toast.error("تعذّر الإرسال.");
    setDone(true);
  };
  return (
    <>
      <PageHeader title="تواصل معنا" description="نحن هنا للاستماع. كل رسالة تُقرأ بعناية." />
      <div className="container-page grid gap-10 py-12 md:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="flex gap-3 rounded-2xl border bg-card p-5"><Mail className="h-6 w-6 text-olive" /><div><p className="font-bold">البريد الإلكتروني</p><p className="text-sm text-muted-foreground" dir="ltr">info@nusra.org</p></div></div>
          <div className="flex gap-3 rounded-2xl border bg-card p-5"><ShieldCheck className="h-6 w-6 text-olive" /><p className="text-sm text-muted-foreground">لا ترسل معلومات حساسة عبر هذا النموذج. للمعلومات المتعلقة بقضية استخدم «أدلي بمعلومة».</p></div>
        </aside>
        {done ? (
          <div className="rounded-2xl border bg-card p-10 text-center"><h2 className="text-2xl font-bold text-primary">تم إرسال رسالتك.</h2><p className="mt-2 text-muted-foreground">سنعود إليك في أقرب وقت.</p></div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>الاسم</Label><Input className="mt-2" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} /></div>
              <div><Label>البريد الإلكتروني *</Label><Input className="mt-2" type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} /></div>
            </div>
            <div><Label>نوع الرسالة</Label>
              <select className="mt-2 h-10 w-full rounded-md border bg-card px-3" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{types.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><Label>الموضوع *</Label><Input className="mt-2" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={200} /></div>
            <div><Label>الرسالة *</Label><Textarea className="mt-2" rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={5000} /></div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>إرسال الرسالة</Button>
          </form>
        )}
      </div>
    </>
  );
}
