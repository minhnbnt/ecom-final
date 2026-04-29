import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { authApi, type User, type Tokens } from './api'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Login from './pages/Login'
import Register from './pages/Register'

// ── Auth Context ────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('access_token')
  )

  useEffect(() => {
    if (token && !user) {
      authApi.me(token)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setToken(null)
        })
    }
  }, [token, user])

  const login = (u: User, tokens: Tokens) => {
    setUser(u)
    setToken(tokens.access)
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
        <Navbar />
        <main className="flex-1 pt-24 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={token ? <CartPage /> : <Navigate to="/login" />} />
            <Route path="/checkout" element={token ? <Checkout /> : <Navigate to="/login" />} />
            <Route path="/orders" element={token ? <Orders /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-muted text-sm border-t border-border">
          <p>© 2026 EcomFinal — Smart E-Commerce Platform with AI</p>
        </footer>
      </div>
    </AuthContext.Provider>
  )
}

export default App
