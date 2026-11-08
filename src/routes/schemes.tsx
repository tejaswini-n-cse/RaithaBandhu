import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/use-language";
import { T, type LangCode } from "@/lib/i18n";
import { isVoiceSupportedLang, speakText, stopSpeaking } from "@/lib/tts";
import { getSchemes, type SchemeItem } from "@/lib/agri.functions";
import { addHistory } from "@/lib/history";
import { Loader2, Search, Volume2, ExternalLink, Building2, FileText } from "lucide-react";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes — RaithaBandhu" },
      { name: "description", content: "Discover Indian government schemes and subsidies for farmers." },
    ],
  }),
  component: Schemes,
});

const UI: Record<LangCode, {
  search: string; placeholder: string; loading: string; state: string; statePh: string;
  eligibility: string; benefit: string; howToApply: string; documents: string;
  applyOnline: string; offlineOnly: string; listen: string;
  centralScheme: string; stateScheme: string;
}> = {
  en: { search: "Search schemes", placeholder: "e.g. crop insurance, drip irrigation", loading: "Loading schemes…", state: "State (optional)", statePh: "e.g. Karnataka",
        eligibility: "Eligibility", benefit: "Benefit", howToApply: "How to apply", documents: "Required documents",
        applyOnline: "Apply Online", offlineOnly: "Apply via CSC / bank / govt office", listen: "Listen",
        centralScheme: "Central Scheme", stateScheme: "State Scheme" },
  hi: { search: "योजना खोजें", placeholder: "जैसे फसल बीमा, ड्रिप सिंचाई", loading: "योजनाएँ लोड हो रही हैं…", state: "राज्य (वैकल्पिक)", statePh: "जैसे महाराष्ट्र",
        eligibility: "पात्रता", benefit: "लाभ", howToApply: "आवेदन कैसे करें", documents: "आवश्यक दस्तावेज़",
        applyOnline: "ऑनलाइन आवेदन करें", offlineOnly: "CSC / बैंक / सरकारी कार्यालय से आवेदन करें", listen: "सुनें",
        centralScheme: "केंद्रीय योजना", stateScheme: "राज्य योजना" },
  kn: { search: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ", placeholder: "ಉದಾ. ಬೆಳೆ ವಿಮೆ, ಹನಿ ನೀರಾವರಿ", loading: "ಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…", state: "ರಾಜ್ಯ (ಐಚ್ಛಿಕ)", statePh: "ಉದಾ. ಕರ್ನಾಟಕ",
        eligibility: "ಅರ್ಹತೆ", benefit: "ಲಾಭ", howToApply: "ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ", documents: "ಅಗತ್ಯ ದಾಖಲೆಗಳು",
        applyOnline: "ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", offlineOnly: "CSC / ಬ್ಯಾಂಕ್ / ಸರ್ಕಾರಿ ಕಚೇರಿ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", listen: "ಆಲಿಸಿ",
        centralScheme: "ಕೇಂದ್ರ ಯೋಜನೆ", stateScheme: "ರಾಜ್ಯ ಯೋಜನೆ" },
  te: { search: "పథకాలను శోధించండి", placeholder: "ఉదా. పంట బీమా, బిందు సేద్యం", loading: "పథకాలను లోడ్ చేస్తోంది…", state: "రాష్ట్రం (ఐచ్ఛికం)", statePh: "ఉదా. తెలంగాణ",
        eligibility: "అర్హత", benefit: "ప్రయోజనం", howToApply: "ఎలా దరఖాస్తు చేయాలి", documents: "అవసరమైన పత్రాలు",
        applyOnline: "ఆన్‌లైన్‌లో దరఖాస్తు చేయండి", offlineOnly: "CSC / బ్యాంక్ / ప్రభుత్వ కార్యాలయం ద్వారా దరఖాస్తు చేయండి", listen: "వినండి",
        centralScheme: "కేంద్ర పథకం", stateScheme: "రాష్ట్ర పథకం" },
  ta: { search: "திட்டங்களைத் தேடு", placeholder: "எ.கா. பயிர் காப்பீடு, சொட்டு நீர்ப்பாசனம்", loading: "திட்டங்கள் ஏற்றப்படுகின்றன…", state: "மாநிலம் (விரும்பினால்)", statePh: "எ.கா. தமிழ்நாடு",
        eligibility: "தகுதி", benefit: "நன்மை", howToApply: "எப்படி விண்ணப்பிப்பது", documents: "தேவையான ஆவணங்கள்",
        applyOnline: "ஆன்லைனில் விண்ணப்பிக்கவும்", offlineOnly: "CSC / வங்கி / அரசு அலுவலகம் வழியாக விண்ணப்பிக்கவும்", listen: "கேள்",
        centralScheme: "மத்திய திட்டம்", stateScheme: "மாநில திட்டம்" },
};

