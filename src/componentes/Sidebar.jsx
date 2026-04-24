import React from 'react';

export default function Sidebar({ vistaActiva, setVistaActiva, setClienteSeleccionado, onSignOut, setMostrarCalculadora }) {
  return (
    <aside className="hidden md:flex w-64 bg-zinc-900/50 border-r border-zinc-800 flex-col p-6 backdrop-blur-xl shrink-0 z-10">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl font-black text-white">C</span>
        </div>
        <h2 className="text-2xl font-black text-white">Coach<span className="text-blue-500">board</span></h2>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1">
        <button onClick={() => { setVistaActiva('inicio'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${vistaActiva === 'inicio' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}>
          <span className="text-xl">🏠</span> Inicio
        </button>
        <button onClick={() => { setVistaActiva('clientes'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${vistaActiva === 'clientes' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}>
          <span className="text-xl">👥</span> Mis Clientes
        </button>
        <button onClick={() => { setVistaActiva('rutinas'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${(vistaActiva === 'rutinas' || vistaActiva === 'constructor') ? 'bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}>
          <span className="text-xl">📋</span> Rutinas
        </button>
        <button onClick={() => setMostrarCalculadora(true)} className="flex items-center gap-3 p-3 rounded-xl transition text-zinc-400 font-semibold hover:bg-zinc-800">
          <span className="text-xl">🧮</span> Calculadora 1RM
        </button>
        
        <div className="my-2 border-t border-zinc-800"></div>

        <button onClick={() => { setVistaActiva('planes'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${vistaActiva === 'planes' ? 'bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}>
          <span className="text-xl">👑</span> Suscripción
        </button>
      </nav>

      <button onClick={onSignOut} className="mt-auto flex items-center justify-center gap-2 p-3 rounded-xl transition text-red-400 font-semibold border border-red-500/20 hover:bg-red-500/10 bg-red-500/5">
        <span>🚪</span> Cerrar Sesión
      </button>
    </aside>
  );
}