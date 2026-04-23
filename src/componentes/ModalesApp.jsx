import React from 'react';

export function ModalConfirmacion({ confirmacion, setConfirmacion }) {
  if (!confirmacion) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-3xl mb-6 mx-auto shadow-inner">⚠️</div>
        <h3 className="text-2xl font-black text-white text-center mb-2">¿Estás seguro?</h3>
        <p className="text-zinc-400 text-center text-sm mb-8">{confirmacion.mensaje}</p>
        <div className="flex flex-col md:flex-row gap-3">
          <button onClick={() => setConfirmacion(null)} className="flex-1 px-5 py-3 rounded-xl font-bold text-zinc-300 hover:bg-zinc-800 transition border border-zinc-700 md:border-none">Cancelar</button>
          <button onClick={confirmacion.onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/20">Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

export function ModalNuevaRutina({ mostrarModal, setMostrarModal, pasoModal, setPasoModal, nuevaRutina, setNuevaRutina, handleGuardarRutina, abrirConstructor }) {
  if (!mostrarModal) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl">
        {pasoModal === 'formulario' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-extrabold text-white">Nueva Rutina</h2>
              <button onClick={() => { setMostrarModal(false); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400 text-xl md:text-base hover:text-white transition">✕</button>
            </div>
            <div className="space-y-4">
              <input type="text" value={nuevaRutina.nombre} onChange={(e) => setNuevaRutina({...nuevaRutina, nombre: e.target.value})} placeholder="Nombre" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
              <textarea value={nuevaRutina.descripcion} onChange={(e) => setNuevaRutina({...nuevaRutina, descripcion: e.target.value})} placeholder="Descripción" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 h-24 focus:border-blue-500 outline-none"></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => { setMostrarModal(false); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400 font-medium px-4 hover:text-white transition">Cancelar</button>
              <button onClick={handleGuardarRutina} className="bg-blue-600 text-white px-6 py-3 md:py-2 rounded-xl font-bold hover:bg-blue-500 transition">Guardar</button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <h2 className="text-3xl font-black text-white mb-4">¡Creada!</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setMostrarModal(false); setPasoModal('formulario'); abrirConstructor(nuevaRutina); }} className="bg-emerald-500 text-zinc-950 px-6 py-4 md:py-3 rounded-xl font-bold hover:bg-emerald-400 transition">Sí, agregar ejercicios</button>
              <button onClick={() => { setMostrarModal(false); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400 py-2 hover:text-white transition">No, después</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalClonarMasivo({ mostrarModalClonarMasivo, setMostrarModalClonarMasivo, rutinaAClonar, setRutinaAClonar, listaClientes, clientesSeleccionados, setClientesSeleccionados, handleClonarMasivo }) {
  if (!mostrarModalClonarMasivo) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Asignar a Múltiples Clientes</h2>
          <button onClick={() => { setMostrarModalClonarMasivo(false); setClientesSeleccionados([]); setRutinaAClonar(null); }} className="text-zinc-400 hover:text-white transition">✕</button>
        </div>
        <p className="text-sm text-zinc-400 mb-4">Plantilla: <span className="text-blue-400 font-bold">{rutinaAClonar?.nombre}</span></p>
        
        <div className="max-h-60 overflow-y-auto mb-4 border border-zinc-800 rounded-xl p-2 bg-zinc-950 custom-scrollbar">
          {listaClientes.map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer transition">
              <input type="checkbox" className="w-5 h-5 accent-blue-500" 
                checked={clientesSeleccionados.includes(c.id)}
                onChange={(e) => {
                  if (e.target.checked) setClientesSeleccionados([...clientesSeleccionados, c.id]);
                  else setClientesSeleccionados(clientesSeleccionados.filter(id => id !== c.id));
                }}
              />
              <span className="text-white font-medium">{c.nombre}</span>
            </label>
          ))}
          {listaClientes.length === 0 && <p className="text-zinc-500 text-center text-sm py-4">No tienes clientes aún.</p>}
        </div>

        <div className="flex justify-between mt-4 items-center">
          <button onClick={() => setClientesSeleccionados(clientesSeleccionados.length === listaClientes.length ? [] : listaClientes.map(c => c.id))} className="text-sm text-blue-400 hover:underline">
            {clientesSeleccionados.length === listaClientes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
          <button onClick={handleClonarMasivo} disabled={clientesSeleccionados.length === 0} className={`px-4 py-2 rounded-xl font-bold transition ${clientesSeleccionados.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
            Asignar ({clientesSeleccionados.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalCatalogo({ mostrarModalCatalogo, setMostrarModalCatalogo, nuevoEjercicioCatalogo, setNuevoEjercicioCatalogo, handleCrearEjercicio, catalogoEjercicios, handleEliminarEjercicio }) {
  if (!mostrarModalCatalogo) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📚 Mi Catálogo</h2>
          <button onClick={() => setMostrarModalCatalogo(false)} className="text-zinc-400 hover:text-white transition">✕</button>
        </div>
        
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4 shrink-0">
          <h3 className="text-sm font-bold text-emerald-400 mb-3">Añadir Ejercicio Propio</h3>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre (ej. Press Inclinado en Máquina)" value={nuevoEjercicioCatalogo.nombre} onChange={(e) => setNuevoEjercicioCatalogo({...nuevoEjercicioCatalogo, nombre: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none transition" />
            <div className="flex gap-2">
              <select value={nuevoEjercicioCatalogo.grupo_muscular} onChange={(e) => setNuevoEjercicioCatalogo({...nuevoEjercicioCatalogo, grupo_muscular: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none transition">
                <option value="Pecho">Pecho</option>
                <option value="Espalda">Espalda</option>
                <option value="Pierna">Pierna</option>
                <option value="Hombro">Hombro</option>
                <option value="Brazo">Brazo</option>
                <option value="Core">Core</option>
                <option value="Cardio">Cardio</option>
                <option value="Fullbody">Fullbody</option>
              </select>
              <button onClick={handleCrearEjercicio} className="bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-emerald-400 transition">Añadir</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          <p className="text-xs text-zinc-500 font-bold mb-2 uppercase">Tus Ejercicios ({catalogoEjercicios.filter(e => e.entrenador_id).length})</p>
          {catalogoEjercicios.filter(e => e.entrenador_id).length === 0 ? (
             <p className="text-sm text-zinc-600 italic px-2">No has añadido ejercicios propios todavía.</p>
          ) : (
            catalogoEjercicios.filter(e => e.entrenador_id).map(e => (
              <div key={e.id} className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                <div>
                  <p className="text-sm font-bold text-white">{e.nombre}</p>
                  <p className="text-[10px] text-zinc-400 uppercase">{e.grupo_muscular}</p>
                </div>
                <button onClick={() => handleEliminarEjercicio(e.id)} className="text-red-400 hover:text-red-300 p-2 transition">🗑️</button>
              </div>
            ))
          )}
          
          <div className="mt-6 mb-2 border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 font-bold uppercase">Ejercicios Globales ({catalogoEjercicios.filter(e => !e.entrenador_id).length})</p>
          </div>
          {catalogoEjercicios.filter(e => !e.entrenador_id).slice(0, 15).map(e => (
            <div key={e.id} className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800">
              <span className="text-sm text-zinc-300">{e.nombre}</span>
              <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded">{e.grupo_muscular}</span>
            </div>
          ))}
          <p className="text-xs text-zinc-600 italic text-center py-2">+ más ejercicios globales...</p>
        </div>
      </div>
    </div>
  );
}
