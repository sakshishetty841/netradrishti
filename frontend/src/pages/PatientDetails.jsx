import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { ArrowLeft, Upload, Eye, User, Calendar, MapPin, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const data = await fetchApi(`/patients/${id}`);
        setPatient(data.patient);
      } catch (err) {
        console.error('Failed to load patient history:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPatientData();
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[#243B53]/70 font-semibold">{t('common.loading')}</div>;
  }

  if (!patient) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#243B53]">Patient Record Not Found</h2>
        <Link to="/asha" className="btn-secondary text-xs inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Link>
      </div>
    );
  }

  const scans = patient.scans || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link to="/asha" className="text-[#243B53]/80 hover:text-[#243B53] inline-flex items-center gap-1.5 text-xs font-bold">
        <ArrowLeft className="w-4 h-4" /> {t('result.returnToList')}
      </Link>

      <div className="glass-card p-6 border-[#243B53]/15 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-[#243B53]">{patient.patientCode}</span>
          <h1 className="text-2xl font-bold text-[#243B53]">{patient.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#243B53]/80 font-medium pt-1">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-[#243B53]/60" /> {patient.age} yrs / {patient.gender}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#243B53]/60" /> {patient.region}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#243B53]/60" /> {t('patient.registeredOn')}: {new Date(patient.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Link to={`/upload-scan?patientId=${patient.id}`} className="btn-primary text-xs flex items-center gap-1.5">
          <Upload className="w-4 h-4" /> {t('upload.title')}
        </Link>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#243B53]">{t('patient.history')} ({scans.length})</h2>

        {scans.length === 0 ? (
          <div className="text-center py-8 text-[#243B53]/60 text-xs italic font-medium">{t('patient.noScanUploaded')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-white p-4 rounded-xl border border-[#243B53]/15 space-y-3 flex flex-col justify-between shadow-sm">
                <div className="flex items-start gap-3">
                  <img
                    src={scan.originalImageUrl}
                    alt="Retina thumbnail"
                    className="w-20 h-20 object-cover rounded-lg border border-[#243B53]/15 bg-slate-100 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-xs text-[#243B53]/70 font-mono font-medium">{new Date(scan.createdAt).toLocaleString()}</div>
                    <div className="font-bold text-sm text-[#243B53]">
                      {scan.status === 'COMPLETED' ? (t(`severity.${scan.severity}`) || scan.severity) : scan.status}
                    </div>
                    {scan.confidence && (
                      <div className="text-xs text-[#243B53] font-bold">{t('result.confidence')}: {(scan.confidence * 100).toFixed(1)}%</div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#243B53]/10 flex items-center justify-between">
                  <span className="text-[11px] text-[#243B53]/60 font-mono font-medium">{t('common.status')}: {scan.status}</span>
                  <Link to={`/scans/${scan.id}`} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {t('common.viewDetails')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
