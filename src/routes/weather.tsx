import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/use-language";
import { T, type LangCode } from "@/lib/i18n";
import { localizeNumber, localizeDigits, weatherCodeText, weekdayShort } from "@/lib/locale";
import { addHistory } from "@/lib/history";
import { CloudSun, Droplets, Wind, Loader2, MapPin, AlertTriangle, Sprout, ShieldCheck, CloudRain } from "lucide-react";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather — RaithaBandhu" },
      { name: "description", content: "Live weather, farming alerts and irrigation advice for your farm." },
    ],
  }),
  component: Weather,
});

const UI: Record<LangCode, {
  detecting: string; today: string; humidity: string; wind: string; forecast: string;
  locDenied: string; useLoc: string; kmh: string; rain: string; alerts: string;
  cropAdvice: string; risk: string; riskLow: string; riskMed: string; riskHigh: string;
  irrigation: string; selectCrop: string; mm: string; chanceRain: string;
}> = {
  en: { detecting: "Detecting your location…", today: "Today", humidity: "Humidity", wind: "Wind", forecast: "5-day forecast", locDenied: "Location access denied. Please enable location to see weather.", useLoc: "Allow location", kmh: "km/h", rain: "Rain", alerts: "Farming Alerts", cropAdvice: "Crop-Specific Suggestions", risk: "Crop Risk", riskLow: "Low", riskMed: "Medium", riskHigh: "High", irrigation: "Water & Irrigation Advice", selectCrop: "Select your crop", mm: "mm", chanceRain: "Chance of rain" },
  hi: { detecting: "आपका स्थान खोज रहे हैं…", today: "आज", humidity: "नमी", wind: "हवा", forecast: "५ दिन का पूर्वानुमान", locDenied: "स्थान की अनुमति नहीं मिली।", useLoc: "स्थान की अनुमति दें", kmh: "कि.मी/घं", rain: "बारिश", alerts: "कृषि चेतावनी", cropAdvice: "फसल अनुसार सुझाव", risk: "फसल जोखिम", riskLow: "कम", riskMed: "मध्यम", riskHigh: "उच्च", irrigation: "सिंचाई सलाह", selectCrop: "अपनी फसल चुनें", mm: "मि.मी", chanceRain: "बारिश की संभावना" },
  kn: { detecting: "ನಿಮ್ಮ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ…", today: "ಇಂದು", humidity: "ತೇವಾಂಶ", wind: "ಗಾಳಿ", forecast: "೫ ದಿನಗಳ ಮುನ್ಸೂಚನೆ", locDenied: "ಸ್ಥಳ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ.", useLoc: "ಸ್ಥಳ ಅನುಮತಿಸಿ", kmh: "ಕಿ.ಮೀ/ಗಂ", rain: "ಮಳೆ", alerts: "ಕೃಷಿ ಎಚ್ಚರಿಕೆಗಳು", cropAdvice: "ಬೆಳೆ-ನಿರ್ದಿಷ್ಟ ಸಲಹೆಗಳು", risk: "ಬೆಳೆ ಅಪಾಯ", riskLow: "ಕಡಿಮೆ", riskMed: "ಮಧ್ಯಮ", riskHigh: "ಹೆಚ್ಚು", irrigation: "ನೀರು ಮತ್ತು ನೀರಾವರಿ ಸಲಹೆ", selectCrop: "ನಿಮ್ಮ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ", mm: "ಮಿ.ಮೀ", chanceRain: "ಮಳೆಯ ಸಂಭವ" },
  te: { detecting: "మీ స్థానాన్ని గుర్తిస్తోంది…", today: "ఈరోజు", humidity: "తేమ", wind: "గాలి", forecast: "౫ రోజుల సూచన", locDenied: "స్థాన అనుమతి లేదు.", useLoc: "స్థానాన్ని అనుమతించండి", kmh: "కి.మీ/గం", rain: "వర్షం", alerts: "వ్యవసాయ హెచ్చరికలు", cropAdvice: "పంట ఆధారిత సూచనలు", risk: "పంట ప్రమాదం", riskLow: "తక్కువ", riskMed: "మధ్యమ", riskHigh: "ఎక్కువ", irrigation: "నీటి పారుదల సూచన", selectCrop: "మీ పంటను ఎంచుకోండి", mm: "మి.మీ", chanceRain: "వర్ష అవకాశం" },
  ta: { detecting: "உங்கள் இடத்தை கண்டறிகிறேன்…", today: "இன்று", humidity: "ஈரப்பதம்", wind: "காற்று", forecast: "௫ நாள் முன்னறிவிப்பு", locDenied: "இட அனுமதி மறுக்கப்பட்டது.", useLoc: "இடத்தை அனுமதி", kmh: "கி.மீ/ம", rain: "மழை", alerts: "விவசாய எச்சரிக்கைகள்", cropAdvice: "பயிர் சார்ந்த ஆலோசனை", risk: "பயிர் ஆபத்து", riskLow: "குறைவு", riskMed: "நடுத்தர", riskHigh: "அதிகம்", irrigation: "நீர்ப்பாசன ஆலோசனை", selectCrop: "உங்கள் பயிரை தேர்வுசெய்க", mm: "மி.மீ", chanceRain: "மழை வாய்ப்பு" },
};

