import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CalculadoraFuncional({ cliente, usuarioActual, catalogoEjercicios }) {
  const [tabActiva, setTabActiva] = useState('1rm');
  
  // Modulo 1RM
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [prActual, setPrActual] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const ejerciciosFiltrados = catalogoEjercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // Modulo Volumen
  const [datosVolumen, setDatosVolumen] = useState([]);
  
  // Modulo Wilks
  const [pesoCorporal, setPesoCorporal] = useState('');
  const [totalLevantado, setTotalLevantado] = useState('');
  const [genero, setGenero] = useState('M'); // M o F
  const [puntosWilks, setPuntosWilks] = useState(0);

  // Efecto para jalar PR
  useEffect(() => {
    if (ejercicioSeleccionado && cliente && usuarioActual) {
      const fetchPR = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/pr/${cliente.id}/${ejercicioSeleccionado}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPrActual(data.pr);
          }
        } catch (e) { console.error("Error PR", e); }
      };
      fetchPR();
    }
  }, [ejercicioSeleccionado, cliente, usuarioActual]);

  // Efecto para Volumen
  useEffect(() => {
    if (tabActiva === 'volumen' && cliente && usuarioActual && datosVolumen.length === 0) {
      const fetchVolumen = async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/volumen-carga-total/${cliente.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDatosVolumen(data);
          }
        } catch (e) { console.error("Error Volumen", e); }
      };
      fetchVolumen();
    }
  }, [tabActiva, cliente, usuarioActual, datosVolumen.length]);

  // Efecto para Wilks
  useEffect(() => {
    const pc = parseFloat(pesoCorporal);
    const tl = parseFloat(totalLevantado);
    if (pc > 0 && tl > 0) {
      // Coeficientes Wilks
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
    } else {
      setPuntosWilks(0);
    }
  }, [pesoCorporal, totalLevantado, genero]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-inner flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6 shrink-0">
         <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-xl">🧮</span></div>
         <h2 className="text-xl font-black text-white">Calculadora Funcional</h2>
      </div>

      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-6 shrink-0">
        <button onClick={() => setTabActiva('1rm')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tabActiva === '1rm' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>1RM y PR</button>
        <button onClick={() => setTabActiva('volumen')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tabActiva === 'volumen' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Volumen Total</button>
        <button onClick={() => setTabActiva('wilks')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tabActiva === 'wilks' ? 'bg-amber-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Pts Wilks</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
        {tabActiva === '1rm' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
            <p className="text-sm text-zinc-400 mb-4">Selecciona un ejercicio para obtener el Récord Personal (PR) de los últimos 30 días automáticamente.</p>
            
            <input 
              type="text" placeholder="Buscar ejercicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition"
            />
            <select 
              value={ejercicioSeleccionado} onChange={e => setEjercicioSeleccionado(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value="">-- Selecciona un Ejercicio --</option>
              {ejerciciosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>

            {ejercicioSeleccionado && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-center mt-6">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Mejor PR (Últimos 30 días)</p>
                <p className="text-5xl font-black text-white">
                  {prActual > 0 ? prActual : '--'}<span className="text-xl text-blue-500 ml-1">kg</span>
                </p>
                {prActual > 0 && <p className="text-xs text-zinc-400 mt-2">Extraído de la base de datos automáticamente.</p>}
              </div>
            )}
          </div>
        )}

        {tabActiva === 'volumen' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full min-h-[300px]">
             <p className="text-sm text-zinc-400 mb-4 shrink-0">Sumatoria de (Peso × Reps) por sesión. Identifica si el volumen está subiendo o si hay sobreentrenamiento.</p>
             {datosVolumen.length === 0 ? (
               <div className="flex-1 flex items-center justify-center"><p className="text-zinc-600 font-bold">Sin datos suficientes de sesiones anteriores.</p></div>
             ) : (
               <div className="flex-1 w-full h-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={datosVolumen} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                     <XAxis dataKey="fecha_corta" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                     <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} 
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                     />
                     <Bar dataKey="volumen_total" name="Volumen (kg)" fill="#10b981" radius={[4, 4, 0, 0]}>
                       {datosVolumen.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === datosVolumen.length - 1 ? '#34d399' : '#10b981'} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             )}
          </div>
        )}

        {tabActiva === 'wilks' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
             <p className="text-sm text-zinc-400 mb-4">Calcula la fuerza relativa al peso corporal de acuerdo a la fórmula Wilks (Powerlifting).</p>
             
             <div className="flex gap-4">
               <label className="flex-1 cursor-pointer">
                 <div className={`border rounded-xl p-3 text-center transition ${genero === 'M' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`} onClick={() => setGenero('M')}>
                   <span className="font-bold text-sm">Masculino</span>
                 </div>
               </label>
               <label className="flex-1 cursor-pointer">
                 <div className={`border rounded-xl p-3 text-center transition ${genero === 'F' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`} onClick={() => setGenero('F')}>
                   <span className="font-bold text-sm">Femenino</span>
                 </div>
               </label>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-4">
               <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Peso Corporal</label>
                 <input type="number" value={pesoCorporal} onChange={e => setPesoCorporal(e.target.value)} placeholder="Ej. 80" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Total Levantado</label>
                 <input type="number" value={totalLevantado} onChange={e => setTotalLevantado(e.target.value)} placeholder="Ej. 500" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition" />
               </div>
             </div>

             <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6 text-center mt-6">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Puntos Wilks</p>
                <p className="text-5xl font-black text-white">
                  {puntosWilks > 0 ? puntosWilks.toFixed(2) : '0.00'}
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
