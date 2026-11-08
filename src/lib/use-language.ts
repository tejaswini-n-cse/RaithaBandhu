import { useEffect, useState } from "react";
import { getStoredLang, type LangCode } from "./i18n";

export function useLanguage(): [LangCode, (l: LangCode) => void] {
  const [lang, setLang] = useState<LangCode>("en");

  useEffect(() => {
    setLang(getStoredLang());
    const handler = (e: Event) => {
      const ce = e as CustomEvent<LangCode>;
      setLang(ce.detail);
    };
    window.addEventListener("krishi-lang-change", handler);
    return () => window.removeEventListener("krishi-lang-change", handler);
  }, []);

  return [lang, setLang];
}
