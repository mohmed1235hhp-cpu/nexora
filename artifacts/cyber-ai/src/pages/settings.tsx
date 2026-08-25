/**
 * Phase 13 — Privacy Full Control
 * Phase 14 — Security: Block, Mute, Report
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useUpdateProfile, useGetProfile, useGetPrivacySettings,
  useUpdatePrivacySettings, useGetMediaConfig, useGetMutedUsers
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, Lock, BellOff, User, Camera, Link2, Globe, Moon, Sun, MessageCircleQuestion, FileText, Info, MessageCircle } from "lucide-react";

const profileSchema = z.object({
  displayName: z.string().min(2, "الاسم يجب أن يكون أطول من حرفين").max(50),
  bio: z.string().max(500).optional(),
  specialization: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  website: z.string().url("رابط غير صحيح").optional().or(z.literal("")),
  github: z.string().max(100).optional(),
  linkedin: z.string().max(100).optional(),
});

export default function Settings() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: privacySettings } = useGetPrivacySettings();
  const { data: mediaConfig } = useGetMediaConfig();
  const { data: mutedData } = useGetMutedUsers();

  const updateProfileMutation = useUpdateProfile();
  const updatePrivacyMutation = useUpdatePrivacySettings();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: profile?.displayName ?? "",
      bio: profile?.bio ?? "",
      specialization: profile?.specialization ?? "",
      country: profile?.country ?? "",
      language: profile?.language ?? "",
      website: profile?.website ?? "",
      github: profile?.github ?? "",
      linkedin: profile?.linkedin ?? "",
    },
  });

  const onSubmitProfile = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => toast({ title: "✅ تم تحديث الملف الشخصي" }),
      onError: () => toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" }),
    });
  };

  const handlePrivacyChange = (key: string, value: boolean | string) => {
    updatePrivacyMutation.mutate({ [key]: value }, {
      onSuccess: () => toast({ title: "✅ تم تحديث إعدادات الخصوصية" }),
    });
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight">الإعدادات</h1>
          <p className="text-muted-foreground mt-1">إدارة حسابك وخصوصيتك وأمانك</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs md:text-sm">
              <User className="w-4 h-4" />الملف
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Eye className="w-4 h-4" />الخصوصية
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Shield className="w-4 h-4" />الأمان
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Camera className="w-4 h-4" />الوسائط
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Info className="w-4 h-4" />عن التطبيق
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>تعديل الملف الشخصي</CardTitle>
                <CardDescription>المعلومات الظاهرة للمستخدمين الآخرين في صفحتك العامة</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="displayName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الظاهر *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="specialization" render={({ field }) => (
                        <FormItem>
                          <FormLabel>التخصص</FormLabel>
                          <FormControl><Input {...field} placeholder="مثال: مصمم جرافيك، مطور" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem>
                          <FormLabel>الدولة</FormLabel>
                          <FormControl><Input {...field} placeholder="مثال: السعودية، مصر" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="language" render={({ field }) => (
                        <FormItem>
                          <FormLabel>اللغة المفضلة</FormLabel>
                          <FormControl><Input {...field} placeholder="مثال: العربية، English" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>نبذة شخصية</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="اكتب نبذة قصيرة عنك..." className="min-h-24 resize-none" />
                        </FormControl>
                        <FormDescription>{(field.value?.length ?? 0)}/500</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Separator className="my-4" />
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Link2 className="w-4 h-4" />الروابط الاجتماعية</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="website" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />الموقع</FormLabel>
                          <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="github" render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub</FormLabel>
                          <FormControl><Input {...field} placeholder="username" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="linkedin" render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl><Input {...field} placeholder="username" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending} className="px-8">
                        {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab (Phase 13) */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />إعدادات الرؤية</CardTitle>
                <CardDescription>تحكم في من يمكنه رؤية معلوماتك وملفك الشخصي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key: "profileVisibility", label: "ظهور الملف الشخصي", desc: "من يمكنه رؤية صفحتك الشخصية", type: "select", options: [{ v: "public", l: "الجميع" }, { v: "friends", l: "الأصدقاء فقط" }, { v: "private", l: "أنا فقط" }] },
                  { key: "portfolioVisibility", label: "ظهور الأعمال", desc: "من يمكنه رؤية أعمالك في المعرض", type: "select", options: [{ v: "public", l: "الجميع" }, { v: "friends", l: "الأصدقاء فقط" }, { v: "private", l: "أنا فقط" }] },
                ].map(({ key, label, desc, type, options }) => (
                  <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Select
                      defaultValue={privacySettings?.[key as keyof typeof privacySettings] as string ?? "public"}
                      onValueChange={(v) => handlePrivacyChange(key, v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.map(opt => <SelectItem key={opt.v} value={opt.v}>{opt.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <Separator />

                {[
                  { key: "showOnlineStatus", label: "إظهار حالة الاتصال", desc: "يظهر للآخرين إذا كنت متصلاً" },
                  { key: "showLastSeen", label: "إظهار آخر ظهور", desc: "يظهر للآخرين وقت آخر زيارة لك" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={privacySettings?.[key as keyof typeof privacySettings] as boolean ?? true}
                      onCheckedChange={(checked) => handlePrivacyChange(key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab (Phase 14) */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />الكتم والحماية</CardTitle>
                <CardDescription>قائمة المستخدمين المكتومين — لن يظهر محتواهم في فيدك</CardDescription>
              </CardHeader>
              <CardContent>
                {mutedData?.mutedIds?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">لديك {mutedData.mutedIds.length} مستخدم مكتوم</p>
                    <div className="flex flex-wrap gap-2">
                      {mutedData.mutedIds.map((id: number) => (
                        <Badge key={id} variant="outline">مستخدم #{id}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellOff className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا يوجد مستخدمون مكتومون</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2"><Lock className="w-5 h-5" />المنطقة الخطرة</CardTitle>
                <CardDescription>هذه الإجراءات غير قابلة للتراجع</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">حذف الحساب</p>
                    <p className="text-xs text-muted-foreground">سيتم حذف جميع بياناتك نهائياً</p>
                  </div>
                  <Button variant="destructive" size="sm" disabled>احذف الحساب</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab (Phase 16) */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" />إعدادات الوسائط</CardTitle>
                <CardDescription>الحدود والأنواع المسموحة للرفع</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mediaConfig ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/30">
                        <p className="text-sm font-medium mb-2">الصور</p>
                        <p className="text-xs text-muted-foreground">الحجم الأقصى: {Math.round((mediaConfig as any).maxImageSizeBytes / 1024 / 1024)}MB</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(mediaConfig as any).supportedFormats?.images?.map((f: string) => (
                            <Badge key={f} variant="outline" className="text-xs">.{f}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30">
                        <p className="text-sm font-medium mb-2">الفيديو</p>
                        <p className="text-xs text-muted-foreground">الحجم الأقصى: {Math.round((mediaConfig as any).maxVideoSizeBytes / 1024 / 1024)}MB</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(mediaConfig as any).supportedFormats?.videos?.map((f: string) => (
                            <Badge key={f} variant="outline" className="text-xs">.{f}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-1">نصائح تحسين الصور</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>استخدم صيغة WebP لتقليل الحجم بنسبة 25-35%</li>
                        <li>الحد الأقصى للأبعاد: 2048px</li>
                        <li>احذف بيانات EXIF للخصوصية</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-1">نصائح تحسين الفيديو</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>كودك H.264 للتوافق الأوسع</li>
                        <li>دقة 720p للويب، 1080p حد أقصى</li>
                        <li>معدل البيانات: 4Mbps كحد أقصى</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* About / Appearance / Support Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  المظهر
                </CardTitle>
                <CardDescription>اختر الوضع الذي يناسب عينيك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">الوضع الليلي</p>
                    <p className="text-xs text-muted-foreground">
                      {theme === "dark" ? "مفعّل حالياً" : "الوضع النهاري مفعّل حالياً"}
                    </p>
                  </div>
                  <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" />من نحن</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  منصة عربية تجمع أدوات الذكاء الاصطناعي في مكان واحد هادئ ومنظم، مع مساحة لعرض
                  أعمالك والتواصل مع مبدعين آخرين في مجتمع داعم.
                </p>
                <p>
                  هدفنا تبسيط استخدام الذكاء الاصطناعي بالعربية، بدون تعقيد وبدون إزعاج — تكتب فكرتك
                  فقط، والباقي علينا.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />سياسة الخصوصية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>نحترم خصوصيتك، وهذه أهم النقاط:</p>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>بياناتك الشخصية (الاسم، البريد، الصور) تُستخدم فقط لتشغيل حسابك وخدماتك داخل التطبيق.</li>
                  <li>لا نبيع بياناتك لأي طرف ثالث.</li>
                  <li>يمكنك التحكم بمن يرى ملفك الشخصي وأعمالك وقصصك من تبويب "الخصوصية".</li>
                  <li>يمكنك طلب حذف حسابك وبياناتك بالكامل في أي وقت.</li>
                  <li>المحادثات والمحتوى الذي تنشئه محفوظ بأمان ومرتبط بحسابك فقط.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageCircleQuestion className="w-5 h-5" />أهم الأسئلة</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="q1">
                    <AccordionTrigger className="text-sm">كيف أنشئ صورة أو موقع أو تطبيق؟</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      اكتب طلبك بشكل طبيعي في المحادثة الرئيسية، وسيفهم المساعد قصدك تلقائياً ويرد
                      بالنتيجة المناسبة — صورة، كود موقع، أو كود تطبيق.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q2">
                    <AccordionTrigger className="text-sm">لماذا يوجد رصيد يومي؟</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      الرصيد اليومي يضمن استخدام عادل للجميع، ويتجدد تلقائياً كل 24 ساعة.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q3">
                    <AccordionTrigger className="text-sm">كيف أتحكم في من يرى ملفي الشخصي؟</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      من تبويب "الخصوصية" أعلاه، يمكنك تحديد من يرى ملفك وأعمالك وقصصك ومن يمكنه مراسلتك.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q4">
                    <AccordionTrigger className="text-sm">كيف أحذف حسابي؟</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      تواصل معنا عبر واتساب أدناه وسنساعدك في حذف حسابك وبياناتك بالكامل.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" />تواجه مشكلة؟</CardTitle>
                <CardDescription>تواصل معنا مباشرة وسنساعدك</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://wa.me/201500664324"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  تواصل معنا على واتساب
                </a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
