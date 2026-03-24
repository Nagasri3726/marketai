import { useState, useEffect, useRef } from 'react';

export default function LiveEarnings({ streams }) {
  const [earnings, setEarnings] = useState(0);
  const prevEarnings = useRef(0);

  useEffect(() => {
    const calculate = () => {
      const now = Date.now() / 1000;
      let total = 0;
      (streams || []).forEach((s) => {
        if (s.status === 'active' && s.start_time) {
          const start = new Date(s.start_time).getTime() / 1000;
          const elapsed = now - start;
          const rate = parseFloat(s.rate_per_second || 0);
          const max = parseFloat(s.total_amount || 0);
          const withdrawn = parseFloat(s.withdrawn_amount || 0);
          total += Math.min(rate * elapsed, max) - withdrawn;
        }
      });
      prevEarnings.current = earnings;
      setEarnings(Math.max(0, total));
    };

    calculate();
    const interval = setInterval(calculate, 100);
    return () => clearInterval(interval);
  }, [streams]);

  const formatEarnings = (val) => {
    const parts = val.toFixed(8).split('.');
    return { whole: parts[0], decimal: parts[1] };
  };

  const { whole, decimal } = formatEarnings(earnings);

  return (
    <div className="salary-hero">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-500 animate-pulse" />
          <span className="text-xs font-semibold text-accent-400 uppercase tracking-widest">Live Earnings</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-5xl sm:text-6xl font-display font-extrabold counter-glow text-white tracking-tight">
            {whole}
          </span>
          <span className="text-2xl sm:text-3xl font-mono text-slate-400">.</span>
          <span className="text-2xl sm:text-3xl font-mono text-accent-400/80">{decimal}</span>
          <span className="text-lg text-slate-500 ml-2 font-medium">ALGO</span>
        </div>

        {/* Rate indicator */}
        {streams?.some(s => s.status === 'active') && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-slate-400">Earning</span>
            <span className="text-xs font-mono text-accent-400">
              +{streams.filter(s => s.status === 'active').reduce((sum, s) => sum + parseFloat(s.rate_per_second || 0), 0).toFixed(10)}
            </span>
            <span className="text-xs text-slate-500">ALGO/sec</span>
          </div>
        )}
      </div>
    </div>
  );
}
