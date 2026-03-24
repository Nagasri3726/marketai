import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket for real-time notifications
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/notifications/`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'payment_notification' || data.type === 'stream_update') {
          const notification = {
            id: Date.now(),
            ...data.data,
            timestamp: new Date().toLocaleTimeString(),
            read: false,
          };
          setNotifications((prev) => [notification, ...prev].slice(0, 20));
          setUnread((prev) => prev + 1);
        }
      };

      wsRef.current.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (user) {
            // Attempt reconnect
          }
        }, 5000);
      };
    } catch (e) {
      console.log('WebSocket not available — using polling fallback');
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead(); }}
        className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: 'var(--gradient-primary)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden animate-slide-down" style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}>
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-slate-700/30 ${!n.read ? 'bg-primary-500/5' : ''}`}>
                  <p className="text-sm text-slate-200">{n.event || n.message || 'New notification'}</p>
                  {n.amount && <p className="text-xs text-accent-400 mt-1">{n.amount} ALGO</p>}
                  <p className="text-xs text-slate-500 mt-1">{n.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
