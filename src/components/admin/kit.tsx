import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AdminTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-primary md:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className ?? "bg-secondary text-secondary-foreground")}>{children}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-right text-xs text-muted-foreground"><tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-muted-foreground">لا توجد بيانات.</p>}
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;

export const selectCls = "h-10 w-full rounded-md border bg-card px-3 text-sm";

export function useAdminCaseOptions() {
  return useQuery({
    queryKey: ["admin-case-options"],
    queryFn: async () => {
      const { data } = await supabase.from("cases").select("id, case_number, title").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export type FieldSpec = { key: string; label: string; type?: "text" | "textarea" | "select" | "date" | "checkbox"; options?: [string, string][]; required?: boolean };

export function FormDialog({ open, onOpenChange, title, fields, initial, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; fields: FieldSpec[];
  initial: Record<string, unknown>; onSubmit: (v: Record<string, unknown>) => Promise<void>;
}) {
  const [v, setV] = useState<Record<string, unknown>>(initial);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(initial);
  if (key !== initial) { setKey(initial); setV(initial); }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) if (f.required && !String(v[f.key] ?? "").trim()) return alert(`${f.label} مطلوب`);
    setBusy(true);
    try { await onSubmit(v); onOpenChange(false); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              {f.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.checked })} />{f.label}</label>
              ) : (
                <>
                  <Label>{f.label}{f.required && " *"}</Label>
                  <div className="mt-1.5">
                    {f.type === "textarea" ? <Textarea rows={4} maxLength={10000} value={String(v[f.key] ?? "")} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
                      : f.type === "select" ? (
                        <select className={selectCls} value={String(v[f.key] ?? "")} onChange={(e) => setV({ ...v, [f.key]: e.target.value || null })}>
                          {!f.required && <option value="">—</option>}
                          {f.options?.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      ) : <Input type={f.type === "date" ? "date" : "text"} maxLength={500} value={String(v[f.key] ?? "")} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
                  </div>
                </>
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={busy}>حفظ</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex justify-center gap-1">
      {Array.from({ length: pages }, (_, i) => <Button key={i} size="sm" variant={page === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>)}
    </div>
  );
}

export function emptyToNull(v: Record<string, unknown>) {
  const o: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) o[k] = val === "" ? null : val;
  return o;
}
