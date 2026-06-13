import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Phone, MapPin, Calendar, Shield, Loader2, AlertCircle, CheckCircle, Save } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  is_active: boolean;
  date_joined: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', address: '' });

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch('/api/users/me/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { navigate('/login'); return; }
        setProfile(data);
        setForm({ email: data.email ?? '', phone: data.phone ?? '', address: data.address ?? '' });
        setLoading(false);
      })
      .catch(() => { setError('Không thể tải thông tin'); setLoading(false); });
  }, [token, navigate]);

  const handleSave = async () => {
    if (!token || !profile) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/users/me/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Object.values(data).flat().join(', ') || 'Cập nhật thất bại');
      setProfile(prev => prev ? { ...prev, ...data } : null);
      setEditing(false);
      setSuccess('Cập nhật thông tin thành công');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm">Đang tải…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center px-12 py-10">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Không tìm thấy thông tin</h1>
          <Link to="/" className="glass-button-primary inline-flex items-center gap-2 text-sm">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const ROLE_LABELS: Record<string, string> = { admin: 'Admin', staff: 'Nhân viên', customer: 'Khách hàng' };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="glass-button p-2.5 text-slate-400 hover:text-primary">
          <User size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Thông tin cá nhân</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý thông tin tài khoản của bạn</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-accent bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Profile info */}
      <div className="glass-card flex flex-col gap-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.username}</h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              <Shield size={10} />
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm">
            <User size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs">Tên đăng nhập</p>
              <p className="font-medium text-slate-900">{profile.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs">Ngày tham gia</p>
              <p className="font-medium text-slate-900">{new Date(profile.date_joined).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="glass-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Chi tiết liên hệ</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm font-medium text-primary hover:underline">
              Chỉnh sửa
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Mail size={14} className="text-slate-400" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="glass-input px-3 py-2 text-sm"
                placeholder="your@email.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Phone size={14} className="text-slate-400" />
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="glass-input px-3 py-2 text-sm"
                placeholder="0123456789"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <MapPin size={14} className="text-slate-400" />
                Địa chỉ
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="glass-input resize-none px-3 py-2 text-sm"
                placeholder="Địa chỉ của bạn"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="glass-button-primary flex items-center gap-2 text-sm py-2.5 disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Lưu thay đổi
              </button>
              <button
                onClick={() => { setEditing(false); setForm({ email: profile.email ?? '', phone: profile.phone ?? '', address: profile.address ?? '' }); }}
                className="glass-button text-sm py-2.5"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Email</p>
                <p className="font-medium text-slate-900">{profile.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Số điện thoại</p>
                <p className="font-medium text-slate-900">{profile.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm sm:col-span-2">
              <MapPin size={16} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Địa chỉ</p>
                <p className="font-medium text-slate-900">{profile.address || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
