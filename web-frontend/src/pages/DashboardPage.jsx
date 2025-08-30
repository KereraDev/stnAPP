import React, { useEffect, useMemo, useState } from 'react';
import { getErrorMessage, ERROR_MESSAGES } from '../utils/errorMessages';
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  LabelList,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts';

import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import { fetchInformes } from '../services/fetchInformes';
import { FileText, UtilityPole, Calendar, Check } from 'lucide-react';
import '../styles/DashboardPage.css';

/* ================================
   Utilidades
================================== */
const tt = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const toNum = (v) => {
  if (v === 0) return 0;
  if (!v) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const dayKeyUTC = (dateLike) => {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (isNaN(d)) return null;
  const k = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
  return k;
};

const formatDateCL = (dateKey) => {
  if (!dateKey) return '-';
  const [year, month, day] = dateKey.split('-');
  return `${day}-${month}-${year}`;
};

/* ================================
   Constantes (roles y colores)
================================== */
const ROLE_META = [
  { key: 'ayudante',       label: 'Ayudante',        color: '#ef4444' },
  { key: 'jefeBrigada',    label: 'Jefe de brigada', color: '#f59e0b' },
  { key: 'operador',       label: 'Operador',        color: '#10b981' },
  { key: 'prevencionista', label: 'Prevencionista',  color: '#22c55e' },
  { key: 'supervisor',     label: 'Supervisor',      color: '#3b82f6' },
  { key: 'tecnico',        label: 'Técnico',         color: '#8b5cf6' },
];

// Colores para el gráfico de torta
const PIE_COLORS = [
  '#185dc8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

/* ================================
   Componente
================================== */
const DashboardPage = () => {
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');

  // campo fecha base por informe
  const pickFechaBase = (inf) =>
    inf?.fechaInicio || inf?.createdAt || inf?.fechaActividad || inf?.fecha_actividad || null;

  useEffect(() => {
    const cached = localStorage.getItem('dashboard_informes');
    if (cached) {
      try {
        setInformes(JSON.parse(cached));
      } catch {
        localStorage.removeItem('dashboard_informes');
      }
    }

    fetchInformes()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.informes || [];
        setInformes(list);
        localStorage.setItem('dashboard_informes', JSON.stringify(list));
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const cantidad = informes.length;

  // clave de "hoy" en UTC
  const hoyKey = useMemo(() => dayKeyUTC(new Date()), []);

  const informesHoy = useMemo(() => {
    let count = 0;
    for (const i of informes) {
      const k = dayKeyUTC(pickFechaBase(i));
      if (k && k === hoyKey) count++;
    }
    return count;
  }, [informes, hoyKey]);

  const ultimoInforme = useMemo(() => {
    let best = null;
    for (const inf of informes) {
      const f = pickFechaBase(inf);
      if (!f) continue;
      if (!best) {
        best = inf;
      } else {
        const fb = pickFechaBase(best);
        if (new Date(f) > new Date(fb)) best = inf;
      }
    }
    return best;
  }, [informes]);

  // ===== Línea: total por día =====
  const dataLine = useMemo(() => {
    const map = {};
    for (const i of informes) {
      const fechaBase = pickFechaBase(i);
      const k = dayKeyUTC(fechaBase);
      if (!k) continue;
      map[k] = (map[k] || 0) + 1;
    }
    
    const result = Object.entries(map)
      .map(([k, total]) => ({
        fechaKey: k,
        fecha: formatDateCL(k),
        total,
      }))
      .sort((a, b) => new Date(a.fechaKey) - new Date(b.fechaKey));
    
    return result;
  }, [informes]);

  // ===== Barras (vertical): estructuras lavadas por informe (Top 10) =====
  const dataBarEstructuras = useMemo(() => {
    return informes
      .map((inf, idx) => ({
        name: inf?.instalacion || `Informe ${idx + 1}`,
        value: Number(inf?.programa?.estructurasLavadas) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [informes]);

  // ===== Barras (horizontal): personal involucrado total por rol =====
  const dataPersonal = useMemo(() => {
    return ROLE_META.map((r) => {
      const total = informes.reduce(
        (acc, inf) => acc + toNum(inf?.personal?.[r.key]),
        0
      );
      return { role: r.label, value: total, color: r.color };
    });
  }, [informes]);

  // ===== Métrica: consumo diario total =====
  const consumoTotal = useMemo(() => {
    return informes.reduce(
      (acc, inf) => acc + toNum(inf?.controlAgua?.consumoDiario),
      0
    );
  }, [informes]);

  // ===== Área: Consumo de agua por día (promedio) =====
  const dataWater = useMemo(() => {
    const map = {};
    for (const inf of informes) {
      const fecha = pickFechaBase(inf); // Usar siempre fechaInicio como base
      const k = dayKeyUTC(fecha);
      if (!k) continue;
      const v = toNum(inf?.controlAgua?.consumoDiario);
      if (!map[k]) map[k] = { sum: 0, count: 0 };
      map[k].sum += v;
      map[k].count += 1;
    }
    return Object.entries(map)
      .map(([k, { sum, count }]) => ({
        fechaKey: k,
        fecha: formatDateCL(k),
        promedio: count ? +(sum / count).toFixed(2) : 0,
      }))
      .sort((a, b) => new Date(a.fechaKey) - new Date(b.fechaKey));
  }, [informes]);

  // ===== Torta: Informes por cliente =====
  const dataPieClientes = useMemo(() => {
    const map = {};
    for (const inf of informes) {
      const cliente = inf?.cliente?.trim() || 'Sin cliente';
      map[cliente] = (map[cliente] || 0) + 1;
    }
    
    return Object.entries(map)
      .map(([cliente, cantidad], index) => ({
        name: cliente,
        value: cantidad,
        color: PIE_COLORS[index % PIE_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Ordenar por cantidad descendente
  }, [informes]);

  return (
    <BackgroundComponent header={<Header />}>
      <div className="dashboard-container">
        {error && (
          <p className="informes-error" style={{ marginBottom: 16 }}>
            {error}
          </p>
        )}

        {/* ===== Métricas ===== */}
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
                {ultimoInforme
                  ? formatDateCL(dayKeyUTC(pickFechaBase(ultimoInforme)))
                  : '-'}
              </div>
              <div className="metric-label">Último informe</div>
            </div>
          </div>

          <div className="dashboard-metric-card horizontal">
            <div className="icon-box icon-ubicacion">
              <UtilityPole className="metric-icon" />
            </div>
            <div className="metric-info">
              <div className="metric-value">{consumoTotal.toFixed(2)}</div>
              <div className="metric-label">Consumo diario de agua (total)</div>
            </div>
          </div>
        </div>

        {/* ===== Fila 1 de gráficos ===== */}
        <div className="dashboard-graphics-row">
          {/* Línea: informes por día */}
          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Total de informes por día</h3>
            <ResponsiveContainer width="100%" height={240}>
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

          {/* Barras horizontales: personal por rol */}
          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Personal involucrado (total por rol)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={dataPersonal}
                layout="vertical"
                margin={{ top: 12, right: 24, left: 24, bottom: 12 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="role" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}`, 'personas']} />
                <Legend />
                <Bar dataKey="value" name="personas" radius={[0, 8, 8, 0]}>
                  {dataPersonal.map((entry, idx) => (
                    <Cell key={`cell-role-${idx}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="right" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ===== Fila 2 de gráficos ===== */}
        <div className="dashboard-graphics-row">
          <div className="dashboard-graphic-card" style={{ maxWidth: '640px' }}>
            <h3 className="dashboard-graphic-title">Consumo de agua por día (promedio)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dataWater} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aguaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}`, 'm³ promedio']} />
                <Area
                  type="monotone"
                  dataKey="promedio"
                  name="m³ promedio"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fill="url(#aguaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Torta: informes por cliente */}
          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Informes por cliente</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 20, right: 60, left: 60, bottom: 20 }}>
                <Pie
                  data={dataPieClientes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={0}
                  paddingAngle={2}
                  label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    
                    // Porcentaje dentro del sector
                    const radiusPercent = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const xPercent = cx + radiusPercent * Math.cos(-midAngle * RADIAN);
                    const yPercent = cy + radiusPercent * Math.sin(-midAngle * RADIAN);
                    
                    // Nombre fuera del sector
                    const radiusName = outerRadius + 15;
                    const xName = cx + radiusName * Math.cos(-midAngle * RADIAN);
                    const yName = cy + radiusName * Math.sin(-midAngle * RADIAN);
                    
                    return (
                      <g>
                        {/* Porcentaje dentro */}
                        <text 
                          x={xPercent} 
                          y={yPercent} 
                          fill="white" 
                          textAnchor="middle" 
                          dominantBaseline="central"
                          fontSize="12"
                          fontWeight="bold"
                          stroke="black"
                          strokeWidth="0.5"
                          paintOrder="stroke fill"
                        >
                          {`${(percent * 100).toFixed(1)}%`}
                        </text>
                        {/* Nombre fuera */}
                        <text 
                          x={xName} 
                          y={yName} 
                          fill="#333" 
                          textAnchor={xName > cx ? 'start' : 'end'} 
                          dominantBaseline="central"
                          fontSize="12"
                          fontWeight="500"
                        >
                          {name}
                        </text>
                      </g>
                    );
                  }}
                  labelLine={false}
                >
                  {dataPieClientes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} informes`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </BackgroundComponent>
  );
};

export default DashboardPage;
