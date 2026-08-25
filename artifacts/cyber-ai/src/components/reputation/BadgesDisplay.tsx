import { useGetUserReputation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Award, TrendingUp, Zap, Activity } from "lucide-react";

interface BadgeItem {
  id: number;
  name: string;
  description: string;
  iconUrl?: string | null;
  earnedAt: string;
}

interface BadgesDisplayProps {
  userId: number;
  badges?: BadgeItem[];
  compact?: boolean;
}

const LEVEL_INFO: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "مبتدئ", color: "text-gray-400", bg: "from-gray-500/20 to-gray-400/10" },
  2: { label: "متعلم", color: "text-blue-400", bg: "from-blue-500/20 to-blue-400/10" },
  3: { label: "محترف", color: "text-green-400", bg: "from-green-500/20 to-green-400/10" },
  4: { label: "خبير", color: "text-purple-400", bg: "from-purple-500/20 to-purple-400/10" },
  5: { label: "أسطورة", color: "text-yellow-400", bg: "from-yellow-500/20 to-amber-400/10" },
};

export function BadgesDisplay({ userId, badges = [], compact = false }: BadgesDisplayProps) {
  const { data: reputation, isLoading } = useGetUserReputation(userId, {
    query: { enabled: !!userId, queryKey: ["reputation", userId] },
  });

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {badges.slice(0, 4).map((b) => (
          <span
            key={b.id}
            title={b.description}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-semibold border border-primary/20"
          >
            {b.iconUrl ? (
              <img src={b.iconUrl} alt={b.name} className="w-3 h-3" />
            ) : (
              <Award className="w-3 h-3" />
            )}
            {b.name}
          </span>
        ))}
        {badges.length > 4 && (
          <span className="text-[10px] text-muted-foreground px-2 py-0.5">
            +{badges.length - 4}
          </span>
        )}
      </div>
    );
  }

  const levelData = LEVEL_INFO[reputation?.level ?? 1] ?? LEVEL_INFO[1];
  const maxScore = 5000;
  const pct = Math.min(((reputation?.score ?? 0) / maxScore) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Reputation Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> السمعة والمستوى
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : reputation ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-lg">{(reputation.score ?? 0).toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">نقطة</span>
                  </div>
                  <p className={`text-sm font-medium mt-0.5 ${levelData.color}`}>
                    {levelData.label}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${levelData.bg} border border-primary/30 flex items-center justify-center`}>
                    <Star className="w-5 h-5 text-primary fill-primary/60" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">المستوى {reputation.level ?? 1}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Rank */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-3.5 h-3.5" />
                <span>الترتيب #{reputation.rank ?? "—"}</span>
                {reputation.levelName && (
                  <span className="text-primary font-medium">• {reputation.levelName}</span>
                )}
              </div>

              {/* Breakdown */}
              {reputation.breakdown && (
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  <div className="bg-muted/40 rounded-lg p-2 text-center">
                    <div className="font-bold text-foreground">{reputation.breakdown.qualityScore ?? 0}</div>
                    <div>جودة</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2 text-center">
                    <div className="font-bold text-foreground">{reputation.breakdown.collaborationScore ?? 0}</div>
                    <div>تعاون</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2 text-center">
                    <div className="font-bold text-foreground">{reputation.breakdown.activityScore ?? 0}</div>
                    <div>نشاط</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2 text-center">
                    <div className="font-bold text-foreground">{reputation.breakdown.profileScore ?? 0}</div>
                    <div>ملف</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد بيانات سمعة</p>
          )}
        </CardContent>
      </Card>

      {/* Badges Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> الشارات ({badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Award className="w-8 h-8 opacity-20" />
              <p>لا توجد شارات بعد</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.description}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl cursor-default hover:border-primary/50 transition-colors"
                >
                  {badge.iconUrl ? (
                    <img src={badge.iconUrl} alt={badge.name} className="w-5 h-5" />
                  ) : (
                    <Award className="w-4 h-4 text-primary" />
                  )}
                  <div>
                    <p className="text-xs font-semibold leading-none">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(badge.earnedAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
