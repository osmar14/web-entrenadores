import React from 'react';

export default function PaywallModal({ onClose, onNavigateToPlanes }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[80] p-4">
      <div className="bg-zinc-900 border border-amber-500/30 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-yellow-400"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-2xl transition-colors">✕</button>
        
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">👑</span>
          <h3 className="text-2xl font-black text-white">Desbloquea el Poder Pro</h3>
          <p className="text-zinc-400 text-sm mt-2">Accede a herramientas científicas de prescripción y análisis avanzado.</p>
        </div>
        
        {/* Features del Pro */}
        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>RIR / RPE:</b> Prescripción exacta de intensidad.</li>
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>Tempo (TUT):</b> Control métrico del Tiempo Bajo Tensión.</li>
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>Unilateral / Por Tiempo:</b> Variables avanzadas de ejecución.</li>
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>Semáforo de Fatiga:</b> Previene sobreentrenamiento.</li>
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>Gráficas de Radar y 1RM:</b> Análisis visual de progreso.</li>
        </ul>

        {/* Opciones de plan */}
        <div className="space-y-3">
          <button 
            onClick={() => { onClose(); if (onNavigateToPlanes) onNavigateToPlanes(); }} 
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 py-3 rounded-xl font-black shadow-lg hover:scale-[1.02] transition-transform"
          >
            Ver Planes y Precios
          </button>
          <p className="text-center text-zinc-500 text-xs">Desde $350 MXN/mes • Cancela cuando quieras</p>
        </div>
      </div>
    </div>
  );
}