import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CalculadoraFuncional({ cliente, usuarioActual, catalogoEjercicios }) {
  const [tabActiva, setTabActiva] = useState('1rm');
  
  // Modulo 1RM
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [prActual, setPrActual] = useState(null);
  const [curva1RM, setCurva1RM] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const ejerciciosFiltrados = catalogoEjercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // Modulo Volumen
  const [datosVolumen, setDatosVolumen] = useState([]);
  
  // Modulo Wilks
  const [pesoCorporal, setPesoCorporal] = useState('');
  const [totalLevantado, setTotalLevantado] = useState('');
  const [genero, setGenero] = useState('M');
  const [puntosWilks, setPuntosWilks] = useState(0);

  // Modulo Adherencia
  const [datosAdherencia, setDatosAdherencia] = useState(null);

  // Efecto para PR y Curva 1RM
  useEffect(() => {
    if (ejercicioSeleccionado && cliente && usuarioActual) {
      const fetchData = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const headers = { 'Authorization': `Bearer ${token}` };
          // PR
          const resPR = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/pr/${cliente.id}/${ejercicioSeleccionado}`, { headers });
          if (resPR.ok) { const d = await resPR.json(); setPrActual(d.pr); }
          // Curva 1RM
          const res1RM = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/1rm/${cliente.id}/${ejercicioSeleccionado}`, { headers });
          if (res1RM.ok) {
            const data = await res1RM.json();
            // Agrupar por fecha, tomar el mayor 1RM estimado de cada día
            const porFecha = {};
            data.forEach(r => {
              const fecha = new Date(r.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
              if (!porFecha[fecha] || r.estimado_1rm > porFecha[fecha].estimado_1rm) {
                porFecha[fecha] = { fecha, estimado_1rm: parseFloat(r.estimado_1rm) };
              }
            });
            setCurva1RM(Object.values(porFecha));
          }
        } catch (e) { console.error("Error PR/1RM", e); }
      };
      fetchData();
    }
  }, [ejercicioSeleccionado, cliente, usuarioActual]);

  // Efecto para Volumen (AreaChart)
  useEffect(() => {
    if (tabActiva === 'volumen' && cliente && usuarioActual && datosVolumen.length === 0) {
      const fetchVolumen = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/volumen-carga-total/${cliente.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setDatosVolumen(await res.json());
        } catch (e) { console.error("Error Volumen", e); }
      };
      fetchVolumen();
    }
  }, [tabActiva, cliente, usuarioActual, datosVolumen.length]);

  // Efecto para Adherencia
  useEffect(() => {
    if (tabActiva === 'adherencia' && cliente && usuarioActual && !datosAdherencia) {
      const fetchAdherencia = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/adherencia/${cliente.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setDatosAdherencia(await res.json());
        } catch (e) { console.error("Error Adherencia", e); }
      };
      fetchAdherencia();
    }
  }, [tabActiva, cliente, usuarioActual, datosAdherencia]);

  // Cálculo Wilks
  useEffect(() => {
    const pc = parseFloat(pesoCorporal);
    const tl = parseFloat(totalLevantado);
    if (pc > 0 && tl > 0) {
      let a, b, c, d, e, f;
      if (genero === 'M') {
        a = -216.0475144; b = 16.2606339; c = -0.002388645;
        d = -0.00113732; e = 7.01863E-06; f = -1.291E-08;
      } else {
        a = 594.31747775582; b = -27.23842536447; c = 0.82112226871;
        d = -0.00930733913; e = 0.00004731582; f = -0.00000009054;
      }
      const x = pc;
      const den = a + b*x + c*Math.pow(x,2) + d*Math.pow(x,3) + e*Math.pow(x,4) + f*Math.pow(x,5);
      const coef = 500 / den;
      setPuntosWilks(tl * coef);
    } else { setPuntosWilks(0); }
  }, [pesoCorporal, totalLevantado, genero]);

  // Generar grid de adherencia (últimos 90 días)
  const generarGridAdherencia = () => {
    if (!datosAdherencia) return [];
    const fechasSet = new Set(datosAdherencia.fechas_activas);
    const grid = [];
    const hoy = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      grid.push({ fecha: key, activo: fechasSet.has(key), dia: d.getDate() });
    }
    return grid;
  };

  const tabs = [
    { id: '1rm', label: '📈 1RM', color: 'bg-blue-600' },
    { id: 'volumen', label: '🏋️ Tonelaje', color: 'bg-emerald-600' },
    { id: 'adherencia', label: '📅 Adherencia', color: 'bg-indigo-600' },
    { id: 'wilks', label: '⚡ Wilks', color: 'bg-amber-500' },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4 shrink-0">
         <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-lg">🧮</span></div>
         <h2 className="text-lg font-black text-white">Calculadora Funcional</h2>
      </div>

      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-4 shrink-0 gap-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTabActiva(t.id)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tabActiva === t.id ? `${t.color} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300'}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
        {/* TAB 1RM */}
        {tabActiva === '1rm' && (
          <div className="animate-in fade-in duration-200 space-y-3">
            <p className="text-xs text-zinc-400">Selecciona un ejercicio para ver el PR y la curva de fuerza estimada (1RM).</p>
            <input type="text" placeholder="Buscar ejercicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition" />
            <select value={ejercicioSeleccionado} onChange={e => setEjercicioSeleccionado(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition cursor-pointer">
              <option value="">-- Selecciona --</option>
              {ejerciciosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>

            {ejercicioSeleccionado && (
              <>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Mejor PR (30 días)</p>
                  <p className="text-4xl font-black text-white">
                    {prActual > 0 ? prActual : '--'}<span className="text-lg text-blue-500 ml-1">kg</span>
                  </p>
                </div>
                {curva1RM.length > 1 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">📈 Curva de Fuerza (1RM Estimado)</p>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={curva1RM} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="fecha" stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3b82f6', borderRadius: '10px', fontSize: '12px' }} />
                          <Line type="monotone" dataKey="estimado_1rm" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} name="1RM Est." />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB VOLUMEN / TONELAJE */}
        {tabActiva === 'volumen' && (
          <div className="animate-in fade-in duration-200 flex flex-col h-full min-h-[280px]">
             <p className="text-xs text-zinc-400 mb-3 shrink-0">Tonelaje total (Peso × Reps) por sesión. Identifica picos de carga y planifica deloads.</p>
             {datosVolumen.length === 0 ? (
               <div className="flex-1 flex items-center justify-center"><p className="text-zinc-600 font-bold">Sin datos suficientes.</p></div>
             ) : (
               <div className="flex-1 w-full h-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={datosVolumen} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                     <defs>
                       <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                     <XAxis dataKey="fecha_corta" stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} />
                     <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                     <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#10b981', borderRadius: '10px' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                     <Area type="monotone" dataKey="volumen_total" name="Tonelaje (kg)" stroke="#10b981" strokeWidth={2} fill="url(#volGradient)" dot={{ r: 3, fill: '#10b981' }} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             )}
          </div>
        )}

        {/* TAB ADHERENCIA */}
        {tabActiva === 'adherencia' && (
          <div className="animate-in fade-in duration-200 space-y-4">
            <p className="text-xs text-zinc-400">Consistencia de entrenamiento en los últimos 90 días.</p>
            {!datosAdherencia ? (
              <div className="text-center py-8"><p className="text-zinc-600 animate-pulse font-bold">Cargando...</p></div>
            ) : (
              <>
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Adherencia General</p>
                  <p className="text-4xl font-black text-white">{datosAdherencia.porcentaje_adherencia}<span className="text-lg text-indigo-400 ml-1">%</span></p>
                  <p className="text-[10px] text-zinc-500 mt-1">{datosAdherencia.dias_entrenados} de {datosAdherencia.dias_totales} días</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Calendario de Actividad</p>
                  <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
                    {generarGridAdherencia().map((d, i) => (
                      <div key={i} title={`${d.fecha}${d.activo ? ' ✓' : ''}`}
                        className={`aspect-square rounded-sm transition-colors ${d.activo ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <span className="text-[9px] text-zinc-500">Menos</span>
                    <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800"></div>
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
                    <span className="text-[9px] text-zinc-500">Más</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB WILKS */}
        {tabActiva === 'wilks' && (
          <div className="animate-in fade-in duration-200 space-y-3">
             <p className="text-xs text-zinc-400">Fuerza relativa al peso corporal (fórmula Wilks).</p>
             <div className="flex gap-3">
               <div className={`flex-1 border rounded-xl p-2.5 text-center cursor-pointer transition ${genero === 'M' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`} onClick={() => setGenero('M')}>
                 <span className="font-bold text-xs">Masculino</span>
               </div>
               <div className={`flex-1 border rounded-xl p-2.5 text-center cursor-pointer transition ${genero === 'F' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`} onClick={() => setGenero('F')}>
                 <span className="font-bold text-xs">Femenino</span>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Peso Corporal</label>
                 <input type="number" value={pesoCorporal} onChange={e => setPesoCorporal(e.target.value)} placeholder="80" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-amber-500 transition text-sm" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Levantado</label>
                 <input type="number" value={totalLevantado} onChange={e => setTotalLevantado(e.target.value)} placeholder="500" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-amber-500 transition text-sm" />
               </div>
             </div>
             <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Puntos Wilks</p>
                <p className="text-4xl font-black text-white">{puntosWilks > 0 ? puntosWilks.toFixed(1) : '0.0'}</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
