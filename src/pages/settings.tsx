import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Save, Server, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { factoryName } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSave = () => {
    toast({ title: t("settings.saved"), description: t("settings.savedDesc") });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5"/> {t("settings.factoryIdentity")}</CardTitle>
            <CardDescription>{t("settings.identityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label>{t("settings.factoryName")}</Label>
              <Input defaultValue={factoryName || ""} />
            </div>
            <div className="space-y-2 max-w-md">
              <Label>{t("settings.registrationNumber")}</Label>
              <Input defaultValue="CR-99201923" />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-6 py-4">
            <Button onClick={handleSave}><Save className="w-4 h-4 me-2" /> {t("settings.saveIdentity")}</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5"/> {t("settings.systemRules")}</CardTitle>
            <CardDescription>{t("settings.rulesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{t("settings.strictLoss")}</Label>
                <p className="text-sm text-muted-foreground">{t("settings.strictLossDesc")}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{t("settings.autoAlert")}</Label>
                <p className="text-sm text-muted-foreground">{t("settings.autoAlertDesc")}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance")}</CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="w-32 h-20 flex flex-col gap-2"
                onClick={() => setTheme("light")}
              >
                <Sun className="w-6 h-6" />
                {t("settings.lightMode")}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="w-32 h-20 flex flex-col gap-2"
                onClick={() => setTheme("dark")}
              >
                <Moon className="w-6 h-6" />
                {t("settings.darkMode")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-8">
          <p>{t("settings.version")}</p>
          <p className="mt-1">{t("settings.copyright")}</p>
        </div>
      </div>
    </div>
  );
}
