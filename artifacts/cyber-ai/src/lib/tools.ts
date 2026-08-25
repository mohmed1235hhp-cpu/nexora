import { 
  MessageSquare, Mic, Image as ImageIcon, Sparkles, 
  Languages, Code, FileText, Presentation, PenTool, 
  Mail, Database, Search, AlignLeft, Eye, ScanText, 
  Layout, Smartphone, BookOpen, ShieldAlert, Video
} from "lucide-react";

export const TOOLS = [
  { id: "chat", name: "chat", labelAr: "محادثة كتابية", category: "كتابة", icon: MessageSquare, cost: 5, path: "/tools/chat" },
  { id: "voice", name: "voice", labelAr: "محادثة صوتية", category: "كتابة", icon: Mic, cost: 5, path: "/tools/voice" },
  { id: "image", name: "image", labelAr: "إنشاء الصور", category: "صور", icon: ImageIcon, cost: 10, path: "/tools/image" },
  { id: "image-edit", name: "image-edit", labelAr: "تعديل الصور", category: "صور", icon: Sparkles, cost: 10, path: "/tools/image-edit" },
  { id: "translate", name: "translate", labelAr: "الترجمة", category: "كتابة", icon: Languages, cost: 2, path: "/tools/translate" },
  { id: "code", name: "code", labelAr: "إنشاء الأكواد", category: "كود", icon: Code, cost: 7, path: "/tools/code" },
  { id: "document", name: "document", labelAr: "إنشاء المستندات", category: "كتابة", icon: FileText, cost: 8, path: "/tools/document" },
  { id: "presentation", name: "presentation", labelAr: "العروض التقديمية", category: "كتابة", icon: Presentation, cost: 8, path: "/tools/presentation" },
  { id: "content", name: "content", labelAr: "كتابة المحتوى", category: "كتابة", icon: PenTool, cost: 7, path: "/tools/content" },
  { id: "email", name: "email", labelAr: "كتابة الإيميلات", category: "كتابة", icon: Mail, cost: 5, path: "/tools/email" },
  { id: "data", name: "data", labelAr: "تحليل البيانات", category: "تحليل", icon: Database, cost: 8, path: "/tools/data" },
  { id: "search", name: "search", labelAr: "البحث الذكي", category: "تحليل", icon: Search, cost: 3, path: "/tools/search" },
  { id: "summarize", name: "summarize", labelAr: "تلخيص الملفات", category: "تحليل", icon: AlignLeft, cost: 4, path: "/tools/summarize" },
  { id: "analyze-image", name: "analyze-image", labelAr: "تحليل الصور", category: "صور", icon: Eye, cost: 8, path: "/tools/analyze-image" },
  { id: "ocr", name: "ocr", labelAr: "استخراج النصوص", category: "صور", icon: ScanText, cost: 3, path: "/tools/ocr" },
  { id: "website", name: "website", labelAr: "إنشاء المواقع", category: "كود", icon: Layout, cost: 15, path: "/tools/website" },
  { id: "app", name: "app", labelAr: "إنشاء التطبيقات", category: "كود", icon: Smartphone, cost: 15, path: "/tools/app" },
  { id: "study", name: "study", labelAr: "مساعد الدراسة", category: "تعليم", icon: BookOpen, cost: 5, path: "/tools/study" },
  { id: "security", name: "security", labelAr: "الأمن السيبراني", category: "كود", icon: ShieldAlert, cost: 6, path: "/tools/security" },
  { id: "video", name: "video", labelAr: "إنشاء الفيديو", category: "فيديو", icon: Video, cost: 20, path: "/tools/video" },
];

export const CATEGORIES = Array.from(new Set(TOOLS.map(t => t.category)));
