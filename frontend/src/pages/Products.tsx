import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  category_name: string;
  is_active: boolean;
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  'Laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
  'Điện thoại': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  'Tai nghe': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  'Đồng hồ': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  'Sách': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'name', label: 'Tên A-Z' },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [sort, setSort] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/products/')
      .then(r => r.json())
      .then((data: Product[]) => {
        setProducts(data.filter(p => p.is_active));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['', ...Array.from(new Set(products.map(p => p.category_name))).sort()];

  const filtered = products
    .filter(p =>
      (!selectedCat || p.category_name === selectedCat) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category_name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sort === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      if (sort === 'name') return a.name.localeCompare(b.name, 'vi');
      return b.id - a.id;
    });

  const getImg = (p: Product) =>
    p.image_url?.startsWith('http')
      ? p.image_url
      : (PLACEHOLDER_IMAGES[p.category_name] ?? PLACEHOLDER_IMAGES['default']);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} sản phẩm</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 pr-4 py-2 text-sm w-52"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="glass-input py-2 pr-8 text-sm appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`glass-button py-2 text-sm flex items-center gap-1.5 ${showFilters ? 'text-primary border-primary/30' : ''}`}
          >
            <SlidersHorizontal size={14} />
            Lọc
            {selectedCat && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCat === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'glass border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary'
              }`}
            >
              {cat || 'Tất cả'}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card !p-0 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-slate-600 font-semibold text-lg">Không tìm thấy sản phẩm</p>
          <p className="text-slate-400 text-sm mt-1">Thử từ khóa khác hoặc bỏ bộ lọc</p>
          <button onClick={() => { setSearch(''); setSelectedCat(''); }} className="glass-button mt-4 text-sm">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(product => (
            <Link
              to={`/product/${product.id}`}
              key={product.id}
              className="glass-card group flex flex-col !p-0 overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={getImg(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES['default']; }}
                />
                <div className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {product.category_name}
                </div>
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="absolute top-2 right-2 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Còn {product.stock}
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <p className="font-extrabold text-primary text-sm">
                    {Number(product.price).toLocaleString('vi-VN')}đ
                  </p>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <ShoppingBag size={13} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
