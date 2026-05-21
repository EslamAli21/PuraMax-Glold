import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar: left in LTR, right in RTL */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50">
        <Sidebar />
      </div>
      {/* Main content: padded left in LTR, padded right in RTL */}
      <div className="flex-1 flex flex-col md:pl-64 rtl:md:pl-0 rtl:md:pr-64 h-full min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