const LOC_LANG: Record<LangCode, string> = { en: "en", hi: "hi", kn: "kn", te: "te", ta: "ta" };

type CropKey = "rice" | "wheat" | "cotton" | "sugarcane" | "tomato" | "onion" | "groundnut" | "maize";
const CROPS: Record<CropKey, Record<LangCode, string>> = {
  rice:      { en: "Rice", hi: "धान", kn: "ಭತ್ತ", te: "వరి", ta: "நெல்" },
  wheat:     { en: "Wheat", hi: "गेहूँ", kn: "ಗೋಧಿ", te: "గోధుమ", ta: "கோதுமை" },
  cotton:    { en: "Cotton", hi: "कपास", kn: "ಹತ್ತಿ", te: "పత్తి", ta: "பருத்தி" },
  sugarcane: { en: "Sugarcane", hi: "गन्ना", kn: "ಕಬ್ಬು", te: "చెరకు", ta: "கரும்பு" },
  tomato:    { en: "Tomato", hi: "टमाटर", kn: "ಟೊಮ್ಯಾಟೊ", te: "టమాట", ta: "தக்காளி" },
  onion:     { en: "Onion", hi: "प्याज", kn: "ಈರುಳ್ಳಿ", te: "ఉల్లి", ta: "வெங்காயம்" },
  groundnut: { en: "Groundnut", hi: "मूँगफली", kn: "ಶೇಂಗಾ", te: "వేరుశెనగ", ta: "நிலக்கடலை" },
  maize:     { en: "Maize", hi: "मक्का", kn: "ಮೆಕ್ಕೆಜೋಳ", te: "మొక్కజొన్న", ta: "மக்காச்சோளம்" },
};

type WeatherData = {
  current: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; precipitation: number };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; precipitation_probability_max: number[]; precipitation_sum: number[] };
};

type Risk = "low" | "med" | "high";

