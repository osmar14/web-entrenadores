import React, { useState, useEffect } from 'react';

function Planes({ planActual, actualizarPlanLocal, usuarioActual, mostrarAlerta }) {
  const [cargando, setCargando] = useState(false);
  const [resultadoPago, setResultadoPago] = useState(null);

  // Detectar retorno de Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get('resultado');
    if (resultado === 'exito') {
      setResultadoPago('exito');
      mostrarAlerta('¡Pago exitoso! Tu plan se está activando...', 'exito');
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
      // Recargar perfil para obtener plan actualizado
      recargarPerfil();
    } else if (resultado === 'cancelado') {
      setResultadoPago('cancelado');
      mostrarAlerta('Pago cancelado. Puedes intentar de nuevo cuando quieras.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const recargarPerfil = async () => {
    if (!usuarioActual) return;
    try {
      const token = await usuarioActual.getIdToken(true); // force refresh
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/entrenadores/perfil', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.plan_actual) {
        actualizarPlanLocal(data.plan_actual);
      }
    } catch (err) { console.error("Error recargando perfil"); }
  };

  const iniciarCheckout = async (plan) => {
    if (!usuarioActual) return;
    setCargando(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/crear-sesion-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        mostrarAlerta(data.error || "Error al iniciar el pago", 'error');
      }
    } catch (e) {
      mostrarAlerta("Error de conexión", 'error');
    }
    setCargando(false);
  };

  const abrirPortalSuscripcion = async () => {
    if (!usuarioActual) return;
    setCargando(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/portal-suscripcion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        mostrarAlerta(data.error || "No tienes suscripción activa", 'error');
      }
    } catch (e) {
      mostrarAlerta("Error de conexión", 'error');
    }
    setCargando(false);
  };

  // Para desarrollo/testing — cambiar plan manualmente
  const cambiarPlanTest = async (nuevoPlan) => {
    if (!usuarioActual) return;
    setCargando(true);
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/entrenadores/test-plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nuevo_plan: nuevoPlan })
      });

      if (res.ok) {
        actualizarPlanLocal(nuevoPlan);
        mostrarAlerta(`¡Plan actualizado a ${nuevoPlan}! (Modo Test)`, 'exito');
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al actualizar", 'error');
      }
    } catch (e) {
      mostrarAlerta("Error de conexión", 'error');
    }
    setCargando(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto mt-4 md:mt-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Escala tu Imperio 🚀</h2>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
          Elige el plan que mejor se adapte al volumen de tus clientes y desbloquea herramientas científicas de alto nivel.
        </p>
      </div>

      {/* Alerta de resultado de pago */}
      {resultadoPago === 'exito' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl mb-8 text-center font-bold animate-in fade-in">
          ✅ ¡Tu pago fue procesado exitosamente! Tu plan se actualizará en unos segundos.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* PLAN GRATUITO */}
        <div className={`bg-zinc-900 border ${planActual === 'TRIAL' ? 'border-emerald-500' : 'border-zinc-800'} rounded-3xl p-8 flex flex-col relative`}>
          {planActual === 'TRIAL' && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-zinc-950 font-bold px-4 py-1 rounded-full text-sm">
              Tu plan actual
            </div>
          )}
          <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
          <p className="text-zinc-400 mb-6 flex-1">Ideal para probar la herramienta y dejar los PDFs.</p>
          <div className="text-4xl font-black text-white mb-8">Gratis</div>
          
          <ul className="space-y-4 mb-8 text-zinc-300">
            <li className="flex items-center gap-3">✅ <span>Hasta 3 clientes activos</span></li>
            <li className="flex items-center gap-3">✅ <span>Constructor Drag & Drop</span></li>
            <li className="flex items-center gap-3">✅ <span>Prescripción Estándar (Series/Reps/Notas)</span></li>
            <li className="flex items-center gap-3">✅ <span>Portal del Cliente (App)</span></li>
            <li className="flex items-center gap-3 opacity-50 text-zinc-500">❌ <span>Clientes ilimitados</span></li>
            <li className="flex items-center gap-3 opacity-50 text-zinc-500">❌ <span>Variables biométricas Pro</span></li>
          </ul>

          <button 
            disabled={true}
            className="w-full py-3 rounded-xl font-bold transition bg-zinc-800 text-zinc-500 cursor-not-allowed"
          >
            {planActual === 'TRIAL' ? 'Plan Activo' : 'Plan Gratuito'}
          </button>
        </div>

        {/* PLAN BÁSICO */}
        <div className={`bg-zinc-900 border ${planActual === 'BASICO' ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'border-zinc-800'} rounded-3xl p-8 flex flex-col relative`}>
          {planActual === 'BASICO' && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white font-bold px-4 py-1 rounded-full text-sm">
              Tu plan actual
            </div>
          )}
          <h3 className="text-2xl font-bold text-white mb-2">Básico</h3>
          <p className="text-zinc-400 mb-6 flex-1">Ahorra tiempo gestionando un volumen alto de clientes.</p>
          <div className="text-4xl font-black text-white mb-2">$350<span className="text-lg text-zinc-500 font-normal">/mes MXN</span></div>
          <p className="text-sm text-zinc-500 mb-6">(Aprox. $18 USD)</p>
          
          <ul className="space-y-4 mb-8 text-zinc-300 flex-1">
            <li className="flex items-center gap-3">✅ <span className="font-bold text-blue-400">Clientes Ilimitados</span></li>
            <li className="flex items-center gap-3">✅ <span>Clonación Maestra de Rutinas</span></li>
            <li className="flex items-center gap-3">✅ <span>Catálogo de Ejercicios Inteligente</span></li>
            <li className="flex items-center gap-3">✅ <span>Expediente y Bitácora Médica</span></li>
            <li className="flex items-center gap-3 opacity-50 text-zinc-500">❌ <span>Métricas avanzadas (1RM)</span></li>
            <li className="flex items-center gap-3 opacity-50 text-zinc-500">❌ <span>Semáforo de fatiga</span></li>
          </ul>

          {planActual === 'BASICO' ? (
            <button 
              onClick={abrirPortalSuscripcion}
              disabled={cargando}
              className="w-full py-3 rounded-xl font-bold transition bg-zinc-800 text-blue-400 hover:bg-zinc-700 border border-blue-500/20"
            >
              {cargando ? '...' : '⚙️ Gestionar Suscripción'}
            </button>
          ) : (
            <button 
              onClick={() => iniciarCheckout('BASICO')}
              disabled={cargando || planActual === 'PRO'}
              className={`w-full py-3 rounded-xl font-bold transition ${planActual === 'PRO' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
            >
              {cargando ? 'Procesando...' : planActual === 'PRO' ? 'Ya tienes Pro' : 'Suscribirme al Básico'}
            </button>
          )}
        </div>

        {/* PLAN PRO */}
        <div className={`bg-gradient-to-b from-zinc-900 to-zinc-950 border ${planActual === 'PRO' ? 'border-amber-500 shadow-2xl shadow-amber-500/20' : 'border-zinc-700'} rounded-3xl p-8 flex flex-col relative overflow-hidden`}>
          {planActual === 'PRO' && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-zinc-950 font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1">
              <span>👑</span> Tu plan actual
            </div>
          )}
          {planActual !== 'PRO' && (
            <div className="absolute -top-6 -right-6 text-6xl opacity-10 rotate-12">👑</div>
          )}
          
          <h3 className="text-2xl font-black text-amber-500 mb-2 flex items-center gap-2">Élite Científica 👑</h3>
          <p className="text-zinc-400 mb-6 flex-1">Justifica cobros "High-Ticket" con prescripción 100% basada en datos.</p>
          <div className="text-4xl font-black text-white mb-2">$500<span className="text-lg text-zinc-500 font-normal">/mes MXN</span></div>
          <p className="text-sm text-zinc-500 mb-6">(Aprox. $26 USD)</p>
          
          <ul className="space-y-4 mb-8 text-zinc-300 flex-1">
            <li className="flex items-center gap-3">✅ <span className="text-zinc-400">Todo lo del Básico +</span></li>
            <li className="flex items-center gap-3">🚦 <span className="font-bold text-amber-400">Semáforo de Fatiga Automático</span></li>
            <li className="flex items-center gap-3">🕸️ <span>Radar de Simetría (Volumen)</span></li>
            <li className="flex items-center gap-3">📈 <span>Curva de Fuerza (1RM Estimado)</span></li>
            <li className="flex items-center gap-3">🧬 <span>Personalización (RIR, Tempo, TUT)</span></li>
          </ul>

          {planActual === 'PRO' ? (
            <button 
              onClick={abrirPortalSuscripcion}
              disabled={cargando}
              className="w-full py-3 rounded-xl font-bold transition bg-zinc-800 text-amber-400 hover:bg-zinc-700 border border-amber-500/20"
            >
              {cargando ? '...' : '⚙️ Gestionar Suscripción'}
            </button>
          ) : (
            <button 
              onClick={() => iniciarCheckout('PRO')}
              disabled={cargando}
              className={`w-full py-3 rounded-xl font-bold transition bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20`}
            >
              {cargando ? 'Procesando...' : 'Desbloquear Pro 👑'}
            </button>
          )}
        </div>
      </div>

      {/* Gestionar suscripción existente */}
      {(planActual === 'BASICO' || planActual === 'PRO') && (
        <div className="mt-8 text-center">
          <button 
            onClick={abrirPortalSuscripcion} 
            className="text-zinc-500 hover:text-zinc-300 text-sm font-medium underline underline-offset-4 transition"
          >
            Gestionar facturación, cambiar método de pago o cancelar suscripción
          </button>
        </div>
      )}

      {/* 🧪 PANEL DE DESARROLLO — Cambiar plan manualmente para testing */}
      <div className="mt-16 border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🧪</span>
          <div>
            <h4 className="text-white font-bold text-sm">Modo Desarrollo — Cambiar Plan</h4>
            <p className="text-zinc-500 text-xs">Simula planes sin Stripe. Este panel se desactiva en producción.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {['TRIAL', 'BASICO', 'PRO'].map(plan => (
            <button
              key={plan}
              onClick={() => cambiarPlanTest(plan)}
              disabled={cargando || planActual === plan}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                planActual === plan 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {planActual === plan ? `✅ ${plan} (Activo)` : `Cambiar a ${plan}`}
            </button>
          ))}
        </div>
        <p className="text-zinc-600 text-[10px] mt-3 uppercase tracking-wider font-bold">
          Plan actual en la base de datos: <span className="text-zinc-400">{planActual}</span>
        </p>
      </div>
    </div>
  );
}

export default Planes;
