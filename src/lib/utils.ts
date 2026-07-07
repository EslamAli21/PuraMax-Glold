// ============================================================
// ملف الأدوات المساعدة — utils.ts
// يحتوي على دوال مساعدة تُستخدم في جميع أنحاء التطبيق
// ============================================================
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// دمج أسماء CSS classes بشكل ذكي (Tailwind + clsx)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── مولّد الأكواد التلقائي ─────────────────────────────────────────────────
// يُنشئ كوداً فريداً تلقائياً بناءً على البادئة والتاريخ والعداد المتصاعد
// البادئات المتاحة: TR (شجرة) | BOX (صندوق) | BATCH | ORD (طلب)
//
// الصيغة: <PREFIX>-YYYYMMDD-<COUNTER>
//   مثال: TR-20260607-0001
//         BOX-20260607-0042
//
// يُخزَّن العداد في localStorage لكل بادئة حتى لا تتكرر الأكواد بين الجلسات

function pad(n: number, digits = 4): string {
  // إضافة الأصفار في البداية حتى يصل الرقم للطول المطلوب
  return String(n).padStart(digits, "0");
}

function todayStamp(): string {
  // صياغة التاريخ الحالي على شكل YYYYMMDD
  const d = new Date();
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1, 2);
  const day = pad(d.getDate(), 2);
  return `${y}${m}${day}`;
}

export function generateCode(prefix: string): string {
  // مفتاح التخزين في localStorage لهذه البادئة + اليوم الحالي
  const stamp      = todayStamp();
  const storageKey = `puramax_seq_${prefix}_${stamp}`;

  // قراءة العداد الحالي من التخزين المحلي، ثم زيادته بمقدار 1
  const current = parseInt(localStorage.getItem(storageKey) || "0", 10);
  const next    = current + 1;

  // حفظ العداد الجديد في التخزين المحلي
  localStorage.setItem(storageKey, String(next));

  // إرجاع الكود المولَّد
  return `${prefix}-${stamp}-${pad(next)}`;
}
