import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, FormDialog, Pager, Table, Td, emptyToNull, selectCls, type FieldSpec } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = Record<string, any> & { id: string };
export type Col = { label: string; render: (r: Row) => ReactNode };

/** Generic list + create/edit/delete page for simple admin tables. */
export function CrudPage({ table, title, sub, select = "*", order = "created_at", fields, cols, canEdit, searchKeys = [], filter, defaults = {}, allowCreate = true, extraActions }: {
  table: string; title: string; sub?: string; select?: string; order?: string; fields: FieldSpec[]; cols: Col[];
  canEdit: boolean; searchKeys?: string[]; filter?: { key: string; label: string; options: [string, string][] };
  defaults?: Record<string, unknown>; allowCreate?: boolean; extraActions?: (r: Row, refresh: () => void) => ReactNode;
}) {
  const qc = useQueryClient();
  const key = ["admin-crud", table];
  const [q, setQ] = useState("");
  const [f, setF] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [init, setInit] = useState<Record<string, unknown>>({});
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from(table as any) as any).select(select).order(order, { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); };
  const list = data.filter((r) => (!q || searchKeys.some((k) => String(k.split(".").reduce((o: any, p) => o?.[p], r) ?? "").includes(q))) && (!filter || !f || String(r[filter.key]) === f));
  const pages = Math.ceil(list.length / 15);

  const save = async (v: Record<string, unknown>) => {
    const payload = emptyToNull(Object.fromEntries(fields.map((fl) => [fl.key, v[fl.key]])));
    const t = supabase.from(table as any) as any;
    const { error } = edit ? await t.update(payload).eq("id", edit.id) : await t.insert(payload);
    if (error) { toast.error(error.message); throw error; }
    toast.success("تم الحفظ"); refresh();
  };
  const del = async (r: Row) => {
    if (!confirm("حذف هذا العنصر نهائيًا؟")) return;
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); refresh();
  };

  return (
    <>
      <AdminTitle title={title} sub={sub ?? `${list.length} عنصر`}>
        {canEdit && allowCreate && <Button variant="olive" onClick={() => { setEdit(null); setInit({ ...defaults }); setOpen(true); }}><Plus />إضافة</Button>}
      </AdminTitle>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {searchKeys.length > 0 && <Input placeholder="بحث..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />}
        {filter && <select className={selectCls} value={f} onChange={(e) => { setF(e.target.value); setPage(1); }}><option value="">{filter.label}: الكل</option>{filter.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
      </div>
      {isLoading ? <p className="p-8 text-center text-muted-foreground">جارٍ التحميل…</p> : (
        <Table head={[...cols.map((c) => c.label), "إجراءات"]} empty={!list.length}>
          {list.slice((page - 1) * 15, page * 15).map((r) => (
            <tr key={r.id} className="hover:bg-secondary/30">
              {cols.map((c) => <Td key={c.label}>{c.render(r)}</Td>)}
              <Td className="whitespace-nowrap">
                {extraActions?.(r, refresh)}
                {canEdit && <Button size="icon" variant="ghost" title="تعديل" onClick={() => { setEdit(r); setInit(r); setOpen(true); }}><Pencil /></Button>}
                {canEdit && <Button size="icon" variant="ghost" title="حذف" onClick={() => del(r)}><Trash2 className="text-destructive" /></Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}
      <Pager page={page} pages={pages} setPage={setPage} />
      <FormDialog open={open} onOpenChange={setOpen} title={edit ? "تعديل" : "إضافة"} fields={fields} initial={init} onSubmit={save} />
    </>
  );
}

export const opts = (m: Record<string, string | { label: string }>): [string, string][] =>
  Object.entries(m).map(([k, v]) => [k, typeof v === "string" ? v : v.label]);
