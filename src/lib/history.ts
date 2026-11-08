import type { LangCode } from "./i18n";

export type StressLevel = "low" | "medium" | "high";
export type HistoryKind = "voice" | "text" | "crop" | "weather" | "market" | "scheme";

export type HistoryEntry = {
  id: string;
  kind: HistoryKind;
  language: LangCode;
  timestamp: number; // ms
  question?: string;
  answer?: string;
  stress?: StressLevel;
  suggestions?: string[];
  alerts?: string[];
  meta?: Record<string, string | number | boolean | null>;
};

const KEY = "raitha-history-v1";
const MAX = 200;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "timestamp"> & { timestamp?: number }): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    timestamp: entry.timestamp ?? Date.now(),
  };
  if (typeof window === "undefined") return full;
  const list = [full, ...getHistory()].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("raitha-history-change"));
  return full;
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("raitha-history-change"));
}

// Heuristic stress estimator from a free-text question.
// Looks for distress keywords across supported languages.
const HIGH_KEYWORDS = [
  // english
  "dying", "dead", "destroyed", "ruined", "loss", "urgent", "emergency", "help me", "please help", "loan", "suicide",
  // hindi
  "मर रही", "मर गई", "बर्बाद", "नुकसान", "तत्काल", "मदद",
  // kannada
  "ಸಾಯ", "ನಾಶ", "ನಷ್ಟ", "ತುರ್ತು", "ಸಹಾಯ",
  // telugu
  "చనిపో", "నాశనం", "నష్టం", "అత్యవసర", "సహాయం",
  // tamil
  "இறக்க", "அழி", "நஷ்டம்", "அவசர", "உதவி",
];
const MED_KEYWORDS = [
  "disease", "pest", "yellow", "spots", "wilting", "drought", "flood", "low price",
  "रोग", "कीट", "पीला", "सूख",
  "ರೋಗ", "ಕೀಟ", "ಹಳದಿ", "ಒಣ",
  "వ్యాధి", "పురుగు", "పసుపు", "ఎండ",
  "நோய்", "பூச்சி", "மஞ்சள்", "வறட்சி",
];

export function estimateStress(text: string): StressLevel {
  const t = (text || "").toLowerCase();
  if (HIGH_KEYWORDS.some((k) => t.includes(k.toLowerCase()))) return "high";
  if (MED_KEYWORDS.some((k) => t.includes(k.toLowerCase()))) return "medium";
  return "low";
}
