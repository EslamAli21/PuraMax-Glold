// ============================================================
// سياق وضع التعديل — EditModeContext.tsx
//
// يُتيح هذا السياق:
//  - تفعيل/تعطيل وضع التعديل في الشريط الجانبي ولوحة التحكم
//  - تخصيص تسميات عناصر التنقل
//  - تغيير الشعار
//  - إعادة ترتيب مجموعات التنقل
//  - إعادة ترتيب بطاقات لوحة التحكم (جديد)
//  - تخصيص ألوان بطاقات لوحة التحكم (جديد)
// ============================================================
import React, { createContext, useContext, useState, useCallback } from "react";

// ─── واجهة السياق — تصف جميع الخصائص والدوال المتاحة ─────────────────────
export interface EditModeContextType {
  isEditMode:              boolean;
  toggleEditMode:          () => void;
  customLabels:            Record<string, string>;
  setCustomLabel:          (key: string, value: string) => void;
  customLogo:              string | null;
  setCustomLogo:           (url: string | null) => void;
  navGroupOrder:           string[];
  setNavGroupOrder:        (order: string[]) => void;
  // ── جديد: ترتيب بطاقات لوحة التحكم ─────────────────────────────────────
  dashboardCardOrder:      string[];
  setDashboardCardOrder:   (order: string[]) => void;
  // ── جديد: ألوان مخصصة لبطاقات لوحة التحكم ────────────────────────────
  dashboardCardColors:     Record<string, string>;
  setDashboardCardColor:   (cardId: string, color: string) => void;
  // ── جديد: أقسام مخفية في لوحة التحكم ────────────────────────────────
  hiddenSections:         string[];
  toggleSection:          (id: string) => void;
  // ── جديد: ترتيب أقسام لوحة التحكم ────────────────────────────────────
  sectionOrder:           string[];
  setSectionOrder:        (order: string[]) => void;
  // إعادة تعيين كل الإعدادات
  resetAll:                () => void;
}

// ─── القيمة الافتراضية للسياق ──────────────────────────────────────────────
const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
  customLabels: {},
  setCustomLabel: () => {},
  customLogo: null,
  setCustomLogo: () => {},
  navGroupOrder: [],
  setNavGroupOrder: () => {},
  dashboardCardOrder: [],
  setDashboardCardOrder: () => {},
  dashboardCardColors: {},
  setDashboardCardColor: () => {},
  hiddenSections: [],
  toggleSection: () => {},
  sectionOrder: [],
  setSectionOrder: () => {},
  resetAll: () => {},
});

// ─── مزود السياق ──────────────────────────────────────────────────────────
export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);

  // تسميات مخصصة محفوظة في localStorage
  const [customLabels, setCustomLabels] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_labels") || "{}"); }
    catch { return {}; }
  });

  // شعار مخصص محفوظ في localStorage
  const [customLogo, setCustomLogoState] = useState<string | null>(() =>
    localStorage.getItem("puramax_logo") || null
  );

  // ترتيب مجموعات التنقل الجانبي
  const [navGroupOrder, setNavGroupOrderState] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_nav_order") || "[]"); }
    catch { return []; }
  });

  // ── جديد: ترتيب بطاقات لوحة التحكم ─────────────────────────────────────
  const [dashboardCardOrder, setDashboardCardOrderState] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_dashboard_order") || "[]"); }
    catch { return []; }
  });

  // ── جديد: ألوان مخصصة لكل بطاقة ─────────────────────────────────────────
  const [dashboardCardColors, setDashboardCardColorsState] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_card_colors") || "{}"); }
    catch { return {}; }
  });

  const toggleEditMode = useCallback(() => setIsEditMode(v => !v), []);

  const setCustomLabel = useCallback((key: string, value: string) => {
    setCustomLabels(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("puramax_labels", JSON.stringify(next));
      return next;
    });
  }, []);

  const setCustomLogo = useCallback((url: string | null) => {
    setCustomLogoState(url);
    if (url) localStorage.setItem("puramax_logo", url);
    else     localStorage.removeItem("puramax_logo");
  }, []);

  const setNavGroupOrder = useCallback((order: string[]) => {
    setNavGroupOrderState(order);
    localStorage.setItem("puramax_nav_order", JSON.stringify(order));
  }, []);

  // ── جديد: تعيين ترتيب بطاقات لوحة التحكم ────────────────────────────────
  const setDashboardCardOrder = useCallback((order: string[]) => {
    setDashboardCardOrderState(order);
    localStorage.setItem("puramax_dashboard_order", JSON.stringify(order));
  }, []);

  // ── جديد: تعيين لون مخصص لبطاقة معينة ──────────────────────────────────
  const setDashboardCardColor = useCallback((cardId: string, color: string) => {
    setDashboardCardColorsState(prev => {
      const next = { ...prev, [cardId]: color };
      localStorage.setItem("puramax_card_colors", JSON.stringify(next));
      return next;
    });
  }, []);

  // ── جديد: الأقسام المخفية في لوحة التحكم ────────────────────────────
  const [hiddenSections, setHiddenSectionsState] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_hidden_sections") || "[]"); }
    catch { return []; }
  });

  // ── جديد: ترتيب أقسام لوحة التحكم ────────────────────────────────────
  const [sectionOrder, setSectionOrderState] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_section_order") || "[]"); }
    catch { return []; }
  });

  // تبديل رؤية قسم في لوحة التحكم
  const toggleSection = useCallback((id: string) => {
    setHiddenSectionsState(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      localStorage.setItem("puramax_hidden_sections", JSON.stringify(next));
      return next;
    });
  }, []);

  // تعيين ترتيب الأقسام
  const setSectionOrder = useCallback((order: string[]) => {
    setSectionOrderState(order);
    localStorage.setItem("puramax_section_order", JSON.stringify(order));
  }, []);

  // إعادة تعيين كل الإعدادات
  const resetAll = useCallback(() => {
    setCustomLabels({});
    setCustomLogoState(null);
    setNavGroupOrderState([]);
    setDashboardCardOrderState([]);
    setDashboardCardColorsState({});
    ["puramax_labels","puramax_logo","puramax_nav_order","puramax_dashboard_order","puramax_card_colors"]
      .forEach(k => localStorage.removeItem(k));
  }, []);

  return (
    <EditModeContext.Provider value={{
      isEditMode, toggleEditMode,
      customLabels, setCustomLabel,
      customLogo, setCustomLogo,
      navGroupOrder, setNavGroupOrder,
      dashboardCardOrder, setDashboardCardOrder,
      dashboardCardColors, setDashboardCardColor,
      hiddenSections, toggleSection,
      sectionOrder, setSectionOrder,
      resetAll,
    }}>
      {children}
    </EditModeContext.Provider>
  );
}

// دالة مساعدة لاستخدام السياق في أي مكوّن
export const useEditMode = () => useContext(EditModeContext);
