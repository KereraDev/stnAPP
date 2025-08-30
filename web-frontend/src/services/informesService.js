// src/services/fetchCantidadInformes.js
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/+$/, '');

import { getErrorMessage, ERROR_MESSAGES } from '../utils/errorMessages';

export async function fetchCantidadInformes() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);

  // Lee el rol del JWT con fallback seguro
  let rol = 'tecnico';
  try {
    const payload = JSON.parse(atob((token.split('.')[1] || '').trim()));
    rol = payload?.rol || 'tecnico';
  } catch {
    // si falla, seguimos como técnico
  }

  const endpoint = rol === 'admin'
    ? `${API_BASE}/api/informes`
    : `${API_BASE}/api/informes/mios`;

  let res;
  try {
    res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error(ERROR_MESSAGES.CONNECTION_ERROR);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
    }
    throw new Error(getErrorMessage(data?.mensaje || data?.error || 'load_error'));
  }

  const lista = Array.isArray(data) ? data : (data?.informes || []);
  return lista.length;
}
