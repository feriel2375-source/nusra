import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/bits";
import { supabase } from "@/integrations/supabase/client";
import { uploadSubmissionFile, validateFile } from "@/lib/uploads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/submit-case")({
  head: () => ({
    meta: [
      { title: "إضافة قضية — نُصرة" },
      { name: "description", content: "أرسل قضية جديدة لتوثيقها. تمر كل قضية بمراجعة وتحقق وتقييم للمخاطر قبل النشر." },
      { property: "og:title", content: "إضافة قضية — نُصرة" },
      { property: "og:description", content: "أرسل قضية جديدة لتوثيقها بمسؤولية." },
    ],
  }),
  component: SubmitCase,
});

const steps = ["معلومات الشخص", "معلومات القضية", "المصادر", "الوثائق", "معلومات المرسل", "السلامة", "المراجعة والإرسال"];
type F = Record<string, string>;

function SubmitCase() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>({ status: "DETAINED", risk: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value.slice(0, 5000) });

  const validate = () => {
    if (step === 0 && !(f.full_name ?? "").trim()) return "الاسم مطلوب.";
    if (step === 1 && (f.description ?? "").trim().length < 10) return "يرجى وصف القضية (10 أحرف على الأقل).";
    if (step === 3) return validateFile(file);
    if (step === 4 && f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return "البريد غير صالح.";
    if (step === 5 && !f.risk) return "يرجى الإجابة عن سؤال السلامة.";
    return null;
  };
  const next = () => { const e = validate(); if (e) return toast.error(e); setStep(step + 1); };

  const submit = async () => {
    setBusy(true);
    const content = `الاسم: ${f.full_name}\nالبلد: ${f.country ?? "—"}\nالحالة: ${f.status}\nتاريخ البداية: ${f.date ?? "—"}\n\n${f.description}`;
    const { data, error } = await supabase.rpc("submit_information", {
      _case_id: null, _type: "NEW_CASE", _content: content, _source: f.sources ?? "", _can_name_source: false,
      _has_document: !!file, _name: f.name ?? "", _email: f.email ?? "", _risk: f.risk, _payload: f,
    } as never);
    if (error || !data) { setBusy(false); return toast.error("تعذّر الإرسال."); }
    const res = data as unknown as { id: string; reference_number: string };
    if (file) { try { await uploadSubmissionFile(res.id, file); } catch { toast.warning("تعذّر رفع الملف."); } }
    setBusy(false); setRef(res.reference_number);
  };

  if (ref) return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="max-w-lg rounded-3xl border bg-card p-10 text-center shadow-lift">
        <CheckCircle2 className="mx-auto h-14 w-14 text-olive" />
        <h1 className="mt-4 font-display text-3xl font-bold text-primary">تم استلام القضية.</h1>
        <p className="mt-3 text-muted-foreground">شكرًا لمساهمتك في حفظ القضية وإيصال صوت صاحبها. ستتم مراجعتها قبل أي نشر.</p>
        <p className="mt-6 font-mono text-2xl font-bold text-primary" dir="ltr">{ref}</p>
        <Button asChild className="mt-8"><Link to="/">الرئيسية</Link></Button>
      </div>
    </div>
  );

  const field = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><Label>{label}</Label><Input className="mt-2" value={f[k] ?? ""} onChange={set(k)} maxLength={300} {...props} /></div>
  );

  return (
    <>
      <PageHeader title="أضف قضية" description="شارك معلومات عن شخص تعرّض للاعتقال أو الاختفاء أو فقدان التواصل. لن يُنشر شيء قبل المراجعة." />
      <div className="container-page max-w-3xl py-10">
        <ol className="mb-8 flex gap-1 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <li key={s} className={cn("flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs", i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground")}>
              <span className="font-bold">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-xl font-bold text-primary">{steps[step]}</h2>
          {step === 0 && <>{field("full_name", "الاسم الكامل *")}{field("display_name", "الاسم المعروف به (اختياري)")}{field("nationality", "الجنسية (إن كان نشرها آمنًا)")}{field("country", "البلد")}</>}
          {step === 1 && <>
            <div><Label>حالة الشخص</Label>
              <select className="mt-2 h-10 w-full rounded-md border bg-card px-3" value={f.status} onChange={set("status")}>
                <option value="DETAINED">معتقل</option><option value="MISSING">مفقود</option><option value="RELEASED">مُفرج عنه</option><option value="UNKNOWN">غير معروف</option><option value="OTHER">أخرى</option>
              </select></div>
            {field("date", "تاريخ بداية الحالة", { type: "date" })}
            <div><Label>وصف القضية *</Label><Textarea className="mt-2" rows={6} value={f.description ?? ""} onChange={set("description")} maxLength={5000} placeholder="ما الذي حدث؟ ما الذي تعرفه بالتأكيد؟" /></div>
          </>}
          {step === 2 && <div><Label>المصادر</Label><Textarea className="mt-2" rows={5} value={f.sources ?? ""} onChange={set("sources")} maxLength={2000} placeholder="روابط عامة، تقارير، شهود (دون بيانات شخصية)..." /></div>}
          {step === 3 && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-6 text-sm hover:border-olive">
              <Upload className="h-5 w-5 text-olive" /> {file ? file.name : "ارفع وثيقة PDF أو صورة (اختياري، حتى 10 ميغابايت)"}
              <input type="file" className="hidden" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
          {step === 4 && <>{field("name", "اسمك (اختياري)")}{field("email", "بريدك الإلكتروني (اختياري)", { type: "email", dir: "ltr" })}{field("relation", "صلتك بالقضية (اختياري)")}</>}
          {step === 5 && <>
            <p>هل نشر هذه المعلومات قد يعرّض الشخص أو عائلته للخطر؟</p>
            <div className="flex gap-4">{[["YES", "نعم"], ["NO", "لا"], ["UNSURE", "غير متأكد"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1"><input type="radio" checked={f.risk === k} onChange={() => setF({ ...f, risk: k })} /> {l}</label>))}</div>
            {(f.risk === "YES" || f.risk === "UNSURE") && <div className="flex gap-2 rounded-xl bg-gold/15 p-4 text-sm text-gold-foreground"><AlertTriangle className="h-5 w-5 shrink-0" />لا يعني إرسال هذه المعلومة أنها ستُنشر. ستتم مراجعتها أولًا، وقد يتم حجب بعض التفاصيل لحماية الأشخاص.</div>}
          </>}
          {step === 6 && (
            <dl className="space-y-2 text-sm">
              {[["الاسم", f.full_name], ["البلد", f.country], ["تاريخ البداية", f.date], ["الوصف", f.description], ["المصادر", f.sources], ["الوثيقة", file?.name], ["المرسل", f.name]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-2 border-b pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="whitespace-pre-wrap">{v || "—"}</dd></div>
              ))}
            </dl>
          )}
          <div className="flex justify-between pt-4">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>السابق</Button>
            {step < steps.length - 1 ? <Button onClick={next}>التالي</Button> : <Button variant="olive" onClick={submit} disabled={busy}>{busy ? "جارٍ الإرسال…" : "إرسال القضية"}</Button>}
          </div>
        </div>
      </div>
    </>
  );
}
