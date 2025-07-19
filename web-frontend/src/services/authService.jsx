const API_URL = 'http://localhost:3000/api/auth';

export async function login({ correo, contraseña }) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contraseña }),
  });

  if (!response.ok) throw new Error('Error en login');

  return await response.json();
}
