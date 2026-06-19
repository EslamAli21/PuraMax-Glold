// ============================================================
// مكوّن الهيكل العظمي — حالة التحميل قبل ظهور البيانات
// مكتبة shadcn/ui — جزء من نظام تصميم PuraMax Gold Factory
// ============================================================
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
