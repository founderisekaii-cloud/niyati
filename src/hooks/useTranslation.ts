'use client';

import { translateText } from '@/ai/flows/translate-text';
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


// Main translation hook
export const useTranslation = () => {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});

  const t = useCallback(async (text: string): Promise<string> => {
    if (language === 'en') {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    if (translations[cacheKey]) {
      return translations[cacheKey];
    }

    if (isTranslating[cacheKey]) {
        // Prevent duplicate requests
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if(!isTranslating[cacheKey]) {
                    clearInterval(interval);
                    resolve(translations[cacheKey] || text);
                }
            }, 100);
        });
    }

    setIsTranslating(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const result = await translateText({ text, targetLang: language });
      const translatedText = result.translatedText;
      
      setTranslations(prev => ({ ...prev, [cacheKey]: translatedText }));
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text on error
    } finally {
      setIsTranslating(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [language, translations, isTranslating]);

  return { t, currentLanguage: language, isTranslating: Object.values(isTranslating).some(v => v) };
};
