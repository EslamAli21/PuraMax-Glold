// ============================================================
// صفحة العامل — عرض مهام العامل الحالية وسجل عمله
// ============================================================
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function WorkerPage() {
  // ── استخراج الدور الحالي من سياق المصادقة لعرض اسم المحطة ──
  const { currentRole } = useAuth();
  const { toast } = useToast();
  // ── حالة العمل النشط: false = في انتظار مسح QR، true = مهمة جارية ──
  const [activeJob, setActiveJob] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* ── شريط معلومات العامل: الاسم والمحطة ── */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">{t("worker.operator")}</p>
          <p className="font-bold text-lg">Ahmad ({currentRole})</p>
        </div>
        <div className="text-end">
          <p className="text-sm text-muted-foreground">{t("worker.station")}</p>
          <p className="font-bold text-lg text-primary">Polishing (PM-1)</p>
        </div>
      </div>

      {!activeJob ? (
        <Card className="border-primary/20 shadow-lg border-2">
          <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
              <QrCode className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t("worker.readyTitle")}</h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-sm">{t("worker.readyDesc")}</p>
            <Button size="lg" className="w-full h-20 text-xl font-bold rounded-xl" onClick={() => setActiveJob(true)}>
              <QrCode className="w-6 h-6 me-3" />
              {t("worker.scanQr")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/50 shadow-lg border-2 bg-green-500/5">
          <CardContent className="pt-8 pb-8 flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b border-green-500/20 pb-4">
              <div>
                <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-1">{t("worker.activeJob")}</p>
                <p className="font-mono text-2xl font-black">QR-A1B2C3</p>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-1">{t("worker.timeElapsed")}</p>
                <p className="font-mono text-2xl font-black text-primary">00:14:23</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-background p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">{t("worker.item")}</p>
                <p className="font-bold text-lg">Luxury Pendant 21K</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{t("worker.quantity")}</p>
                  <p className="font-bold text-xl">10 pcs</p>
                </div>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{t("worker.instructions")}</p>
                  <p className="font-bold text-destructive">High Polish</p>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full h-20 text-xl font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                toast({ title: t("worker.jobCompleted"), description: t("worker.jobCompletedDesc") });
                setActiveJob(false);
              }}
            >
              <CheckCircle2 className="w-6 h-6 me-3" />
              {t("worker.markComplete")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <h3 className="font-bold text-lg mb-4 flex items-center"><History className="w-5 h-5 me-2" /> {t("worker.recentWork")}</h3>
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="bg-card p-4 rounded-lg border flex justify-between items-center opacity-70">
              <div>
                <p className="font-mono font-bold text-sm">QR-X{i}Y{i}Z{i}</p>
                <p className="text-xs text-muted-foreground">Classic Ring 18K • 30 pcs</p>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-green-600">{t("worker.completed")}</p>
                <p className="text-xs text-muted-foreground">1h {t("worker.ago")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
