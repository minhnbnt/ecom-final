import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { productsApi, cartApi, type Product, type Category } from '../api'
import { useAuth } from '../App'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi.categories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    productsApi
      .list({
        category: selectedCategory ?? undefined,
        search: search || undefined,
      })
      .then(data => {
        const list = Array.isArray(data) ? data : data.results || []
        setProducts(list)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [selectedCategory, search])

  const handleAddToCart = async (productId: number) => {
    if (!token) return
    try {
      await cartApi.add(token, productId)
      alert('Đã thêm vào giỏ hàng!')
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4" id="products-page">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Sản phẩm
      </h1>
      <p className="text-muted mb-8">Khám phá hơn 10 nhóm loại sản phẩm</p>

      {/* Filters */}
      <div className="glass p-4 mb-8 flex flex-col md:flex-row gap-4" id="product-filters">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            id="search-input"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={16} className="text-muted" />
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn btn-sm cursor-pointer ${!selectedCategory ? 'btn-accent' : 'btn-secondary'}`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn btn-sm cursor-pointer ${selectedCategory === cat.id ? 'btn-accent' : 'btn-secondary'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-20 text-muted">Đang tải...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted text-lg">Không tìm thấy sản phẩm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={token ? handleAddToCart : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
