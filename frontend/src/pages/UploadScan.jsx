import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Upload, FileImage, ArrowRight, AlertCircle, CheckCircle, Eye } from 'lucide-react';

export const UploadScan = () => {
  const [searchParams] = useSearchParams();
  const presetPatientId = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(presetPatientId);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPatientsList = async () => {
      try {
        const data = await fetchApi('/patients');
        setPatients(data.patients || []);
        if (!selectedPatientId && data.patients && data.patients.length > 0) {
          setSelectedPatientId(data.patients[0].id);
        }
      } catch (err) {
        console.error('Failed to load patient list:', err.message);
      }
    };
    loadPatientsList();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a JPEG or PNG retinal image.');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10MB.');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient.');
      return;
    }
    if (!file) {
      setError('Please attach a retinal fundus image file.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload scan
      const formData = new FormData();
      formData.append('patientId', selectedPatientId);
      formData.append('image', file);

      const uploadRes = await fetchApi('/scans', {
        method: 'POST',
        body: formData,
      });

      const scanId = uploadRes.scan.id;

      // 2. Trigger AI analysis
      await fetchApi(`/scans/${scanId}/analyze`, {
        method: 'POST',
      });

      // 3. Navigate to scan result view
      navigate(`/scans/${scanId}`);
    } catch (err) {
      setError(err.message || 'Upload or analysis request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-display font-extrabold text-[#243B53] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#243B53]" />
            {t('upload.title')}
          </h1>
          <p className="text-[#243B53]/70 text-xs mt-1 font-medium">
            {t('upload.subtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-rose-100 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUploadAndAnalyze} className="space-y-5">
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-bold text-[#243B53] mb-1.5 uppercase tracking-wider">
              {t('upload.selectPatient')}
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
              className="glass-input w-full text-xs"
            >
              <option value="">{t('upload.choosePatient')}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientCode} - {p.name} ({p.age}y / {p.gender}) [{p.region}]
                </option>
              ))}
            </select>
          </div>

          {/* File Picker Area */}
          <div>
            <label className="block text-xs font-bold text-[#243B53] mb-1.5 uppercase tracking-wider">
              {t('upload.fileLabel')}
            </label>
            <div className="border-2 border-dashed border-[#243B53]/25 hover:border-[#FF8FAB] bg-white rounded-2xl p-6 text-center transition-colors">
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Retinal Preview"
                    className="max-h-64 mx-auto rounded-xl border border-[#243B53]/20 shadow-md object-contain"
                  />
                  <div className="text-xs text-[#243B53] font-mono font-bold">{file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)</div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(''); }}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    {t('upload.removePhoto')}
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FFCFB2]/50 text-[#243B53] flex items-center justify-center mx-auto shadow-sm">
                    <FileImage className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#243B53]">{t('upload.clickToSelect')}</span>
                    <p className="text-xs text-[#243B53]/70 font-medium mt-1">{t('upload.fileLimits')}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !file || !selectedPatientId}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              {loading ? (
                <>{t('upload.uploadingAndAnalyzing')}</>
              ) : (
                <>
                  <Eye className="w-4 h-4" /> {t('upload.startAnalysis')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
