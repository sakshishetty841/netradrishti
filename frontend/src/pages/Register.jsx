import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Eye, Users, Stethoscope, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Register = () => {
  const [role, setRole] = useState(null); // 'ASHA' or 'PHC_DOCTOR'
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    state: 'Maharashtra',
    district: 'Satara',
    phc: 'Satara PHC-1',
    workerId: '',
    registrationNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Full name is required.';
    if (!formData.mobile.trim() || formData.mobile.length < 10) return 'Valid 10-digit mobile number is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Valid email address is required.';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) return 'Password and Confirm Password do not match.';
    if (role === 'ASHA' && !formData.workerId.trim()) return 'ASHA Worker ID is required.';
    if (role === 'PHC_DOCTOR' && !formData.registrationNumber.trim()) return 'Medical Registration Number is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const valError = validateForm();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
        mobile: formData.mobile,
        state: formData.state,
        district: formData.district,
        phc: formData.phc,
        workerId: formData.workerId,
        registrationNumber: formData.registrationNumber,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Account registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (role === 'ASHA') navigate('/asha');
    else if (role === 'PHC_DOCTOR') navigate('/doctor');
    else navigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#FFF9F2] relative overflow-hidden">
      <div className="w-full max-w-xl space-y-5">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-[#243B53]/70 hover:text-[#243B53] mb-1">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </Link>
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FF8FAB] flex items-center justify-center shadow-md">
              <Eye className="w-8 h-8 text-[#243B53]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#243B53] tracking-tight">
            Create Your NetraDrishti Account
          </h1>
          <p className="text-[#243B53]/70 text-xs sm:text-sm font-semibold">
            {t('app.fullTitle')}
          </p>
        </div>

        {/* Language Selector Card */}
        <div className="bg-white p-3 flex items-center justify-between border border-[#243B53]/15 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-[#243B53] pl-2">{t('common.language')}:</span>
          <LanguageSelector />
        </div>

        {/* SUCCESS VIEW */}
        {success ? (
          <div className="glass-card p-8 text-center space-y-5 border-[#B8F2E6]">
            <div className="w-16 h-16 bg-[#B8F2E6] text-[#243B53] rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#243B53]">Account Created Successfully!</h2>
              <p className="text-xs sm:text-sm text-[#243B53]/80 font-semibold mt-1">
                Your NetraDrishti {role === 'ASHA' ? 'ASHA Worker' : 'PHC Doctor'} account is active.
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue to Portal Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* STEP 1: ROLE SELECTION OR STEP 2: REGISTRATION FORM */
          <div className="glass-card p-6 sm:p-8 space-y-6">
            {!role ? (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-[#243B53]">Select Your Healthcare Role to Begin</h2>
                  <p className="text-xs text-[#243B53]/70 font-semibold mt-0.5">
                    Self-registration is available for rural frontline workers and medical officers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ASHA WORKER CHOICE */}
                  <button
                    onClick={() => setRole('ASHA')}
                    className="bg-[#B8F2E6]/40 hover:bg-[#B8F2E6] border-2 border-[#243B53]/20 hover:border-[#243B53] p-5 rounded-2xl text-left space-y-3 transition-all group shadow-sm"
                  >
                    <div className="w-12 h-12 bg-[#B8F2E6] rounded-xl flex items-center justify-center border border-[#243B53]/20 group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6 text-[#243B53]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-base text-[#243B53]">ASHA Worker</div>
                      <p className="text-xs text-[#243B53]/70 font-medium mt-1">
                        Screen diabetic patients, capture fundus images, and manage community health records.
                      </p>
                    </div>
                  </button>

                  {/* PHC DOCTOR CHOICE */}
                  <button
                    onClick={() => setRole('PHC_DOCTOR')}
                    className="bg-[#CDB4DB]/40 hover:bg-[#CDB4DB] border-2 border-[#243B53]/20 hover:border-[#243B53] p-5 rounded-2xl text-left space-y-3 transition-all group shadow-sm"
                  >
                    <div className="w-12 h-12 bg-[#CDB4DB] rounded-xl flex items-center justify-center border border-[#243B53]/20 group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-6 h-6 text-[#243B53]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-base text-[#243B53]">PHC Doctor</div>
                      <p className="text-xs text-[#243B53]/70 font-medium mt-1">
                        Review high-risk referrals, inspect Grad-CAM heatmaps, and add medical notes.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="p-3 bg-slate-100 rounded-xl border border-slate-300/60 text-xs text-[#243B53]/80 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#243B53]" />
                  <span><strong>System Admin Access:</strong> System Administrator accounts are restricted and managed by state health authority officials.</span>
                </div>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-xs font-bold text-[#243B53] hover:underline">
                    Already have an account? Sign In to Portal →
                  </Link>
                </div>
              </div>
            ) : (
              /* FORM VIEW FOR SELECTED ROLE */
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#243B53]/15 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border border-[#243B53]/20 ${role === 'ASHA' ? 'bg-[#B8F2E6]' : 'bg-[#CDB4DB]'}`}>
                      {role === 'ASHA' ? 'ASHA Worker Registration' : 'PHC Doctor Registration'}
                    </div>
                  </div>
                  <button
                    onClick={() => setRole(null)}
                    className="text-xs font-bold text-[#243B53]/70 hover:text-[#243B53] underline"
                  >
                    Change Role
                  </button>
                </div>

                {error && (
                  <div className="bg-rose-100 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#243B53] mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={role === 'ASHA' ? 'e.g. Sunita Patil' : 'e.g. Dr. Anil Deshmukh'}
                        className="glass-input w-full text-xs"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold text-[#243B53] mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="10-digit phone number"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#243B53] mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@phc.in"
                      className="glass-input w-full text-xs"
                    />
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#243B53] mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#243B53] mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Role Specific Fields */}
                  {role === 'ASHA' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#243B53] mb-1">ASHA Worker ID *</label>
                        <input
                          type="text"
                          name="workerId"
                          required
                          value={formData.workerId}
                          onChange={handleChange}
                          placeholder="e.g. ASHA-MH-9921"
                          className="glass-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#243B53] mb-1">PHC / Health Centre *</label>
                        <input
                          type="text"
                          name="phc"
                          required
                          value={formData.phc}
                          onChange={handleChange}
                          placeholder="e.g. Satara PHC-1"
                          className="glass-input w-full text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#243B53] mb-1">Medical Registration No. *</label>
                        <input
                          type="text"
                          name="registrationNumber"
                          required
                          value={formData.registrationNumber}
                          onChange={handleChange}
                          placeholder="e.g. MMC-2018/04/1234"
                          className="glass-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#243B53] mb-1">Hospital / PHC *</label>
                        <input
                          type="text"
                          name="phc"
                          required
                          value={formData.phc}
                          onChange={handleChange}
                          placeholder="e.g. District Civil Hospital Satara"
                          className="glass-input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Location (State & District) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#243B53] mb-1">State *</label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#243B53] mb-1">District *</label>
                      <input
                        type="text"
                        name="district"
                        required
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="District"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Registering Account...' : 'Complete Account Registration'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-[#243B53]/15">
                  <Link to="/login" className="text-xs font-bold text-[#243B53] hover:underline">
                    Already registered? Return to Sign In →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
