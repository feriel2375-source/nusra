import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, MapPin, Flag, FileText, Scale, Newspaper, Share2, ShieldCheck, Info, ExternalLink, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PersonPhoto, VerificationBadge } from "@/components/site/bits";
import { fetchCaseBySlug } from "@/lib/data";
import { formatDate, personStatusLabels, reliabilityLabels, reportTypeLabels, sourceTypeLabels } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cases/$slug")({
  loader: async ({ params }) => {
    const data = await fetchCaseBySlug(params.slug);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "القضية غير متاحة — نُصرة" }, { name: "robots", content: "noindex" }] };
    const name = loaderData.case.person?.full_name ?? loaderData.case.title;
    const desc = loaderData.case.summary ?? "";
    return {
      meta: [
        { title: `${name} — نُصرة` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} — نُصرة` },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold">هذه القضية غير متاحة.</h1>
      <Link to="/cases" className="mt-4 inline-block text-olive underline">العودة إلى القضايا</Link>
    </div>
  ),
  errorComponent: () => <div className="container-page py-24 text-center">تعذّر تحميل القضية.</div>,
  component: CasePage,
});

const lines = (t?: string | null) => (t ?? "").split("\n").map((s) => s.trim()).filter((s) => s && s !== "—");

function CasePage() {
  const { case: c, sources, timeline, updates, help, docs } = Route.useLoaderData();
  const name = c.person?.full_name ?? c.title;
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: name, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); toast.success("تم نسخ رابط القضية"); }
  };
  const helpCards = [
    { icon: FileText, title: "أدلي بمعلومة", text: "إن كانت لديك معلومة موثوقة.", to: true },
    { icon: ShieldCheck, title: "قدّم مصدرًا", text: "تقرير أو رابط عام.", to: true },
    { icon: Info, title: "ساعد في التحقق", text: "راجع معلومة غير مؤكدة.", to: true },
    { icon: Scale, title: "جهة قانونية موثوقة", text: "ساعد في الوصول إلى محامٍ.", to: false },
    { icon: Newspaper, title: "جهة إعلامية مسؤولة", text: "أوصل القضية بمسؤولية.", to: false },
  ];

  return (
    <article>
      <section className="border-b bg-secondary/50">
        <div className="container-page grid gap-8 py-10 md:grid-cols-[280px_1fr] md:py-14">
          <PersonPhoto src={c.person?.photo_url} name={name} className="aspect-square w-full max-w-[280px] rounded-2xl shadow-lift" />
          <div className="reveal">
            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge status={c.verification_status} />
              <span className="text-xs text-muted-foreground">{c.case_number}</span>
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-primary md:text-5xl">{name}</h1>
            <p className="mt-2 text-xl font-semibold">{c.status_label}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {c.country && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {c.country}</span>}
              <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> بداية الحالة: {formatDate(c.detention_date)}</span>
              <span>آخر تحديث: {formatDate(c.last_known_update)}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg"><a href="#help"><HandHeart /> كيف تنصر هذه القضية؟</a></Button>
              <Button asChild size="lg"><Link to="/submit-information" search={{ caseId: c.id }}>لدي معلومة عن هذه القضية</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <section>
            <h2 className="font-display text-3xl font-bold text-primary">ملخص القضية</h2>
            <p className="mt-4 text-lg leading-9">{c.summary}</p>
            {c.story && c.story !== "—" && <p className="mt-3 leading-8 text-muted-foreground">{c.story}</p>}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { t: "ما نعرفه", items: lines(c.known_facts), cls: "border-v-verified/40" },
              { t: "ما نُسب إلى المصادر", items: lines(c.attributed_claims), cls: "border-v-one/40" },
              { t: "ما لم نتمكن من التحقق منه", items: lines(c.unverified_info), cls: "border-v-pending/50" },
            ].map((b) => (
              <div key={b.t} className={`rounded-2xl border-t-4 bg-card p-5 shadow-soft ${b.cls}`}>
                <h3 className="font-bold text-primary">{b.t}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-7">
                  {b.items.length ? b.items.map((i) => <li key={i}>• {i}</li>) : <li className="text-muted-foreground">لا توجد معلومات بعد.</li>}
                </ul>
              </div>
            ))}
          </section>

          <section>
            <h2 className="font-display text-3xl font-bold text-primary">التسلسل الزمني</h2>
            <ol className="mt-6 space-y-6 border-r-2 border-gold/40 pr-6">
              {timeline.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -right-[33px] top-1.5 h-4 w-4 rounded-full border-4 border-background bg-gold" />
                  <p className="text-sm text-muted-foreground">{formatDate(e.event_date)}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{e.title}</h3>
                    <VerificationBadge status={e.verification_status} />
                  </div>
                  {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-3xl font-bold text-primary">آخر التحديثات</h2>
            <div className="mt-4 space-y-3">
              {updates.length === 0 && <p className="text-muted-foreground">لا توجد تحديثات منشورة.</p>}
              {updates.map((u) => (
                <div key={u.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {formatDate(u.created_at)} <span className="rounded bg-secondary px-2">{u.update_type}</span> <VerificationBadge status={u.verification_status} />
                  </div>
                  <h3 className="mt-1 font-bold">{u.title}</h3>
                  <p className="text-sm text-muted-foreground">{u.summary}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl font-bold text-primary">المصادر</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {sources.map((s) => (
                <div key={s.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{s.name}</h3>
                    <span className="text-xs text-muted-foreground">الثقة: {reliabilityLabels[s.reliability] ?? s.reliability}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{sourceTypeLabels[s.type]} · {formatDate(s.publication_date)}</p>
                  {s.notes && <p className="mt-2 text-sm">ملاحظة المحرر: {s.notes}</p>}
                  {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-sm text-olive hover:underline">الرابط <ExternalLink className="h-3 w-3" /></a>}
                </div>
              ))}
            </div>
          </section>

          {docs.length > 0 && (
            <section>
              <h2 className="font-display text-3xl font-bold text-primary">الوثائق</h2>
              <ul className="mt-4 space-y-2">{docs.map((d) => <li key={d.id} className="rounded-lg border bg-card p-3 text-sm">{d.title} · {formatDate(d.created_at)}</li>)}</ul>
            </section>
          )}

          <section id="help" className="scroll-mt-24 rounded-3xl bg-primary p-6 text-primary-foreground md:p-10">
            <h2 className="font-display text-3xl font-bold">كيف تنصر هذه القضية؟</h2>
            <p className="mt-2 text-primary-foreground/75">كل خطوة هنا آمنة ومسؤولة.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {helpCards.map((h) => {
                const inner = (<><h.icon className="h-6 w-6 text-gold" /><h3 className="mt-2 font-bold">{h.title}</h3><p className="text-sm text-primary-foreground/70">{h.text}</p></>);
                return h.to ? (
                  <Link key={h.title} to="/submit-information" search={{ caseId: c.id }} className="rounded-xl bg-primary-foreground/10 p-4 transition hover:bg-primary-foreground/15">{inner}</Link>
                ) : (
                  <Link key={h.title} to="/how-to-help" className="rounded-xl bg-primary-foreground/10 p-4 transition hover:bg-primary-foreground/15">{inner}</Link>
                );
              })}
              <button onClick={share} className="rounded-xl bg-primary-foreground/10 p-4 text-right transition hover:bg-primary-foreground/15">
                <Share2 className="h-6 w-6 text-gold" /><h3 className="mt-2 font-bold">شارك القضية</h3><p className="text-sm text-primary-foreground/70">انشر الرابط الموثّق فقط.</p>
              </button>
            </div>
            {help.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-gold">احتياجات خاصة بهذه القضية</p>
                {help.map((h) => <div key={h.id} className="rounded-lg border border-primary-foreground/15 p-3 text-sm"><b>{h.title}</b> — {h.description}</div>)}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h3 className="font-bold text-primary">معلومات الشخص</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["الاسم", name],
                ["الجنسية", c.person?.nationality],
                ["البلد", c.country],
                ["الحالة", personStatusLabels[c.person_status]],
                ["نوع القضية", c.case_type],
                ["بداية الحالة", formatDate(c.detention_date)],
                ["آخر تحديث", formatDate(c.last_known_update)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b pb-2 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">لا ننشر أرقام الهواتف أو العناوين أو أي بيانات قد تعرّض الشخص أو أسرته للخطر.</p>
          </div>
          <ReportDialog caseId={c.id} />
        </aside>
      </div>
    </article>
  );
}

function ReportDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("WRONG_INFO");
  const [desc, setDesc] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (desc.trim().length < 5) return toast.error("يرجى كتابة وصف أوضح.");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return toast.error("البريد غير صالح.");
    setBusy(true);
    const { error } = await supabase.rpc("submit_report", { _case_id: caseId, _type: type, _description: desc.slice(0, 5000), _email: email });
    setBusy(false);
    if (error) return toast.error("تعذّر الإرسال، حاول مجددًا.");
    toast.success("تم استلام البلاغ، شكرًا لك.");
    setOpen(false); setDesc("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="w-full"><Flag /> الإبلاغ عن مشكلة</Button></DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>الإبلاغ عن مشكلة في القضية</DialogTitle></DialogHeader>
        <select className="h-10 rounded-md border bg-card px-3" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(reportTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Textarea placeholder="صف المشكلة..." value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={5000} rows={4} />
        <Input placeholder="بريدك الإلكتروني (اختياري)" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
        <Button onClick={submit} disabled={busy}>إرسال البلاغ</Button>
      </DialogContent>
    </Dialog>
  );
}
