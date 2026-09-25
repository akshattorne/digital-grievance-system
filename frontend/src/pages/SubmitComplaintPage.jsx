import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import api from '../services/api';
import { FileText, Send, Sparkles, AlertCircle, ShieldCheck, Upload } from 'lucide-react';

import { ALL_MP_DISTRICTS } from '../constants/districts';

export const SubmitComplaintPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAnonQuery = searchParams.get('anonymous') === 'true';
  const [isAnonymous, setIsAnonymous] = useState(isAnonQuery || !user);

  const [districts, setDistricts] = useState(ALL_MP_DISTRICTS);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    district_code: 'IND',
    category_id: '',
    department_id: '',
    priority: 'MEDIUM',
    location_address: '',
    contact_email: user?.email || '',
    contact_mobile: user?.mobile || ''
  });

  const [recommendation, setRecommendation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anonSuccessData, setAnonSuccessData] = useState(null);

  useEffect(() => {
    const loadFormData = async () => {
      const results = await Promise.allSettled([
        api.get('/complaints/categories'),
        api.get('/complaints/districts'),
        api.get('/complaints/departments')
      ]);

      const [catResult, distResult, deptResult] = results;

      if (catResult.status === 'fulfilled' && catResult.value.data?.length > 0) {
        const catList = catResult.value.data;
        setCategories(catList);
        const firstCat = catList[0];
        const initialDeptId = firstCat.mappings?.[0]?.department_id || '';
        setFormData((prev) => ({
          ...prev,
          category_id: firstCat.id,
          department_id: prev.department_id || initialDeptId
        }));
      }

      if (distResult.status === 'fulfilled' && distResult.value.data?.length > 0) {
        setDistricts(distResult.value.data.map(d => ({ code: d.code, name: d.name_en })));
      }

      if (deptResult.status === 'fulfilled' && deptResult.value.data?.length > 0) {
        setDepartments(deptResult.value.data);
      }
    };
    loadFormData();
  }, []);

  const handleCategoryChange = (catId) => {
    const selectedCat = categories.find(c => c.id === catId);
    const targetDeptId = selectedCat?.mappings?.[0]?.department_id || formData.department_id;
    setFormData((prev) => ({
      ...prev,
      category_id: catId,
      department_id: targetDeptId
    }));
  };

  const handleGetAiRecommendation = async () => {
    if (!formData.description || formData.description.length < 5) {
      setError('Please enter a description first to get AI category suggestion.');
      return;
    }
    setError('');
    setAiLoading(true);
    try {
      const res = await api.post('/ai/recommend', {
        subject: formData.subject,
        description: formData.description
      });
      setRecommendation(res.data);
    } catch (err) {
      console.error('AI Recommendation error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiRecommendation = (rec) => {
    if (rec.suggested_category_id) {
      setFormData((prev) => ({
        ...prev,
        category_id: rec.suggested_category_id,
        priority: rec.suggested_priority || prev.priority
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAnonymous) {
        const res = await api.post('/complaints/submit-anonymous', formData);
        setAnonSuccessData(res.data);
      } else {
        const res = await api.post('/complaints/submit', formData);
        navigate(`/complaints/${res.data.id}`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Failed to submit grievance. Please verify input fields.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join(', ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (anonSuccessData) {
    return (
      <div className="container" style={{ maxWidth: '600px', padding: '4rem 1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <ShieldCheck size={48} color="#059669" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.6rem', color: '#065f46', marginBottom: '0.75rem' }}>
            Anonymous Grievance Submitted!
          </h2>
          <p style={{ color: '#166534', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Your complaint has been safely routed to the District Admin. Save your access credentials securely:
          </p>

          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0', textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complaint ID:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gov-navy)', marginBottom: '0.75rem' }}>
              {anonSuccessData.complaint_no}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Secret Tracking Code:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0369a1', fontFamily: 'monospace' }}>
              {anonSuccessData.tracking_code}
            </div>
          </div>

          <button
            onClick={() => {
              sessionStorage.setItem('anon_token', anonSuccessData.anonymous_access_token);
              navigate(`/track?complaint_no=${anonSuccessData.complaint_no}&code=${anonSuccessData.tracking_code}`);
            }}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Track Grievance Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '3.5rem 1.5rem' }}>
      <div className="card animate-fade-in" style={{ padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--gov-navy)', marginBottom: '0.5rem' }}>
            {isAnonymous ? 'File Anonymous Civic Grievance' : 'File New Civic Grievance'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            {isAnonymous
              ? 'No account required. You will receive a secure Complaint ID & Secret Tracking Code.'
              : 'Logged in as registered citizen. Track progress & communicate directly with assigned officers.'}
          </p>

          <div style={{ display: 'inline-flex', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.3rem', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsAnonymous(false)}
              className={`btn ${!isAnonymous ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              Registered Citizen Mode
            </button>
            <button
              type="button"
              onClick={() => setIsAnonymous(true)}
              className={`btn ${isAnonymous ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              Anonymous Citizen Mode
            </button>
          </div>
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select District</label>
              <select
                className="form-select"
                value={formData.district_code}
                onChange={(e) => setFormData({ ...formData, district_code: e.target.value })}
              >
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Department</label>
              <select
                className="form-select"
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                {departments.length === 0 ? (
                  <option value="">Auto-Assigned by Category</option>
                ) : (
                  departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>{dep.name_en} ({dep.code})</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Grievance Subject</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Water Pipeline Leakage on Main Road"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Detailed Description</label>
              <button
                type="button"
                onClick={handleGetAiRecommendation}
                disabled={aiLoading}
                style={{ fontSize: '0.775rem', color: 'var(--primary-700)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Sparkles size={14} /> {aiLoading ? 'Analyzing Text...' : 'Get AI Category Recommendation'}
              </button>
            </div>
            <textarea
              required
              rows={4}
              className="form-textarea"
              placeholder="Provide exact details of the civic issue, location markers, duration, and severity..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* AI Recommendation Preview */}
          <AIRecommendationCard
            recommendation={recommendation}
            onApply={handleApplyAiRecommendation}
          />

          <div className="form-group">
            <label className="form-label">Location / Address</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Street address, landmark, colony, ward no..."
              value={formData.location_address}
              onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Initial Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low (Standard SLA)</option>
                <option value="MEDIUM">Medium (Default SLA)</option>
                <option value="HIGH">High (Urgent 0.5x SLA)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email (Optional for updates)</label>
              <input
                type="email"
                className="form-input"
                placeholder="citizen@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem', fontSize: '1rem' }}
          >
            {loading ? 'Submitting Grievance...' : 'Submit Grievance Now'} <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
