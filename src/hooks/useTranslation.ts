'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/app/layout';
import { translations, TranslationKey } from '@/lib/translations';

export const useTranslation = () => {
  const { language } = useContext(LanguageContext);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key];
  };

  return { t, language };
};
