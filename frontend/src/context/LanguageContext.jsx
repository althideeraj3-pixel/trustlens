import { createContext, useContext } from 'react';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {}
});

export const LanguageProvider = LanguageContext.Provider;

export const useLanguage = () => useContext(LanguageContext);
