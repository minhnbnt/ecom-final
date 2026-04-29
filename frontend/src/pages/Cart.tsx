import { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router';

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

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80';

export default function Cart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/cart/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setCart(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const updateQty = async (itemId: number, delta: number) => {
    if (!cart || !token) return;
    const item = cart.items.find(i => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) { removeItem(itemId); return; }

    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCart(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.id === itemId ? updated : i),
        } : prev);
      }
    } finally { setUpdatingId(null); }
  };

  const removeItem = async (itemId: number) => {
    if (!token) return;
    setUpdatingId(itemId);
    try {
      await fetch(`/api/cart/items/${itemId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
      } : prev);
    } finally { setUpdatingId(null); }
  };

  // ── Not logged in ────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-14 py-12 max-w-sm">
          <ShoppingBag size={48} className="text-primary mx-auto mb-4 opacity-60" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Giỏ hàng của bạn</h1>
          <p className="text-slate-500 text-sm mb-6">Đăng nhập để xem và quản lý giỏ hàng</p>
          <Link to="/login" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            Đăng nhập ngay <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card flex gap-4 animate-pulse">
            <div className="w-20 h-20 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty cart ───────────────────────────────────────────────
  const items = cart?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-14 py-12 max-w-sm">
          <p className="text-5xl mb-4">🛒</p>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Giỏ hàng trống</h1>
          <p className="text-slate-500 text-sm mb-6">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
          <Link to="/products" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            <ShoppingBag size={15} /> Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  const total = parseFloat(cart?.total_price ?? '0');

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Giỏ hàng</h1>
        <p className="text-slate-500 text-sm mt-1">{items.length} sản phẩm</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Items list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id} className={`glass-card flex gap-4 transition-opacity ${updatingId === item.id ? 'opacity-50' : ''}`}>
              <img
                src={item.product_image?.startsWith('http') ? item.product_image : PLACEHOLDER}
                alt={item.product_name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                  {item.product_name}
                </h3>
                <p className="text-primary font-extrabold text-sm mt-0.5">
                  {Number(item.product_price).toLocaleString('vi-VN')}đ
                </p>

                <div className="flex items-center gap-3 mt-2">
                  {/* Qty controls */}
                  <div className="flex items-center gap-1 glass border border-slate-200 rounded-full px-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      disabled={updatingId === item.id}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-primary transition-colors disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      disabled={updatingId === item.id}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-primary transition-colors disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={updatingId === item.id}
                    className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Xóa"
                  >
                    <Trash2 size={15} />
                  </button>

                  <span className="ml-auto text-sm font-bold text-slate-700">
                    {Number(item.subtotal).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="glass-card flex flex-col gap-4 sticky top-28">
          <h2 className="font-bold text-slate-900 text-lg">Tóm tắt đơn hàng</h2>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính ({items.length} sản phẩm)</span>
              <span>{total.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span className="text-accent font-semibold">Miễn phí</span>
            </div>
            <div className="border-t border-slate-200 mt-1 pt-2 flex justify-between font-extrabold text-slate-900 text-base">
              <span>Tổng cộng</span>
              <span className="text-primary">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {/* Promo code */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Mã giảm giá"
                className="glass-input pl-8 py-2 text-sm w-full"
              />
            </div>
            <button className="glass-button py-2 px-3 text-sm">Áp dụng</button>
          </div>

          <Link
            to="/checkout"
            className="glass-button-primary w-full flex justify-center items-center gap-2 py-3.5"
          >
            Thanh toán <ArrowRight size={17} />
          </Link>

          <Link to="/products" className="text-center text-xs text-primary hover:underline">
            ← Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
