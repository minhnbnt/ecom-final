import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Bot, Send } from 'lucide-react'
import { productsApi, cartApi, aiApi, type Product } from '../api'
import { useAuth } from '../App'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, token } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([])
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (id) {
      productsApi.get(Number(id))
        .then(setProduct)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleAddToCart = async () => {
    if (!token || !product) return
    try {
      await cartApi.add(token, product.id)
      alert('Đã thêm vào giỏ hàng!')
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message)
    }
  }

  const handleChat = async () => {
    if (!chatMessage.trim()) return
    const userMsg = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    try {
      const result = await aiApi.chatbot(userMsg, user?.id)
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.answer }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-muted">Đang tải...</div>
  if (!product) return <div className="text-center py-20 text-muted">Không tìm thấy sản phẩm</div>

  return (
    <div className="max-w-5xl mx-auto px-4" id="product-detail-page">
      <Link to="/products" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 cursor-pointer">
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="glass-card aspect-square flex items-center justify-center bg-gradient-to-br from-primary/5 to-cta/5">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-8xl font-bold text-primary/20" style={{ fontFamily: 'var(--font-heading)' }}>
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="badge badge-info mb-3 self-start">{product.category_name}</span>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name}
          </h1>
          <p className="text-muted mb-6">{product.description || 'Sản phẩm chất lượng cao'}</p>

          {/* Domain info */}
          {product.book && (
            <div className="glass p-4 mb-4 text-sm space-y-1">
              <p><strong>Tác giả:</strong> {product.book.author}</p>
              {product.book.publisher && <p><strong>NXB:</strong> {product.book.publisher}</p>}
              {product.book.isbn && <p><strong>ISBN:</strong> {product.book.isbn}</p>}
              {product.book.pages && <p><strong>Số trang:</strong> {product.book.pages}</p>}
            </div>
          )}
          {product.electronics && (
            <div className="glass p-4 mb-4 text-sm space-y-1">
              <p><strong>Thương hiệu:</strong> {product.electronics.brand}</p>
              <p><strong>Bảo hành:</strong> {product.electronics.warranty_months} tháng</p>
            </div>
          )}
          {product.fashion && (
            <div className="glass p-4 mb-4 text-sm space-y-1">
              <p><strong>Size:</strong> {product.fashion.size}</p>
              <p><strong>Màu:</strong> {product.fashion.color}</p>
              {product.fashion.material && <p><strong>Chất liệu:</strong> {product.fashion.material}</p>}
            </div>
          )}

          <div className="mt-auto">
            <p className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {Number(product.price).toLocaleString('vi-VN')}đ
            </p>
            <p className="text-sm text-muted mb-4">
              Kho: {product.stock > 0 ? <span className="text-accent font-medium">{product.stock} sản phẩm</span> : <span className="text-danger">Hết hàng</span>}
            </p>

            <div className="flex gap-3">
              {token && product.stock > 0 && (
                <button onClick={handleAddToCart} className="btn btn-primary flex-1 cursor-pointer" id="add-to-cart-btn">
                  <ShoppingCart size={18} /> Thêm vào giỏ
                </button>
              )}
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="btn btn-secondary cursor-pointer"
                id="chat-toggle-btn"
              >
                <Bot size={18} /> Hỏi AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      {chatOpen && (
        <div className="glass mt-8 p-6" id="chatbot-panel">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Bot size={20} className="text-primary" /> AI Tư vấn sản phẩm
          </h3>

          <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
            {chatHistory.length === 0 && (
              <p className="text-muted text-sm">Hãy hỏi AI về sản phẩm này hoặc yêu cầu gợi ý!</p>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white/80 text-text border border-border'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 border border-border rounded-xl px-4 py-2 text-sm text-muted">
                  Đang suy nghĩ...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              placeholder="VD: Sản phẩm này có phù hợp với tôi không?"
              className="input flex-1"
              id="chat-input"
            />
            <button onClick={handleChat} className="btn btn-primary cursor-pointer" disabled={chatLoading} id="chat-send-btn">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
