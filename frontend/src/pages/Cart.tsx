import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, Minus, Plus } from 'lucide-react'
import { cartApi, productsApi, type Cart, type CartItem, type Product } from '../api'
import { useAuth } from '../App'

export default function CartPage() {
  const { token } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [products, setProducts] = useState<Record<number, Product>>({})
  const [loading, setLoading] = useState(true)

  const fetchCart = async () => {
    if (!token) return
    try {
      const cartData = await cartApi.get(token)
      setCart(cartData)

      // Fetch product details for each item
      const productIds = cartData.items.map((i: CartItem) => i.product_id)
      const unique = [...new Set(productIds)]
      const productMap: Record<number, Product> = { ...products }
      await Promise.all(
        unique.filter(id => !productMap[id]).map(async (id) => {
          try {
            productMap[id] = await productsApi.get(id)
          } catch { /* skip */ }
        })
      )
      setProducts(productMap)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchCart() }, [token])

  const handleRemove = async (productId: number) => {
    if (!token) return
    try {
      const updated = await cartApi.remove(token, productId)
      setCart(updated)
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message)
    }
  }

  const handleUpdateQty = async (productId: number, delta: number) => {
    if (!token) return
    const item = cart?.items.find(i => i.product_id === productId)
    const newQty = (item?.quantity ?? 0) + delta
    if (newQty < 1) return handleRemove(productId)
    try {
      // Remove then re-add with new quantity
      await cartApi.remove(token, productId)
      const updated = await cartApi.add(token, productId, newQty)
      setCart(updated)
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message)
    }
  }

  const getTotal = () => {
    if (!cart) return 0
    return cart.items.reduce((sum, item) => {
      const p = products[item.product_id]
      return sum + (p ? Number(p.price) * item.quantity : 0)
    }, 0)
  }

  if (loading) return <div className="text-center py-20 text-muted">Đang tải...</div>

  return (
    <div className="max-w-4xl mx-auto px-4" id="cart-page">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
        <ShoppingBag size={28} className="inline mr-2 text-primary" />
        Giỏ hàng
      </h1>

      {!cart || cart.items.length === 0 ? (
        <div className="glass-card text-center py-16">
          <ShoppingBag size={48} className="mx-auto text-muted mb-4" />
          <p className="text-muted text-lg mb-4">Giỏ hàng trống</p>
          <Link to="/products" className="btn btn-primary cursor-pointer">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.items.map((item: CartItem) => {
              const p = products[item.product_id]
              return (
                <div key={item.id} className="glass-card flex items-center justify-between" id={`cart-item-${item.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/5 to-cta/5 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p?.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-primary/30">P</span>
                      )}
                    </div>
                    <div>
                      <Link to={`/products/${item.product_id}`} className="font-semibold hover:text-primary transition-colors">
                        {p?.name ?? `Sản phẩm #${item.product_id}`}
                      </Link>
                      {p && (
                        <p className="text-sm text-primary font-semibold mt-1">
                          {Number(p.price).toLocaleString('vi-VN')}đ
                        </p>
                      )}
                      {p?.category_name && (
                        <span className="badge badge-info text-xs mt-1">{p.category_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQty(item.product_id, -1)}
                        className="btn btn-sm btn-secondary cursor-pointer p-1"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 font-semibold min-w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.product_id, 1)}
                        className="btn btn-sm btn-secondary cursor-pointer p-1"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {p && (
                      <span className="font-bold text-primary min-w-28 text-right" style={{ fontFamily: 'var(--font-heading)' }}>
                        {(Number(p.price) * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="btn btn-sm btn-danger cursor-pointer"
                      id={`remove-item-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="glass p-6 flex items-center justify-between">
            <div>
              <p className="text-muted">{cart.items.length} sản phẩm</p>
              <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                {getTotal().toLocaleString('vi-VN')}đ
              </p>
            </div>
            <Link to="/checkout" className="btn btn-primary cursor-pointer" id="checkout-btn">
              Thanh toán
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
