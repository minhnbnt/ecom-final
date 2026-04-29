const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || error.error || 'Request failed');
  }

  return response.json();
}

// ── Auth API ────────────────────────────────────────────────────

export const authApi = {
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    request<{ user: User; tokens: Tokens }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) =>
    request<{ user: User; tokens: Tokens }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<User>('/users/me/', { token }),
};

// ── Products API ────────────────────────────────────────────────

export const productsApi = {
  list: (params?: { category?: number; search?: string; ordering?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', String(params.category));
    if (params?.search) qs.set('search', params.search);
    if (params?.ordering) qs.set('ordering', params.ordering);
    const query = qs.toString() ? `?${qs}` : '';
    return request<Product[] | { results: Product[] }>(`/products/${query}`);
  },

  get: (id: number) =>
    request<Product>(`/products/${id}/`),

  categories: () =>
    request<Category[]>('/products/categories/'),
};

// ── Cart API ────────────────────────────────────────────────────

export const cartApi = {
  get: (token: string) =>
    request<Cart>('/cart/', { token }),

  add: (token: string, productId: number, quantity: number = 1) =>
    request<Cart>('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
      token,
    }),

  remove: (token: string, productId: number) =>
    request<Cart>('/cart/remove/', {
      method: 'DELETE',
      body: JSON.stringify({ product_id: productId }),
      token,
    }),
};

// ── Orders API ──────────────────────────────────────────────────

export const ordersApi = {
  list: (token: string) =>
    request<Order[]>('/orders/', { token }),

  create: (token: string, shippingAddress: string) =>
    request<Order>('/orders/create/', {
      method: 'POST',
      body: JSON.stringify({ shipping_address: shippingAddress }),
      token,
    }),

  get: (token: string, id: number) =>
    request<Order>(`/orders/${id}/`, { token }),
};

// ── AI API ──────────────────────────────────────────────────────

export const aiApi = {
  recommend: (userId: number) =>
    request<{ recommended_product_ids: number[] }>(`/recommend?user_id=${userId}`),

  chatbot: (message: string, userId?: number) =>
    request<{ answer: string; products: unknown[] }>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message, user_id: userId }),
    }),
};

// ── Types ───────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  phone: string;
  address: string;
  is_active: boolean;
  date_joined: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  product_count?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  category: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
  book?: { author: string; publisher: string; isbn: string; pages: number };
  electronics?: { brand: string; warranty_months: number; specifications: Record<string, unknown> };
  fashion?: { size: string; color: string; material: string };
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_price: string;
  status: string;
  shipping_address: string;
  items: OrderItem[];
  created_at: string;
}
