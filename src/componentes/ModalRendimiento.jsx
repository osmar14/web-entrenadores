import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function ModalRendimiento({ mostrarModalHistorial, setMostrarModalHistorial, cliente, usuarioActual, catalogoEjercicios, esPro, setMostrarPaywall }) {
  const [rutinasDias, setRutinasDias] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [cargandoSesiones, setCargandoSesiones] = useState(false);

  // Progreso del Ejercicio
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [datosProgreso, setDatosProgreso] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const ejerciciosFiltrados = catalogoEjercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // 1. Cargar rutinas y días al abrir
  useEffect(() => {
    if (mostrarModalHistorial && cliente && usuarioActual) {
      const fetchRutinasDias = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`http://localhost:3000/api/rendimiento/rutinas-dias/${cliente.id}`, {
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
          const res = await fetch(`http://localhost:3000/api/rendimiento/sesiones-dia/${cliente.id}/${rutinaSeleccionada}/${diaSeleccionado}`, {
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
          const res = await fetch(`http://localhost:3000/api/rendimiento/progreso-ejercicio/${cliente.id}/${ejercicioSeleccionado}`, {
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
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-zinc-800 pb-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-blue-500 text-4xl">⚡</span> Rendimiento
          </h2>
          <button onClick={() => setMostrarModalHistorial(false)} className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition text-lg flex items-center justify-center">✕</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* PANEL IZQUIERDO: Rutinas y Entrenamientos */}
          <div className="lg:w-1/2 flex flex-col gap-4 h-full">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-inner shrink-0">
              <h3 className="text-lg font-black text-white mb-3">Tus Rutinas</h3>
              <div className="flex flex-wrap gap-2">
                {rutinasDias.map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => setRutinaSeleccionada(r.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${rutinaSeleccionada === r.id ? 'bg-blue-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-blue-500/50'}`}
                  >
                    {r.nombre}
                  </button>
                ))}
              </div>

              {rutinaSeleccionada && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-400 mb-2">Días de la Rutina</h4>
                  <div className="flex flex-wrap gap-2">
                    {rutinasDias.find(r => r.id === rutinaSeleccionada)?.dias.map(dia => (
                      <button 
                        key={dia} 
                        onClick={() => setDiaSeleccionado(dia)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${diaSeleccionado === dia ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-emerald-500/50'}`}
                      >
                        {dia}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-inner flex-1 flex flex-col min-h-0">
              <h3 className="text-lg font-black text-white mb-4">Últimos 4 Entrenamientos</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {cargandoSesiones ? (
                  <div className="flex items-center justify-center h-full"><span className="text-zinc-500 animate-pulse font-bold">Cargando...</span></div>
                ) : sesiones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
                    <span className="text-4xl mb-2">📭</span>
                    <p>No hay sesiones registradas para este día.</p>
                  </div>
                ) : (
                  sesiones.map((sesion, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg relative">
                      {idx === 0 && <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl rounded-tr-xl">MÁS RECIENTE</span>}
                      <h4 className="text-white font-black mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
                        <span className="text-emerald-500">📅</span>
                        {new Date(sesion.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(sesion.ejercicios).map(([ejNombre, series]) => (
                          <div key={ejNombre}>
                            <p className="text-blue-400 font-bold text-sm mb-1">{ejNombre}</p>
                            <div className="flex flex-wrap gap-2">
                              {series.map((s, i) => (
                                <span key={i} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md">
                                  {s.peso}kg × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* PANEL DERECHO: Progreso por Ejercicio */}
          <div className="lg:w-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-inner flex flex-col h-full relative">
            {!esPro && (
               <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500 text-amber-500 text-[10px] font-black px-2 py-1 rounded-md z-10 flex items-center gap-1">
                 <span>⭐</span> EXCLUSIVO PRO
               </div>
            )}
            
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">📈 Gráfica de Picos de Fuerza</h3>
            <p className="text-sm text-zinc-400 mb-6">Selecciona un ejercicio para ver tus picos de fuerza (1RM Estimado) y el volumen de la serie. Interactúa con la gráfica para ver los detalles.</p>
            
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder="Buscar ejercicio..." 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition shadow-inner" 
                disabled={!esPro}
              />
              <select 
                value={ejercicioSeleccionado} 
                onChange={intentarSeleccionarEjercicio}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                  <option value="">-- Selecciona un ejercicio para graficar --</option>
                  {ejerciciosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div className="flex-1 min-h-[300px] relative">
              {!ejercicioSeleccionado ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                   <span className="text-5xl mb-4 text-zinc-600">📉</span>
                   <p className="text-zinc-400 font-bold">Selecciona un ejercicio para generar la gráfica interactiva.</p>
                   {!esPro && <button onClick={() => setMostrarPaywall(true)} className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20">Mejorar a PRO</button>}
                 </div>
              ) : datosProgreso.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                   <p className="text-zinc-400 font-bold">No hay registros suficientes para graficar este ejercicio.</p>
                 </div>
              ) : (
                <div className="w-full h-full bg-zinc-950 rounded-xl p-4 border border-zinc-800 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosProgreso} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="fecha" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
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
      </div>
    </div>
  );
}
