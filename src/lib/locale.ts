import type { LangCode } from "./i18n";

const DIGITS: Record<LangCode, string[]> = {
  en: ["0","1","2","3","4","5","6","7","8","9"],
  hi: ["०","१","२","३","४","५","६","७","८","९"],
  kn: ["೦","೧","೨","೩","೪","೫","೬","೭","೮","೯"],
  te: ["౦","౧","౨","౩","౪","౫","౬","౭","౮","౯"],
  ta: ["௦","௧","௨","௩","௪","௫","௬","௭","௮","௯"],
};

/** Replace ASCII digits in any string with the script digits for the given language. */
export function localizeDigits(input: string | number, lang: LangCode): string {
  const s = String(input);
  const map = DIGITS[lang];
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

/** Format an integer/number with localized digits (rounded to given decimals). */
export function localizeNumber(n: number, lang: LangCode, decimals = 0): string {
  const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
  return localizeDigits(fixed, lang);
}

/** Indian rupee with localized digits, e.g. ₹೨,೫೦೦. */
export function localizeCurrency(n: number, lang: LangCode): string {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  return "₹" + localizeDigits(formatted, lang);
}

/** Weather code → translated label */
const WEATHER: Record<number, Record<LangCode, string>> = {
  0:  { en: "Clear sky",    hi: "साफ आसमान",    kn: "ಸ್ವಚ್ಛ ಆಕಾಶ",    te: "స్వచ్ఛమైన ఆకాశం", ta: "தெளிவான வானம்" },
  1:  { en: "Mostly clear", hi: "ज़्यादातर साफ", kn: "ಹೆಚ್ಚಾಗಿ ಸ್ವಚ್ಛ", te: "ఎక్కువగా స్వచ్ఛం", ta: "பெரும்பாலும் தெளிவு" },
  2:  { en: "Partly cloudy", hi: "आंशिक बादल",  kn: "ಭಾಗಶಃ ಮೋಡ",     te: "పాక్షికంగా మేఘావృతం", ta: "பகுதி மேகமூட்டம்" },
  3:  { en: "Overcast",     hi: "घने बादल",      kn: "ಸಂಪೂರ್ಣ ಮೋಡ",  te: "మేఘావృతం", ta: "முழு மேகமூட்டம்" },
  45: { en: "Fog",          hi: "कोहरा",         kn: "ಮಂಜು",           te: "పొగమంచు", ta: "மூடுபனி" },
  48: { en: "Fog",          hi: "कोहरा",         kn: "ಮಂಜು",           te: "పొగమంచు", ta: "மூடுபனி" },
  51: { en: "Light drizzle", hi: "हल्की बूंदाबांदी", kn: "ಲಘು ತುಂತುರು", te: "తేలికపాటి జల్లు", ta: "லேசான தூறல்" },
  53: { en: "Drizzle",      hi: "बूंदाबांदी",     kn: "ತುಂತುರು",        te: "జల్లు", ta: "தூறல்" },
  55: { en: "Heavy drizzle", hi: "तेज़ बूंदाबांदी", kn: "ಭಾರೀ ತುಂತುರು", te: "భారీ జల్లు", ta: "கனமான தூறல்" },
  61: { en: "Light rain",   hi: "हल्की बारिश",    kn: "ಲಘು ಮಳೆ",        te: "తేలికపాటి వర్షం", ta: "லேசான மழை" },
  63: { en: "Rain",         hi: "बारिश",          kn: "ಮಳೆ",             te: "వర్షం", ta: "மழை" },
  65: { en: "Heavy rain",   hi: "तेज़ बारिश",     kn: "ಭಾರೀ ಮಳೆ",       te: "భారీ వర్షం", ta: "கனமழை" },
  71: { en: "Light snow",   hi: "हल्की बर्फ",     kn: "ಲಘು ಹಿಮ",        te: "తేలికపాటి మంచు", ta: "லேசான பனி" },
  73: { en: "Snow",         hi: "बर्फ",           kn: "ಹಿಮ",             te: "మంచు", ta: "பனி" },
  80: { en: "Rain showers", hi: "बौछारें",        kn: "ಮಳೆ ಸಿಂಚನ",      te: "వర్ష జల్లులు", ta: "மழை சாரல்" },
  81: { en: "Heavy showers", hi: "तेज़ बौछारें",  kn: "ಭಾರೀ ಸಿಂಚನ",     te: "భారీ జల్లులు", ta: "கனமான சாரல்" },
  82: { en: "Violent showers", hi: "बहुत तेज़ बौछारें", kn: "ತೀವ್ರ ಸಿಂಚನ", te: "తీవ్ర జల్లులు", ta: "கடும் சாரல்" },
  95: { en: "Thunderstorm", hi: "गरज के साथ",     kn: "ಗುಡುಗು ಮಳೆ",     te: "ఉరుములతో వర్షం", ta: "இடி மழை" },
  96: { en: "Thunderstorm + hail", hi: "गरज + ओले", kn: "ಗುಡುಗು + ಆಲಿಕಲ್ಲು", te: "ఉరుములు + వడగళ్ళు", ta: "இடி + ஆலங்கட்டி" },
  99: { en: "Severe thunderstorm", hi: "तेज़ गरज", kn: "ತೀವ್ರ ಗುಡುಗು", te: "తీవ్ర ఉరుములు", ta: "கடும் இடிமழை" },
};

export function weatherCodeText(code: number, lang: LangCode): string {
  return WEATHER[code]?.[lang] ?? "—";
}

const WEEKDAYS: Record<LangCode, string[]> = {
  // Sun..Sat
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  hi: ["रवि","सोम","मंगल","बुध","गुरु","शुक्र","शनि"],
  kn: ["ಭಾನು","ಸೋಮ","ಮಂಗಳ","ಬುಧ","ಗುರು","ಶುಕ್ರ","ಶನಿ"],
  te: ["ఆది","సోమ","మంగళ","బుధ","గురు","శుక్ర","శని"],
  ta: ["ஞாயி","திங்","செவ்","புத","வியா","வெள்","சனி"],
};

export function weekdayShort(date: Date, lang: LangCode): string {
  return WEEKDAYS[lang][date.getDay()];
}

/** Locale tag for Intl APIs. */
export function intlLocale(lang: LangCode): string {
  return ({ en: "en-IN", hi: "hi-IN", kn: "kn-IN", te: "te-IN", ta: "ta-IN" } as const)[lang];
}
