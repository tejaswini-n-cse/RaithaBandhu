import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/use-language";
import { T, type LangCode } from "@/lib/i18n";
import { localizeCurrency, localizeDigits, localizeNumber } from "@/lib/locale";
import { isVoiceSupportedLang, speakText, stopSpeaking } from "@/lib/tts";
import { getMarketTrends, type MarketCrop } from "@/lib/agri.functions";
import { addHistory } from "@/lib/history";
import { Loader2, MapPin, Volume2, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Prices — RaithaBandhu" },
      { name: "description", content: "Indicative crop market prices and trends for your region." },
    ],
  }),
  component: Market,
});

const UI: Record<LangCode, {
  loading: string; refresh: string;
  current: string; predicted: string; demand: string; alert: string; advice: string;
  disclaimer: string; listen: string; trendUp: string; trendDown: string; trendStable: string;
  perQuintal: string; demandIdx: string;
  state: string; district: string; statePh: string; districtPh: string; submit: string;
  enterLoc: string; needBoth: string;
}> = {
  en: { loading: "Fetching market trends…", refresh: "Refresh",
        current: "Current", predicted: "Predicted", demand: "Demand", alert: "Alert", advice: "Trading Advice",
        disclaimer: "Disclaimer", listen: "Listen", trendUp: "Rising", trendDown: "Falling", trendStable: "Stable",
        perQuintal: "₹ per quintal", demandIdx: "Demand index (0–100)",
        state: "State", district: "District", statePh: "e.g. Karnataka", districtPh: "e.g. Ballari",
        submit: "Show prices", enterLoc: "Enter your location to see market prices", needBoth: "Please enter both state and district." },
  hi: { loading: "बाजार रुझान लाए जा रहे हैं…", refresh: "ताज़ा करें",
        current: "वर्तमान", predicted: "अनुमानित", demand: "मांग", alert: "अलर्ट", advice: "व्यापार सलाह",
        disclaimer: "अस्वीकरण", listen: "सुनें", trendUp: "बढ़ रहा", trendDown: "घट रहा", trendStable: "स्थिर",
        perQuintal: "₹ प्रति क्विंटल", demandIdx: "मांग सूचकांक (०–१००)",
        state: "राज्य", district: "जिला", statePh: "जैसे महाराष्ट्र", districtPh: "जैसे पुणे",
        submit: "भाव दिखाएँ", enterLoc: "बाजार भाव देखने के लिए अपना स्थान दर्ज करें", needBoth: "कृपया राज्य और जिला दोनों दर्ज करें।" },
  kn: { loading: "ಮಾರುಕಟ್ಟೆ ಪ್ರವೃತ್ತಿಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ…", refresh: "ರಿಫ್ರೆಶ್",
        current: "ಪ್ರಸ್ತುತ", predicted: "ಊಹಿಸಿದ", demand: "ಬೇಡಿಕೆ", alert: "ಎಚ್ಚರಿಕೆ", advice: "ವ್ಯಾಪಾರ ಸಲಹೆ",
        disclaimer: "ಎಚ್ಚರಿಕೆ", listen: "ಆಲಿಸಿ", trendUp: "ಏರುತ್ತಿದೆ", trendDown: "ಇಳಿಯುತ್ತಿದೆ", trendStable: "ಸ್ಥಿರ",
        perQuintal: "₹ ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್", demandIdx: "ಬೇಡಿಕೆ ಸೂಚ್ಯಂಕ (೦–೧೦೦)",
        state: "ರಾಜ್ಯ", district: "ಜಿಲ್ಲೆ", statePh: "ಉದಾ. ಕರ್ನಾಟಕ", districtPh: "ಉದಾ. ಬಳ್ಳಾರಿ",
        submit: "ಬೆಲೆಗಳನ್ನು ತೋರಿಸಿ", enterLoc: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ನೋಡಲು ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ನಮೂದಿಸಿ", needBoth: "ದಯವಿಟ್ಟು ರಾಜ್ಯ ಮತ್ತು ಜಿಲ್ಲೆ ಎರಡನ್ನೂ ನಮೂದಿಸಿ." },
  te: { loading: "మార్కెట్ ట్రెండ్‌లను తీసుకొస్తోంది…", refresh: "రిఫ్రెష్",
        current: "ప్రస్తుతం", predicted: "అంచనా", demand: "డిమాండ్", alert: "హెచ్చరిక", advice: "వ్యాపార సలహా",
        disclaimer: "నిరాకరణ", listen: "వినండి", trendUp: "పెరుగుతోంది", trendDown: "తగ్గుతోంది", trendStable: "స్థిరం",
        perQuintal: "₹ క్వింటాల్‌కు", demandIdx: "డిమాండ్ సూచిక (౦–౧౦౦)",
        state: "రాష్ట్రం", district: "జిల్లా", statePh: "ఉదా. తెలంగాణ", districtPh: "ఉదా. వరంగల్",
        submit: "ధరలను చూపించు", enterLoc: "మార్కెట్ ధరలను చూడటానికి మీ స్థానాన్ని నమోదు చేయండి", needBoth: "దయచేసి రాష్ట్రం మరియు జిల్లా రెండింటినీ నమోదు చేయండి." },
  ta: { loading: "சந்தை போக்குகளைப் பெறுகிறது…", refresh: "புதுப்பி",
        current: "தற்போது", predicted: "எதிர்பார்ப்பு", demand: "கேள்வி", alert: "எச்சரிக்கை", advice: "வர்த்தக ஆலோசனை",
        disclaimer: "மறுப்பு", listen: "கேள்", trendUp: "உயர்கிறது", trendDown: "குறைகிறது", trendStable: "நிலையானது",
        perQuintal: "₹ ஒரு குவிண்டலுக்கு", demandIdx: "கேள்வி குறியீடு (௦–௧௦௦)",
        state: "மாநிலம்", district: "மாவட்டம்", statePh: "எ.கா. தமிழ்நாடு", districtPh: "எ.கா. கோயம்புத்தூர்",
        submit: "விலைகளைக் காட்டு", enterLoc: "சந்தை விலைகளைப் பார்க்க உங்கள் இடத்தை உள்ளிடவும்", needBoth: "தயவுசெய்து மாநிலம் மற்றும் மாவட்டம் இரண்டையும் உள்ளிடவும்." },
};

type Result = { crops: MarketCrop[]; advice: string; disclaimer: string };

function Market() {
  const [lang] = useLanguage();
  const ui = UI[lang];
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [submittedLoc, setSubmittedLoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(locationName: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Pass 0,0 coords; the AI uses locationName as the primary signal.
      const res = await getMarketTrends({ data: { lat: 0, lon: 0, locationName, language: lang } });
      if (res.error || !res.result) setError(res.error ?? "No data");
      else {
        setResult({ crops: res.result.crops, advice: res.result.advice, disclaimer: res.result.disclaimer });
        addHistory({
          kind: "market",
          language: lang,
          question: locationName,
          answer: res.result.advice,
          suggestions: res.result.crops.slice(0, 6).map((c) => `${c.name}: ₹${c.price} → ₹${c.predicted}`),
          alerts: res.result.crops.map((c) => c.alert).filter(Boolean).slice(0, 4),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = stateName.trim();
    const d = district.trim();
    if (!s || !d) { setError(ui.needBoth); return; }
    const loc = `${d}, ${s}, India`;
    setSubmittedLoc(loc);
    void load(loc);
  }

  function speak(text: string) { void speakText(text, lang); }

  useEffect(() => { return () => stopSpeaking(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack />
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{T.market[lang]}</h1>
            {submittedLoc && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {submittedLoc}
              </p>
            )}
          </div>
          {submittedLoc && (
            <button onClick={() => void load(submittedLoc)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {ui.refresh}
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:grid-cols-[1fr,1fr,auto]">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{ui.state}</label>
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder={ui.statePh} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{ui.district}</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={ui.districtPh} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" disabled={loading} className="self-end rounded-lg bg-gradient-hero px-5 py-2 font-semibold text-primary-foreground shadow-soft hover:scale-[1.02] disabled:opacity-50">
            <span className="inline-flex items-center gap-1.5"><Search className="h-4 w-4" /> {ui.submit}</span>
          </button>
        </form>

        <div className="mt-6 space-y-5">
          {!submittedLoc && !loading && !error && (
            <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">
              {ui.enterLoc}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 rounded-2xl bg-card p-6 shadow-soft">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> {ui.loading}
            </div>
          )}

          {result && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {result.crops.map((c, idx) => (
                  <CropCard key={idx} crop={c} lang={lang} ui={ui} />
                ))}
              </div>

              {result.advice && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-soft">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-foreground">{ui.advice}</h2>
                    {isVoiceSupportedLang(lang) && (
                      <button onClick={() => speak(result.advice)} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-muted">
                        <Volume2 className="h-3.5 w-3.5" /> {ui.listen}
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{result.advice}</p>
                </div>
              )}

              {result.disclaimer && (
                <p className="text-center text-xs italic text-muted-foreground">* {result.disclaimer}</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function CropCard({ crop, lang, ui }: {
  crop: MarketCrop;
  lang: LangCode;
  ui: typeof UI[LangCode];
}) {
  const priceData = [
    { label: ui.current, value: crop.price, fill: "hsl(var(--primary))" },
    { label: ui.predicted, value: crop.predicted, fill: "hsl(var(--accent, var(--primary)))" },
  ];
  const demandData = [{ label: ui.demand, value: crop.demand, fill: "hsl(var(--primary))" }];

  const TrendIcon = crop.trend === "up" ? TrendingUp : crop.trend === "down" ? TrendingDown : Minus;
  const trendColor = crop.trend === "up" ? "text-emerald-600" : crop.trend === "down" ? "text-red-600" : "text-muted-foreground";
  const trendLabel = crop.trend === "up" ? ui.trendUp : crop.trend === "down" ? ui.trendDown : ui.trendStable;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">{crop.name}</h3>
          <div className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" /> {trendLabel}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">{ui.current}</div>
          <div className="font-semibold text-foreground">{localizeCurrency(crop.price, lang)}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">{ui.predicted}</div>
          <div className="font-semibold text-foreground">{localizeCurrency(crop.predicted, lang)}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-muted-foreground">{ui.perQuintal}</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priceData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => localizeDigits(v, lang)} width={48} />
              <Tooltip
                formatter={(v: number) => [localizeCurrency(v, lang), ""]}
                labelFormatter={(l) => String(l)}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{ui.demandIdx}</span>
          <span className="font-semibold text-foreground">{localizeNumber(crop.demand, lang)}/{localizeDigits(100, lang)}</span>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demandData} layout="vertical" margin={{ top: 0, right: 6, left: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="label" hide />
              <Tooltip formatter={(v: number) => [localizeNumber(v, lang), ui.demand]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {crop.alert && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-700 dark:text-amber-400">{ui.alert}</div>
            <div className="mt-0.5">{crop.alert}</div>
          </div>
        </div>
      )}
    </div>
  );
}
