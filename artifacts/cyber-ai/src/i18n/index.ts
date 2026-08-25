import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";

export const SUPPORTED = ["ar", "en"] as const;
export type Lang = typeof SUPPORTED[number];
export const RTL_LANGS = new Set<Lang>(["ar"]);

const stored = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || "ar";

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: stored,
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = stored;
  document.documentElement.dir = RTL_LANGS.has(stored) ? "rtl" : "ltr";
}

export function setLang(lang: Lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

export default i18n;
