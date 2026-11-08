import { bcp47For, type LangCode } from "./i18n";

/** Strip markdown so TTS doesn't read "asterisk asterisk". */
export function stripMarkdown(input: string): string {
  if (!input) return "";
  let s = input;
  // Code blocks & inline code
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/`([^`]*)`/g, "$1");
  // Images ![alt](url) -> alt
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Links [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Headings, blockquotes, list bullets
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  s = s.replace(/^\s{0,3}>\s?/gm, "");
  s = s.replace(/^\s*[-*+]\s+/gm, "");
  s = s.replace(/^\s*\d+\.\s+/gm, "");
  // Bold/italic/strike: **x** *x* __x__ _x_ ~~x~~
  s = s.replace(/(\*\*|__)(.*?)\1/g, "$2");
  s = s.replace(/(\*|_)(.*?)\1/g, "$2");
  s = s.replace(/~~(.*?)~~/g, "$1");
  // Tables: drop pipes & separator rows
  s = s.replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/gm, "");
  s = s.replace(/\|/g, " ");
  // Stray markdown chars
  s = s.replace(/[*_`#>]/g, "");
  // Collapse whitespace
  s = s.replace(/\n{2,}/g, ". ").replace(/\s+/g, " ").trim();
  return s;
}

/** Languages with enabled voice output. Other languages are text-only. */
export const VOICE_ENABLED_LANGS: LangCode[] = ["en", "hi"];

export function isVoiceSupportedLang(code: LangCode): boolean {
  return VOICE_ENABLED_LANGS.includes(code);
}

export type SpeechResult = {
  ok: boolean;
  reason?: "unsupported" | "empty" | "missing-voice" | "speech-error";
  message?: string;
};

function normalizeLang(value = "") {
  return value.toLowerCase().replace("_", "-");
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const v = synth.getVoices();
    if (v && v.length) return resolve(v);
    const handler = () => {
      synth.removeEventListener("voiceschanged", handler);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", handler);
    // Fallback timeout
    setTimeout(() => resolve(synth.getVoices()), 1200);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], code: LangCode): SpeechSynthesisVoice | undefined {
  const target = normalizeLang(bcp47For(code));
  const prefix = code.toLowerCase();
  const languageNames: Record<LangCode, string[]> = {
    en: ["english"],
    hi: ["hindi", "हिन्दी", "हिंदी"],
    kn: ["kannada", "ಕನ್ನಡ", "kn-in"],
    te: ["telugu", "తెలుగు"],
    ta: ["tamil", "தமிழ்"],
  };
  return (
    voices.find((v) => normalizeLang(v.lang) === target) ||
    voices.find((v) => normalizeLang(v.lang).startsWith(prefix + "-")) ||
    voices.find((v) => normalizeLang(v.lang).startsWith(prefix)) ||
    voices.find((v) => languageNames[code].some((name) => `${v.name} ${v.voiceURI}`.toLowerCase().includes(name.toLowerCase())))
  );
}

function splitForSpeech(text: string) {
  const sentences = text.match(/[^.!?।。]+[.!?।。]?/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = `${current} ${sentence}`.trim();
    if (next.length > 180 && current) {
      chunks.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function hasVoiceForLanguage(code: LangCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return Boolean(pickVoice(await loadVoices(), code));
}

export async function getVoiceInfo(code: LangCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return { supported: false, voice: null, allVoices: [] as { name: string; lang: string }[] };
  }
  const voices = await loadVoices();
  const picked = pickVoice(voices, code);
  return {
    supported: true,
    voice: picked ? { name: picked.name, lang: picked.lang, voiceURI: picked.voiceURI } : null,
    allVoices: voices.map((v) => ({ name: v.name, lang: v.lang })),
  };
}

export async function speakText(text: string, code: LangCode): Promise<SpeechResult> {
  if (typeof window === "undefined" || !window.speechSynthesis) return { ok: false, reason: "unsupported" };
  if (!isVoiceSupportedLang(code)) return { ok: false, reason: "unsupported" };
  const clean = stripMarkdown(text);
  if (!clean) return { ok: false, reason: "empty" };
  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = await loadVoices();
  const voice = pickVoice(voices, code);
  if (!voice && code !== "en") {
    return {
      ok: false,
      reason: "missing-voice",
      message: "A text-to-speech voice for this language is not installed in this browser/device.",
    };
  }

  const chunks = splitForSpeech(clean);
  return new Promise((resolve) => {
    let index = 0;
    let finished = false;
    const keepAlive = window.setInterval(() => synth.resume(), 5000);

    const finish = (result: SpeechResult) => {
      if (finished) return;
      finished = true;
      window.clearInterval(keepAlive);
      resolve(result);
    };

    const speakChunk = () => {
      const utter = new SpeechSynthesisUtterance(chunks[index]);
      utter.lang = voice?.lang || bcp47For(code);
      utter.rate = code === "kn" ? 0.86 : 0.95;
      utter.pitch = 1;
      if (voice) utter.voice = voice;
      utter.onend = () => {
        index += 1;
        if (index < chunks.length) speakChunk();
        else finish({ ok: true });
      };
      utter.onerror = () => finish({ ok: false, reason: "speech-error" });
      synth.speak(utter);
      synth.resume();
    };

    speakChunk();
  });
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}
