import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { ordersApi, type Order } from '../api'
import { useAuth } from '../App'

const statusBadge: Record<string, string> = {
  pending: 'badge-warning', confirmed: 'badge-info', paid: 'badge-success',
  shipping: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger',
}

export default function Orders() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    ordersApi.list(token).then(setOrders).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="text-center py-20 text-muted">Đang tải...</div>

  return (
    <div className="max-w-4xl mx-auto px-4" id="orders-page">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
        <Package size={28} className="inline mr-2 text-primary" /> Đơn hàng
      </h1>
      {orders.length === 0 ? (
        <div className="glass-card text-center py-16">
          <Package size={48} className="mx-auto text-muted mb-4" />
          <p className="text-muted text-lg">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="glass-card" id={`order-${order.id}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Đơn hàng #{order.id}
                </h3>
                <span className={`badge ${statusBadge[order.status] || 'badge-info'}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-muted space-y-1">
                <p>Tổng: <strong className="text-primary">{Number(order.total_price).toLocaleString('vi-VN')}đ</strong></p>
                <p>Địa chỉ: {order.shipping_address}</p>
                <p>Ngày tạo: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.product_name || `SP #${item.product_id}`} x{item.quantity}</span>
                      <span className="text-muted">{Number(item.subtotal).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
