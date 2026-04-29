import { useState, useEffect } from 'react';
import { Search, ChevronRight, Package } from 'lucide-react';
import { Link } from 'react-router';

interface Product {
  id: number;
  name: string;
  price: string;
  category_name: string;
  image_url: string;
  is_active: boolean;
}

interface Category {
  name: string;
  count: number;
  emoji: string;
  gradient: string;
}

const CATEGORY_META: Record<string, { emoji: string; gradient: string }> = {
  'Laptop':      { emoji: '💻', gradient: 'from-blue-500 to-indigo-600' },
  'Điện thoại':  { emoji: '📱', gradient: 'from-slate-500 to-slate-700' },
  'Tai nghe':    { emoji: '🎧', gradient: 'from-purple-500 to-pink-500' },
  'Đồng hồ':    { emoji: '⌚', gradient: 'from-amber-500 to-orange-500' },
  'Sách':        { emoji: '📚', gradient: 'from-green-500 to-emerald-600' },
  'Điều hòa':   { emoji: '❄️', gradient: 'from-cyan-400 to-blue-500' },
  'Tủ lạnh':    { emoji: '🧊', gradient: 'from-sky-400 to-cyan-500' },
  'Áo':          { emoji: '👕', gradient: 'from-rose-400 to-pink-500' },
  'Giày':        { emoji: '👟', gradient: 'from-orange-400 to-red-500' },
  'Balo & Túi':  { emoji: '🎒', gradient: 'from-teal-400 to-green-500' },
};

const PLACEHOLDER_IMAGES: Record<string, string> = {
  'Laptop':     'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
  'Điện thoại': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  'Tai nghe':   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  'Đồng hồ':   'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  'Sách':       'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  'default':    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
};

export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products/')
      .then(r => r.json())
      .then((data: Product[]) => {
        const active = data.filter(p => p.is_active);
        setProducts(active);

        // Build category list
        const counts: Record<string, number> = {};
        for (const p of active) {
          counts[p.category_name] = (counts[p.category_name] ?? 0) + 1;
        }
        const cats: Category[] = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
          emoji: CATEGORY_META[name]?.emoji ?? '📦',
          gradient: CATEGORY_META[name]?.gradient ?? 'from-slate-400 to-slate-600',
        })).sort((a, b) => b.count - a.count);
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredProducts = selected
    ? products.filter(p => p.category_name === selected &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase())))
    : [];

  const getImg = (p: Product) =>
    p.image_url?.startsWith('http')
      ? p.image_url
      : (PLACEHOLDER_IMAGES[p.category_name] ?? PLACEHOLDER_IMAGES['default']);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Danh mục sản phẩm</h1>
        <p className="text-slate-500 text-sm mt-1">{categories.length} danh mục · {products.length} sản phẩm</p>
      </div>

      {/* Category grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-card animate-pulse min-h-[110px]">
              <div className="h-8 w-8 bg-slate-200 rounded-xl mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelected(selected === cat.name ? null : cat.name)}
              className={`glass-card flex flex-col items-center justify-center text-center gap-2 py-6 px-4 relative overflow-hidden min-h-[110px] transition-all ${
                selected === cat.name
                  ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                  : 'hover:shadow-md'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-10 transition-opacity ${selected === cat.name ? '!opacity-8' : ''}`} />
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                <p className="text-slate-400 text-xs">{cat.count} sản phẩm</p>
              </div>
              {selected === cat.name && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Products in selected category */}
      {selected && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{CATEGORY_META[selected]?.emoji ?? '📦'}</span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{selected}</h2>
                <p className="text-slate-500 text-xs">{filteredProducts.length} sản phẩm</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm trong danh mục..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="glass-input pl-8 py-2 text-sm w-48"
                />
              </div>
              <Link
                to={`/products?cat=${encodeURIComponent(selected)}`}
                className="glass-button text-sm flex items-center gap-1 py-2"
              >
                Xem tất cả <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(p => (
                <Link
                  to={`/product/${p.id}`}
                  key={p.id}
                  className="glass-card group !p-0 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={getImg(p)}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES['default']; }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    <p className="text-primary font-extrabold text-sm mt-1">
                      {Number(p.price).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
