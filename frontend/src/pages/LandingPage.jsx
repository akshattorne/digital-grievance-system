import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { PublicAnalyticsChart } from '../components/PublicAnalyticsChart';
import api from '../services/api';
import {
  FilePlus, Shield, Search, BarChart3, CheckCircle2,
  Clock, AlertCircle, HelpCircle, UserCheck
} from 'lucide-react';

export const LandingPage = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchPublicAnalytics = async () => {
      try {
        const res = await api.get('/analytics/public');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load public analytics:', err);
      }
    };
    fetchPublicAnalytics();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--gov-navy) 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '4.5rem 0 3.5rem 0',
        borderBottom: '4px solid var(--primary-600)'
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
              <Shield size={16} /> Official MP Civic Portal
            </div>
            <h1 style={{ fontSize: '2.6rem', lineHeight: '1.15', marginBottom: '1rem' }}>
              {t('hero_title')}
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}>
              {t('hero_subtitle')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
              <Link to="/submit" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.35rem' }}>
                <FilePlus size={18} /> {t('btn_submit_registered')}
              </Link>
              <Link to="/submit?anonymous=true" className="btn btn-navy" style={{ background: '#334155', fontSize: '1rem', padding: '0.75rem 1.35rem' }}>
                <Shield size={18} /> {t('btn_submit_anonymous')}
              </Link>
              <Link to="/track" className="btn btn-outline" style={{ color: '#ffffff', borderColor: '#475569', fontSize: '1rem', padding: '0.75rem 1.35rem' }}>
                <Search size={18} /> {t('btn_track')}
              </Link>
            </div>
          </div>

          {/* Quick Metrics Header Overlay */}
          <div className="card glass-card" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-gold)', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Real-Time Governance Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Complaints</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>
                  {analytics ? analytics.total_complaints : '---'}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Resolved Rate</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>
                  {analytics ? `${analytics.resolution_rate_percent}%` : '---'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
              ✓ SLA-backed tracking | Strict District Isolation | Gemini AI Insights
            </div>
          </div>
        </div>
      </section>



      {/* Public Aggregated Analytics Section */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--gov-navy)', marginBottom: '0.5rem' }}>
              Public Portal Analytics & Insights
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Aggregated & anonymized metrics across Madhya Pradesh districts. No private citizen identity is exposed.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gov-navy)' }}>
                Top Grievance Categories Breakdown
              </h3>
              {analytics && analytics.category_trends ? (
                <PublicAnalyticsChart data={analytics.category_trends} />
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Loading analytics chart...
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--gov-navy)' }}>
                Resolution Performance Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: '600' }}>Resolved Grievances</span>
                  <span style={{ fontWeight: '800', color: 'var(--primary-600)' }}>{analytics ? analytics.resolved_complaints : 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: '600' }}>In Progress Workload</span>
                  <span style={{ fontWeight: '800', color: 'var(--accent-blue)' }}>{analytics ? analytics.in_progress_complaints : 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: '600' }}>Overall SLA Success</span>
                  <span style={{ fontWeight: '800', color: 'var(--gov-gold)' }}>{analytics ? `${analytics.resolution_rate_percent}%` : '0%'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
