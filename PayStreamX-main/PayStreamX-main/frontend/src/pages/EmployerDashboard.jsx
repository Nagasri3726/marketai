import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StreamCard from '../components/StreamCard';
import PaymentHistory from '../components/PaymentHistory';
import toast from 'react-hot-toast';
import { Plus, Users, Activity, DollarSign, TrendingUp, X, Wallet, Zap, BarChart3 } from 'lucide-react';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState(null);
  const [newStream, setNewStream] = useState({
    employee: '', title: '', total_amount: '', payment_type: 'streaming',
    start_time: '', end_time: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [streamsRes, paymentsRes, statsRes, employeesRes] = await Promise.all([
        api.get('/payroll/streams/'),
        api.get('/payroll/payments/'),
        api.get('/payroll/dashboard/'),
        api.get('/auth/employees/'),
      ]);
      setStreams(streamsRes.data.results || streamsRes.data);
      setPayments(paymentsRes.data.results || paymentsRes.data);
      setStats(statsRes.data);
      setEmployees(employeesRes.data.results || employeesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateStream = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payroll/streams/', {
        ...newStream, employee: parseInt(newStream.employee),
        total_amount: parseFloat(newStream.total_amount),
      });
      toast.success('Payroll stream created!');
      setShowCreateModal(false);
      setNewStream({ employee: '', title: '', total_amount: '', payment_type: 'streaming', start_time: '', end_time: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create stream');
    }
  };

  const handleActivate = async (id) => {
    try { await api.post(`/payroll/streams/${id}/activate/`); toast.success('Stream activated!'); fetchData(); }
    catch { toast.error('Failed to activate'); }
  };
  const handleCancel = async (id) => {
    try { await api.post(`/payroll/streams/${id}/cancel/`); toast.success('Stream cancelled'); fetchData(); }
    catch { toast.error('Failed to cancel'); }
  };
  const handleCreateWallet = async () => {
    try { const { data } = await api.post('/blockchain/create-wallet/'); setWalletInfo(data); toast.success('Wallet created!'); }
    catch { toast.error('Failed to create wallet'); }
  };

  const statCards = [
    { label: 'Active Streams', value: stats.active_streams || 0, icon: Activity, color: 'text-accent-400', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'Total Streams', value: stats.total_streams || 0, icon: BarChart3, color: 'text-primary-400', bg: 'rgba(37, 99, 235, 0.1)' },
    { label: 'Employees', value: stats.total_employees || 0, icon: Users, color: 'text-glow-400', bg: 'rgba(124, 58, 237, 0.1)' },
    { label: 'Total Paid', value: `${parseFloat(stats.total_paid || 0).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-400', bg: 'rgba(234, 179, 8, 0.1)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary-400" /> Payroll Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Stream salaries and manage your workforce</p>
        </div>
        <div className="flex gap-3">
          {!user.wallet_address && (
            <button onClick={handleCreateWallet} className="btn-secondary btn-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Create Wallet
            </button>
          )}
          <button onClick={() => setShowCreateModal(true)} className="btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Stream
          </button>
        </div>
      </div>

      {/* Wallet Mnemonic */}
      {walletInfo && (
        <div className="glass-card !border-yellow-500/30">
          <p className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Save your mnemonic — it will not be shown again</p>
          <p className="font-mono text-xs text-slate-300 break-all bg-dark-950 p-3 rounded-lg">{walletInfo.mnemonic}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card-static !p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Streams */}
      <div>
        <h2 className="section-title mb-4">
          <Activity className="w-5 h-5 text-accent-400" /> Payroll Streams
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : streams.length === 0 ? (
          <div className="glass-card-static text-center py-10">
            <Activity className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No payroll streams yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} isEmployer={true}
                onActivate={handleActivate} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>

      <PaymentHistory payments={payments} currentUserId={user.id} />

      {/* Create Stream Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="glass-card w-full max-w-md animate-slide-up !border-primary-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-bold text-white">Create Payroll Stream</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Employee</label>
                <select className="input-field" value={newStream.employee}
                  onChange={(e) => setNewStream({ ...newStream, employee: e.target.value })} required>
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                <input className="input-field" placeholder="Monthly Salary — March 2026"
                  value={newStream.title} onChange={(e) => setNewStream({ ...newStream, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Amount (ALGO)</label>
                <input type="number" step="0.01" className="input-field" placeholder="5000.00"
                  value={newStream.total_amount} onChange={(e) => setNewStream({ ...newStream, total_amount: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Payment Type</label>
                <select className="input-field" value={newStream.payment_type}
                  onChange={(e) => setNewStream({ ...newStream, payment_type: e.target.value })}>
                  <option value="streaming">Continuous Streaming</option>
                  <option value="milestone">Milestone-Based</option>
                </select>
              </div>
              {newStream.payment_type === 'streaming' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Start</label>
                    <input type="datetime-local" className="input-field"
                      value={newStream.start_time} onChange={(e) => setNewStream({ ...newStream, start_time: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">End</label>
                    <input type="datetime-local" className="input-field"
                      value={newStream.end_time} onChange={(e) => setNewStream({ ...newStream, end_time: e.target.value })} required />
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary w-full mt-2">Create Stream</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
