// ============================================================
// صفحة تسجيل الدخول — Login Page (شاشة واحدة موحّدة)
// تم تحويل تصميم الشاشتين إلى شاشة دخول واحدة فقط:
//   - يُدخل المستخدم اسمه وكلمة المرور فقط
//   - يتعرف النظام تلقائياً على المصنع الذي ينتمي إليه الحساب
//   - لا يوجد اختيار مصنع مسبق أو خطوتان للدخول
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n/index";
import { User, Eye, EyeOff, KeyRound, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

// ─── أنواع الشاشات الفرعية ───────────────────────────────────────────────────
// "login"   — شاشة تسجيل الدخول الرئيسية (الشاشة الوحيدة للدخول)
// "forgot"  — شاشة استعادة كلمة المرور
// "register"— شاشة إنشاء حساب جديد
type Screen = "login" | "forgot" | "register";

export default function LoginPage() {
  // ─── خطافات التوجيه والسياق ───────────────────────────────────────────────
  const [, setLocation] = useLocation();
  // استيراد دالة التحقق الموحّد من سياق المصادقة
  const { login, loginWithCredentials } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  // ─── اختيار شعار الموقع حسب الوضع (فاتح/داكن) ───────────────────────────
  const isDark  = theme === "dark";
  const logoSrc = isDark ? "/puramax-gold.png" : "/puramax-white.png";

  // ─── حالة الشاشة الحالية ─────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("login");

  // ─── حالة نموذج تسجيل الدخول ─────────────────────────────────────────────
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [loginError,   setLoginError]   = useState("");
  const [showPass,     setShowPass]     = useState(false);
  // حالة "تذكرني" — محفوظة للاستخدام المستقبلي
  const [rememberMe,   setRememberMe]   = useState(false);

  // ─── حالة نموذج استعادة كلمة المرور ─────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent,  setForgotSent]  = useState(false);

  // ─── حالة نموذج إنشاء الحساب ─────────────────────────────────────────────
  const [reg, setReg] = useState({
    firstName: "", lastName: "", email: "",
    username: "", password: "", confirm: "", terms: false,
  });
  const [regError,        setRegError]        = useState("");
  const [regSuccess,      setRegSuccess]      = useState(false);
  const [showRegPass,     setShowRegPass]     = useState(false);
  const [captchaChecked,  setCaptchaChecked]  = useState(false);

  // ─── دالة مساعدة لتحديث حقول نموذج التسجيل ──────────────────────────────
  const setRegField = (k: keyof typeof reg, v: any) =>
    setReg(prev => ({ ...prev, [k]: v }));

  // ─── معالج تسجيل الدخول الموحّد ──────────────────────────────────────────
  // يبحث في جميع المصانع تلقائياً عن مستخدم يطابق الاسم وكلمة المرور
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // التحقق من أن الحقلين غير فارغَين
    if (!username.trim() || !password.trim()) {
      setLoginError(t("login.fillAllFields"));
      return;
    }

    // البحث عن المستخدم عبر جميع المصانع دون اختيار مسبق
    const user = loginWithCredentials(username.trim(), password);
    if (!user) {
      // لم يُعثر على مستخدم مطابق في أي مصنع
      setLoginError(t("login.invalidUser"));
      return;
    }

    // تسجيل الدخول مع اسم المصنع المُكتشف تلقائياً
    login(user.role, user.factoryName, user.username, user.displayName);
    // الانتقال إلى لوحة التحكم
    setLocation("/dashboard");
  };

  // ─── معالج استعادة كلمة المرور ───────────────────────────────────────────
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail.trim()) setForgotSent(true);
  };

  // ─── معالج إنشاء الحساب ──────────────────────────────────────────────────
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    // التحقق من الحقول المطلوبة
    if (!reg.firstName || !reg.lastName || !reg.email || !reg.username || !reg.password) {
      setRegError("Please fill in all required fields.");
      return;
    }
    // التحقق من تطابق كلمتَي المرور
    if (reg.password !== reg.confirm) {
      setRegError("Passwords do not match.");
      return;
    }
    // التحقق من الموافقة على الشروط
    if (!reg.terms) {
      setRegError("You must accept the terms and conditions.");
      return;
    }
    // التحقق من اختبار الروبوت
    if (!captchaChecked) {
      setRegError("Please verify you are not a robot.");
      return;
    }
    // نجاح: إظهار رسالة التأكيد
    setRegSuccess(true);
  };

  // ─── تبديل لغة الواجهة (عربي/إنجليزي) ───────────────────────────────────
  const toggleLang = () => {
    const next = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(next);
    applyDirection(next);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent/60 p-4">

      {/* ── زر تبديل اللغة في الزاوية العلوية ─────────────────────────────── */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline" size="sm" onClick={toggleLang}
          className="font-semibold border-sidebar-border text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent"
        >
          {i18n.language === "en" ? "عربي" : "English"}
        </Button>
      </div>

      {/* ── شعار التطبيق وعنوانه الفرعي ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <img src={logoSrc} alt="PuraMax" className="h-12 w-auto object-contain" />
        <span className="text-[10px] text-sidebar-foreground/40 uppercase tracking-[0.3em] font-semibold">
          Pro Tracking
        </span>
      </div>

      <Card className="w-full max-w-md bg-card/95 backdrop-blur shadow-2xl border-sidebar-border">

        {/* ══════════════════════════════════════════════════════════════════
            الشاشة الرئيسية: تسجيل الدخول بشاشة واحدة موحّدة
            لا يوجد اختيار مصنع — النظام يتعرف تلقائياً على المصنع
        ══════════════════════════════════════════════════════════════════ */}
        {screen === "login" && (
          <>
            <CardHeader className="text-center pb-5 pt-7">
              {/* أيقونة الدخول */}
              <div className="mx-auto w-14 h-14 bg-primary/15 border-2 border-primary/30 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(200,150,50,0.15)]">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              {/* عنوان ووصف صفحة الدخول */}
              <CardTitle className="text-xl font-bold">{t("login.userTitle")}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {t("login.userSubtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLoginSubmit} className="space-y-4">

                {/* حقل اسم المستخدم */}
                <div className="space-y-1.5">
                  <Label htmlFor="username">{t("login.username")}</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="admin"
                    className="h-10"
                    autoFocus
                    required
                  />
                </div>

                {/* حقل كلمة المرور مع رابط "نسيت كلمة المرور" */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("login.password")}</Label>
                    {/* رابط استعادة كلمة المرور */}
                    <button
                      type="button"
                      onClick={() => setScreen("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("login.forgotPassword")}
                    </button>
                  </div>
                  {/* حقل كلمة المرور مع زر الإظهار/الإخفاء */}
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 pr-10 rtl:pr-3 rtl:pl-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:right-auto rtl:left-3"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* تلميح بيانات الدخول التجريبية */}
                  <p className="text-[10px] text-muted-foreground">
                    {t("login.demoHint")}: admin / admin123
                  </p>
                </div>

                {/* خيار "تذكرني" */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={v => setRememberMe(!!v)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                {/* رسالة الخطأ عند فشل تسجيل الدخول */}
                {loginError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {loginError}
                  </p>
                )}

                {/* زر تسجيل الدخول */}
                <Button type="submit" className="w-full h-10 font-semibold">
                  {t("login.enterFactory")}
                </Button>

                {/* فاصل بصري */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* زر إنشاء حساب جديد */}
                <Button
                  type="button" variant="outline"
                  className="w-full h-10 gap-2"
                  onClick={() => setScreen("register")}
                >
                  <UserPlus className="w-4 h-4" /> Create Account
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            شاشة استعادة كلمة المرور
        ══════════════════════════════════════════════════════════════════ */}
        {screen === "forgot" && (
          <>
            <CardHeader className="text-center pb-5 pt-7">
              {/* أيقونة المفتاح لشاشة استعادة كلمة المرور */}
              <div className="mx-auto w-14 h-14 bg-primary/15 border-2 border-primary/30 rounded-2xl flex items-center justify-center mb-3">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
              <CardDescription className="text-sm mt-1">
                Enter your email to receive a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* رسالة النجاح بعد إرسال بريد الاستعادة */}
              {forgotSent ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="font-semibold">Email Sent!</p>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox for password reset instructions.
                  </p>
                  <Button
                    variant="outline" className="w-full"
                    onClick={() => { setScreen("login"); setForgotSent(false); setForgotEmail(""); }}
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                /* نموذج إدخال البريد الإلكتروني لاستعادة كلمة المرور */
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Email Address</Label>
                    <Input
                      type="email" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="you@example.com" className="h-10" required
                    />
                  </div>
                  <Button type="submit" className="w-full h-10 font-semibold">
                    Send Reset Link
                  </Button>
                  {/* زر العودة إلى شاشة الدخول */}
                  <Button
                    type="button" variant="ghost"
                    className="w-full h-8 text-muted-foreground text-sm"
                    onClick={() => setScreen("login")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                  </Button>
                </form>
              )}
            </CardContent>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            شاشة إنشاء حساب جديد
        ══════════════════════════════════════════════════════════════════ */}
        {screen === "register" && (
          <>
            <CardHeader className="text-center pb-5 pt-7">
              {/* أيقونة إضافة مستخدم لشاشة التسجيل */}
              <div className="mx-auto w-14 h-14 bg-primary/15 border-2 border-primary/30 rounded-2xl flex items-center justify-center mb-3">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Create Account</CardTitle>
              <CardDescription className="text-sm mt-1">
                Your account will be reviewed by the admin before access is granted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* رسالة النجاح بعد إرسال طلب التسجيل */}
              {regSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="font-semibold">Account Request Submitted!</p>
                  <p className="text-sm text-muted-foreground">
                    The administrator has been notified. Your account is under review
                    and you'll be contacted once approved.
                  </p>
                  <Button
                    variant="outline" className="w-full"
                    onClick={() => {
                      setScreen("login");
                      setRegSuccess(false);
                      setReg({ firstName:"",lastName:"",email:"",username:"",password:"",confirm:"",terms:false });
                      setCaptchaChecked(false);
                    }}
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                /* نموذج إنشاء الحساب */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* حقلا الاسم الأول والأخير */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name *</Label>
                      <Input value={reg.firstName} onChange={e => setRegField("firstName", e.target.value)} placeholder="Ali" className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name *</Label>
                      <Input value={reg.lastName} onChange={e => setRegField("lastName", e.target.value)} placeholder="Hassan" className="h-9" />
                    </div>
                  </div>
                  {/* حقل البريد الإلكتروني */}
                  <div className="space-y-1.5">
                    <Label>Email Address *</Label>
                    <Input type="email" value={reg.email} onChange={e => setRegField("email", e.target.value)} placeholder="ali@example.com" className="h-9" />
                  </div>
                  {/* حقل اسم المستخدم */}
                  <div className="space-y-1.5">
                    <Label>Username *</Label>
                    <Input value={reg.username} onChange={e => setRegField("username", e.target.value)} placeholder="ali.hassan" className="h-9" />
                  </div>
                  {/* حقل كلمة المرور مع إمكانية الإظهار */}
                  <div className="space-y-1.5">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input type={showRegPass ? "text" : "password"} value={reg.password} onChange={e => setRegField("password", e.target.value)} placeholder="Min 8 characters" className="h-9 pr-9 rtl:pr-3 rtl:pl-9" />
                      <button type="button" onClick={() => setShowRegPass(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:right-auto rtl:left-2.5">
                        {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {/* حقل تأكيد كلمة المرور */}
                  <div className="space-y-1.5">
                    <Label>Confirm Password *</Label>
                    <Input type="password" value={reg.confirm} onChange={e => setRegField("confirm", e.target.value)} placeholder="Repeat password" className="h-9" />
                  </div>
                  {/* اختبار CAPTCHA لمنع الروبوتات */}
                  <div className="border border-border rounded-md px-4 py-3 bg-muted/20 flex items-center gap-3">
                    <Checkbox id="captcha" checked={captchaChecked} onCheckedChange={v => setCaptchaChecked(!!v)} />
                    <Label htmlFor="captcha" className="text-sm font-normal cursor-pointer">I'm not a robot</Label>
                    <div className="ml-auto text-muted-foreground/40 text-[10px] text-right leading-tight">
                      <div className="font-bold text-xs">reCAPTCHA</div>
                      <div>Privacy · Terms</div>
                    </div>
                  </div>
                  {/* مربع الموافقة على الشروط والأحكام */}
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" checked={reg.terms} onCheckedChange={v => setRegField("terms", !!v)} className="mt-0.5" />
                    <Label htmlFor="terms" className="text-xs font-normal cursor-pointer leading-relaxed">
                      I agree to the <span className="text-primary underline">Terms of Service</span> and{" "}
                      <span className="text-primary underline">Privacy Policy</span>
                    </Label>
                  </div>
                  {/* رسالة الخطأ */}
                  {regError && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{regError}</p>
                  )}
                  {/* زر إرسال طلب التسجيل */}
                  <Button type="submit" className="w-full h-10 font-semibold">
                    Submit Account Request
                  </Button>
                  {/* زر العودة إلى شاشة الدخول */}
                  <Button
                    type="button" variant="ghost"
                    className="w-full h-8 text-muted-foreground text-sm"
                    onClick={() => setScreen("login")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                  </Button>
                </form>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* ── حقوق النشر ──────────────────────────────────────────────────────── */}
      <p className="mt-6 text-[10px] text-sidebar-foreground/30 text-center">
        PuraMax Pro Tracking · © 2025 All rights reserved
      </p>
    </div>
  );
}
