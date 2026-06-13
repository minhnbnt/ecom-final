let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

function processQueue(error: Error | null, token: string | null) {
  pendingQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  pendingQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch('/api/auth/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('auth-changed'));
    window.location.href = '/login';
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('access_token');

  let res = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        processQueue(null, newToken);

        res = await fetch(input, {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (e) {
        isRefreshing = false;
        processQueue(e as Error, null);
        throw e;
      }
    } else {
      const newToken = await new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      });

      res = await fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return res;
}
