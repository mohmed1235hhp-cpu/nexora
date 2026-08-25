import { createContext, useContext, useState, type ReactNode } from "react";
import { locales, type Locale } from "../localization";
const I18n = createContext<{ t: typeof locales.ar; locale: Locale; setLocale: (l: Locale) => void }>({ t: locales.ar, locale: "ar", setLocale: () => {} });
export function I18nProvider({ children, initial = "ar" as Locale }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initial);
  return <I18n.Provider value={{ t: locales[locale], locale, setLocale }}>{children}</I18n.Provider>;
}
export const useI18n = () => useContext(I18n);
