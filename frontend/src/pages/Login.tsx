import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { authApi } from '../api'
import { useAuth } from '../App'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user, tokens } = await authApi.login(form)
      login(user, tokens)
      navigate('/')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4" id="login-page">
      <div className="glass p-8">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          <LogIn size={24} className="inline mr-2 text-primary" /> Đăng nhập
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium mb-1">Tên đăng nhập</label>
            <input id="login-username" type="text" className="input" value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input id="login-password" type="password" className="input" value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          {error && <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full cursor-pointer" id="login-submit">
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          Chưa có tài khoản? <Link to="/register" className="text-primary font-medium cursor-pointer">Đăng ký</Link>
        </p>
      </div>
    </div>
  )
}
