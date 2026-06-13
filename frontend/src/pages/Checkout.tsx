import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ShoppingBag, ArrowLeft, CreditCard, Truck, MapPin,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  product_image: string;
  quantity: number;
  subtotal: string;
}

interface CartData {
  id: number;
  items: CartItem[];
  total_price: string;
  total_items: number;
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Thẻ tín dụng / Thẻ ghi nợ', icon: CreditCard },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: CreditCard },
  { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Truck },
];

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80';

export default function Checkout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch('/api/cart/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.items?.length) { navigate('/cart'); return; }
        setCart(data);
        setLoading(false);
      })
      .catch(() => { setError('Không thể tải giỏ hàng'); setLoading(false); });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !shippingAddress.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping_address: shippingAddress.trim(),
          payment_method: paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || Object.values(data).flat().join(', ') || 'Tạo đơn hàng thất bại');
      }
      setCreatedOrderId(data.id);
      setSuccess(true);
      window.dispatchEvent(new Event('auth-changed'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm">Đang tải giỏ hàng…</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-14 py-12 max-w-sm">
          <CheckCircle size={56} className="text-accent mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-slate-500 text-sm mb-1">
            Đơn hàng <span className="font-bold text-slate-700">#{createdOrderId}</span> đã được tạo.
          </p>
          <p className="text-slate-400 text-xs mb-6">Cảm ơn bạn đã mua sắm tại EcomFinal!</p>
          <div className="flex flex-col gap-2">
            <Link
              to="/orders"
              className="glass-button-primary inline-flex items-center justify-center gap-2 text-sm py-3"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link
              to="/products"
              className="text-sm text-primary hover:underline"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const total = parseFloat(cart?.total_price ?? '0');

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/cart" className="glass-button p-2.5 text-slate-400 hover:text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Thanh toán</h1>
          <p className="text-slate-500 text-sm mt-1">Xác nhận thông tin và hoàn tất đơn hàng</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Left — forms */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Shipping address */}
            <div className="glass-card flex flex-col gap-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <MapPin size={18} className="text-primary" />
                Địa chỉ giao hàng
              </h2>
              <textarea
                required
                rows={3}
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                className="glass-input resize-none px-4"
                placeholder="Nhập địa chỉ giao hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
              />
            </div>

            {/* Payment method */}
            <div className="glass-card flex flex-col gap-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <CreditCard size={18} className="text-primary" />
                Phương thức thanh toán
              </h2>
              <div className="flex flex-col gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  return (
                    <label
                      key={m.value}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === m.value
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={m.value}
                        checked={paymentMethod === m.value}
                        onChange={() => setPaymentMethod(m.value)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        paymentMethod === m.value ? 'border-primary' : 'border-slate-300'
                      }`}>
                        {paymentMethod === m.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <Icon size={18} className={paymentMethod === m.value ? 'text-primary' : 'text-slate-400'} />
                      <span className="text-sm font-medium text-slate-700">{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — order summary */}
          <div className="lg:col-span-2">
            <div className="glass-card flex flex-col gap-4 sticky top-28">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" />
                Đơn hàng ({items.length} sản phẩm)
              </h2>

              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product_image?.startsWith('http') || item.product_image?.startsWith('/') ? item.product_image : PLACEHOLDER}
                      alt={item.product_name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-slate-500">SL: {item.quantity}</p>
                      <p className="text-sm font-bold text-primary">
                        {Number(item.subtotal).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span>{total.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span className="text-accent font-semibold">Miễn phí</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-slate-900 text-base">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !shippingAddress.trim()}
                className="glass-button-primary w-full flex justify-center items-center gap-2 py-3.5 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Đang xử lý…
                  </>
                ) : (
                  <>
                    <CheckCircle size={17} />
                    Xác nhận đặt hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
