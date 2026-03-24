import { Wallet, Lock, TrendingUp, ArrowUpRight, ArrowDownLeft, Repeat } from 'lucide-react';
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SalaryWallet({ wallet, onUpdate }) {
  const [action, setAction] = useState(null);
  const [amount, setAmount] = useState('');

  const total = parseFloat(wallet?.available_balance || 0)
    + parseFloat(wallet?.locked_balance || 0)
    + parseFloat(wallet?.invested_balance || 0);

  const segments = [
    { label: 'Available', value: parseFloat(wallet?.available_balance || 0), color: '#22C55E', icon: Wallet },
    { label: 'Locked', value: parseFloat(wallet?.locked_balance || 0), color: '#2563EB', icon: Lock },
    { label: 'Invested', value: parseFloat(wallet?.invested_balance || 0), color: '#7C3AED', icon: TrendingUp },
  ];

  const handleAction = async (act) => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await api.post('/payroll/wallet/', { action: act, amount: parseFloat(amount) });
      toast.success(`${act} successful!`);
      setAction(null); setAmount('');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="glass-card-green">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
            <Wallet className="w-5 h-5 text-accent-500" />
          </div>
          <div>
            <h3 className="section-title !text-base">Salary Wallet</h3>
            <p className="text-xs text-slate-500">Total: {total.toFixed(2)} ALGO</p>
          </div>
        </div>
      </div>

      {/* Segmented Bar */}
      <div className="flex rounded-full overflow-hidden h-3 mb-4" style={{ background: 'rgba(100, 116, 139, 0.15)' }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="wallet-segment"
            style={{
              width: total > 0 ? `${(seg.value / total) * 100}%` : '33.3%',
              background: seg.color,
              opacity: seg.value > 0 ? 1 : 0.2,
            }}
          />
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {segments.map((seg) => (
          <div key={seg.label} className="text-center">
            <seg.icon className="w-4 h-4 mx-auto mb-1" style={{ color: seg.color }} />
            <p className="text-lg font-bold font-mono text-white">{seg.value.toFixed(2)}</p>
            <p className="text-xs text-slate-400">{seg.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button onClick={() => setAction('withdraw')} className="btn-sm flex-1 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-all flex items-center justify-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
        </button>
        <button onClick={() => setAction('lock')} className="btn-sm flex-1 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-all flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Lock
        </button>
        <button onClick={() => setAction('invest')} className="btn-sm flex-1 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-all flex items-center justify-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Invest
        </button>
      </div>

      {/* Action Modal */}
      {action && (
        <div className="mt-4 p-4 rounded-xl bg-dark-900/50 border border-slate-700/30 animate-slide-down">
          <p className="text-sm text-slate-300 mb-2 capitalize">{action} funds</p>
          <div className="flex gap-2">
            <input type="number" step="0.01" className="input-field text-sm py-2" placeholder="Amount"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={() => handleAction(action)} className="btn-primary btn-sm whitespace-nowrap">Confirm</button>
            <button onClick={() => { setAction(null); setAmount(''); }} className="btn-secondary btn-sm">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
