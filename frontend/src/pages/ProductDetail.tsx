import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ShoppingCart, Heart, Share2, Star, ArrowLeft,
  Package, Tag, ChevronRight, Loader2,
} from 'lucide-react';

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  category: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
  book?: { author?: string; publisher?: string; isbn?: string; pages?: number; language?: string } | null;
  electronics?: { brand?: string; warranty_months?: number; model?: string; specs?: string } | null;
  fashion?: { size?: string; color?: string; material?: string } | null;
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  'Laptop':      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  'Điện thoại':  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
  'Tai nghe':    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  'Đồng hồ':    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'Sách':        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
  'Điều hòa':   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
  'Tủ lạnh':    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
  'Áo':          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  'Giày':        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  'Balo & Túi':  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'default':     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
};

function SpecRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-900 text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/products/${id}/`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ProductDetail) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/login'; return; }
    if (!product) return;
    try {
      await fetch('/api/cart/items/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product: product.id, quantity: 1 }),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch { /* ignore */ }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm">Đang tải sản phẩm…</p>
        </div>
      </div>
    );
  }

  // ── Error / Not found ─────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-12 py-10">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-slate-500 text-sm mb-5">{error || 'Sản phẩm không tồn tại hoặc đã bị xóa'}</p>
          <Link to="/products" className="glass-button-primary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={15} /> Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const imgSrc = product.image_url?.startsWith('http')
    ? product.image_url
    : (PLACEHOLDER_IMAGES[product.category_name] ?? PLACEHOLDER_IMAGES['default']);

  const price = Number(product.price);
  const inStock = product.stock > 0;

  // Build specs from sub-type fields
  const specs: { label: string; value?: string | number | null }[] = [
    { label: 'Danh mục', value: product.category_name },
    { label: 'Tình trạng', value: inStock ? `Còn hàng (${product.stock})` : 'Hết hàng' },
    ...(product.electronics ? [
      { label: 'Thương hiệu', value: product.electronics.brand },
      { label: 'Model', value: product.electronics.model },
      { label: 'Bảo hành', value: product.electronics.warranty_months ? `${product.electronics.warranty_months} tháng` : undefined },
      { label: 'Thông số', value: product.electronics.specs },
    ] : []),
    ...(product.fashion ? [
      { label: 'Kích cỡ', value: product.fashion.size },
      { label: 'Màu sắc', value: product.fashion.color },
      { label: 'Chất liệu', value: product.fashion.material },
    ] : []),
    ...(product.book ? [
      { label: 'Tác giả', value: product.book.author },
      { label: 'Nhà xuất bản', value: product.book.publisher },
      { label: 'ISBN', value: product.book.isbn },
      { label: 'Số trang', value: product.book.pages },
      { label: 'Ngôn ngữ', value: product.book.language },
    ] : []),
  ].filter(s => s.value);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-primary transition-colors">Sản phẩm</Link>
        <ChevronRight size={12} />
        <Link to={`/categories`} className="hover:text-primary transition-colors">{product.category_name}</Link>
        <ChevronRight size={12} />
        <span className="text-slate-600 font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        {/* ── Left: Image ────────────────────────────────── */}
        <div className="flex flex-col gap-3 sticky top-28">
          <div className="glass-card !p-3 aspect-square overflow-hidden group">
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
              onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES['default']; }}
            />
          </div>
          {/* Category + Share row */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Tag size={11} /> {product.category_name}
            </span>
            <button
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              className="ml-auto glass-button p-2 text-slate-400 hover:text-primary text-xs flex items-center gap-1"
            >
              <Share2 size={14} /> Chia sẻ
            </button>
          </div>
        </div>

        {/* ── Right: Info ─────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Main card */}
          <div className="glass-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 blur-3xl -z-10 rounded-full" />

            {/* Stock badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <Package size={11} />
                {inStock ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400 ml-auto">
                {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-current" />)}
                <span className="text-xs text-slate-500 ml-1 font-medium">5.0</span>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{product.name}</h1>

            <div className="flex items-end gap-3 mb-4">
              <p className="text-3xl font-black text-primary">{price.toLocaleString('vi-VN')}đ</p>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  added
                    ? 'bg-emerald-500 text-white'
                    : inStock
                      ? 'glass-button-primary'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={17} />
                {added ? 'Đã thêm vào giỏ! ✓' : inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
              <button className="glass-button w-12 h-12 flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors p-0">
                <Heart size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="glass-card !p-1.5 flex gap-1">
            {([
              { key: 'description', label: 'Mô tả' },
              { key: 'specs',       label: 'Thông số' },
              { key: 'reviews',     label: 'Đánh giá' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.key ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="glass-card min-h-[160px]">
            {tab === 'description' && (
              <div className="prose prose-sm max-w-none text-slate-600">
                <p>{product.description}</p>
                {product.stock > 0 && (
                  <p className="text-emerald-600 font-medium text-sm mt-3">
                    ✓ Sẵn hàng — giao trong 1-3 ngày làm việc
                  </p>
                )}
              </div>
            )}

            {tab === 'specs' && (
              <div>
                {specs.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {specs.map(s => <SpecRow key={s.label} label={s.label} value={s.value} />)}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm text-center py-6">Chưa có thông số kỹ thuật</p>
                )}
              </div>
            )}

            {tab === 'reviews' && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">⭐</p>
                <p className="text-slate-500 text-sm">Chưa có đánh giá nào</p>
                <p className="text-slate-400 text-xs mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
              </div>
            )}
          </div>

          {/* Back link */}
          <Link to="/products" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors w-fit">
            <ArrowLeft size={14} /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
