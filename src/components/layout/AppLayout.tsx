// ============================================================
// مكوّن التخطيط الرئيسي — يشمل الشريط الجانبي وشريط الرأس وحاوية المحتوى
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function AnimatedPage({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");
  const prevLocation = useRef(location);
  const prevChildren = useRef(children);

  useEffect(() => {
    if (location !== prevLocation.current) {
      // Start exit fade
      setPhase("exit");
      const t1 = setTimeout(() => {
        // Swap content + start enter fade
        setDisplayChildren(children);
        prevChildren.current = children;
        setPhase("enter");
        const t2 = setTimeout(() => setPhase("visible"), 200);
        return () => clearTimeout(t2);
      }, 150);
      prevLocation.current = location;
      return () => clearTimeout(t1);
    } else {
      setDisplayChildren(children);
    }
  }, [location, children]);

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
      {/* Sidebar in flex flow — pushes content when it expands */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
