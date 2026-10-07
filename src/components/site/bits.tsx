import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { verificationLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="نُصرة - الرئيسية">
      <span className={cn("font-display text-3xl font-bold leading-none", light ? "text-ivory" : "text-primary")}>نُصرة</span>
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold" fill="currentColor" aria-hidden>
        <path d="M12 21c0-6 2-10 7-13-1 4-3 7-7 9 0-3 1-6 3-8-3 1-5 4-5 7-2-2-3-5-2-8-3 3-3 8 1 11-1 0-2 1-2 2h5z" />
      </svg>
    </Link>
  );
}

export function VerificationBadge({ status, className }: { status: string; className?: string }) {
  const v = verificationLabels[status] ?? verificationLabels.LIMITED_INFORMATION;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", v.cls, className)}>
      <span className={cn("h-2 w-2 rounded-full", v.dot)} />
      {v.label}
    </span>
  );
}

export function PersonPhoto({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (src) return <img src={src} alt={`صورة ${name}`} loading="lazy" className={cn("object-cover", className)} />;
  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-b from-secondary to-muted text-muted-foreground", className)} aria-label={name}>
      <User className="h-1/3 w-1/3 opacity-50" strokeWidth={1.2} />
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b bg-secondary/50">
      <div className="container-page py-10 md:py-14 reveal">
        <h1 className="font-display text-4xl font-bold text-primary md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{description}</p>}
        {children}
      </div>
    </section>
  );
}
