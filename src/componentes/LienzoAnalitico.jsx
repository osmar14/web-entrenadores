import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

export default function LienzoAnalitico({ esPro, setMostrarPaywall, cliente, usuarioActual, entrenamientosRecientes = [], rutinasDelCliente = [], abrirParaAnalizar }) {
  const [datosRadarGeneral, setDatosRadarGeneral] = useState([]);
  const [datosRadarDetalle, setDatosRadarDetalle] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  
  // Estados para Comparador (PRO)
  const [datosComparativa, setDatosComparativa] = useState([]);
  const [mes1, setMes1] = useState('');
  const [mes2, setMes2] = useState('');
  const [cargandoComparativa, setCargandoComparativa] = useState(false);

  useEffect(() => {
    // Inicializar meses para el comparador al mes actual y al anterior
    const hoy = new Date();
    const m1 = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    hoy.setMonth(hoy.getMonth() - 1);
    const m2 = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    setMes1(m2); // Mes anterior
    setMes2(m1); // Mes actual
  }, []);

  useEffect(() => {
    if (cliente && usuarioActual) {
      cargarRadarGeneral();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, usuarioActual]);

  async function cargarRadarGeneral() {
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/radar/${cliente.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Formatear para recharts con rombo fijo (Pierna, Pecho, Espalda, Bíceps, Hombro, Tríceps)
        const baseMuscles = ["Pierna", "Pecho", "Bíceps", "Espalda", "Tríceps", "Hombro"];
        const formattedData = baseMuscles.map(muscle => {
           const matchSearch = muscle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
           const found = data.find(d => {
              if(!d.grupo_muscular) return false;
              const gSearch = d.grupo_muscular.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return gSearch === matchSearch || gSearch.includes(matchSearch) || matchSearch.includes(gSearch);
           });
           return {
             subject: muscle,
             A: found ? found.total_series : 0
           };
        });
        
        const maxSeries = Math.max(...formattedData.map(d => d.A));
        formattedData.forEach(d => d.fullMark = Math.max(maxSeries + 5, 10));
        
        setDatosRadarGeneral(formattedData);
      }
    } catch (e) { console.error("Error radar", e); }
  };

  const cargarRadarDetalle = async (grupo) => {
    if (!esPro) {
      setMostrarPaywall(true);
      return;
    }
    setGrupoSeleccionado(grupo);
    setDatosRadarDetalle([]);
    setModalDetalleAbierto(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/radar-detalle/${cliente.id}/${grupo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDatosRadarDetalle(data.map(d => ({
          name: d.ejercicio.length > 15 ? d.ejercicio.substring(0, 15) + '...' : d.ejercicio,
          series: d.total_series
        })));
      }
    } catch (e) { console.error("Error detalle", e); }
  };

  const cargarComparativa = async () => {
    if (!esPro || !mes1 || !mes2) return;
    setCargandoComparativa(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/comparativa/${cliente.id}?mes1=${mes1}&mes2=${mes2}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDatosComparativa(await res.json());
      }
    } catch (e) { console.error("Error comparativa", e); }
    setCargandoComparativa(false);
  };

  const CustomTooltipRadar = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl z-50">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-1">{payload[0].payload.subject}</p>
          <p className="text-emerald-400 font-black text-lg">
            {payload[0].value} <span className="text-sm font-normal text-zinc-500">Series (30 días)</span>
          </p>
          {esPro ? (
            <p className="text-[10px] text-zinc-500 mt-2">Haz clic para desglosar ejercicios</p>
          ) : (
            <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1"><span>👑</span> Pro: Clic para desglosar</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl z-50">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-2">{label}</p>
          {payload.map((p, idx) => (
             <p key={idx} className="font-black text-sm" style={{ color: p.color }}>
               {p.name}: {p.value} <span className="font-normal text-zinc-500">series</span>
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipDetalle = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl z-50">
          <p className="text-emerald-400 text-xs font-bold mb-1">{label}</p>
          <p className="text-white font-black text-sm">
            {payload[0].value} <span className="text-xs font-normal text-zinc-500">series</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 space-y-6">
      
      {/* SECCIÓN 1: RADAR GLOBAL Y PLAN DE ENTRENAMIENTO */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🕸️</span>
          <div>
            <h2 className="text-xl font-black text-white">Análisis de Progreso</h2>
            <p className="text-sm text-zinc-400">Distribución de esfuerzo y registro de sesiones.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* PANEL IZQUIERDO: PLAN DE ENTRENAMIENTOS */}
          <div className="flex flex-col space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><span>⏱️</span> Últimos Entrenamientos</h3>
              {entrenamientosRecientes.length === 0 ? (
                <div className="text-center py-4 opacity-50"><p className="text-xs text-zinc-500">No hay entrenamientos recientes.</p></div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {entrenamientosRecientes.map((ent, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center hover:border-zinc-700 transition">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{ent.rutina_nombre || 'Rutina Eliminada'}</span>
                        <span className="text-[10px] text-zinc-500">{new Date(ent.fecha).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => { const rut = rutinasDelCliente.find(r => r.id === ent.rutina_id); if (rut && abrirParaAnalizar) abrirParaAnalizar(rut); }} className="text-blue-400 text-[10px] font-bold bg-blue-500/10 px-3 py-1.5 rounded hover:bg-blue-500/20 transition border border-blue-500/20 uppercase">Detalle</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Historial por Rutina</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {rutinasDelCliente.map(rut => (
                  <button key={rut.id} onClick={() => abrirParaAnalizar && abrirParaAnalizar(rut)} className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 p-3 rounded-xl text-left transition flex flex-col items-start gap-1 group">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">{rut.nombre}</span>
                  </button>
                ))}
                {rutinasDelCliente.length === 0 && (
                   <p className="text-xs text-zinc-500">No tiene rutinas asignadas.</p>
                )}
              </div>
            </div>
          </div>

          {/* GRÁFICA RADAR A LA DERECHA */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 h-[420px] flex flex-col relative overflow-hidden group">
            <h3 className="text-center text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4">Distribución Muscular</h3>
            {datosRadarGeneral.length === 0 ? (
              <div className="flex-1 flex items-center justify-center"><p className="text-zinc-600 text-sm">Sin datos suficientes.</p></div>
            ) : (
              <div className="flex-1 -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={datosRadarGeneral}>
                    <PolarGrid gridType="polygon" stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Tooltip content={<CustomTooltipRadar />} />
                    <Radar
                      name="Series"
                      dataKey="A"
                      stroke="#10b981"
                      fill="#34d399"
                      fillOpacity={0.3}
                      dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2, cursor: 'pointer', onClick: (e, payload) => cargarRadarDetalle(payload.payload.subject) }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] text-zinc-400 font-bold bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">Clica un vértice para detalles</span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL PARA DRILL-DOWN DETALLE */}
      {modalDetalleAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setModalDetalleAbierto(false)}>
           <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
                 <h3 className="text-emerald-400 font-black uppercase tracking-wider flex items-center gap-2"><span>🔍</span> Desglose: <span className="text-white">{grupoSeleccionado}</span></h3>
                 <button onClick={() => setModalDetalleAbierto(false)} className="text-zinc-500 hover:text-white transition text-xl font-bold">&times;</button>
              </div>
              <div className="p-6 h-80">
                 {datosRadarDetalle.length === 0 ? (
                   <div className="h-full flex items-center justify-center"><p className="text-zinc-600 font-bold animate-pulse">Cargando desglose...</p></div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={datosRadarDetalle} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                       <XAxis type="number" stroke="#52525b" fontSize={10} hide />
                       <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} width={120} tickLine={false} axisLine={false} />
                       <Tooltip content={<CustomTooltipDetalle />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                       <Bar dataKey="series" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                         {datosRadarDetalle.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 4]} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* SECCIÓN 2: COMPARADOR PRO (PAYWALL) */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-4 md:p-6 relative overflow-hidden">
        {!esPro && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-amber-500/30 p-6 rounded-2xl shadow-2xl text-center max-w-sm cursor-pointer transform hover:scale-105 transition" onClick={() => setMostrarPaywall(true)}>
              <span className="text-4xl mb-3 block drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">👑</span>
              <h3 className="text-lg font-black text-white mb-2">Comparador de Evolución</h3>
              <p className="text-zinc-400 text-xs mb-4">Compara el rendimiento de diferentes meses para validar tu metodología con datos duros.</p>
              <button className="bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 px-6 py-2 rounded-xl font-black text-sm">Desbloquear Pro</button>
            </div>
          </div>
        )}

        <div className={`transition-all duration-500 ${!esPro ? 'opacity-20 pointer-events-none select-none blur-sm' : ''}`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚖️</span>
              <div>
                <h2 className="text-xl font-black text-white">Generador de Comparativas</h2>
                <p className="text-sm text-zinc-400">Compara el volumen mensual por zona muscular.</p>
              </div>
            </div>

            {/* Controles de Comparación */}
            <div className="flex flex-wrap gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold uppercase">Mes A:</span>
                <input type="month" value={mes1} onChange={(e) => setMes1(e.target.value)} className="bg-zinc-900 text-white text-sm px-2 py-1 rounded outline-none border border-zinc-700" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold uppercase">Mes B:</span>
                <input type="month" value={mes2} onChange={(e) => setMes2(e.target.value)} className="bg-zinc-900 text-white text-sm px-2 py-1 rounded outline-none border border-zinc-700" />
              </div>
              <button onClick={cargarComparativa} disabled={cargandoComparativa} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-1.5 rounded-lg shadow-lg transition">
                {cargandoComparativa ? '...' : 'Comparar'}
              </button>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 h-72">
            {datosComparativa.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <span className="text-3xl mb-2">📊</span>
                <p className="text-sm font-bold text-zinc-400">Selecciona dos meses y presiona Comparar</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosComparativa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="grupo_muscular" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltipBar />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                  <Bar name={`Mes ${mes1}`} dataKey="series_mes1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar name={`Mes ${mes2}`} dataKey="series_mes2" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}