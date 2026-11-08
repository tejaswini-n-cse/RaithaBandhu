import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/use-language";
import { T, type LangCode } from "@/lib/i18n";
import heroFarm from "@/assets/hero-farm.jpg";
import { Mic, CloudSun, Leaf, TrendingUp, Landmark } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RaithaBandhu — Voice-first farming assistant" },
      { name: "description", content: "Ask farming questions by voice, diagnose crop diseases, check weather, market prices and government schemes — all in your language." },
    ],
  }),
  component: Home,
});

const HERO_TEXT: Record<LangCode, { welcome: string; sub: string; cta: string }> = {
  en: { welcome: "Welcome, farmer", sub: "Ask anything about your crop, weather, market or government help — by voice, in your language.", cta: "Start Talking" },
  hi: { welcome: "स्वागत है, किसान भाई", sub: "अपनी फसल, मौसम, बाजार या सरकारी सहायता के बारे में आवाज़ से पूछें — अपनी भाषा में।", cta: "बात शुरू करें" },
  kn: { welcome: "ಸ್ವಾಗತ, ರೈತರೇ", sub: "ನಿಮ್ಮ ಬೆಳೆ, ಹವಾಮಾನ, ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಸರ್ಕಾರಿ ಸಹಾಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿಯಿಂದ ಕೇಳಿ.", cta: "ಮಾತು ಪ್ರಾರಂಭಿಸಿ" },
  te: { welcome: "స్వాగతం, రైతులారా", sub: "మీ పంట, వాతావరణం, మార్కెట్ లేదా ప్రభుత్వ సహాయం గురించి మీ భాషలో గొంతుతో అడగండి.", cta: "మాట్లాడటం ప్రారంభించండి" },
  ta: { welcome: "வரவேற்பு, விவசாயி", sub: "உங்கள் பயிர், வானிலை, சந்தை அல்லது அரசு உதவி பற்றி உங்கள் மொழியில் குரலால் கேளுங்கள்.", cta: "பேச தொடங்கு" },
};

function Home() {
  const [lang] = useLanguage();
  const h = HERO_TEXT[lang];

  const features = [
    { to: "/weather" as const, icon: CloudSun, title: T.weather[lang], color: "from-sky-500 to-blue-600" },
    { to: "/crop" as const, icon: Leaf, title: T.crop[lang], color: "from-emerald-500 to-green-700" },
    { to: "/market" as const, icon: TrendingUp, title: T.market[lang], color: "from-amber-500 to-orange-600" },
    { to: "/schemes" as const, icon: Landmark, title: T.schemes[lang], color: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroFarm} alt="Lush green Indian farmland" width={1920} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              🌱 {T.tagline[lang]}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
              {h.welcome}
            </h1>
            <p className="mt-4 max-w-xl text-base text-foreground/80 md:text-lg">{h.sub}</p>

            <Link
              to="/talk"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-hero px-7 py-4 text-base font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-105"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Mic className="h-5 w-5" />
              </span>
              {h.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {features.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant md:p-6"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-soft`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground md:text-xl">{f.title}</h3>
              <div className="mt-3 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        🌾 RaithaBandhu · Built with care for Indian farmers
      </footer>
    </div>
  );
}
