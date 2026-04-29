import { useState, useEffect } from 'react';

export default function EstacionProgreso({ cliente, rutina, onVolver, mostrarAlerta, vistaInicial, usuarioActual }) {
  const [ejerciciosProgreso, setEjerciciosProgreso] = useState([]);
  const [diasProgreso, setDiasProgreso] = useState([]);
  // Solo necesitamos el modo registro
  const [cargando, setCargando] = useState(true);

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
          // 1. SOLUCIÓN AL ORDEN: Forzamos ordenar del más nuevo al más viejo (DESC)
          const historialOrdenado = [...historialDelEjercicio].sort((a, b) =>
            new Date(b.fecha) - new Date(a.fecha)
          );

          // 2. Tomamos la fecha más reciente de forma segura
          fechaUltimaVez = historialOrdenado[0].fecha;

          // 3. SOLUCIÓN AL TIMESTAMP: Normalizamos la fecha a un string limpio (YYYY-MM-DD)
          // Así evitamos que los segundos o milisegundos rompan la comparación.
          const fechaLimpiaUltimaVez = new Date(fechaUltimaVez).toDateString();

          // 4. Filtramos asegurando que todas las series de ese MISMO DÍA se agrupen
          seriesUltimaVez = historialOrdenado.filter(h =>
            new Date(h.fecha).toDateString() === fechaLimpiaUltimaVez
          );
        }

        // Generación de los inputs (setsArray)
        let setsArray = [];
        if (seriesUltimaVez.length > 0) {
          setsArray = seriesUltimaVez.map((s, i) => ({
            serie_numero: i + 1, // Reseteamos el contador visualmente
            peso: '', reps: '', rir: '',
            tipo_serie: s.tipo_serie || 'Efectiva',
            // Aquí inyectamos los datos para los placeholders "Ant: X"
            peso_anterior: s.peso_kg || s.peso, // Dependiendo de cómo lo llame tu BD
            reps_anterior: s.repeticiones || s.reps,
            rir_anterior: s.rir || ''
          }));
        } else {
          // Si no hay historial, creamos inputs vacíos según el objetivo
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

  const getColorTipoSerie = (tipo) => {
    switch (tipo) {
      case 'Calentamiento': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Efectiva':
      case 'Normal': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'Dropset':
      case 'Drop Set': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
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
            <span className="text-emerald-400">
              📝 Anotar:
            </span> {rutina.nombre}
          </h2>
        </div>

        <button onClick={guardarProgresoHoy} className="bg-emerald-500 text-zinc-950 px-8 py-3 rounded-xl font-black text-lg hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20">
          💾 Guardar Sesión
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 overflow-hidden">

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col p-6 overflow-hidden h-full">
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
                      {(ej.tempo || ej.es_unilateral === 1 || ej.segundos_objetivo) && (
                        <div className="flex gap-2 mt-2">
                          {ej.tempo && <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-bold border border-zinc-700">⏱️ Tempo: {ej.tempo}</span>}
                          {ej.es_unilateral === 1 && <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-500/20">Unilateral</span>}
                          {ej.segundos_objetivo && <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-500/20">⏳ {ej.segundos_objetivo} segs</span>}
                        </div>
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
                    onChange={(e) => setNotasSesion({ ...notasSesion, [ej.ejercicio_id]: e.target.value })}
                    className="w-full mt-2 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2.5 focus:border-blue-500 outline-none placeholder-zinc-600 transition"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}