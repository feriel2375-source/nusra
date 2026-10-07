export const verificationLabels: Record<string, { label: string; dot: string; cls: string }> = {
  VERIFIED: { label: "موثّق", dot: "bg-v-verified", cls: "bg-v-verified/12 text-v-verified border-v-verified/30" },
  SOURCE_ONE: { label: "مصدر واحد", dot: "bg-v-one", cls: "bg-v-one/12 text-v-one border-v-one/30" },
  UNDER_VERIFICATION: { label: "قيد التحقق", dot: "bg-v-pending", cls: "bg-v-pending/15 text-gold-foreground border-v-pending/40" },
  LIMITED_INFORMATION: { label: "معلومات محدودة", dot: "bg-v-limited", cls: "bg-muted text-muted-foreground border-border" },
};

export const personStatusLabels: Record<string, string> = {
  DETAINED: "معتقل",
  RELEASED: "مُفرج عنه",
  MISSING: "مفقود",
  UNKNOWN: "غير معروف",
  OTHER: "أخرى",
};

export const publicationLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_REVIEW: "قيد المراجعة",
  VERIFIED: "موثّقة",
  PUBLISHED: "منشورة",
  ARCHIVED: "مؤرشفة",
};

export const riskLabels: Record<string, { label: string; cls: string }> = {
  LOW: { label: "منخفض", cls: "bg-accent text-accent-foreground" },
  MEDIUM: { label: "متوسط", cls: "bg-gold/25 text-gold-foreground" },
  HIGH: { label: "مرتفع", cls: "bg-destructive/15 text-destructive" },
  CRITICAL: { label: "حرج", cls: "bg-destructive text-destructive-foreground" },
};

export const submissionStatusLabels: Record<string, string> = {
  PENDING: "جديدة",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "معتمدة",
  NEEDS_MORE_INFO: "تحتاج معلومات",
  REJECTED: "مرفوضة",
  PUBLISHED: "منشورة",
};

export const submissionTypeLabels: Record<string, string> = {
  EXISTING_CASE: "معلومة عن قضية موجودة",
  NEW_CASE: "قضية جديدة",
  UPDATE: "تحديث",
  SOURCE: "مصدر",
  DOCUMENT: "وثيقة",
  CORRECTION: "تصحيح معلومة",
};

export const sourceTypeLabels: Record<string, string> = {
  OFFICIAL: "مصدر رسمي",
  NGO: "منظمة حقوقية",
  MEDIA: "وسيلة إعلام",
  DOCUMENT: "وثيقة",
  WITNESS: "شاهد",
  FAMILY: "عائلة",
  OTHER: "مصدر آخر",
};

export const reliabilityLabels: Record<string, string> = { HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" };

export const reportTypeLabels: Record<string, string> = {
  WRONG_INFO: "معلومة خاطئة",
  SENSITIVE_INFO: "معلومة حساسة",
  CORRECTION: "طلب تصحيح",
  DELETION: "طلب حذف",
  LEGAL: "مشكلة قانونية",
  OTHER: "مشكلة أخرى",
};

export const reportStatusLabels: Record<string, string> = { NEW: "جديد", IN_REVIEW: "قيد المعالجة", RESOLVED: "محلول", CLOSED: "مغلق" };

export const roleLabels: Record<string, string> = { contributor: "مساهم", reviewer: "مراجع", editor: "محرر", admin: "مدير" };

export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
}

export function relativeDays(d?: string | null) {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days === 2) return "منذ يومين";
  if (days < 11) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${days} يومًا`;
  const m = Math.floor(days / 30);
  return m <= 1 ? "منذ شهر" : m === 2 ? "منذ شهرين" : `منذ ${m} أشهر`;
}

/** Ranking for "cases that need attention" — never popularity. */
export function attentionScore(c: { needs: string[]; last_known_update: string | null; verification_status: string; person_status: string }) {
  const days = c.last_known_update ? (Date.now() - new Date(c.last_known_update).getTime()) / 86400000 : 999;
  let s = 0;
  if (days < 14) s += 3; // fresh update
  if (days > 180) s += 2; // long silence
  s += c.needs.length;
  if (c.verification_status === "UNDER_VERIFICATION" || c.verification_status === "LIMITED_INFORMATION") s += 2;
  if (c.person_status === "MISSING" || c.person_status === "DETAINED") s += 1;
  return s;
}
