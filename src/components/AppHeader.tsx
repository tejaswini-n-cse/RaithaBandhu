import { Link } from "@tanstack/react-router";
import { LANGUAGES, T, setStoredLang, type LangCode } from "@/lib/i18n";
import { useLanguage } from "@/lib/use-language";
import { Sprout, History } from "lucide-react";

export function AppHeader({ showBack = false }: { showBack?: boolean }) {
  const [lang] = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            {T.appName[lang]}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={T.history[lang]}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{T.history[lang]}</span>
          </Link>
          {showBack && (
            <Link
              to="/"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {T.back[lang]}
            </Link>
          )}
          <LanguageSelect />
        </div>
      </div>
    </header>
  );
}

function LanguageSelect() {
  const [lang] = useLanguage();
  return (
    <select
      value={lang}
      onChange={(e) => setStoredLang(e.target.value as LangCode)}
      aria-label="Select language"
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.native}
        </option>
      ))}
    </select>
  );
}
