import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Table, Td } from "@/components/admin/kit";
import { formatDate, roleLabels } from "@/lib/labels";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];
export const Route = createFileRoute("/admin/users")({ component: Page });

function Page() {
  const { isAdmin, user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([supabase.from("profiles").select("*").order("created_at"), supabase.from("user_roles").select("*")]);
      return (p ?? []).map((u) => ({ ...u, roles: (r ?? []).filter((x) => x.user_id === u.id).map((x) => x.role) }));
    },
  });
  if (!isAdmin) return <AdminTitle title="غير مصرح" sub="هذه الصفحة للمديرين فقط." />;

  const toggle = async (uid: string, role: Role, has: boolean) => {
    if (uid === user.id && role === "admin" && has) return toast.error("لا يمكنك سحب صلاحية المدير من نفسك");
    const { error } = has ? await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role) : await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الصلاحيات"); qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const roles = Object.keys(roleLabels) as Role[];
  return (
    <>
      <AdminTitle title="المستخدمون والصلاحيات" sub="يظهر هنا كل من سجّل الدخول إلى لوحة الإدارة. امنح الصلاحيات بحذر." />
      <Table head={["المستخدم", "تاريخ الانضمام", ...roles.map((r) => roleLabels[r]!)]} empty={!data.length}>
        {data.map((u) => (
          <tr key={u.id}>
            <Td><p className="font-medium">{u.display_name || "—"}</p><p className="text-xs text-muted-foreground" dir="ltr">{u.email}</p></Td>
            <Td>{formatDate(u.created_at)}</Td>
            {roles.map((r) => { const has = u.roles.includes(r); return <Td key={r}><input type="checkbox" className="size-4" checked={has} onChange={() => toggle(u.id, r, has)} /></Td>; })}
          </tr>
        ))}
      </Table>
      <p className="mt-4 text-sm text-muted-foreground">المراجع: يرى ويراجع. المحرر: يعدّل وينشر. المدير: كل الصلاحيات وإدارة الفريق.</p>
    </>
  );
}
