import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import api from '../services/api';
import { FilePlus, FileText, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        const res = await api.get('/complaints/my-complaints');
        setComplaints(res.data);
      } catch (err) {
        console.error('Error fetching complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyComplaints();
  }, []);

  const total = complaints.length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const submitted = complaints.filter((c) => c.status === 'SUBMITTED' || c.status === 'RECEIVED').length;

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--gov-navy)' }}>
            Welcome, {user?.full_name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            Track and manage your submitted civic grievances
          </p>
        </div>

        <Link to="/submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
          <FilePlus size={18} /> Submit New Grievance
        </Link>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Complaints</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--gov-navy)', marginTop: '0.2rem' }}>{total}</div>
        </div>

        <div className="card" style={{ background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Submitted / Pending</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#b45309', marginTop: '0.2rem' }}>{submitted}</div>
        </div>

        <div className="card" style={{ background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>In Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>{inProgress}</div>
        </div>

        <div className="card" style={{ background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Resolved / Closed</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginTop: '0.2rem' }}>{resolved}</div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)', marginBottom: '1.25rem' }}>
          My Submitted Grievances
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div>You haven't submitted any complaints yet.</div>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Grievance Now</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Subject</th>
                  <th>District</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace', color: 'var(--gov-navy)' }}>{c.complaint_no}</td>
                    <td>{c.subject}</td>
                    <td>{c.district_code}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/complaints/${c.id}`} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                        <Eye size={14} /> View Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
