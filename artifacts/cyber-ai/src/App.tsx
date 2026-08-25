import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Skeleton } from "@/components/ui/skeleton";

// Eager-loaded (critical path)
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Lazy-loaded (Code Splitting — Phase 15)
const Explore = lazy(() => import("@/pages/explore"));
const CreatePortfolio = lazy(() => import("@/pages/create-portfolio"));
const PortfolioDetail = lazy(() => import("@/pages/portfolio-detail"));
const Search = lazy(() => import("@/pages/search"));
const Settings = lazy(() => import("@/pages/settings"));
const Admin = lazy(() => import("@/pages/admin"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Voice = lazy(() => import("@/pages/tools/Voice"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Billing = lazy(() => import("@/pages/billing"));
const AdminPayments = lazy(() => import("@/pages/admin-payments"));
const CyberCore = lazy(() => import("@/pages/cyber-core"));
const ChatHistory = lazy(() => import("@/pages/chat-history"));
const AppInfo = lazy(() => import("@/pages/app-info"));
const About = lazy(() => import("@/pages/about"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const AppMessages = lazy(() => import("@/pages/messages"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const Developer = lazy(() => import("@/pages/developer"));
const Referrals = lazy(() => import("@/pages/referrals"));
const Profile = lazy(() => import("@/pages/profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,         // 30s — Phase 15: cache
      gcTime: 5 * 60_000,        // 5min garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex flex-col gap-4 p-8 pt-24 max-w-4xl mx-auto">
      <Skeleton className="h-10 w-60" />
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/developer" component={Developer} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/explore" component={Explore} />
        <Route path="/voice" component={Voice} />
        <Route path="/portfolio/new" component={CreatePortfolio} />
        <Route path="/portfolio/:id" component={PortfolioDetail} />
        <Route path="/profile/:username" component={Profile} />
        <Route path="/search" component={Search} />
        <Route path="/settings" component={Settings} />
        <Route path="/cyber-core" component={CyberCore} />
        <Route path="/chat-history" component={ChatHistory} />
        <Route path="/app-info" component={AppInfo} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/messages" component={AppMessages} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/billing" component={Billing} />
        <Route component={NotFound} />

      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
