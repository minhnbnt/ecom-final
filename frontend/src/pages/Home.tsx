import { ShoppingBag, Star, Sparkles, TrendingUp, Grid, MessageSquare, ArrowRight, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router';

export default function Home() {
  const recommendedProducts = [
    {
      id: 1,
      name: 'Quantum Laptop Pro',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      category: 'Electronics',
    },
    {
      id: 2,
      name: 'Aura Wireless Headphones',
      price: 249,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      category: 'Audio',
    },
    {
      id: 3,
      name: 'Vortex Mechanical Keyboard',
      price: 159,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      category: 'Accessories',
    },
  ];

  const categories = [
    { id: 1, name: 'Electronics', count: 124, gradient: 'from-blue-500 to-indigo-600', icon: '💻' },
    { id: 2, name: 'Smart Home',  count: 58,  gradient: 'from-emerald-400 to-teal-600', icon: '🏠' },
    { id: 3, name: 'Accessories', count: 320, gradient: 'from-pink-500 to-rose-600',    icon: '🎧' },
    { id: 4, name: 'Gaming',      count: 87,  gradient: 'from-orange-400 to-red-600',   icon: '🎮' },
  ];

  const features = [
    {
      icon: <Zap size={26} className="text-primary" />,
      title: 'AI Recommendations',
      desc: 'LSTM model personalizes your feed based on browsing and purchase history.',
    },
    {
      icon: <Shield size={26} className="text-accent" />,
      title: 'Secure Checkout',
      desc: 'JWT-based auth with microservices architecture. Your data stays safe.',
    },
    {
      icon: <Star size={26} className="text-yellow-500" />,
      title: 'Premium Products',
      desc: 'Curated selection from trusted brands with verified reviews.',
    },
  ];

  return (
    <div className="flex flex-col gap-24">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-12 items-center pt-4">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit border border-indigo-200 text-primary font-semibold text-sm shadow-sm">
            <Sparkles size={15} />
            <span>AI-Powered · LSTM Recommendations</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
            Elevate Your <br />
            <span className="text-gradient">Shopping Experience</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
            Discover premium products tailored to you by our advanced AI.
            Seamless, transparent, beautifully crafted for modern users.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <Link to="/products" className="glass-button-primary flex items-center gap-2 text-base px-7 py-3.5">
              <ShoppingBag size={19} />
              Start Shopping
            </Link>
            <Link to="/chatbot" className="glass-button flex items-center gap-2 text-base text-slate-700 px-7 py-3.5">
              <MessageSquare size={19} />
              Ask AI
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-8 mt-4 pt-4 border-t border-slate-200">
            {[['10K+', 'Products'], ['98%', 'Satisfaction'], ['24/7', 'AI Support']].map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-slate-900">{val}</p>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/25 to-secondary/20 blur-3xl -z-10 rounded-3xl scale-110" />
          <div className="glass-card p-3 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Premium Smartwatch"
              className="rounded-xl w-full h-[380px] object-cover"
            />
            {/* Floating badge */}
            <div className="absolute bottom-8 left-8 glass border border-white/60 p-3.5 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top Seller</p>
                <p className="font-bold text-slate-900 text-sm">Vortex Smartwatch · $299</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Recommendations ────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold mb-2 uppercase tracking-widest text-xs">
              <TrendingUp size={16} />
              <span>For You</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">AI Recommendations</h2>
            <p className="text-slate-500 mt-1 text-sm">Products our LSTM model thinks you'll love</p>
          </div>
          <Link to="/products" className="hidden md:flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2.5 transition-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {recommendedProducts.map((product) => (
            <Link
              to={`/product/${product.id}`}
              key={product.id}
              className="glass-card group flex flex-col gap-0 overflow-hidden !p-0"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1 shadow-sm">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {product.rating}
                </div>
                {/* Category */}
                <div className="absolute top-3 left-3 bg-primary/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {product.category}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Free Shipping</p>
                </div>
                <p className="font-extrabold text-primary text-lg">${product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-secondary font-bold mb-2 uppercase tracking-widest text-xs">
              <Grid size={16} />
              <span>Browse By</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Categories</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link
              to={`/categories/${cat.id}`}
              key={cat.id}
              className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group relative overflow-hidden min-h-[130px]"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${cat.gradient} transition-opacity duration-300`} />
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h3 className="font-bold text-slate-900">{cat.name}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{cat.count} items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="flex flex-col gap-8 mb-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Why Choose EcomFinal?</h2>
          <p className="text-slate-500">The perfect blend of AI intelligence and beautiful design.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-7 flex flex-col gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl glass border border-slate-200 flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
