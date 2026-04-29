import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin } from 'lucide-react'
import { ordersApi } from '../api'
import { useAuth } from '../App'

export default function Checkout() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !address.trim()) return
    setLoading(true)
    setError('')
    try {
      await ordersApi.create(token, address)
      alert('Đặt hàng thành công!')
      navigate('/orders')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4" id="checkout-page">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
        <CreditCard size={28} className="inline mr-2 text-primary" /> Thanh toán
      </h1>
      <form onSubmit={handleSubmit} className="glass p-8 space-y-6">
        <div>
          <label htmlFor="shipping-address" className="block text-sm font-medium mb-2">
            <MapPin size={16} className="inline mr-1" /> Địa chỉ giao hàng
          </label>
          <textarea id="shipping-address" value={address} onChange={(e) => setAddress(e.target.value)}
            className="input min-h-[100px]" placeholder="Nhập địa chỉ giao hàng..." required />
        </div>
        {error && <div className="p-4 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>}
        <button type="submit" disabled={loading || !address.trim()}
          className="btn btn-primary w-full py-4 text-lg cursor-pointer" id="place-order-btn">
          {loading ? 'Đang xử lý...' : 'Đặt hàng'}
        </button>
      </form>
    </div>
  )
}
