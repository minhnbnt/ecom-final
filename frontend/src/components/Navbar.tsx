import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Package, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../App'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/products', label: 'Sản phẩm' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 glass rounded-2xl px-6 py-3" id="main-navbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 cursor-pointer"
          id="logo-link"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-primary text-white font-bold text-lg"
               style={{ fontFamily: 'var(--font-heading)' }}>
            E
          </div>
          <span className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
            EcomFinal
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                isActive(link.to)
                  ? 'text-primary'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/cart" className="btn btn-sm btn-secondary cursor-pointer" id="cart-btn">
                <ShoppingCart size={16} />
                Giỏ hàng
              </Link>
              <Link to="/orders" className="btn btn-sm btn-secondary cursor-pointer" id="orders-btn">
                <Package size={16} />
                Đơn hàng
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                <User size={14} />
                {user.username}
                <span className="badge badge-info text-xs">{user.role}</span>
              </div>
              <button onClick={logout} className="btn btn-sm btn-danger cursor-pointer" id="logout-btn">
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-secondary cursor-pointer" id="login-btn">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary cursor-pointer" id="register-btn">
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 cursor-pointer text-muted hover:text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-3 pb-4 border-t border-border pt-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium py-2 cursor-pointer ${
                isActive(link.to) ? 'text-primary' : 'text-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="btn btn-sm btn-secondary cursor-pointer">
                <ShoppingCart size={16} /> Giỏ hàng
              </Link>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="btn btn-sm btn-secondary cursor-pointer">
                <Package size={16} /> Đơn hàng
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="btn btn-sm btn-danger cursor-pointer">
                <LogOut size={14} /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-sm btn-secondary cursor-pointer">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-sm btn-primary cursor-pointer">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
