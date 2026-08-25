import { useGetCredits, useUseCredits } from "@/lib/credits-api";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Clock, Loader2, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export function useCreditsManager(toolCost: number) {
  const { data: credits, isLoading, refetch } = useGetCredits({
    query: { refetchOnWindowFocus: false, retry: false }
  });
  const useCreditsMutation = useUseCredits();
  
  const hasEnoughCredits = credits ? credits.balance >= toolCost : false;

  const consumeCredits = async (toolName: string, toolLabel: string, prompt?: string) => {
    try {
      await useCreditsMutation.mutateAsync({
        data: { toolName, toolLabel, creditsUsed: toolCost, prompt }
      });
      // Invalidate queries to update widget instantly
      refetch();
      return true;
    } catch (e) {
      console.error("Failed to use credits", e);
      return false;
    }
  };

  return {
    credits,
    isLoading,
    hasEnoughCredits,
    consumeCredits,
    isConsuming: useCreditsMutation.isPending
  };
}

export function OutOfCreditsScreen() {
  const { data: credits } = useGetCredits();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!credits?.resetAt) return;
    const interval = setInterval(() => {
      const diff = new Date(credits.resetAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("الآن");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}س ${minutes}د`);
    }, 1000);
    return () => clearInterval(interval);
  }, [credits?.resetAt]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6 border-8 border-destructive/20">
        <Zap className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-bold mb-4">انتهى رصيدك اليومي</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        لقد استهلكت جميع رصيدك المجاني (100 رصيد) لهذا اليوم. يمكنك العودة غداً للحصول على رصيد جديد ومواصلة الإبداع.
      </p>
      
      <div className="flex items-center gap-3 p-4 bg-muted rounded-xl mb-8 border">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <div className="text-right">
          <div className="text-sm font-medium">يتجدد الرصيد بعد</div>
          <div className="font-bold text-xl text-primary" dir="ltr">{timeLeft}</div>
        </div>
      </div>

      <Link href="/">
        <Button variant="outline" size="lg" className="gap-2">
          <ArrowRight className="w-5 h-5" />
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
