import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LiveEarnings from '../components/LiveEarnings';
import SalaryWallet from '../components/SalaryWallet';
import StreamCard from '../components/StreamCard';
import AutoSplitConfig from '../components/AutoSplitConfig';
import GoalCard from '../components/GoalCard';
import InvestmentCard from '../components/InvestmentCard';
import CreditPanel from '../components/CreditPanel';
import PaymentHistory from '../components/PaymentHistory';
import toast from 'react-hot-toast';
import {
  Activity, DollarSign, TrendingUp, Wallet,
  Target, CreditCard, Settings, PlusCircle, Zap
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [wallet, setWallet] = useState(null);
  const [splits, setSplits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState(null);

  // New investment/goal forms
  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [newInv, setNewInv] = useState({ name: '', amount: '' });
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', category: 'custom', target_amount: '', deadline: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [streamsR, paymentsR, statsR, walletR, splitsR, goalsR, invR, creditR] = await Promise.allSettled([
        api.get('/payroll/streams/'),
        api.get('/payroll/payments/'),
        api.get('/payroll/dashboard/'),
        api.get('/payroll/wallet/'),
        api.get('/payroll/splits/'),
        api.get('/payroll/goals/'),
        api.get('/payroll/investments/'),
        api.get('/payroll/credit/'),
      ]);
      if (streamsR.status === 'fulfilled') setStreams(streamsR.value.data.results || streamsR.value.data);
      if (paymentsR.status === 'fulfilled') setPayments(paymentsR.value.data.results || paymentsR.value.data);
      if (statsR.status === 'fulfilled') setStats(statsR.value.data);
      if (walletR.status === 'fulfilled') setWallet(walletR.value.data);
      if (splitsR.status === 'fulfilled') setSplits(splitsR.value.data.results || splitsR.value.data);
      if (goalsR.status === 'fulfilled') setGoals(goalsR.value.data.results || goalsR.value.data);
      if (invR.status === 'fulfilled') setInvestments(invR.value.data.results || invR.value.data);
      if (creditR.status === 'fulfilled') setCredit(creditR.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id) => {
    try {
      const { data } = await api.post(`/payroll/streams/${id}/withdraw/`);
      toast.success(`Withdrawn ${parseFloat(data.payment.amount).toFixed(4)} ALGO!`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    }
  };

  const handleCreateWallet = async () => {
    try {
      const { data } = await api.post('/blockchain/create-wallet/');
      setWalletInfo(data);
      toast.success('Wallet created!');
    } catch (err) {
      toast.error('Failed to create wallet');
    }
  };

  const handleCreateInvestment = async () => {
    if (!newInv.name || !newInv.amount) return;
    try {
      await api.post('/payroll/investments/', { name: newInv.name, amount: parseFloat(newInv.amount) });
      toast.success('Investment created!');
      setShowNewInvestment(false);
      setNewInv({ name: '', amount: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) return;
    try {
      await api.post('/payroll/goals/', {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        deadline: newGoal.deadline || null,
      });
      toast.success('Goal created!');
      setShowNewGoal(false);
      setNewGoal({ name: '', category: 'custom', target_amount: '', deadline: '' });
      fetchAll();
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <span className="block w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent-400" />
            Financial HQ
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Your salary, live and programmable</p>
        </div>
        {!user.wallet_address && (
          <button onClick={handleCreateWallet} className="btn-green flex items-center gap-2 btn-sm">
            <Wallet className="w-4 h-4" /> Create Wallet
          </button>
        )}
      </div>

      {/* Wallet Mnemonic Warning */}
      {walletInfo && (
        <div className="glass-card !border-yellow-500/30">
          <p className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Save your mnemonic — it will not be shown again</p>
          <p className="font-mono text-xs text-slate-300 break-all bg-dark-950 p-3 rounded-lg">{walletInfo.mnemonic}</p>
          <p className="text-xs text-slate-500 mt-2">Address: {walletInfo.address}</p>
        </div>
      )}

      {/* ===== HERO: Live Salary Counter ===== */}
      <LiveEarnings streams={streams} />

      {/* ===== ROW 1: Wallet + Quick Stats ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {wallet && <SalaryWallet wallet={wallet} onUpdate={fetchAll} />}
        </div>
        <div className="grid grid-rows-3 gap-3">
          {[
            { label: 'Active Streams', value: stats.active_streams || 0, icon: Activity, color: 'text-accent-400', bg: 'rgba(34, 197, 94, 0.1)' },
            { label: 'Total Earned', value: `${parseFloat(stats.total_earned || 0).toFixed(2)}`, icon: DollarSign, color: 'text-primary-400', bg: 'rgba(37, 99, 235, 0.1)' },
            { label: 'Active Goals', value: stats.active_goals || 0, icon: Target, color: 'text-glow-400', bg: 'rgba(124, 58, 237, 0.1)' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card-static !p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-white">{stat.value}</p>
                <p className="text-[11px] text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ROW 2: Auto-Split + Credit ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AutoSplitConfig rules={splits} onUpdate={fetchAll} />
        <CreditPanel credit={credit} onUpdate={fetchAll} />
      </div>

      {/* ===== Active Streams ===== */}
      <div>
        <h2 className="section-title mb-4">
          <Activity className="w-5 h-5 text-accent-400" /> Salary Streams
        </h2>
        {streams.length === 0 ? (
          <div className="glass-card-static text-center py-10">
            <Activity className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No salary streams yet. Ask your employer to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} isEmployer={false} onWithdraw={handleWithdraw} />
            ))}
          </div>
        )}
      </div>

      {/* ===== ROW 3: Financial Goals ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <Target className="w-5 h-5 text-glow-400" /> Financial Goals
          </h2>
          <button onClick={() => setShowNewGoal(!showNewGoal)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {showNewGoal && (
          <div className="glass-card-static !p-4 mb-4 animate-slide-down space-y-2">
            <input className="input-field text-sm py-2" placeholder="Goal name (e.g. New Laptop)"
              value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} />
            <div className="flex gap-2">
              <select className="input-field text-sm py-2" value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}>
                <option value="rent">🏠 Rent</option><option value="travel">✈️ Travel</option>
                <option value="emergency">🚨 Emergency</option><option value="education">📚 Education</option>
                <option value="gadget">💻 Gadget</option><option value="custom">⚡ Custom</option>
              </select>
              <input type="number" className="input-field text-sm py-2" placeholder="Target (ALGO)"
                value={newGoal.target_amount} onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })} />
              <input type="date" className="input-field text-sm py-2"
                value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateGoal} className="btn-purple btn-sm flex-1">Create Goal</button>
              <button onClick={() => setShowNewGoal(false)} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {goals.length === 0 && !showNewGoal ? (
          <p className="text-sm text-slate-500 text-center py-6">Set financial goals to track your savings progress</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onUpdate={fetchAll} />)}
          </div>
        )}
      </div>

      {/* ===== ROW 4: Investments ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <TrendingUp className="w-5 h-5 text-glow-400" /> Micro-Investments
          </h2>
          <button onClick={() => setShowNewInvestment(!showNewInvestment)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {showNewInvestment && (
          <div className="glass-card-static !p-4 mb-4 animate-slide-down">
            <div className="flex gap-2">
              <input className="input-field text-sm py-2" placeholder="Investment name"
                value={newInv.name} onChange={(e) => setNewInv({ ...newInv, name: e.target.value })} />
              <input type="number" className="input-field text-sm py-2 w-32" placeholder="Amount"
                value={newInv.amount} onChange={(e) => setNewInv({ ...newInv, amount: e.target.value })} />
              <button onClick={handleCreateInvestment} className="btn-purple btn-sm">Invest</button>
              <button onClick={() => setShowNewInvestment(false)} className="btn-secondary btn-sm">✕</button>
            </div>
          </div>
        )}

        {investments.length === 0 && !showNewInvestment ? (
          <p className="text-sm text-slate-500 text-center py-6">Invest small portions of your salary automatically</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {investments.map((inv) => <InvestmentCard key={inv.id} investment={inv} />)}
          </div>
        )}
      </div>

      {/* ===== Payment History ===== */}
      <PaymentHistory payments={payments} currentUserId={user.id} />
    </div>
  );
}
