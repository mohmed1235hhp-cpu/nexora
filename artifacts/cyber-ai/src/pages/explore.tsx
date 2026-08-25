import { useState } from "react";
import { Link } from "wouter";
import { useGetTrending, useGetTopCreators, useGetCategories } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORY_COLORS: Record<string, string> = {
  "AI Art": "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "AI Development": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "AI Video": "from-red-500/20 to-orange-500/20 border-red-500/30",
  "AI Writing": "from-green-500/20 to-emerald-500/20 border-green-500/30",
  "AI Music": "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  "AI Research": "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
};

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: trending, isLoading: isLoadingTrending } = useGetTrending();
  const { data: topCreators, isLoading: isLoadingCreators } = useGetTopCreators();
  const { data: categories, isLoading: isLoadingCategories } = useGetCategories();

  const categoriesArray = Array.isArray(categories) ? categories : [];
  const trendingItems = trending?.items ?? [];
  const creators = topCreators?.users ?? [];

  return (
    <AppLayout>
      <div className="space-y-12 pb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">مستكشف</h1>
          <p className="text-muted-foreground">اكتشف أفضل المبدعين والفئات الرائجة في عالم الذكاء الاصطناعي.</p>
        </div>

        {/* Categories */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">الفئات</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {isLoadingCategories ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : (
              categoriesArray.map((cat) => {
                const colorClass = CATEGORY_COLORS[cat.name] ?? "from-primary/20 to-primary/10 border-primary/30";
                const isActive = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? null : (cat.slug ?? null))}
                    className={`rounded-xl border bg-gradient-to-br p-4 text-left transition-all hover:scale-105 ${colorClass} ${isActive ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="text-sm font-semibold">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{cat.count} عمل</div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Top Creators */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">أفضل المبدعين</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {isLoadingCreators ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
            ) : (
              creators.map((creator: any) => (
                <Link key={creator.id} href={`/profile/${creator.username}`}>
                  <Card className="cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all text-center group">
                    <CardContent className="pt-6 pb-4 flex flex-col items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/60 transition-colors">
                          <AvatarImage src={creator.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                            {creator.displayName?.[0] ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        {creator.isVerified && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">✓</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-1">{creator.displayName}</h3>
                        <p className="text-xs text-muted-foreground">@{creator.username}</p>
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 justify-center">
                          المستوى {creator.level ?? 1}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Trending Portfolio */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">الأعمال الرائجة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoadingTrending ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="w-full aspect-video rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : trendingItems.length ? (
              trendingItems.map((item: any) =>
                item.portfolioItem ? <PortfolioCard key={item.id} item={item.portfolioItem} /> : null
              )
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <p className="text-4xl mb-4">🎨</p>
                <p className="text-lg font-medium">لا توجد أعمال رائجة بعد</p>
                <p className="text-sm mt-1">كن أول من ينشر عمله!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
