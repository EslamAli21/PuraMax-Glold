import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QrCode, ScanLine, ArrowRight, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { OperationType } from "@/lib/mock-data";
import { useTranslation } from "react-i18next";

export default function ScalePage() {
  const { currentRole } = useAuth();
  const { orders, sections, workers, machines, movements, addMovement } = useMockState();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<any>(null);
  const [manualCode, setManualCode] = useState("");

  const [operation, setOperation] = useState<OperationType | null>(null);
  const [weightBefore, setWeightBefore] = useState<number>(0);
  const [weightAfter, setWeightAfter] = useState<number>(0);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [isGold, setIsGold] = useState(true);
  const [fromSection, setFromSection] = useState("");
  const [toSection, setToSection] = useState("");
  const [worker, setWorker] = useState("");
  const [machine, setMachine] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const order = orders.find(o => o.status === "in-production" || o.status === "approved");
      if (order) {
        setScannedOrder(order);
        setFromSection(sections[0].id);
        setWeightBefore(order.totalWeightGrams);
        setStep(2);
      } else {
        toast({ title: "Not found", description: "No active order found", variant: "destructive" });
      }
      setIsScanning(false);
    }, 1500);
  };

  const handleManualLookup = () => {
    const order = orders.find(o => o.orderCode === manualCode);
    if (order) {
      setScannedOrder(order);
      setFromSection(sections[0].id);
      setWeightBefore(order.totalWeightGrams);
      setStep(2);
    } else {
      toast({ title: "Not found", description: "Invalid order code", variant: "destructive" });
    }
  };

  const calculateLoss = () => {
    if (!weightBefore || !weightAfter) return { grams: 0, percent: 0 };
    const loss = Math.max(0, weightBefore - weightAfter);
    const percent = weightBefore > 0 ? (loss / weightBefore) * 100 : 0;
    return { grams: Number(loss.toFixed(2)), percent: Number(percent.toFixed(2)) };
  };

  const lossData = calculateLoss();

  const handleConfirm = () => {
    if (!scannedOrder || !operation || !fromSection || !toSection || !worker) return;
    addMovement({
      qrCode: `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      fromSectionId: fromSection,
      toSectionId: toSection,
      workerId: worker,
      operationType: operation,
      weightBefore,
      weightAfter,
      lossGrams: lossData.grams,
      lossPercent: lossData.percent,
      orderId: scannedOrder.id,
      notes
    });
    setConfirmOpen(false);
    setSuccessData({ qr: `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}` });
  };

  const resetWizard = () => {
    setStep(1); setScannedOrder(null); setManualCode(""); setOperation(null);
    setWeightBefore(0); setWeightAfter(0); setTareWeight(0);
    setToSection(""); setWorker(""); setMachine(""); setNotes(""); setSuccessData(null);
  };

  const OPERATION_LABELS: Record<string, string> = {
    "normal": t("scale.normal"),
    "split": t("scale.split"),
    "merge": t("scale.merge"),
    "tree-build": t("scale.treeBuild"),
    "rework": t("scale.rework"),
    "scrap": t("scale.scrap"),
    "return": t("scale.return"),
    "direct-melt": t("scale.directMelt"),
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
      {[1, 2, 3, 4, 5].map(s => (
        <div key={s} className={`flex flex-col items-center gap-2 ${s === step ? 'opacity-100' : s < step ? 'opacity-70' : 'opacity-40'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${s === step ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(200,150,50,0.4)]' : s < step ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-background'}`}>
            {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
          <span className="text-[10px] font-medium hidden sm:block uppercase tracking-wider">
            {s === 1 ? t("scale.stepScan") : s === 2 ? t("scale.stepAction") : s === 3 ? t("scale.stepWeight") : s === 4 ? t("scale.stepDetails") : t("scale.stepConfirm")}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("scale.title")}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {t("scale.connected")}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="border-sidebar-primary/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-sidebar-primary to-sidebar-ring" />
          <CardContent className="pt-8">
            {successData ? (
              <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t("scale.recordSaved")}</h2>
                  <p className="text-muted-foreground">{t("scale.recordSavedDesc")}</p>
                </div>
                <div className="p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg inline-block">
                  <div className="w-32 h-32 bg-foreground/5 mx-auto mb-2 flex flex-wrap gap-1 p-2">
                    {Array.from({length: 25}).map((_, i) => (
                      <div key={i} className={`w-4 h-4 ${Math.random() > 0.5 ? 'bg-foreground' : ''}`} />
                    ))}
                  </div>
                  <p className="font-mono font-bold tracking-widest">{successData.qr}</p>
                </div>
                <div className="flex gap-4 w-full max-w-sm">
                  <Button variant="outline" className="flex-1" onClick={() => toast({ title: t("scale.printing") })}>
                    {t("scale.printLabel")}
                  </Button>
                  <Button className="flex-1 font-bold" onClick={resetWizard}>
                    {t("scale.nextItem")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {renderStepIndicator()}
                <div className="min-h-[400px]">
                  {/* STEP 1 */}
                  {step === 1 && (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-8">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all duration-1000 ${isScanning ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`} />
                        <div className="w-32 h-32 bg-card border-2 border-primary/30 rounded-3xl flex items-center justify-center relative z-10 shadow-xl">
                          {isScanning ? <ScanLine className="w-16 h-16 text-primary animate-pulse" /> : <QrCode className="w-16 h-16 text-muted-foreground" />}
                        </div>
                      </div>
                      <Button size="lg" className="w-64 h-16 text-xl font-bold shadow-lg" onClick={handleScan} disabled={isScanning}>
                        {isScanning ? t("scale.scanning") : t("scale.tapToScan")}
                      </Button>
                      <div className="w-full max-w-sm flex items-center gap-4">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs text-muted-foreground uppercase font-bold">{t("scale.or")}</span>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      <div className="flex w-full max-w-sm gap-2">
                        <Input
                          placeholder={t("scale.manualCode")}
                          value={manualCode}
                          onChange={e => setManualCode(e.target.value)}
                          className="h-12 font-mono"
                        />
                        <Button variant="secondary" className="h-12 px-6 font-bold" onClick={handleManualLookup} disabled={!manualCode}>
                          {t("scale.lookup")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="p-4 bg-muted/50 rounded-lg border flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("scale.order")}</p>
                          <p className="font-mono font-bold text-lg">{scannedOrder?.orderCode}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm text-muted-foreground">{t("scale.currentItem")}</p>
                          <p className="font-medium">{scannedOrder?.itemName}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-base">{t("scale.selectOperation")}</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(["normal", "split", "merge", "tree-build", "rework", "scrap", "return", "direct-melt"] as OperationType[]).map(op => (
                            <Button
                              key={op}
                              variant={operation === op ? "default" : "outline"}
                              className={`h-20 flex flex-col gap-2 border-2 ${operation === op ? 'border-primary shadow-md' : 'border-border'}`}
                              onClick={() => { setOperation(op); setTimeout(() => setStep(3), 300); }}
                            >
                              {OPERATION_LABELS[op] || op.replace("-", " ")}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{t("scale.recordWeight")}</h3>
                        <div className="flex items-center gap-2">
                          <Label>{t("scale.goldOnly")}</Label>
                          <Switch checked={isGold} onCheckedChange={setIsGold} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("scale.weightBefore")}</Label>
                          <Input type="number" className="h-20 text-4xl font-mono font-bold text-center bg-muted/50" value={weightBefore || ""} onChange={e => setWeightBefore(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-primary uppercase tracking-wider">{t("scale.weightAfter")}</Label>
                          <Input type="number" className="h-20 text-4xl font-mono font-bold text-center border-2 border-primary shadow-inner" value={weightAfter || ""} onChange={e => setWeightAfter(Number(e.target.value))} autoFocus />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("scale.tare")}</Label>
                        <Input type="number" className="h-12 w-1/2" value={tareWeight || ""} onChange={e => setTareWeight(Number(e.target.value))} />
                      </div>
                      <div className={`p-6 rounded-xl border-2 flex items-center justify-between ${
                        lossData.percent > 5 ? 'bg-destructive/10 border-destructive text-destructive' :
                        lossData.percent > 2 ? 'bg-yellow-500/10 border-yellow-500 text-yellow-700' :
                        'bg-green-500/10 border-green-500 text-green-700'
                      }`}>
                        <div>
                          <p className="text-sm font-bold uppercase opacity-80 mb-1">{t("scale.calculatedLoss")}</p>
                          <p className="text-3xl font-bold font-mono">{lossData.grams}g</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-bold uppercase opacity-80 mb-1">{t("scale.percentage")}</p>
                          <p className="text-4xl font-black">{lossData.percent}%</p>
                        </div>
                      </div>
                      {lossData.percent > 5 && (
                        <p className="text-destructive text-sm font-medium text-center">{t("scale.highLossAlert")}</p>
                      )}
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("scale.fromSection")}</Label>
                          <Select value={fromSection} onValueChange={setFromSection}>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-primary font-bold">{t("scale.toSection")}</Label>
                          <Select value={toSection} onValueChange={setToSection}>
                            <SelectTrigger className="h-12 border-primary"><SelectValue placeholder={t("scale.selectDestination")} /></SelectTrigger>
                            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("scale.workerResponsible")}</Label>
                          <Select value={worker} onValueChange={setWorker}>
                            <SelectTrigger className="h-12"><SelectValue placeholder={t("scale.selectWorker")} /></SelectTrigger>
                            <SelectContent>{workers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("scale.machine")}</Label>
                          <Select value={machine} onValueChange={setMachine}>
                            <SelectTrigger className="h-12"><SelectValue placeholder={t("scale.selectMachine")} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t("scale.none")}</SelectItem>
                              {machines.filter(m => m.sectionId === toSection || !toSection).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("scale.notes")}</Label>
                        <Textarea className="min-h-[100px] resize-none" placeholder={t("scale.addRemarks")} value={notes} onChange={e => setNotes(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* STEP 5 */}
                  {step === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="bg-muted p-6 rounded-xl border space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">{t("scale.order")}</p>
                            <p className="font-mono text-xl font-bold">{scannedOrder?.orderCode}</p>
                          </div>
                          <Badge className="px-3 py-1 text-sm uppercase">{operation}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">{t("scale.from")}</p>
                            <p className="font-semibold">{sections.find(s => s.id === fromSection)?.name}</p>
                          </div>
                          <ArrowRight className="w-6 h-6 text-muted-foreground mx-4 rtl:rotate-180" />
                          <div className="flex-1 text-end">
                            <p className="text-sm text-muted-foreground">{t("scale.to")}</p>
                            <p className="font-semibold text-primary">{sections.find(s => s.id === toSection)?.name}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t pt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">{t("scale.worker")}</p>
                            <p className="font-medium">{workers.find(w => w.id === worker)?.name}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">{t("scale.weightDiff")}</p>
                            <p className="font-mono">{weightBefore}g → {weightAfter}g</p>
                          </div>
                          <div className="text-end">
                            <p className="text-xs text-muted-foreground">{t("scale.loss")}</p>
                            <p className={`font-mono font-bold ${lossData.percent > 5 ? 'text-destructive' : 'text-green-600'}`}>
                              {lossData.percent}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button size="lg" className="w-full h-16 text-lg font-bold" onClick={() => setConfirmOpen(true)}>
                        <Save className="w-5 h-5 me-2" />
                        {t("scale.confirmRecord")}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                    {t("scale.back")}
                  </Button>
                  {step > 1 && step < 5 && (
                    <Button onClick={() => setStep(s => Math.min(5, s + 1))} disabled={
                      (step === 2 && !operation) ||
                      (step === 3 && !weightAfter) ||
                      (step === 4 && (!toSection || !worker))
                    }>
                      {t("scale.nextStep")}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* RIGHT PANEL */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle>{t("scale.todayActivity")}</CardTitle>
            <Button variant="outline" size="sm" className="h-8"><RefreshCw className="w-4 h-4 me-2" /> {t("scale.refresh")}</Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t("scale.time")}</TableHead>
                  <TableHead>{t("scale.qr")}</TableHead>
                  <TableHead>{t("scale.route")}</TableHead>
                  <TableHead className="text-end">{t("scale.loss")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 10).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{m.qrCode}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{m.operationType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {sections.find(s=>s.id===m.fromSectionId)?.code} → {sections.find(s=>s.id===m.toSectionId)?.code}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs">
                      <span className={m.lossPercent > 5 ? "text-destructive font-bold" : m.lossPercent > 2 ? "text-yellow-600" : "text-green-600"}>
                        {m.lossPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.confirmRecord")}</AlertDialogTitle>
            <AlertDialogDescription>{t("orders.confirmQuestion")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("orders.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>{t("orders.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
