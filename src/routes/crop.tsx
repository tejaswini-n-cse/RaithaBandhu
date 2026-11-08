import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Markdown } from "@/components/Markdown";
import { useLanguage } from "@/lib/use-language";
import { T, type LangCode } from "@/lib/i18n";
import { isVoiceSupportedLang, speakText, stopSpeaking } from "@/lib/tts";
import { analyzeCrop } from "@/lib/agri.functions";
import { addHistory } from "@/lib/history";
import { Camera, Upload, Loader2, Volume2 } from "lucide-react";

export const Route = createFileRoute("/crop")({
  head: () => ({
    meta: [
      { title: "Crop Health — RaithaBandhu" },
      { name: "description", content: "Diagnose crop diseases and pests by uploading a photo." },
    ],
  }),
  component: Crop,
});

const UI: Record<LangCode, { upload: string; analyze: string; analyzing: string; notes: string; notesPh: string; result: string; choose: string; replace: string }> = {
  en: { upload: "Upload a clear photo of the affected leaf or plant", analyze: "Analyze Crop", analyzing: "Analyzing image…", notes: "Notes (optional)", notesPh: "e.g. Yellow spots on tomato leaves for 3 days", result: "Diagnosis", choose: "Choose photo", replace: "Replace photo" },
  hi: { upload: "प्रभावित पत्ती या पौधे की स्पष्ट तस्वीर अपलोड करें", analyze: "फसल जाँचें", analyzing: "छवि का विश्लेषण…", notes: "टिप्पणी (वैकल्पिक)", notesPh: "जैसे टमाटर की पत्तियों पर पीले धब्बे 3 दिन से", result: "निदान", choose: "फोटो चुनें", replace: "फोटो बदलें" },
  kn: { upload: "ಪರಿಣಾಮ ಬೀರಿದ ಎಲೆ ಅಥವಾ ಸಸ್ಯದ ಸ್ಪಷ್ಟ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", analyze: "ಬೆಳೆ ಪರಿಶೀಲಿಸಿ", analyzing: "ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…", notes: "ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)", notesPh: "ಉದಾ. ಟೊಮೇಟೊ ಎಲೆಗಳ ಮೇಲೆ ಹಳದಿ ಚುಕ್ಕೆಗಳು", result: "ರೋಗನಿರ್ಣಯ", choose: "ಫೋಟೋ ಆಯ್ಕೆ", replace: "ಫೋಟೋ ಬದಲಾಯಿಸಿ" },
  te: { upload: "ప్రభావిత ఆకు లేదా మొక్క స్పష్టమైన ఫోటో అప్‌లోడ్ చేయండి", analyze: "పంటను విశ్లేషించండి", analyzing: "చిత్రాన్ని విశ్లేషిస్తోంది…", notes: "గమనికలు (ఐచ్ఛికం)", notesPh: "ఉదా. టమోటా ఆకులపై పసుపు మచ్చలు", result: "నిర్ధారణ", choose: "ఫోటో ఎంచుకోండి", replace: "ఫోటో మార్చండి" },
  ta: { upload: "பாதிக்கப்பட்ட இலை அல்லது தாவரத்தின் தெளிவான புகைப்படத்தைப் பதிவேற்றவும்", analyze: "பயிரை ஆய்வு செய்", analyzing: "படத்தை ஆய்வு செய்கிறது…", notes: "குறிப்புகள் (விரும்பினால்)", notesPh: "எ.கா. தக்காளி இலைகளில் மஞ்சள் புள்ளிகள்", result: "நோய் கண்டறிதல்", choose: "புகைப்படம் தேர்வு", replace: "புகைப்படத்தை மாற்று" },
};

function Crop() {
  const [lang] = useLanguage();
  const ui = UI[lang];
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(file: File) {
    if (file.size > 6 * 1024 * 1024) {
      setError("Image too large (max 6 MB). Please choose a smaller photo.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeCrop({ data: { imageBase64, language: lang, notes: notes.trim() || undefined } });
      if (res.error) setError(res.error);
      else {
        setResult(res.reply);
        const lower = res.reply.toLowerCase();
        const stress = /serious|severe|गंभीर|ತೀವ್ರ|తీవ్ర|கடுமையான/.test(lower) ? "high"
          : /mild|disease|pest|रोग|ರೋಗ|వ్యాధి|நோய்/.test(lower) ? "medium" : "low";
        addHistory({
          kind: "crop",
          language: lang,
          question: notes.trim() || "Crop photo analysis",
          answer: res.reply,
          stress,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    void speakText(text, lang);
  }

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">{T.crop[lang]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ui.upload}</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <div className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary hover:bg-muted/50 ${imageBase64 ? "border-primary" : ""}`}>
              {imageBase64 ? (
                <>
                  <img src={imageBase64} alt="Crop preview" className="max-h-64 rounded-xl shadow-soft" />
                  <span className="text-sm font-medium text-primary">{ui.replace}</span>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground shadow-soft">
                    <Camera className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{ui.choose}</span>
                  <span className="text-xs text-muted-foreground">JPG / PNG · max 6 MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-foreground">{ui.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={ui.notesPh}
              maxLength={500}
              className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
            />
          </div>

          <button
            onClick={analyze}
            disabled={!imageBase64 || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-hero px-6 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> {ui.analyzing}</> : <><Upload className="h-5 w-5" /> {ui.analyze}</>}
          </button>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          )}

          {result && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">{ui.result}</h2>
                {isVoiceSupportedLang(lang) && (
                  <button onClick={() => speak(result)} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted">
                    <Volume2 className="h-3.5 w-3.5" /> Listen
                  </button>
                )}
              </div>
              <Markdown>{result}</Markdown>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
