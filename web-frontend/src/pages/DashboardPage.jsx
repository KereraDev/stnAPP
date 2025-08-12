import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import { fetchInformes } from '../services/fetchInformes';
import { FileText, UtilityPole, Calendar, Check } from 'lucide-react';
import '../styles/DashboardPage.css';

const ESTADOS = ['pendiente', 'aprobado', 'rechazado', 'enviado'];
const COLOR_ESTADO = {
  pendiente: '#ffd600',
  aprobado:  '#16a34a',
  rechazado: '#e74c3c',
  enviado:   '#2563eb'
};

const tt = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const DashboardPage = () => {
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem('dashboard_informes');
    if (cached) {
      try { setInformes(JSON.parse(cached)); } catch { localStorage.removeItem('dashboard_informes'); }
    }

    fetchInformes()
      .then((data) => {
        setInformes(Array.isArray(data) ? data : (data?.informes || []));
        localStorage.setItem('dashboard_informes', JSON.stringify(Array.isArray(data) ? data : (data?.informes || [])));
      })
      .catch((err) => setError(err.message || 'Error al cargar'));
  }, []);

  const cantidad = informes.length;

  // fechas (toma fechaActividad, luego createdAt, luego fecha_actividad legacy)
  const pickFechaBase = (inf) => inf?.fechaActividad || inf?.createdAt || inf?.fecha_actividad || null;

  const hoy = new Date();
  const hoyKey = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())).toISOString().slice(0,10);

  const informesHoy = informes.filter(i => {
    const f = pickFechaBase(i);
    if (!f) return false;
    const d = new Date(f);
    const key = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10);
    return key === hoyKey;
  }).length;

  const ultimoInforme = informes.reduce((acc, curr) => {
    const fC = pickFechaBase(curr);
    const fA = acc ? pickFechaBase(acc) : null;
    if (!acc || (fC && new Date(fC) > new Date(fA))) return curr;
    return acc;
  }, null);

  const tiposAislador = new Set(informes.map(i => i?.tipoAislador || i?.tipo_aislador || '')).size;

  // Ubicaciones (por comuna)
  const comunas = [...new Set(informes.map(i => i?.ubicacion?.comuna || 'Sin comuna'))];

  // Conteo por estado (normaliza a nuestros 4)
  const estados = informes.reduce((acc, i) => {
    const e = (i?.estado || 'pendiente').toLowerCase();
    const key = ESTADOS.includes(e) ? e : 'pendiente';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Serie por fecha (clave ISO YYYY-MM-DD + label legible)
  const mapCount = {};
  informes.forEach(i => {
    const f = pickFechaBase(i);
    if (!f) return;
    const d = new Date(f);
    const key = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10);
    mapCount[key] = (mapCount[key] || 0) + 1;
  });
  const dataLine = Object.entries(mapCount)
    .map(([key, total]) => ({
      fechaKey: key,
      fecha: new Date(key).toLocaleDateString('es-CL'),
      total
    }))
    .sort((a, b) => new Date(a.fechaKey) - new Date(b.fechaKey));

  // Barras por estado (en orden fijo)
  const dataBar = ESTADOS.map(e => ({ estado: tt(e), key: e, cantidad: estados[e] || 0 }));

  // Pie por comuna
  const dataPie = comunas.map(nombre => ({
    name: nombre,
    value: informes.filter(i => (i?.ubicacion?.comuna || 'Sin comuna') === nombre).length
  }));

  return (
    <BackgroundComponent header={<Header />}>
      <div className="dashboard-container">
        {error && <p className="informes-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="dashboard-content">
          <div className="dashboard-metric-card horizontal">
            <div className="icon-box icon-total">
              <FileText className="metric-icon" />
            </div>
            <div className="metric-info">
              <div className="metric-value">{cantidad}</div>
              <div className="metric-label">Total de informes</div>
            </div>
          </div>

          <div className="dashboard-metric-card horizontal">
            <div className="icon-box icon-ultimo">
              <Calendar className="metric-icon" />
            </div>
            <div className="metric-info">
              <div className="metric-value">{informesHoy}</div>
              <div className="metric-label">Informes de hoy</div>
            </div>
          </div>

          <div className="dashboard-metric-card horizontal">
            <div className="icon-box icon-hoy">
              <Check className="metric-icon" />
            </div>
            <div className="metric-info">
              <div className="metric-value">
                {ultimoInforme ? new Date(pickFechaBase(ultimoInforme)).toLocaleDateString('es-CL') : '-'}
              </div>
              <div className="metric-label">Último informe</div>
            </div>
          </div>

          <div className="dashboard-metric-card horizontal">
            <div className="icon-box icon-ubicacion">
              <UtilityPole className="metric-icon" />
            </div>
            <div className="metric-info">
              <div className="metric-value">{tiposAislador}</div>
              <div className="metric-label">Tipos de aislador</div>
            </div>
          </div>
        </div>

        <div className="dashboard-graphics-row">
          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Total de informes por día</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dataLine} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#185dc8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Informes por estado</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataBar} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 13 }}>
                  {dataBar.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={COLOR_ESTADO[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Distribución por comuna</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dataPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#185dc8"
                  label
                >
                  {dataPie.map((entry, idx) => (
                    <Cell
                      key={`cell-ubic-${idx}`}
                      fill={`hsl(${(idx * 360) / Math.max(1, dataPie.length)}, 70%, 55%)`}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </BackgroundComponent>
  );
};

export default DashboardPage;
