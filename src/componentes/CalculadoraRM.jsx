import React, { useState, useEffect } from 'react';

export default function CalculadoraRM({ onClose }) {
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');
  const [rm, setRm] = useState(0);

  // Epley formula: 1RM = Peso * (1 + 0.0333 * Reps)
  // Brzycki formula: 1RM = Peso * (36 / (37 - Reps))
  useEffect(() => {
    const p = parseFloat(peso);
    const r = parseInt(reps);
    if (p > 0 && r > 0) {
      if (r === 1) {
        setRm(p);
      } else {
        // Usamos la fórmula de Epley
        const calculado = p * (1 + 0.0333 * r);
        setRm(calculado);
      }
    } else {
      setRm(0);
    }
  }, [peso, reps]);

  const porcentajes = [
    { pct: 100, label: '100% (1RM)' },
    { pct: 95, label: '95%' },
    { pct: 90, label: '90%' },
    { pct: 85, label: '85%' },
    { pct: 80, label: '80%' },
    { pct: 75, label: '75%' },
    { pct: 70, label: '70%' },
    { pct: 60, label: '60%' },
    { pct: 50, label: '50%' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-blue-500">🧮</span> Calculadora de 1RM
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-red-500">
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-400 mb-6">
            Calcula tu Repetición Máxima (1RM) y descubre los pesos para tus series según el porcentaje de carga.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Peso (kg/lb)</label>
              <input 
                type="number" 
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ej. 100" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Repeticiones</label>
              <input 
                type="number" 
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="Ej. 5" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-400"></div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Tu 1RM Estimado</p>
            <p className="text-5xl font-black text-white">
              {rm > 0 ? rm.toFixed(1) : '0.0'}
              <span className="text-xl text-blue-500 font-medium ml-1">kg</span>
            </p>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {porcentajes.map((item) => (
              <div key={item.pct} className="flex justify-between items-center p-3 rounded-lg hover:bg-zinc-800/50 transition group">
                <span className="font-bold text-zinc-400 group-hover:text-zinc-200">{item.label}</span>
                <span className="font-black text-white">
                  {rm > 0 ? (rm * (item.pct / 100)).toFixed(1) : '0.0'} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
