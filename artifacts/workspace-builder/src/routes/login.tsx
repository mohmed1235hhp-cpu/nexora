import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell, useLang } from "@/components/workspace/AppShell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [{ title: "Login — AQL" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { login, register, loginError, registerError, isLoginPending, isRegisterPending } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const pending = mode === "login" ? isLoginPending : isRegisterPending;
  const error = mode === "login" ? loginError : registerError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ username, email, password, displayName: displayName || username });
      }
      navigate({ to: redirect || "/" });
    } catch {
      // error state is already surfaced via loginError / registerError
    }
  }

  return (
    <AppShell>
      <div dir={ar ? "rtl" : "ltr"} className="min-h-[70vh] flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl aql-gradient-text">
              {mode === "login"
                ? ar ? "تسجيل الدخول" : "Sign in"
                : ar ? "إنشاء حساب" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? ar ? "أدخل بياناتك للمتابعة إلى مساحة العمل" : "Enter your details to continue to your workspace"
                : ar ? "انضم إلى AQL وابدأ ببناء أفكارك" : "Join AQL and start building your ideas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "register" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="username">{ar ? "اسم المستخدم" : "Username"}</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              )}
              {mode === "register" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="displayName">{ar ? "الاسم المعروض" : "Display name"}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">{ar ? "كلمة المرور" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" variant="glow" size="lg" disabled={pending} className="mt-2">
                {pending
                  ? ar ? "جارٍ المتابعة..." : "Please wait..."
                  : mode === "login"
                    ? ar ? "دخول" : "Sign in"
                    : ar ? "إنشاء الحساب" : "Create account"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
            >
              {mode === "login"
                ? ar ? "ليس لديك حساب؟ أنشئ واحدًا" : "No account? Create one"
                : ar ? "لديك حساب بالفعل؟ سجّل الدخول" : "Already have an account? Sign in"}
            </button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
