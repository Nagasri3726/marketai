import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function PaymentHistory({ payments, currentUserId }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <p className="text-slate-500">No payment history yet</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden !p-0">
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">Payment History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>From / To</th>
              <th>TX Hash</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const isIncoming = payment.recipient === currentUserId ||
                                 payment.recipient_detail?.id === currentUserId;
              return (
                <tr key={payment.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {isIncoming ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                      )}
                      <span className="capitalize text-slate-300">{payment.payment_type}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-mono font-semibold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                      {isIncoming ? '+' : '-'}{parseFloat(payment.amount).toFixed(4)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">ALGO</span>
                  </td>
                  <td className="text-slate-400">
                    {isIncoming
                      ? (payment.sender_detail?.username || 'Unknown')
                      : (payment.recipient_detail?.username || 'Unknown')
                    }
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-500">
                      {payment.tx_hash ? `${payment.tx_hash.slice(0, 12)}...` : '—'}
                    </span>
                  </td>
                  <td className="text-slate-400 text-sm">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
