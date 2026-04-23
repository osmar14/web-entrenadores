import React from 'react';

export default function PaywallModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[80] p-4">
      <div className="bg-zinc-900 border border-amber-500/30 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-yellow-400"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-2xl transition-colors">✕</button>
        
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">👑</span>
          <h3 className="text-2xl font-black text-white">Prescripción Científica</h3>
          <p className="text-zinc-400 text-sm mt-2">Estás usando el plan Básico. Actualiza a Pro para desbloquear variables avanzadas.</p>
        </div>
        
        <ul className="space-y-3 mb-8">
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>Tempo:</b> Controla el tiempo bajo tensión.</li>
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>RIR/RPE:</b> Mide la fatiga central real.</li>
          <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500 text-lg">✔</span> <b>Unilateral:</b> Cálculo de tonelaje preciso.</li>
        </ul>
        
        <button onClick={() => { onClose(); alert("Redirigir a pasarela de pago (Stripe/PayPal)"); }} className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 py-3 rounded-xl font-black shadow-lg hover:scale-[1.02] transition-transform">
          Actualizar a Pro - $500/mes
        </button>
      </div>
    </div>
  );
}