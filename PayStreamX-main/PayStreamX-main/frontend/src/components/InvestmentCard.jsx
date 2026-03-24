import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function InvestmentCard({ investment }) {
  const roi = parseFloat(investment.roi_percentage || 0);
  const isPositive = roi >= 0;
  const amount = parseFloat(investment.amount || 0);
  const currentValue = parseFloat(investment.current_value || 0);

  return (
    <div className="glass-card-purple !p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124, 58, 237, 0.15)' }}>
            <DollarSign className="w-4 h-4 text-glow-400" />
          </div>
          <h4 className="text-sm font-semibold text-white">{investment.name}</h4>
        </div>
        <span className={`badge ${isPositive ? 'badge-active' : 'badge-cancelled'}`}>
          {isPositive ? '+' : ''}{roi.toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Invested</p>
          <p className="text-sm font-mono font-semibold text-white">{amount.toFixed(2)} <span className="text-xs text-slate-500">ALGO</span></p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Current Value</p>
          <p className={`text-sm font-mono font-semibold ${isPositive ? 'text-accent-400' : 'text-red-400'}`}>
            {currentValue.toFixed(2)} <span className="text-xs text-slate-500">ALGO</span>
          </p>
        </div>
      </div>

      {/* Mini gain/loss bar */}
      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.15)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(Math.abs(roi), 100)}%`,
            background: isPositive ? 'var(--gradient-green)' : 'linear-gradient(90deg, #EF4444, #DC2626)',
          }}
        />
      </div>
    </div>
  );
}
