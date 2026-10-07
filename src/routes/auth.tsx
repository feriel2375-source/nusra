import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/bits";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "دخول فريق نُصرة" }, { name: "description", content: "تسجيل الدخول لفريق المراجعة والتحرير في نُصرة." },
    { property: "og:title", content: "دخول فريق نُصرة" }, { property: "og:description", content: "دخول الفريق." },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const afterLogin = async () => {
    await supabase.rpc("claim_first_admin");
    navigate({ to: "/admin" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) afterLogin(); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) afterLogin(); });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return toast.error("أدخل بريدًا صالحًا وكلمة مرور من 8 أحرف على الأقل.");
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("بيانات الدخول غير صحيحة.");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
      if (error) toast.error(error.message);
      else if (!data.session) toast.success("تم إنشاء الحساب. تحقق من بريدك لتأكيده.");
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (r.error) toast.error("تعذّر الدخول عبر Google.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lift">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-6 text-center text-2xl font-bold text-primary">{mode === "in" ? "دخول الفريق" : "إنشاء حساب"}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">لوحة الإدارة متاحة فقط للمراجعين والمحررين.</p>
        <Button variant="outline" className="mt-6 w-full" onClick={google}>المتابعة باستخدام Google</Button>
        <div className="my-4 text-center text-xs text-muted-foreground">أو</div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>البريد الإلكتروني</Label><Input className="mt-2" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>كلمة المرور</Label><Input className="mt-2" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "دخول" : "إنشاء الحساب"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-olive hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "ليس لديك حساب؟ أنشئ حسابًا" : "لديك حساب؟ سجّل الدخول"}
        </button>
        <Link to="/" className="mt-2 block text-center text-xs text-muted-foreground hover:underline">العودة إلى الموقع</Link>
      </div>
    </div>
  );
}
