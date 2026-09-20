import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldAlert, Globe, LogOut, FileText, AlertTriangle } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header style={{ background: 'var(--gov-navy)', color: '#ffffff', borderBottom: '3px solid var(--gov-gold)' }}>
      {/* Top Header Bar */}
      <div style={{ background: '#090d16', padding: '0.35rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('govt_header')}</span>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={toggleLanguage}
              style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: '600' }}
            >
              <Globe size={14} /> {lang === 'en' ? 'हिन्दी (Hindi)' : 'English'}
            </button>
            <Link to="/admin-report" style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
              <AlertTriangle size={13} /> {t('nav_admin_report')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ffffff', textDecoration: 'none' }}>
          <div style={{ background: 'var(--primary-600)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
            <ShieldAlert size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.2rem', lineHeight: '1.1', color: '#ffffff' }}>
              DIGITAL GRIEVANCE REDRESSAL
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gov-gold)', fontWeight: '600' }}>
              MADHYA PRADESH CIVIC PORTAL
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: '#f1f5f9', fontWeight: '500', fontSize: '0.9rem' }}>
            {t('nav_home')}
          </Link>
          <Link to="/track" style={{ color: '#f1f5f9', fontWeight: '500', fontSize: '0.9rem' }}>
            {t('nav_track')}
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link
                to={
                  user.role === 'DISTRICT_ADMIN'
                    ? '/admin'
                    : user.role === 'OFFICER'
                    ? '/officer'
                    : user.role === 'ADMIN_REVIEW_AUTHORITY'
                    ? '/review'
                    : '/dashboard'
                }
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              >
                <FileText size={16} /> {t('nav_dashboard')}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn btn-outline"
                style={{ color: '#f8fafc', borderColor: '#334155', padding: '0.45rem 0.85rem' }}
              >
                <LogOut size={16} /> {t('nav_logout')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ color: '#ffffff', borderColor: '#475569' }}>
                {t('nav_login')}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t('nav_register')}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
