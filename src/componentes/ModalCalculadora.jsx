import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function ModalCalculadora({ mostrarModalCalculadora, setMostrarModalCalculadora, cliente, usuarioActual, catalogoEjercicios }) {
  const [tabActiva, setTabActiva] = useState('1rm');
  
  // Modulo 1RM
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [prActual, setPrActual] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const ejerciciosFiltrados = catalogoEjercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // Modulo Wilks
  const [pesoCorporal, setPesoCorporal] = useState('');
  const [totalLevantado, setTotalLevantado] = useState('');
  const [genero, setGenero] = useState('M');
  const [puntosWilks, setPuntosWilks] = useState(0);

  // Seleccionar automáticamente el primer ejercicio filtrado
  useEffect(() => {
    if (busqueda && ejerciciosFiltrados.length > 0) {
      setEjercicioSeleccionado(ejerciciosFiltrados[0].id);
    }
  }, [busqueda]);

  // Efecto para PR
  useEffect(() => {
    if (ejercicioSeleccionado && cliente && usuarioActual) {
      const fetchData = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const headers = { 'Authorization': `Bearer ${token}` };
          const resPR = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/pr/${cliente.id}/${ejercicioSeleccionado}`, { headers });
          if (resPR.ok) { const d = await resPR.json(); setPrActual(d.pr); }
        } catch (e) { console.error("Error PR", e); }
      };
      fetchData();
    }
  }, [ejercicioSeleccionado, cliente, usuarioActual]);

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

  const tabs = [
    { id: '1rm', label: '📈 Porcentajes 1RM', color: 'bg-blue-600' },
    { id: 'wilks', label: '⚡ Wilks', color: 'bg-amber-500' },
  ];

  if (!mostrarModalCalculadora) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-xl">🧮</span></div>
             <h2 className="text-2xl font-black text-white">Calculadora</h2>
          </div>
          <button onClick={() => setMostrarModalCalculadora(false)} className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition text-lg flex items-center justify-center">✕</button>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-6 shrink-0 gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTabActiva(t.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tabActiva === t.id ? `${t.color} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>{t.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
          {tabActiva === '1rm' && (
            <div className="animate-in fade-in duration-200 space-y-4">
              <p className="text-sm text-zinc-400">Busca un ejercicio para ver su PR y los porcentajes de carga sugeridos para entrenar.</p>
              <div className="relative">
                <input type="text" placeholder="Buscar ejercicio (ej. Sentadilla)..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition shadow-inner" />
              </div>
              <select value={ejercicioSeleccionado} onChange={e => setEjercicioSeleccionado(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition cursor-pointer">
                <option value="">-- Selecciona --</option>
                {ejerciciosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>

              {ejercicioSeleccionado && (
                <>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5 text-center mt-4">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Mejor PR Registrado</p>
                    <p className="text-5xl font-black text-white">
                      {prActual > 0 ? prActual : '--'}<span className="text-xl text-blue-500 ml-1">kg</span>
                    </p>
                  </div>
                  
                  {prActual > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-4">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-3">🎯 Zonas de Entrenamiento (Porcentajes de {prActual}kg)</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50].map(perc => (
                          <div key={perc} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 flex justify-between items-center hover:border-blue-500/50 transition">
                            <span className="text-xs font-bold text-zinc-500">{perc}%</span>
                            <span className="text-sm font-black text-white">{(prActual * (perc / 100)).toFixed(1)} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tabActiva === 'wilks' && (
            <div className="animate-in fade-in duration-200 space-y-4">
               <p className="text-sm text-zinc-400 mb-6">Mide la fuerza relativa al peso corporal con la fórmula Wilks.</p>
               <div className="flex gap-4 mb-4">
                 <div className={`flex-1 border rounded-xl p-3 text-center cursor-pointer transition ${genero === 'M' ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`} onClick={() => setGenero('M')}>
                   <span className="font-bold text-sm">Masculino</span>
                 </div>
                 <div className={`flex-1 border rounded-xl p-3 text-center cursor-pointer transition ${genero === 'F' ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`} onClick={() => setGenero('F')}>
                   <span className="font-bold text-sm">Femenino</span>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Peso Corporal</label>
                   <div className="relative">
                     <input type="number" value={pesoCorporal} onChange={e => setPesoCorporal(e.target.value)} placeholder="80" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition text-lg font-bold" />
                     <span className="absolute right-4 top-3 text-zinc-500 font-bold">kg</span>
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Total Levantado</label>
                   <div className="relative">
                     <input type="number" value={totalLevantado} onChange={e => setTotalLevantado(e.target.value)} placeholder="500" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition text-lg font-bold" />
                     <span className="absolute right-4 top-3 text-zinc-500 font-bold">kg</span>
                   </div>
                 </div>
               </div>
               <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 text-center mt-6">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Puntos Wilks Obtenidos</p>
                  <p className="text-6xl font-black text-white">{puntosWilks > 0 ? puntosWilks.toFixed(1) : '0.0'}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
