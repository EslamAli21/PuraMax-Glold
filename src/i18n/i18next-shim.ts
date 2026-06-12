import en from "./en.json";
  import ar from "./ar.json";

  const resources: Record<string, Record<string, unknown>> = { en, ar };
  type Listener = () => void;
  const listeners: Listener[] = [];

  function getNestedValue(obj: Record<string, unknown>, key: string): string {
    const parts = key.split(".");
    let result: unknown = obj;
    for (const part of parts) {
      if (result && typeof result === "object") {
        result = (result as Record<string, unknown>)[part];
      } else return key;
    }
    return typeof result === "string" ? result : key;
  }

  let currentLang: string =
    (typeof localStorage !== "undefined" && localStorage.getItem("gf-language")) || "en";

  const i18n = {
    get language(): string { return currentLang; },
    changeLanguage(lang: string): Promise<void> {
      currentLang = lang;
      if (typeof localStorage !== "undefined") localStorage.setItem("gf-language", lang);
      listeners.slice().forEach((l) => l());
      return Promise.resolve();
    },
    // دعم الاستيفاء — يستبدل {{varName}} بالقيمة الفعلية من options
    t(key: string, options?: Record<string, unknown>): string {
      const translations = resources[currentLang] ?? resources["en"];
      let result = getNestedValue(translations as Record<string, unknown>, key);
      if (options && typeof result === "string") {
        result = result.replace(/\{\{(\w+)\}\}/g, (_, name) =>
          options[name] !== undefined ? String(options[name]) : `{{${name}}}`
        );
      }
      return result;
    },
    use(_plugin: unknown) { return i18n; },
    init(_options: unknown): Promise<void> { return Promise.resolve(); },
  };

  export function subscribe(listener: Listener): () => void {
    listeners.push(listener);
    return () => { const idx = listeners.indexOf(listener); if (idx >= 0) listeners.splice(idx, 1); };
  }

  export default i18n;
  