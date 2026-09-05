import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Eye, ShieldAlert, KeyRound, Mail, ArrowRight, UserCheck, UserPlus } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ASHA') navigate('/asha');
      else if (user.role === 'PHC_DOCTOR') navigate('/doctor');
      else if (user.role === 'ADMIN') navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      const user = await login(demoEmail, 'password123');
      if (user.role === 'ASHA') navigate('/asha');
      else if (user.role === 'PHC_DOCTOR') navigate('/doctor');
      else if (user.role === 'ADMIN') navigate('/admin');
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#FFF9F2] relative overflow-hidden">
      <div className="w-full max-w-md space-y-5">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF8FAB] shadow-md mb-2">
            <Eye className="w-9 h-9 text-[#243B53]" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-[#243B53] tracking-tight">{t('app.title')}</h1>
          <p className="text-[#243B53]/70 text-xs sm:text-sm font-semibold">
            {t('app.fullTitle')}
          </p>
        </div>

        {/* Language Selector Card */}
        <div className="bg-white p-3 flex items-center justify-between border border-[#243B53]/15 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-[#243B53] pl-2">{t('common.language')}:</span>
          <LanguageSelector />
        </div>

        {/* Medical Notice Banner - Peach Accent */}
        <div className="bg-[#FFCFB2]/40 border border-[#243B53]/20 rounded-2xl p-4 text-xs text-[#243B53] leading-relaxed flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-[#243B53] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5 text-[#243B53]">{t('common.medicalClarificationTitle')}</strong>
            {t('common.medicalClarificationText')}
          </div>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-6 sm:p-8 space-y-5">
          {error && (
            <div className="bg-rose-100 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#243B53] mb-1.5 uppercase tracking-wider">{t('auth.emailLabel')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#243B53]/60 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@phc.in"
                  className="glass-input w-full pl-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#243B53] mb-1.5 uppercase tracking-wider">{t('auth.passwordLabel')}</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#243B53]/60 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-10 text-xs"
                />
              </div>
            </div>

            {/* Primary CTA - Pink Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 text-sm">
              {loading ? t('auth.authenticating') : t('auth.signIn')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* OR Separator & Registration CTA */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#243B53]/15"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-[#243B53]/70 font-extrabold tracking-wider">OR</span></div>
          </div>

          <div className="text-center bg-[#FFF9F2] p-4 rounded-2xl border border-[#243B53]/15 space-y-2.5 shadow-sm">
            <p className="text-xs font-extrabold text-[#243B53]">New to NetraDrishti?</p>
            <Link
              to="/register"
              className="btn-secondary w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs text-[#243B53] font-extrabold shadow-sm bg-white hover:bg-slate-50 border-[#243B53]/30"
            >
              <UserPlus className="w-4 h-4" /> Create an Account &rarr;
            </Link>
          </div>

          {/* QUICK DEMO ACCESS SEPARATOR */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#243B53]/15"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-[#243B53]/70 font-extrabold tracking-widest">── QUICK DEMO ACCESS ──</span></div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => demoLogin('asha@phc.in')}
              className="w-full text-left p-3 rounded-xl bg-[#B8F2E6]/40 hover:bg-[#B8F2E6]/70 border border-[#243B53]/20 transition-all flex items-center justify-between text-xs text-[#243B53] font-bold shadow-sm"
            >
              <span className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#243B53]"/> {t('auth.demoAsha')}</span>
              <span className="text-[#243B53]/70 text-[10px]">{t('auth.selectRole')} &rarr;</span>
            </button>

            <button
              onClick={() => demoLogin('doctor@phc.in')}
              className="w-full text-left p-3 rounded-xl bg-[#CDB4DB]/40 hover:bg-[#CDB4DB]/70 border border-[#243B53]/20 transition-all flex items-center justify-between text-xs text-[#243B53] font-bold shadow-sm"
            >
              <span className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#243B53]"/> {t('auth.demoDoctor')}</span>
              <span className="text-[#243B53]/70 text-[10px]">{t('auth.selectRole')} &rarr;</span>
            </button>

            <button
              onClick={() => demoLogin('admin@phc.in')}
              className="w-full text-left p-3 rounded-xl bg-[#FFCFB2]/50 hover:bg-[#FFCFB2]/80 border border-[#243B53]/20 transition-all flex items-center justify-between text-xs text-[#243B53] font-bold shadow-sm"
            >
              <span className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#243B53]"/> {t('auth.demoAdmin')}</span>
              <span className="text-[#243B53]/70 text-[10px]">{t('auth.selectRole')} &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
