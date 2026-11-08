import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Markdown } from "@/components/Markdown";
import { useLanguage } from "@/lib/use-language";
import { bcp47For, languageName, T, type LangCode } from "@/lib/i18n";
import { hasVoiceForLanguage, isVoiceSupportedLang, speakText, stopSpeaking } from "@/lib/tts";
import { askAssistant } from "@/lib/agri.functions";
import { addHistory, estimateStress } from "@/lib/history";
import { Mic, MicOff, Volume2, Loader2, Square } from "lucide-react";

export const Route = createFileRoute("/talk")({
  head: () => ({
    meta: [
      { title: "Talk to Us — RaithaBandhu" },
      { name: "description", content: "Ask farming questions by voice in English, Hindi, Kannada, Telugu or Tamil." },
    ],
  }),
  component: Talk,
});

const UI: Record<LangCode, { listening: string; tap: string; thinking: string; you: string; sathi: string; notSupported: string; speak: string; stop: string; hint: string; tryAgain: string; voiceMissing: string; replay: string; voiceNote: string }> = {
  en: { listening: "Listening…", tap: "Tap to speak", thinking: "Thinking…", you: "You", sathi: "RaithaBandhu", notSupported: "Voice input is not supported in this browser. Please use Chrome on desktop or Android.", speak: "Speak", stop: "Stop", hint: "Tap the microphone and ask your farming question", tryAgain: "Try Again", voiceMissing: "Text-to-speech is not available on this browser/device.", replay: "Replay", voiceNote: "Voice output is currently available only for English and Hindi." },
  hi: { listening: "सुन रहा हूँ…", tap: "बोलने के लिए दबाएँ", thinking: "सोच रहा हूँ…", you: "आप", sathi: "रैतबन्धु", notSupported: "इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है। कृपया Chrome का उपयोग करें।", speak: "बोलें", stop: "रोकें", hint: "माइक्रोफ़ोन दबाएँ और अपना सवाल पूछें", tryAgain: "फिर कोशिश करें", voiceMissing: "इस भाषा की आवाज़ आपके ब्राउज़र/डिवाइस में उपलब्ध नहीं है।", replay: "फिर सुनें", voiceNote: "वॉइस आउटपुट फ़िलहाल केवल अंग्रेज़ी और हिंदी में उपलब्ध है।" },
  kn: { listening: "ಕೇಳುತ್ತಿದ್ದೇನೆ…", tap: "ಮಾತನಾಡಲು ಒತ್ತಿ", thinking: "ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…", you: "ನೀವು", sathi: "ರೈತಬಂಧು", notSupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲಿತವಲ್ಲ. Chrome ಬಳಸಿ.", speak: "ಮಾತನಾಡಿ", stop: "ನಿಲ್ಲಿಸಿ", hint: "ಮೈಕ್ ಒತ್ತಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ", tryAgain: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", voiceMissing: "ಈ ಬ್ರೌಸರ್/ಸಾಧನದಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ.", replay: "ಮತ್ತೆ ಕೇಳಿ", voiceNote: "ಧ್ವನಿ ಔಟ್‌ಪುಟ್ ಪ್ರಸ್ತುತ ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಹಿಂದಿಗೆ ಮಾತ್ರ ಲಭ್ಯವಿದೆ." },
  te: { listening: "వింటున్నాను…", tap: "మాట్లాడటానికి నొక్కండి", thinking: "ఆలోచిస్తున్నాను…", you: "మీరు", sathi: "రైతబంధు", notSupported: "ఈ బ్రౌజర్‌లో వాయిస్ మద్దతు లేదు. Chrome ఉపయోగించండి.", speak: "మాట్లాడండి", stop: "ఆపండి", hint: "మైక్ నొక్కి మీ ప్రశ్న అడగండి", tryAgain: "మళ్ళీ ప్రయత్నించండి", voiceMissing: "ఈ భాష వాయిస్ ఈ బ్రౌజర్/డివైస్‌లో అందుబాటులో లేదు.", replay: "మళ్లీ వినండి", voiceNote: "వాయిస్ అవుట్‌పుట్ ప్రస్తుతం ఇంగ్లీష్ మరియు హిందీకి మాత్రమే అందుబాటులో ఉంది." },
  ta: { listening: "கேட்கிறேன்…", tap: "பேச அழுத்தவும்", thinking: "சிந்திக்கிறேன்…", you: "நீங்கள்", sathi: "ரைதபந்து", notSupported: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome பயன்படுத்தவும்.", speak: "பேசு", stop: "நிறுத்து", hint: "மைக்கை அழுத்தி உங்கள் கேள்வியைக் கேளுங்கள்", tryAgain: "மீண்டும் முயற்சி", voiceMissing: "இந்த மொழிக்கான குரல் இந்த உலாவி/சாதனத்தில் இல்லை.", replay: "மீண்டும் கேள்", voiceNote: "குரல் வெளியீடு தற்போது ஆங்கிலம் மற்றும் இந்திக்கு மட்டுமே கிடைக்கிறது." },
};

type Msg = { role: "user" | "assistant"; text: string };

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getSpeechRecognitionConstructor() {
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function extractBullets(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter((l, i, arr) => l.length > 0 && arr.indexOf(l) === i)
    .slice(0, 6);
}

function Talk() {
  const [lang] = useLanguage();
  const ui = UI[lang];
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = getSpeechRecognitionConstructor();
    if (!SR) setSupported(false);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim, thinking]);

  useEffect(() => {
    let active = true;
    setVoiceWarning(null);
    if (!isVoiceSupportedLang(lang)) return;
    void hasVoiceForLanguage(lang).then((available) => {
      if (active && !available) setVoiceWarning(ui.voiceMissing);
    });
    return () => { active = false; };
  }, [lang, ui.voiceMissing]);

  // Stop any TTS when user changes language
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  async function speak(text: string) {
    if (!isVoiceSupportedLang(lang)) return;
    const result = await speakText(text, lang);
    if (!result.ok && result.reason === "missing-voice") setVoiceWarning(ui.voiceMissing);
  }

  async function sendToAI(text: string, kind: "voice" | "text" = "voice") {
    setMessages((p) => [...p, { role: "user", text }]);
    setThinking(true);
    setError(null);
    try {
      const res = await askAssistant({ data: { message: text, language: lang } });
      if (res.error) {
        setError(res.error);
        addHistory({ kind, language: lang, question: text, stress: estimateStress(text), alerts: [res.error] });
      } else {
        setMessages((p) => [...p, { role: "assistant", text: res.reply }]);
        void speak(res.reply);
        addHistory({
          kind,
          language: lang,
          question: text,
          answer: res.reply,
          stress: estimateStress(text),
          suggestions: extractBullets(res.reply),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach assistant");
    } finally {
      setThinking(false);
    }
  }

  function startListening() {
    if (!supported) return;
    const SR = getSpeechRecognitionConstructor();
    if (!SR) return;
    const rec = new SR();
    rec.lang = bcp47For(lang);
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";

    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      setError(`Voice error: ${e.error ?? "unknown"}`);
      setListening(false);
      setInterim("");
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
      const text = finalText.trim();
      if (text) void sendToAI(text);
    };

    recognitionRef.current = rec;
    setError(null);
    setInterim("");
    setListening(true);
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader showBack />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-6">
        <div className="mb-4">
          <h1 className="font-display text-3xl font-bold text-foreground">{T.talk[lang]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ui.hint} · <span className="font-medium text-primary">{languageName(lang)}</span>
          </p>
        </div>

        {!supported && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {ui.notSupported}
          </div>
        )}

        {voiceWarning && (
          <div className="mb-4 rounded-xl border border-border bg-secondary p-4 text-sm text-secondary-foreground">
            {voiceWarning}
          </div>
        )}

        {!isVoiceSupportedLang(lang) && (
          <div className="mb-4 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            🔇 {ui.voiceNote}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6"
          style={{ minHeight: "320px", maxHeight: "55vh" }}
        >
          {messages.length === 0 && !listening && !thinking && (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-hero shadow-elegant">
                  <Mic className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{ui.tap}</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base ${
                  m.role === "user"
                    ? "bg-gradient-hero text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <div className="mb-1 text-xs font-semibold opacity-70">
                  {m.role === "user" ? ui.you : ui.sathi}
                </div>
                {m.role === "assistant" ? (
                  <>
                    <Markdown>{m.text}</Markdown>
                    {isVoiceSupportedLang(lang) && (
                      <button
                        onClick={() => speak(m.text)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Volume2 className="h-3.5 w-3.5" /> {ui.replay}
                      </button>
                    )}
                  </>
                ) : (
                  <p>{m.text}</p>
                )}
              </div>
            </div>
          ))}

          {interim && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-primary/20 px-4 py-3 text-sm italic text-foreground">
                {interim}
              </div>
            </div>
          )}

          {thinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {ui.thinking}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={listening ? stopListening : startListening}
            disabled={!supported || thinking}
            className={`group relative flex h-20 w-20 items-center justify-center rounded-full shadow-elegant transition-all disabled:opacity-50 ${
              listening
                ? "animate-pulse bg-destructive"
                : "bg-gradient-hero hover:scale-105"
            }`}
            aria-label={listening ? ui.stop : ui.speak}
          >
            {listening ? (
              <MicOff className="h-9 w-9 text-white" />
            ) : (
              <Mic className="h-9 w-9 text-primary-foreground" />
            )}
            {listening && (
              <span className="absolute -inset-2 animate-ping rounded-full bg-destructive/40" />
            )}
          </button>
          <p className="text-sm font-medium text-muted-foreground">
            {listening ? ui.listening : thinking ? ui.thinking : ui.tap}
          </p>
          {window.speechSynthesis?.speaking !== undefined && (
            <button
              onClick={stopSpeaking}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <Square className="h-3 w-3" /> {ui.stop}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
