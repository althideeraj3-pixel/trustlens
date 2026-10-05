// src/pages/admin/AdminRules.jsx
// Deterministic Risk Rule Engine configuration: weight calibration, category assignment, and audit-logged adjustments.

import React, { useState, useEffect } from 'react';
import { apiGetAdminRules, apiUpdateAdminRule } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AdminRules = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Editing state
  const [editingRule, setEditingRule] = useState(null);
  const [editWeight, setEditWeight] = useState(15);
  const [editActive, setEditActive] = useState(true);
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await apiGetAdminRules();
      setRules(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load risk engine rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleStartEdit = (rule) => {
    setEditingRule(rule);
    setEditWeight(rule.weight);
    setEditActive(rule.active !== false);
    setEditDescription(rule.description || '');
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRule) return;

    const parsedWeight = parseInt(editWeight, 10);
    if (isNaN(parsedWeight) || parsedWeight < 0 || parsedWeight > 100) {
      setError('Rule weight must be a valid number between 0 and 100.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await apiUpdateAdminRule(editingRule._id, {
        weight: parsedWeight,
        active: editActive,
        description: editDescription
      });

      setSuccess(`Rule ${editingRule.ruleId} weight updated to ${parsedWeight} (Active: ${editActive ? 'Yes' : 'No'}). Audit log entry created.`);
      setRules(prev => prev.map(r => r._id === editingRule._id ? { ...r, weight: parsedWeight, active: editActive, description: editDescription } : r));
      setEditingRule(null);
    } catch (err) {
      setError(err.message || 'Failed to update rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t.ruleConfiguration}
            </h1>
            <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
              {t.explainableLogic}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {t.rulesDesc}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ✅ {success}
        </div>
      )}

      {/* Rules Table */}
      <div className="data-table-card">
        <div className="data-table-header">
          <div className="data-table-title">{t.activeRules} ({rules.length})</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t.boundedWeights}
          </div>
        </div>

        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.loadingRules}
            </div>
          ) : rules.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.noRules}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.ruleCode}</th>
                  <th>{t.patternName}</th>
                  <th>{t.category}</th>
                  <th>{t.description}</th>
                  <th>{t.weightImpact}</th>
                  <th>{t.status}</th>
                  <th>{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id} style={{ opacity: rule.active !== false ? 1 : 0.55 }}>
                    <td>
                      <code style={{ background: '#090d16', padding: '0.2rem 0.45rem', borderRadius: '4px', color: '#38bdf8', fontWeight: 700 }}>
                        {rule.ruleId}
                      </code>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rule.name}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'var(--bg-surface-elevated)', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {rule.category || 'General'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      {rule.description}
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: rule.weight >= 30 ? '#ef4444' : rule.weight >= 20 ? '#f59e0b' : '#38bdf8' }}>
                        +{rule.weight}
                      </strong>
                    </td>
                    <td>
                      <span className={rule.active !== false ? 'badge-status-active' : 'badge-status-disabled'}>
                        {rule.active !== false ? t.active : t.inactive}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => handleStartEdit(rule)}
                      >
                        {t.calibrate} ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rule Calibration Modal */}
      {editingRule && (
        <div className="modal-backdrop" onClick={() => setEditingRule(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.editRule}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {editingRule.ruleId}: {editingRule.name}
                </h3>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                onClick={() => setEditingRule(null)}
              >
                ✕ {t.cancel}
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">{t.ruleWeight}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t.weightHelp}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t.explanatoryNote}</label>
                <textarea
                  className="scanner-textarea"
                  rows="3"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="rule-active"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
                />
                <label htmlFor="rule-active" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  {t.enforceRule}
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingRule(null)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-analyze"
                  disabled={saving}
                >
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRules;
