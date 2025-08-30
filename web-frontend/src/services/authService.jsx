// src/services/authService.js
import { getErrorMessage, ERROR_MESSAGES } from '../utils/errorMessages';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3000').replace(/\/+$/, '');
const API_URL = `${API_BASE}/api/auth`;

export async function login({ correo, contraseña }) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('connection_error');
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(ERROR_MESSAGES.LOGIN_FAILED);
      }
      throw new Error(data?.mensaje || 'login_error');
    }
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
