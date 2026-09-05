import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Eye, AlertTriangle, ShieldCheck, Activity, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export const ScanResult = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState('');

  const { t } = useTranslation();

  const loadScanDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchApi(`/scans/${id}`);
      setScan(data.scan);
    } catch (err) {
      setError(err.message || 'Failed to load scan results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScanDetails();
  }, [id]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await fetchApi(`/scans/${id}/analyze`, { method: 'POST' });
      setScan(res.scan);
    } catch (err) {
      setError(err.message || 'Analysis retry failed.');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[#243B53]/70 font-semibold">
        <Activity className="w-8 h-8 text-[#243B53] animate-spin mx-auto mb-3" />
        {t('common.loading')}
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#243B53]">Scan Not Found</h2>
        <p className="text-[#243B53]/70 text-sm font-medium">{error || 'Requested scan record could not be retrieved.'}</p>
        <Link to="/asha" className="btn-secondary inline-flex items-center gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Link>
      </div>
    );
  }

  const patient = scan.patient || {};
  const isCompleted = scan.status === 'COMPLETED';
  const isModelNotReady = scan.status === 'MODEL_NOT_READY';
  const isQualityFailed = scan.status === 'IMAGE_QUALITY_FAILED';

  const getSeverityBadge = (severity) => {
    const label = t(`severity.${severity}`) || severity;
    switch (severity) {
      case 'NO_DR':
        return <span className="bg-[#B8F2E6] text-[#243B53] border border-[#243B53]/20 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">{label}</span>;
      case 'MILD':
        return <span className="bg-[#CDB4DB] text-[#243B53] border border-[#243B53]/20 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">{label}</span>;
      case 'MODERATE':
        return <span className="bg-[#FFCFB2] text-[#243B53] border border-[#243B53]/20 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">{label}</span>;
      case 'SEVERE':
        return <span className="bg-amber-300 text-[#243B53] border border-[#243B53]/20 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">{label}</span>;
      case 'PROLIFERATIVE':
        return <span className="bg-[#FF8FAB] text-[#243B53] border border-[#243B53]/20 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm">{label}</span>;
      default:
        return <span className="bg-slate-200 text-[#243B53] px-3 py-1 rounded-full text-xs font-semibold">{severity || 'UNKNOWN'}</span>;
    }
  };

  const getRecommendationText = (severity) => {
    return t(`recommendations.${severity}`) || scan.recommendationText;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/asha" className="text-[#243B53]/80 hover:text-[#243B53] inline-flex items-center gap-1.5 text-xs font-bold">
          <ArrowLeft className="w-4 h-4" /> {t('result.returnToList')}
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleReanalyze} disabled={reanalyzing} className="btn-secondary text-xs flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            {t('result.reanalyze')}
          </button>
        </div>
      </div>

      {/* Patient Meta Card */}
      <div className="glass-card p-6 border-[#243B53]/15 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#243B53] font-bold">{patient.patientCode}</div>
          <h1 className="text-xl font-bold text-[#243B53] mt-0.5">{patient.name}</h1>
          <p className="text-[#243B53]/70 text-xs mt-0.5 font-medium">
            {t('patient.age')}: {patient.age} | {t('patient.gender')}: {patient.gender} | {t('patient.region')}: {patient.region}
          </p>
        </div>
        <div className="text-right text-xs text-[#243B53]/70 font-medium">
          <div>Uploaded: {new Date(scan.createdAt).toLocaleString()}</div>
          {scan.analyzedAt && <div className="mt-0.5">Analyzed: {new Date(scan.analyzedAt).toLocaleString()}</div>}
        </div>
      </div>

      {/* MODEL_NOT_READY Banner - Lavender Card */}
      {isModelNotReady && (
        <div className="bg-[#CDB4DB]/30 border-2 border-[#243B53]/20 rounded-2xl p-6 text-[#243B53] space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-[#243B53] shrink-0" />
            <div>
              <h2 className="text-lg font-extrabold text-[#243B53]">{t('result.modelNotReadyTitle')}</h2>
              <p className="text-xs font-medium text-[#243B53]/80 mt-0.5">
                {t('result.modelNotReadyText')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE_QUALITY_FAILED Banner */}
      {isQualityFailed && (
        <div className="bg-rose-100 border-2 border-rose-300 rounded-2xl p-6 text-rose-900 space-y-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-rose-700 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-rose-900">{t('result.qualityCheckFailedTitle')}</h2>
              <p className="text-xs font-medium text-rose-800 mt-0.5">
                {t('result.qualityCheckFailedText')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED Result Section */}
      {isCompleted && (
        <div className="space-y-6">
          {/* Main Screening Verdict Card */}
          <div className="glass-card p-6 sm:p-8 space-y-4 border-[#243B53]/20">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#243B53]/15 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#243B53]/70 font-bold block">{t('result.screeningVerdict')}</span>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  {getSeverityBadge(scan.severity)}
                  <span className="text-[#243B53] text-sm font-bold">
                    {t('result.confidence')}: <span className="text-[#243B53]">{(scan.confidence * 100).toFixed(1)}%</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#243B53] font-mono font-bold bg-[#CDB4DB]/40 px-3 py-1 rounded-lg border border-[#243B53]/15 shadow-sm">
                  {t('result.modelVersion')}: {scan.modelVersion || 'DR-EfficientNet-B0-v1'}
                </span>
              </div>
            </div>

            {/* Images Grid: Original vs Grad-CAM Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#243B53] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#243B53]" /> {t('result.originalRetina')}
                </div>
                <div className="bg-slate-100 p-2 rounded-2xl border border-[#243B53]/15 flex items-center justify-center">
                  <img
                    src={scan.originalImageUrl}
                    alt="Original Retina"
                    className="max-h-80 w-full object-contain rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-[#243B53] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#243B53]" /> {t('result.heatmapTitle')}
                </div>
                <div className="bg-slate-100 p-2 rounded-2xl border border-[#243B53]/15 flex items-center justify-center">
                  {scan.heatmapImageUrl ? (
                    <img
                      src={scan.heatmapImageUrl}
                      alt="Grad-CAM Heatmap"
                      className="max-h-80 w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-[#243B53]/60 italic font-medium">Heatmap unavailable</div>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation Text */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-[#243B53]/15 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#243B53]">{t('result.whyPrediction')}</h3>
              <p className="text-sm text-[#243B53] leading-relaxed font-medium">{scan.explanationText}</p>
            </div>

            {/* Clinical Recommendation - Mint Banner */}
            <div className="bg-[#B8F2E6]/30 p-5 rounded-2xl border border-[#243B53]/20 space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#243B53] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#243B53]" /> {t('result.recommendationTitle')}
              </h3>
              <p className="text-sm text-[#243B53] font-bold">{getRecommendationText(scan.severity)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer Footer - Peach Accent */}
      <div className="bg-[#FFCFB2]/30 p-4 rounded-xl border border-[#243B53]/20 text-center text-xs text-[#243B53] font-medium leading-relaxed shadow-sm">
        {t('common.disclaimer')}
      </div>
    </div>
  );
};
