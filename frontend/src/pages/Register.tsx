import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { authApi } from '../api'
import { useAuth } from '../App'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'customer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user, tokens } = await authApi.register(form)
      login(user, tokens)
      navigate('/')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4" id="register-page">
      <div className="glass p-8">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          <UserPlus size={24} className="inline mr-2 text-primary" /> Đăng ký
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-username" className="block text-sm font-medium mb-1">Tên đăng nhập</label>
            <input id="reg-username" type="text" className="input" value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-1">Email</label>
            <input id="reg-email" type="email" className="input" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input id="reg-password" type="password" className="input" minLength={6} value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="reg-role" className="block text-sm font-medium mb-1">Vai trò</label>
            <select id="reg-role" className="input cursor-pointer" value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full cursor-pointer" id="register-submit">
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          Đã có tài khoản? <Link to="/login" className="text-primary font-medium cursor-pointer">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
