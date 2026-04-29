import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '../api'

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="glass-card group" id={`product-card-${product.id}`}>
      {/* Image */}
      <div className="aspect-square rounded-lg mb-4 overflow-hidden bg-gradient-to-br from-primary/5 to-cta/5 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-6xl font-bold text-primary/20" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Category badge */}
      <span className="badge badge-info mb-2">{product.category_name}</span>

      {/* Title */}
      <Link to={`/products/${product.id}`} className="cursor-pointer">
        <h3 className="font-semibold text-lg mb-1 text-text hover:text-primary transition-colors line-clamp-2"
            style={{ fontFamily: 'var(--font-heading)' }}>
          {product.name}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-muted text-sm mb-3 line-clamp-2">
        {product.description || 'Sản phẩm chất lượng cao'}
      </p>

      {/* Domain-specific info */}
      {product.book && (
        <p className="text-xs text-muted mb-2">Tác giả: {product.book.author}</p>
      )}
      {product.electronics && (
        <p className="text-xs text-muted mb-2">Thương hiệu: {product.electronics.brand}</p>
      )}
      {product.fashion && (
        <p className="text-xs text-muted mb-2">Size: {product.fashion.size} • {product.fashion.color}</p>
      )}

      {/* Price + Actions */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <span className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
          {Number(product.price).toLocaleString('vi-VN')}đ
        </span>
        {onAddToCart && product.stock > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product.id); }}
            className="btn btn-sm btn-primary cursor-pointer"
            id={`add-to-cart-${product.id}`}
          >
            <ShoppingCart size={14} />
          </button>
        )}
        {product.stock === 0 && (
          <span className="badge badge-danger">Hết hàng</span>
        )}
      </div>
    </div>
  )
}
