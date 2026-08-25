import { useState, useCallback } from "react";
import { useSearch } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, User, Image, X } from "lucide-react";

const SUGGESTED_QUERIES = ["فن الذكاء الاصطناعي", "تطوير", "فيديو", "كتابة", "موسيقى", "بحث"];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [tab, setTab] = useState("all");

  const { data: results, isLoading } = useSearch(
    { q: activeQuery, type: tab === "all" ? undefined : (tab as any) },
    { query: { enabled: activeQuery.length >= 2, queryKey: ["search", activeQuery, tab] } }
  );

  const handleSearch = useCallback(
    (q: string = query) => {
      if (q.trim().length >= 2) setActiveQuery(q.trim());
    },
    [query]
  );

  const clearSearch = () => {
    setQuery("");
    setActiveQuery("");
  };

  const hasResults =
    (results?.users?.length ?? 0) + (results?.portfolio?.length ?? 0) > 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Hero Search */}
        <div className="flex flex-col items-center pt-6 pb-8 space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight mb-2">اكتشف Cyber AI</h1>
            <p className="text-muted-foreground">ابحث عن مبدعين وأعمال في عالم الذكاء الاصطناعي</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="w-full max-w-2xl flex gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.length >= 2) handleSearch(e.target.value);
                  else if (!e.target.value) setActiveQuery("");
                }}
                placeholder="ابحث عن مبدعين، أعمال، مهارات..."
                className="w-full pl-12 pr-10 h-14 rounded-full text-base bg-card border-border shadow-sm"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-14 px-8 rounded-full">بحث</Button>
          </form>

          {/* Suggestions */}
          {!activeQuery && (
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUERIES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSearch(s); }}
                  className="px-4 py-1.5 rounded-full bg-card border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {activeQuery && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                نتائج البحث عن{" "}
                <span className="text-primary">"{activeQuery}"</span>
              </h2>
              {hasResults && (
                <Badge variant="secondary">
                  {(results?.users?.length ?? 0) + (results?.portfolio?.length ?? 0)} نتيجة
                </Badge>
              )}
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <User className="w-3.5 h-3.5" /> مبدعون
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="gap-2">
                  <Image className="w-3.5 h-3.5" /> أعمال
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-10 mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : hasResults ? (
                  <>
                    {/* Creators */}
                    {(results?.users?.length ?? 0) > 0 && (
                      <section className="space-y-4">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" /> المبدعون
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {results!.users!.map((user) => (
                            <Link key={user.id} href={`/profile/${user.username}`}>
                              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group">
                                <Avatar className="w-12 h-12 border border-border">
                                  <AvatarImage src={user.avatarUrl ?? undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {user.displayName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                      {user.displayName}
                                    </h3>
                                    {user.isVerified && (
                                      <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white shrink-0">✓</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                                  {user.specialization && (
                                    <Badge variant="outline" className="text-[9px] mt-1 px-1.5 py-0">
                                      {user.specialization}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Portfolio */}
                    {(results?.portfolio?.length ?? 0) > 0 && (
                      <section className="space-y-4">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <Image className="w-4 h-4 text-primary" /> الأعمال
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {results!.portfolio!.map((item) => (
                            <PortfolioCard key={item.id} item={item} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-card border border-border rounded-2xl text-muted-foreground">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد نتائج لـ "{activeQuery}"</h3>
                    <p className="text-sm">جرّب كلمات مختلفة أو تحقق من الإملاء</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                ) : (results?.users?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {results!.users!.map((user) => (
                      <Link key={user.id} href={`/profile/${user.username}`}>
                        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold">{user.displayName}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">لا يوجد مبدعون بهذا الاسم</p>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
                  </div>
                ) : (results?.portfolio?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results!.portfolio!.map((item) => (
                      <PortfolioCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">لا توجد أعمال بهذا البحث</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