function buildAlerts(w: WeatherData, lang: LangCode): { icon: "rain" | "heat" | "wind" | "ok"; text: string }[] {
  const alerts: { icon: "rain" | "heat" | "wind" | "ok"; text: string }[] = [];
  const maxRain = Math.max(...w.daily.precipitation_sum.slice(0, 5));
  const maxRainProb = Math.max(...w.daily.precipitation_probability_max.slice(0, 5));
  const maxTemp = Math.max(...w.daily.temperature_2m_max.slice(0, 5));
  const wind = w.current.wind_speed_10m;

  if (maxRain >= 25 || maxRainProb >= 80) {
    alerts.push({ icon: "rain", text: ({
      en: "Heavy rain expected — avoid irrigation and pesticide spraying.",
      hi: "तेज़ बारिश की संभावना — सिंचाई और कीटनाशक छिड़काव टालें।",
      kn: "ಭಾರೀ ಮಳೆ ನಿರೀಕ್ಷೆ — ನೀರಾವರಿ ಮತ್ತು ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆ ತಪ್ಪಿಸಿ.",
      te: "భారీ వర్షం అంచనా — నీటిపారుదల, పురుగుమందుల పిచికారీని వాయిదా వేయండి.",
      ta: "கனமழை எதிர்பார்ப்பு — பாசனம் மற்றும் பூச்சிக்கொல்லி தெளிப்பை தவிர்க்கவும்.",
    } as Record<LangCode, string>)[lang] });
  }
  if (maxTemp >= 38) {
    alerts.push({ icon: "heat", text: ({
      en: "High temperature — risk of crop heat stress. Irrigate in early morning or evening.",
      hi: "उच्च तापमान — फसल पर तनाव का खतरा। सुबह जल्दी या शाम को सिंचाई करें।",
      kn: "ಹೆಚ್ಚಿನ ಉಷ್ಣತೆ — ಬೆಳೆಗೆ ಒತ್ತಡದ ಅಪಾಯ. ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀರಾವರಿ ಮಾಡಿ.",
      te: "అధిక ఉష్ణోగ్రత — పంటకు ఒత్తిడి ప్రమాదం. ఉదయం లేదా సాయంత్రం నీరు ఇవ్వండి.",
      ta: "அதிக வெப்பம் — பயிருக்கு அழுத்த ஆபத்து. அதிகாலை அல்லது மாலையில் பாசனம் செய்யவும்.",
    } as Record<LangCode, string>)[lang] });
  }
  if (wind >= 35) {
    alerts.push({ icon: "wind", text: ({
      en: "Strong winds — postpone spraying; secure young plants and trellises.",
      hi: "तेज़ हवा — छिड़काव टालें; युवा पौधों को सहारा दें।",
      kn: "ಬಲವಾದ ಗಾಳಿ — ಸಿಂಪಡಣೆ ಮುಂದೂಡಿ; ಎಳೆಯ ಸಸ್ಯಗಳನ್ನು ರಕ್ಷಿಸಿ.",
      te: "బలమైన గాలులు — పిచికారీ వాయిదా; లేత మొక్కలకు ఆధారం కల్పించండి.",
      ta: "பலத்த காற்று — தெளிப்பை தள்ளிவையுங்கள்; இளம் செடிகளை பாதுகாக்கவும்.",
    } as Record<LangCode, string>)[lang] });
  }
  if (alerts.length === 0) {
    alerts.push({ icon: "ok", text: ({
      en: "Weather is favourable for normal field operations.",
      hi: "मौसम सामान्य खेत कार्यों के लिए अनुकूल है।",
      kn: "ಸಾಮಾನ್ಯ ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಹವಾಮಾನ ಅನುಕೂಲಕರವಾಗಿದೆ.",
      te: "సాధారణ వ్యవసాయ పనులకు వాతావరణం అనుకూలంగా ఉంది.",
      ta: "சாதாரண வயல் வேலைகளுக்கு வானிலை சாதகமாக உள்ளது.",
    } as Record<LangCode, string>)[lang] });
  }
  return alerts;
}

function computeRisk(w: WeatherData): Risk {
  const maxRain = Math.max(...w.daily.precipitation_sum.slice(0, 5));
  const maxTemp = Math.max(...w.daily.temperature_2m_max.slice(0, 5));
  const minTemp = Math.min(...w.daily.temperature_2m_min.slice(0, 5));
  let score = 0;
  if (maxRain >= 50) score += 2; else if (maxRain >= 20) score += 1;
  if (maxTemp >= 40) score += 2; else if (maxTemp >= 36) score += 1;
  if (minTemp <= 8) score += 1;
  if (w.current.wind_speed_10m >= 35) score += 1;
  if (score >= 3) return "high";
  if (score >= 1) return "med";
  return "low";
}

