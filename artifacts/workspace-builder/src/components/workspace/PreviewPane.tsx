import { useState } from "react";
import { ExternalLink, Maximize2, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";

type Device = "desktop" | "tablet" | "mobile";

interface Props {
  src: string | null;
  loading?: boolean;
  ar?: boolean;
}

const widths: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-[768px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

export function PreviewPane({ src, loading = false, ar = false }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [key, setKey] = useState(0);

  const open = () => {
    if (!src) return;
    window.open(src, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="min-h-[560px] rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
      <header dir={ar ? "rtl" : "ltr"} className="h-14 shrink-0 px-4 border-b border-border/60 flex items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium">{ar ? "المعاينة المباشرة" : "Live Preview"}</span>
          {loading && <span className="text-xs text-muted-foreground">{ar ? "جاري التحديث..." : "Updating..."}</span>}
        </div>
        <div className="ms-auto flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as Device[]).map((item) => {
            const Icon = item === "desktop" ? Monitor : item === "tablet" ? Tablet : Smartphone;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setDevice(item)}
                className={`h-8 w-8 rounded-lg grid place-items-center transition ${device === item ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70"}`}
                title={item}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <button type="button" onClick={() => setKey((v) => v + 1)} disabled={!src} className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-secondary disabled:opacity-30" title={ar ? "تحديث" : "Refresh"}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={open} disabled={!src} className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-secondary disabled:opacity-30" title={ar ? "فتح" : "Open"}>
            <ExternalLink className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setDevice("desktop")} className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-secondary" title={ar ? "ملء العرض" : "Fit"}>
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-[500px] bg-muted/30 p-3 sm:p-5 overflow-auto">
        <div className={`mx-auto h-full min-h-[500px] transition-all duration-300 ${widths[device]}`}>
          {src ? (
            <iframe
              key={`${src}-${key}`}
              src={src}
              title="AI project preview"
              sandbox="allow-scripts allow-forms allow-modals"
              className="h-full min-h-[500px] w-full rounded-2xl border border-border/70 bg-white shadow-xl"
            />
          ) : (
            <div className="h-full min-h-[500px] rounded-2xl border border-dashed border-border/70 grid place-items-center text-center p-8">
              <div>
                <div className="text-sm font-medium">{ar ? "المعاينة ستظهر هنا" : "Your preview will appear here"}</div>
                <p className="mt-2 text-xs text-muted-foreground max-w-sm">
                  {ar ? "اكتب فكرتك وسيبني الذكاء الاصطناعي المشروع ثم يشغله هنا مباشرة." : "Describe your idea. The AI will build the project and run it here."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
