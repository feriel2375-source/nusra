import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./bits";

const nav = [
  { to: "/", label: "الرئيسية" },
  { to: "/cases", label: "القضايا" },
  { to: "/updates", label: "آخر التحديثات" },
  { to: "/how-to-help", label: "كيف تنصر؟" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-secondary hover:text-primary"
              activeProps={{ className: "text-primary bg-secondary" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="البحث">
            <Link to="/search" search={{ q: "" }}><Search /></Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/submit-information" search={{}}><Plus /> أدلي بمعلومة</Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="القائمة">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-background lg:hidden">
          <div className="container-page flex flex-col py-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium hover:bg-secondary">{n.label}</Link>
            ))}
            <Button asChild className="my-2"><Link to="/submit-information" search={{}} onClick={() => setOpen(false)}>أدلي بمعلومة</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const cols = [
    [["/cases", "القضايا"], ["/updates", "آخر التحديثات"], ["/how-to-help", "كيف تنصر؟"], ["/submit-information", "أدلي بمعلومة"]],
    [["/about", "من نحن"], ["/contact", "تواصل معنا"], ["/auth", "دخول الفريق"]],
    [["/privacy", "سياسة الخصوصية"], ["/terms", "شروط الاستخدام"], ["/content-policy", "سياسة المحتوى"], ["/verification-policy", "سياسة التحقق"]],
  ] as const;
  return (
    <footer className="bg-navy-deep text-ivory">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 text-sm text-ivory/70">صوتٌ للمظلوم، ودعوةٌ لنصرته.</p>
        </div>
        {cols.map((col, i) => (
          <ul key={i} className="space-y-2 text-sm">
            {col.map(([to, label]) => (
              <li key={to}><Link to={to} className="text-ivory/75 hover:text-gold">{label}</Link></li>
            ))}
          </ul>
        ))}
      </div>
      <div className="border-t border-ivory/10 py-4 text-center text-xs text-ivory/50">© {new Date().getFullYear()} نُصرة — كل قضية وراءها إنسان.</div>
    </footer>
  );
}
