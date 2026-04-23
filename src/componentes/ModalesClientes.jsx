import React from 'react';

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
            <select value={nuevaNota.categoria} onChange={(e) => setNuevaNota({...nuevaNota, categoria: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition cursor-pointer">
              <option value="General">📝 Nota General</option>
              <option value="Lesión">🚨 Lesión / Dolor Agudo</option>
              <option value="Salud">🩺 Salud / Movilidad</option>
              <option value="Nutrición">🍏 Nutrición</option>
              <option value="Motivación">🧠 Motivación / Psicología</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Mensaje / Detalle</label>
            <textarea value={nuevaNota.mensaje} onChange={(e) => setNuevaNota({...nuevaNota, mensaje: e.target.value})} placeholder="Ej. Siente molestia en el hombro..." className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition placeholder-zinc-700 min-h-[120px] resize-none" />
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
          <input type="text" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} placeholder="Nombre completo" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
          <input type="email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value.trim()})} placeholder="Correo electrónico (Acceso a la App)" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
          <input type="text" value={nuevoCliente.objetivo} onChange={(e) => setNuevoCliente({...nuevoCliente, objetivo: e.target.value})} placeholder="Objetivo (Ej. Hipertrofia)" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
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
            [...sessionLiveSeleccionada.updates].reverse().map((upd, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${upd.completado ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-900 border-zinc-700'}`}>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalHistorialEntrenamientos({ mostrarModalHistorial, setMostrarModalHistorial, entrenamientosRecientes, rutinasDelCliente, abrirParaAnalizar, mostrarAlerta }) {
  if (!mostrarModalHistorial) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2"><span>⏱️</span> Historial de Sesiones</h2>
          <button onClick={() => setMostrarModalHistorial(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
          {entrenamientosRecientes.length === 0 ? (
            <div className="text-center py-8 opacity-50"><p className="text-zinc-500">No hay entrenamientos recientes.</p></div>
          ) : (
            entrenamientosRecientes.map((ent, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center hover:border-zinc-700 transition">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white mb-1">{ent.rutina_nombre || 'Rutina Eliminada'}</span>
                  <span className="text-xs text-zinc-500">{new Date(ent.fecha).toLocaleDateString()} a las {new Date(ent.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <button onClick={() => { 
                  const rut = rutinasDelCliente.find(r => r.id === ent.rutina_id); 
                  if (rut) { setMostrarModalHistorial(false); abrirParaAnalizar(rut); } 
                  else mostrarAlerta('Rutina no encontrada', 'error'); 
                }} className="text-blue-400 text-xs font-bold bg-blue-500/10 px-4 py-2 rounded-lg hover:bg-blue-500/20 transition border border-blue-500/20">Ver Detalle</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
