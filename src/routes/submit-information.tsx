import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { FileSearch, FilePlus2, RefreshCw, BookOpen, FileText, PenLine, AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/bits";
import { fetchPublicCases } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { uploadSubmissionFile, validateFile } from "@/lib/uploads";

export const Route = createFileRoute("/submit-information")({
  validateSearch: (s: Record<string, unknown>): { caseId?: string } => (typeof s.caseId === "string" ? { caseId: s.caseId } : {}),
  head: () => ({
    meta: [
      { title: "أدلي بمعلومة — نُصرة" },
      { name: "description", content: "حتى المعلومة الصغيرة قد تساعد في تحديث قضية أو التحقق منها. لا يلزم إنشاء حساب." },
      { property: "og:title", content: "أدلي بمعلومة — نُصرة" },
      { property: "og:description", content: "حتى المعلومة الصغيرة قد تساعد في تحديث القضية أو التحقق منها." },
    ],
  }),
  component: SubmitInfo,
});

const types = [
  { k: "EXISTING_CASE", label: "لدي معلومة عن قضية موجودة", icon: FileSearch },
  { k: "NEW_CASE", label: "لدي قضية جديدة", icon: FilePlus2 },
  { k: "UPDATE", label: "لدي تحديث", icon: RefreshCw },
  { k: "SOURCE", label: "لدي مصدر", icon: BookOpen },
  { k: "DOCUMENT", label: "لدي وثيقة", icon: FileText },
  { k: "CORRECTION", label: "أريد تصحيح معلومة منشورة", icon: PenLine },
];

const schema = z.object({
  content: z.string().trim().min(10, "يرجى كتابة المعلومة بتفصيل أكثر (10 أحرف على الأقل)").max(10000),
  source: z.string().max(2000),
  name: z.string().max(120),
  email: z.union([z.literal(""), z.string().trim().email("البريد الإلكتروني غير صالح").max(255)]),
});

function SubmitInfo() {
  const { caseId } = Route.useSearch();
  const { data: cases = [] } = useQuery({ queryKey: ["public-cases"], queryFn: fetchPublicCases });
  const [type, setType] = useState<string>(caseId ? "EXISTING_CASE" : "");
  const [selCase, setSelCase] = useState<string | undefined>(caseId);
  const [caseQ, setCaseQ] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [canName, setCanName] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [risk, setRisk] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const needsCase = type && type !== "NEW_CASE";
  const chosen = cases.find((c) => c.id === selCase);
  const matches = caseQ.trim() ? cases.filter((c) => c.person?.full_name.includes(caseQ.trim()) || c.case_number.includes(caseQ.trim())).slice(0, 5) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return toast.error("اختر نوع المعلومة.");
    if (!risk) return toast.error("يرجى الإجابة عن سؤال السلامة.");
    const parsed = schema.safeParse({ content, source, name, email });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const fe = validateFile(file);
    if (fe) return toast.error(fe);
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_information", {
      _case_id: needsCase ? selCase ?? null : null, _type: type, _content: parsed.data.content, _source: parsed.data.source,
      _can_name_source: canName ?? false, _has_document: !!file, _name: parsed.data.name, _email: parsed.data.email, _risk: risk, _payload: {},
    } as never);
    if (error || !data) { setBusy(false); return toast.error("تعذّر الإرسال، حاول مجددًا."); }
    const res = data as unknown as { id: string; reference_number: string };
    if (file) { try { await uploadSubmissionFile(res.id, file); } catch { toast.warning("تم استلام المعلومة لكن تعذّر رفع الملف."); } }
    setBusy(false);
    setRef(res.reference_number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (ref) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="max-w-lg rounded-3xl border bg-card p-10 text-center shadow-lift reveal">
          <CheckCircle2 className="mx-auto h-14 w-14 text-olive" />
          <h1 className="mt-4 font-display text-3xl font-bold text-primary">تم استلام المعلومة.</h1>
          <p className="mt-3 text-muted-foreground">شكرًا لمساهمتك في حفظ القضية وإيصال صوت صاحبها.</p>
          <p className="mt-6 text-sm text-muted-foreground">الرقم المرجعي</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-primary" dir="ltr">{ref}</p>
          <p className="mt-4 text-xs text-muted-foreground">احتفظ بهذا الرقم في حال أردت التواصل معنا بشأن مساهمتك.</p>
          <Button asChild className="mt-8"><Link to="/cases">العودة إلى القضايا</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="هل لديك معلومة قد تساعد في قضية؟" description="حتى المعلومة الصغيرة قد تساعد في تحديث القضية أو التحقق منها. لا يلزم إنشاء حساب." />
      <form onSubmit={submit} className="container-page max-w-3xl space-y-8 py-10">
        <fieldset>
          <legend className="mb-3 font-bold text-primary">نوع المعلومة</legend>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {types.map((t) => (
              <button type="button" key={t.k} onClick={() => setType(t.k)}
                className={cn("flex flex-col items-center gap-2 rounded-2xl border bg-card p-5 text-center text-sm font-medium transition hover:border-olive", type === t.k && "border-olive bg-accent ring-2 ring-olive/30")}>
                <t.icon className="h-8 w-8 text-olive" strokeWidth={1.4} />{t.label}
              </button>
            ))}
          </div>
          {type === "NEW_CASE" && <p className="mt-3 text-sm">للقضايا الجديدة بتفاصيل كاملة يمكنك استخدام <Link to="/submit-case" className="text-olive underline">نموذج إضافة قضية</Link>، أو كتابة ما تعرفه هنا باختصار.</p>}
        </fieldset>

        {needsCase && (
          <div>
            <Label>القضية</Label>
            {chosen ? (
              <div className="mt-2 flex items-center justify-between rounded-xl border bg-accent p-3">
                <span className="font-medium">{chosen.person?.full_name} · <span className="text-xs">{chosen.case_number}</span></span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelCase(undefined)}>تغيير</Button>
              </div>
            ) : (
              <div className="relative mt-2">
                <Input placeholder="ابحث عن القضية..." value={caseQ} onChange={(e) => setCaseQ(e.target.value)} maxLength={100} />
                {matches.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-lift">
                    {matches.map((c) => (
                      <li key={c.id}><button type="button" className="w-full px-4 py-2 text-right hover:bg-secondary" onClick={() => { setSelCase(c.id); setCaseQ(""); }}>{c.person?.full_name} <span className="text-xs text-muted-foreground">{c.case_number}</span></button></li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="content">المعلومة</Label>
          <Textarea id="content" className="mt-2" rows={6} value={content} onChange={(e) => setContent(e.target.value)} maxLength={10000} placeholder="اكتب ما تعرفه بوضوح. تجنّب ذكر أرقام هواتف أو عناوين." />
        </div>
        <div>
          <Label htmlFor="source">مصدر المعلومة</Label>
          <Input id="source" className="mt-2" value={source} onChange={(e) => setSource(e.target.value)} maxLength={2000} placeholder="مثال: شاهد، تقرير منظمة، رابط عام..." />
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>هل يمكنك ذكر المصدر؟</span>
            {[["نعم", true], ["لا", false]].map(([l, v]) => (
              <label key={String(l)} className="flex items-center gap-1"><input type="radio" name="canName" checked={canName === v} onChange={() => setCanName(v as boolean)} /> {l}</label>
            ))}
          </div>
        </div>
        <div>
          <Label>هل توجد وثيقة؟ (اختياري)</Label>
          <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-card p-4 text-sm hover:border-olive">
            <Upload className="h-5 w-5 text-olive" />
            <span>{file ? file.name : "ارفع ملف PDF أو صورة (حتى 10 ميغابايت)"}</span>
            <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <fieldset className="rounded-2xl border bg-card p-5">
          <legend className="px-2 font-bold text-primary">السلامة</legend>
          <p className="text-sm">هل نشر المعلومة قد يعرّض الشخص أو عائلته للخطر؟</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {[["YES", "نعم"], ["NO", "لا"], ["UNSURE", "غير متأكد"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1"><input type="radio" name="risk" checked={risk === k} onChange={() => setRisk(k)} /> {l}</label>
            ))}
          </div>
          {(risk === "YES" || risk === "UNSURE") && (
            <div className="mt-4 flex gap-2 rounded-xl bg-gold/15 p-4 text-sm text-gold-foreground">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              لا يعني إرسال هذه المعلومة أنها ستُنشر. ستتم مراجعتها أولًا، وقد يتم حجب بعض التفاصيل لحماية الأشخاص.
            </div>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="name">الاسم (اختياري)</Label><Input id="name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
          <div><Label htmlFor="email">البريد الإلكتروني (اختياري)</Label><Input id="email" type="email" className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} dir="ltr" /></div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "جارٍ الإرسال…" : "إرسال المعلومة"}</Button>
        <p className="text-center text-xs text-muted-foreground">كل المعلومات تمر بمراجعة بشرية قبل أي نشر.</p>
      </form>
    </>
  );
}
