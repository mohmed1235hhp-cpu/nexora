/**
 * Phase 18 — Personal Analytics Dashboard
 */
import { useState } from "react";
import { useGetAnalyticsOverview } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Eye, Heart, MessageCircle, TrendingUp, Image, BarChart2 } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

const periodLabels: Record<string, string> = {
  "7d": "7 أيام",
  "30d": "30 يوماً",
  "90d": "90 يوماً",
};

export default function Analytics() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data, isLoading } = useGetAnalyticsOverview(
    { period },
    { query: { queryKey: ["analytics", period] } }
  );

  const statCards = [
    { label: "إجمالي الأعمال", value: (data as any)?.overview?.totalPortfolio ?? 0, icon: Image, color: "text-blue-500" },
    { label: "إجمالي المشاهدات", value: (data as any)?.overview?.totalViews ?? 0, icon: Eye, color: "text-green-500" },
    { label: "إجمالي الإعجابات", value: (data as any)?.overview?.totalLikes ?? 0, icon: Heart, color: "text-red-500" },
    { label: "إجمالي التعليقات", value: (data as any)?.overview?.totalComments ?? 0, icon: MessageCircle, color: "text-purple-500" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <BarChart2 className="w-8 h-8 text-primary" />
              إحصائيات أعمالي
            </h1>
            <p className="text-muted-foreground mt-1">تحليل أداء أعمالك وتفاعل الجمهور معها</p>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="7d">7 أيام</TabsTrigger>
              <TabsTrigger value="30d">30 يوماً</TabsTrigger>
              <TabsTrigger value="90d">90 يوماً</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value.toLocaleString("ar-SA")}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Rate */}
        {!isLoading && (data as any)?.overview?.engagementRate && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-center gap-4">
              <TrendingUp className="w-10 h-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">معدل التفاعل</p>
                <p className="text-3xl font-bold text-primary">{(data as any).overview.engagementRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">نسبة الإعجابات إلى المشاهدات</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views over time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">المشاهدات عبر الزمن</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.dailyData ?? []}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Likes & Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">الإعجابات والتعليقات</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.dailyData ?? []}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="likes" name="إعجابات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comments" name="تعليقات" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Works */}
        {!isLoading && data?.topItems && data.topItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أفضل الأعمال أداءً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <Badge variant="outline" className="text-xs mt-1">{item.type}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{item.viewsCount}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{item.likesCount}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{item.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && (!data?.topItems || data.topItems.length === 0) && (
          <Card className="text-center py-16">
            <CardContent className="flex flex-col items-center gap-3">
              <BarChart2 className="w-12 h-12 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-muted-foreground">لا توجد بيانات بعد</p>
              <p className="text-sm text-muted-foreground">انشر أعمالك لتبدأ في رؤية الإحصائيات</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
