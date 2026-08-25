import { useGetCredits } from "@/lib/credits-api";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Zap, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export function CreditsWidget({ className }: { className?: string }) {
  const { data: credits, isLoading } = useGetCredits({
    query: {
      retry: false,
    }
  });

  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!credits?.resetAt) return;
    
    const updateCountdown = () => {
      const resetTime = new Date(credits.resetAt).getTime();
      const now = new Date().getTime();
      const diff = resetTime - now;

      if (diff <= 0) {
        setTimeLeft("الآن");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}س ${minutes}د`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [credits?.resetAt]);

  if (isLoading || !credits) {
    return (
      <div className={cn("p-4 rounded-xl bg-card border flex flex-col gap-3 animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
    );
  }

  const percentage = Math.max(0, Math.min(100, (credits.balance / credits.maxDaily) * 100));

  return (
    <div className={cn("p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5 fill-primary" />
          <span className="font-bold text-lg">{credits.balance} / {credits.maxDaily}</span>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
          رصيد مجاني
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden" dir="ltr">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
        <span>المتبقي</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>تجديد بعد {timeLeft}</span>
        </div>
      </div>
    </div>
  );
}
