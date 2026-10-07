import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, BookOpen, PenLine, Share2, Scale, Newspaper, Languages, ShieldCheck, XCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/bits";

export const Route = createFileRoute("/how-to-help")({
  head: () => ({
    meta: [
      { title: "كيف تنصر؟ — نُصرة" },
      { name: "description", content: "دليل عملي لطرق آمنة ومسؤولة لنصرة القضايا: معلومة، مصدر، تصحيح، ترجمة، تحقق." },
      { property: "og:title", content: "كيف تنصر؟ — نُصرة" },
      { property: "og:description", content: "دليل عملي لطرق آمنة ومسؤولة للمساعدة." },
    ],
  }),
  component: HowToHelp,
});

const ways = [
  { icon: FileText, t: "أضف معلومة", d: "إن كانت لديك معلومة عن قضية، أرسلها عبر نموذج «أدلي بمعلومة». اذكر ما تعرفه بدقة، وميّز بين ما رأيته وما سمعته." },
  { icon: BookOpen, t: "قدّم مصدرًا", d: "تقرير منظمة، خبر منشور، بيان رسمي، أو وثيقة. أرفق الرابط العام إن وُجد، وسيقوم فريق التحقق بمراجعته." },
  { icon: PenLine, t: "صحّح معلومة", d: "إن لاحظت خطأ في قضية منشورة، أرسل تصحيحًا مع مصدره. الدقة تحمي القضية ومصداقيتها." },
  { icon: Share2, t: "شارك بمسؤولية", d: "شارك رابط القضية من المنصة كما هو، دون إضافة تفاصيل أو اتهامات غير موثقة." },
  { icon: Scale, t: "ساعد قانونيًا", d: "إن كنت محاميًا أو تعرف جهة قانونية موثوقة، تواصل معنا لنربطها بالقضية بشكل آمن." },
  { icon: Newspaper, t: "ساعد إعلاميًا", d: "إن كنت صحفيًا أو تعمل في جهة إعلامية مسؤولة، يمكنك طلب معلومات موثقة عبر صفحة التواصل." },
  { icon: Languages, t: "ساعد في الترجمة", d: "ترجمة ملخصات القضايا والوثائق تساعد على إيصالها إلى منظمات دولية." },
  { icon: ShieldCheck, t: "ساعد في التحقق", d: "إن كانت لديك خبرة في التحقق من المعلومات، يمكنك الانضمام إلى فريق المراجعة." },
];
const donts = ["لا تنشر معلومات غير مؤكدة.", "لا تنشر بيانات شخصية (هواتف، عناوين، أماكن سكن).", "لا تعرّض عائلة شخص للخطر.", "لا تحرّض على العنف.", "لا تنشر إشاعات."];

function HowToHelp() {
  return (
    <>
      <PageHeader title="كيف تنصر؟" description="دليل عملي لمساعدتك على نصرة قضية بطريقة آمنة ومسؤولة." />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <Accordion type="single" collapsible defaultValue={ways[0].t} className="space-y-3">
          {ways.map((w) => (
            <AccordionItem key={w.t} value={w.t} className="rounded-2xl border bg-card px-5">
              <AccordionTrigger className="text-right hover:no-underline">
                <span className="flex items-center gap-3 text-lg font-bold text-primary"><w.icon className="h-6 w-6 text-olive" />{w.t}</span>
              </AccordionTrigger>
              <AccordionContent className="leading-8 text-muted-foreground">{w.d}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <aside className="space-y-4">
          <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-xl font-bold text-destructive">ما الذي لا ينبغي فعله؟</h2>
            <ul className="mt-4 space-y-3">
              {donts.map((d) => <li key={d} className="flex gap-2 text-sm"><XCircle className="h-5 w-5 shrink-0 text-destructive" />{d}</li>)}
            </ul>
          </div>
          <Button asChild size="lg" className="w-full"><Link to="/submit-information" search={{}}>أدلي بمعلومة</Link></Button>
        </aside>
      </div>
    </>
  );
}
