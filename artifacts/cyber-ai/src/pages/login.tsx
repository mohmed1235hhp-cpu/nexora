import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        login(res.token);
        toast({ title: "Welcome back!" });
        setLocation("/");
      },
      onError: (err: unknown) => {
        toast({ 
          title: "Login failed", 
          description: (err instanceof ApiError ? err.message : "Please check your credentials"), 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto mt-8 max-w-md" dir="rtl">
        <div className="rounded-[28px] border border-violet-500/20 bg-white/[.02] p-8 shadow-[0_0_60px_rgba(139,92,246,.12)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl font-black text-white shadow-[0_0_30px_rgba(139,92,246,.5)]">C</div>
            <h1 className="text-2xl font-black tracking-tight">أهلاً بعودتك</h1>
            <p className="mt-1 text-sm text-muted-foreground">سجّل الدخول إلى حساب Cyber AI الخاص بك</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
              <div className="mt-2 text-center"><a className="text-sm font-semibold text-violet-300 hover:text-violet-200" href="/forgot-password">نسيت كلمة المرور؟</a></div>
            </form>
          </Form>

          <div className="mt-6 border-t border-white/5 pt-5 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟ <a href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">أنشئ حسابًا جديدًا</a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