function Schemes() {
  const [lang] = useLanguage();
  const ui = UI[lang];
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [schemes, setSchemes] = useState<SchemeItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(q?: string, st?: string) {
    setLoading(true);
    setError(null);
    setSchemes(null);
    try {
      const res = await getSchemes({ data: { language: lang, query: q || undefined, state: st || undefined } });
      if (res.error || !res.result) setError(res.error ?? "No data");
      else {
        setSchemes(res.result.schemes);
        addHistory({
          kind: "scheme",
          language: lang,
          question: [q, st].filter(Boolean).join(" · ") || "Browse schemes",
          answer: res.result.schemes.map((s) => s.name).join(", "),
          suggestions: res.result.schemes.map((s) => s.name).slice(0, 5),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(query.trim() || undefined, state.trim() || undefined); /* eslint-disable-next-line */ }, [lang]);

  function speak(text: string) { void speakText(text, lang); }

  useEffect(() => { return () => stopSpeaking(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack />
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">{T.schemes[lang]}</h1>

        <form
          onSubmit={(e) => { e.preventDefault(); void load(query.trim(), state.trim()); }}
          className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:grid-cols-[1fr,200px,auto]"
        >
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{ui.search}</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui.placeholder} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{ui.state}</label>
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder={ui.statePh} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" disabled={loading} className="self-end rounded-lg bg-gradient-hero px-5 py-2 font-semibold text-primary-foreground shadow-soft hover:scale-[1.02] disabled:opacity-50">
            <span className="inline-flex items-center gap-1.5"><Search className="h-4 w-4" /> Go</span>
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 rounded-2xl bg-card p-6 shadow-soft">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> {ui.loading}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
          )}
          {schemes && schemes.map((s, i) => (
            <article key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-2">
                {s.scope === "central" ? (
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {ui.centralScheme}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
                    {ui.stateScheme}{s.stateName ? ` – ${s.stateName}` : ""}
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-foreground">{s.name}</h2>
                {isVoiceSupportedLang(lang) && (
                  <button
                    onClick={() => speak(`${s.name}. ${ui.eligibility}: ${s.eligibility}. ${ui.benefit}: ${s.benefit}. ${ui.howToApply}: ${s.howToApply}.`)}
                    className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-muted"
                  >
                    <Volume2 className="h-3.5 w-3.5" /> {ui.listen}
                  </button>
                )}
              </div>
              <dl className="mt-3 grid gap-2 text-sm">
                <div><dt className="font-semibold text-muted-foreground">{ui.eligibility}</dt><dd className="text-foreground">{s.eligibility}</dd></div>
                <div><dt className="font-semibold text-muted-foreground">{ui.benefit}</dt><dd className="text-foreground">{s.benefit}</dd></div>
                <div><dt className="font-semibold text-muted-foreground">{ui.howToApply}</dt><dd className="text-foreground">{s.howToApply}</dd></div>
              </dl>

              {s.documents && s.documents.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {ui.documents}
                  </div>
                  <ul className="mt-2 grid gap-1 text-sm text-foreground sm:grid-cols-2">
                    {s.documents.map((d, di) => (
                      <li key={di} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {s.applyUrl ? (
                <a
                  href={s.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-hero px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.02]"
                >
                  {ui.applyOnline} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {ui.offlineOnly}
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
