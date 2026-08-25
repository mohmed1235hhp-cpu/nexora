import type { StoragePort } from "./StoragePort";
const NS = "ab:";
const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";
export class LocalStorageAdapter implements StoragePort {
  async get<T>(k: string){ if(!isBrowser()) return null; const v=localStorage.getItem(NS+k); return v?JSON.parse(v) as T:null; }
  async set<T>(k: string, v: T){ if(!isBrowser()) return; localStorage.setItem(NS+k, JSON.stringify(v)); }
  async remove(k: string){ if(!isBrowser()) return; localStorage.removeItem(NS+k); }
  async keys(){ if(!isBrowser()) return []; return Object.keys(localStorage).filter(k=>k.startsWith(NS)).map(k=>k.slice(NS.length)); }
}
