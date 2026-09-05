import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Stethoscope, Eye, AlertTriangle, Filter, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export const DoctorDashboard = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const { t } = useTranslation();

  const loadDoctorQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/admin/scans');
      setScans(data.scans || []);
    } catch (err) {
      console.error('Failed to load doctor review queue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorQueue();
  }, []);

  const filteredScans = scans.filter((scan) => {
    if (filterSeverity === 'REFERRAL') {
      return ['MODERATE', 'SEVERE', 'PROLIFERATIVE'].includes(scan.severity);
    }
    if (filterSeverity !== 'ALL') {
      return scan.severity === filterSeverity;
    }
    return true;
  });

  const referralCount = scans.filter((s) => ['MODERATE', 'SEVERE', 'PROLIFERATIVE'].includes(s.severity)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Doctor Header Banner - Lavender Accent */}
      <div className="glass-card p-6 border-[#243B53]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#243B53]" />
            <h1 className="text-2xl font-display font-extrabold text-[#243B53]">{t('doctor.title')}</h1>
          </div>
          <p className="text-[#243B53]/70 text-sm mt-1 font-medium">
            {t('doctor.subtitle')}
          </p>
        </div>
        <div className="bg-[#FFCFB2]/50 border border-[#243B53]/20 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-[#243B53]" />
          <div>
            <div className="text-xs text-[#243B53] font-bold">{t('doctor.priorityAlert')}</div>
            <div className="text-sm font-extrabold text-[#243B53]">{t('doctor.patientsRequireReview', { count: referralCount })}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Filter className="w-4 h-4 text-[#243B53]/60" />
          <span className="text-[#243B53] font-bold">{t('doctor.filterSeverity')}:</span>
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1.5 rounded-lg border font-bold transition-all shadow-sm ${filterSeverity === 'ALL' ? 'bg-[#243B53] text-white border-[#243B53]' : 'bg-white text-[#243B53] border-[#243B53]/20'}`}
          >
            {t('doctor.allScans')} ({scans.length})
          </button>
          <button
            onClick={() => setFilterSeverity('REFERRAL')}
            className={`px-3 py-1.5 rounded-lg border font-bold transition-all shadow-sm ${filterSeverity === 'REFERRAL' ? 'bg-[#FFCFB2] text-[#243B53] border-[#243B53]/30' : 'bg-white text-[#243B53] border-[#243B53]/20'}`}
          >
            {t('doctor.referralsOnly')} ({referralCount})
          </button>
        </div>
        <button onClick={loadDoctorQueue} className="btn-secondary text-xs flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
        </button>
      </div>

      {/* Review Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#243B53]/70 font-semibold">{t('common.loading')}</div>
      ) : filteredScans.length === 0 ? (
        <div className="p-12 glass-card text-center text-[#243B53]/70 font-medium">No scans matching filter criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScans.map((scan) => {
            const isReferral = ['MODERATE', 'SEVERE', 'PROLIFERATIVE'].includes(scan.severity);
            const patient = scan.patient || {};
            return (
              <div
                key={scan.id}
                className={`glass-card p-5 space-y-4 border transition-all ${isReferral ? 'border-[#243B53]/30 bg-[#FFCFB2]/20' : 'border-[#243B53]/15'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#243B53]">{patient.patientCode}</span>
                    <h3 className="font-extrabold text-[#243B53] text-base leading-tight mt-0.5">{patient.name}</h3>
                    <p className="text-xs text-[#243B53]/70 font-medium mt-0.5">{patient.age}y / {patient.gender} | {patient.region}</p>
                  </div>
                  {isReferral && (
                    <span className="bg-[#FF8FAB] text-[#243B53] border border-[#243B53]/20 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                      {t('doctor.referralUrgency')}
                    </span>
                  )}
                </div>

                {/* Retinal & Heatmap Side-by-side preview */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2 rounded-xl border border-[#243B53]/15">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#243B53]/70 uppercase font-bold">{t('result.originalRetina')}</span>
                    <img src={scan.originalImageUrl} alt="Original" className="h-28 w-full object-cover rounded-lg" />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#243B53]/70 uppercase font-bold">Grad-CAM</span>
                    {scan.heatmapImageUrl ? (
                      <img src={scan.heatmapImageUrl} alt="Heatmap" className="h-28 w-full object-cover rounded-lg" />
                    ) : (
                      <div className="h-28 flex items-center justify-center text-[10px] text-[#243B53]/50 italic font-medium bg-white rounded-lg">No Heatmap</div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-[#243B53]/70">{t('admin.predictedSeverity')}:</span>
                    <span className="font-bold text-[#243B53]">{t(`severity.${scan.severity}`) || scan.status}</span>
                  </div>
                  {scan.confidence && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#243B53]/70">{t('result.confidence')}:</span>
                      <span className="font-bold text-[#243B53]">{(scan.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/scans/${scan.id}`}
                  className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> {t('doctor.fullReview')}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
