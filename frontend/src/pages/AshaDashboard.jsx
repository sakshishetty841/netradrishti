import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { UserPlus, Search, Upload, Eye, FileText, Activity, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';

export const AshaDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const { t } = useTranslation();

  // New Patient Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [region, setRegion] = useState('Satara PHC-1');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(`/patients?search=${encodeURIComponent(search)}`);
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Failed to load patients:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    try {
      await fetchApi('/patients', {
        method: 'POST',
        body: JSON.stringify({ name, age, gender, region }),
      });
      setShowRegisterModal(false);
      setName('');
      setAge('');
      loadPatients();
    } catch (err) {
      setError(err.message || 'Failed to register patient');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-[#243B53]/15">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-[#243B53]">{t('nav.ashaPortal')}</h1>
          <p className="text-[#243B53]/70 text-sm mt-1 font-medium">
            {t('app.fullTitle')}
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {t('patient.registerPatient')}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#243B53]/60 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, patient code (e.g. PAT-00001), or PHC region..."
            className="glass-input w-full pl-10 text-xs"
          />
        </div>
        <button onClick={loadPatients} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Patient List Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#243B53]/10 flex items-center justify-between bg-white">
          <h2 className="font-bold text-[#243B53] text-sm">{t('patient.registeredPatients')} ({patients.length})</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#243B53]/70 font-medium">{t('common.loading')}</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserPlus className="w-10 h-10 text-[#243B53]/40 mx-auto" />
            <p className="text-[#243B53] font-bold">{t('patient.noPatients')}</p>
            <p className="text-[#243B53]/70 text-xs font-medium">{t('patient.registerFirst')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#243B53]/15 text-[11px] uppercase tracking-wider text-[#243B53] font-bold">
                  <th className="py-3.5 px-6">{t('patient.patientCode')}</th>
                  <th className="py-3.5 px-6">{t('patient.name')}</th>
                  <th className="py-3.5 px-6">{t('patient.age')} / {t('patient.gender')}</th>
                  <th className="py-3.5 px-6">{t('patient.region')}</th>
                  <th className="py-3.5 px-6">{t('patient.recentScanStatus')}</th>
                  <th className="py-3.5 px-6 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243B53]/10 text-sm bg-white">
                {patients.map((patient) => {
                  const recentScan = patient.scans && patient.scans[0];
                  return (
                    <tr key={patient.id} className="hover:bg-[#FFF9F2] transition-colors">
                      <td className="py-4 px-6 font-mono text-[#243B53] font-bold">{patient.patientCode}</td>
                      <td className="py-4 px-6 font-bold text-[#243B53]">{patient.name}</td>
                      <td className="py-4 px-6 text-[#243B53]/80 font-medium">{patient.age} / {patient.gender}</td>
                      <td className="py-4 px-6 text-[#243B53]/80 font-medium">{patient.region}</td>
                      <td className="py-4 px-6">
                        {!recentScan ? (
                          <span className="text-xs text-[#243B53]/60 italic font-medium">{t('patient.noScanUploaded')}</span>
                        ) : recentScan.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B8F2E6] text-[#243B53] border border-[#243B53]/20 shadow-sm">
                            <CheckCircle className="w-3 h-3" /> {t(`severity.${recentScan.severity}`) || recentScan.severity}
                          </span>
                        ) : recentScan.status === 'MODEL_NOT_READY' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#CDB4DB] text-[#243B53] border border-[#243B53]/20 shadow-sm">
                            <AlertCircle className="w-3 h-3" /> {t('modelStatus.notReady')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFCFB2] text-[#243B53] border border-[#243B53]/20 shadow-sm">
                            <Activity className="w-3 h-3 animate-pulse" /> {recentScan.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/upload-scan?patientId=${patient.id}`}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" /> {t('upload.title')}
                          </Link>
                          <Link
                            to={`/patients/${patient.id}`}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> {t('common.viewDetails')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-[#243B53]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white border border-[#243B53]/20 shadow-xl">
            <h3 className="text-lg font-bold text-[#243B53] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#243B53]" />
              {t('patient.registerPatient')}
            </h3>

            {error && (
              <div className="bg-rose-100 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#243B53] font-bold mb-1 uppercase tracking-wider">{t('patient.name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#243B53] font-bold mb-1 uppercase tracking-wider">{t('patient.age')}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 54"
                    className="glass-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[#243B53] font-bold mb-1 uppercase tracking-wider">{t('patient.gender')}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="glass-input w-full text-xs"
                  >
                    <option value="Female">{t('patient.female')}</option>
                    <option value="Male">{t('patient.male')}</option>
                    <option value="Other">{t('patient.other')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#243B53] font-bold mb-1 uppercase tracking-wider">{t('patient.region')}</label>
                <input
                  type="text"
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Satara Rural PHC-3"
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-secondary text-xs"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="btn-primary text-xs"
                >
                  {submitLoading ? t('patient.registering') : t('patient.registerPatient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
