import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Constructor({
  rutinaSeleccionada, setVistaActiva, handleGuardarPlanDeVuelo, 
  ejerciciosFiltrados, gruposMusculares, filtroMusculo, setFiltroMusculo, 
  agregarAlConstructor, diasPlan, diaActivo, setDiaActivo, 
  agregarNuevoDia, renombrarDiaActivo, eliminarDiaActivo, 
  ejerciciosDelDia, onDragEnd, quitarDelConstructor, actualizarEjercicio,
  esPro, setMostrarPaywall, setMostrarModalCatalogo
}) {
  return (
    <div className="mt-2 animate-in fade-in h-full flex flex-col">
      {/* CABECERA DEL CONSTRUCTOR */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
        <div>
          <button onClick={() => setVistaActiva(rutinaSeleccionada.cliente_id ? 'clientes' : 'rutinas')} className="text-zinc-500 hover:text-zinc-300 font-medium text-sm flex items-center gap-2 mb-2 transition">&larr; Volver</button>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight"><span className="block md:inline text-sm text-zinc-400 font-normal">Editando:</span> <span className="text-blue-400">{rutinaSeleccionada.nombre}</span></h2>
        </div>
        <button onClick={handleGuardarPlanDeVuelo} className="w-full md:w-auto bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 shadow-lg">Guardar Plan 🚀</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 pb-10">
        
        {/* PANEL IZQUIERDO: CATÁLOGO */}
        <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[40vh] md:max-h-full">
          <div className="p-3 md:p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <h3 className="text-white font-bold">📚 Catálogo ({ejerciciosFiltrados.length})</h3>
              <button onClick={() => setMostrarModalCatalogo(true)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700">⚙️ Gestionar</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {gruposMusculares.map(grupo => (
                <button key={grupo} onClick={() => setFiltroMusculo(grupo)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filtroMusculo === grupo ? 'bg-blue-500 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}>{grupo}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {ejerciciosFiltrados.map(ejercicio => (
              <div key={ejercicio.id} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                <div><p className="text-sm font-bold text-zinc-200">{ejercicio.nombre}</p><p className="text-[10px] text-zinc-500 uppercase">{ejercicio.grupo_muscular}</p></div>
                <button onClick={() => agregarAlConstructor(ejercicio)} className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:bg-emerald-500 hover:text-white font-bold shrink-0">+</button>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: LIENZO DE DRAG & DROP */}
        <div className={`lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col p-3 md:p-6`}>
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6 border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full md:flex-1 pb-1 md:pb-0">
                {diasPlan.map(dia => (
                  <button key={dia} onClick={() => setDiaActivo(dia)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${diaActivo === dia ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 bg-zinc-900 hover:bg-zinc-800'}`}>{dia}</button>
                ))}
                <button onClick={agregarNuevoDia} className="px-3 py-2 rounded-xl font-bold text-sm text-emerald-400 hover:bg-emerald-500/10 transition flex items-center gap-1 whitespace-nowrap shrink-0"><span>+</span> Nuevo Día</button>
             </div>
             
             <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4 shrink-0 w-full md:w-auto justify-end">
               <button onClick={renombrarDiaActivo} className="flex-1 md:flex-none p-2 text-zinc-400 hover:text-blue-400 bg-zinc-900 hover:bg-blue-500/10 rounded-lg transition text-center text-sm">✏️ Renombrar</button>
               <button onClick={eliminarDiaActivo} className="flex-1 md:flex-none p-2 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 rounded-lg transition text-center text-sm">🗑️ Eliminar</button>
             </div>
           </div>

           {ejerciciosDelDia.length === 0 ? (
             <div className="text-center py-10">
               <h3 className="text-xl font-bold text-white mb-2">{diaActivo} está vacío</h3>
               <p className="text-zinc-500 text-sm">Busca en el catálogo y agrega ejercicios.</p>
             </div>
           ) : (
             <DragDropContext onDragEnd={onDragEnd}>
               <Droppable droppableId={`droppable-${diaActivo}`}>
                 {(provided) => (
                   <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 md:pr-2 pb-20">
                     {ejerciciosDelDia.sort((a, b) => (a.orden || 0) - (b.orden || 0)).map((ejercicio, index) => (
                       <Draggable key={ejercicio.id_unico.toString()} draggableId={ejercicio.id_unico.toString()} index={index}>
                         {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className={`flex flex-col gap-3 bg-zinc-900 border p-4 rounded-xl relative transition-shadow ${snapshot.isDragging ? 'border-blue-500 shadow-2xl shadow-blue-500/20 z-50 scale-[1.02]' : 'border-zinc-800'}`}>
                              
                              {/* Fila Superior: Nombre y Arrastre */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="p-1 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>
                                  </div>
                                  <p className="font-bold text-zinc-200 text-sm">{ejercicio.nombre}</p>
                                </div>
                                <button onClick={() => quitarDelConstructor(ejercicio.id_unico)} className="text-zinc-600 hover:text-red-400 font-bold p-2">✕</button>
                              </div>

                              {/* Fila Media: Notas y Básicos */}
                              <div className="flex flex-col md:flex-row gap-3">
                                <input type="text" placeholder="Nota (Ej. Bajar lento...)" value={ejercicio.notas_entrenador || ''} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'notas_entrenador', e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 text-emerald-400 text-xs font-bold rounded-md px-3 py-2 focus:border-emerald-500 outline-none placeholder-zinc-700" />
                                <div className="flex gap-2 shrink-0">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-zinc-500 uppercase mb-1">Series</span>
                                    <input type="number" value={ejercicio.series_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'series_objetivo', e.target.value)} className="w-14 bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-1 text-sm outline-none focus:border-blue-500" />
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-zinc-500 uppercase mb-1">Reps</span>
                                    <input type="text" value={ejercicio.reps_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'reps_objetivo', e.target.value)} placeholder="Ej. 10" className="w-16 bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-1 text-sm outline-none focus:border-blue-500" />
                                  </div>
                                </div>
                              </div>

                              {/* 👑 FILA INFERIOR: ZONA PRO (MURO DE CRISTAL) */}
                              <div className="relative mt-1 border border-amber-500/20 bg-amber-500/5 rounded-lg p-2 md:p-3">
                                {!esPro && (
                                  <div onClick={() => setMostrarPaywall(true)} className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer backdrop-blur-[2px] bg-zinc-950/50 rounded-lg">
                                    <span className="bg-zinc-900 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-500/30 shadow-lg flex items-center gap-2">👑 Desbloquear Biometría</span>
                                  </div>
                                )}
                                <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 ${!esPro ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                                  <div className="flex flex-col"><span className="text-[9px] text-zinc-500 uppercase font-bold text-amber-500 mb-1">RIR Objetivo</span><input type="text" value={ejercicio.rir_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'rir_objetivo', e.target.value)} placeholder="Ej. 1-2" className="w-full bg-zinc-950 border border-amber-900/50 text-amber-400 text-center rounded-lg py-1 text-sm outline-none focus:border-amber-500" /></div>
                                  <div className="flex flex-col"><span className="text-[9px] text-zinc-500 uppercase font-bold text-amber-500 mb-1">Tempo</span><input type="text" value={ejercicio.tempo || ''} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'tempo', e.target.value)} placeholder="Ej. 3-1-1-0" className="w-full bg-zinc-950 border border-amber-900/50 text-amber-400 text-center rounded-lg py-1 text-sm outline-none focus:border-amber-500" /></div>
                                  <div className="flex flex-col"><span className="text-[9px] text-zinc-500 uppercase font-bold text-amber-500 mb-1">Por Tiempo (Seg)</span><input type="number" value={ejercicio.segundos_objetivo || ''} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'segundos_objetivo', e.target.value)} placeholder="Ej. 60" className="w-full bg-zinc-950 border border-amber-900/50 text-amber-400 text-center rounded-lg py-1 text-sm outline-none focus:border-amber-500" /></div>
                                  <div className="flex flex-col items-center justify-center pt-3"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ejercicio.es_unilateral || false} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'es_unilateral', e.target.checked)} className="accent-amber-500 w-4 h-4 cursor-pointer" /><span className="text-[10px] text-amber-400 font-bold uppercase">Unilateral</span></label></div>
                                </div>
                              </div>

                            </div>
                         )}
                       </Draggable>
                     ))}
                     {provided.placeholder}
                   </div>
                 )}
               </Droppable>
             </DragDropContext>
           )}
        </div>
      </div>
    </div>
  );
}