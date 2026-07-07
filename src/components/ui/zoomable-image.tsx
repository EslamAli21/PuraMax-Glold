// ══════════════════════════════════════════════════════════════
// مكوّن الصورة القابلة للتكبير — ZoomableImage
// نافذة ضوئية عالية الأداء تستخدم React Portal
//  - تُعرض النافذة مباشرةً في document.body (لا تعارض في التخطيط)
//  - تم إزالة backdrop-blur لتحسين أداء التمرير
//  - يتم تجميد تمرير الصفحة أثناء فتح النافذة
//  - will-change: transform يضع الطبقة على GPU منفصلة
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ZoomableImage({ src, alt = "", className = "" }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  const hqSrc = src
    .replace(/w=\d+/, "w=1200")
    .replace(/h=\d+/, "h=900")
    .replace(/q=\d+/, "q=95");

  const close = useCallback(() => setOpen(false), []);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const lightbox = open
    ? ReactDOM.createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`صورة ${alt}`}
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            willChange: "transform",
            contain: "strict",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
          >
            <img
              src={hqSrc}
              alt={alt}
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "12px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                display: "block",
              }}
            />
            <button
              aria-label="إغلاق"
              onClick={close}
              style={{
                position: "absolute",
                top: "-12px",
                right: "-12px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <X style={{ width: "16px", height: "16px", color: "#111" }} />
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        title="انقر لعرض الصورة كاملةً"
        onClick={() => setOpen(true)}
        className={`cursor-zoom-in ${className}`}
        style={{ display: "block" }}
      />
      {lightbox}
    </>
  );
}
