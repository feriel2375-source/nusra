import { createFileRoute } from "@tanstack/react-router";
import { Target, Heart, Lock, Eye, Scale, ShieldCheck, ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/site/bits";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — نُصرة" },
      { name: "description", content: "نُصرة منصة تهدف إلى توثيق القضايا وحفظ المعلومات وفتح طرق مسؤولة للنصرة والمساعدة." },
      { property: "og:title", content: "من نحن — نُصرة" },
      { property: "og:description", content: "توثيق القضايا وحفظ المعلومات وفتح طرق مسؤولة للنصرة." },
    ],
  }),
  component: About,
});

const values = [
  { i: Target, t: "الدقة" }, { i: Heart, t: "الكرامة" }, { i: Lock, t: "الخصوصية" },
  { i: Eye, t: "الشفافية" }, { i: Scale, t: "المسؤولية" }, { i: ShieldCheck, t: "التحقق" },
];
const flow = ["استلام المساهمة", "الفحص الأولي", "المراجعة", "التحقق", "تقييم المخاطر", "النشر", "التحديثات"];

function About() {
  return (
    <>
      <PageHeader title="من نحن" description="نُصرة منصة تهدف إلى توثيق القضايا وحفظ المعلومات وفتح طرق مسؤولة للنصرة والمساعدة." />
      <div className="container-page space-y-16 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6"><h2 className="font-display text-2xl font-bold text-primary">رؤيتنا</h2><p className="mt-3 leading-8 text-muted-foreground">ألّا تُنسى أي قضية، وأن يبقى خلف كل اسم إنسانٌ له كرامة وقصة.</p></div>
          <div className="rounded-2xl border bg-card p-6"><h2 className="font-display text-2xl font-bold text-primary">رسالتنا</h2><p className="mt-3 leading-8 text-muted-foreground">توثيق القضايا بدقة، والتفريق الواضح بين الحقيقة الموثقة والادعاء، وتوجيه الناس إلى طرق آمنة للمساعدة دون تشهير أو تحريض.</p></div>
        </div>
        <section>
          <h2 className="font-display text-3xl font-bold text-primary">قيمنا</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            {values.map((v) => <div key={v.t} className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-5"><v.i className="h-8 w-8 text-olive" strokeWidth={1.4} /><span className="font-bold">{v.t}</span></div>)}
          </div>
        </section>
        <section>
          <h2 className="font-display text-3xl font-bold text-primary">كيف نعمل؟</h2>
          <div className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-2">
            {flow.map((s, i) => (
              <div key={s} className="flex w-full flex-col items-center gap-2">
                <div className="w-full rounded-xl bg-primary px-4 py-3 text-center font-medium text-primary-foreground">{s}</div>
                {i < flow.length - 1 && <ArrowDown className="h-5 w-5 text-gold" />}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">لا تُنشر أي مساهمة تلقائيًا. قرار النشر النهائي دائمًا لإنسان من فريق التحرير.</p>
        </section>
      </div>
    </>
  );
}
