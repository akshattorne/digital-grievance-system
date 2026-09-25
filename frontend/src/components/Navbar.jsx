import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldAlert, Globe, LogOut, FileText, Menu, X, PlusCircle, Search } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'DISTRICT_ADMIN': return '/admin';
      case 'OFFICER': return '/officer';
      default: return '/dashboard';
    }
  };

  return (
    <header style={{ background: 'var(--gov-navy)', color: '#ffffff', borderBottom: '3px solid var(--gov-gold)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Banner Bar */}
      <div style={{ background: '#090d16', padding: '0.35rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{t('govt_header')}</span>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={toggleLanguage}
              style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: '600' }}
            >
              <Globe size={14} /> {lang === 'en' ? 'हिन्दी (Hindi)' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '68px', padding: '0.5rem 1.5rem' }}>
        <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ffffff', textDecoration: 'none' }}>
          <div style={{ background: 'var(--primary-600)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
            <ShieldAlert size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.15rem', lineHeight: '1.1', color: '#ffffff', letterSpacing: '-0.01em' }}>
              DIGITAL GRIEVANCE REDRESSAL
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--gov-gold)', fontWeight: '700', letterSpacing: '0.05em' }}>
              MADHYA PRADESH CIVIC PORTAL
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/" style={{ color: location.pathname === '/' ? '#ffffff' : '#cbd5e1', fontWeight: location.pathname === '/' ? '700' : '500', fontSize: '0.9rem' }}>
            {t('nav_home')}
          </Link>
          <Link to="/track" style={{ color: location.pathname === '/track' ? '#ffffff' : '#cbd5e1', fontWeight: location.pathname === '/track' ? '700' : '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Search size={15} /> {t('nav_track')}
          </Link>
          <Link to="/submit" style={{ color: '#fef08a', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <PlusCircle size={15} /> Submit Grievance
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <Link
                to={getDashboardRoute()}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              >
                <FileText size={15} /> {t('nav_dashboard')}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn btn-outline"
                style={{ color: '#f8fafc', borderColor: '#334155', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                <LogOut size={15} /> {t('nav_logout')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ color: '#ffffff', borderColor: '#475569', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                {t('nav_login')}
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                {t('nav_register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-only-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          style={{ color: '#ffffff', padding: '0.5rem', display: 'none' }}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{ background: '#090d16', borderTop: '1px solid #1e293b', padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/" onClick={closeMenu} style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', padding: '0.5rem 0' }}>
            {t('nav_home')}
          </Link>
          <Link to="/track" onClick={closeMenu} style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} /> {t('nav_track')}
          </Link>
          <Link to="/submit" onClick={closeMenu} style={{ color: '#fef08a', fontSize: '1rem', fontWeight: '700', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} /> Submit Grievance
          </Link>

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Signed in as: <strong style={{ color: '#ffffff' }}>{user.full_name}</strong> ({user.role})
              </div>
              <Link
                to={getDashboardRoute()}
                onClick={closeMenu}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FileText size={18} /> {t('nav_dashboard')}
              </Link>
              <button
                onClick={() => {
                  closeMenu();
                  logout();
                  navigate('/');
                }}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', color: '#ffffff', borderColor: '#475569' }}
              >
                <LogOut size={18} /> {t('nav_logout')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #1e293b' }}>
              <Link to="/login" onClick={closeMenu} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', color: '#ffffff', borderColor: '#475569' }}>
                {t('nav_login')}
              </Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {t('nav_register')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Style overrides for responsive media queries */}
      <style>{`
        @media (max-width: 840px) {
          .desktop-only { display: none !important; }
          .mobile-only-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
};
