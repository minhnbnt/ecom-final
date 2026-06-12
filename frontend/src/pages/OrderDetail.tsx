import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft, Clock, CheckCircle, Truck,
  XCircle, AlertCircle, Loader2, MapPin, CreditCard,
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

const STATUS_FLOW = ['pending', 'confirmed', 'paid', 'shipping', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }
    fetch(`/api/orders/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Không tìm thấy đơn hàng');
        return r.json();
      })
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [token, id]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-12 py-10">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Vui lòng đăng nhập</h1>
          <Link to="/login" className="glass-button-primary inline-flex items-center gap-2 text-sm">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm">Đang tải…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-12 py-10">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Không tìm thấy đơn hàng</h1>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <Link to="/orders" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={15} /> Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const total = parseFloat(order.total_price);
  const createdDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const updatedDate = new Date(order.updated_at).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const currentStatusIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/orders" className="glass-button p-2.5 text-slate-400 hover:text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Đơn hàng #{order.id}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Đặt lúc {createdDate}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Status timeline */}
      <div className="glass-card">
        <h2 className="font-bold text-slate-900 text-sm mb-4">Tiến trình đơn hàng</h2>
        <div className="flex items-center gap-1">
          {STATUS_FLOW.map((s, idx) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = currentStatusIdx >= idx;
            const isCurrent = order.status === s;
            const Icon = cfg.icon;
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                    : isActive
                      ? 'bg-accent text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon size={14} />
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  isActive ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {cfg.label}
                </span>
                {idx < STATUS_FLOW.length - 1 && (
                  <div className={`h-0.5 w-full -mt-6 ${
                    currentStatusIdx > idx ? 'bg-accent' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Shipping info */}
        <div className="glass-card flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <MapPin size={16} className="text-primary" />
            Địa chỉ giao hàng
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.shipping_address || '—'}</p>
        </div>

        {/* Payment info */}
        <div className="glass-card flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <CreditCard size={16} className="text-primary" />
            Thông tin thanh toán
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tổng tiền</span>
            <span className="font-extrabold text-primary">{total.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Cập nhật</span>
            <span className="text-slate-600 text-xs">{updatedDate}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="glass-card flex flex-col gap-3">
        <h2 className="font-bold text-slate-900 text-sm">Sản phẩm đã đặt ({order.items.length})</h2>
        <div className="flex flex-col gap-2">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.product_id}`}
                  className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors"
                >
                  {item.product_name}
                </Link>
                <p className="text-xs text-slate-400">
                  {Number(item.unit_price).toLocaleString('vi-VN')}đ × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-900 flex-shrink-0 ml-2">
                {Number(item.subtotal).toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Tổng cộng</span>
          <span className="text-lg font-extrabold text-primary">{total.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      <Link
        to="/products"
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft size={14} /> Tiếp tục mua sắm
      </Link>
    </div>
  );
}
