import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Search, Shield, Clock, Send, MessageSquare, AlertCircle } from 'lucide-react';

const anonymousAuth = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('anon_token')}` }
});

export const AnonymousTrackPage = () => {
  const [searchParams] = useSearchParams();
  const initialNo = searchParams.get('complaint_no') || '';
  const initialCode = searchParams.get('code') || '';

  const [complaintNo, setComplaintNo] = useState(initialNo);
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [complaint, setComplaint] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Authenticate tracking credentials to get session token
      const authRes = await api.post('/complaints/track-anonymous', {
        complaint_no: complaintNo.trim().toUpperCase(),
        tracking_code: trackingCode.trim()
      });

      sessionStorage.setItem('anon_token', authRes.data.access_token);

      // 2. Fetch Detail
      const detailRes = await api.get(`/complaints/${authRes.data.complaint_no}`, anonymousAuth());
      setComplaint(detailRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid Complaint ID or Secret Tracking Code.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialNo && initialCode) {
      handleTrack();
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !complaint) return;
    try {
      const res = await api.post(
        `/complaints/${complaint.id}/messages`,
        { message: newMessage },
        anonymousAuth(),
      );
      setComplaint(res.data);
      setNewMessage('');
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '3.5rem 1.5rem' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Shield size={24} color="var(--primary-600)" />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--gov-navy)' }}>Track Anonymous / Public Grievance</h2>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleTrack} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Complaint ID</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. IND-GRV-2026-000001"
              value={complaintNo}
              onChange={(e) => setComplaintNo(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Secret Tracking Code</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. TRK-98A4B2"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.7rem 1.25rem' }}>
            <Search size={16} /> {loading ? 'Fetching...' : 'Track'}
          </button>
        </form>
      </div>

      {complaint && (
        <div className="card animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complaint ID: <strong>{complaint.complaint_no}</strong></div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--gov-navy)', marginTop: '0.25rem' }}>{complaint.subject}</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div><strong>District:</strong> {complaint.district_code}</div>
            <div><strong>Category:</strong> {complaint.category?.name_en || 'Civic Issue'}</div>
            <div><strong>Location:</strong> {complaint.location_address}</div>
            <div><strong>SLA Deadline:</strong> {new Date(complaint.sla_deadline).toLocaleString()}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--gov-navy)', marginBottom: '0.5rem' }}>Description</h4>
            <p style={{ fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              {complaint.description}
            </p>
          </div>

          {/* Activity Timeline */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--gov-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={16} /> Activity Audit History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {complaint.status_history?.map((h) => (
                <div key={h.id} style={{ padding: '0.75rem', borderLeft: '3px solid var(--primary-600)', background: '#ffffff', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', border: '1px solid var(--border-color)', borderLeftWidth: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Actor: <strong>{h.actor_role}</strong></span>
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', marginTop: '0.2rem' }}>Status: {h.new_status}</div>
                  {h.remarks && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>{h.remarks}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Structured Communication Thread */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--gov-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MessageSquare size={16} /> Structured Officer Communication
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
              {complaint.messages?.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', italic: 'true' }}>No messages exchanged yet.</div>
              ) : (
                complaint.messages?.map((m) => (
                  <div key={m.id} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: m.sender_role === 'OFFICER' ? '#eff6ff' : '#f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <strong>{m.sender_role}</strong> • {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{m.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Provide additional details or reply to officer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
