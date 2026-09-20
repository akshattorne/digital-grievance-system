import React, { useState } from 'react';
import api from '../services/api';

export const AdminReportPage = () => {
  const [form, setForm] = useState({ district_code: '', reason: '', description: '', related_complaint_no: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/admin-review/reports', {
        ...form,
        district_code: form.district_code.trim().toUpperCase(),
        related_complaint_no: form.related_complaint_no.trim() || null,
      });
      setMessage(`Your report ${response.data.report_no} has been submitted for independent review.`);
      setForm({ district_code: '', reason: '', description: '', related_complaint_no: '' });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to submit the report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '3.5rem 1.5rem' }}>
      <div className="card">
        <h1 style={{ color: 'var(--gov-navy)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>Report District Admin Misconduct</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Reports are reviewed by the Administrative Review Authority. This process does not apply an automatic penalty.</p>
        {message && <div style={{ background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1rem', padding: '0.75rem 1rem' }}>{message}</div>}
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: '1rem', padding: '0.75rem 1rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label" htmlFor="district_code">District code</label><input id="district_code" name="district_code" required maxLength="10" className="form-input" placeholder="e.g. IND" value={form.district_code} onChange={update} /></div>
          <div className="form-group"><label className="form-label" htmlFor="reason">Reason</label><input id="reason" name="reason" required minLength="3" maxLength="255" className="form-input" value={form.reason} onChange={update} /></div>
          <div className="form-group"><label className="form-label" htmlFor="description">Description</label><textarea id="description" name="description" required minLength="10" rows="6" className="form-textarea" value={form.description} onChange={update} /></div>
          <div className="form-group"><label className="form-label" htmlFor="related_complaint_no">Related complaint ID (optional)</label><input id="related_complaint_no" name="related_complaint_no" className="form-input" value={form.related_complaint_no} onChange={update} /></div>
          <button className="btn btn-primary" disabled={submitting} type="submit">{submitting ? 'Submitting…' : 'Submit report'}</button>
        </form>
      </div>
    </div>
  );
};
