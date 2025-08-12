// src/services/authService.js
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/+$/, '');
const API_URL = `${API_BASE}/api/auth`;

export async function login({ correo, contraseña }) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // si tu backend espera "contraseña", mantenlo así
    body: JSON.stringify({ correo, contraseña }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }

  if (!res.ok) {
    throw new Error(data?.mensaje || data?.error || `Error en login (${res.status})`);
  }
  return data; // { token, usuario, ... }
}
