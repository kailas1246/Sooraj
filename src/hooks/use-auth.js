import { useState, useEffect } from 'react';

const RAW_BASE = import.meta.env.VITE_API_BASE || '';
const BASE = RAW_BASE.replace(/\/$/, '');
const API = BASE ? `${BASE}/api/auth` : '/api/auth';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(t) {
  if (t) localStorage.setItem('token', t); else localStorage.removeItem('token');
  try {
    // notify listeners in this window that auth token changed
    window.dispatchEvent(new Event('authChange'))
  } catch (e) {
    // ignore (e.g., during SSR)
  }
}

export function useUser() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true
    const fetchMe = async () => {
      const token = getToken();
      if (!token) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setIsLoading(false); return; }
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e) {
        console.error(e);
      } finally { if (mounted) setIsLoading(false); }
    }
    fetchMe();

    const handler = () => { fetchMe() }
    window.addEventListener('authChange', handler)
    return () => {
      mounted = false
      window.removeEventListener('authChange', handler)
    }
  }, []);

  return { data, isLoading };
}

export function useLogin() {
  const mutate = async ({ email, password }, { onSuccess, onError } = {}) => {
    try {
      const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && json.error) ? json.error : 'Login failed';
        throw new Error(msg);
      }
      setToken(json.token);
      if (onSuccess) onSuccess(json);
      return json;
    } catch (err) { if (onError) onError(err); else throw err; }
  };
  return { mutate, isPending: false };
}

export function useRegister() {
  const mutate = async ({ name, email, password }, { onSuccess, onError } = {}) => {
    try {
      const res = await fetch(`${API}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && json.error) ? json.error : 'Registration failed';
        throw new Error(msg);
      }
      setToken(json.token);
      if (onSuccess) onSuccess(json);
      return json;
    } catch (err) { if (onError) onError(err); else throw err; }
  };
  return { mutate, isPending: false };
}

export function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = opts.headers ? { ...opts.headers } : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // If a full URL is provided, use it as-is. Otherwise prefix with BASE.
  let url = path;
  if (!/^https?:\/\//i.test(path)) {
    if (path.startsWith('/')) url = (BASE || '') + path;
    else url = (BASE || '') + '/' + path;
  }

  return fetch(url, { ...opts, headers });
}
