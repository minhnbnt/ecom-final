import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router';
import { ShoppingBag, User, Search, MessageSquare, Sparkles } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import Chatbot from './pages/Chatbot';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Cart from './pages/Cart';

function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto glass-dark rounded-2xl px-5 py-3 flex items-center justify-between">
        {/* Logo + Links */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white font-black text-xl tracking-tight select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/40">
              <Sparkles size={16} className="text-white" />
            </div>
            EcomFinal
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[['/', 'Home'], ['/products', 'Shop'], ['/categories', 'Categories']].map(([path, label]) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-white/15 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden lg:flex items-center relative">
            <Search className="absolute left-3 text-slate-400 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-white/8 border border-white/15 text-white placeholder:text-slate-500 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/12 text-sm w-52 transition-all"
            />
          </div>

          {/* Chatbot */}
          <Link
            to="/chatbot"
            title="AI Chatbot"
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200"
          >
            <MessageSquare size={18} />
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            title="Cart"
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 relative"
          >
            <ShoppingBag size={18} />
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-secondary text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-900 leading-none px-0.5">
              3
            </span>
          </Link>

          <div className="w-px h-5 bg-white/15 mx-1 hidden sm:block" />

          {/* Sign In */}
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-primary/30"
          >
            <User size={15} />
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative">
        {/* Animated Background */}
        <div className="bg-blobs">
          <div className="bg-blob-1" />
          <div className="bg-blob-2" />
          <div className="bg-blob-3" />
        </div>

        <Navbar />

        {/* Main Content */}
        <main className="flex-1 pt-28 pb-20 px-4 md:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/"           element={<Home />} />
              <Route path="/login"      element={<Login />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/chatbot"    element={<Chatbot />} />
              <Route path="/products"   element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/cart"       element={<Cart />} />
              <Route path="*"           element={<PlaceholderPage title="404 — Page Not Found" />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-8 text-slate-400 text-sm border-t border-slate-200/60">
          © 2026 EcomFinal — AI-Powered Microservices E-Commerce
        </footer>
      </div>
    </Router>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card text-center px-16 py-14">
        <p className="text-5xl mb-4">🚧</p>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-500 text-sm">Coming soon</p>
      </div>
    </div>
  );
}

export default App;
