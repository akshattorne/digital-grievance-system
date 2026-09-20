import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { PublicAnalyticsChart } from '../components/PublicAnalyticsChart';
import {
  BarChart3, UserCheck, ShieldAlert, AlertTriangle, Search, Filter,
  UserPlus, CheckCircle2, XCircle, Sparkles, RefreshCw, Eye
} from 'lucide-react';

export const DistrictAdminDashboard = () => {
  const { user } = useAuth();
  const districtCode = user?.district_code || 'IND';

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [recommendedOfficer, setRecommendedOfficer] = useState(null);
  const [targetOfficerId, setTargetOfficerId] = useState('');

  const [showCreateOfficerModal, setShowCreateOfficerModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    full_name: '', email: '', password: '', mobile: '', department_id: ''
  });

  const [departments, setDepartments] = useState([]);

  const fetchData = async () => {
    try {
      const [dashRes, compRes, offRes, deptRes] = await Promise.all([
        api.get('/district-admin/dashboard'),
        api.get(`/district-admin/complaints?status_filter=${statusFilter}&search_query=${searchQuery}`),
        api.get('/district-admin/officers'),
        api.get('/district-admin/departments').catch(() => ({ data: [] }))
      ]);

      setDashboardMetrics(dashRes.data);
      setComplaints(compRes.data);
      setOfficers(offRes.data);

      const depts = deptRes.data.length > 0 ? deptRes.data : [
        { id: 'PWD', name_en: 'Public Works Department (PWD)' },
        { id: 'PHE', name_en: 'Public Health Engineering (PHE)' },
        { id: 'MPPKVVCL', name_en: 'Electricity Board (MPPKVVCL)' },
        { id: 'NAGAR_NIGAM', name_en: 'Urban Administration (Nagar Nigam)' }
      ];
      setDepartments(depts);
      if (depts.length > 0) setNewOfficer((prev) => ({ ...prev, department_id: depts[0].id }));

      const analyticsRes = await api.get('/analytics/district-admin');
      setAnalyticsData(analyticsRes.data);

    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchQuery]);

  const handleFetchAiInsights = async () => {
    try {
      const res = await api.get('/ai/insights');
      setAiInsights(res.data);
    } catch (err) {
      console.error('AI Insights failed:', err);
    }
  };

  const handleOpenAssignModal = async (cmp) => {
    setSelectedComplaint(cmp);
    setShowAssignModal(true);
    setRecommendedOfficer(null);

    try {
      const recRes = await api.get(`/district-admin/recommend-officer/${cmp.id}`);
      if (recRes.data.recommended) {
        setRecommendedOfficer(recRes.data);
        setTargetOfficerId(recRes.data.officer_user_id);
      }
    } catch (err) {
      console.error('Officer recommendation error:', err);
    }
  };

  const handleAssignOfficerSubmit = async (e) => {
    e.preventDefault();
    if (!targetOfficerId || !selectedComplaint) return;
    try {
      await api.post(`/district-admin/complaints/${selectedComplaint.id}/assign`, {
        officer_id: targetOfficerId
      });
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Officer assignment failed');
    }
  };

  const handleStatusChange = async (cmpId, newStatus, remarks) => {
    try {
      await api.post(`/district-admin/complaints/${cmpId}/status`, {
        status: newStatus,
        remarks: remarks || `Status updated by District Admin to ${newStatus}`
      });
      fetchData();
    } catch (err) {
      alert('Status update failed');
    }
  };

  const handleCreateOfficerSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/district-admin/officers', {
        ...newOfficer,
        district_code: districtCode
      });
      setShowCreateOfficerModal(false);
      fetchData();
      alert('Grievance Officer created successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create officer');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: '700', textTransform: 'uppercase' }}>
            Strict District Data Isolation Mode
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--gov-navy)' }}>
            District Admin Control Panel ({districtCode})
          </h2>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#ffffff', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          >
            Complaint Management
          </button>
          <button
            onClick={() => setActiveTab('officers')}
            className={`btn ${activeTab === 'officers' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          >
            Officer Management
          </button>
          <button
            onClick={() => {
              setActiveTab('ai_insights');
              if (!aiInsights) handleFetchAiInsights();
            }}
            className={`btn ${activeTab === 'ai_insights' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          >
            <Sparkles size={15} /> AI Insights
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {dashboardMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Complaints</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gov-navy)' }}>{dashboardMetrics.total_complaints}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Received</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#b45309' }}>{dashboardMetrics.submitted + dashboardMetrics.received}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In Progress</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{dashboardMetrics.in_progress}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overdue SLAs</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#b91c1c' }}>{dashboardMetrics.overdue}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary-600)' }}>{dashboardMetrics.resolved}</div>
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)', marginBottom: '1rem' }}>
              Category Workload Distribution ({districtCode})
            </h3>
            {analyticsData && analyticsData.category_distribution ? (
              <PublicAnalyticsChart data={analyticsData.category_distribution.map(c => ({ name_en: c.category, count: c.count }))} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading distribution...</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)', marginBottom: '1rem' }}>
              Department Workload Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {analyticsData?.department_workload?.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{d.department}</span>
                  <span style={{ fontWeight: '800', color: 'var(--gov-navy)' }}>{d.count} complaints</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)' }}>
              District Grievances Management
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, subject, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '220px' }}
              />

              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REOPENED">REOPENED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
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
                    <td>{c.assigned_officer_name || <em style={{ color: '#94a3b8' }}>Unassigned</em>}</td>
                    <td style={{ fontSize: '0.8rem', color: c.is_overdue ? '#b91c1c' : 'inherit', fontWeight: c.is_overdue ? '700' : 'normal' }}>
                      {new Date(c.sla_deadline).toLocaleString()} {c.is_overdue && '(OVERDUE)'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleOpenAssignModal(c)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Assign
                        </button>
                        <button onClick={() => handleStatusChange(c.id, 'ON_HOLD', 'Placed on hold by Admin')} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Hold
                        </button>
                        <button onClick={() => handleStatusChange(c.id, 'REJECTED', 'Invalid/Duplicate complaint')} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICERS TAB */}
      {activeTab === 'officers' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gov-navy)' }}>
              Registered District Officers ({districtCode})
            </h3>
            <button onClick={() => setShowCreateOfficerModal(true)} className="btn btn-primary">
              <UserPlus size={16} /> Add New Grievance Officer
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Officer ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Active Workload</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{o.officer_id}</td>
                    <td>{o.full_name}</td>
                    <td>{o.department?.name_en || 'Department'}</td>
                    <td>{o.email}</td>
                    <td><strong style={{ color: 'var(--accent-blue)' }}>{o.active_workload} active</strong></td>
                    <td><span className="badge badge-resolved">{o.is_available ? 'Available' : 'Busy'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI INSIGHTS TAB */}
      {activeTab === 'ai_insights' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={22} color="#059669" />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gov-navy)' }}>
              District AI Executive Insights & Advisory
            </h3>
          </div>

          {aiInsights ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: '#166534', marginBottom: '0.35rem' }}>Executive Summary</h4>
                <p style={{ color: '#14532d', fontSize: '0.925rem' }}>{aiInsights.summary_text}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--gov-navy)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Key Highlights</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    {aiInsights.highlights?.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--gov-navy)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Operational Suggestions</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                    {aiInsights.operational_suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Generating Gemini AI Administrative Insights...
            </div>
          )}
        </div>
      )}

      {/* Assign Officer Modal */}
      {showAssignModal && selectedComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gov-navy)', marginBottom: '0.75rem' }}>
              Assign Officer to {selectedComplaint.complaint_no}
            </h3>

            {recommendedOfficer && recommendedOfficer.recommended && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', color: '#1e40af' }}>
                <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
                <strong>System Recommended Officer:</strong> {recommendedOfficer.officer_name} ({recommendedOfficer.officer_code}) - Lowest Active Workload ({recommendedOfficer.active_workload} active).
              </div>
            )}

            <form onSubmit={handleAssignOfficerSubmit}>
              <div className="form-group">
                <label className="form-label">Select Grievance Officer</label>
                <select
                  className="form-select"
                  value={targetOfficerId}
                  onChange={(e) => setTargetOfficerId(e.target.value)}
                >
                  <option value="">-- Choose Officer --</option>
                  {officers.map((o) => (
                    <option key={o.user_id} value={o.user_id}>
                      {o.full_name} ({o.officer_id}) - Workload: {o.active_workload} active
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Officer Modal */}
      {showCreateOfficerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gov-navy)', marginBottom: '1rem' }}>
              Create New District Officer
            </h3>

            <form onSubmit={handleCreateOfficerSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newOfficer.full_name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={newOfficer.department_id}
                  onChange={(e) => setNewOfficer({ ...newOfficer, department_id: e.target.value })}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name_en}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={newOfficer.password}
                  onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowCreateOfficerModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Officer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
