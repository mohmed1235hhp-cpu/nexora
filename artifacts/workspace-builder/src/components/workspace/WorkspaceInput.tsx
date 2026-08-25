import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Mic, Paperclip, Send, Square } from "lucide-react";

interface Props {
  onSubmit: (prompt: string, attachments: File[]) => void;
  language: "en" | "ar";
}

/**
 * Premium chat-style input for the AI workspace.
 * Every control is real: mic uses MediaRecorder, upload/image use file inputs,
 * camera opens the device camera, send dispatches the workspace flow.
 */
export function WorkspaceInput({ onSubmit, language }: Props) {
  const ar = language === "ar";
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2200);
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSubmit(value, files);
    setText("");
    setFiles([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const pickFiles = (ref: React.RefObject<HTMLInputElement | null>) => () => ref.current?.click();

  const onFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length) {
      setFiles((prev) => [...prev, ...chosen]);
      flash(ar ? `تم إرفاق ${chosen.length} ملف` : `Attached ${chosen.length} file(s)`);
    }
    e.target.value = "";
  };

  const toggleRecord = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setFiles((prev) => [...prev, file]);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        flash(ar ? "تم تسجيل الرسالة الصوتية" : "Voice message recorded");
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      flash(ar ? "لم نتمكن من الوصول للميكروفون" : "Microphone unavailable");
    }
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-3xl mx-auto">
      <div className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl transition-all focus-within:border-primary/50 focus-within:shadow-primary/10">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={ar ? "حول فكرتك إلى حقيقة...\nابدأ الآن." : "Turn your idea into reality...\nStart now."}
          className="w-full resize-none bg-transparent px-6 pt-6 pb-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70"
          style={{ minHeight: 96 }}
        />

        {files.length > 0 && (
          <div className="px-6 pb-2 flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-1 text-xs">
                {f.name}
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="opacity-60 hover:opacity-100"
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 px-3 pb-3">
          <IconBtn onClick={toggleRecord} label={ar ? "ميكروفون" : "Microphone"} active={recording}>
            {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </IconBtn>
          <IconBtn onClick={pickFiles(fileRef)} label={ar ? "رفع ملف" : "Upload file"}>
            <Paperclip className="h-5 w-5" />
          </IconBtn>
          <IconBtn onClick={pickFiles(imgRef)} label={ar ? "رفع صورة" : "Upload image"}>
            <ImagePlus className="h-5 w-5" />
          </IconBtn>
          <IconBtn onClick={pickFiles(camRef)} label={ar ? "كاميرا" : "Camera"}>
            <Camera className="h-5 w-5" />
          </IconBtn>

          <div className="flex-1" />

          <button
            onClick={submit}
            disabled={!text.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-lg shadow-primary/25 disabled:opacity-40 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition"
            aria-label={ar ? "إرسال" : "Send"}
          >
            <Send className="h-4 w-4" />
            <span>{ar ? "إرسال" : "Send"}</span>
          </button>
        </div>

        <input ref={fileRef} type="file" multiple hidden onChange={onFilesChosen} />
        <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={onFilesChosen} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onFilesChosen} />

        {notice && (
          <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-muted-foreground animate-fade-in">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`h-10 w-10 grid place-items-center rounded-xl transition-all hover:bg-secondary ${
        active ? "bg-destructive/15 text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
