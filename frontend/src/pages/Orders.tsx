import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  ShoppingBag, Package, Clock, CheckCircle, Truck,
  XCircle, AlertCircle, Loader2, ChevronRight, ArrowRight,
} from 'lucide-react';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface Order {
  id: number;
  user_id: number;
  total_price: string;
  status: string;
  shipping_address: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-100', icon: Clock },
  confirmed:  { label: 'Đã xác nhận',  color: 'text-blue-600 bg-blue-100',  icon: CheckCircle },
  paid:       { label: 'Đã thanh toán', color: 'text-indigo-600 bg-indigo-100', icon: CheckCircle },
  shipping:   { label: 'Đang giao',    color: 'text-purple-600 bg-purple-100', icon: Truck },
  delivered:  { label: 'Đã giao',      color: 'text-accent bg-emerald-100', icon: CheckCircle },
  cancelled:  { label: 'Đã hủy',       color: 'text-red-600 bg-red-100',  icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-slate-600 bg-slate-100', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/orders/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Không thể tải đơn hàng');
        return r.json();
      })
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-14 py-12 max-w-sm">
          <Package size={48} className="text-primary mx-auto mb-4 opacity-60" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Đơn hàng của bạn</h1>
          <p className="text-slate-500 text-sm mb-6">Đăng nhập để xem lịch sử đơn hàng</p>
          <Link to="/login" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            Đăng nhập ngay <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm">Đang tải đơn hàng…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-12 py-10">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Có lỗi xảy ra</h1>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <button onClick={() => window.location.reload()} className="glass-button-primary inline-flex items-center gap-2 text-sm">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-14 py-12 max-w-sm">
          <Package size={48} className="text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Chưa có đơn hàng</h1>
          <p className="text-slate-500 text-sm mb-6">Bạn chưa đặt đơn hàng nào</p>
          <Link to="/products" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            <ShoppingBag size={15} /> Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Đơn hàng của tôi</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} đơn hàng</p>
      </div>

      <div className="flex flex-col gap-3">
        {orders.map(order => {
          const total = parseFloat(order.total_price);
          const date = new Date(order.created_at).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          });
          return (
            <div key={order.id} className="glass-card flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Đơn hàng #{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
                <span className="text-xs text-slate-400">{date}</span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2">
                {order.items.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">
                      {item.product_name}
                      <span className="text-slate-400 ml-1">x{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-slate-900 flex-shrink-0 ml-2">
                      {Number(item.subtotal).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-slate-400">…và {order.items.length - 3} sản phẩm khác</p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-slate-500">Tổng: </span>
                  <span className="font-extrabold text-primary">{total.toLocaleString('vi-VN')}đ</span>
                </div>
                <Link
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Chi tiết <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
