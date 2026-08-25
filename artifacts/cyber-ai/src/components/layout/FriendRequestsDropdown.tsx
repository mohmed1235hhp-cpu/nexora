import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { UserPlus, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { csrfHeaders } from "@/lib/csrf";
import { useSSE } from "@/hooks/useSSE";

type IncomingRequest = {
  id: number;
  createdAt: string;
  user: { id: number; username: string; displayName: string | null; avatarUrl: string | null };
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

export function FriendRequestsDropdown() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api<{ requests: IncomingRequest[] }>("/friend-request/incoming")
      .then((r) => setRequests(r.requests ?? []))
      .catch(() => {});
  };

  useEffect(load, []);

  // Live update when a new friend_request notification arrives over SSE.
  useSSE("/api/notifications/stream", {
    onMessage: (data: any) => {
      if (data?.type === "friend_request") load();
    },
  });

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const respond = async (senderId: number, action: "accept" | "reject") => {
    setRequests((prev) => prev.filter((r) => r.user.id !== senderId));
    try {
      await api(`/friend-request/${senderId}/${action}`, { method: "POST" });
    } catch {
      load(); // resync on failure
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="طلبات الصداقة"
      >
        <UserPlus className="w-5 h-5" />
        {requests.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {requests.length > 9 ? "9+" : requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">طلبات الصداقة</div>
          {requests.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد طلبات صداقة جديدة</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <Link href={`/profile/${req.user.username}`} onClick={() => setOpen(false)}>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={req.user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{req.user.displayName?.[0] ?? req.user.username[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${req.user.username}`} onClick={() => setOpen(false)}>
                      <p className="text-sm font-medium truncate hover:text-primary transition-colors">{req.user.displayName ?? req.user.username}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">@{req.user.username}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => respond(req.user.id, "accept")}
                      className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                      aria-label="قبول"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respond(req.user.id, "reject")}
                      className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="رفض"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
