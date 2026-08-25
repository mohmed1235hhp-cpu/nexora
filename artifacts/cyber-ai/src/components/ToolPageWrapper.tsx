import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutOfCreditsScreen, useCreditsManager } from "@/hooks/use-credits-manager";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ToolPageWrapperProps {
  toolId: string;
  children: ReactNode;
}

export function ToolPageWrapper({ toolId, children }: ToolPageWrapperProps) {
  const tool = TOOLS.find(t => t.id === toolId);
  const { isLoading, hasEnoughCredits } = useCreditsManager(tool?.cost || 0);

  if (!tool) return <div>أداة غير موجودة</div>;

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (!hasEnoughCredits) {
    return <OutOfCreditsScreen />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
              <tool.icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tool.labelAr}</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>{tool.category}</span>
                <span>•</span>
                <span className="text-primary font-medium">{tool.cost} رصيد</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}

export function CopyButton({ text, className }: { text: string, className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
      className={cn("gap-2", copied && "text-green-500 border-green-500 bg-green-500/10", className)}
    >
      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "تم النسخ" : "نسخ النص"}
    </Button>
  );
}
