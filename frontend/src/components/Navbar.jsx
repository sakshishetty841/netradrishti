import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ModelStatusBadge } from './ModelStatusBadge';
import { LanguageSelector } from './LanguageSelector';
import { Eye, LogOut, ShieldCheck, Stethoscope, Users } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ASHA':
        return <span className="bg-[#B8F2E6] text-[#243B53] border border-[#243B53]/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"><Users className="w-3 h-3"/> ASHA Worker</span>;
      case 'PHC_DOCTOR':
        return <span className="bg-[#CDB4DB] text-[#243B53] border border-[#243B53]/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"><Stethoscope className="w-3 h-3"/> PHC Doctor</span>;
      case 'ADMIN':
        return <span className="bg-[#FFCFB2] text-[#243B53] border border-[#243B53]/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"><ShieldCheck className="w-3 h-3"/> Admin</span>;
      default:
        return role;
    }
  };

  return (
    <header className="border-b border-[#243B53]/15 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF8FAB] flex items-center justify-center shadow-sm">
              <Eye className="w-6 h-6 text-[#243B53]" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-[#243B53] leading-none block">{t('app.title')}</span>
              <span className="text-[10px] text-[#243B53]/70 font-semibold tracking-wide uppercase">{t('app.subtitle')}</span>
            </div>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-5 text-sm font-bold text-[#243B53]">
              {user.role === 'ASHA' && (
                <Link to="/asha" className="hover:text-[#FF8FAB] transition-colors">{t('nav.ashaPortal')}</Link>
              )}
              {(user.role === 'PHC_DOCTOR' || user.role === 'ADMIN') && (
                <Link to="/doctor" className="hover:text-[#FF8FAB] transition-colors">{t('nav.doctorQueue')}</Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-[#FF8FAB] transition-colors">{t('nav.adminStats')}</Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <ModelStatusBadge />

          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-[#243B53]/15">
              <div className="text-right">
                <div className="text-xs font-bold text-[#243B53]">{user.name}</div>
                <div className="mt-0.5">{getRoleBadge(user.role)}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-[#243B53]/70 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
                title={t('common.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
