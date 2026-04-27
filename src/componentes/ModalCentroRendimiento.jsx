import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

export function ModalCentroRendimiento({ mostrarModalHistorial, setMostrarModalHistorial, rutinasDelCliente, cliente, usuarioActual, catalogoEjercicios }) {
  const [historialMes, setHistorialMes] = useState([]);
  const [cargandoMes, setCargandoMes] = useState(false);
  const [datosAdherencia, setDatosAdherencia] = useState(null);
  const [errorAdherencia, setErrorAdherencia] = useState(false);
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState('');
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState({}); // { "Día 1": [50, 49], "brazo": [45, 44, 55, 58] }

  // Progreso por Ejercicio (Combo Chart)
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [datosProgreso, setDatosProgreso] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const ejerciciosFiltrados = catalogoEjercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // Seleccionar automáticamente el primer ejercicio filtrado
  useEffect(() => {
    if (busqueda && ejerciciosFiltrados.length > 0) {
      setEjercicioSeleccionado(ejerciciosFiltrados[0].id);
    }
  }, [busqueda]);

  // Cargar Historial Mensual y Adherencia al abrir
  useEffect(() => {
    if (mostrarModalHistorial && cliente && usuarioActual) {
      const fetchData = async () => {
        setCargandoMes(true);
        setErrorAdherencia(false);
        try {
          const token = await usuarioActual.getIdToken();
          const headers = { 'Authorization': `Bearer ${token}` };
          
          // 1. Obtener los días y ejercicios de la rutina activa PRIMERO
          let mapaDiaEjercicios = {}; // { "Día 1": [50, 49], "brazo": [45, 44] }
          let diasRutina = [];
          
          if (rutinasDelCliente && rutinasDelCliente.length > 0) {
              try {
                  const rutinaActivaId = rutinasDelCliente[0].id;
                  const resRutina = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios/${rutinaActivaId}`, { headers });
                  if (resRutina.ok) {
                      const ejerciciosRutina = await resRutina.json();
                      ejerciciosRutina.forEach(ej => {
                          const dia = ej.dia_nombre || 'Sin Día';
                          if (!mapaDiaEjercicios[dia]) mapaDiaEjercicios[dia] = [];
                          if (!mapaDiaEjercicios[dia].includes(ej.ejercicio_id)) {
                              mapaDiaEjercicios[dia].push(ej.ejercicio_id);
                          }
                      });
                      diasRutina = Object.keys(mapaDiaEjercicios);
                  }
              } catch(e) { console.warn('No se pudo obtener ejercicios de rutina activa', e); }
          }
          
          setEjerciciosPorDia(mapaDiaEjercicios);
          
          // 2. Historial Mes
          const resMes = await fetch(`https://backend-entrenadores-production.up.railway.app/api/progreso/historial-mes/${cliente.id}`, { headers });
          if (resMes.ok) {
            const data = await resMes.json();
            const dataParseada = data.map(d => ({...d, dia_nombre: d.dia_nombre || 'Sin Día'}));
            setHistorialMes(dataParseada);
            
            // Usar los días de la rutina activa como prioridad
            let diasFinales = diasRutina.length > 0 ? diasRutina : [...new Set(dataParseada.map(d => d.dia_nombre).filter(Boolean))];
            
            setDiasDisponibles(diasFinales);
            if (diasFinales.length > 0) setDiaSeleccionado(diasFinales[0]);
          } else {
            // Si historial falla pero tenemos días de la rutina, igual mostrar los botones
            if (diasRutina.length > 0) {
              setDiasDisponibles(diasRutina);
              setDiaSeleccionado(diasRutina[0]);
            }
          }

          // 3. Adherencia (con manejo de error independiente)
          try {
            const resAdh = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/adherencia/${cliente.id}`, { headers });
            if (resAdh.ok) {
              setDatosAdherencia(await resAdh.json());
            } else {
              console.warn('Adherencia respondió con error:', resAdh.status);
              setErrorAdherencia(true);
              setDatosAdherencia({ porcentaje_adherencia: 0, dias_entrenados: 0, dias_totales: 0, fechas_activas: [] });
            }
          } catch (adhErr) {
            console.error('Error al cargar adherencia:', adhErr);
            setErrorAdherencia(true);
            setDatosAdherencia({ porcentaje_adherencia: 0, dias_entrenados: 0, dias_totales: 0, fechas_activas: [] });
          }

        } catch (e) { console.error("Error al cargar datos del Centro de Rendimiento", e); }
        setCargandoMes(false);
      };
      fetchData();
    }
  }, [mostrarModalHistorial, cliente, usuarioActual]);

  // Cargar datos de Progreso por Ejercicio (1RM y Volumen combinados)
  useEffect(() => {
    if (mostrarModalHistorial && ejercicioSeleccionado && cliente && usuarioActual) {
      const fetchProgreso = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const headers = { 'Authorization': `Bearer ${token}` };
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/1rm/${cliente.id}/${ejercicioSeleccionado}`, { headers });
          if (res.ok) {
            const data = await res.json();
            // Agrupar por fecha
            const porFecha = {};
            data.forEach(r => {
              const fecha = new Date(r.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
              if (!porFecha[fecha]) porFecha[fecha] = { fecha, '1rm': 0, tonelaje: 0 };
              
              const rmEst = parseFloat(r.estimado_1rm);
              const vol = parseFloat(r.peso_kg) * parseInt(r.repeticiones);
              
              if (rmEst > porFecha[fecha]['1rm']) porFecha[fecha]['1rm'] = rmEst;
              porFecha[fecha].tonelaje += vol;
            });
            setDatosProgreso(Object.values(porFecha));
          }
        } catch (e) { console.error("Error Progreso Ejercicio", e); }
      };
      fetchProgreso();
    }
  }, [ejercicioSeleccionado, cliente, usuarioActual, mostrarModalHistorial]);

  // Generar grid de adherencia (últimos 90 días)
  const generarGridAdherencia = () => {
    if (!datosAdherencia || !datosAdherencia.fechas_activas) return [];
    return datosAdherencia.fechas_activas;
  };

  const getColorSerie = (tipo) => {
    switch (tipo) {
      case 'Calentamiento': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'Dropset': case 'Drop Set': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  // Filtrar y agrupar historial por el día seleccionado (solo las últimas 4 fechas de ese día)
  const getEntrenamientosDia = () => {
    if (!diaSeleccionado) return [];
    
    // Obtener los ejercicio_ids que pertenecen a este día según la rutina activa
    const ejerciciosDelDia = ejerciciosPorDia[diaSeleccionado] || [];
    
    // Filtrar historial: matchear por dia_nombre O por ejercicio_id del mapa de la rutina
    const historialDia = historialMes.filter(h => {
      // Match directo por dia_nombre
      if (h.dia_nombre === diaSeleccionado) return true;
      // Match por ejercicio_id si el historial tiene un dia_nombre genérico o no coincide
      if (ejerciciosDelDia.length > 0 && ejerciciosDelDia.includes(h.ejercicio_id)) return true;
      return false;
    });
    
    // Agrupar por fecha + rutina_id (para no mezclar si hizo 2 rutinas distintas el mismo día)
    const porSesion = {};
    historialDia.forEach(r => {
      const sesionKey = `${r.dia_entrenamiento}_${r.rutina_id}`;
      if (!porSesion[sesionKey]) porSesion[sesionKey] = { fecha: r.dia_entrenamiento, rutina_nombre: r.rutina_nombre, ejercicios: {} };
      
      const ej = r.ejercicio_nombre || 'Ejercicio';
      if (!porSesion[sesionKey].ejercicios[ej]) porSesion[sesionKey].ejercicios[ej] = [];
      porSesion[sesionKey].ejercicios[ej].push(r);
    });

    // Ordenar descendente y tomar las últimas 4
    const sesionesOrdenadas = Object.values(porSesion).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 4);
    
    return sesionesOrdenadas;
  };


  if (!mostrarModalHistorial) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-[95vw] shadow-2xl flex flex-col h-[90vh] animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-zinc-800 pb-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-blue-500 text-4xl">🏆</span> Centro de Rendimiento
          </h2>
          <button onClick={() => setMostrarModalHistorial(false)} className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition text-lg flex items-center justify-center">✕</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* PANEL IZQUIERDO: Adherencia y Últimas Sesiones */}
          <div className="lg:w-1/2 flex flex-col gap-6 h-full">
            
            {/* ADHERENCIA */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-inner shrink-0">
               <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">📅 Adherencia de Entrenamiento</h3>
               {errorAdherencia && (
                  <div className="text-center py-1 mb-2"><p className="text-amber-500 text-[10px] font-bold">⚠️ No se pudo cargar la adherencia completa. Mostrando datos parciales.</p></div>
               )}
               {!datosAdherencia ? (
                  <div className="text-center py-4"><p className="text-zinc-600 animate-pulse font-bold">Cargando...</p></div>
               ) : (
                  <div className="flex gap-6 items-center">
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 text-center shrink-0 min-w-[120px]">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Últimos 90 Días</p>
                      <p className="text-4xl font-black text-white">{datosAdherencia.porcentaje_adherencia}<span className="text-lg text-indigo-400 ml-1">%</span></p>
                      <p className="text-[10px] text-zinc-500 mt-1">{datosAdherencia.dias_entrenados} de {datosAdherencia.dias_totales} días</p>
                    </div>
                    <div className="flex-1">
                      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
                        {generarGridAdherencia().map((d, i) => (
                          <div key={i} title={`${d.fecha} - ${d.estado}`}
                            className={`aspect-square rounded-sm transition-colors ${
                                d.estado === 'completo' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' :
                                d.estado === 'incompleto' ? 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]' :
                                d.estado === 'missed' ? 'bg-red-900/50 border border-red-900/80 shadow-[0_0_4px_rgba(220,38,38,0.3)]' :
                                'bg-zinc-800/50 border border-zinc-700/50'
                            }`} />
                        ))}
                      </div>
                      
                      {/* LEYENDA */}
                      <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-zinc-400 uppercase mt-2">
                        <span>Menos</span>
                        <div className="w-3 h-3 bg-zinc-800/50 border border-zinc-700/50 rounded-sm" title="Descanso"></div>
                        <div className="w-3 h-3 bg-red-900/50 border border-red-900/80 rounded-sm" title="Falta (Missed)"></div>
                        <div className="w-3 h-3 bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)] rounded-sm" title="Incompleto"></div>
                        <div className="w-3 h-3 bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)] rounded-sm" title="Completo"></div>
                        <span>Más</span>
                      </div>
                    </div>
                  </div>
               )}
            </div>

            {/* ÚLTIMAS SESIONES POR DÍA */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-inner flex-1 flex flex-col min-h-0">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">⏱️ Últimas Sesiones por Día</h3>
              <p className="text-xs text-zinc-400 mb-4">Selecciona un día de la rutina para ver los últimos 4 entrenamientos registrados y comparar el progreso.</p>
              
              {/* Tabs de Días */}
              <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl mb-4 shrink-0 gap-1 overflow-x-auto custom-scrollbar">
                {diasDisponibles.length === 0 ? (
                   <div className="text-center w-full py-2 text-zinc-500 text-xs">No hay historial para los días de esta rutina.</div>
                ) : (
                   diasDisponibles.map(dia => (
                     <button key={dia} onClick={() => setDiaSeleccionado(dia)} className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap px-4 ${diaSeleccionado === dia ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>{dia}</button>
                   ))
                )}
              </div>

              {/* Lista de entrenamientos */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                {cargandoMes ? (
                   <div className="text-center py-6"><p className="text-zinc-500 animate-pulse font-bold">Cargando...</p></div>
                ) : getEntrenamientosDia().length === 0 ? (
                   <div className="text-center py-10 opacity-50"><p className="text-zinc-500">No hay datos para este día en el último mes.</p></div>
                ) : (
                   getEntrenamientosDia().map((entrenamiento, idx) => (
                     <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg relative">
                        {idx === 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">MÁS RECIENTE</div>}
                        <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-600'}`}></div>
                            <span className="font-black text-white text-lg">{new Date(entrenamiento.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' }).toUpperCase()}</span>
                          </div>
                          {entrenamiento.rutina_nombre && (
                              <span className="text-[10px] text-zinc-400 font-bold bg-zinc-800 px-2 py-1 rounded-md">{entrenamiento.rutina_nombre}</span>
                          )}
                        </div>
                        <div className="p-5 space-y-4">
                          {Object.entries(entrenamiento.ejercicios).map(([nombreEj, series]) => (
                            <div key={nombreEj} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                              <p className="text-sm font-black text-blue-400 mb-3">{nombreEj}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {series.map((s, i) => (
                                  <div key={i} className={`px-3 py-2 rounded-lg border flex flex-col items-center justify-center ${getColorSerie(s.tipo_serie)}`}>
                                    <span className="text-[10px] uppercase font-bold mb-1 opacity-70">Serie {s.serie_numero}</span>
                                    <div className="text-base font-black">
                                      {s.peso_kg}<span className="text-[10px] font-normal mx-0.5">kg</span> × {s.repeticiones}
                                    </div>
                                    {s.rir && <span className="text-[10px] opacity-60 mt-1">RIR {s.rir}</span>}
                                  </div>
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
          <div className="lg:w-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-inner flex flex-col h-full">
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">📈 Progreso por Ejercicio</h3>
            <p className="text-sm text-zinc-400 mb-6">Analiza cómo ha evolucionado el peso máximo (1RM Estimado) junto con el volumen total de carga (Tonelaje) para cada ejercicio.</p>
            
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="Buscar ejercicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition shadow-inner" />
              <select value={ejercicioSeleccionado} onChange={e => setEjercicioSeleccionado(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition cursor-pointer">
                  <option value="">-- Selecciona un ejercicio para ver la gráfica --</option>
                  {ejerciciosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div className="flex-1 min-h-[300px] relative">
              {!ejercicioSeleccionado ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-zinc-800 rounded-xl">
                   <span className="text-5xl mb-4">📊</span>
                   <p className="text-zinc-400 font-bold">Selecciona un ejercicio para analizar su progreso.</p>
                 </div>
              ) : datosProgreso.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-zinc-800 rounded-xl">
                   <p className="text-zinc-400 font-bold">No hay registros suficientes para graficar.</p>
                 </div>
              ) : (
                <div className="w-full h-full bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={datosProgreso} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="fecha" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                      
                      {/* Eje Y Izquierdo (Tonelaje) */}
                      <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} />
                      {/* Eje Y Derecho (1RM) */}
                      <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} tickLine={false} axisLine={false} />
                      
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      
                      {/* Barras de Tonelaje */}
                      <Bar yAxisId="left" dataKey="tonelaje" name="Tonelaje (Volumen)" fill="#10b981" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
                      
                      {/* Línea de 1RM */}
                      <Line yAxisId="right" type="monotone" dataKey="1rm" name="1RM Estimado" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', stroke: '#18181b', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {ejercicioSeleccionado && datosProgreso.length > 0 && (
              <div className="mt-6 flex justify-center gap-8 bg-zinc-950 rounded-xl py-3 border border-zinc-800">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-zinc-400 font-bold uppercase">1RM Estimado (Fuerza)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500/40 rounded-sm border border-emerald-500"></div>
                    <span className="text-xs text-zinc-400 font-bold uppercase">Tonelaje (Volumen total)</span>
                 </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
