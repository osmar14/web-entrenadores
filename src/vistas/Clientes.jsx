import { useState, useEffect } from 'react';
import EstacionProgreso from '../componentes/EstacionProgreso';

export default function Clientes({ 
  listaClientes, clienteSeleccionado, setClienteSeleccionado, 
  listaRutinas, todasLasRutinas, handleClonarRutina,
  abrirConstructor, handleEliminarRutina, cargarDatos, mostrarAlerta,
  usuarioActual 
}) {
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', email: '', objetivo: '' });
  
  const [rutinaEnProgreso, setRutinaEnProgreso] = useState(null); 
  const [modoEstacion, setModoEstacion] = useState('registro'); 

  const [notasCliente, setNotasCliente] = useState([]);
  const [mostrarModalNota, setMostrarModalNota] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({ categoria: 'General', mensaje: '' });
  
  // 🌟 ESTADO NUEVO PARA EL VOLUMEN SEMANAL
  const [volumenSemanal, setVolumenSemanal] = useState([]);

  const rutinasDelCliente = clienteSeleccionado ? todasLasRutinas.filter(r => r.cliente_id === clienteSeleccionado.id) : [];
  const emojisGym = ['🏋️‍♂️', '💪', '🔥', '⚡', '🦍', '🥇', '🦾'];

  useEffect(() => {
    if (!clienteSeleccionado) {
      setRutinaEnProgreso(null);
    }
  }, [clienteSeleccionado]);

  const cargarExpediente = async (cliente_id) => {
    try {
      const resNotas = await fetch(`https://backend-entrenadores-production.up.railway.app/api/notas/${cliente_id}`);
      const datosNotas = await resNotas.json();
      setNotasCliente(datosNotas);

      // 🌟 LLAMADA PARA OBTENER EL VOLUMEN
      const resVolumen = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/volumen/${cliente_id}`);
      if(resVolumen.ok) {
        const datosVolumen = await resVolumen.json();
        setVolumenSemanal(datosVolumen);
      }
    } catch (error) {
      console.error("Error al cargar expediente", error);
    }
  };

  useEffect(() => {
    if (clienteSeleccionado) {
      cargarExpediente(clienteSeleccionado.id);
    }
  }, [clienteSeleccionado]);

  const handleGuardarNota = async () => {
    if (!nuevaNota.mensaje) return mostrarAlerta("El mensaje no puede estar vacío", "error");
    if (!usuarioActual) return mostrarAlerta("Error de sesión", "error");
    
    try {
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/notas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'usuario-email': usuarioActual.email 
        },
        body: JSON.stringify({
          cliente_id: clienteSeleccionado.id,
          categoria: nuevaNota.categoria,
          mensaje: nuevaNota.mensaje
        })
      });

      if (res.ok) {
        mostrarAlerta("Bitácora actualizada 📝", "exito");
        setMostrarModalNota(false);
        setNuevaNota({ categoria: 'General', mensaje: '' }); 
        cargarExpediente(clienteSeleccionado.id); 
      }
    } catch (e) {
      mostrarAlerta("Error al guardar la nota", "error");
    }
  };

  const handleGuardarCliente = async () => {
    if (!nuevoCliente.nombre) return mostrarAlerta("El nombre es obligatorio", "error");
    if (!nuevoCliente.email) return mostrarAlerta("El correo es obligatorio para darle acceso a la App", "error");
    if (!usuarioActual) return mostrarAlerta("Error de sesión", "error");

    mostrarAlerta("Creando cuenta en el servidor...", "exito");

    try {
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/clientes', {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'usuario-email': usuarioActual.email 
        }, 
        body: JSON.stringify(nuevoCliente)
      });
      
      const data = await res.json();

      if (res.ok) {
        alert(`✅ ¡Cuenta creada con éxito!\n\nPásale estos datos a tu cliente para que entre a su App:\n\n✉️ Email: ${data.email}\n🔑 Contraseña: ${data.password_temporal}`);
        
        setMostrarModalCliente(false); 
        setNuevoCliente({ nombre: '', email: '', objetivo: '' }); 
        cargarDatos(); 
      } else {
        mostrarAlerta(data.error || "Error al crear cliente", "error");
      }
    } catch (e) { 
      mostrarAlerta("Error de conexión", "error"); 
    }
  };

  const abrirParaAnotar = (rutina) => {
    setModoEstacion('registro');
    setRutinaEnProgreso(rutina);
  };

  const abrirParaAnalizar = (rutina) => {
    setModoEstacion('analisis');
    setRutinaEnProgreso(rutina);
  };

  const getEstiloNota = (categoria) => {
    switch(categoria) {
      case 'Lesión': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🚨' };
      case 'Salud': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '🩺' };
      case 'Nutrición': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '🍏' };
      case 'Motivación': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: '🧠' };
      default: return { color: 'text-zinc-300', bg: 'bg-zinc-800', border: 'border-zinc-700', icon: '📝' }; 
    }
  };

  return (
    <>
      {!clienteSeleccionado && !rutinaEnProgreso && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-8">
            <div><h2 className="text-2xl font-black text-white mb-2">Mis Clientes</h2><p className="text-zinc-400 text-sm">Gestiona el progreso de tus atletas.</p></div>
            <button onClick={() => setMostrarModalCliente(true)} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 shadow-lg"><span className="text-sm">➕</span> Nuevo Cliente</button>
          </div>
          
          {listaClientes.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center text-3xl mb-4">👥</div>
              <h3 className="text-zinc-300 font-bold text-lg mb-2">Tu lista está vacía</h3>
              <button onClick={() => setMostrarModalCliente(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 mt-4 shadow-lg">Agregar Primer Cliente</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listaClientes.map((cliente) => (
                <div key={cliente.id} onClick={() => setClienteSeleccionado(cliente)} className="bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 rounded-2xl p-6 flex flex-col shadow-lg cursor-pointer group">
                  <div className="w-14 h-14 bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner">{cliente.nombre.charAt(0).toUpperCase()}</div>
                  <h3 className="text-xl font-black text-white mb-1">{cliente.nombre}</h3>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold mb-4 flex-1">🎯 Obj: <span className="text-zinc-300 normal-case font-normal">{cliente.objetivo || 'General'}</span></p>
                  <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4"><span className="text-xs text-zinc-500 flex items-center gap-1">🟢 Activo</span><span className="text-emerald-400 text-sm font-bold group-hover:translate-x-1 transition-transform">Ver perfil &rarr;</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {clienteSeleccionado && !rutinaEnProgreso && (
        <div className="mt-4 animate-in fade-in slide-in-from-right-8 duration-300 relative">
          <button onClick={() => setClienteSeleccionado(null)} className="text-zinc-500 hover:text-zinc-300 font-medium text-sm flex items-center gap-2 mb-6 transition">&larr; Volver a Mis Clientes</button>
          
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 mb-8 shadow-xl flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-zinc-800 pb-6 lg:pb-0 lg:pr-8">
              <div className="flex items-center gap-5 mb-2">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl font-black text-zinc-900 shadow-lg shrink-0">
                  {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1 leading-tight">{clienteSeleccionado.nombre}</h2>
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">🟢 Activo</span>
                </div>
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Objetivo Principal</p>
                <p className="text-sm font-medium text-zinc-300">🎯 {clienteSeleccionado.objetivo || 'Sin objetivo específico'}</p>
              </div>

              {/* 🌟 NUEVO: PANEL DE VOLUMEN SEMANAL */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner flex-1 flex flex-col mt-2">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 flex justify-between items-center">
                  <span>Volumen (Últimos 7 días)</span>
                  <span className="text-emerald-500 text-xs">📊</span>
                </p>
                
                {volumenSemanal.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs text-center px-4">
                    Aún no hay series registradas esta semana.
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {volumenSemanal.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-zinc-300">{item.grupo_muscular || 'General'}</span>
                          <span className="text-blue-400">{item.total_series} series</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((item.total_series / 20) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-2/3 flex flex-col h-80">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><span>📂</span> Bitácora Médica y Notas</h3>
                <button onClick={() => setMostrarModalNota(true)} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">➕ Agregar Nota</button>
              </div>
              
              <div className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 overflow-y-auto custom-scrollbar relative">
                {notasCliente.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                     <span className="text-3xl mb-2">📇</span>
                     <p className="text-sm font-bold text-zinc-400">El expediente está vacío</p>
                     <p className="text-xs text-zinc-500">Registra lesiones, molestias o notas de progreso.</p>
                   </div>
                ) : (
                  <div className="space-y-4 relative">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-zinc-800 z-0"></div>
                    {notasCliente.map((nota) => {
                      const estilo = getEstiloNota(nota.categoria);
                      const fechaNota = new Date(nota.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

                      return (
                        <div key={nota.id} className="relative z-10 flex gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border shadow-lg shrink-0 mt-1 ${estilo.bg} ${estilo.border}`}>
                            {estilo.icon}
                          </div>
                          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex-1 hover:border-zinc-700 transition">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${estilo.color}`}>{nota.categoria}</span>
                              <span className="text-[10px] text-zinc-500 font-medium">{fechaNota}</span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{nota.mensaje}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span>📋</span> Plan de Entrenamiento Actual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {rutinasDelCliente.map(rutina => (
                <div key={rutina.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg animate-in zoom-in duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-2xl">{emojisGym[rutina.id % emojisGym.length]}</div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/30">Plan Activo</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-6 line-clamp-1 flex-1">{rutina.nombre}</h3>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => abrirConstructor(rutina)} className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center text-sm" title="Editar Plantilla">✏️ Editar Plan</button>
                      <button onClick={() => handleEliminarRutina(rutina.id)} className="w-12 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl font-bold transition flex items-center justify-center" title="Eliminar Plan">✕</button>
                    </div>
                    <button onClick={() => abrirParaAnotar(rutina)} className="w-full bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 py-3 rounded-xl font-bold transition text-sm shadow-lg flex items-center justify-center gap-2">
                      <span>📝</span> Anotar Entrenamiento Hoy
                    </button>
                    <button onClick={() => abrirParaAnalizar(rutina)} className="w-full bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 py-2.5 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 mt-1">
                      <span>📊</span> Ver Progreso
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setMostrarModalAsignar(true)} className="border-2 border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 rounded-2xl p-6 flex flex-col items-center justify-center font-bold transition min-h-[200px]"><span className="text-3xl mb-2">+</span> Asignar otro plan</button>
            </div>
          </div>
        </div>
      )}

      {clienteSeleccionado && rutinaEnProgreso && (
        <EstacionProgreso 
          cliente={clienteSeleccionado}
          rutina={rutinaEnProgreso}
          onVolver={() => setRutinaEnProgreso(null)}
          mostrarAlerta={mostrarAlerta}
          vistaInicial={modoEstacion}
          usuarioActual={usuarioActual} 
        />
      )}

      {mostrarModalNota && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 text-xl">📂</div>
                <h2 className="text-xl font-extrabold text-white">Nueva Nota</h2>
              </div>
              <button onClick={() => setMostrarModalNota(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition">✕</button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Categoría</label>
                <select 
                  value={nuevaNota.categoria} 
                  onChange={(e) => setNuevaNota({...nuevaNota, categoria: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="General">📝 Nota General</option>
                  <option value="Lesión">🚨 Lesión / Dolor Agudo</option>
                  <option value="Salud">🩺 Salud / Movilidad</option>
                  <option value="Nutrición">🍏 Nutrición</option>
                  <option value="Motivación">🧠 Motivación / Psicología</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Mensaje / Detalle</label>
                <textarea 
                  value={nuevaNota.mensaje} 
                  onChange={(e) => setNuevaNota({...nuevaNota, mensaje: e.target.value})}
                  placeholder="Ej. Siente molestia en el hombro..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition placeholder-zinc-700 min-h-[120px] resize-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setMostrarModalNota(false)} className="px-5 py-3 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition">Cancelar</button>
              <button onClick={handleGuardarNota} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">Guardar Nota</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalAsignar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-white">Plantillas</h2>
              <button onClick={() => setMostrarModalAsignar(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {listaRutinas.map(p => (
                <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between cursor-pointer hover:border-blue-500 transition-colors" onClick={() => { handleClonarRutina(p.id, clienteSeleccionado.id); setMostrarModalAsignar(false); }}>
                  <div><p className="font-bold text-white">{p.nombre}</p></div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-500 font-bold flex items-center justify-center">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarModalCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-white">Nuevo Cliente</h2>
              <button onClick={() => setMostrarModalCliente(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <input type="text" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} placeholder="Nombre completo" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
              <input type="email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value.trim()})} placeholder="Correo electrónico (Acceso a la App)" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
              <input type="text" value={nuevoCliente.objetivo} onChange={(e) => setNuevoCliente({...nuevoCliente, objetivo: e.target.value})} placeholder="Objetivo (Ej. Hipertrofia)" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" />
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setMostrarModalCliente(false)} className="text-zinc-400 font-bold hover:text-white px-4 py-2">Cancelar</button>
              <button onClick={handleGuardarCliente} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">Crear y Dar Acceso</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}