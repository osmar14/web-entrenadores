import React from 'react';

export function BottomTabBar({ vistaActiva, setVistaActiva, setClienteSeleccionado }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-center px-2 py-3 pb-safe z-50">
      <button onClick={() => { setVistaActiva('inicio'); setClienteSeleccionado(null); }} className={`flex flex-col items-center gap-1 p-2 w-20 transition ${vistaActiva === 'inicio' ? 'text-emerald-400 scale-110' : 'text-zinc-500 hover:text-zinc-400'}`}>
        <span className="text-2xl drop-shadow-md">🏠</span>
        <span className="text-[10px] font-bold tracking-wide">Inicio</span>
      </button>
      <button onClick={() => { setVistaActiva('clientes'); setClienteSeleccionado(null); }} className={`flex flex-col items-center gap-1 p-2 w-20 transition ${vistaActiva === 'clientes' ? 'text-emerald-400 scale-110' : 'text-zinc-500 hover:text-zinc-400'}`}>
        <span className="text-2xl drop-shadow-md">👥</span>
        <span className="text-[10px] font-bold tracking-wide">Clientes</span>
      </button>
      <button onClick={() => { setVistaActiva('rutinas'); setClienteSeleccionado(null); }} className={`flex flex-col items-center gap-1 p-2 w-20 transition ${(vistaActiva === 'rutinas' || vistaActiva === 'constructor') ? 'text-blue-400 scale-110' : 'text-zinc-500 hover:text-zinc-400'}`}>
        <span className="text-2xl drop-shadow-md">📋</span>
        <span className="text-[10px] font-bold tracking-wide">Rutinas</span>
      </button>
    </nav>
  );
}
