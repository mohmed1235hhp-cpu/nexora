import { ar } from "./ar";
import { en } from "./en";
export const locales = { ar, en };
export type Locale = keyof typeof locales;
