import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowRight, ExternalLink, Save, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Pill, selectCls } from "@/components/admin/kit";
import { VerificationBadge } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate, personStatusLabels, publicationLabels, riskLabels, sourceTypeLabels, verificationLabels } from "@/lib/labels";
import { openDoc } from "./admin.documents";

export const Route = createFileRoute("/admin/cases/$id")({ component: Page });

const checklistItems: [string, string][] = [
  ["name", "الاسم مؤكد ومكتوب بشكل صحيح"],
  ["date", "تاريخ الاعتقال/الاختفاء مؤكد أو مُعلَّم كتقريبي"],
  ["source", "يوجد مصدر واحد على الأقل"],
  ["sources_reviewed", "تمت مراجعة كل المصادر"],
  ["docs_reviewed", "تمت مراجعة الوثائق المرفقة"],
  ["no_sensitive", "لا توجد بيانات حساسة (هواتف، عناوين، أسماء أقارب)"],
  ["risk_set", "تم تحديد مستوى الخطورة"],
  ["fact_vs_claim", "الفصل واضح بين الحقائق والادعاءات"],
  ["verification_set", "حالة التحقق محددة بدقة"],
  ["summary_clear", "الملخص واضح ومحايد"],
  ["help_safe", "طرق المساعدة آمنة ولا تعرّض أحدًا للخطر"],
];

const needOpts: [string, string][] = [["LEGAL", "دعم قانوني"], ["MEDIA", "تغطية إعلامية"], ["INFO", "معلومات إضافية"], ["DOCS", "وثائق"], ["FAMILY", "دعم للعائلة"], ["ADVOCACY", "مناصرة"]];

type Case = Record<string, any>;

function Page() {
  const { id } = Route.useParams();
  const { canEdit, user } = Route.useRouteContext();
  const qc = useQueryClient();
  const key = ["admin-case", id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: c, error } = await supabase.from("cases").select("*, person:persons(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!c) return null;
      const [s, t, u, h, d, sub] = await Promise.all([
        supabase.from("sources").select("*").eq("case_id", id).order("created_at"),
        supabase.from("timeline_events").select("*").eq("case_id", id).order("event_date"),
        supabase.from("case_updates").select("*").eq("case_id", id).order("created_at", { ascending: false }),
        supabase.from("help_actions").select("*").eq("case_id", id),
        supabase.from("documents").select("*").eq("case_id", id),
        supabase.from("submissions").select("id, reference_number, submission_type, status, created_at").eq("case_id", id),
      ]);
      return { c: c as Case, sources: s.data ?? [], timeline: t.data ?? [], updates: u.data ?? [], help: h.data ?? [], docs: d.data ?? [], subs: sub.data ?? [] };
    },
  });
  if (isLoading) return <p className="p-8 text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (!data) return <><AdminTitle title="القضية غير موجودة" /><Link to="/admin/cases" className="text-olive underline">العودة</Link></>;
  return <Room key={data.c["updated_at"]} data={data} canEdit={canEdit} userId={user.id} refresh={() => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["admin-cases"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }} />;
}

