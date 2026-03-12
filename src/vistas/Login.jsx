import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    try {
      if (modoRegistro) {
        // 🌟 MODO REGISTRO PARA NUEVOS ENTRENADORES
        const credencial = await createUserWithEmailAndPassword(auth, email, password);
        
        // El truco maestro: Lo registramos en la Base de Datos también
        await fetch('https://backend-entrenadores-production.up.railway.app/api/entrenadores/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        
        onLogin(credencial.user);
      } else {
        // 🌟 MODO INICIO DE SESIÓN NORMAL
        const credencial = await signInWithEmailAndPassword(auth, email, password);
        onLogin(credencial.user);
      }
    } catch (error) {
      alert("Error: " + (error.message.includes('auth/invalid-credential') ? 'Contraseña incorrecta' : error.message));
    }
    setCargando(false);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl w-full max-w-md shadow-2xl">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl font-black text-white">C</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-2">Coach<span className="text-blue-500">board</span></h1>
        <p className="text-zinc-400 text-center mb-8">{modoRegistro ? 'Únete y empieza a gestionar clientes.' : 'Inicia sesión en tu imperio.'}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-500/20 mt-4 disabled:opacity-50"
          >
            {cargando ? 'Cargando...' : (modoRegistro ? 'Crear mi cuenta gratis' : 'Entrar al Panel')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800 pt-6">
          <p className="text-zinc-400 text-sm">
            {modoRegistro ? '¿Ya tienes una cuenta?' : '¿Eres nuevo entrenador?'}
            <button 
              onClick={() => setModoRegistro(!modoRegistro)} 
              className="text-blue-400 font-bold ml-2 hover:text-blue-300"
            >
              {modoRegistro ? 'Inicia Sesión' : 'Crea una cuenta aquí'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}