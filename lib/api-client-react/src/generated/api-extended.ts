/**
 * Cyber AI — Extended API Client
 * Hand-written React Query hooks for all platform endpoints
 * Auto-generated orval hooks are in api.ts (health check only)
 * 
 * All hooks return `{ data, isLoading, isError, error, refetch }` from React Query
 * Mutations return `{ mutate, mutateAsync, isPending, isError }`
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";

// ─── Type Exports ────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  skills: string[];
  aiTools: string[];
  specialization: string | null;
  country: string | null;
  language: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  level: number;
  reputationScore: number;
  isVerified: boolean;
  isOfficial: boolean;
  isFeaturedCreator: boolean;
  followersCount: number | null;
  followingCount: number;
  friendsCount: number;
  portfolioCount: number;
  likesCount: number;
  viewsCount: number;
  badges: Badge[];
  isFollowing: boolean;
  isFriend: boolean;
  friendRequestStatus: string | null;
  isBlocked: boolean;
  presence: { userId: number; status: string; lastSeen: string | null };
  createdAt: string;
  isBanned?: boolean;
  role?: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string;
  earnedAt: string | null;
}

export interface PortfolioItem {
  id: number;
  userId: number;
  author: User | null;
  title: string;
  description: string | null;
  type: "image" | "website" | "app" | "video" | "article";
  url: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  category: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  rating: number;
  isPinned: boolean;
  isPublic: boolean;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface Comment {
  id: number;
  userId: number;
  portfolioItemId: number;
  parentId: number | null;
  content: string;
  likesCount: number;
  author: User | null;
  createdAt: string;
}





export interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  resourceId: number | null;
  resourceType: string | null;
  actor: User | null;
  createdAt: string;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  sender: User | null;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPortfolio: number;
  totalReports: number;
  pendingReports: number;
  bannedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
}

export interface Report {
  id: number;
  reporterId: number;
  targetType: string;
  targetId: number;
  reason: string;
  description: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  resourceType: string | null;
  resourceId: number | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  period: string;
  portfolioViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  profileViews: number;
  followersGained: number;
  topItems: PortfolioItem[];
  dailyData: Array<{ date: string; views: number; likes: number; comments: number }>;
}

export interface AiConversation {
  id: number;
  userId: number;
  title: string;
  model: string;
  provider: string;
  totalTokens: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: number;
  conversationId: number;
  userId: number;
  role: string;
  content: string;
  model: string;
  provider: string;
  tokensUsed: number;
  costUsd: number;
  rating: number | null;
  feedback: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

export interface AiQuota {
  dailyQuota: number;
  used: number;
  remaining: number;
  resetAt: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const useGetMe = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["me"],
    queryFn: () => customFetch<User>("/api/auth/me"),
    ...options?.query,
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      customFetch<{ user: User; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useRegister = () =>
  useMutation({
    mutationFn: (data: { username: string; email: string; password: string; displayName: string }) =>
      customFetch<{ user: User; token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      customFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => qc.clear(),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      customFetch<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
  });

// ─── Profile ─────────────────────────────────────────────────────────────────

export const useGetProfile = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["profile"],
    queryFn: () => customFetch<User>("/api/profile"),
    ...options?.query,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { skills?: string[]; aiTools?: string[] }) =>
      customFetch<User>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useGetUserProfile = (username: string, options?: { query?: object }) =>
  useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => customFetch<User>(`/api/users/${username}`),
    enabled: !!username,
    ...options?.query,
  });

export const useListUsers = (params?: { q?: string; page?: number; limit?: number }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["users", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.q) q.set("q", params.q);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return customFetch<{ users: User[]; total: number; page: number }>(`/api/users?${q}`);
    },
    ...options?.query,
  });

// ─── Portfolio ───────────────────────────────────────────────────────────────

export const useGetPortfolio = (params?: { page?: number; limit?: number; category?: string }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["portfolio", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.category) q.set("category", params.category);
      return customFetch<{ items: PortfolioItem[]; total: number; page: number; limit: number }>(`/api/portfolio?${q}`);
    },
    ...options?.query,
  });

export const useGetPortfolioItem = (id: number, options?: { query?: object }) =>
  useQuery({
    queryKey: ["portfolioItem", id],
    queryFn: () => customFetch<PortfolioItem>(`/api/portfolio/${id}`),
    enabled: !!id,
    ...options?.query,
  });

export const useListUserPortfolioItems = (username: string, params?: { page?: number; category?: string }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["userPortfolio", username, params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.category) q.set("category", params.category);
      return customFetch<{ items: PortfolioItem[]; total: number; page: number; limit: number }>(`/api/portfolio/user/${username}?${q}`);
    },
    enabled: !!username,
    ...options?.query,
  });

export const useCreatePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PortfolioItem> & { title: string; type: string }) =>
      customFetch<PortfolioItem>("/api/portfolio", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useUpdatePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PortfolioItem> }) =>
      customFetch<PortfolioItem>(`/api/portfolio/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
};

export const useDeletePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ message: string }>(`/api/portfolio/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
};

export const useLikePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ message: string }>(`/api/portfolio/${id}/like`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolioItem"] }),
  });
};

export const useSavePortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ message: string }>(`/api/portfolio/${id}/save`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["portfolioItem"] });
    },
  });
};

export const usePinPortfolioItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ message: string }>(`/api/portfolio/${id}/pin`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
};

// ─── Comments ────────────────────────────────────────────────────────────────

export const useListItemComments = (portfolioItemId: number, params?: object, options?: { query?: object }) =>
  useQuery({
    queryKey: ["comments", portfolioItemId],
    queryFn: () => customFetch<{ comments: Comment[]; total: number }>(`/api/portfolio/${portfolioItemId}/comments`),
    enabled: !!portfolioItemId,
    ...options?.query,
  });

export const useAddPortfolioComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ portfolioItemId, content, parentId }: { portfolioItemId: number; content: string; parentId?: number }) =>
      customFetch<Comment>(`/api/portfolio/${portfolioItemId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content, parentId }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["comments", vars.portfolioItemId] }),
  });
};

// ─── Follow ──────────────────────────────────────────────────────────────────

export const useFollowUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/follow/${userId}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUnfollowUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/follow/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useGetFollowers = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["followers"],
    queryFn: () => customFetch<{ users: User[]; total: number }>("/api/followers"),
    ...options?.query,
  });

export const useGetFollowing = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["following"],
    queryFn: () => customFetch<{ users: User[]; total: number }>("/api/following"),
    ...options?.query,
  });

// ─── Friends ─────────────────────────────────────────────────────────────────

export const useGetFriends = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["friends"],
    queryFn: () => customFetch<{ users: User[]; total: number }>("/api/friends"),
    ...options?.query,
  });

export const useGetFriendRequests = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => customFetch<{ requests: FriendRequest[]; total: number }>("/api/friends/requests"),
    ...options?.query,
  });

export const useSendFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/friends/request/${userId}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      customFetch<{ message: string }>(`/api/friends/accept/${requestId}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
};

export const useRejectFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      customFetch<{ message: string }>(`/api/friends/reject/${requestId}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friendRequests"] }),
  });
};

export const useCancelFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      customFetch<{ message: string }>(`/api/friends/cancel/${requestId}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friendRequests"] }),
  });
};

export const useRemoveFriend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/friends/remove/${userId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });
};




// ─── Search ──────────────────────────────────────────────────────────────────

export const useSearch = (params: { q: string; type?: string; page?: number }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["search", params],
    queryFn: () => {
      const q = new URLSearchParams({ q: params.q });
      if (params.type) q.set("type", params.type);
      if (params.page) q.set("page", String(params.page));
      return customFetch<{ users: User[]; portfolio: PortfolioItem[]; total: number }>(`/api/search?${q}`);
    },
    enabled: !!params.q && params.q.length > 1,
    ...options?.query,
  });


// ─── Privacy ─────────────────────────────────────────────────────────────────

export const useGetPrivacySettings = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["privacy"],
    queryFn: () => customFetch<{
      profileVisibility: string;
      portfolioVisibility: string;
      storiesVisibility: string;
      showOnlineStatus: boolean;
      showLastSeen: boolean;
      allowFriendRequests: boolean;
      allowMessages: string;
      showFriendsList: boolean;
    }>("/api/profile/privacy"),
    ...options?.query,
  });

export const useUpdatePrivacySettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) =>
      customFetch<object>("/api/profile/privacy", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["privacy"] }),
  });
};

// ─── Security ────────────────────────────────────────────────────────────────

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/block/${userId}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
};

export const useUnblockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/block/${userId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
};

export const useMuteUser = () =>
  useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/mute/${userId}`, { method: "POST" }),
  });

export const useUnmuteUser = () =>
  useMutation({
    mutationFn: (userId: number) =>
      customFetch<{ message: string }>(`/api/mute/${userId}`, { method: "DELETE" }),
  });

export const useGetMutedUsers = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["mutedUsers"],
    queryFn: () => customFetch<{ mutedIds: number[] }>("/api/mute"),
    ...options?.query,
  });

export const useReportContent = () =>
  useMutation({
    mutationFn: (data: { targetType: string; targetId: number; reason: string; description?: string }) =>
      customFetch<{ message: string }>("/api/report", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
  });

// ─── Media ───────────────────────────────────────────────────────────────────

export const useGetMediaConfig = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["mediaConfig"],
    queryFn: () => customFetch<object>("/api/media/config"),
    staleTime: Infinity,
    ...options?.query,
  });

export const useValidateMedia = () =>
  useMutation({
    mutationFn: (data: { contentType: string; sizeBytes: number; filename: string }) =>
      customFetch<{ valid: boolean; mediaType?: string; error?: string }>("/api/media/validate", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
  });

// ─── Reputation ───────────────────────────────────────────────────────────────

export const useGetReputation = (userId?: number, options?: { query?: object }) =>
  useQuery({
    queryKey: ["reputation", userId],
    queryFn: () => customFetch<{ userId: number; score: number; level: number; levelName: string; stars: number; badges: Badge[]; rank: number; breakdown: { qualityScore?: number; collaborationScore?: number; activityScore?: number; profileScore?: number } }>(
      userId ? `/api/reputation/${userId}` : "/api/reputation"
    ),
    ...options?.query,
  });

// ─── Analytics ───────────────────────────────────────────────────────────────

export const useGetAnalyticsOverview = (params?: { period?: string }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["analytics", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.period) q.set("period", params.period);
      return customFetch<AnalyticsOverview>(`/api/analytics?${q}`);
    },
    ...options?.query,
  });

export const useGetAnalyticsAdmin = (params?: { period?: string }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["analyticsAdmin", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.period) q.set("period", params.period);
      return customFetch<any>(`/api/analytics/admin?${q}`);
    },
    ...options?.query,
  });

// ─── Admin ───────────────────────────────────────────────────────────────────

export const useGetAdminStats = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["adminStats"],
    queryFn: () => customFetch<AdminStats>("/api/admin/stats"),
    ...options?.query,
  });

export const useAdminListUsers = (params?: { q?: string; page?: number }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["adminUsers", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.q) q.set("q", params.q);
      if (params?.page) q.set("page", String(params.page));
      return customFetch<{ users: User[]; total: number; page: number; limit: number }>(`/api/admin/users?${q}`);
    },
    ...options?.query,
  });

export const useAdminBanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason?: string }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
};

export const useAdminUnbanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: number }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/unban`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
};

export const useAdminUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: { role: string } }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
};

export const useAdminGetReports = (params?: { status?: string; page?: number }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["adminReports", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.page) q.set("page", String(params.page));
      return customFetch<{ reports: Report[]; total: number; page: number }>(`/api/admin/reports?${q}`);
    },
    ...options?.query,
  });

export const useAdminResolveReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNote }: { id: number; status: string; adminNote?: string }) =>
      customFetch<{ message: string }>(`/api/admin/reports/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNote }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminReports"] }),
  });
};

export const useAdminGetAuditLogs = (params?: { page?: number }, options?: { query?: object }) =>
  useQuery({
    queryKey: ["adminAuditLogs", params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      return customFetch<{ logs: AuditLog[]; total: number; page: number; limit: number }>(`/api/admin/audit-logs?${q}`);
    },
    ...options?.query,
  });

// ─── AI Governance ───────────────────────────────────────────────────────────

export const useGetAiQuota = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["aiQuota"],
    queryFn: () => customFetch<AiQuota>("/api/ai/quota"),
    ...options?.query,
  });

export const useGetAiConversations = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["aiConversations"],
    queryFn: () => customFetch<{ conversations: AiConversation[]; total: number }>("/api/ai/conversations"),
    ...options?.query,
  });

export const useCreateAiConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; model?: string; provider?: string }) =>
      customFetch<AiConversation>("/api/ai/conversations", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiConversations"] }),
  });
};

export const useGetAiMessages = (conversationId: number, options?: { query?: object }) =>
  useQuery({
    queryKey: ["aiMessages", conversationId],
    queryFn: () => customFetch<{ messages: AiMessage[]; conversationId: number }>(`/api/ai/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    ...options?.query,
  });

export const useSendAiMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, role }: { conversationId: number; content: string; role?: string }) =>
      customFetch<AiMessage>(`/api/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, role }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["aiMessages", vars.conversationId] }),
  });
};

export const useRateAiMessage = () =>
  useMutation({
    mutationFn: ({ messageId, rating, feedback }: { messageId: number; rating: number; feedback?: string }) =>
      customFetch<{ message: string }>(`/api/ai/feedback/${messageId}`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useDeleteAiConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ message: string }>(`/api/ai/conversations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiConversations"] }),
  });
};

// ─── Saved Portfolio ─────────────────────────────────────────────────────────

export const useGetSavedItems = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["savedItems"],
    queryFn: () => customFetch<{ items: PortfolioItem[]; total: number }>("/api/saved"),
    ...options?.query,
  });

// ─── Presence ────────────────────────────────────────────────────────────────

export const useUpdatePresence = () =>
  useMutation({
    mutationFn: (status: "online" | "offline" | "away") =>
      customFetch<{ message: string }>("/api/profile/presence", {
        method: "POST",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useGetPresence = (userId: number, options?: { query?: object }) =>
  useQuery({
    queryKey: ["presence", userId],
    queryFn: () => customFetch<{ userId: number; status: string; lastSeen: string | null }>(`/api/profile/presence/${userId}`),
    enabled: !!userId,
    refetchInterval: 60_000,
    ...options?.query,
  });

// ─── Discover / Categories (Phase 5 additions) ───────────────────────────────
// These hooks were added post-generation to match the ai-cyberai explore/create
// screens. Types are intentionally permissive to unblock the FE build; the
// backing endpoints already exist under /api/portfolio/trending, /api/users/top,
// and /api/categories.

export interface Category { id: number; name: string; slug?: string; icon?: string | null; count?: number }

export const useGetTrending = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["trending"],
    queryFn: () => customFetch<{ items: PortfolioItem[]; total: number }>("/api/portfolio/trending"),
    ...options?.query,
  });

export const useGetTopCreators = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["topCreators"],
    queryFn: () => customFetch<{ users: User[]; total: number }>("/api/users/top"),
    ...options?.query,
  });

export const useGetCategories = (options?: { query?: object }) =>
  useQuery({
    queryKey: ["categories"],
    queryFn: () => customFetch<Category[]>("/api/categories"),
    ...options?.query,
  });

// ─── Phase 5 additions: unread count + search suggestions + user reputation alias

export const useGetSearchSuggestions = (q: string, options?: { query?: object }) =>
  useQuery({
    queryKey: ["searchSuggestions", q],
    queryFn: () => customFetch<{ suggestions: string[] }>(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
    enabled: !!q,
    ...options?.query,
  });


export const useGetUserReputation = useGetReputation;


// These call the real provider-backed routes in artifacts/api-server/src/routes/ai.ts
// (Groq for chat, Together.ai for images, Anthropic Claude for website/app).

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AssistantResult {
  intent: "chat" | "image" | "website" | "app" | "video";
  content: string;
  creditsUsed: number;
}

export const useAiAssistant = () =>
  useMutation({
    mutationFn: (vars: { data: { messages: ChatMessage[] } }) =>
      customFetch<AssistantResult>("/api/ai/assistant", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useAiChat = () =>
  useMutation({
    mutationFn: (vars: { data: { messages: ChatMessage[] } }) =>
      customFetch<{ content: string; model: string; creditsUsed: number }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useAiGenerateImage = () =>
  useMutation({
    mutationFn: (vars: { data: { prompt: string; width?: number; height?: number } }) =>
      customFetch<{ imageUrl: string; creditsUsed: number }>("/api/ai/image", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useAiEditImage = () =>
  useMutation({
    mutationFn: (vars: { data: { prompt: string; imageUrl: string } }) =>
      customFetch<{ imageUrl: string; creditsUsed: number }>("/api/ai/image/edit", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useAiWebsite = () =>
  useMutation({
    mutationFn: (vars: { data: { description: string; style?: string; sections?: string } }) =>
      customFetch<{ result: string; creditsUsed: number }>("/api/ai/website", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });

export const useAiApp = () =>
  useMutation({
    mutationFn: (vars: { data: { description: string; framework?: string; features?: string } }) =>
      customFetch<{ result: string; creditsUsed: number }>("/api/ai/app", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });

// Always rejects today (503) — no free/reliable video provider is wired yet.
// See artifacts/api-server/src/lib/providers.ts videoGenerate().
export const useAiVideo = () =>
  useMutation({
    mutationFn: (vars: { data: { prompt: string; durationSeconds?: number } }) =>
      customFetch<never>("/api/ai/video", {
        method: "POST",
        body: JSON.stringify(vars.data),
        headers: { "Content-Type": "application/json" },
      }),
  });
