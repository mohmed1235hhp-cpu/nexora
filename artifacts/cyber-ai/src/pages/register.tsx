import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  displayName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().max(32).optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const referralFromUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase() || ""
    : "";

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", displayName: "", email: "", password: "", referralCode: referralFromUrl },
  });

  const registerMutation = useRegister();

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data, {
      onSuccess: (res) => {
        login(res.token);
        toast({ title: "Account created successfully!" });
        setLocation("/");
      },
      onError: (err: unknown) => {
        toast({ 
          title: "Registration failed", 
          description: (err instanceof ApiError ? err.message : "Please check your details"), 
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
            <h1 className="text-2xl font-black tracking-tight">أنشئ حسابك</h1>
            <p className="mt-1 text-sm text-muted-foreground">ابنِ مساحة عملك الخاصة مع Cyber AI</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الظاهر</FormLabel>
                    <FormControl>
                      <Input placeholder="محمد أحمد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كود الدعوة (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل كود صديقك" {...field} />
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
              <Button type="submit" className="w-full h-11" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 border-t border-white/5 pt-5 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟ <a href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">سجّل الدخول</a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
