import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const AIRecommendationCard = ({ recommendation, onApply }) => {
  if (!recommendation) return null;

  const {
    suggested_category_name,
    suggested_priority,
    confidence,
    reasoning,
    provider
  } = recommendation;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
      border: '1px solid #bbf7d0',
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.25rem',
      marginBottom: '1.25rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-700)', fontWeight: '700', fontSize: '0.9rem' }}>
          <Sparkles size={18} color="#059669" />
          <span>AI Category & Priority Recommendation</span>
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
            {provider === 'gemini' ? 'Gemini AI' : 'Rule Engine Fallback'}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1' }}>
          Confidence: {Math.round(confidence * 100)}%
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.75rem' }}>
        <div><strong>Suggested Category:</strong> {suggested_category_name || 'Civic Issue'}</div>
        <div><strong>Suggested Priority:</strong> {suggested_priority}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
          <em>{reasoning}</em>
        </div>
      </div>

      {onApply && (
        <button
          type="button"
          onClick={() => onApply(recommendation)}
          className="btn btn-primary"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <CheckCircle2 size={14} /> Apply AI Recommendation
        </button>
      )}
    </div>
  );
};
