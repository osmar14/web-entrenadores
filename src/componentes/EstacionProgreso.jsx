import { useState, useEffect } from 'react';

export default function EstacionProgreso({ cliente, rutina, onVolver, mostrarAlerta, vistaInicial, usuarioActual }) {
  const [ejerciciosProgreso, setEjerciciosProgreso] = useState([]);
  const [diasProgreso, setDiasProgreso] = useState([]);
  const [diaProgresoActivo, setDiaProgresoActivo] = useState('');
  const [diaHistorialActivo, setDiaHistorialActivo] = useState('');
  const [historialCliente, setHistorialCliente] = useState([]);
  
  const [notasSesion, setNotasSesion] = useState({});

  const [vistaProgreso, setVistaProgreso] = useState(vistaInicial || 'registro'); 
  const [tabAnalisis, setTabAnalisis] = useState('historial'); 
  const [cargando, setCargando] = useState(true);

  // 🌟 NUEVO ESTADO: Para los días del historial (incluyendo los 'Extras')
  const [diasHistorialDisponibles, setDiasHistorialDisponibles] = useState([]);

  useEffect(() => {
    if (vistaInicial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVistaProgreso(vistaInicial);
      if (vistaInicial === 'analisis') {
        setTabAnalisis('historial'); 
      }
    }
  }, [vistaInicial]);

  const cargarDatosProgreso = async () => {
    try {
      const user = usuarioActual;
      if (!user) return;
      const token = await user.getIdToken();
      const headersSeguros = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      const resEjercicios = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios/${rutina.id}`, { headers: headersSeguros });
      const datosEjercicios = resEjercicios.ok ? await resEjercicios.json() : [];

      const resHistorial = await fetch(`https://backend-entrenadores-production.up.railway.app/api/progreso/${cliente.id}/${rutina.id}`, { headers: headersSeguros });
      const datosHistorial = resHistorial.ok ? await resHistorial.json() : [];
      setHistorialCliente(Array.isArray(datosHistorial) ? datosHistorial : []);

      const ejerciciosValidos = Array.isArray(datosEjercicios) ? datosEjercicios : [];
      const historialValido = Array.isArray(datosHistorial) ? datosHistorial : [];

      const ejerciciosConSeries = ejerciciosValidos.map((ej, idx) => {
        const historialDelEjercicio = historialValido.filter(h => h.ejercicio_id === ej.ejercicio_id);
        let fechaUltimaVez = null;
        let seriesUltimaVez = [];

        if (historialDelEjercicio.length > 0) {
          fechaUltimaVez = historialDelEjercicio[0].fecha;
          seriesUltimaVez = historialDelEjercicio.filter(h => h.fecha === fechaUltimaVez);
        }

        let setsArray = [];
        if (seriesUltimaVez.length > 0) {
          setsArray = seriesUltimaVez.map((s, i) => ({
            serie_numero: i + 1,
            peso: '', reps: '', rir: '',
            tipo_serie: s.tipo_serie || 'Efectiva',
            peso_anterior: s.peso_kg, reps_anterior: s.repeticiones, rir_anterior: s.rir || ''
          }));
        } else {
          const numeroSeries = parseInt(ej.series_objetivo) || 1; 
          setsArray = Array.from({ length: numeroSeries }, (_, i) => ({
            serie_numero: i + 1,
            peso: '', reps: '', rir: '',
            tipo_serie: 'Efectiva',
            peso_anterior: '', reps_anterior: '', rir_anterior: ''
          }));
        }

        const fechaTexto = fechaUltimaVez 
          ? new Date(fechaUltimaVez).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
          : "Nunca";

        return { ...ej, ui_id: `track_${idx}_${ej.id}`, sets: setsArray, fecha_ultima_vez: fechaTexto };
      });

      setEjerciciosProgreso(ejerciciosConSeries);
      const diasUnicos = [...new Set(ejerciciosConSeries.map(e => e.dia_nombre))];
      setDiasProgreso(diasUnicos);
      
      setDiaProgresoActivo(diasUnicos[0] || '');
      setDiaHistorialActivo(diasUnicos[0] || '');
      setCargando(false);
    } catch (error) { 
      console.error(error);
      mostrarAlerta("Error al cargar datos", "error"); 
      setCargando(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatosProgreso();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarSerie = (ui_id, serieIndex, campo, valor) => {
    setEjerciciosProgreso(ejerciciosProgreso.map(ej => {
      if (ej.ui_id !== ui_id) return ej;
      const nuevosSets = [...ej.sets];
      nuevosSets[serieIndex] = { ...nuevosSets[serieIndex], [campo]: valor };
      return { ...ej, sets: nuevosSets };
    }));
  };

  const agregarSerieExtra = (ui_id) => {
    setEjerciciosProgreso(ejerciciosProgreso.map(ej => {
      if (ej.ui_id !== ui_id) return ej;
      return { ...ej, sets: [...ej.sets, { serie_numero: ej.sets.length + 1, peso: '', reps: '', rir: '', tipo_serie: 'Efectiva', peso_anterior: '', reps_anterior: '', rir_anterior: '' }] };
    }));
  };

  const eliminarSerieEspecifica = (ui_id, serieIndex) => {
    setEjerciciosProgreso(ejerciciosProgreso.map(ej => {
      if (ej.ui_id !== ui_id) return ej;
      const nuevosSets = ej.sets.filter((_, i) => i !== serieIndex).map((s, i) => ({ ...s, serie_numero: i + 1 })); 
      return { ...ej, sets: nuevosSets };
    }));
  };

  const guardarProgresoHoy = async () => {
    if (!usuarioActual) return mostrarAlerta("Error de sesión", "error");

    const ejerciciosDelDia = ejerciciosProgreso.filter(e => e.dia_nombre === diaProgresoActivo);
    const registrosAEnviar = [];
    
    ejerciciosDelDia.forEach(ej => {
      ej.sets.forEach((set, setIndex) => {
        if (set.peso !== '' || set.reps !== '') {
          registrosAEnviar.push({
            ejercicio_id: ej.ejercicio_id, 
            serie_numero: set.serie_numero,
            peso: set.peso === '' ? 0 : parseFloat(set.peso), 
            reps: parseInt(set.reps) || 0, 
            rir: set.rir || null,
            tipo_serie: set.tipo_serie,
            notas_cliente: setIndex === 0 ? (notasSesion[ej.ejercicio_id] || '') : ''
          });
        }
      });
    });

    if (registrosAEnviar.length === 0) return mostrarAlerta("No anotaste ningún dato nuevo (Llena peso o reps)", "error");

    mostrarAlerta("Guardando datos...", "exito"); 

    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/progreso', {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cliente_id: cliente.id, rutina_id: rutina.id, registros: registrosAEnviar })
      });

      if (res.ok) {
        mostrarAlerta(`¡Entrenamiento guardado y volumen actualizado! 📈`, "exito");
        setNotasSesion({}); 
        cargarDatosProgreso(); 
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al guardar progreso", "error");
      }
    } catch (e) { 
      mostrarAlerta("Error de conexión al guardar", "error"); 
      console.error(e);
    }
  };

  // 🌟 CORRECCIÓN DEL SESGO DE PLANTILLA 🌟
  const historialEnriquecido = historialCliente.map(registro => {
    // 1. Buscamos si el ejercicio está en la plantilla
    const ejInfo = ejerciciosProgreso.find(e => e.ejercicio_id === registro.ejercicio_id);
    
    // 2. Si está en la plantilla, le asignamos su día. 
    // Si NO está (fue agregado manual por el cliente), revisamos si el registro de la BD trae un 'dia_nombre'.
    // Si la BD no lo trae, lo clasificamos como 'Extras del Cliente' para no perderlo.
    const diaAsignado = ejInfo 
        ? ejInfo.dia_nombre 
        : (registro.dia_nombre || 'Extras del Cliente');

    return {
      ...registro,
      dia_nombre: diaAsignado
    };
  });

  // 🌟 CALCULAMOS LOS DÍAS DISPONIBLES EN EL HISTORIAL (Para mostrar el botón de "Extras")
  useEffect(() => {
    if (historialEnriquecido.length > 0) {
        const diasUnicosHistorial = [...new Set(historialEnriquecido.map(h => h.dia_nombre))];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDiasHistorialDisponibles(diasUnicosHistorial);
    } else {
        setDiasHistorialDisponibles(diasProgreso);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historialCliente, ejerciciosProgreso]); // Se recalcula si cambian los datos de la BD o la plantilla


  const historialDelDiaActivo = historialEnriquecido.filter(h => h.dia_nombre === diaHistorialActivo);

  const historialPorFecha = {};
  historialDelDiaActivo.forEach(registro => {
    const fechaLimpia = new Date(registro.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!historialPorFecha[fechaLimpia]) historialPorFecha[fechaLimpia] = [];
    historialPorFecha[fechaLimpia].push(registro);
  });
  
  const fechasOrdenadas = [...new Set(historialDelDiaActivo.map(r => new Date(r.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })))];

  const getColorTipoSerie = (tipo) => {
    switch(tipo) {
      case 'Calentamiento': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Efectiva': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'Dropset': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700'; 
    }
  };

  const getEstiloCajaHistorial = (tipo) => {
    switch(tipo) {
      case 'Calentamiento': return { bg: 'bg-orange-500/10 border-orange-500/30', badge: 'text-orange-400' };
      case 'Efectiva': return { bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'text-emerald-400' };
      case 'Dropset': return { bg: 'bg-purple-500/10 border-purple-500/30', badge: 'text-purple-400' };
      default: return { bg: 'bg-zinc-950 border-zinc-800', badge: 'text-zinc-500' }; 
    }
  };

  if (cargando) return <div className="text-center p-20 text-emerald-400 font-bold">Cargando estación de progreso...</div>;

  const ejerciciosVisibles = ejerciciosProgreso.filter(e => e.dia_nombre === diaProgresoActivo);

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-right-8 duration-300 h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <button onClick={onVolver} className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 mb-4 transition-colors border border-zinc-700 shadow-sm w-fit">&larr; Volver al perfil</button>
          
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <span className={vistaProgreso === 'registro' ? "text-emerald-400" : "text-blue-400"}>
              {vistaProgreso === 'registro' ? '📝 Anotar:' : '📊 Análisis:'}
            </span> {rutina.nombre}
          </h2>
        </div>
        
        {vistaProgreso === 'registro' ? (
          <button onClick={guardarProgresoHoy} className="bg-emerald-500 text-zinc-950 px-8 py-3 rounded-xl font-black text-lg hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20">
            💾 Guardar Sesión
          </button>
        ) : (
          <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl shadow-inner">
            <button onClick={() => setTabAnalisis('historial')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${tabAnalisis === 'historial' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>🗓️ Historial</button>
            <button onClick={() => setTabAnalisis('graficas')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${tabAnalisis === 'graficas' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>📈 Gráficas</button>
          </div>
        )}
      </div>

      {vistaProgreso === 'registro' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          
          <div className="lg:col-span-8 xl:col-span-9 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col p-6 overflow-hidden">
             <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4 overflow-x-auto scrollbar-hide shrink-0">
                {diasProgreso.map(dia => (
                  <button key={dia} onClick={() => setDiaProgresoActivo(dia)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${diaProgresoActivo === dia ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-800/50'}`}>
                    {dia}
                  </button>
                ))}
             </div>

             <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
               {ejerciciosVisibles.map((ej, index) => (
                 <div key={ej.ui_id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg shrink-0">
                   <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="flex gap-3 items-center">
                       <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black shrink-0">{index + 1}</div>
                       <div>
                         <p className="font-black text-white text-lg">{ej.nombre}</p>
                         <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Objetivo: {ej.series_objetivo} x {ej.reps_objetivo} {ej.rir_objetivo ? `(RIR ${ej.rir_objetivo})` : ''}</p>
                         {ej.notas_entrenador && (
                           <p className="text-[10px] text-emerald-400 italic mt-1 bg-emerald-500/10 px-2 py-1 rounded-md inline-block border border-emerald-500/20">👨‍🏫 {ej.notas_entrenador}</p>
                         )}
                       </div>
                     </div>
                     <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 shadow-inner">
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><span>⏱️</span> Última sesión: <span className="text-blue-400 normal-case">{ej.fecha_ultima_vez}</span></p>
                     </div>
                   </div>

                   <div className="p-4 flex flex-col gap-3">
                      <div className="flex text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 items-center">
                         <div className="w-12 text-center">Set</div><div className="w-28 text-center">Tipo</div><div className="flex-1 text-center text-blue-400">Peso (Kg)</div><div className="flex-1 text-center text-emerald-400">Reps</div><div className="w-20 text-center text-emerald-600">RIR</div><div className="w-8"></div>
                      </div>

                      {ej.sets.map((set, s_idx) => (
                        <div key={s_idx} className="flex gap-2 lg:gap-3 items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition shrink-0">
                           <div className="w-12 font-black text-zinc-400 text-center">{set.serie_numero}</div>
                           <div className="w-28">
                             <select value={set.tipo_serie} onChange={(e) => actualizarSerie(ej.ui_id, s_idx, 'tipo_serie', e.target.value)} className={`w-full text-xs font-bold rounded-lg py-2 px-1 text-center appearance-none cursor-pointer outline-none border transition ${getColorTipoSerie(set.tipo_serie)}`}>
                               <option value="Efectiva" className="bg-zinc-900 text-emerald-400">Efectiva</option>
                               <option value="Calentamiento" className="bg-zinc-900 text-orange-400">Calent.</option>
                               <option value="Dropset" className="bg-zinc-900 text-purple-400">Dropset</option>
                             </select>
                           </div>
                           <div className="flex-1">
                             <input type="number" placeholder={set.peso_anterior ? `Ant: ${set.peso_anterior}` : "Ej. 0"} value={set.peso} onChange={(e) => actualizarSerie(ej.ui_id, s_idx, 'peso', e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-2 text-sm focus:border-blue-500 focus:outline-none transition placeholder:text-zinc-600 placeholder:italic" />
                           </div>
                           <div className="flex-1">
                             <input type="number" placeholder={set.reps_anterior ? `Ant: ${set.reps_anterior}` : "Reps"} value={set.reps} onChange={(e) => actualizarSerie(ej.ui_id, s_idx, 'reps', e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-2 text-sm focus:border-emerald-500 focus:outline-none transition placeholder:text-zinc-600 placeholder:italic" />
                           </div>
                           <div className="w-20">
                             <input type="number" placeholder={set.rir_anterior ? `Ant: ${set.rir_anterior}` : "RIR"} value={set.rir} onChange={(e) => actualizarSerie(ej.ui_id, s_idx, 'rir', e.target.value)} className="w-full bg-zinc-950 border border-emerald-900 text-emerald-400 text-center rounded-lg py-2 text-sm focus:border-emerald-500 focus:outline-none transition placeholder:text-zinc-700 placeholder:italic" />
                           </div>
                           <button onClick={() => eliminarSerieEspecifica(ej.ui_id, s_idx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition">✕</button>
                        </div>
                      ))}
                      <button onClick={() => agregarSerieExtra(ej.ui_id)} className="mt-2 py-2 w-full border-2 border-dashed border-zinc-800 text-zinc-500 text-xs font-bold rounded-xl hover:border-zinc-600 hover:text-zinc-300 transition flex items-center justify-center gap-2"><span>➕</span> Añadir serie</button>
                      
                      <input 
                        type="text" 
                        placeholder="📝 ¿Alguna molestia o nota de la sesión para este ejercicio?" 
                        value={notasSesion[ej.ejercicio_id] || ''} 
                        onChange={(e) => setNotasSesion({...notasSesion, [ej.ejercicio_id]: e.target.value})} 
                        className="w-full mt-2 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2.5 focus:border-blue-500 outline-none placeholder-zinc-600 transition" 
                      />
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 shrink-0">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col p-6 shadow-lg text-center justify-center items-center relative overflow-hidden h-fit">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner text-blue-400 relative z-10">📈</div>
              <h3 className="text-xl font-black text-white mb-2 relative z-10">Análisis y Gráficas</h3>
              <p className="text-zinc-500 text-xs mb-6 leading-relaxed relative z-10 px-2">Revisa el historial detallado de {cliente.nombre} y la evolución de su fuerza.</p>
              <button onClick={() => { setVistaProgreso('analisis'); setTabAnalisis('historial'); }} className="w-full bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 relative z-10 shadow-sm">
                <span>📊</span> Ver Historial
              </button>
            </div>
          </div>

        </div>
      )}

      {vistaProgreso === 'analisis' && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl flex-1 overflow-hidden flex flex-col shadow-xl">
           {tabAnalisis === 'historial' && (
             <div className="flex flex-col h-full">
               <div className="px-8 pt-6 border-b border-zinc-800 pb-4 shrink-0">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Filtrar historial por entrenamiento:</p>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                     {/* 🌟 USAMOS LA NUEVA LISTA DE DÍAS (INCLUYE "EXTRAS") */}
                     {diasHistorialDisponibles.map(dia => (
                       <button key={dia} onClick={() => setDiaHistorialActivo(dia)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${diaHistorialActivo === dia ? (dia === 'Extras del Cliente' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20') : 'text-zinc-500 hover:bg-zinc-800/50'}`}>
                         {dia === 'Extras del Cliente' ? '🌟 Extras del Cliente' : dia}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-zinc-950/30">
                 {fechasOrdenadas.length === 0 ? (
                   <div className="text-center py-20"><p className="text-6xl mb-6">👻</p><h3 className="text-2xl font-black text-white mb-2">Aún no hay datos para {diaHistorialActivo}</h3><p className="text-zinc-400">Registra entrenamientos en este día para ver su evolución.</p></div>
                 ) : (
                   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                     {fechasOrdenadas.map(fecha => (
                       <div key={fecha} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg h-fit">
                         <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                           <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div><h4 className="font-bold text-white text-lg tracking-wide">{fecha}</h4></div>
                           <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-800 px-2 py-1 rounded-md">{diaHistorialActivo}</span>
                         </div>
                         
                         <div className="p-5 space-y-5">
                           {(() => {
                              const registrosDeEstaFecha = historialDelDiaActivo.filter(r => new Date(r.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) === fecha);
                              
                              const ejerAgrupados = {};
                              registrosDeEstaFecha.forEach(r => {
                                if(!ejerAgrupados[r.ejercicio_nombre]) ejerAgrupados[r.ejercicio_nombre] = [];
                                ejerAgrupados[r.ejercicio_nombre].push(r);
                              });

                              return Object.keys(ejerAgrupados).map(nombreEj => {
                                const notaDelCliente = ejerAgrupados[nombreEj].find(set => set.notas_cliente)?.notas_cliente;

                                return (
                                  <div key={nombreEj} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <p className="text-sm font-black text-blue-400 mb-3 line-clamp-1">{nombreEj}</p>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                       {ejerAgrupados[nombreEj].map(set => {
                                          const estilo = getEstiloCajaHistorial(set.tipo_serie);
                                          return (
                                            <div key={set.serie_numero} className={`px-3 py-2 rounded-lg border flex flex-col transition-colors ${estilo.bg}`}>
                                              <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${estilo.badge}`}>
                                                Set {set.serie_numero} {set.tipo_serie && set.tipo_serie !== 'Efectiva' ? `• ${set.tipo_serie}` : ''}
                                              </span>
                                              <span className="text-white font-medium text-sm flex items-center gap-1">
                                                {set.peso_kg} kg <span className="text-zinc-500 text-[10px] mx-1">x</span> {set.repeticiones}
                                                {set.rir && <span className="text-emerald-500 text-[10px] ml-auto border border-emerald-500/30 px-1 rounded">RIR {set.rir}</span>}
                                              </span>
                                            </div>
                                          );
                                       })}
                                    </div>

                                    {notaDelCliente && (
                                      <div className="mt-2 bg-zinc-950/50 border-l-2 border-emerald-500 p-2 rounded-r-lg">
                                        <p className="text-[10px] text-zinc-400 italic">"{notaDelCliente}"</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                           })()}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}

           {tabAnalisis === 'graficas' && (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/30">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner text-emerald-400">📈</div>
                <h3 className="text-3xl font-black text-white mb-4">Lienzo de Gráficas</h3>
                <p className="text-zinc-400 max-w-lg mb-8 leading-relaxed">
                  Pronto conectaremos la librería de Recharts aquí. Podrás ver visualmente cómo la fuerza y el volumen de tu cliente despegan hacia la luna. 🚀
                </p>
                <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 h-64 flex items-end justify-between gap-4 opacity-40 grayscale">
                  {[30, 40, 35, 50, 45, 60, 80, 70, 90, 100].map((h, i) => (
                    <div key={i} className="w-full bg-emerald-500/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}