function cropSuggestion(crop: CropKey, w: WeatherData, lang: LangCode): string {
  const maxRain = Math.max(...w.daily.precipitation_sum.slice(0, 3));
  const maxTemp = Math.max(...w.daily.temperature_2m_max.slice(0, 3));
  const wet = maxRain >= 15;
  const hot = maxTemp >= 36;

  const M: Record<CropKey, Record<"wet" | "hot" | "ok", Record<LangCode, string>>> = {
    rice: {
      wet: { en: "Good moisture for transplanting; avoid pesticide spraying for next 2 days.", hi: "रोपाई के लिए नमी अच्छी; अगले २ दिन कीटनाशक छिड़काव न करें।", kn: "ನಾಟಿಗೆ ತೇವಾಂಶ ಉತ್ತಮ; ೨ ದಿನ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಬೇಡಿ.", te: "నాట్లకు తేమ బాగుంది; ౨ రోజులు పురుగుమందులు పిచికారీ వద్దు.", ta: "நாற்று நடவுக்கு ஈரப்பதம் சிறந்தது; ௨ நாட்கள் பூச்சிக்கொல்லி தெளிக்க வேண்டாம்." },
      hot: { en: "Maintain 5 cm standing water; avoid midday operations.", hi: "५ सें.मी पानी बनाए रखें; दोपहर में काम न करें।", kn: "೫ ಸೆ.ಮೀ ನೀರು ಕಾಪಾಡಿಕೊಳ್ಳಿ; ಮಧ್ಯಾಹ್ನ ಕೆಲಸ ತಪ್ಪಿಸಿ.", te: "౫ సెం.మీ నీటిని ఉంచండి; మధ్యాహ్నం పనులు వద్దు.", ta: "௫ செ.மீ நீர்மட்டம் பராமரிக்கவும்; நண்பகலில் வேலை தவிர்க்கவும்." },
      ok:  { en: "Best time to sow/transplant; check for stem borer.", hi: "बुवाई/रोपाई के लिए अच्छा समय; तना भेदक की जाँच करें।", kn: "ಬಿತ್ತನೆ/ನಾಟಿಗೆ ಉತ್ತಮ ಸಮಯ; ಕಾಂಡ ಕೊರೆಯುವ ಹುಳ ಪರಿಶೀಲಿಸಿ.", te: "విత్తనాలు/నాట్లకు మంచి సమయం; కాండం తొలిచే పురుగును పరిశీలించండి.", ta: "விதைப்பு/நடவுக்கு சிறந்த நேரம்; தண்டு துளைப்பான் சரிபார்க்கவும்." },
    },
    wheat: {
      wet: { en: "Delay irrigation; risk of fungal rust after wet spell.", hi: "सिंचाई टालें; गीलेपन के बाद रतुआ रोग का खतरा।", kn: "ನೀರಾವರಿ ಮುಂದೂಡಿ; ತೇವದ ನಂತರ ತುಕ್ಕು ರೋಗದ ಅಪಾಯ.", te: "నీటిపారుదల వాయిదా; తేమ తర్వాత తుప్పు తెగులు ప్రమాదం.", ta: "பாசனத்தை தள்ளிவையுங்கள்; ஈரத்திற்குப் பின் துரு நோய் ஆபத்து." },
      hot: { en: "Avoid late irrigation in heat; grain filling may be affected.", hi: "गर्मी में देर से सिंचाई से बचें; दाना भरने पर असर।", kn: "ಬಿಸಿಲಿನಲ್ಲಿ ತಡವಾದ ನೀರಾವರಿ ಬೇಡ; ಕಾಳು ತುಂಬುವಿಕೆಗೆ ತೊಂದರೆ.", te: "వేడిలో ఆలస్య నీరు వద్దు; గింజ నింపుదలపై ప్రభావం.", ta: "வெப்பத்தில் தாமத பாசனம் வேண்டாம்; தானிய நிரம்பல் பாதிக்கப்படும்." },
      ok:  { en: "Good window for irrigation and top-dressing of urea.", hi: "सिंचाई व यूरिया टॉप-ड्रेसिंग के लिए अच्छा समय।", kn: "ನೀರಾವರಿ ಮತ್ತು ಯೂರಿಯಾ ಮೇಲ್ಗೊಬ್ಬರಕ್ಕೆ ಉತ್ತಮ ಸಮಯ.", te: "నీటిపారుదల, యూరియా టాప్‌డ్రెస్‌కు మంచి సమయం.", ta: "பாசனம் மற்றும் யூரியா மேல் உரத்திற்கு சிறந்த நேரம்." },
    },
    cotton: {
      wet: { en: "Ensure drainage; watch for boll rot in heavy rain.", hi: "जल निकासी सुनिश्चित करें; तेज़ बारिश में बोल रोट का खतरा।", kn: "ನೀರು ಬಸಿಯುವಂತೆ ಮಾಡಿ; ಭಾರೀ ಮಳೆಯಲ್ಲಿ ಬೋಲ್ ಕೊಳೆ.", te: "నీటి నిష్కాసన చూడండి; భారీ వర్షంలో బోల్ కుళ్ళు.", ta: "நீர் வடிகால் உறுதிசெய்யவும்; கனமழையில் பஞ்சு கூடு அழுகல்." },
      hot: { en: "Irrigate at flowering; mulch to retain moisture.", hi: "फूल आने पर सिंचाई; मल्चिंग करें।", kn: "ಹೂ ಬಿಡುವಾಗ ನೀರಾವರಿ; ಮಲ್ಚಿಂಗ್ ಮಾಡಿ.", te: "పూత సమయంలో నీరు; మల్చింగ్ చేయండి.", ta: "பூக்கும் நேரத்தில் பாசனம்; மல்ச்சிங் செய்யவும்." },
      ok:  { en: "Scout for whitefly and pink bollworm.", hi: "व्हाइटफ्लाई व गुलाबी सूंडी की निगरानी।", kn: "ಬಿಳಿನೊಣ ಮತ್ತು ಗುಲಾಬಿ ಕಾಯಿಕೊರಕ ಪರಿಶೀಲಿಸಿ.", te: "తెల్లదోమ, గులాబీ కాయతొలుచు పురుగును గమనించండి.", ta: "வெள்ளை ஈ மற்றும் இளஞ்சிவப்பு காய்ப்புழுவை கண்காணிக்கவும்." },
    },
    sugarcane: {
      wet: { en: "Avoid irrigation; ensure field drainage.", hi: "सिंचाई न करें; जल निकासी सुनिश्चित करें।", kn: "ನೀರಾವರಿ ಬೇಡ; ಬಸಿಯುವಿಕೆ ಮಾಡಿ.", te: "నీరు వద్దు; నిష్కాసన చూడండి.", ta: "பாசனம் வேண்டாம்; வடிகால் உறுதிசெய்யவும்." },
      hot: { en: "Increase irrigation frequency; trash mulching helps.", hi: "सिंचाई की आवृत्ति बढ़ाएँ; ट्रैश मल्चिंग करें।", kn: "ನೀರಾವರಿ ಆವರ್ತನ ಹೆಚ್ಚಿಸಿ; ಟ್ರ್ಯಾಶ್ ಮಲ್ಚಿಂಗ್ ಮಾಡಿ.", te: "నీటి తరచుదనాన్ని పెంచండి; ట్రాష్ మల్చింగ్.", ta: "பாசன அதிர்வெண்ணை அதிகரிக்கவும்; ட்ராஷ் மல்ச்சிங் செய்யவும்." },
      ok:  { en: "Apply earthing-up and second dose of nitrogen.", hi: "मिट्टी चढ़ाएँ व नाइट्रोजन की दूसरी खुराक दें।", kn: "ಮಣ್ಣು ಏರಿಸಿ ಮತ್ತು ಎರಡನೇ ಸಾರಜನಕ ಡೋಸ್ ನೀಡಿ.", te: "మట్టి ఎక్కించండి, రెండవ నత్రజని మోతాదు ఇవ్వండి.", ta: "மண் ஏற்றி இரண்டாம் தவணை நைட்ரஜன் கொடுக்கவும்." },
    },
    tomato: {
      wet: { en: "Risk of blight — apply preventive copper spray after rain.", hi: "ब्लाइट का खतरा — बारिश के बाद कॉपर स्प्रे करें।", kn: "ಬ್ಲೈಟ್ ಅಪಾಯ — ಮಳೆ ನಂತರ ಕಾಪರ್ ಸಿಂಪಡಿಸಿ.", te: "బ్లైట్ ప్రమాదం — వర్షం తర్వాత కాపర్ స్ప్రే.", ta: "கருகல் ஆபத்து — மழைக்குப் பின் காப்பர் தெளிப்பு." },
      hot: { en: "Mulch and irrigate twice a day; flowers may drop.", hi: "मल्च करें, दिन में दो बार सिंचाई; फूल झड़ सकते हैं।", kn: "ಮಲ್ಚ್ ಮಾಡಿ, ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ನೀರಾವರಿ; ಹೂ ಉದುರಬಹುದು.", te: "మల్చింగ్, రోజుకు రెండు సార్లు నీరు; పూలు రాలవచ్చు.", ta: "மல்ச்சிங், நாளில் இரண்டு முறை பாசனம்; பூக்கள் உதிரக்கூடும்." },
      ok:  { en: "Stake plants; remove suckers for better fruit set.", hi: "पौधों को सहारा दें; सकर हटाएँ।", kn: "ಸಸ್ಯಗಳಿಗೆ ಸ್ಟೇಕ್; ಸಕ್ಕರ್ ತೆಗೆಯಿರಿ.", te: "మొక్కలకు ఆధారం; సకర్లు తొలగించండి.", ta: "செடிகளுக்கு கம்பு; சக்கர்களை அகற்றவும்." },
    },
    onion: {
      wet: { en: "Wet conditions invite purple blotch — improve drainage.", hi: "गीलेपन में पर्पल ब्लॉच — जल निकासी बढ़ाएँ।", kn: "ತೇವದಲ್ಲಿ ಪರ್ಪಲ್ ಬ್ಲಾಚ್ — ನೀರು ಬಸಿಯುವಿಕೆ ಸುಧಾರಿಸಿ.", te: "తేమలో పర్పుల్ బ్లాచ్ — నిష్కాసన మెరుగుపరచండి.", ta: "ஈரத்தில் ஊதா புள்ளி — வடிகாலை மேம்படுத்தவும்." },
      hot: { en: "Light frequent irrigation; avoid water stress at bulb stage.", hi: "हल्की लगातार सिंचाई; बल्ब अवस्था में पानी की कमी न हो।", kn: "ಲಘು ಆಗಾಗ ನೀರಾವರಿ; ಗಡ್ಡೆ ಹಂತದಲ್ಲಿ ಒತ್ತಡ ಬೇಡ.", te: "తేలికపాటి తరచుగా నీరు; గడ్డ దశలో ఒత్తిడి వద్దు.", ta: "லேசான அடிக்கடி பாசனம்; கிழங்கு கட்டத்தில் தண்ணீர் பற்றாக்குறை வேண்டாம்." },
      ok:  { en: "Good time for weeding and top-dressing.", hi: "निराई व टॉप-ड्रेसिंग का अच्छा समय।", kn: "ಕಳೆ ತೆಗೆಯುವಿಕೆ ಮತ್ತು ಮೇಲ್ಗೊಬ್ಬರಕ್ಕೆ ಉತ್ತಮ ಸಮಯ.", te: "కలుపు తీత, టాప్‌డ్రెస్‌కు మంచి సమయం.", ta: "களையெடுத்தல் மற்றும் மேல் உரத்திற்கு சிறந்த நேரம்." },
    },
    groundnut: {
      wet: { en: "Avoid irrigation; risk of pod rot in waterlogged fields.", hi: "सिंचाई न करें; जलभराव से फली सड़न का खतरा।", kn: "ನೀರಾವರಿ ಬೇಡ; ನೀರು ನಿಂತರೆ ಶೇಂಗಾ ಕೊಳೆ.", te: "నీరు వద్దు; నీరు నిలిస్తే కాయ కుళ్ళు.", ta: "பாசனம் வேண்டாம்; நீர் தேங்கினால் காய் அழுகல்." },
      hot: { en: "Irrigate at pegging and pod-filling stages.", hi: "पेगिंग व फली भरने पर सिंचाई करें।", kn: "ಪೆಗ್ಗಿಂಗ್ ಮತ್ತು ಕಾಯಿ ತುಂಬುವಾಗ ನೀರಾವರಿ.", te: "పెగ్గింగ్, కాయ నింపుదల దశల్లో నీరు.", ta: "பெக்கிங் மற்றும் காய் நிரம்பும் கட்டத்தில் பாசனம்." },
      ok:  { en: "Apply gypsum at flowering for better pod fill.", hi: "फूल आने पर जिप्सम डालें।", kn: "ಹೂ ಬಿಡುವಾಗ ಜಿಪ್ಸಮ್ ಹಾಕಿ.", te: "పూత సమయంలో జిప్సం వేయండి.", ta: "பூக்கும்போது ஜிப்சம் இடவும்." },
    },
    maize: {
      wet: { en: "Ensure drainage; watch for fall armyworm after rain.", hi: "जल निकासी रखें; बारिश के बाद फॉल आर्मीवर्म पर नज़र।", kn: "ನೀರು ಬಸಿಯುವಿಕೆ; ಮಳೆ ನಂತರ ಫಾಲ್ ಆರ್ಮಿವರ್ಮ್ ಗಮನಿಸಿ.", te: "నిష్కాసన; వర్షం తర్వాత ఫాల్ ఆర్మీవార్మ్ గమనించండి.", ta: "வடிகால்; மழைக்குப் பின் ஃபால் ஆர்மிவார்ம் கவனிக்கவும்." },
      hot: { en: "Critical irrigation at tasseling and silking stages.", hi: "टैसलिंग व सिल्किंग पर महत्वपूर्ण सिंचाई।", kn: "ಟ್ಯಾಸಲಿಂಗ್ ಮತ್ತು ಸಿಲ್ಕಿಂಗ್ ಸಮಯದಲ್ಲಿ ಪ್ರಮುಖ ನೀರಾವರಿ.", te: "టాసలింగ్, సిల్కింగ్‌లో కీలక నీరు.", ta: "டாசலிங் மற்றும் சில்க்கிங் கட்டத்தில் முக்கிய பாசனம்." },
      ok:  { en: "Apply second dose of nitrogen at knee-high stage.", hi: "घुटने ऊँचाई पर नाइट्रोजन की दूसरी खुराक।", kn: "ಮೊಣಕಾಲು ಎತ್ತರದಲ್ಲಿ ಎರಡನೇ ಸಾರಜನಕ ಡೋಸ್.", te: "మోకాలు ఎత్తు దశలో రెండవ నత్రజని మోతాదు.", ta: "முழங்கால் உயரத்தில் இரண்டாம் நைட்ரஜன் தவணை." },
    },
  };
  const key: "wet" | "hot" | "ok" = wet ? "wet" : hot ? "hot" : "ok";
  return M[crop][key][lang];
}

