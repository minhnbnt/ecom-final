import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Heart, ShoppingBag, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { getProductImage } from '../utils/productImage';

interface WishlistItem {
  id: number;
  product_id: number;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  image_url: string;
  category_name: string;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80';

export default function Wishlist() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch('/api/wishlist/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(async (data: WishlistItem[]) => {
        setItems(data);
        const productMap: Record<number, Product> = {};
        await Promise.all(
          data.map(item =>
            fetch(`/api/products/${item.product_id}/`)
              .then(r => r.ok ? r.json() : null)
              .then(p => { if (p) productMap[item.product_id] = p; })
              .catch(() => {})
          )
        );
        setProducts(productMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, navigate]);

  const removeItem = (productId: number) => {
    fetch(`/api/wishlist/remove/${productId}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.ok) {
          setItems(prev => prev.filter(i => i.product_id !== productId));
          setProducts(prev => { const n = { ...prev }; delete n[productId]; return n; });
        }
      })
      .catch(() => {});
  };

  if (!token) return null;

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

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="glass-button p-2.5 text-slate-400 hover:text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Yêu thích</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} sản phẩm</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-1">Chưa có sản phẩm yêu thích</h2>
          <p className="text-slate-400 text-sm mb-6">Hãy thêm sản phẩm bạn quan tâm vào danh sách yêu thích</p>
          <Link to="/products" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            <ShoppingBag size={15} /> Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(item => {
            const product = products[item.product_id];
            if (!product) return null;
            return (
              <div key={item.id} className="glass-card !p-0 overflow-hidden group">
                <Link to={`/product/${item.product_id}`}>
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <img
                      src={getProductImage(product.id, product.category_name, product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                    <div className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {product.category_name}
                    </div>
                  </div>
                </Link>
                <div className="p-3 flex flex-col gap-1">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="font-semibold text-slate-900 text-sm leading-snug hover:text-primary transition-colors line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <p className="font-extrabold text-primary text-sm">
                    {Number(product.price).toLocaleString('vi-VN')}đ
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <ShoppingBag size={12} /> Mua ngay
                    </Link>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
