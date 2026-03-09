import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // 🌟 Importamos a nuestro Guardia de Seguridad

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Memoria para guardar errores

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores anteriores

    try {
      // 🌟 LE TOCAMOS LA PUERTA A GOOGLE
      await signInWithEmailAndPassword(auth, email, password);
      // Si el código llega aquí, significa que la contraseña era correcta
      onLogin(); 
    } catch (error) {
      // Si la contraseña es incorrecta o el correo no existe, Google nos tira un error
      console.error("Acceso denegado:", error.code);
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 selection:bg-emerald-500/30 relative overflow-hidden">
      
      {/* Círculos de luz de fondo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-zinc-900/80 border border-zinc-800/80 p-10 rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden backdrop-blur-xl z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl mx-auto flex items-center justify-center text-4xl font-black text-white border border-zinc-700 shadow-inner mb-6">
            C
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Coachboard</h1>
          <p className="text-zinc-400 text-sm">El centro de mando para entrenadores élite.</p>
        </div>

        {/* 🌟 LETRERO DE ERROR ELEGANTE */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold p-3 rounded-xl mb-6 text-center animate-in shake duration-300">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="entrenador@coachboard.com" 
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-700 font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-700 font-medium"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-lg transition-colors shadow-lg shadow-emerald-500/20 mt-4 flex justify-center items-center gap-2 group"
          >
            Iniciar Sesión <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800/50 pt-6">
          <p className="text-zinc-500 text-sm">
            ¿No tienes una cuenta? <br/>
            <button className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors mt-1">Solicita acceso a la Beta</button>
          </p>
        </div>
      </div>
    </div>
  );
}