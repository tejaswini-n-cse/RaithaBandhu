export type LangCode = "en" | "hi" | "kn" | "te" | "ta";

export const LANGUAGES: { code: LangCode; label: string; native: string; bcp47: string }[] = [
  { code: "en", label: "English", native: "English", bcp47: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", bcp47: "hi-IN" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", bcp47: "kn-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", bcp47: "te-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", bcp47: "ta-IN" },
];

export const T = {
  appName: { en: "RaithaBandhu", hi: "रैतबन्धु", kn: "ರೈತಬಂಧು", te: "రైతబంధు", ta: "ரைதபந்து" },
  tagline: {
    en: "Your AI companion for smarter farming",
    hi: "स्मार्ट खेती के लिए आपका एआई साथी",
    kn: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿಗೆ ನಿಮ್ಮ AI ಸಂಗಾತಿ",
    te: "స్మార్ట్ వ్యవసాయానికి మీ AI సహచరుడు",
    ta: "புத்திசாலி விவசாயத்துக்கான உங்கள் AI துணை",
  },
  talk: { en: "Talk to Us", hi: "हमसे बात करें", kn: "ನಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಿ", te: "మాతో మాట్లాడండి", ta: "எங்களிடம் பேசுங்கள்" },
  weather: { en: "Weather", hi: "मौसम", kn: "ಹವಾಮಾನ", te: "వాతావరణం", ta: "வானிலை" },
  crop: { en: "Crop Health", hi: "फसल स्वास्थ्य", kn: "ಬೆಳೆ ಆರೋಗ್ಯ", te: "పంట ఆరోగ్యం", ta: "பயிர் ஆரோக்கியம்" },
  market: { en: "Market Prices", hi: "बाजार भाव", kn: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ", te: "మార్కెట్ ధరలు", ta: "சந்தை விலை" },
  schemes: { en: "Govt Schemes", hi: "सरकारी योजनाएँ", kn: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು", te: "ప్రభుత్వ పథకాలు", ta: "அரசு திட்டங்கள்" },
  history: { en: "History", hi: "इतिहास", kn: "ಇತಿಹಾಸ", te: "చరిత్ర", ta: "வரலாறு" },
  language: { en: "Language", hi: "भाषा", kn: "ಭಾಷೆ", te: "భాష", ta: "மொழி" },
  back: { en: "← Back", hi: "← वापस", kn: "← ಹಿಂದೆ", te: "← వెనుకకు", ta: "← பின்" },
} as const;

const LS_KEY = "krishi-lang";

export function getStoredLang(): LangCode {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(LS_KEY);
  if (v && ["en", "hi", "kn", "te", "ta"].includes(v)) return v as LangCode;
  return "en";
}

export function setStoredLang(code: LangCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, code);
  window.dispatchEvent(new CustomEvent("krishi-lang-change", { detail: code }));
}

export function bcp47For(code: LangCode): string {
  return LANGUAGES.find((l) => l.code === code)?.bcp47 ?? "en-IN";
}

export function languageName(code: LangCode): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}
