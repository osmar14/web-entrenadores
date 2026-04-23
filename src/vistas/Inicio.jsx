import { useState, useEffect } from 'react';

export default function Inicio({ totalClientes, totalRutinas, usuarioActual, listaClientes, cargarDatos }) {
  const [datosDashboard, setDatosDashboard] = useState({ notasRecientes: [], actividadReciente: [] });
  const [cargando, setCargando] = useState(true);

  // Lógica de Agenda
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const diaActual = new Date().getDay(); 
  const indexHoy = diaActual === 0 ? 6 : diaActual - 1; 
  const [diaSeleccionado, setDiaSeleccionado] = useState(indexHoy);
  
  // Modal de Agenda
  const [mostrarModalAgenda, setMostrarModalAgenda] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [diasEditando, setDiasEditando] = useState([]);

  useEffect(() => {
    if (!usuarioActual) return;
    const cargarDashboard = async () => {
      try {
        const token = await usuarioActual.getIdToken();
        const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/dashboard', {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setDatosDashboard(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarDashboard();
  }, [usuarioActual]);

  const getEstiloNota = (categoria) => {
    switch(categoria) {
      case 'Salud/Lesión': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🏥' };
      case 'Nutrición': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '🍏' };
      case 'Motivación': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '🧠' };
      default: return { color: 'text-zinc-300', bg: 'bg-zinc-800', border: 'border-zinc-700', icon: '📝' }; 
    }
  };

  const abrirEditorAgenda = (cliente) => {
    setClienteEditando(cliente);
    // Convertir el string 'L,X,V' en un array ['L', 'X', 'V']
    const diasArray = cliente.dias_entrenamiento ? cliente.dias_entrenamiento.split(',') : [];
    setDiasEditando(diasArray);
    setMostrarModalAgenda(true);
  };

  const toggleDia = (diaLetra) => {
    if (diasEditando.includes(diaLetra)) {
      setDiasEditando(diasEditando.filter(d => d !== diaLetra));
    } else {
      setDiasEditando([...diasEditando, diaLetra]);
    }
  };

  const guardarAgenda = async () => {
    if (!clienteEditando) return;
    try {
      const token = await usuarioActual.getIdToken();
      const diasString = diasEditando.join(','); // Lo volvemos a hacer texto para la BD
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/clientes/${clienteEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ dias_entrenamiento: diasString })
      });
      if (res.ok) {
        setMostrarModalAgenda(false);
        setClienteEditando(null);
        cargarDatos(); // Refrescamos la lista de clientes general
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtramos a los clientes que entrenan el día que elegimos en las pestañas
  const clientesDelDia = listaClientes.filter(c => {
    if (!c.dias_entrenamiento) return false;
    const diasArray = c.dias_entrenamiento.split(',');
    return diasArray.includes(diasSemana[diaSeleccionado]);
  });

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-full">
      
      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center justify-between group cursor-default hover:border-emerald-500/30 transition-colors">
          <div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Clientes Activos</p>
            <h3 className="text-4xl font-black text-white">{totalClientes}</h3>
          </div>
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">👥</div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center justify-between group cursor-default hover:border-blue-500/30 transition-colors">
          <div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Rutinas Maestras</p>
            <h3 className="text-4xl font-black text-white">{totalRutinas}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">📋</div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center justify-between group cursor-default hover:border-purple-500/30 transition-colors">
          <div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Expedientes</p>
            <h3 className="text-4xl font-black text-white">{datosDashboard.notasRecientes.length}</h3>
          </div>
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">📂</div>
        </div>
      </div>

      {/* DISEÑO BENTO BOX: Izquierda (Agenda) - Derecha (Radar + Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 pb-8">
        
        {/* 🌟 COLUMNA IZQUIERDA (AGENDA - OCUPA 7/12) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
          
          <div className="flex justify-between items-center mb-6 shrink-0 mt-2">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><span>📅</span> Agenda Semanal</h3>
            <button onClick={() => setMostrarModalAgenda(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700">
              ⚙️ Gestionar Agenda
            </button>
          </div>
          
          <div className="flex justify-between items-center mb-6 shrink-0 bg-zinc-950 p-2 rounded-2xl border border-zinc-800 shadow-inner">
            {diasSemana.map((dia, idx) => (
              <button 
                key={idx} 
                onClick={() => setDiaSeleccionado(idx)}
                className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all ${idx === diaSeleccionado ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 scale-105' : 'text-zinc-500 hover:text-zinc-300 font-bold hover:bg-zinc-900'}`}
              >
                <span className="text-sm">{dia}</span>
                {idx === indexHoy && idx !== diaSeleccionado && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1"></div>}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-4 overflow-y-auto custom-scrollbar">
            <h4 className="text-zinc-400 font-bold text-sm uppercase tracking-widest mb-4">Entrenamientos para el {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][diaSeleccionado]}:</h4>
            
            {clientesDelDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-40 opacity-60">
                <span className="text-4xl mb-3">☕</span>
                <p className="text-sm font-bold text-zinc-400">Día libre</p>
                <p className="text-xs text-zinc-500">No hay clientes programados para hoy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientesDelDia.map(cliente => (
                  <div key={cliente.id} className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex items-center gap-4 hover:border-emerald-500/50 transition cursor-default shadow-lg">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xl font-black shrink-0 border border-emerald-500/20">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{cliente.nombre}</p>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">{cliente.objetivo || 'Sin objetivo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🌟 COLUMNA DERECHA (RADAR Y ALERTAS - OCUPA 5/12 APILADA) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* RADAR DE SUDOR */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col flex-1 min-h-[250px]">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                Radar de Sudor
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {cargando ? (
                <p className="text-zinc-500 text-sm text-center mt-10">Cargando...</p>
              ) : datosDashboard.actividadReciente.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <span className="text-3xl mb-2">🕸️</span>
                  <p className="text-sm font-bold text-zinc-400">Silencio total</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {datosDashboard.actividadReciente.map((act, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-sm font-black shrink-0">
                        {act.cliente_nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{act.cliente_nombre}</p>
                        <p className="text-[10px] text-emerald-400 truncate">{act.rutina_nombre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALERTAS */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col flex-1 min-h-[250px]">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2"><span>🚨</span> Alertas</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {cargando ? (
                <p className="text-zinc-500 text-sm text-center mt-10">Cargando...</p>
              ) : datosDashboard.notasRecientes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <span className="text-3xl mb-2">✅</span>
                  <p className="text-sm font-bold text-zinc-400">Todo en orden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {datosDashboard.notasRecientes.map(nota => {
                    const estilo = getEstiloNota(nota.categoria);
                    return (
                      <div key={nota.id} className={`bg-zinc-950 border p-3 rounded-xl flex flex-col gap-1 transition ${estilo.border}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${estilo.color}`}>{estilo.icon} {nota.categoria}</span>
                        </div>
                        <p className="text-white font-bold text-xs mt-1">{nota.cliente_nombre}</p>
                        <p className="text-xs text-zinc-400 italic line-clamp-2">"{nota.mensaje}"</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 🌟 MODAL MAGICO PARA GESTIONAR LA AGENDA */}
      {mostrarModalAgenda && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2"><span>⚙️</span> Configurar Agenda</h2>
              <button onClick={() => {setMostrarModalAgenda(false); setClienteEditando(null);}} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {!clienteEditando ? (
              <div>
                <p className="text-zinc-400 text-sm mb-4">Selecciona un cliente para asignarle días:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {listaClientes.map(c => (
                    <button key={c.id} onClick={() => abrirEditorAgenda(c)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center hover:border-blue-500 transition group">
                      <span className="font-bold text-white">{c.nombre}</span>
                      <span className="text-xs text-zinc-500 group-hover:text-blue-400">Editar &rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-zinc-400 text-sm mb-4">¿Qué días entrena <span className="text-white font-bold">{clienteEditando.nombre}</span>?</p>
                <div className="grid grid-cols-4 gap-3 mb-8">
                  {diasSemana.map((diaLetra) => {
                    const seleccionado = diasEditando.includes(diaLetra);
                    return (
                      <button 
                        key={diaLetra} 
                        onClick={() => toggleDia(diaLetra)}
                        className={`py-3 rounded-xl font-black text-lg transition-all border ${seleccionado ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                      >
                        {diaLetra}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setClienteEditando(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition">Volver</button>
                  <button onClick={guardarAgenda} className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-500 shadow-lg">Guardar Días</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}