import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { ShieldCheck, Users, FileText, Activity, AlertTriangle, MapPin, BarChart3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, scansRes] = await Promise.all([
        fetchApi('/admin/stats'),
        fetchApi('/admin/scans'),
      ]);
      setStats(statsRes);
      setScans(scansRes.scans || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading || !stats) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#243B53]/70 font-semibold">{t('common.loading')}</div>;
  }

  const severityDist = stats.severityDistribution || {};
  const totalCompleted = stats.completedScans || 1;

  const severityColors = {
    NO_DR: 'bg-[#B8F2E6]',
    MILD: 'bg-[#CDB4DB]',
    MODERATE: 'bg-[#FFCFB2]',
    SEVERE: 'bg-amber-300',
    PROLIFERATIVE: 'bg-[#FF8FAB]',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 border-[#243B53]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#243B53]" />
            <h1 className="text-2xl font-display font-extrabold text-[#243B53]">{t('admin.title')}</h1>
          </div>
          <p className="text-[#243B53]/70 text-sm mt-1 font-medium">
            {t('admin.subtitle')}
          </p>
        </div>
        <button onClick={loadAdminData} className="btn-secondary text-xs flex items-center gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {/* Real Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-[#243B53]/15 space-y-1">
          <div className="text-[#243B53]/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#243B53]" /> {t('admin.totalPatients')}
          </div>
          <div className="text-3xl font-extrabold text-[#243B53] font-display">{stats.totalPatients}</div>
        </div>

        <div className="glass-card p-5 border-[#243B53]/15 space-y-1">
          <div className="text-[#243B53]/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#243B53]" /> {t('admin.totalScans')}
          </div>
          <div className="text-3xl font-extrabold text-[#243B53] font-display">{stats.totalScans}</div>
        </div>

        <div className="glass-card p-5 border-[#243B53]/15 space-y-1">
          <div className="text-[#243B53]/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#243B53]" /> {t('admin.completedScans')}
          </div>
          <div className="text-3xl font-extrabold text-[#243B53] font-display">{stats.completedScans}</div>
        </div>

        <div className="glass-card p-5 border-[#243B53]/15 space-y-1">
          <div className="text-[#243B53]/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#243B53]" /> {t('admin.referredScans')}
          </div>
          <div className="text-3xl font-extrabold text-[#243B53] font-display">{stats.referredScans}</div>
        </div>
      </div>

      {/* DR Severity Distribution & Regional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#243B53] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#243B53]" /> {t('admin.severityDistribution')}
          </h2>

          <div className="space-y-3">
            {Object.keys(severityDist).map((key) => {
              const count = severityDist[key] || 0;
              const percentage = totalCompleted > 0 ? ((count / totalCompleted) * 100).toFixed(1) : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#243B53]">
                    <span>{t(`severity.${key}`) || key}</span>
                    <span className="font-mono text-[#243B53]/70">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-[#243B53]/10">
                    <div
                      className={`h-full ${severityColors[key] || 'bg-slate-400'} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Region Breakdown */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#243B53] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#243B53]" /> {t('admin.regionBreakdown')}
          </h2>

          {!stats.regionDistribution || stats.regionDistribution.length === 0 ? (
            <div className="text-xs text-[#243B53]/60 italic py-4">No regional data recorded yet.</div>
          ) : (
            <div className="divide-y divide-[#243B53]/10 text-xs font-medium">
              {stats.regionDistribution.map((r, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <span className="font-bold text-[#243B53]">{r.region}</span>
                  <span className="font-mono text-[#243B53] font-bold">{r.patientCount} patients</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Scan Audit Log */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#243B53]/10 flex items-center justify-between bg-white">
          <h2 className="font-bold text-[#243B53] text-sm">{t('admin.auditLog')} ({scans.length} Scans)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#243B53]/15 text-[11px] uppercase tracking-wider text-[#243B53] font-bold">
                <th className="py-3.5 px-6">{t('common.timestamp')}</th>
                <th className="py-3.5 px-6">{t('patient.patientCode')} & {t('patient.name')}</th>
                <th className="py-3.5 px-6">{t('admin.uploadedBy')}</th>
                <th className="py-3.5 px-6">{t('common.status')}</th>
                <th className="py-3.5 px-6">{t('admin.predictedSeverity')}</th>
                <th className="py-3.5 px-6 text-right">{t('common.inspect')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243B53]/10 text-xs bg-white">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-[#FFF9F2] transition-colors">
                  <td className="py-3 px-6 font-mono text-[#243B53]/70 font-medium">{new Date(scan.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-6 text-[#243B53] font-bold">{scan.patient?.patientCode} - {scan.patient?.name}</td>
                  <td className="py-3 px-6 text-[#243B53]/80 font-medium">{scan.uploadedBy?.name} ({scan.uploadedBy?.role})</td>
                  <td className="py-3 px-6 font-mono text-[#243B53] font-bold">{scan.status}</td>
                  <td className="py-3 px-6 font-bold text-[#243B53]">{t(`severity.${scan.severity}`) || scan.severity || '-'}</td>
                  <td className="py-3 px-6 text-right">
                    <Link to={`/scans/${scan.id}`} className="text-[#243B53] hover:underline font-bold">{t('common.inspect')} &rarr;</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
