import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function ModalRendimiento({ mostrarModalHistorial, setMostrarModalHistorial, cliente, usuarioActual, catalogoEjercicios, esPro, setMostrarPaywall }) {
  const [rutinasDias, setRutinasDias] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [cargandoSesiones, setCargandoSesiones] = useState(false);

  const [tabActivo, setTabActivo] = useState('historial');
  const [filtroMusculo, setFiltroMusculo] = useState('Todos');

  // Progreso del Ejercicio
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [datosProgreso, setDatosProgreso] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const ejerciciosFiltrados = catalogoEjercicios.filter(e => {
    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideMusculo = filtroMusculo === 'Todos' || (e.grupo_muscular && e.grupo_muscular.toLowerCase() === filtroMusculo.toLowerCase());
    return coincideBusqueda && coincideMusculo;
  });

  const getColorTipoSerieCard = (tipo) => {
    switch (tipo) {
      case 'Calentamiento': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'Dropset': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'Efectiva':
      default: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  // 1. Cargar rutinas y días al abrir
  useEffect(() => {
    if (mostrarModalHistorial && cliente && usuarioActual) {
      const fetchRutinasDias = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rendimiento/rutinas-dias/${cliente.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setRutinasDias(data);
            if (data.length > 0) {
              setRutinaSeleccionada(data[0].id);
              if (data[0].dias.length > 0) {
                setDiaSeleccionado(data[0].dias[0]);
              }
            }
          }
        } catch (e) {
          console.error("Error al cargar rutinas y dias:", e);
        }
      };
      fetchRutinasDias();
    }
  }, [mostrarModalHistorial, cliente, usuarioActual]);

  // Si cambia la rutina seleccionada, auto-seleccionar su primer día
  useEffect(() => {
    if (rutinaSeleccionada) {
      const rut = rutinasDias.find(r => r.id === rutinaSeleccionada);
      if (rut && rut.dias.length > 0) {
        setDiaSeleccionado(rut.dias[0]);
      } else {
        setDiaSeleccionado(null);
      }
    }
  }, [rutinaSeleccionada, rutinasDias]);

  // 2. Cargar las últimas 4 sesiones cuando cambia el día
  useEffect(() => {
    if (mostrarModalHistorial && cliente && usuarioActual && rutinaSeleccionada && diaSeleccionado) {
      const fetchSesiones = async () => {
        setCargandoSesiones(true);
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rendimiento/sesiones-dia/${cliente.id}/${rutinaSeleccionada}/${diaSeleccionado}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSesiones(data);
          }
        } catch (e) {
          console.error("Error al cargar sesiones:", e);
        }
        setCargandoSesiones(false);
      };
      fetchSesiones();
    }
  }, [diaSeleccionado, rutinaSeleccionada, cliente, usuarioActual, mostrarModalHistorial]);

  // 3. Cargar datos del gráfico de progreso
  useEffect(() => {
    if (mostrarModalHistorial && ejercicioSeleccionado && cliente && usuarioActual) {
      const fetchProgreso = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rendimiento/progreso-ejercicio/${cliente.id}/${ejercicioSeleccionado}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setDatosProgreso(await res.json());
          }
        } catch (e) {
          console.error("Error Progreso Ejercicio", e);
        }
      };
      fetchProgreso();
    }
  }, [ejercicioSeleccionado, cliente, usuarioActual, mostrarModalHistorial]);

  const intentarSeleccionarEjercicio = (e) => {
    if (!esPro) {
      setMostrarPaywall(true);
      return;
    }
    setEjercicioSeleccionado(e.target.value);
  };

  // Custom Tooltip para la gráfica interactiva
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-emerald-500/50 p-4 rounded-xl shadow-xl shadow-emerald-500/10">
          <p className="font-black text-white text-lg mb-2 border-b border-zinc-800 pb-2">{label}</p>
          <div className="space-y-1">
             <p className="text-emerald-400 font-bold text-sm">
               1RM Estimado: <span className="text-white">{data.rm_estimado} kg</span>
             </p>
             <p className="text-blue-400 font-bold text-sm">
               Serie más pesada: <span className="text-white">{data.peso} kg × {data.reps} reps</span>
             </p>
             <p className="text-amber-400 font-bold text-sm">
               Volumen de la serie: <span className="text-white">{data.volumen_serie} kg</span>
             </p>
             <p className="text-zinc-400 font-bold text-xs mt-2 pt-2 border-t border-zinc-800">
               Volumen total del día: {data.volumen_total_dia} kg
             </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!mostrarModalHistorial) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-[95vw] shadow-2xl flex flex-col h-[90vh] animate-in zoom-in duration-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 shrink-0 border-b border-zinc-800 pb-4 gap-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-blue-500 text-4xl">⚡</span> Rendimiento
          </h2>
          
          <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl shadow-inner w-full lg:w-auto overflow-x-auto">
            <button onClick={() => setTabActivo('historial')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${tabActivo === 'historial' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>🗓️ Historial</button>
            <button onClick={() => setTabActivo('graficas')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${tabActivo === 'graficas' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>📈 Gráficas</button>
          </div>

          <button onClick={() => setMostrarModalHistorial(false)} className="hidden lg:flex w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition text-lg items-center justify-center">✕</button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          
          {tabActivo === 'historial' && (
            <div className="flex flex-col h-full">
              <div className="px-8 pt-6 border-b border-zinc-800 pb-4 shrink-0 flex flex-col gap-5">
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Filtrar por Rutina:</p>
                  <div className="flex flex-wrap gap-2">
                    {rutinasDias.map(r => (
                      <button 
                        key={r.id} 
                        onClick={() => setRutinaSeleccionada(r.id)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition ${rutinaSeleccionada === r.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}`}
                      >
                        {r.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {rutinaSeleccionada && rutinasDias.find(r => r.id === rutinaSeleccionada)?.dias.length > 0 && (
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Día de entrenamiento:</p>
                    <div className="flex flex-wrap gap-2">
                      {rutinasDias.find(r => r.id === rutinaSeleccionada)?.dias.map(dia => (
                        <button 
                          key={dia} 
                          onClick={() => setDiaSeleccionado(dia)}
                          className={`px-5 py-2 rounded-xl text-sm font-bold transition ${diaSeleccionado === dia ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-zinc-950/30">
                {cargandoSesiones ? (
                  <div className="flex items-center justify-center h-full"><span className="text-emerald-400 animate-pulse font-bold text-xl">Cargando historial...</span></div>
                ) : sesiones.length === 0 ? (
                  <div className="text-center py-20"><p className="text-6xl mb-6">👻</p><h3 className="text-2xl font-black text-white mb-2">No hay sesiones registradas</h3><p className="text-zinc-400">Este día no tiene entrenamientos guardados.</p></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sesiones.map((sesion, idx) => (
                      <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg h-fit relative">
                        {idx === 0 && <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl rounded-tr-xl">MÁS RECIENTE</span>}
                        <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'}`}></div>
                             <h4 className="font-bold text-white text-lg tracking-wide capitalize">
                               {(() => {
                                  const dateStr = sesion.fecha.includes('T') ? sesion.fecha : sesion.fecha + 'T00:00:00';
                                  const d = new Date(dateStr);
                                  return isNaN(d.getTime()) ? sesion.fecha : d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                               })()}
                             </h4>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-800 px-2 py-1 rounded-md">{diaSeleccionado}</span>
                        </div>

                        <div className="p-5 space-y-5">
                          {Object.entries(sesion.ejercicios).map(([ejNombre, series]) => (
                            <div key={ejNombre} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                               <p className="text-sm font-black text-blue-400 mb-3 line-clamp-1">{ejNombre}</p>
                               <div className="grid grid-cols-2 gap-3 mb-3">
                                 {series.map(set => {
                                   const colorClases = getColorTipoSerieCard(set.tipo_serie);
                                   return (
                                     <div key={set.serie} className={`px-3 py-2 rounded-lg border flex flex-col transition-colors ${colorClases}`}>
                                       <span className="text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-90">
                                          Set {set.serie} {set.tipo_serie && set.tipo_serie !== 'Efectiva' ? `(${set.tipo_serie})` : ''}
                                       </span>
                                       <span className="text-white font-medium text-sm flex items-center gap-1">
                                         {set.peso} kg <span className="text-zinc-500 text-[10px] mx-1">x</span> {set.reps}
                                       </span>
                                     </div>
                                   );
                                 })}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {tabActivo === 'graficas' && (
            <div className="flex flex-col h-full bg-zinc-900 p-8 relative overflow-y-auto custom-scrollbar">
              {!esPro && (
                 <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500 text-amber-500 text-[10px] font-black px-2 py-1 rounded-md z-10 flex items-center gap-1 shadow-lg shadow-amber-500/20">
                   <span>⭐</span> EXCLUSIVO PRO
                 </div>
              )}
              
              <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                <h3 className="text-xl md:text-2xl font-black text-white mb-2 flex items-center gap-3">📈 Gráfica de Picos de Fuerza</h3>
                <p className="text-sm text-zinc-400 mb-6">Filtra por grupo muscular y selecciona un ejercicio para ver tus picos de fuerza (1RM Estimado).</p>
                
                <div className="mb-6 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-3">1. Filtrar por Grupo Muscular</p>
                  <div className="flex flex-wrap gap-2">
                     {['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bicep', 'Tricep', 'Abdomen'].map(m => (
                       <button 
                         key={m} 
                         onClick={() => setFiltroMusculo(m)}
                         className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filtroMusculo === m ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-emerald-500/50'}`}
                       >
                         {m}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">2. Seleccionar Ejercicio</p>
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar..." 
                      value={busqueda} 
                      onChange={e => setBusqueda(e.target.value)}
                      className="sm:w-1/3 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition shadow-inner" 
                      disabled={!esPro}
                    />
                    <select 
                      value={ejercicioSeleccionado} 
                      onChange={intentarSeleccionarEjercicio}
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                        <option value="">-- Selecciona un ejercicio para graficar --</option>
                        {ejerciciosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex-1 min-h-[400px] relative">
                  {!ejercicioSeleccionado ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 p-6">
                       <span className="text-6xl mb-4 text-zinc-600">📉</span>
                       <h4 className="text-2xl font-black text-white mb-2">Lienzo Vacío</h4>
                       <p className="text-zinc-400 font-bold max-w-md">Selecciona un ejercicio arriba para generar la gráfica interactiva y visualizar el progreso de tu cliente a lo largo del tiempo.</p>
                       {!esPro && <button onClick={() => setMostrarPaywall(true)} className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-amber-500/20 hover:scale-105 transition">⭐ Mejorar a PRO</button>}
                     </div>
                  ) : datosProgreso.length === 0 ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                       <p className="text-zinc-400 font-bold text-lg">No hay suficientes registros de este ejercicio para generar una gráfica.</p>
                     </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-950 rounded-2xl p-6 border border-zinc-800 shadow-inner">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={datosProgreso} margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="fecha" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                          <YAxis stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 2, strokeDasharray: '3 3' }} />
                          <Line 
                            type="monotone" 
                            dataKey="rm_estimado" 
                            name="1RM (Fuerza)" 
                            stroke="#10b981" 
                            strokeWidth={4} 
                            dot={{ r: 6, fill: '#10b981', stroke: '#18181b', strokeWidth: 3 }} 
                            activeDot={{ r: 10, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
