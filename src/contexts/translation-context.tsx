
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

import en from '@/locales/en.json';
import id from '@/locales/id.json';
import ru from '@/locales/ru.json';
import hi from '@/locales/hi.json';
import es from '@/locales/es.json';
import de from '@/locales/de.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';

const translations = { en, id, ru, hi, es, de, zh, ja, ko };

export type Language = keyof typeof translations;

type TranslationContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: <T extends keyof (typeof translations)[Language]>(
    section: T,
    key: keyof (typeof translations)[Language][T]
  ) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

type TranslationProviderProps = {
  children: ReactNode;
};

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = useCallback(<T extends keyof (typeof translations)[Language]>(
    section: T,
    key: keyof (typeof translations)[Language][T]
  ) => {
    return translations[language][section][key] || translations['en'][section][key] || String(key);
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