function irrigationAdvice(w: WeatherData, lang: LangCode): string {
  const next2Rain = (w.daily.precipitation_sum[0] ?? 0) + (w.daily.precipitation_sum[1] ?? 0);
  const next2Prob = Math.max(w.daily.precipitation_probability_max[0] ?? 0, w.daily.precipitation_probability_max[1] ?? 0);
  const hot = w.current.temperature_2m >= 35;
  const dryHumid = w.current.relative_humidity_2m < 40;

  if (next2Rain >= 15 || next2Prob >= 70) {
    return ({
      en: "Rain expected in next 48 hours — skip irrigation today.",
      hi: "अगले ४८ घंटे में बारिश की संभावना — आज सिंचाई न करें।",
      kn: "ಮುಂದಿನ ೪೮ ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆ — ಇಂದು ನೀರಾವರಿ ಬೇಡ.",
      te: "౪౮ గంటల్లో వర్షం — ఈరోజు నీరు వద్దు.",
      ta: "௪௮ மணி நேரத்தில் மழை — இன்று பாசனம் வேண்டாம்.",
    } as Record<LangCode, string>)[lang];
  }
  if (hot && dryHumid) {
    return ({
      en: "Hot and dry — increase watering; irrigate at dawn or dusk.",
      hi: "गर्म व शुष्क — पानी बढ़ाएँ; सुबह या शाम सिंचाई करें।",
      kn: "ಬಿಸಿ ಮತ್ತು ಒಣ — ನೀರು ಹೆಚ್ಚಿಸಿ; ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀರಾವರಿ.",
      te: "వేడి, పొడి — నీరు పెంచండి; ఉదయం/సాయంత్రం నీరు ఇవ్వండి.",
      ta: "வெப்பம், உலர்வு — நீர் அதிகரிக்கவும்; அதிகாலை/மாலையில் பாசனம்.",
    } as Record<LangCode, string>)[lang];
  }
  return ({
    en: "Soil moisture should be adequate — normal irrigation schedule.",
    hi: "मिट्टी की नमी पर्याप्त — सामान्य सिंचाई कार्यक्रम।",
    kn: "ಮಣ್ಣಿನ ತೇವಾಂಶ ಸಾಕಷ್ಟು — ಸಾಮಾನ್ಯ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ.",
    te: "మట్టి తేమ సరిపోతుంది — సాధారణ నీటి షెడ్యూల్.",
    ta: "மண் ஈரப்பதம் போதுமானது — சாதாரண பாசன அட்டவணை.",
  } as Record<LangCode, string>)[lang];
}

