import { Settings, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const categoryEmojis = {
  savings: '💰', rent: '🏠', investment: '📈',
  emergency: '🚨', spending: '🛒', custom: '⚡',
};

const categoryColors = {
  savings: '#22C55E', rent: '#2563EB', investment: '#7C3AED',
  emergency: '#EF4444', spending: '#F59E0B', custom: '#64748B',
};

export default function AutoSplitConfig({ rules, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', category: 'custom', percentage: '' });

  const totalPercentage = rules.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0);

  const handleAdd = async () => {
    if (!newRule.name || !newRule.percentage) { toast.error('Fill all fields'); return; }
    if (totalPercentage + parseFloat(newRule.percentage) > 100) {
      toast.error('Total exceeds 100%'); return;
    }
    try {
      await api.post('/payroll/splits/', {
        ...newRule, percentage: parseFloat(newRule.percentage)
      });
      toast.success('Split rule added!');
      setShowAdd(false);
      setNewRule({ name: '', category: 'custom', percentage: '' });
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to create rule');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/payroll/splits/${id}/`);
      toast.success('Rule removed');
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.15)' }}>
            <Settings className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="section-title !text-base">Auto-Split Engine</h3>
            <p className="text-xs text-slate-500">{totalPercentage.toFixed(0)}% allocated</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Stacked Bar */}
      <div className="flex rounded-full overflow-hidden h-3 mb-4" style={{ background: 'rgba(100,116,139,0.1)' }}>
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="h-full transition-all duration-500"
            style={{
              width: `${parseFloat(rule.percentage)}%`,
              background: categoryColors[rule.category] || '#64748B',
            }}
            title={`${rule.name}: ${rule.percentage}%`}
          />
        ))}
        {totalPercentage < 100 && (
          <div className="h-full" style={{ width: `${100 - totalPercentage}%`, background: 'rgba(100,116,139,0.15)' }} />
        )}
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/3 transition-all"
            style={{ borderLeft: `3px solid ${categoryColors[rule.category] || '#64748B'}` }}>
            <div className="flex items-center gap-2">
              <span className="text-sm">{categoryEmojis[rule.category] || '⚡'}</span>
              <span className="text-sm text-slate-200">{rule.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold text-white">{parseFloat(rule.percentage).toFixed(0)}%</span>
              <button onClick={() => handleDelete(rule.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-3">No split rules yet</p>
        )}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mt-4 p-3 rounded-xl bg-dark-900/50 border border-slate-700/30 animate-slide-down space-y-2">
          <input className="input-field text-sm py-1.5" placeholder="Rule name (e.g. Rent)"
            value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} />
          <div className="flex gap-2">
            <select className="input-field text-sm py-1.5" value={newRule.category}
              onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}>
              <option value="savings">💰 Savings</option>
              <option value="rent">🏠 Rent</option>
              <option value="investment">📈 Investment</option>
              <option value="emergency">🚨 Emergency</option>
              <option value="spending">🛒 Spending</option>
              <option value="custom">⚡ Custom</option>
            </select>
            <input type="number" className="input-field text-sm py-1.5 w-24" placeholder="%"
              value={newRule.percentage} onChange={(e) => setNewRule({ ...newRule, percentage: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary btn-sm flex-1">Add Rule</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
