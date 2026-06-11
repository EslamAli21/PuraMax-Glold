// ============================================================
// صفحة الإعدادات — إعدادات النظام والتخصيص
// ============================================================
import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Save, Server, Shield, FileSpreadsheet, Upload, CheckCircle2, Settings2, Bell, Lock, Globe2, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const { factoryName } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done">("idle");

  const handleSave = () => {
    toast({ title: t("settings.saved"), description: t("settings.savedDesc") });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadStatus("uploading");
    setTimeout(() => setUploadStatus("done"), 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="factory" className="space-y-4">
        <TabsList className="h-auto bg-muted/50 flex-wrap p-1">
          <TabsTrigger value="factory" className="gap-2 text-xs font-semibold py-2">
            <Server className="w-3.5 h-3.5" /> {t("settings.tabFactory")}
          </TabsTrigger>
          <TabsTrigger value="excel" className="gap-2 text-xs font-semibold py-2">
            <FileSpreadsheet className="w-3.5 h-3.5" /> {t("settings.tabImport")}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2 text-xs font-semibold py-2">
            <Settings2 className="w-3.5 h-3.5" /> {t("settings.tabAdvanced")}
          </TabsTrigger>
        </TabsList>

        {/* ── FACTORY SETTINGS TAB ── */}
        <TabsContent value="factory" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Server className="w-4 h-4" /> {t("settings.factoryIdentity")}</CardTitle>
              <CardDescription>{t("settings.identityDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.factoryName")}</Label>
                  <Input defaultValue={factoryName || ""} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.registrationNumber")}</Label>
                  <Input defaultValue="CR-99201923" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.factoryAddress")}</Label>
                  <Input defaultValue="Industrial Zone, Block 5, Riyadh" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.contactEmail")}</Label>
                  <Input type="email" defaultValue="info@puramax.com" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.phone")}</Label>
                  <Input defaultValue="+966 50 000 0000" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.currency")}</Label>
                  <Select defaultValue="sar">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sar">{t("settings.currencySAR")}</SelectItem>
                      <SelectItem value="aed">{t("settings.currencyAED")}</SelectItem>
                      <SelectItem value="usd">{t("settings.currencyUSD")}</SelectItem>
                      <SelectItem value="eur">{t("settings.currencyEUR")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={handleSave}><Save className="w-4 h-4 me-2" /> {t("settings.saveIdentity")}</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4" /> {t("settings.systemRules")}</CardTitle>
              <CardDescription>{t("settings.rulesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: t("settings.strictLoss"), desc: t("settings.strictLossDesc"), defaultChecked: true },
                { label: t("settings.autoAlert"), desc: t("settings.autoAlertDesc"), defaultChecked: true },
                { label: t("settings.require2FA"), desc: t("settings.require2FADesc"), defaultChecked: false },
                { label: t("settings.dailyLossReport"), desc: t("settings.dailyLossReportDesc"), defaultChecked: true },
              ].map((rule, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm">{rule.label}</Label>
                    <p className="text-xs text-muted-foreground">{rule.desc}</p>
                  </div>
                  <Switch defaultChecked={rule.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Palette className="w-4 h-4" /> {t("settings.appearance")}</CardTitle>
              <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant={theme === "light" ? "default" : "outline"} className="gap-2 h-10" onClick={() => setTheme("light")}>
                  <Sun className="w-4 h-4" /> {t("settings.lightMode")}
                </Button>
                <Button variant={theme === "dark" ? "default" : "outline"} className="gap-2 h-10" onClick={() => setTheme("dark")}>
                  <Moon className="w-4 h-4" /> {t("settings.darkMode")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXCEL IMPORT TAB ── */}
        <TabsContent value="excel" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="w-4 h-4 text-green-500" /> {t("settings.importOldDataTitle")}</CardTitle>
              <CardDescription>{t("settings.importOldDataDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  t("settings.ordersHistory"), t("settings.movementsLog"), t("settings.workersList"),
                  t("settings.customerDb"), t("settings.materialStock"), t("settings.lossReports")
                ].map(type => (
                  <div key={type} className="border border-border/60 rounded-lg p-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                    <FileSpreadsheet className="w-5 h-5 text-green-500/60 group-hover:text-green-500 mb-2" />
                    <p className="text-sm font-medium">{type}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">.xlsx / .csv</p>
                  </div>
                ))}
              </div>

              <div
                className="border-2 border-dashed border-border/60 hover:border-primary/40 rounded-xl p-10 text-center transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                {uploadStatus === "done" ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <p className="font-semibold text-green-600">{t("settings.uploadSuccess")}</p>
                    <p className="text-sm text-muted-foreground">{uploadedFile?.name}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={e => { e.stopPropagation(); setUploadStatus("idle"); setUploadedFile(null); }}>
                      {t("settings.uploadAnother")}
                    </Button>
                  </div>
                ) : uploadStatus === "uploading" ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">{uploadedFile?.name}…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                    <p className="font-medium">{t("settings.clickUpload")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.uploadSupports")}</p>
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <p className="text-sm font-medium mb-2">📝 {t("settings.uploadNote")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t("settings.uploadNoteDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ADDITIONAL SETTINGS TAB ── */}
        <TabsContent value="advanced" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Bell className="w-4 h-4" /> {t("settings.notifications")}</CardTitle>
              <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: t("settings.highLossAlerts"), desc: t("settings.highLossDesc"), checked: true },
                { label: t("settings.orderOverdue"), desc: t("settings.orderOverdueDesc"), checked: true },
                // ── تم حذف خاصية "طلبات حسابات الموظفين الجدد" بناءً على طلب المستخدم ──
                // ── تم حذف خاصية "ملخص يومي" بناءً على طلب المستخدم ──
                { label: t("settings.sectionHandoff"), desc: t("settings.sectionHandoffDesc"), checked: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <div>
                    <Label className="text-sm">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── تم إخفاء بطاقة إعدادات الأمان من الواجهة بناءً على طلب المستخدم
               إعدادات الأمان تعمل في الخلفية لكنها لا تُعرض للمستخدم ── */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="w-4 h-4" /> {t("settings.localization")}</CardTitle>
              <CardDescription>{t("settings.localizationDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.defaultLang")}</Label>
                  <Select defaultValue="ar">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.dateFormat")}</Label>
                  <Select defaultValue="dmy">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.goldUnit")}</Label>
                  <Select defaultValue="gram">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gram">{t("settings.perGram")}</SelectItem>
                      <SelectItem value="oz">{t("settings.perOunce")}</SelectItem>
                      <SelectItem value="tola">{t("settings.perTola")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.weightPrecision")}</Label>
                  <Select defaultValue="3">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">{t("settings.dec2")}</SelectItem>
                      <SelectItem value="3">{t("settings.dec3")}</SelectItem>
                      <SelectItem value="4">{t("settings.dec4")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={handleSave}><Save className="w-4 h-4 me-2" /> {t("settings.savePreferences")}</Button>
            </CardFooter>
          </Card>

          <div className="text-center text-xs text-muted-foreground py-2">
            <p>{t("settings.version")}</p>
            <p>{t("settings.copyright")}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
