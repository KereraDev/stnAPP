// src/services/fetchCantidadInformes.js
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/+$/, '');

export async function fetchCantidadInformes() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

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
    throw new Error('No se pudo conectar con el servidor');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }

  if (!res.ok) {
    throw new Error(data?.mensaje || data?.error || 'No se pudieron obtener los informes');
  }

  const lista = Array.isArray(data) ? data : (data?.informes || []);
  return lista.length;
}
