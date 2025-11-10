
'use client';

import { useLanguage } from '@/context/LanguageContext';
import { translations, TranslationKey } from '@/lib/translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key];
  };

  return { t, language };
};
