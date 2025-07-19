import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import '../styles/DashboardPage.css';
import { fetchInformes } from '../services/fetchInformes';
import { FileText, UtilityPole, Calendar, Check } from 'lucide-react';

const DashboardPage = () => {
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');

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
        setInformes(data);
        localStorage.setItem('dashboard_informes', JSON.stringify(data));
      })
      .catch((err) => setError(err.message));
  }, []);

  const cantidad = informes.length;
  const hoy = new Date();
  const informesHoy = informes.filter(i => {
    const fecha = new Date(i.fecha);
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }).length;

  const ultimoInforme = informes.reduce((acc, curr) => {
    if (!acc) return curr;
    return new Date(curr.fecha) > new Date(acc.fecha) ? curr : acc;
  }, null);


  // Obtener ubicaciones únicas como objetos
  const ubicacionesSet = new Set(informes.map(i => JSON.stringify(i.ubicacion)));
  const ubicaciones = Array.from(ubicacionesSet).map(u => JSON.parse(u));
  const tiposAislador = new Set(informes.map(i => i.tipoAislador)).size;
  const estados = informes.reduce((acc, curr) => {
    acc[curr.estado] = (acc[curr.estado] || 0) + 1;
    return acc;
  }, {});

  const informesPorFecha = {};
  informes.forEach(i => {
    if (i.fecha) {
      const fecha = new Date(i.fecha);
      const fechaStr = fecha.toLocaleDateString();
      informesPorFecha[fechaStr] = (informesPorFecha[fechaStr] || 0) + 1;
    }
  });

  const dataLine = Object.entries(informesPorFecha)
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const dataBar = [
    { estado: 'Validado', cantidad: estados['validado'] || 0 },
    { estado: 'Pendiente', cantidad: estados['pendiente'] || 0 },
    { estado: 'Rechazado', cantidad: estados['rechazado'] || 0 },
  ];

  // Construir nombre de ubicación usando solo la comuna
  const dataPie = ubicaciones.map(ubic => ({
    name: ubic.comuna || 'Sin comuna',
    value: informes.filter(i => i.ubicacion.comuna === ubic.comuna).length
  }));

  return (
    <BackgroundComponent header={<Header />}>
      <div className="dashboard-container">
        {/* 📋 Métricas */}
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
                {ultimoInforme ? new Date(ultimoInforme.fecha).toLocaleDateString() : '-'}
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

        {/* 📊 Gráficos */}
        <div className="dashboard-graphics-row">
          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Total de informes por día</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dataLine} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#185dc8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
                  {dataBar.map((entry, index) => {
                    let color = '#185dc8';
                    if (entry.estado === 'Validado') color = '#1ca02c';
                    if (entry.estado === 'Pendiente') color = '#ffd600';
                    if (entry.estado === 'Rechazado') color = '#e74c3c';
                    return <Cell key={`bar-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-graphic-card">
            <h3 className="dashboard-graphic-title">Distribución por ubicación</h3>
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
                    <Cell key={`cell-ubic-${idx}`} fill={`hsl(${(idx * 360) / dataPie.length}, 70%, 55%)`} />
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