import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function LienzoAnalitico({ esPro, setMostrarPaywall }) {
  // 🧪 DATOS SIMULADOS (Mock Data) PARA EL DISEÑO
  const datosFuerza = [
    { semana: 'Sem 1', peso: 80 },
    { semana: 'Sem 2', peso: 82.5 },
    { semana: 'Sem 3', peso: 82.5 },
    { semana: 'Sem 4', peso: 85 },
    { semana: 'Sem 5', peso: 87.5 },
    { semana: 'Sem 6', peso: 90 },
  ];

  const datosVolumen = [
    { musculo: 'Pecho', series: 14 },
    { musculo: 'Espalda', series: 16 },
    { musculo: 'Pierna', series: 20 },
    { musculo: 'Hombro', series: 10 },
    { musculo: 'Brazo', series: 12 },
  ];

  // Colores para el gráfico de barras
  const coloresBarras = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Custom Tooltip para el Dark Mode
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-1">{label}</p>
          <p className="text-white font-black text-lg">
            {payload[0].value} <span className="text-sm font-normal text-zinc-500">{payload[0].name === 'peso' ? 'kg (1RM)' : 'Series'}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative mt-6 border border-zinc-800 bg-zinc-900/40 rounded-2xl p-4 md:p-6 overflow-hidden">
      
      {/* 👑 EL MURO DE CRISTAL (PAYWALL) */}
      {!esPro && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-amber-500/30 p-6 md:p-8 rounded-2xl shadow-2xl text-center max-w-sm w-[90%] mx-auto transform hover:scale-105 transition-transform cursor-pointer" onClick={() => setMostrarPaywall(true)}>
            <span className="text-4xl mb-3 block drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">👑</span>
            <h3 className="text-xl font-black text-white mb-2">Desbloquea las Analíticas</h3>
            <p className="text-zinc-400 text-sm mb-6">Monitorea la curva de fatiga y la evolución de fuerza bruta (1RM) de tus clientes.</p>
            <button className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 py-2.5 rounded-xl font-black shadow-lg">
              Ver Planes Pro
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO DEL LIENZO (Se difumina si no es Pro) */}
      <div className={`transition-all duration-500 ${!esPro ? 'opacity-30 blur-[4px] pointer-events-none select-none' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📈</span>
          <h2 className="text-xl font-black text-white">Biometría y Rendimiento</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* GRÁFICA 1: CURVA DE FUERZA (LINEAL) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Curva de Fuerza</h3>
              <p className="text-zinc-500 text-xs">Evolución de 1RM Estimado (Ej. Sentadilla)</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosFuerza} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="semana" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: '#34d399', stroke: '#10b981', strokeWidth: 2, className: "animate-pulse" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICA 2: VOLUMEN SEMANAL (BARRAS) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider">Distribución de Carga</h3>
              <p className="text-zinc-500 text-xs">Series efectivas por grupo muscular (7 días)</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosVolumen} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="musculo" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                  <Bar dataKey="series" radius={[4, 4, 0, 0]}>
                    {datosVolumen.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={coloresBarras[index % coloresBarras.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}