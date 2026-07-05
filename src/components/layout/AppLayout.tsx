// ============================================================
// مكوّن التخطيط الرئيسي — يشمل الشريط الجانبي وشريط الرأس وحاوية المحتوى
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// ── مكوّن التحريك بين الصفحات — ينفّذ أثر fade عند التنقل بين المسارات ──
// المراحل: visible (ظاهر) → exit (يختفي) → enter (يظهر مجدداً) → visible
function AnimatedPage({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  // ── المحتوى المعروض حالياً (يُحفظ أثناء الانتقال حتى يكتمل أثر الخروج) ──
  const [displayChildren, setDisplayChildren] = useState(children);
  // ── مرحلة الأنيميشن الحالية ──
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");
  const prevLocation = useRef(location);
  const prevChildren = useRef(children);

  useEffect(() => {
    if (location !== prevLocation.current) {
      // ── بدء أثر الخروج (fade out) عند تغيير المسار ──
      setPhase("exit");
      const t1 = setTimeout(() => {
        // ── بعد 150ms: تبديل المحتوى وبدء أثر الدخول ──
        setDisplayChildren(children);
        prevChildren.current = children;
        setPhase("enter");
        const t2 = setTimeout(() => setPhase("visible"), 200);
        return () => clearTimeout(t2);
      }, 150);
      prevLocation.current = location;
      return () => clearTimeout(t1);
    } else {
      // ── لا تغيير في المسار: تحديث المحتوى مباشرة ──
      setDisplayChildren(children);
    }
  }, [location, children]);

  // ── أنماط CSS لكل مرحلة من مراحل الأنيميشن ──
  const style: React.CSSProperties =
    phase === "exit"
      ? { opacity: 0, transform: "translateY(6px)", transition: "opacity 150ms ease, transform 150ms ease" }
      : phase === "enter"
      ? { opacity: 0, transform: "translateY(-4px)", transition: "none" }
      : { opacity: 1, transform: "translateY(0)", transition: "opacity 200ms ease, transform 200ms ease" };

  return <div style={style}>{displayChildren}</div>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── الشريط الجانبي — مخفي على الشاشات الصغيرة، يدفع المحتوى عند التوسع ── */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>
      {/* ── منطقة المحتوى الرئيسية: الرأس + منطقة الصفحات مع أنيميشن الانتقال ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header />
        {/* حاوية الصفحات — قابلة للتمرير مع حشو مناسب لكل حجم شاشة */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