function Room({ data, canEdit, userId, refresh }: { data: any; canEdit: boolean; userId: string; refresh: () => void }) {
  const c: Case = data.c;
  const [f, setF] = useState<Case>({ ...c });
  const [p, setP] = useState<Case>({ ...(c["person"] ?? {}) });
  const [chk, setChk] = useState<Record<string, boolean>>((c["checklist"] ?? {}) as Record<string, boolean>);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });
  const done = checklistItems.filter(([k]) => chk[k]).length;
  const ready = done === checklistItems.length;

  const save = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      if (c["person_id"]) {
        const { error } = await supabase.from("persons").update({
          full_name: p["full_name"], display_name: p["display_name"] || null, nationality: p["nationality"] || null,
          country: p["country"] || null, city_if_safe: p["city_if_safe"] || null, photo_url: p["photo_url"] || null,
          birth_year_if_safe: p["birth_year_if_safe"] ? Number(p["birth_year_if_safe"]) : null, status: f["person_status"],
        }).eq("id", c["person_id"]);
        if (error) throw error;
      }
      const fields = ["title", "slug", "summary", "story", "known_facts", "attributed_claims", "unverified_info", "country", "case_type", "person_status", "status_label", "verification_status", "risk_level", "needs", "detention_date", "public_visibility", "review_notes"];
      const payload: Record<string, unknown> = Object.fromEntries(fields.map((k) => [k, f[k] === "" ? null : f[k]]));
      payload["title"] = f["title"] || c["title"]; payload["slug"] = f["slug"] || c["slug"]; payload["case_type"] = f["case_type"] || c["case_type"];
      const { error } = await supabase.from("cases").update({ ...payload, checklist: chk, reviewed_by: userId, last_known_update: new Date().toISOString(), ...extra } as any).eq("id", c["id"]);
      if (error) throw error;
      toast.success("تم الحفظ"); refresh();
    } catch (e: any) { toast.error(e.message ?? "تعذّر الحفظ"); } finally { setBusy(false); }
  };

  const transition = (status: string) => {
    if (status === "PUBLISHED") {
      if (!ready) return toast.error("أكمل قائمة التحقق أولًا");
      if (!data.sources.length) return toast.error("لا يمكن النشر بدون مصدر واحد على الأقل");
      if (!confirm("نشر القضية للعامة؟ تأكد من مراجعة كل المحتوى.")) return;
    }
    if (status === "ARCHIVED" && !confirm("أرشفة القضية وإخفاؤها من الموقع؟")) return;
    save({ publication_status: status });
  };

  const del = async (table: string, rid: string) => {
    if (!confirm("حذف هذا العنصر؟")) return;
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", rid);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); refresh();
  };
  const toggle = async (table: string, rid: string, k: string, v: unknown) => {
    const { error } = await (supabase.from(table as any) as any).update({ [k]: v }).eq("id", rid);
    if (error) return toast.error(error.message);
    refresh();
  };

  const status = c["publication_status"] as string;
  const ro = !canEdit;

  return (
    <>
      <AdminTitle title={c["title"]} sub={`${c["case_number"]} · آخر تعديل ${formatDate(c["updated_at"])}`}>
        <Button variant="outline" asChild><Link to="/admin/cases"><ArrowRight />القضايا</Link></Button>
        {status === "PUBLISHED" && <Button variant="outline" asChild><a href={`/cases/${c["slug"]}`} target="_blank" rel="noreferrer"><ExternalLink />عرض في الموقع</a></Button>}
        {canEdit && <Button onClick={() => save()} disabled={busy}><Save />حفظ</Button>}
      </AdminTitle>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-4">
        <span className="text-sm text-muted-foreground">الحالة:</span>
        {["DRAFT", "PENDING_REVIEW", "VERIFIED", "PUBLISHED", "ARCHIVED"].map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">←</span>}
            <Pill className={s === status ? "bg-primary text-primary-foreground" : undefined}>{publicationLabels[s]}</Pill>
          </span>
        ))}
        <span className="mr-auto" />
        <VerificationBadge status={c["verification_status"]} />
        <Pill className={riskLabels[c["risk_level"]]?.cls}>خطورة: {riskLabels[c["risk_level"]]?.label}</Pill>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="بيانات الشخص">
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="الاسم الكامل *"><Input disabled={ro} value={p["full_name"] ?? ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></F>
              <F label="اسم العرض"><Input disabled={ro} value={p["display_name"] ?? ""} onChange={(e) => setP({ ...p, display_name: e.target.value })} /></F>
              <F label="الجنسية"><Input disabled={ro} value={p["nationality"] ?? ""} onChange={(e) => setP({ ...p, nationality: e.target.value })} /></F>
              <F label="البلد"><Input disabled={ro} value={p["country"] ?? ""} onChange={(e) => setP({ ...p, country: e.target.value })} /></F>
              <F label="المدينة (فقط إن كان آمنًا)"><Input disabled={ro} value={p["city_if_safe"] ?? ""} onChange={(e) => setP({ ...p, city_if_safe: e.target.value })} /></F>
              <F label="سنة الميلاد (فقط إن كان آمنًا)"><Input disabled={ro} type="number" value={p["birth_year_if_safe"] ?? ""} onChange={(e) => setP({ ...p, birth_year_if_safe: e.target.value })} /></F>
              <F label="رابط الصورة" className="sm:col-span-2"><Input disabled={ro} dir="ltr" value={p["photo_url"] ?? ""} onChange={(e) => setP({ ...p, photo_url: e.target.value })} /></F>
            </div>
          </Card>

          <Card title="بيانات القضية">
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="العنوان *" className="sm:col-span-2"><Input disabled={ro} value={f["title"] ?? ""} onChange={(e) => set("title", e.target.value)} /></F>
              <F label="الرابط المختصر (slug)"><Input disabled={ro} dir="ltr" value={f["slug"] ?? ""} onChange={(e) => set("slug", e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())} /></F>
              <F label="نوع القضية"><Input disabled={ro} value={f["case_type"] ?? ""} onChange={(e) => set("case_type", e.target.value)} /></F>
              <F label="البلد"><Input disabled={ro} value={f["country"] ?? ""} onChange={(e) => set("country", e.target.value)} /></F>
              <F label="تاريخ الاعتقال/الاختفاء"><Input disabled={ro} type="date" value={f["detention_date"] ?? ""} onChange={(e) => set("detention_date", e.target.value)} /></F>
              <F label="حالة الشخص"><Sel disabled={ro} value={f["person_status"]} onChange={(v) => set("person_status", v)} opts={Object.entries(personStatusLabels)} /></F>
              <F label="وصف الحالة (اختياري)"><Input disabled={ro} value={f["status_label"] ?? ""} onChange={(e) => set("status_label", e.target.value)} /></F>
              <F label="حالة التحقق"><Sel disabled={ro} value={f["verification_status"]} onChange={(v) => set("verification_status", v)} opts={Object.entries(verificationLabels).map(([k, v]) => [k, v.label])} /></F>
              <F label="مستوى الخطورة"><Sel disabled={ro} value={f["risk_level"]} onChange={(v) => set("risk_level", v)} opts={Object.entries(riskLabels).map(([k, v]) => [k, v.label])} /></F>
            </div>
            <div className="mt-4">
              <Label>الاحتياجات</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {needOpts.map(([k, l]) => {
                  const on = (f["needs"] ?? []).includes(k);
                  return <button key={k} type="button" disabled={ro} onClick={() => set("needs", on ? f["needs"].filter((x: string) => x !== k) : [...(f["needs"] ?? []), k])} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>;
                })}
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" disabled={ro} checked={!!f["public_visibility"]} onChange={(e) => set("public_visibility", e.target.checked)} />تظهر للعامة عند النشر</label>
          </Card>

          <Card title="المحتوى">
            <div className="space-y-3">
              <F label="الملخص"><Textarea disabled={ro} rows={3} value={f["summary"] ?? ""} onChange={(e) => set("summary", e.target.value)} /></F>
              <F label="القصة"><Textarea disabled={ro} rows={6} value={f["story"] ?? ""} onChange={(e) => set("story", e.target.value)} /></F>
              <F label="✅ حقائق مؤكدة"><Textarea disabled={ro} rows={4} value={f["known_facts"] ?? ""} onChange={(e) => set("known_facts", e.target.value)} /></F>
              <F label="💬 ادعاءات منسوبة لمصادر"><Textarea disabled={ro} rows={4} value={f["attributed_claims"] ?? ""} onChange={(e) => set("attributed_claims", e.target.value)} /></F>
              <F label="⚠️ معلومات غير مؤكدة"><Textarea disabled={ro} rows={4} value={f["unverified_info"] ?? ""} onChange={(e) => set("unverified_info", e.target.value)} /></F>
            </div>
          </Card>

          <Card title={`المصادر (${data.sources.length})`} link="/admin/sources">
            <List items={data.sources} empty="لا توجد مصادر — مطلوب مصدر واحد على الأقل للنشر." render={(s: any) => (
              <Row key={s.id} onDel={canEdit ? () => del("sources", s.id) : undefined}>
                <b>{s.name}</b> <span className="text-muted-foreground">· {sourceTypeLabels[s.type]} · {formatDate(s.publication_date)}</span>
                {!s.is_public && <Pill className="mr-2 bg-muted">داخلي</Pill>}
                {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="mr-2 text-olive underline">رابط</a>}
              </Row>
            )} />
          </Card>

          <Card title={`الخط الزمني (${data.timeline.length})`}>
            <List items={data.timeline} empty="لا توجد أحداث." render={(t: any) => (
              <Row key={t.id} onDel={canEdit ? () => del("timeline_events", t.id) : undefined}>
                <span className="font-mono text-xs text-muted-foreground">{t.event_date}</span> <b>{t.title}</b> <VerificationBadge status={t.verification_status} className="mr-2" />
              </Row>
            )} />
            {canEdit && <AddEvent caseId={c["id"]} onDone={refresh} />}
          </Card>

          <Card title={`التحديثات (${data.updates.length})`} link="/admin/updates">
            <List items={data.updates} empty="لا توجد تحديثات." render={(u: any) => (
              <Row key={u.id} onDel={canEdit ? () => del("case_updates", u.id) : undefined}>
                <b>{u.title}</b> <span className="text-muted-foreground">· {formatDate(u.created_at)}</span>
                {canEdit ? <button className="mr-2" onClick={() => toggle("case_updates", u.id, "is_published", !u.is_published)}><Pill className={u.is_published ? "bg-accent text-accent-foreground" : undefined}>{u.is_published ? "منشور" : "غير منشور"}</Pill></button> : null}
              </Row>
            )} />
          </Card>

          <Card title={`طرق المساعدة (${data.help.length})`}>
            <List items={data.help} empty="لا توجد طرق مساعدة." render={(h: any) => (
              <Row key={h.id} onDel={canEdit ? () => del("help_actions", h.id) : undefined}>
                <b>{h.title}</b> <span className="text-muted-foreground">· {h.type}</span>
                {canEdit && <button className="mr-2" onClick={() => toggle("help_actions", h.id, "safe", !h.safe)}><Pill className={h.safe ? "bg-accent text-accent-foreground" : "bg-destructive/15 text-destructive"}>{h.safe ? "آمنة" : "غير آمنة"}</Pill></button>}
              </Row>
            )} />
            {canEdit && <AddHelp caseId={c["id"]} onDone={refresh} />}
          </Card>

          <Card title={`الوثائق (${data.docs.length})`} link="/admin/documents">
            <List items={data.docs} empty="لا توجد وثائق." render={(d: any) => (
              <Row key={d.id}>
                <button className="text-olive underline" onClick={() => openDoc(d.file_path)}>{d.title || d.file_name}</button>
                {canEdit ? (
                  <select className="mr-2 rounded border bg-card px-2 py-0.5 text-xs" value={d.visibility} onChange={(e) => toggle("documents", d.id, "visibility", e.target.value)}>
                    <option value="PUBLIC">عامة</option><option value="REVIEWERS_ONLY">للمراجعين</option><option value="INTERNAL">داخلية</option><option value="UNPUBLISHED">غير منشورة</option>
                  </select>
                ) : <Pill className="mr-2">{d.visibility}</Pill>}
              </Row>
            )} />
          </Card>
        </div>

        <div className="space-y-6">
          <div className="lg:sticky lg:top-4 space-y-6">
            <Card title={`قائمة التحقق قبل النشر (${done}/${checklistItems.length})`}>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-olive transition-all" style={{ width: `${(done / checklistItems.length) * 100}%` }} /></div>
              <ul className="space-y-2">
                {checklistItems.map(([k, l]) => (
                  <li key={k}>
                    <button type="button" disabled={ro} onClick={() => setChk({ ...chk, [k]: !chk[k] })} className="flex w-full items-start gap-2 text-right text-sm">
                      {chk[k] ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-olive" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                      <span className={chk[k] ? "" : "text-muted-foreground"}>{l}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            {canEdit && (
              <Card title="إجراءات النشر">
                <div className="grid gap-2">
                  {status !== "PENDING_REVIEW" && status !== "PUBLISHED" && <Button variant="outline" disabled={busy} onClick={() => transition("PENDING_REVIEW")}>إرسال للمراجعة</Button>}
                  {status !== "VERIFIED" && status !== "PUBLISHED" && <Button variant="outline" disabled={busy} onClick={() => transition("VERIFIED")}>اعتماد كموثّقة</Button>}
                  {status !== "PUBLISHED" && <Button variant="olive" disabled={busy || !ready} onClick={() => transition("PUBLISHED")}>نشر للعامة</Button>}
                  {status === "PUBLISHED" && <Button variant="outline" disabled={busy} onClick={() => transition("DRAFT")}>إلغاء النشر (إرجاع لمسودة)</Button>}
                  {status !== "ARCHIVED" && <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => transition("ARCHIVED")}>أرشفة</Button>}
                  {!ready && status !== "PUBLISHED" && <p className="text-xs text-muted-foreground">النشر متاح بعد استيفاء كل بنود قائمة التحقق.</p>}
                </div>
              </Card>
            )}

            <Card title="ملاحظات المراجعة (داخلية)">
              <Textarea disabled={ro} rows={4} value={f["review_notes"] ?? ""} onChange={(e) => set("review_notes", e.target.value)} />
            </Card>

            {data.subs.length > 0 && (
              <Card title="المساهمات المرتبطة" link="/admin/submissions">
                <ul className="space-y-1 text-sm">{data.subs.map((s: any) => <li key={s.id} className="font-mono text-xs">{s.reference_number} · {formatDate(s.created_at)}</li>)}</ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Card({ title, children, link }: { title: string; children: ReactNode; link?: "/admin/sources" | "/admin/updates" | "/admin/documents" | "/admin/submissions" }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-primary">{title}</h2>{link && <Link to={link} className="text-xs text-olive underline">إدارة</Link>}</div>
      {children}
    </section>
  );
}
function F({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
function Sel({ value, onChange, opts, disabled }: { value: string; onChange: (v: string) => void; opts: [string, string][]; disabled?: boolean }) {
  return <select disabled={disabled} className={selectCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
}
function List({ items, empty, render }: { items: any[]; empty: string; render: (x: any) => ReactNode }) {
  return items.length ? <ul className="divide-y text-sm">{items.map(render)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>;
}
function Row({ children, onDel }: { children: ReactNode; onDel?: () => void }) {
  return <li className="flex items-center justify-between gap-2 py-2"><div className="min-w-0 flex-1">{children}</div>{onDel && <Button size="icon" variant="ghost" onClick={onDel}><Trash2 className="text-destructive" /></Button>}</li>;
}
function AddEvent({ caseId, onDone }: { caseId: string; onDone: () => void }) {
  const [d, setD] = useState(""); const [t, setT] = useState("");
  const add = async () => {
    if (!d || !t.trim()) return toast.error("التاريخ والعنوان مطلوبان");
    const { error } = await supabase.from("timeline_events").insert({ case_id: caseId, event_date: d, title: t.trim().slice(0, 200) });
    if (error) return toast.error(error.message);
    setD(""); setT(""); onDone();
  };
  return <div className="mt-3 flex flex-wrap gap-2"><Input type="date" className="w-40" value={d} onChange={(e) => setD(e.target.value)} /><Input className="flex-1" placeholder="عنوان الحدث" value={t} onChange={(e) => setT(e.target.value)} /><Button size="sm" variant="outline" onClick={add}>إضافة</Button></div>;
}
function AddHelp({ caseId, onDone }: { caseId: string; onDone: () => void }) {
  const [t, setT] = useState(""); const [ty, setTy] = useState("SHARE");
  const add = async () => {
    if (!t.trim()) return toast.error("العنوان مطلوب");
    const { error } = await supabase.from("help_actions").insert({ case_id: caseId, title: t.trim().slice(0, 200), type: ty });
    if (error) return toast.error(error.message);
    setT(""); onDone();
  };
  return <div className="mt-3 flex flex-wrap gap-2"><select className={selectCls + " w-36"} value={ty} onChange={(e) => setTy(e.target.value)}><option value="SHARE">مشاركة</option><option value="LEGAL">قانوني</option><option value="MEDIA">إعلام</option><option value="ADVOCACY">مناصرة</option><option value="INFO">معلومات</option></select><Input className="flex-1" placeholder="عنوان طريقة المساعدة" value={t} onChange={(e) => setT(e.target.value)} /><Button size="sm" variant="outline" onClick={add}>إضافة</Button></div>;
}
