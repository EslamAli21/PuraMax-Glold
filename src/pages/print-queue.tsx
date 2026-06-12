// ============================================================
// صفحة قائمة الطباعة — إدارة طوابير الطباعة ثلاثية الأبعاد
// ============================================================
import React from "react";
import { useMockState } from "@/lib/mock-state";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PrintQueuePage() {
  /* جلب الطلبات والموديلات من حالة التطبيق */ const { orders, models } = useMockState();
  const { t } = useTranslation();
  const queue = orders.filter(o => o.status === "in-production" && o.isNewModel);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          <Printer className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("printQueue.title")}</h1>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("printQueue.orderCode")}</TableHead>
              {/* ── عمود صورة الموديل ── */}
              <TableHead>{t("scale.modelPic")}</TableHead>
              <TableHead>{t("printQueue.modelItem")}</TableHead>
              <TableHead>{t("printQueue.quantity")}</TableHead>
              <TableHead>{t("printQueue.designNotes")}</TableHead>
              <TableHead>{t("printQueue.status")}</TableHead>
              <TableHead className="text-end">{t("printQueue.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono font-medium">{o.orderCode}</TableCell>
                {/* ── صورة الموديل مأخوذة من قسم الموديلات ── */}
                <TableCell>
                  {(() => {
                    const mdl = o.modelId ? models.find(m => m.id === o.modelId) : null;
                    return mdl?.image ? (
                      <img src={mdl.image} alt={o.itemName} className="w-10 h-10 object-cover rounded-md border border-border/50" />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-[9px] text-muted-foreground border border-border/50">—</div>
                    );
                  })()}
                </TableCell>
                <TableCell>{o.itemName}</TableCell>
                <TableCell>{o.qty}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{o.notes || "-"}</TableCell>
                <TableCell><span className="text-yellow-600 font-medium text-xs uppercase tracking-wider bg-yellow-100 px-2 py-1 rounded">{t("printQueue.waiting")}</span></TableCell>
                <TableCell className="text-end">
                  <div className="flex gap-2 justify-end flex-wrap">
                  <Button variant="outline" size="sm">{t("printQueue.startPrint")}</Button>
                  <Button size="sm" variant="secondary"><CheckCircle className="w-4 h-4 me-1"/> {t("printQueue.done")}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {queue.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">{t("printQueue.empty")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
