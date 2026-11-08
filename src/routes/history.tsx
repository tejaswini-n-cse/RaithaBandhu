import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/use-language";
import { T, bcp47For, type LangCode } from "@/lib/i18n";
import { getHistory, clearHistory, type HistoryEntry, type StressLevel } from "@/lib/history";
import { Trash2, MessageSquare, Mic, Leaf, CloudSun, TrendingUp, Landmark, AlertTriangle, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — RaithaBandhu" },
      { name: "description", content: "Your past conversations, alerts and suggestions." },
    ],
  }),
  component: HistoryPage,
});

const UI: Record<LangCode, {
  title: string; empty: string; clear: string; confirm: string;
  stress: string; low: string; medium: string; high: string;
  question: string; answer: string; suggestions: string; alerts: string;
  voice: string; text: string; crop: string; weather: string; market: string; scheme: string;
}> = {
  en: { title: "Your History", empty: "No history yet. Start a conversation, check weather or browse schemes.", clear: "Clear all", confirm: "Clear all history?",
        stress: "Stress", low: "Low", medium: "Medium", high: "High",
        question: "Question", answer: "Answer", suggestions: "Suggestions", alerts: "Alerts",
        voice: "Voice", text: "Text", crop: "Crop", weather: "Weather", market: "Market", scheme: "Scheme" },
  hi: { title: "आपका इतिहास", empty: "अभी कोई इतिहास नहीं है।", clear: "सभी हटाएँ", confirm: "पूरा इतिहास हटाएँ?",
        stress: "तनाव", low: "कम", medium: "मध्यम", high: "उच्च",
        question: "प्रश्न", answer: "उत्तर", suggestions: "सुझाव", alerts: "चेतावनी",
        voice: "आवाज़", text: "टेक्स्ट", crop: "फसल", weather: "मौसम", market: "बाजार", scheme: "योजना" },
  kn: { title: "ನಿಮ್ಮ ಇತಿಹಾಸ", empty: "ಇನ್ನೂ ಇತಿಹಾಸ ಇಲ್ಲ.", clear: "ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ", confirm: "ಎಲ್ಲ ಇತಿಹಾಸ ಅಳಿಸಬೇಕೆ?",
        stress: "ಒತ್ತಡ", low: "ಕಡಿಮೆ", medium: "ಮಧ್ಯಮ", high: "ಹೆಚ್ಚು",
        question: "ಪ್ರಶ್ನೆ", answer: "ಉತ್ತರ", suggestions: "ಸಲಹೆಗಳು", alerts: "ಎಚ್ಚರಿಕೆ",
        voice: "ಧ್ವನಿ", text: "ಪಠ್ಯ", crop: "ಬೆಳೆ", weather: "ಹವಾಮಾನ", market: "ಮಾರುಕಟ್ಟೆ", scheme: "ಯೋಜನೆ" },
  te: { title: "మీ చరిత్ర", empty: "ఇంకా చరిత్ర లేదు.", clear: "అన్నీ తొలగించండి", confirm: "మొత్తం చరిత్ర తొలగించాలా?",
        stress: "ఒత్తిడి", low: "తక్కువ", medium: "మధ్యమ", high: "ఎక్కువ",
        question: "ప్రశ్న", answer: "సమాధానం", suggestions: "సూచనలు", alerts: "హెచ్చరికలు",
        voice: "వాయిస్", text: "టెక్స్ట్", crop: "పంట", weather: "వాతావరణం", market: "మార్కెట్", scheme: "పథకం" },
  ta: { title: "உங்கள் வரலாறு", empty: "இன்னும் வரலாறு இல்லை.", clear: "அனைத்தையும் அழிக்கவும்", confirm: "முழு வரலாற்றையும் அழிக்கவா?",
        stress: "மன அழுத்தம்", low: "குறைவு", medium: "நடுத்தர", high: "அதிகம்",
        question: "கேள்வி", answer: "பதில்", suggestions: "பரிந்துரைகள்", alerts: "எச்சரிக்கை",
        voice: "குரல்", text: "உரை", crop: "பயிர்", weather: "வானிலை", market: "சந்தை", scheme: "திட்டம்" },
};

const STRESS_STYLE: Record<StressLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const KIND_ICON = {
  voice: Mic, text: MessageSquare, crop: Leaf, weather: CloudSun, market: TrendingUp, scheme: Landmark,
} as const;

function HistoryPage() {
  const [lang] = useLanguage();
  const ui = UI[lang];
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setItems(getHistory());
    const handler = () => setItems(getHistory());
    window.addEventListener("raitha-history-change", handler);
    return () => window.removeEventListener("raitha-history-change", handler);
  }, []);

  function fmtDate(ts: number) {
    return new Date(ts).toLocaleString(bcp47For(lang), { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack />
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-foreground">{ui.title}</h1>
          {items.length > 0 && (
            <button
              onClick={() => { if (confirm(ui.confirm)) clearHistory(); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" /> {ui.clear}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            {ui.empty}
          </div>
        ) : (
          <ol className="mt-6 space-y-4">
            {items.map((e) => {
              const Icon = KIND_ICON[e.kind];
              const kindLabel = ui[e.kind];
              return (
                <li key={e.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                      <Icon className="h-3.5 w-3.5" /> {kindLabel}
                    </span>
                    {e.stress && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${STRESS_STYLE[e.stress]}`}>
                        {ui.stress}: {ui[e.stress]}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">{fmtDate(e.timestamp)}</span>
                  </div>

                  {e.question && (
                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ui.question}</div>
                      <p className="mt-1 text-sm text-foreground">{e.question}</p>
                    </div>
                  )}
                  {e.answer && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ui.answer}</div>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-foreground">{e.answer}</p>
                    </div>
                  )}
                  {e.suggestions && e.suggestions.length > 0 && (
                    <div className="mt-3 rounded-xl bg-secondary/40 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5" /> {ui.suggestions}
                      </div>
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                        {e.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {e.alerts && e.alerts.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" /> {ui.alerts}
                      </div>
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                        {e.alerts.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
