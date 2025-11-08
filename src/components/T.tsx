'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState, memo } from 'react';

type TProps = {
  children: string;
};

const T = memo(({ children }: TProps) => {
  const { t, currentLanguage, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (currentLanguage === 'en') {
      if (translatedText !== children) {
        setTranslatedText(children);
      }
      return;
    }

    const translate = async () => {
      setIsLoading(true);
      const result = await t(children);
      if (isMounted) {
        setTranslatedText(result);
        setIsLoading(false);
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [children, t, currentLanguage]);

  if (isLoading && currentLanguage !== 'en') {
      return <span className="opacity-50 animate-pulse">...</span>;
  }

  return <>{translatedText}</>;
});

T.displayName = 'T';

export default T;
