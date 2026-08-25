/**
 * Phase 19 — Complete Admin Dashboard
 * Roles: Super Admin, Admin, Moderator, Support
 */
import { useState } from "react";
import {
  useGetAdminStats, useAdminListUsers, useGetAnalyticsAdmin,
  useAdminGetReports, useAdminGetAuditLogs, useAdminBanUser,
  useAdminUnbanUser, useAdminUpdateRole
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, FileImage, AlertTriangle, Activity, Shield, TrendingUp,
  Search, Ban, CheckCircle2, Clock, FileText, BarChart2, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const ROLE_COLORS: Record<string, string> = {
  user: "secondary",
  admin: "default",
  moderator: "outline",
  support: "outline",
};

export default function Admin() {
  const { toast } = useToast();
  const [userSearch, setUserSearch] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: analytics } = useGetAnalyticsAdmin({ period: analyticsPeriod });
  const { data: usersData, isLoading: usersLoading } = useAdminListUsers(
    { q: userSearch || undefined },
    { query: { queryKey: ["admin-users", userSearch] } }
  );
  const { data: reportsData } = useAdminGetReports();
  const { data: auditData } = useAdminGetAuditLogs();

  const banMutation = useAdminBanUser();
  const unbanMutation = useAdminUnbanUser();
  const roleMutation = useAdminUpdateRole();

  const handleBan = (userId: number, username: string) => {
    banMutation.mutate({ userId }, {
      onSuccess: () => toast({ title: `تم حظر ${username}` }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleUnban = (userId: number, username: string) => {
    unbanMutation.mutate({ userId }, {
      onSuccess: () => toast({ title: `تم رفع الحظر عن ${username}` }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleRoleChange = (userId: number, role: string) => {
    roleMutation.mutate({ userId, data: { role } }, {
      onSuccess: () => toast({ title: `تم تحديث الدور` }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const statCards = [
    { label: "إجمالي المستخدمين", value: stats?.totalUsers ?? 0, sub: `+${stats?.newUsersToday ?? 0} اليوم`, icon: Users, color: "text-blue-500" },
    { label: "الأعمال المنشورة", value: stats?.totalPortfolio ?? 0, sub: "", icon: FileImage, color: "text-green-500" },
    { label: "نشط اليوم", value: stats?.activeUsersToday ?? 0, sub: "", icon: Activity, color: "text-purple-500" },
    { label: "بلاغات معلقة", value: stats?.pendingReports ?? 0, sub: "", icon: AlertTriangle, color: "text-red-500" },
    { label: "محظورون", value: stats?.bannedUsers ?? 0, sub: "", icon: Ban, color: "text-orange-500" },
    { label: "جدد هذا الأسبوع", value: stats?.newUsersThisWeek ?? 0, sub: "", icon: TrendingUp, color: "text-teal-500" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              لوحة الإدارة
            </h1>
            <p className="text-muted-foreground mt-1">نظرة شاملة على المنصة وأدوات الإدارة</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 أيام</SelectItem>
                <SelectItem value="30d">30 يوماً</SelectItem>
                <SelectItem value="90d">90 يوماً</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{stat.label}</CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color} shrink-0`} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? <Skeleton className="h-7 w-16" /> : (
                  <>
                    <div className="text-xl font-bold">{stat.value.toLocaleString()}</div>
                    {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-4 mb-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="reports">البلاغات</TabsTrigger>
            <TabsTrigger value="audit">سجل الأحداث</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">نمو المستخدمين</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.dailyData ?? []}>
                      <defs>
                        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Area type="monotone" dataKey="users" name="مستخدم" stroke="hsl(var(--primary))" fill="url(#usersGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">الأعمال والتفاعل</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.dailyData?.slice(-14) ?? []}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="portfolio" name="أعمال" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Platform Summary */}
            {(analytics as any)?.summary && (
              <Card>
                <CardHeader><CardTitle className="text-base">ملخص المنصة</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: "DAU", value: (analytics as any).summary.dau },
                      { label: "WAU", value: (analytics as any).summary.wau },
                      { label: "MAU", value: (analytics as any).summary.mau },
                      { label: "معدل التفاعل", value: (analytics as any).summary?.engagementRate },
                      { label: "مدة الجلسة", value: (analytics as any).summary.avgSessionDuration },
                      { label: "معدل الاحتفاظ", value: (analytics as any).summary.retention30d },
                      { label: "محظورون", value: (analytics as any).summary.bannedUsers },
                      { label: "موثوقون", value: (analytics as any).summary.verifiedUsers },
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-xl font-bold">{item.value?.toLocaleString?.() ?? item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Categories */}
            {(analytics as any)?.topCategories && (analytics as any).topCategories.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">أكثر الفئات نشاطاً</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(analytics as any).topCategories.map((cat: { name: string; count: number }, idx: number) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="w-6 text-xs text-muted-foreground text-center">{idx + 1}</div>
                        <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(cat.count / ((analytics as any).topCategories[0]?.count ?? 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-24">{cat.name}</span>
                        <span className="text-sm text-muted-foreground w-10 text-right">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث عن مستخدم..."
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))
                  ) : usersData?.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{user.displayName}</span>
                          {user.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                          {user.isBanned && <Ban className="w-4 h-4 text-red-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={user.role ?? "user"}
                          onValueChange={(role) => handleRoleChange(user.id, role)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">مستخدم</SelectItem>
                            <SelectItem value="support">دعم</SelectItem>
                            <SelectItem value="moderator">مشرف</SelectItem>
                            <SelectItem value="admin">مدير</SelectItem>
                          </SelectContent>
                        </Select>

                        {user.isBanned ? (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => handleUnban(user.id, user.username)}
                            disabled={unbanMutation.isPending}
                            className="h-8 text-xs"
                          >
                            رفع الحظر
                          </Button>
                        ) : (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => handleBan(user.id, user.username)}
                            disabled={banMutation.isPending}
                            className="h-8 text-xs text-red-600 hover:text-red-700"
                          >
                            حظر
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="space-y-3">
              {reportsData?.reports?.length ? reportsData.reports.map((report: any) => (
                <Card key={report.id} className={`border-l-4 ${report.status === "pending" ? "border-l-red-500" : "border-l-green-500"}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <Badge variant="outline" className="text-red-600 border-red-300 capitalize">
                            {report.reason?.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant={report.status === "pending" ? "destructive" : "secondary"} className="capitalize">
                            {report.status === "pending" ? "معلق" : report.status === "resolved" ? "محلول" : report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{report.description || "لا يوجد وصف"}</p>
                        <p className="text-xs text-muted-foreground">
                          الهدف: {report.targetType} #{report.targetId} — {new Date(report.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">لا توجد بلاغات معلقة</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <div className="space-y-2">
              {auditData?.logs?.length ? auditData.logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{log.action}</span>
                      {log.resourceType && (
                        <Badge variant="outline" className="text-xs">{log.resourceType} #{log.resourceId}</Badge>
                      )}
                    </div>
                    {log.user && (
                      <p className="text-xs text-muted-foreground mt-1">بواسطة: {log.user.displayName} (@{log.user.username})</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleDateString("ar-SA")}</span>
                </div>
              )) : (
                <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">لا توجد أحداث مسجلة</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
