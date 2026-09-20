import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Clock, Send, MessageSquare, AlertTriangle, RefreshCw, Star, CheckCircle, FileText } from 'lucide-react';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Reopen Modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenJustification, setReopenJustification] = useState('');
  const [reopenStatusMsg, setReopenStatusMsg] = useState('');

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Escalation Modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
      if (res.data.feedback) {
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post(`/complaints/${complaint.id}/messages`, { message: newMessage });
      setComplaint(res.data);
      setNewMessage('');
    } catch (err) {
      alert('Error sending message');
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/complaints/${complaint.id}/reopen`, { justification: reopenJustification });
      setReopenStatusMsg(res.data.message);
      fetchDetail();
      setShowReopenModal(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Reopen request failed.');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/complaints/${complaint.id}/feedback`, {
        rating: Number(rating),
        comments: feedbackComments,
        is_satisfied: isSatisfied
      });
      setFeedbackSubmitted(true);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.detail || 'Feedback submission failed.');
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/complaints/${complaint.id}/escalate`, { reason: escalateReason });
      alert('Complaint escalated to District Admin for review.');
      setShowEscalateModal(false);
      fetchDetail();
    } catch (err) {
      alert('Escalation failed.');
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>Loading complaint detail...</div>;
  if (error || !complaint) return <div className="container" style={{ padding: '4rem 1.5rem', color: '#b91c1c' }}>{error || 'Complaint not found.'}</div>;

  return (
    <div className="container" style={{ maxWidth: '960px', padding: '3.5rem 1.5rem' }}>
      <div className="card animate-fade-in" style={{ padding: '2.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complaint ID: <strong style={{ color: 'var(--gov-navy)' }}>{complaint.complaint_no}</strong></div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--gov-navy)', marginTop: '0.25rem' }}>{complaint.subject}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.is_overdue && (
              <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Overdue SLA</span>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem' }}>
          <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>District:</span> <br/><strong>{complaint.district_code}</strong></div>
          <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category:</span> <br/><strong>{complaint.category?.name_en || 'Civic Issue'}</strong></div>
          <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Officer:</span> <br/><strong>{complaint.assigned_officer_name || 'Pending Assignment'}</strong></div>
          <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SLA Deadline:</span> <br/><strong>{new Date(complaint.sla_deadline).toLocaleString()}</strong></div>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--gov-navy)', marginBottom: '0.5rem' }}>Description & Location</h3>
          <p style={{ fontSize: '0.925rem', color: '#334155', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            {complaint.description}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Location:</strong> {complaint.location_address}
          </div>
        </div>

        {/* Resolution Details if RESOLVED / CLOSED */}
        {complaint.resolution_summary && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem' }}>
            <h4 style={{ color: '#166534', fontSize: '1rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={18} /> Resolution Details
            </h4>
            <div style={{ fontSize: '0.9rem', color: '#14532d' }}>{complaint.resolution_summary}</div>
            {complaint.resolved_at && (
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.35rem' }}>
                Resolved on: {new Date(complaint.resolved_at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Reopen & Escalation Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="btn btn-outline"
              style={{ color: '#86198f', borderColor: '#e9d5ff' }}
            >
              <RefreshCw size={16} /> Request Reopen
            </button>
          )}

          <button
            onClick={() => setShowEscalateModal(true)}
            className="btn btn-outline"
            style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
          >
            <AlertTriangle size={16} /> Escalate to District Admin
          </button>
        </div>

        {/* Timeline Audit History */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={18} /> Chronological Audit History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {complaint.status_history?.map((h) => (
              <div key={h.id} style={{ padding: '0.85rem 1rem', borderLeft: '4px solid var(--primary-600)', background: '#ffffff', borderRadius: '0 var(--radius-md) var(--radius-md) 0', border: '1px solid var(--border-color)', borderLeftWidth: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Actor: <strong>{h.actor_role}</strong></span>
                  <span>{new Date(h.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--gov-navy)', marginTop: '0.2rem' }}>
                  Status: {h.new_status}
                </div>
                {h.remarks && <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>{h.remarks}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Structured Communication Thread */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={18} /> Citizen - Officer Communication Thread
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', maxHeight: '300px', overflowY: 'auto' }}>
            {complaint.messages?.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No messages exchanged yet.</div>
            ) : (
              complaint.messages?.map((m) => (
                <div key={m.id} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: m.sender_role === 'OFFICER' ? '#eff6ff' : '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <strong>{m.sender_role}</strong> • {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{m.message}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Write a message to officer/admin..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Send
            </button>
          </form>
        </div>

        {/* Citizen Feedback Section */}
        {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
          <div style={{ marginTop: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)', marginBottom: '1rem' }}>
              Citizen Feedback & Rating
            </h3>

            {feedbackSubmitted || complaint.feedback ? (
              <div style={{ color: 'var(--primary-700)', fontWeight: '600' }}>
                ✓ Rating: {complaint.feedback?.rating || rating} Stars • {complaint.feedback?.is_satisfied ? 'Satisfied' : 'Not Satisfied'}
                <p style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  "{complaint.feedback?.comments || feedbackComments || 'No comment provided.'}"
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Rating:</label>
                  <select className="form-select" style={{ width: 'auto' }} value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Very Dissatisfied</option>
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={isSatisfied} onChange={(e) => setIsSatisfied(e.target.checked)} />
                    Satisfied with resolution
                  </label>
                </div>

                <div className="form-group">
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Provide optional comments regarding grievance resolution..."
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Submit Rating & Feedback
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Reopen Request Modal */}
      {showReopenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gov-navy)', marginBottom: '0.75rem' }}>
              Request Complaint Reopen
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {complaint.status === 'CLOSED'
                ? 'CLOSED complaints require justification and District Admin approval.'
                : 'RESOLVED complaints will be directly marked REOPENED.'}
            </p>

            <form onSubmit={handleReopenSubmit}>
              <div className="form-group">
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder="Explain clearly why the resolution was incomplete or unsatisfactory..."
                  value={reopenJustification}
                  onChange={(e) => setReopenJustification(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowReopenModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Reopen Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
              Escalate to District Admin
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Provide reasons why SLA delay or officer inaction requires District Admin intervention.
            </p>

            <form onSubmit={handleEscalateSubmit}>
              <div className="form-group">
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder="Reason for escalation..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowEscalateModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-danger">Escalate Grievance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
