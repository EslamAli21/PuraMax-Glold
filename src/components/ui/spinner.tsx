// ============================================================
// مكوّن واجهة المستخدم — spinner
// مكتبة shadcn/ui — جزء من نظام تصميم PuraMax Gold Factory
// ============================================================
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
