import { CreditCard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function CreditPanel({ credit, onUpdate }) {
  const [action, setAction] = useState(null);
  const [amount, setAmount] = useState('');

  const limit = parseFloat(credit?.credit_limit || 1000);
  const outstanding = parseFloat(credit?.outstanding || 0);
  const available = parseFloat(credit?.available_credit || limit);
  const used = limit > 0 ? (outstanding / limit) * 100 : 0;

  const handleAction = async (act) => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await api.post('/payroll/credit/', { action: act, amount: parseFloat(amount) });
      toast.success(`${act === 'borrow' ? 'Borrowed' : 'Repaid'} successfully!`);
      setAction(null); setAmount('');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.15)' }}>
          <CreditCard className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="section-title !text-base">Salary Credit</h3>
          <p className="text-xs text-slate-500">Borrow against earned salary</p>
        </div>
      </div>

      {/* Credit Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Used: {outstanding.toFixed(2)} ALGO</span>
          <span>Limit: {limit.toFixed(2)} ALGO</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(used, 100)}%`,
              background: used > 80 ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
                         used > 50 ? 'linear-gradient(90deg, #F59E0B, #EAB308)' :
                         'var(--gradient-blue-green)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <p className="text-xs text-slate-500 mb-1">Available Credit</p>
          <p className="text-lg font-bold font-mono text-accent-400">{available.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className="text-lg font-bold font-mono text-red-400">{outstanding.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => setAction('borrow')}
          className="btn-sm flex-1 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-all flex items-center justify-center gap-1.5">
          <ArrowDownCircle className="w-3.5 h-3.5" /> Borrow
        </button>
        <button onClick={() => setAction('repay')}
          className="btn-sm flex-1 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-all flex items-center justify-center gap-1.5">
          <ArrowUpCircle className="w-3.5 h-3.5" /> Repay
        </button>
      </div>

      {action && (
        <div className="mt-3 p-3 rounded-xl bg-dark-900/50 border border-slate-700/30 animate-slide-down">
          <p className="text-sm text-slate-300 mb-2 capitalize">{action}</p>
          <div className="flex gap-2">
            <input type="number" step="0.01" className="input-field text-sm py-1.5" placeholder="Amount"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={() => handleAction(action)} className="btn-primary btn-sm">Go</button>
            <button onClick={() => { setAction(null); setAmount(''); }} className="btn-secondary btn-sm">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
