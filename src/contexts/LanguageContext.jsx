import { createContext, useContext, useState } from "react";
import translations from "../data/translations";

const LanguageContext = createContext();

const languageNames = {
  en: "EN",
  zh: "中文",
  fr: "FR",
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
