import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Shield, DollarSign, Activity, Wallet, Archive, Target, CreditCard, Settings, TrendingUp } from 'lucide-react';

const actionIcons = {
  stream_created: Activity, stream_started: Activity,
  stream_paused: Activity, stream_cancelled: Activity,
  withdrawal: DollarSign, milestone_approved: Shield,
  milestone_paid: DollarSign, wallet_created: Wallet,
  asset_created: Archive,
  investment_created: TrendingUp, credit_borrowed: CreditCard,
  credit_repaid: CreditCard, goal_created: Target,
  goal_funded: Target, split_updated: Settings,
};

const actionColors = {
  stream_created: 'text-primary-400 bg-primary-400/10',
  stream_started: 'text-accent-400 bg-accent-400/10',
  stream_cancelled: 'text-red-400 bg-red-400/10',
  withdrawal: 'text-accent-400 bg-accent-400/10',
  milestone_paid: 'text-yellow-400 bg-yellow-400/10',
  wallet_created: 'text-glow-400 bg-glow-400/10',
  investment_created: 'text-glow-400 bg-glow-400/10',
  credit_borrowed: 'text-primary-400 bg-primary-400/10',
  credit_repaid: 'text-accent-400 bg-accent-400/10',
  goal_created: 'text-glow-400 bg-glow-400/10',
  goal_funded: 'text-accent-400 bg-accent-400/10',
  split_updated: 'text-primary-400 bg-primary-400/10',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/payroll/audit-logs/');
        setLogs(data.results || data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-400" /> Audit Trail
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Transparent record of all transactions and actions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card-static text-center py-16">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No audit logs yet</p>
          <p className="text-slate-500 text-sm mt-1">Actions will appear here as you use the platform</p>
        </div>
      ) : (
        <div className="glass-card-static !p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>TX Hash</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const Icon = actionIcons[log.action] || FileText;
                const colorClass = actionColors[log.action] || 'text-slate-400 bg-slate-400/10';
                return (
                  <tr key={log.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-slate-200 capitalize text-sm font-medium">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-400 space-y-0.5">
                        {Object.entries(log.details || {}).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-500">{key}:</span>{' '}
                            <span className="text-slate-300">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-500">
                        {log.tx_hash ? `${log.tx_hash.slice(0, 12)}...` : '—'}
                      </span>
                    </td>
                    <td className="text-slate-400">
                      <div className="text-sm">{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
