import React, { createContext, useContext, useState, useEffect } from 'react';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';

const translations = { en, hi, mr, ta, te, kn, bn, gu };

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('dr_language');
    if (saved && translations[saved]) return saved;
    return 'en';
  });

  const changeLanguage = (code) => {
    if (translations[code]) {
      setLanguageState(code);
      localStorage.setItem('dr_language', code);
    }
  };

  /**
   * Translates a dot-separated key (e.g., "common.login", "severity.MODERATE").
   * Supports parameter interpolation, e.g. t("doctor.patientsRequireReview", { count: 3 }).
   */
  const t = (keyPath, params = {}) => {
    const keys = keyPath.split('.');
    
    // Try current language first
    let currentDict = translations[language];
    let val = currentDict;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        val = undefined;
        break;
      }
    }

    // Fallback to English if missing
    if (val === undefined || val === null) {
      let fallbackDict = translations['en'];
      val = fallbackDict;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }
    }

    // If still missing, return keyPath for debugging
    if (val === undefined || val === null) {
      console.warn(`[i18n MISSING KEY] '${keyPath}' for language '${language}'`);
      return keyPath;
    }

    if (typeof val !== 'string') return val;

    // Interpolate parameters {count}, {name}, etc.
    let interpolated = val;
    Object.keys(params).forEach((paramKey) => {
      const placeholder = `{${paramKey}}`;
      interpolated = interpolated.replace(new RegExp(placeholder, 'g'), params[paramKey]);
    });

    return interpolated;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
