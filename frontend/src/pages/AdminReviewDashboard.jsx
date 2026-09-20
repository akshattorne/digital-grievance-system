import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, AlertCircle, CheckCircle2, XCircle, FileText, AlertTriangle } from 'lucide-react';

export const AdminReviewDashboard = () => {
  const [reports, setReports] = useState([]);
  const [flaggedAdmins, setFlaggedAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('VALID');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  const fetchData = async () => {
    try {
      const [repRes, flagRes] = await Promise.all([
        api.get('/admin-review/reports'),
        api.get('/admin-review/flagged-admins')
      ]);
      setReports(repRes.data);
      setFlaggedAdmins(flagRes.data);
    } catch (err) {
      console.error('Error loading admin review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      await api.patch(`/admin-review/reports/${selectedReport.id}/status`, {
        status: newStatus,
        resolution_remarks: resolutionRemarks
      });
      setShowStatusModal(false);
      fetchData();
    } catch (err) {
      alert('Status update failed');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--gov-navy)' }}>
          State Administrative Review Authority Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          Internal administrative oversight for citizens' reports against District Admins.
        </p>
      </div>

      {/* Flagged Admins Threshold Alert Panel */}
      {flaggedAdmins.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={20} /> Flagged District Admins for Human Administrative Review
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {flaggedAdmins.map((a, i) => (
              <div key={i} style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--gov-navy)' }}>District {a.district_code} Admin: {a.admin_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>Email: {a.admin_email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                    {a.validated_reports_count} Validated Reports (Threshold: {a.configured_threshold})
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {a.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)', marginBottom: '1.25rem' }}>
          District Admin Reports Submissions
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShieldAlert size={40} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div>No admin misconduct reports submitted yet.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>District</th>
                  <th>Reason</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{r.report_no}</td>
                    <td><strong>{r.district_code}</strong></td>
                    <td>{r.reason}</td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description}</td>
                    <td>
                      <span className="badge" style={{
                        background: r.status === 'VALID' ? '#dcfce7' : r.status === 'INVALID' ? '#fee2e2' : '#fef3c7',
                        color: r.status === 'VALID' ? '#15803d' : r.status === 'INVALID' ? '#b91c1c' : '#b45309'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setNewStatus(r.status);
                          setShowStatusModal(true);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        Review Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Status Modal */}
      {showStatusModal && selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gov-navy)', marginBottom: '0.75rem' }}>
              Review Report {selectedReport.report_no}
            </h3>

            <form onSubmit={handleStatusSubmit}>
              <div className="form-group">
                <label className="form-label">Review Status Determination</label>
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="VALID">VALID (Legitimate Admin Misconduct)</option>
                  <option value="INVALID">INVALID (Unsubstantiated)</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Authority Findings & Remarks</label>
                <textarea
                  rows={4}
                  className="form-textarea"
                  placeholder="Record administrative findings, evidence evaluation, or resolution remarks..."
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
