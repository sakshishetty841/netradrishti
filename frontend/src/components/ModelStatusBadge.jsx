import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ModelStatusBadge = () => {
  const { systemHealth } = useAuth();
  const { t } = useTranslation();
  const isReady = systemHealth.model === 'READY';

  return (
    <div className="flex items-center gap-2">
      {isReady ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#B8F2E6] text-[#243B53] border border-[#243B53]/20 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#243B53]" />
          {t('modelStatus.ready')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#CDB4DB] text-[#243B53] border border-[#243B53]/20 shadow-sm" title="Model weights file absent. AI analysis will respond with MODEL_NOT_READY until training completes.">
          <AlertTriangle className="w-3.5 h-3.5 text-[#243B53]" />
          {t('modelStatus.notReady')}
        </span>
      )}
    </div>
  );
};
