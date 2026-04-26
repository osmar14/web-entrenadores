import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import CalculadoraFuncional from './CalculadoraFuncional';

export function ModalNuevaNota({ mostrarModalNota, setMostrarModalNota, nuevaNota, setNuevaNota, handleGuardarNota }) {
  if (!mostrarModalNota) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 text-xl">📂</div><h2 className="text-xl font-extrabold text-white">Nueva Nota</h2></div>
          <button onClick={() => setMostrarModalNota(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition">✕</button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Categoría</label>
            <select value={nuevaNota.categoria} onChange={(e) => setNuevaNota({ ...nuevaNota, categoria: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition cursor-pointer">
              <option value="General">📝 Nota General</option>
              <option value="Lesión">🚨 Lesión / Dolor Agudo</option>
              <option value="Salud">🩺 Salud / Movilidad</option>
              <option value="Nutrición">🍏 Nutrición</option>
              <option value="Motivación">🧠 Motivación / Psicología</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Mensaje / Detalle</label>
            <textarea value={nuevaNota.mensaje} onChange={(e) => setNuevaNota({ ...nuevaNota, mensaje: e.target.value })} placeholder="Ej. Siente molestia en el hombro..." className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition placeholder-zinc-700 min-h-[120px] resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setMostrarModalNota(false)} className="px-5 py-3 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition">Cancelar</button>
          <button onClick={handleGuardarNota} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">Guardar Nota</button>
        </div>
      </div>
    </div>
  );
}

export function ModalAsignarPlantilla({ mostrarModalAsignar, setMostrarModalAsignar, listaRutinas, handleClonarRutina, clienteSeleccionado }) {
  if (!mostrarModalAsignar) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-white">Plantillas</h2>
          <button onClick={() => setMostrarModalAsignar(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {listaRutinas.map(p => (
            <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between cursor-pointer hover:border-blue-500 transition-colors" onClick={() => { handleClonarRutina(p.id, clienteSeleccionado.id); setMostrarModalAsignar(false); }}>
              <div><p className="font-bold text-white">{p.nombre}</p></div>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-500 font-bold flex items-center justify-center">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ModalNuevoCliente({ mostrarModalCliente, setMostrarModalCliente, nuevoCliente, setNuevoCliente, handleGuardarCliente }) {
  if (!mostrarModalCliente) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-white">Nuevo Cliente</h2>
          <button onClick={() => setMostrarModalCliente(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="space-y-4">
          <input type="text" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} placeholder="Nombre completo" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
          <input type="email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value.trim() })} placeholder="Correo electrónico (Acceso a la App)" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
          <input type="text" value={nuevoCliente.objetivo} onChange={(e) => setNuevoCliente({ ...nuevoCliente, objetivo: e.target.value })} placeholder="Objetivo (Ej. Hipertrofia)" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setMostrarModalCliente(false)} className="text-zinc-400 font-bold hover:text-white px-4 py-2">Cancelar</button>
          <button onClick={handleGuardarCliente} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">Crear y Enviar Correo</button>
        </div>
      </div>
    </div>
  );
}

export function ModalCoachboardLive({ modalLiveVisible, setModalLiveVisible, sessionLiveSeleccionada }) {
  if (!modalLiveVisible || !sessionLiveSeleccionada) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-3xl w-full max-w-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <h2 className="text-xl font-black text-white">Transmisión en Vivo</h2>
          </div>
          <button onClick={() => setModalLiveVisible(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4 shrink-0 flex justify-between items-center">
          <div>
            <p className="text-zinc-400 text-xs font-bold uppercase">Cliente Entrenando</p>
            <p className="text-white font-black text-lg">{sessionLiveSeleccionada.data.clienteNombre}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-xs font-bold uppercase">Rutina</p>
            <p className="text-emerald-400 font-black text-sm">{sessionLiveSeleccionada.data.rutinaNombre}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {sessionLiveSeleccionada.updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <span className="text-4xl mb-4">👀</span>
              <p className="text-white font-bold">Esperando movimientos...</p>
              <p className="text-zinc-400 text-sm">Los datos aparecerán aquí cuando el cliente escriba en la app.</p>
            </div>
          ) : (
            [...sessionLiveSeleccionada.updates].reverse().map((upd, idx) => {
              const getEstiloLive = (tipo, completado) => {
                if (!completado) return 'bg-zinc-900 border-zinc-700';
                switch (tipo) {
                  case 'Calentamiento': return 'bg-orange-500/10 border-orange-500/30';
                  case 'Drop Set':
                  case 'Dropset': return 'bg-purple-500/10 border-purple-500/30';
                  default: return 'bg-emerald-500/10 border-emerald-500/30';
                }
              };
              return (
                <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${getEstiloLive(upd.tipo_serie, upd.completado)}`}>
                  <div>
                    <p className="text-sm font-black text-white mb-1">{upd.ejercicio}</p>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Set {upd.set}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Peso</p>
                      <p className="text-blue-400 font-bold">{upd.peso ? `${upd.peso} kg` : '--'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Reps</p>
                      <p className="text-emerald-400 font-bold">{upd.reps ? upd.reps : '--'}</p>
                    </div>
                    {upd.completado && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/50">✓</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalCentroRendimiento({ mostrarModalHistorial, setMostrarModalHistorial, entrenamientosRecientes, rutinasDelCliente, abrirParaAnalizar, mostrarAlerta, cliente, usuarioActual, catalogoEjercicios }) {
  const [datosComparativa, setDatosComparativa] = useState([]);
  const [mes1, setMes1] = useState('');
  const [mes2, setMes2] = useState('');
  const [cargandoComparativa, setCargandoComparativa] = useState(false);
  const [ultimosPorDia, setUltimosPorDia] = useState([]);
  const [cargandoUltimos, setCargandoUltimos] = useState(false);
  const [historialMes, setHistorialMes] = useState([]);
  const [verHistorialMes, setVerHistorialMes] = useState(false);
  const [cargandoMes, setCargandoMes] = useState(false);

  useEffect(() => {
    const hoy = new Date();
    const m1 = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    hoy.setMonth(hoy.getMonth() - 1);
    const m2 = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    setMes1(m2);
    setMes2(m1);
  }, []);

  // Cargar últimos entrenamientos por día cuando se abre el modal
  useEffect(() => {
    if (mostrarModalHistorial && cliente && usuarioActual && rutinasDelCliente.length > 0) {
      cargarUltimosPorDia();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarModalHistorial, cliente]);

  const cargarUltimosPorDia = async () => {
    setCargandoUltimos(true);
    try {
      const token = await usuarioActual.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const allDias = [];
      for (const rutina of rutinasDelCliente) {
        const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/progreso/ultimos-por-dia/${cliente.id}/${rutina.id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          allDias.push(...data.map(d => ({ ...d, rutina_nombre: rutina.nombre, rutina_id: rutina.id })));
        }
      }
      setUltimosPorDia(allDias);
    } catch (e) { console.error("Error ultimos-por-dia", e); }
    setCargandoUltimos(false);
  };

  const cargarHistorialMes = async () => {
    setCargandoMes(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/progreso/historial-mes/${cliente.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHistorialMes(await res.json());
    } catch (e) { console.error("Error historial-mes", e); }
    setCargandoMes(false);
    setVerHistorialMes(true);
  };

  const cargarComparativa = async () => {
    if (!mes1 || !mes2 || !cliente || !usuarioActual) return;
    setCargandoComparativa(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/comparativa/${cliente.id}?mes1=${mes1}&mes2=${mes2}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDatosComparativa(await res.json());
    } catch (e) { console.error("Error comparativa", e); }
    setCargandoComparativa(false);
  };

  const getColorSerie = (tipo) => {
    switch (tipo) {
      case 'Calentamiento': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'Dropset': case 'Drop Set': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
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

  // Agrupar historial mensual por fecha
  const historialMesAgrupado = {};
  historialMes.forEach(r => {
    const fecha = new Date(r.dia_entrenamiento).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    if (!historialMesAgrupado[fecha]) historialMesAgrupado[fecha] = {};
    const ej = r.ejercicio_nombre || 'Ejercicio';
    if (!historialMesAgrupado[fecha][ej]) historialMesAgrupado[fecha][ej] = [];
    historialMesAgrupado[fecha][ej].push(r);
  });

  if (!mostrarModalHistorial) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-7xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-blue-500">🏆</span> Centro de Rendimiento
          </h2>
          <button onClick={() => { setMostrarModalHistorial(false); setVerHistorialMes(false); }} className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition text-lg flex items-center justify-center">✕</button>
        </div>

        {/* Vista: Historial Mensual Completo */}
        {verHistorialMes ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <button onClick={() => setVerHistorialMes(false)} className="text-zinc-400 hover:text-white text-sm font-bold flex items-center gap-1 transition">← Volver</button>
              <h3 className="text-lg font-black text-white">📅 Historial Completo (Último Mes)</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {Object.keys(historialMesAgrupado).length === 0 ? (
                <div className="text-center py-10 opacity-50"><p className="text-zinc-500">No hay datos en los últimos 30 días.</p></div>
              ) : Object.entries(historialMesAgrupado).map(([fecha, ejercicios]) => (
                <div key={fecha} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="font-bold text-white">{fecha}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {Object.entries(ejercicios).map(([nombreEj, series]) => (
                      <div key={nombreEj} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                        <p className="text-xs font-black text-blue-400 mb-2">{nombreEj}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {series.map((s, i) => (
                            <div key={i} className={`px-2 py-1.5 rounded-lg border text-xs ${getColorSerie(s.tipo_serie)}`}>
                              <span className="font-black">S{s.serie_numero}</span> · {s.peso_kg}kg × {s.repeticiones} {s.rir && <span className="opacity-60">RIR {s.rir}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Vista principal */
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
            <div className="lg:w-2/3 flex flex-col gap-6 h-full">

              {/* ÚLTIMOS ENTRENAMIENTOS POR DÍA */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner shrink-0 max-h-72 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">⏱️ Última Sesión por Día</h3>
                  <button onClick={cargarHistorialMes} disabled={cargandoMes} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                    {cargandoMes ? '...' : '📅 Ver Historial del Mes'}
                  </button>
                </div>

                {cargandoUltimos ? (
                  <div className="text-center py-6"><p className="text-zinc-500 animate-pulse font-bold">Cargando sesiones...</p></div>
                ) : ultimosPorDia.length === 0 ? (
                  <div className="text-center py-6 opacity-50">
                    <p className="text-zinc-500 text-sm">No hay entrenamientos registrados aún.</p>
                    <p className="text-zinc-600 text-xs mt-1">Los datos aparecerán cuando el cliente registre sesiones.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ultimosPorDia.map((dia, idx) => (
                      <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-md">{dia.dia_nombre}</span>
                            <span className="text-xs text-zinc-500">{dia.rutina_nombre}</span>
                          </div>
                          <span className="text-[10px] text-zinc-600 bg-zinc-950 px-2 py-1 rounded-md font-bold">
                            {new Date(dia.ultima_fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' })}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {dia.ejercicios.map((ej, eIdx) => (
                            <div key={eIdx} className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate flex-1">{ej.nombre}</span>
                              <div className="flex gap-1.5 ml-2">
                                {ej.series.map((s, sIdx) => (
                                  <span key={sIdx} className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${getColorSerie(s.tipo_serie)}`}>
                                    {s.peso_kg}×{s.repeticiones}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPARADOR */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-inner flex-1 flex flex-col min-h-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">⚖️ Comparativas</h3>
                    <p className="text-xs text-zinc-500">Volumen mensual por zona muscular.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                    <input type="month" value={mes1} onChange={(e) => setMes1(e.target.value)} className="bg-zinc-950 text-white text-xs px-2 py-1.5 rounded outline-none border border-zinc-700" />
                    <input type="month" value={mes2} onChange={(e) => setMes2(e.target.value)} className="bg-zinc-950 text-white text-xs px-2 py-1.5 rounded outline-none border border-zinc-700" />
                    <button onClick={cargarComparativa} disabled={cargandoComparativa} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition">
                      {cargandoComparativa ? '...' : 'Comparar'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-[200px]">
                  {datosComparativa.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                      <span className="text-3xl mb-2">📊</span>
                      <p className="text-xs font-bold text-zinc-400">Presiona Comparar para cargar datos</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosComparativa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="grupo_muscular" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltipBar />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                        <Bar name={`Mes ${mes1}`} dataKey="series_mes1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar name={`Mes ${mes2}`} dataKey="series_mes2" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: CALCULADORA FUNCIONAL */}
            <div className="lg:w-1/3 h-full">
              <CalculadoraFuncional cliente={cliente} usuarioActual={usuarioActual} catalogoEjercicios={catalogoEjercicios} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}