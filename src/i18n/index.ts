// ============================================================
// إعداد الترجمة — i18n/index.ts
// يُهيئ مكتبة i18next مع ملفات اللغة العربية والإنجليزية
// ============================================================
import i18n from "./i18next-shim";

  export function applyDirection(lang: string): void {
    const isRtl = lang === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    if (isRtl) { document.documentElement.classList.add("font-arabic"); }
    else { document.documentElement.classList.remove("font-arabic"); }
    localStorage.setItem("gf-language", lang);
  }

  const savedLang =
    (typeof localStorage !== "undefined" && localStorage.getItem("gf-language")) || "en";
  applyDirection(savedLang);
  export default i18n;
  