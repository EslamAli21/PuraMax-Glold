import { useState, useEffect } from "react";
  import i18n, { subscribe } from "./i18next-shim";

  export function useTranslation() {
    const [, forceUpdate] = useState(0);
    useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);
    // دالة الترجمة — تدعم الاستيفاء بتمرير كائن الخيارات
    return { t: (key: string, options?: Record<string, unknown>): string => i18n.t(key, options), i18n };
  }

  export const initReactI18next = { type: "languageDetector" as const };
  