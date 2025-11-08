
'use client';

import { translateText } from '@/ai/flows/translate-text';
import React, { createContext, useContext, useState, useCallback, FC, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'mr';

// 1. Define the shape of the context
interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
}

// 2. Create the context with a default value
const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// 3. Create the Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 4. Create a custom hook to use the context
export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


// 5. The main translation hook
export function useTranslation() {
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
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if(!isTranslating[cacheKey] && translations[cacheKey]) {
                    clearInterval(interval);
                    resolve(translations[cacheKey]);
                } else if (!isTranslating[cacheKey] && !translations[cacheKey]) {
                    clearInterval(interval);
                    resolve(text);
                }
            }, 100);
        });
    }

    setIsTranslating(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const result = await translateText({ text, targetLang: language });
      const translatedText = result.translatedText;
      
      setTranslations(prev => ({ ...prev, [cacheKey]: translatedText }));
       setIsTranslating(prev => ({ ...prev, [cacheKey]: false }));
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
       setIsTranslating(prev => ({ ...prev, [cacheKey]: false }));
      return text; 
    }
  }, [language, translations, isTranslating]);

  return { t, currentLanguage: language, isTranslating: Object.values(isTranslating).some(v => v) };
}
