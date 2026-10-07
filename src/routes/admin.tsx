import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, FolderOpen, Inbox, RefreshCw, BookOpen, FileText, Flag, Users, History, Settings, LogOut, Menu, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/bits";
import { roleLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    await supabase.from("profiles").upsert({ id: data.user.id, email: data.user.email ?? null, display_name: (data.user.user_metadata?.["full_name"] as string | undefined) ?? null }, { onConflict: "id" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const list = (roles ?? []).map((r) => r.role as string);
    const isStaff = list.some((r) => ["reviewer", "editor", "admin"].includes(r));
    return { user: data.user, roles: list, isStaff, canEdit: list.includes("editor") || list.includes("admin"), isAdmin: list.includes("admin") };
  },
  head: () => ({ meta: [{ title: "لوحة الإدارة — نُصرة" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/cases", label: "القضايا", icon: FolderOpen },
  { to: "/admin/submissions", label: "المساهمات", icon: Inbox },
  { to: "/admin/updates", label: "التحديثات", icon: RefreshCw },
  { to: "/admin/sources", label: "المصادر", icon: BookOpen },
  { to: "/admin/documents", label: "الوثائق", icon: FileText },
  { to: "/admin/reports", label: "البلاغات والرسائل", icon: Flag },
  { to: "/admin/users", label: "المستخدمون", icon: Users, admin: true },
  { to: "/admin/audit-log", label: "سجل النشاط", icon: History },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, admin: true },
] as const;

function AdminLayout() {
  const { user, roles, isStaff, isAdmin } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-primary">لا تملك صلاحية الوصول</h1>
          <p className="mt-2 text-sm text-muted-foreground">حسابك ({user.email}) غير مخوّل بالدخول إلى لوحة الإدارة. اطلب من مدير المنصة منحك دور مراجع أو محرر.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={signOut} className="rounded-md border px-4 py-2 text-sm">تسجيل الخروج</button>
            <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">الموقع</Link>
          </div>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.filter((i) => !("admin" in i) || isAdmin).map((i) => (
        <Link key={i.to} to={i.to} activeOptions={{ exact: "exact" in i }} onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-semibold" }}>
          <i.icon className="h-4 w-4" />{i.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={cn("fixed inset-y-0 right-0 z-50 flex w-[250px] flex-col bg-sidebar transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "translate-x-full")}>
        <div className="flex items-center justify-between border-b border-sidebar-border p-4"><Logo light /><button className="text-sidebar-foreground lg:hidden" onClick={() => setOpen(false)}><X /></button></div>
        <div className="border-b border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/70">
          <p className="truncate font-medium text-sidebar-foreground">{user.email}</p>
          <p>{roles.map((r) => roleLabels[r] ?? r).join("، ")}</p>
        </div>
        {nav}
        <div className="border-t border-sidebar-border p-3">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"><ExternalLink className="h-4 w-4" />عرض الموقع</Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"><LogOut className="h-4 w-4" />تسجيل الخروج</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="القائمة"><Menu /></button><span className="font-bold text-primary">لوحة الإدارة</span>
        </header>
        <div className="p-4 md:p-8"><Outlet /></div>
      </div>
    </div>
  );
}
