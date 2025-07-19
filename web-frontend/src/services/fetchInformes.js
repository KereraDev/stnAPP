// Servicio para obtener todos los informes (no solo la cantidad)
export async function fetchInformes() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const payload = JSON.parse(atob(token.split('.')[1]));
  const rol = payload.rol;
  const endpoint = rol === 'admin'
    ? 'http://localhost:3000/api/informes'
    : 'http://localhost:3000/api/informes/mios';
  const response = await fetch(endpoint, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('No se pudieron obtener los informes');
  const data = await response.json();
  return data.informes || [];
}
