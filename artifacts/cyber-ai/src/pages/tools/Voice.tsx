import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAiChat, ChatMessage } from "@workspace/api-client-react";
import { useCreditsManager } from "@/hooks/use-credits-manager";
import { TOOLS } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Square, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceTool() {
  const tool = TOOLS.find(t => t.id === "voice")!;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatMutation = useAiChat();
  const { consumeCredits } = useCreditsManager(tool.cost);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ar-SA';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        stopRecording();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      if (transcript.trim()) {
        handleSend(transcript.trim());
      }
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setTranscript("");
    setIsRecording(true);
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    
    // Try to find an Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onend = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;
    
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setTranscript("");

    try {
      const res = await chatMutation.mutateAsync({
        data: { messages: newMessages }
      });
      
      const reply = res.content;
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      consumeCredits(tool.id, tool.labelAr, text.substring(0, 50));
      
      // Automatically speak the reply
      speakText(reply);
      
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
    <ToolPageWrapper toolId="voice">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12">
        
        {/* Main Microphone Button */}
        <div className="relative">
          {isRecording && (
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>
          )}
          {chatMutation.isPending && (
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin scale-125"></div>
          )}
          <button
            onClick={toggleRecording}
            disabled={chatMutation.isPending}
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 shadow-2xl",
              isRecording ? "bg-red-500 text-white shadow-red-500/50 scale-110" : "bg-primary text-primary-foreground hover:scale-105",
              chatMutation.isPending && "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            {isRecording ? <Square className="w-12 h-12 fill-current" /> : <Mic className="w-12 h-12" />}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-4 w-full max-w-2xl px-6">
          <h3 className="text-2xl font-bold">
            {isRecording ? "جاري الاستماع..." : chatMutation.isPending ? "جاري التفكير..." : "اضغط للتحدث"}
          </h3>
          
          <div className="min-h-[100px] p-6 bg-card border rounded-2xl shadow-sm text-lg leading-relaxed relative">
            {isRecording ? (
              <span className="text-foreground">{transcript || "تحدث الآن..."}</span>
            ) : chatMutation.isPending ? (
              <span className="text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                يتم توليد الرد
              </span>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg text-right">
                  {messages[messages.length - 2]?.content}
                </div>
                <div className="text-primary font-medium text-right relative pr-10">
                  <button 
                    onClick={() => speakText(messages[messages.length - 1].content)}
                    className="absolute right-0 top-1 text-primary hover:text-primary/70 transition-colors"
                  >
                    <Volume2 className={cn("w-6 h-6", isSpeaking && "animate-pulse")} />
                  </button>
                  {messages[messages.length - 1]?.content}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">تحدث وسأقوم بالرد عليك صوتياً</span>
            )}
          </div>
        </div>

      </div>
    </ToolPageWrapper>
    </AppLayout>
  );
}
