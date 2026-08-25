import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { BadgesDisplay } from "@/components/reputation/BadgesDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { csrfHeaders } from "@/lib/csrf";
import { UserPlus, UserCheck, UserX, Ban, MessageCircle, Loader2 } from "lucide-react";

type Profile = {
  id: number; username: string; displayName: string | null; avatarUrl: string | null; coverUrl: string | null;
  bio: string | null; specialization: string | null; country: string | null; website: string | null;
  github: string | null; linkedin: string | null; level: number; reputationScore: number;
  isVerified: boolean; isOfficial: boolean;
  followersCount: number | null; followingCount: number; friendsCount: number; portfolioCount: number;
  badges: { id: number; name: string; description: string; iconUrl?: string | null; earnedAt: string }[];
  isFollowing: boolean; isFriend: boolean; friendRequestStatus: string | null; isBlocked: boolean;
  createdAt: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isSafe = method === "GET" || method === "HEAD";
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(isSafe ? {} : csrfHeaders()), ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `${path} → ${res.status}`);
  return body as T;
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { user: me } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api<Profile>(`/users/${encodeURIComponent(username)}`)
      .then(setProfile)
      .catch((e) => toast({ title: "تعذر تحميل البروفايل", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
    api<{ items: any[] }>(`/portfolio/users/${encodeURIComponent(username)}`)
      .then((r) => setPortfolio(r.items ?? []))
      .catch(() => {});
  };

  useEffect(load, [username]);

  const isSelf = me?.username === username;

  const toggleFollow = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      if (profile.isFollowing) {
        await api(`/follow/${profile.id}`, { method: "DELETE" });
        setProfile({ ...profile, isFollowing: false, followersCount: (profile.followersCount ?? 1) - 1 });
      } else {
        await api(`/follow/${profile.id}`, { method: "POST" });
        setProfile({ ...profile, isFollowing: true, followersCount: (profile.followersCount ?? 0) + 1 });
      }
    } catch (e) {
      toast({ title: "حدث خطأ", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      await api(`/friend-request/${profile.id}`, { method: "POST" });
      setProfile({ ...profile, friendRequestStatus: "pending" });
      toast({ title: "تم إرسال طلب الصداقة" });
    } catch (e) {
      toast({ title: "حدث خطأ", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      await api(`/friend-request/${profile.id}`, { method: "DELETE" });
      setProfile({ ...profile, friendRequestStatus: null, isFriend: false });
    } catch (e) {
      toast({ title: "حدث خطأ", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      if (profile.isBlocked) {
        await api(`/block/${profile.id}`, { method: "DELETE" });
        setProfile({ ...profile, isBlocked: false });
        toast({ title: "تم إلغاء الحظر" });
      } else {
        await api(`/block/${profile.id}`, { method: "POST" });
        setProfile({ ...profile, isBlocked: true, isFollowing: false, isFriend: false, friendRequestStatus: null });
        toast({ title: "تم حظر المستخدم" });
      }
    } catch (e) {
      toast({ title: "حدث خطأ", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto pt-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-6 w-40" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto pt-16 text-center text-muted-foreground">المستخدم غير موجود</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-16" dir="rtl">
        {profile.coverUrl && (
          <div className="h-40 w-full rounded-2xl overflow-hidden mb-[-3rem]">
            <img src={profile.coverUrl} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 pt-6">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
              {profile.displayName?.[0] ?? profile.username[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black">{profile.displayName ?? profile.username}</h1>
              {profile.isVerified && (
                <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">✓</span>
              )}
              {profile.isOfficial && <Badge variant="secondary">حساب رسمي</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            {profile.specialization && <Badge variant="outline" className="mt-2">{profile.specialization}</Badge>}
          </div>

          {!isSelf && (
            <div className="flex items-center gap-2 flex-wrap">
              {!profile.isBlocked && (
                <>
                  <Button onClick={toggleFollow} disabled={busy} variant={profile.isFollowing ? "outline" : "default"}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : profile.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {profile.isFollowing ? "متابَع" : "متابعة"}
                  </Button>

                  {profile.isFriend ? (
                    <Button onClick={cancelFriendRequest} disabled={busy} variant="outline">إلغاء الصداقة</Button>
                  ) : profile.friendRequestStatus === "pending" ? (
                    <Button onClick={cancelFriendRequest} disabled={busy} variant="outline">إلغاء طلب الصداقة</Button>
                  ) : (
                    <Button onClick={sendFriendRequest} disabled={busy} variant="outline">طلب صداقة</Button>
                  )}

                  <Link href="/messages">
                    <Button variant="ghost" size="icon"><MessageCircle className="w-4 h-4" /></Button>
                  </Link>
                </>
              )}
              <Button onClick={toggleBlock} disabled={busy} variant="ghost" size="icon" title={profile.isBlocked ? "إلغاء الحظر" : "حظر"}>
                {profile.isBlocked ? <UserX className="w-4 h-4 text-destructive" /> : <Ban className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>

        {profile.bio && <p className="mt-4 text-sm whitespace-pre-line">{profile.bio}</p>}

        <div className="flex items-center gap-6 mt-4 text-sm">
          <div><span className="font-bold">{profile.portfolioCount}</span> <span className="text-muted-foreground">عمل</span></div>
          {profile.followersCount !== null && (
            <div><span className="font-bold">{profile.followersCount}</span> <span className="text-muted-foreground">متابع</span></div>
          )}
          <div><span className="font-bold">{profile.followingCount}</span> <span className="text-muted-foreground">يتابع</span></div>
          <div><span className="font-bold">{profile.friendsCount}</span> <span className="text-muted-foreground">صديق</span></div>
        </div>

        <div className="mt-6">
          <BadgesDisplay userId={profile.id} badges={profile.badges} />
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4">الأعمال</h2>
          {portfolio.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد أعمال بعد</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((item) => <PortfolioCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
