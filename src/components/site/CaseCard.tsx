import { Link } from "@tanstack/react-router";
import { MapPin, CalendarDays, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonPhoto, VerificationBadge } from "./bits";
import { formatDate, relativeDays } from "@/lib/labels";
import { sourceCount, type CaseRow } from "@/lib/data";

export function CaseCard({ c, large = false }: { c: CaseRow; large?: boolean }) {
  const name = c.person?.full_name ?? c.title;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <PersonPhoto src={c.person?.photo_url} name={name} className={large ? "aspect-[4/3] w-full" : "aspect-[16/11] w-full"} />
        <VerificationBadge status={c.verification_status} className="absolute top-3 right-3 bg-card/95" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-xl font-bold text-primary">{name}</h3>
          {c.country && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {c.country}
              {c.person?.city_if_safe ? ` / ${c.person.city_if_safe}` : ""}
            </p>
          )}
          {c.status_label && <p className="mt-2 font-semibold text-foreground">{c.status_label}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-olive">القصة باختصار</p>
          <p className="mt-1 line-clamp-3 text-sm leading-7 text-muted-foreground">{c.summary}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> آخر تحديث: {large ? relativeDays(c.last_known_update) : formatDate(c.last_known_update)}</span>
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> المصادر: {sourceCount(c)}</span>
        </div>
        {c.needs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-foreground">ما الذي تحتاجه القضية؟</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {c.needs.map((n) => (
                <span key={n} className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">{n}</span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link to="/cases/$slug" params={{ slug: c.slug }}>{large ? "تعرّف على القضية" : "عرض القضية"}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/submit-information" search={{ caseId: c.id }}>{large ? "لدي معلومة" : "أدلي بمعلومة"}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function UpdateItem({ u }: { u: { id: string; title: string; update_type: string; summary: string | null; created_at: string; verification_status: string; case: { slug: string; title: string } | null } }) {
  return (
    <div className="relative flex gap-4 rounded-xl border bg-card p-4 shadow-soft">
      <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-gold ring-4 ring-gold/20" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(u.created_at)}</span>
          <span className="rounded bg-secondary px-2 py-0.5">{u.update_type}</span>
          <VerificationBadge status={u.verification_status} />
        </div>
        <h3 className="mt-1.5 font-bold text-primary">{u.case?.title} — {u.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{u.summary}</p>
        {u.case && (
          <Link to="/cases/$slug" params={{ slug: u.case.slug }} className="mt-2 inline-block text-sm font-medium text-olive hover:underline">
            عرض القضية ←
          </Link>
        )}
      </div>
    </div>
  );
}
