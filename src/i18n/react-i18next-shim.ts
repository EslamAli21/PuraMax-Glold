import { useState, useEffect } from "react";
  import i18n, { subscribe } from "./i18next-shim";

  export function useTranslation() {
    const [, forceUpdate] = useState(0);
    useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);
    return { t: (key: string): string => i18n.t(key), i18n };
  }

  export const initReactI18next = { type: "languageDetector" as const };
  