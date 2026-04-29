import { Link } from 'react-router-dom'
import { ArrowRight, Cpu, ShoppingBag, Truck, Bot, Sparkles, Shield } from 'lucide-react'

export default function Home() {
  const features = [
    { icon: ShoppingBag, title: 'Đa dạng sản phẩm', desc: '10 nhóm loại sản phẩm: Sách, Điện tử, Thời trang & nhiều hơn' },
    { icon: Cpu, title: 'AI Recommendation', desc: 'LSTM + Knowledge Graph gợi ý sản phẩm cá nhân hóa' },
    { icon: Bot, title: 'Chatbot tư vấn', desc: 'GraphRAG + Neo4j cho câu trả lời chính xác về sản phẩm' },
    { icon: Shield, title: 'Bảo mật JWT', desc: 'Xác thực JWT với phân quyền RBAC (Admin/Staff/Customer)' },
    { icon: Truck, title: 'Giao hàng toàn diện', desc: 'Theo dõi đơn hàng real-time: processing → shipping → delivered' },
    { icon: Sparkles, title: 'Microservices', desc: '8 services độc lập + API Gateway Nginx + Database-per-service' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero py-20 px-4" id="hero-section">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6">
            <span className="badge badge-info px-4 py-1.5 text-sm">
              <Sparkles size={14} className="inline mr-1" />
              Powered by AI + Neo4j + Microservices
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Mua sắm thông minh
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              với trí tuệ nhân tạo
            </span>
          </h1>

          <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
            Nền tảng e-commerce hiện đại với AI tư vấn sản phẩm,
            Knowledge Graph Neo4j, và kiến trúc Microservices hoàn chỉnh.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn btn-primary text-lg px-8 py-4 cursor-pointer" id="cta-products">
              Khám phá sản phẩm
              <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-secondary text-lg px-8 py-4 cursor-pointer" id="cta-register">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" id="features-section">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Tính năng nổi bật
          </h2>
          <p className="text-center text-muted mb-12 max-w-xl mx-auto">
            Hệ thống e-commerce đầy đủ với AI, từ gợi ý sản phẩm đến chatbot tư vấn
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card flex flex-col items-start" id={`feature-${i}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-cta))' }}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {f.title}
                </h3>
                <p className="text-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-gradient-hero py-20 px-4" id="architecture-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            Kiến trúc hệ thống
          </h2>
          <div className="glass p-8 text-left">
            <pre className="text-sm text-muted overflow-x-auto leading-relaxed">
{`┌─────────────────────────────────────────────────────┐
│                  Nginx API Gateway                  │
│              (port 8080 — reverse proxy)            │
├──────┬──────┬──────┬──────┬──────┬──────┬───────────┤
│ User │ Prod │ Cart │Order │ Pay  │ Ship │    AI     │
│ Svc  │ Svc  │ Svc  │ Svc  │ Svc  │ Svc  │   Svc    │
│Django│Django│Django│Django│Django│Django│  FastAPI  │
├──────┴──────┴──────┴──────┴──────┴──────┤  + LSTM  │
│                                         │  + Neo4j │
│   MariaDB        PostgreSQL             │  + RAG   │
│   (userdb)    (product/cart/order/       │  + OpenAI│
│                payment/shipping)        │          │
└─────────────────────────────────────────┴──────────┘`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
