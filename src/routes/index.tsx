import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText, Share2, BookOpen, Scale, Newspaper, PenLine, Languages, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseCard, UpdateItem } from "@/components/site/CaseCard";
import { fetchPublicCases, fetchPublicUpdates } from "@/lib/data";
import { attentionScore } from "@/lib/labels";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نُصرة — صوتٌ للمظلوم، ودعوةٌ لنصرته" },
      { name: "description", content: "نوثّق القضايا، نحفظ الأصوات، ونفتح الطريق لمن يستطيع أن ينصر." },
      { property: "og:title", content: "نُصرة — صوتٌ للمظلوم، ودعوةٌ لنصرته" },
      { property: "og:description", content: "نوثّق القضايا، نحفظ الأصوات، ونفتح الطريق لمن يستطيع أن ينصر." },
    ],
  }),
  component: Home,
});

const helpWays = [
  { icon: FileText, title: "أضف معلومة", text: "حتى التفصيل الصغير قد يكمل الصورة." },
  { icon: Share2, title: "شارك القضية بمسؤولية", text: "انشر الرابط الموثّق دون إضافات." },
  { icon: BookOpen, title: "قدّم مصدرًا", text: "تقرير، بيان، أو رابط عام موثوق." },
  { icon: Scale, title: "ساعد قانونيًا", text: "وصّل القضية إلى جهة قانونية موثوقة." },
  { icon: Newspaper, title: "ساعد إعلاميًا", text: "أوصلها إلى جهة إعلامية مسؤولة." },
  { icon: PenLine, title: "أرسل تصحيحًا", text: "الدقة جزء من النصرة." },
  { icon: Languages, title: "ساعد في الترجمة", text: "لتصل القضية إلى جمهور أوسع." },
  { icon: ShieldCheck, title: "ساعد في التحقق", text: "راجع معلومة أو أكّد مصدرًا." },
];

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: cases = [] } = useQuery({ queryKey: ["public-cases"], queryFn: fetchPublicCases });
  const { data: updates = [] } = useQuery({ queryKey: ["public-updates", 6], queryFn: () => fetchPublicUpdates(6) });
  const featured = cases.filter((c) => c.person?.photo_url).slice(0, 3).concat(cases.filter((c) => !c.person?.photo_url)).slice(0, 4);
  const attention = [...cases].sort((a, b) => attentionScore(b) - attentionScore(a)).slice(0, 3);

  return (
    <>
      <section className="relative isolate flex min-h-[88vh] items-end overflow-hidden">
        <img src={hero} alt="رجل يقف أمام القدس والمسجد الأقصى عند الغروب حاملًا غصن زيتون" width={1920} height={1088} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="container-page pb-16 pt-32 text-ivory md:pb-24">
          <div className="max-w-2xl reveal">
            <h1 className="font-display text-6xl font-bold md:text-8xl">نُصرة</h1>
            <p className="mt-4 font-display text-2xl text-gold md:text-4xl">صوتٌ للمظلوم، ودعوةٌ لنصرته.</p>
            <p className="mt-4 text-lg text-ivory/85">نوثّق القضايا، نحفظ الأصوات، ونفتح الطريق لمن يستطيع أن ينصر.</p>
            <form className="mt-8 flex items-center gap-2 rounded-2xl bg-ivory p-2 shadow-lift"
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }}>
              <Search className="mr-2 h-5 w-5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={100}
                placeholder="ابحث عن قضية أو شخص أو رقم قضية..." aria-label="بحث"
                className="h-12 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
              <Button type="submit" size="lg">بحث</Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg"><Link to="/cases">استكشف القضايا</Link></Button>
              <Button asChild variant="heroOutline" size="lg"><Link to="/submit-information" search={{}}>أدلي بمعلومة</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-primary md:text-4xl">قصص لا ينبغي أن تُنسى</h2>
            <p className="mt-2 text-muted-foreground">خلف كل اسم إنسان، وأسرة تنتظر.</p>
          </div>
          <Link to="/cases" className="hidden items-center gap-1 text-sm font-medium text-olive hover:underline md:flex">عرض جميع القضايا <ArrowLeft className="h-4 w-4" /></Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c) => <CaseCard key={c.id} c={c} large />)}
        </div>
      </section>

      <section className="bg-secondary/60 py-16 md:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-primary">قضايا تحتاج إلى اهتمام</h2>
            <p className="mt-2 text-sm text-muted-foreground">مرتبة حسب الحاجة إلى معلومات أو مراجعة أو طول مدة الصمت — لا حسب الشعبية.</p>
            <div className="mt-6 space-y-3">
              {attention.map((c) => (
                <Link key={c.id} to="/cases/$slug" params={{ slug: c.slug }} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-soft transition hover:border-olive">
                  <div>
                    <p className="font-bold text-primary">{c.person?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{c.status_label}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {c.needs.map((n) => <span key={n} className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">تحتاج {n}</span>)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-primary">آخر ما حدث</h2>
            <div className="mt-6 space-y-3">
              {updates.map((u) => <UpdateItem key={u.id} u={u} />)}
            </div>
            <Button asChild variant="link" className="mt-2 px-0"><Link to="/updates">كل التحديثات ←</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold text-primary md:text-4xl">كيف تنصر؟</h2>
        <p className="mt-2 text-muted-foreground">طرق آمنة ومسؤولة للمساعدة.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {helpWays.map((w) => (
            <Link key={w.title} to="/how-to-help" className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
              <w.icon className="h-7 w-7 text-olive" strokeWidth={1.5} />
              <h3 className="mt-3 font-bold text-primary">{w.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{w.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground md:px-16">
          <p className="font-display text-2xl leading-relaxed md:text-4xl">قد تكون لديك معلومة صغيرة... لكنها قد تساعد في فهم قضية كاملة.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="lg"><Link to="/submit-information" search={{}}>أدلي بمعلومة</Link></Button>
            <Button asChild variant="heroOutline" size="lg"><Link to="/submit-case">لدي قضية جديدة</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
