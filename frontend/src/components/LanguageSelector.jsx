import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

export const LanguageSelector = ({ className = '' }) => {
  const { language, changeLanguage, languages, t } = useTranslation();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="relative flex items-center">
        <Globe className="w-4 h-4 text-[#243B53] absolute left-2.5 pointer-events-none z-10" />
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          aria-label={t('common.language')}
          className="bg-white text-[#243B53] hover:bg-slate-50 border border-[#243B53]/20 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF8FAB] transition-all shadow-sm"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-white text-[#243B53] py-1">
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#243B53]/70 absolute right-2 pointer-events-none z-10" />
      </div>
    </div>
  );
};