function Weather() {
  const [lang] = useLanguage();
  const ui = UI[lang];
  const [coords, setCoords] = useState<{ lat: number; lon: number; name?: string } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropKey>("rice");

  function requestLoc() {
    setError(null);
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name: string | undefined;
        const langTag = LOC_LANG[lang];
        try {
          const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=${langTag}&format=json`);
          if (r.ok) {
            const j = await r.json();
            const top = j?.results?.[0];
            if (top) name = [top.name, top.admin1].filter(Boolean).join(", ");
          }
        } catch { /* ignore */ }
        if (!name) {
          try {
            const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${langTag}`);
            if (r.ok) {
              const j = await r.json();
              const city = j?.city || j?.locality || j?.localityInfo?.administrative?.[3]?.name;
              const region = j?.principalSubdivision;
              name = [city, region].filter(Boolean).join(", ") || undefined;
            }
          } catch { /* ignore */ }
        }
        setCoords({ lat: latitude, lon: longitude, name });
      },
      (err) => {
        setError(err?.message ? `${ui.locDenied} (${err.message})` : ui.locDenied);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  useEffect(() => { requestLoc(); /* eslint-disable-next-line */ }, [lang]);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=5`)
      .then((r) => r.json())
      .then((d) => { setWeather(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [coords]);

  const alerts = useMemo(() => weather ? buildAlerts(weather, lang) : [], [weather, lang]);
  const risk = useMemo<Risk | null>(() => weather ? computeRisk(weather) : null, [weather]);
  const suggestion = useMemo(() => weather ? cropSuggestion(crop, weather, lang) : "", [crop, weather, lang]);
  const irrigation = useMemo(() => weather ? irrigationAdvice(weather, lang) : "", [weather, lang]);

  // Log a single history entry per weather load
  useEffect(() => {
    if (!weather || !risk) return;
    const realAlerts = alerts.filter((a) => a.icon !== "ok").map((a) => a.text);
    addHistory({
      kind: "weather",
      language: lang,
      question: coords?.name || "Current location",
      answer: irrigation,
      stress: risk === "high" ? "high" : risk === "med" ? "medium" : "low",
      alerts: realAlerts,
      suggestions: [suggestion].filter(Boolean),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.current?.temperature_2m, risk, lang, crop]);

  const riskColor = risk === "high" ? "bg-destructive text-destructive-foreground" : risk === "med" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white";
  const riskLabel = risk === "high" ? ui.riskHigh : risk === "med" ? ui.riskMed : ui.riskLow;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBack />
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">{T.weather[lang]}</h1>
          {coords?.name && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {coords.name}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-2xl bg-card p-6 shadow-soft">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> <span>{ui.detecting}</span>
          </div>
        )}

        {error && !weather && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={requestLoc} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {ui.useLoc}
            </button>
          </div>
        )}

        {weather && (
          <div className="space-y-6">
            {/* Current weather */}
            <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium opacity-80">{ui.today}</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="font-display text-6xl font-bold md:text-7xl">{localizeNumber(weather.current.temperature_2m, lang)}°</span>
                    <CloudSun className="mb-2 h-12 w-12 opacity-80" />
                  </div>
                  <p className="mt-2 text-lg opacity-90">{weatherCodeText(weather.current.weather_code, lang)}</p>
                </div>
                {risk && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${riskColor}`}>
                    <ShieldCheck className="h-3.5 w-3.5" /> {ui.risk}: {riskLabel}
                  </span>
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs opacity-80"><Droplets className="h-4 w-4" /> {ui.humidity}</div>
                  <div className="mt-1 text-xl font-semibold">{localizeNumber(weather.current.relative_humidity_2m, lang)}%</div>
                </div>
                <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs opacity-80"><Wind className="h-4 w-4" /> {ui.wind}</div>
                  <div className="mt-1 text-xl font-semibold">{localizeNumber(weather.current.wind_speed_10m, lang, 1)} {ui.kmh}</div>
                </div>
                <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs opacity-80"><CloudRain className="h-4 w-4" /> {ui.rain}</div>
                  <div className="mt-1 text-xl font-semibold">{localizeNumber(weather.current.precipitation ?? 0, lang, 1)} {ui.mm}</div>
                </div>
              </div>
            </div>

            {/* Farming alerts */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> {ui.alerts}
              </h2>
              <ul className="space-y-2">
                {alerts.map((a, i) => (
                  <li key={i} className={`rounded-lg border p-3 text-sm ${a.icon === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200" : a.icon === "rain" ? "border-blue-500/30 bg-blue-500/10" : a.icon === "heat" ? "border-orange-500/30 bg-orange-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Crop-specific suggestions */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Sprout className="h-5 w-5 text-emerald-600" /> {ui.cropAdvice}
              </h2>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">{ui.selectCrop}</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value as CropKey)}
                className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {(Object.keys(CROPS) as CropKey[]).map((k) => (
                  <option key={k} value={k}>{CROPS[k][lang]}</option>
                ))}
              </select>
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">{suggestion}</p>
            </div>

            {/* Irrigation advice */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Droplets className="h-5 w-5 text-blue-500" /> {ui.irrigation}
              </h2>
              <p className="rounded-lg bg-blue-500/10 p-3 text-sm text-foreground">{irrigation}</p>
            </div>

            {/* 5-day forecast */}
            <div>
              <h2 className="mb-3 font-display text-xl font-semibold text-foreground">{ui.forecast}</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {weather.daily.time.slice(0, 5).map((day, i) => (
                  <div key={day} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {weekdayShort(new Date(day), lang)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{weatherCodeText(weather.daily.weather_code[i], lang)}</div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-foreground">{localizeNumber(weather.daily.temperature_2m_max[i], lang)}°</span>
                      <span className="text-sm text-muted-foreground">/ {localizeNumber(weather.daily.temperature_2m_min[i], lang)}°</span>
                    </div>
                    <div className="mt-1 text-xs text-primary">💧 {localizeDigits(weather.daily.precipitation_probability_max[i] ?? 0, lang)}%</div>
                    <div className="mt-1 text-xs text-muted-foreground">{localizeNumber(weather.daily.precipitation_sum[i] ?? 0, lang, 1)} {ui.mm}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
