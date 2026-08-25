/**
 * Phase 12 — Real-Time Notifications via SSE
 * Phase 11 — Smart Search with Suggestions
 */
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useGetSearchSuggestions } from "@workspace/api-client-react";
import { FriendRequestsDropdown } from "./FriendRequestsDropdown";

export function Navbar() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Search suggestions (Phase 11)
  const { data: suggestions } = useGetSearchSuggestions(searchQuery,
    { query: { enabled: searchQuery.length >= 1, queryKey: ["suggestions", searchQuery] } }
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  }, [searchQuery, navigate]);

  const handleSuggestionClick = (val: string, type: string) => {
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(val)}&type=${type}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-violet-500/15 bg-[#050812]/90 backdrop-blur-xl z-50 px-4 md:px-6 flex items-center justify-between gap-3">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 rounded-xl aql-gold-ring bg-gradient-to-br from-amber-400 via-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl">
              ع
            </div>
            <span className="text-xl font-black tracking-[.08em] hidden sm:block aql-gradient-text">CYBER AI</span>
          </div>
        </Link>
      </div>

      {/* Search (Phase 11) */}
      <div className="flex-1 max-w-md mx-2 hidden md:block relative">
        <form onSubmit={handleSearch}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300/60 pointer-events-none z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-10 rounded-full h-10"
            placeholder="ابحث عن مبدعين، أعمال، مهارات..."
          />
        </form>

        {/* Suggestions Dropdown (Phase 11) */}
        {showSuggestions && searchQuery.length >= 1 && suggestions?.suggestions?.length ? (
          <div className="absolute top-full mt-2 left-0 right-0 bg-[#0a0d1a] border border-violet-500/20 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,.15)] overflow-hidden z-50">
            {suggestions.suggestions.map((s: any, idx: number) => (
              <button
                key={idx}
                onMouseDown={() => handleSuggestionClick(s.value, s.type)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-violet-500/10 transition-colors text-left"
              >
                {s.type === "user" && s.avatarUrl ? (
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">{s.label?.[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center text-xs text-violet-200">
                    {s.type === "tag" ? "#" : s.type === "skill" ? "⚡" : "👤"}
                  </span>
                )}
                <span className="text-sm">{s.label}</span>
                <span className="ml-auto text-xs text-muted-foreground capitalize">{s.type}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {user ? (
          <>
            <Link href="/portfolio/new" className="hidden sm:block">
              <Button className="rounded-full px-5 h-9 text-sm">
                <Sparkles className="w-4 h-4 mr-1.5" />
                إنشاء
              </Button>
            </Link>

            <FriendRequestsDropdown />

            <Link href={`/profile/${user.username}`}>
              <Avatar className="w-9 h-9 border-2 border-violet-400/30 cursor-pointer hover:border-violet-400/60 transition-colors shadow-[0_0_14px_rgba(139,92,246,.25)]">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-violet-500/15 text-violet-200 font-semibold">
                  {user.displayName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full">دخول</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full">سجل الآن</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
