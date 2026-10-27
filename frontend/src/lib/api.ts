const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const CLASSES = ["plastic", "paper", "glass", "metal", "organic", "trash"] as const;
export type Category = (typeof CLASSES)[number];

export interface Health { status: string; model_loaded: boolean; classes: string[]; message: string | null }
export interface Recommendation { name: string; bin: string; recyclable: string; description: string; tips: string[]; note: string }
export interface Prediction {
  id: number; category: Category; confidence: number;
  probabilities: Record<Category, number>; recommendation: Recommendation; image_url: string;
}
export interface Record_ {
  id: number; filename: string; category: Category; confidence: number;
  probabilities: Record<Category, number>; created_at: string; image_url: string;
}
export interface HistoryPage { total: number; page: number; page_size: number; items: Record_[] }
export interface Analytics {
  total: number; counts: Record<Category, number>; percentages: Record<Category, number>;
  average_confidence: number; daily: { date: string; count: number }[]; recent: Record_[];
}
export interface CategoryInfo {
  name: string; bin: string; recyclable: string; decomposition: string;
  description: string; examples: string[]; tips: string[];
}

export const imageSrc = (path: string) => `${BASE}${path}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new Error("Cannot reach the backend. Is it running on " + BASE + "?");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).detail ?? msg; } catch { /* ignore */ }
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return res.json();
}

export const api = {
  health: () => request<Health>("/health"),
  categories: () => request<{ categories: Record<Category, CategoryInfo>; note: string }>("/categories"),
  predict: (file: File | Blob, name = "capture.jpg") => {
    const fd = new FormData();
    fd.append("file", file, file instanceof File ? file.name : name);
    return request<Prediction>("/predict", { method: "POST", body: fd });
  },
  history: (q: Record<string, string | number | undefined> = {}) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
    return request<HistoryPage>(`/history?${p}`);
  },
  deleteOne: (id: number) => request(`/history/${id}`, { method: "DELETE" }),
  clearAll: () => request("/history", { method: "DELETE" }),
  analytics: (start?: string, end?: string) => {
    const p = new URLSearchParams();
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    return request<Analytics>(`/analytics?${p}`);
  },
};