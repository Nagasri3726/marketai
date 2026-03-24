import LiveEarnings from './LiveEarnings';
import { Play, XCircle, Download, Clock, DollarSign, User } from 'lucide-react';

const statusConfig = {
  active: { class: 'badge-active', label: 'Active' },
  pending: { class: 'badge-pending', label: 'Pending' },
  completed: { class: 'badge-completed', label: 'Completed' },
  cancelled: { class: 'badge-cancelled', label: 'Cancelled' },
  paused: { class: 'badge-pending', label: 'Paused' },
};

export default function StreamCard({ stream, isEmployer, onActivate, onCancel, onWithdraw }) {
  const status = statusConfig[stream.status] || statusConfig.pending;
  const total = parseFloat(stream.total_amount || 0);
  const withdrawn = parseFloat(stream.withdrawn_amount || 0);
  const progress = total > 0 ? (withdrawn / total) * 100 : 0;

  return (
    <div className="glass-card !p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{stream.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <User className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">
              {isEmployer ? stream.employee_detail?.username : stream.employer_detail?.username}
            </span>
          </div>
        </div>
        <span className={status.class}>{status.label}</span>
      </div>

      {/* Live Earnings (mini) */}
      {stream.status === 'active' && !isEmployer && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-[10px] text-accent-400 uppercase tracking-wider font-semibold">Accruing Now</span>
          </div>
          <LiveEarnings streams={[stream]} />
        </div>
      )}

      {/* Amount Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-sm font-mono font-bold text-white">{total.toFixed(2)} <span className="text-xs text-slate-500">ALGO</span></p>
        </div>
        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Withdrawn</p>
          <p className="text-sm font-mono font-bold text-accent-400">{withdrawn.toFixed(2)} <span className="text-xs text-slate-500">ALGO</span></p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Progress</span>
          <span className="font-mono">{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>

      {/* Time */}
      {stream.start_time && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-4">
          <Clock className="w-3 h-3" />
          {new Date(stream.start_time).toLocaleDateString()} → {stream.end_time ? new Date(stream.end_time).toLocaleDateString() : 'Ongoing'}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isEmployer && stream.status === 'pending' && (
          <button onClick={() => onActivate?.(stream.id)} className="btn-green btn-sm flex-1 flex items-center justify-center gap-1.5 text-xs">
            <Play className="w-3.5 h-3.5" /> Activate
          </button>
        )}
        {isEmployer && ['active', 'pending'].includes(stream.status) && (
          <button onClick={() => onCancel?.(stream.id)} className="btn-danger btn-sm flex-1 flex items-center justify-center gap-1.5 text-xs">
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
        {!isEmployer && stream.status === 'active' && (
          <button onClick={() => onWithdraw?.(stream.id)} className="btn-green btn-sm flex-1 flex items-center justify-center gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Withdraw
          </button>
        )}
      </div>
    </div>
  );
}
