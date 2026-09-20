import React from 'react';
import { PhoneCall, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ background: 'var(--gov-navy)', color: '#94a3b8', padding: '3rem 0 1.5rem 0', marginTop: '4rem', borderTop: '1px solid #1e293b' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
            DIGITAL GRIEVANCE REDRESSAL SYSTEM
          </div>
          <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
            Official Civic Redressal Portal of the Government of Madhya Pradesh. Integrated with MPOnline to deliver fast, transparent, and SLA-backed grievance resolution for all citizens.
          </p>
        </div>

        <div>
          <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Useful Links</div>
          <ul style={{ listStyle: 'none', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/" style={{ color: '#94a3b8' }}>Public Analytics</a></li>
            <li><a href="/track" style={{ color: '#94a3b8' }}>Track Complaint Status</a></li>
            <li><a href="/admin-report" style={{ color: '#94a3b8' }}>Report District Admin Misconduct</a></li>
          </ul>
        </div>

        <div>
          <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Government Helpline & Support</div>
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PhoneCall size={16} color="var(--primary-500)" /> CM Helpline: <strong>181</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} color="var(--primary-500)" /> Support: <strong>grievance@mp.gov.in</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ borderTop: '1px solid #1e293b', paddingTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
        © {new Date().getFullYear()} Government of Madhya Pradesh. All Rights Reserved. Designed for MPOnline Civic Redressal Governance.
      </div>
    </footer>
  );
};
