import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n/index";

const ROLES: Role[] = [
  "Owner",
  "Production Manager",
  "Designer",
  "3D Printer",
  "Tree Responsible",
  "Scale Operator",
  "Section Manager",
  "Worker"
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();

  const [factoryName, setFactoryName] = useState("Al-Rashid Factory");
  const [role, setRole] = useState<Role>("Owner");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (factoryName && role) {
      login(role, factoryName);
      setLocation("/dashboard");
    }
  };

  const toggleLang = () => {
    const next = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(next);
    applyDirection(next);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sidebar to-sidebar-accent/80 p-4">
      <div className="absolute top-4 right-4">
        <Button variant="outline" size="sm" onClick={toggleLang} className="font-semibold border-sidebar-border text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent">
          {i18n.language === "en" ? "عربي" : "English"}
        </Button>
      </div>
      <Card className="w-full max-w-md bg-card/95 backdrop-blur shadow-2xl border-sidebar-border">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto w-20 h-20 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(200,150,50,0.2)]">
            <span className="text-3xl font-bold text-primary tracking-tighter">GF</span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{t("login.title")}</CardTitle>
          <CardDescription className="text-base mt-2">{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="factoryName">{t("login.factoryName")}</Label>
              <Input
                id="factoryName"
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t("login.role")}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("login.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>{t(`roles.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg">
              {t("login.enterFactory")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
