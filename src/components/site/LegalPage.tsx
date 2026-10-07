import { PageHeader } from "./bits";

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: [string, string][] }) {
  return (
    <>
      <PageHeader title={title} description={intro} />
      <div className="container-page max-w-3xl space-y-8 py-12">
        {sections.map(([h, p], i) => (
          <section key={h}>
            <h2 className="text-xl font-bold text-primary">{i + 1}. {h}</h2>
            <p className="mt-2 leading-8 text-muted-foreground">{p}</p>
          </section>
        ))}
        <p className="text-xs text-muted-foreground">آخر تحديث: أكتوبر 2026</p>
      </div>
    </>
  );
}
