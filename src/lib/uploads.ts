import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function validateFile(f: File | null) {
  if (!f) return null;
  if (!ALLOWED.includes(f.type)) return "نوع الملف غير مسموح (PDF أو صورة فقط).";
  if (f.size > 10 * 1024 * 1024) return "حجم الملف يتجاوز 10 ميغابايت.";
  return null;
}

function safePath(prefix: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${prefix}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadSubmissionFile(submissionId: string, file: File) {
  const path = safePath(`submissions/${submissionId}`, file);
  const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
  if (error) throw error;
  await supabase.rpc("attach_submission_document", { _submission_id: submissionId, _file_name: file.name.slice(0, 200), _file_path: path, _file_type: file.type });
}

export async function uploadCaseFile(caseId: string | null, file: File) {
  const path = safePath(`cases/${caseId ?? "general"}`, file);
  const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
