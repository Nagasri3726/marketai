import { Target, TrendingUp, Calendar } from 'lucide-react';
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const categoryColors = {
  rent: '#2563EB', travel: '#7C3AED', emergency: '#EF4444',
  education: '#F59E0B', gadget: '#22C55E', custom: '#64748B',
};

export default function GoalCard({ goal, onUpdate }) {
  const [fundAmount, setFundAmount] = useState('');
  const [showFund, setShowFund] = useState(false);

  const progress = parseFloat(goal.progress_percentage || 0);
  const color = categoryColors[goal.category] || '#64748B';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const handleFund = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) return;
    try {
      await api.post(`/payroll/goals/${goal.id}/fund/`, { amount: parseFloat(fundAmount) });
      toast.success('Goal funded!');
      setShowFund(false); setFundAmount('');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fund goal');
    }
  };

  return (
    <div className="glass-card !p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="84" height="84" className="transform -rotate-90">
            <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="5" />
            <circle
              cx="42" cy="42" r={radius} fill="none"
              stroke={color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <h4 className="text-sm font-semibold text-white truncate">{goal.name}</h4>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Target className="w-3 h-3" />
            <span className="font-mono">{parseFloat(goal.current_amount).toFixed(2)}</span>
            <span>/</span>
            <span className="font-mono">{parseFloat(goal.target_amount).toFixed(2)} ALGO</span>
          </div>
          {goal.deadline && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
          )}
          {goal.is_completed && (
            <span className="badge-completed mt-1 inline-block">✓ Completed</span>
          )}
        </div>
      </div>

      {/* Fund Action */}
      {!goal.is_completed && (
        <div className="mt-3">
          {showFund ? (
            <div className="flex gap-2 animate-slide-down">
              <input type="number" step="0.01" className="input-field text-sm py-1.5" placeholder="Amount"
                value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
              <button onClick={handleFund} className="btn-green btn-sm">Fund</button>
              <button onClick={() => setShowFund(false)} className="btn-secondary btn-sm">✕</button>
            </div>
          ) : (
            <button onClick={() => setShowFund(true)}
              className="w-full btn-sm text-xs text-slate-400 border border-slate-700/30 rounded-lg hover:bg-slate-700/20 transition-all">
              + Add Funds
            </button>
          )}
        </div>
      )}
    </div>
  );
}
