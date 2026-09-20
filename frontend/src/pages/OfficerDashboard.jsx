import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CheckCircle2, PauseCircle, Play, Eye, FileText } from 'lucide-react';

export const OfficerDashboard = () => {
  const { user } = useAuth();
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolve Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');

  const fetchData = async () => {
    try {
      const [dashRes, compRes] = await Promise.all([
        api.get('/officer/dashboard'),
        api.get('/officer/assigned-complaints')
      ]);
      setDashboardMetrics(dashRes.data);
      setComplaints(compRes.data);
    } catch (err) {
      console.error('Officer dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartProgress = async (cmpId) => {
    try {
      await api.post(`/officer/complaints/${cmpId}/start`);
      fetchData();
    } catch (err) {
      alert('Failed to start complaint progress');
    }
  };

  const handleHold = async (cmpId) => {
    const remarks = prompt('Enter reason for placing complaint on hold:');
    if (!remarks) return;
    try {
      await api.post(`/officer/complaints/${cmpId}/hold?remarks=${encodeURIComponent(remarks)}`);
      fetchData();
    } catch (err) {
      alert('Failed to place on hold');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !resolutionSummary.trim()) return;
    try {
      await api.post(`/officer/complaints/${selectedComplaint.id}/resolve`, {
        resolution_summary: resolutionSummary
      });
      setShowResolveModal(false);
      setResolutionSummary('');
      fetchData();
    } catch (err) {
      alert('Resolution submission failed');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--gov-navy)' }}>
          Grievance Officer Task Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          Welcome {user?.full_name} ({dashboardMetrics?.officer_id || 'Officer'}). Manage your active assigned grievances.
        </p>
      </div>

      {/* Metrics Row */}
      {dashboardMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Active</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gov-navy)' }}>{dashboardMetrics.total_assigned}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Progress</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{dashboardMetrics.in_progress}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>On Hold</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#c2410c' }}>{dashboardMetrics.on_hold}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-600)' }}>{dashboardMetrics.resolved}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)', marginBottom: '1.25rem' }}>
          My Assigned Grievances
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assigned tasks...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div>No complaints currently assigned to your workload.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{c.complaint_no}</td>
                    <td>{c.subject}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: c.is_overdue ? '#b91c1c' : 'inherit', fontWeight: c.is_overdue ? '700' : 'normal' }}>
                      {new Date(c.sla_deadline).toLocaleString()} {c.is_overdue && '(OVERDUE)'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {c.status === 'ASSIGNED' && (
                          <button onClick={() => handleStartProgress(c.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            <Play size={12} /> Start
                          </button>
                        )}
                        {c.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setShowResolveModal(true);
                            }}
                            className="btn btn-primary"
                            style={{ background: '#059669', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <CheckCircle2 size={12} /> Mark Resolved
                          </button>
                        )}
                        {c.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleHold(c.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            <PauseCircle size={12} /> Hold
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gov-navy)', marginBottom: '0.75rem' }}>
              Mark {selectedComplaint.complaint_no} Resolved
            </h3>

            <form onSubmit={handleResolveSubmit}>
              <div className="form-group">
                <label className="form-label">Resolution Summary / Action Taken</label>
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder="Describe the physical work or administrative action completed to resolve this complaint..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowResolveModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669' }}>Confirm Resolution</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
