import { useState, useEffect } from 'react';
import EstacionProgreso from '../componentes/EstacionProgreso';
import LienzoAnalitico from '../componentes/LienzoAnalitico'; // 🌟 IMPORTAMOS TU NUEVA JOYA
import { auth } from '../firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth'; 
import { io } from 'socket.io-client';
import jsPDF from 'jspdf';
import { ModalNuevaNota, ModalAsignarPlantilla, ModalNuevoCliente, ModalCoachboardLive, ModalCentroRendimiento, ModalCalculadora } from '../componentes/ModalesClientes';

export default function Clientes({ 
  planActual, listaClientes, clienteSeleccionado, setClienteSeleccionado, 
  listaRutinas, todasLasRutinas, handleClonarRutina,
  abrirConstructor, handleEliminarRutina, cargarDatos, mostrarAlerta,
  usuarioActual, esPro, setMostrarPaywall, catalogoEjercicios 
}) {
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', email: '', objetivo: '' });
  
  const intentarNuevoCliente = () => {
    if (planActual === 'TRIAL' && listaClientes.length >= 3) {
      setMostrarPaywall(true);
    } else {
      setMostrarModalCliente(true);
    }
  };
  
  const [rutinaEnProgreso, setRutinaEnProgreso] = useState(null); 
  const [modoEstacion, setModoEstacion] = useState('registro'); 

  const [notasCliente, setNotasCliente] = useState([]);
  const [mostrarModalNota, setMostrarModalNota] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({ categoria: 'General', mensaje: '' });
  
  const [volumenSemanal, setVolumenSemanal] = useState([]);
  const [feedbackCliente, setFeedbackCliente] = useState([]);
  const [entrenamientosRecientes, setEntrenamientosRecientes] = useState([]);
  const [fotosCliente, setFotosCliente] = useState([]);
  const [tabNotas, setTabNotas] = useState('coach');
  const [semaforoFatiga, setSemaforoFatiga] = useState(null); 

  // 🔴 LIVE TRACKING
  const [liveSessions, setLiveSessions] = useState({});
  const [modalLiveVisible, setModalLiveVisible] = useState(false);
  const [sessionLiveSeleccionada, setSessionLiveSeleccionada] = useState(null);
  
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [mostrarModalCalculadora, setMostrarModalCalculadora] = useState(false);

  useEffect(() => {
    if (listaClientes.length > 0) {
      const coachId = listaClientes[0].entrenador_id;
      if (!coachId) return;

      const socket = io('https://backend-entrenadores-production.up.railway.app');
      
      socket.on('connect', () => {
        socket.emit('unirse_como_coach', coachId);
      });

      socket.on('cliente_entrenando', (data) => {
        setLiveSessions(prev => ({ ...prev, [data.clienteId]: { status: 'entrenando', data, updates: [] } }));
        mostrarAlerta(`🔴 ${data.clienteNombre} ha comenzado a entrenar`, 'exito');
      });

      socket.on('progreso_en_vivo', (data) => {
        setLiveSessions(prev => {
          const session = prev[data.clienteId];
          if (!session) return prev;
          const newUpdates = [...session.updates];
          const existingIdx = newUpdates.findIndex(u => u.ejercicio === data.ejercicio && u.set === data.set);
          if (existingIdx >= 0) newUpdates[existingIdx] = data;
          else newUpdates.push(data);
          
          if (sessionLiveSeleccionada && sessionLiveSeleccionada.data.clienteId === data.clienteId) {
            setSessionLiveSeleccionada({ ...session, updates: newUpdates });
          }
          return { ...prev, [data.clienteId]: { ...session, updates: newUpdates } };
        });
      });

      socket.on('cliente_termino', (data) => {
        setLiveSessions(prev => {
          const newSessions = { ...prev };
          delete newSessions[data.clienteId];
          return newSessions;
        });
        mostrarAlerta(`✅ ${data.clienteNombre} ha terminado su rutina`, 'exito');
        setModalLiveVisible(false);
      });

      return () => socket.disconnect();
    }
  }, [listaClientes]);

  const rutinasDelCliente = clienteSeleccionado ? todasLasRutinas.filter(r => r.cliente_id === clienteSeleccionado.id) : [];
  const emojisGym = ['🏋️‍♂️', '💪', '🔥', '⚡', '🦍', '🥇', '🦾'];

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!clienteSeleccionado) setRutinaEnProgreso(null); }, [clienteSeleccionado]);

  const cargarExpediente = async (cliente_id) => {
    try {
      const token = await usuarioActual.getIdToken();
      const headersSeguros = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      const resNotas = await fetch(`https://backend-entrenadores-production.up.railway.app/api/notas/${cliente_id}`, { headers: headersSeguros });
      if(resNotas.ok) setNotasCliente(await resNotas.json());

      const resVolumen = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/volumen/${cliente_id}`, { headers: headersSeguros });
      if(resVolumen.ok) setVolumenSemanal(await resVolumen.json());

      const resFeedback = await fetch(`https://backend-entrenadores-production.up.railway.app/api/progreso/feedback/${cliente_id}`, { headers: headersSeguros });
      if(resFeedback.ok) setFeedbackCliente(await resFeedback.json());

      const resRecientes = await fetch(`https://backend-entrenadores-production.up.railway.app/api/progreso/global/${cliente_id}`, { headers: headersSeguros });
      if(resRecientes.ok) setEntrenamientosRecientes(await resRecientes.json());

      const resFotos = await fetch(`https://backend-entrenadores-production.up.railway.app/api/fotos/${cliente_id}`, { headers: headersSeguros });
      if(resFotos.ok) setFotosCliente(await resFotos.json());

      // Semáforo de Fatiga
      try {
        const resFatiga = await fetch(`https://backend-entrenadores-production.up.railway.app/api/metricas/semaforo-fatiga/${cliente_id}`, { headers: headersSeguros });
        if(resFatiga.ok) setSemaforoFatiga(await resFatiga.json());
        else setSemaforoFatiga(null);
      } catch (e) { setSemaforoFatiga(null); }
    } catch (error) { console.error("Error", error); }
  };

  const handleGenerarPDF = async () => {
    if (!esPro) return mostrarAlerta("Esta función es exclusiva del Plan PRO", "error");
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(`Reporte de Desempeño`, 20, 20);
      doc.setFontSize(16);
      doc.text(`Atleta: ${clienteSeleccionado.nombre}`, 20, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 40);
      
      if (entrenamientosRecientes.length > 0) {
         doc.setFont("helvetica", "bold");
         doc.text(`Últimas Sesiones de Entrenamiento:`, 20, 60);
         doc.setFont("helvetica", "normal");
         let y = 70;
         entrenamientosRecientes.forEach((ent) => {
            doc.text(`• ${new Date(ent.fecha).toLocaleDateString()} - ${ent.rutina_nombre || 'Rutina Desconocida'}`, 25, y);
            y += 10;
         });
      }

      doc.save(`Reporte_Kaizen_${clienteSeleccionado.nombre.replace(/\s+/g, '_')}.pdf`);
      mostrarAlerta("Reporte PDF generado exitosamente 📄", "exito");
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al generar PDF", "error");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (clienteSeleccionado) { cargarExpediente(clienteSeleccionado.id); setTabNotas('coach'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado]);

  const handleGuardarNota = async () => {
    if (!nuevaNota.mensaje) return mostrarAlerta("El mensaje no puede estar vacío", "error");
    try {
      const token = await usuarioActual.getIdToken(); // 🛡️ OBTENEMOS TOKEN SEGURO
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/notas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` // 🛡️ ENVIAMOS TOKEN
        },
        body: JSON.stringify({ cliente_id: clienteSeleccionado.id, categoria: nuevaNota.categoria, mensaje: nuevaNota.mensaje })
      });
      if (res.ok) {
        mostrarAlerta("Bitácora actualizada 📝", "exito");
        setMostrarModalNota(false); setNuevaNota({ categoria: 'General', mensaje: '' }); 
        cargarExpediente(clienteSeleccionado.id); 
      }
    } catch (e) { mostrarAlerta("Error al guardar", "error"); console.error(e); }
  };

  const handleGuardarCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.email) return mostrarAlerta("Nombre y correo son obligatorios", "error");
    mostrarAlerta("Creando cuenta y verificando plan...", "exito");

    try {
      const token = await usuarioActual.getIdToken(); // 🛡️ OBTENEMOS TOKEN SEGURO
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/clientes', {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` // 🛡️ ENVIAMOS TOKEN AL BACKEND
        }, 
        body: JSON.stringify(nuevoCliente)
      });
      
      const data = await res.json();

      // 🛑 EL MURO DE PAGO DESDE EL BACKEND (Si el backend dice que llegamos al límite de 4)
      if (res.status === 402) {
        return alert(`🔒 LÍMITE ALCANZADO\n\n${data.mensaje}`);
      }

      if (res.ok) {
        // 📧 CORREO AUTOMÁTICO DE FIREBASE
        try {
          await sendPasswordResetEmail(auth, nuevoCliente.email);
          alert(`✅ ¡Cuenta creada!\n\nSe ha enviado un correo automático a ${nuevoCliente.email} para que cree su propia contraseña y descargue la app.`);
        } catch(mailError) {
          console.error(mailError);
          alert(`✅ Cuenta creada.\n\nPásale esta clave temporal: ${data.password_temporal}`);
        }
        
        setMostrarModalCliente(false); setNuevoCliente({ nombre: '', email: '', objetivo: '' }); 
        cargarDatos(); 
      } else { mostrarAlerta(data.error || "Error", "error"); }
    } catch (e) { mostrarAlerta("Error de conexión", "error"); console.error(e); }
  };

  const abrirParaAnotar = (rutina) => { setModoEstacion('registro'); setRutinaEnProgreso(rutina); };
  const abrirParaAnalizar = (rutina) => { setModoEstacion('analisis'); setRutinaEnProgreso(rutina); };

  const getEstiloNota = (categoria) => {
    switch(categoria) {
      case 'Lesión': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🚨' };
      case 'Salud': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '🩺' };
      case 'Nutrición': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '🍏' };
      case 'Motivación': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: '🧠' };
      default: return { color: 'text-zinc-300', bg: 'bg-zinc-800', border: 'border-zinc-700', icon: '📝' }; 
    }
  };

  const feedbackUnico = feedbackCliente.filter((fb, idx, arr) => 
    idx === arr.findIndex(t => t.ejercicio_nombre === fb.ejercicio_nombre && t.notas_cliente === fb.notas_cliente)
  );

  return (
    <>
      {!clienteSeleccionado && !rutinaEnProgreso && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-8">
            <div><h2 className="text-2xl font-black text-white mb-2">Mis Clientes</h2><p className="text-zinc-400 text-sm">Gestiona el progreso de tus atletas.</p></div>
            <button onClick={intentarNuevoCliente} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 shadow-lg"><span className="text-sm">➕</span> Nuevo Cliente</button>
          </div>
          
          {listaClientes.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center text-3xl mb-4">👥</div>
              <h3 className="text-zinc-300 font-bold text-lg mb-2">Tu lista está vacía</h3>
              <button onClick={intentarNuevoCliente} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 mt-4 shadow-lg">Agregar Primer Cliente</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listaClientes.map((cliente) => (
                <div key={cliente.id} onClick={() => setClienteSeleccionado(cliente)} className={`bg-zinc-900/60 border ${liveSessions[cliente.id] ? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-zinc-800 hover:border-emerald-500/50'} transition-all duration-300 rounded-2xl p-6 flex flex-col shadow-lg cursor-pointer group relative`}>
                  {liveSessions[cliente.id] && (
                     <div className="absolute -top-3 -right-3 bg-red-600 animate-bounce text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 border-2 border-zinc-900">🔴 EN VIVO</div>
                  )}
                  <div className="w-14 h-14 bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner">{cliente.nombre.charAt(0).toUpperCase()}</div>
                  <h3 className="text-xl font-black text-white mb-1">{cliente.nombre}</h3>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold mb-4 flex-1">🎯 Obj: <span className="text-zinc-300 normal-case font-normal">{cliente.objetivo || 'General'}</span></p>
                  
                  {liveSessions[cliente.id] ? (
                    <button onClick={(e) => { e.stopPropagation(); setSessionLiveSeleccionada(liveSessions[cliente.id]); setModalLiveVisible(true); }} className="w-full mt-auto bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg shadow-red-600/20">👁️ Ver Entreno en Vivo</button>
                  ) : (
                    <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4"><span className="text-xs text-zinc-500 flex items-center gap-1">🟢 Activo</span><span className="text-emerald-400 text-sm font-bold group-hover:translate-x-1 transition-transform">Ver perfil &rarr;</span></div>
                  )}
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
            {/* PANEL IZQUIERDO: INFO DEL CLIENTE */}
            <div className="lg:w-1/3 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-zinc-800 pb-6 lg:pb-0 lg:pr-8">
              <div className="flex items-center gap-5 mb-2">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl font-black text-zinc-900 shadow-lg shrink-0">{clienteSeleccionado.nombre.charAt(0).toUpperCase()}</div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1 leading-tight">{clienteSeleccionado.nombre}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">🟢 Activo</span>
                    {semaforoFatiga && (
                      <span title={semaforoFatiga.recomendacion} className={`text-[10px] font-black px-2 py-0.5 rounded-full border cursor-help transition ${
                        semaforoFatiga.estado === 'Verde' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        semaforoFatiga.estado === 'Amarillo' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {semaforoFatiga.estado === 'Verde' ? '🟢' : semaforoFatiga.estado === 'Amarillo' ? '🟡' : '🔴'} Fatiga: {100 - semaforoFatiga.puntuacion}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Objetivo Principal</p>
                <p className="text-sm font-medium text-zinc-300">🎯 {clienteSeleccionado.objetivo || 'Sin objetivo específico'}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner flex-1 flex flex-col mt-2">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 flex justify-between items-center"><span>Volumen (Últimos 7 días)</span><span className="text-emerald-500 text-xs">📊</span></p>
                {volumenSemanal.length === 0 ? ( <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs text-center px-4">Aún no hay series registradas esta semana.</div>) : (
                  <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {volumenSemanal.map((item, idx) => {
                      const colorSemaforo = !esPro ? 'bg-blue-500' : (item.semaforo === 'Rojo' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : item.semaforo === 'Amarillo' ? 'bg-amber-500' : 'bg-emerald-500');
                      const colorTexto = !esPro ? 'text-blue-400' : (item.semaforo === 'Rojo' ? 'text-red-400' : item.semaforo === 'Amarillo' ? 'text-amber-400' : 'text-emerald-400');
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-zinc-300">{item.grupo_muscular || 'General'}</span>
                            <span className={colorTexto}>{item.total_series} series</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div className={`${colorSemaforo} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min((item.total_series / 20) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DERECHO: BITÁCORA */}
            <div className="lg:w-2/3 flex flex-col h-96">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shadow-inner">
                  <button onClick={() => setTabNotas('coach')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${tabNotas === 'coach' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>👨‍🏫 Bitácora Médica</button>
                  <button onClick={() => setTabNotas('cliente')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${tabNotas === 'cliente' ? 'bg-zinc-800 text-emerald-400 shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>🗣️ Feedback Cliente</button>
                  <button onClick={() => setTabNotas('progreso')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${tabNotas === 'progreso' ? 'bg-zinc-800 text-blue-400 shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>📸 Fotos y Avances</button>
                </div>
                {tabNotas === 'coach' && ( <button onClick={() => setMostrarModalNota(true)} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">➕ Agregar Nota</button> )}
              </div>
              
              <div className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 overflow-y-auto custom-scrollbar relative shadow-inner">
                {tabNotas === 'coach' ? (
                  notasCliente.length === 0 ? ( <div className="h-full flex flex-col items-center justify-center text-center opacity-50"><span className="text-3xl mb-2">📇</span><p className="text-sm font-bold text-zinc-400">El expediente está vacío</p><p className="text-xs text-zinc-500">Registra lesiones o notas.</p></div> ) : (
                    <div className="space-y-4 relative">
                      <div className="absolute left-4 top-2 bottom-2 w-px bg-zinc-800 z-0"></div>
                      {notasCliente.map((nota) => {
                        const estilo = getEstiloNota(nota.categoria);
                        return (
                          <div key={nota.id} className="relative z-10 flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border shadow-lg shrink-0 mt-1 ${estilo.bg} ${estilo.border}`}>{estilo.icon}</div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex-1 hover:border-zinc-700 transition">
                              <div className="flex justify-between items-start mb-1"><span className={`text-[10px] font-black uppercase tracking-wider ${estilo.color}`}>{nota.categoria}</span><span className="text-[10px] text-zinc-500 font-medium">{new Date(nota.fecha_creacion).toLocaleDateString()}</span></div>
                              <p className="text-sm text-zinc-300 leading-relaxed">{nota.mensaje}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : tabNotas === 'progreso' ? (
                  <div className="flex flex-col h-full space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><span>📸</span> Fotos de Progreso</h3>
                      {fotosCliente.length === 0 ? (
                         <div className="text-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed"><p className="text-xs text-zinc-500">El cliente no ha subido fotos.</p></div>
                      ) : (
                         <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                           {fotosCliente.map((foto) => (
                              <div key={foto.id} className="min-w-[120px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                                 <img src={foto.url_foto} alt="Progreso" className="w-[120px] h-[160px] object-cover" />
                                 <div className="p-2 text-center bg-zinc-950">
                                   <p className="text-[10px] text-zinc-400 font-bold">{new Date(foto.fecha_captura).toLocaleDateString()}</p>
                                 </div>
                              </div>
                           ))}
                         </div>
                      )}
                    </div>

                    <div className="flex-1"></div>
                    {esPro && (
                      <div className="mt-auto pt-4 border-t border-zinc-800">
                        <button onClick={handleGenerarPDF} className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm">
                          <span>📄</span> Generar Reporte PDF
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  feedbackUnico.length === 0 ? ( <div className="h-full flex flex-col items-center justify-center text-center opacity-50"><span className="text-3xl mb-2">🗣️</span><p className="text-sm font-bold text-zinc-400">Aún no hay feedback</p></div> ) : (
                    <div className="space-y-3">
                      {feedbackUnico.map((fb, idx) => (
                           <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col hover:border-emerald-500/50 transition duration-300 animate-in fade-in slide-in-from-right-2">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span><span className="text-xs font-black text-white">{fb.ejercicio_nombre}</span></div>
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md">{new Date(fb.fecha).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-zinc-300 italic border-l-2 border-emerald-500 pl-3 py-1 bg-zinc-950/30 rounded-r-lg">"{fb.notas_cliente}"</p>
                           </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 🌟 AQUÍ INYECTAMOS EL LIENZO ANALÍTICO PRO */}
          <LienzoAnalitico 
             esPro={esPro} 
             setMostrarPaywall={setMostrarPaywall} 
             cliente={clienteSeleccionado} 
             volumenSemanal={volumenSemanal} 
             usuarioActual={usuarioActual} 
             entrenamientosRecientes={entrenamientosRecientes}
             rutinasDelCliente={rutinasDelCliente}
             abrirParaAnalizar={abrirParaAnalizar}
             planDeEntrenamientoJSX={
               <div className="flex flex-col gap-4">
                 <div className="flex gap-4">
                   <button onClick={() => setMostrarModalHistorial(true)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/50 text-white py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500">
                      <span>🏆</span> Centro de Rendimiento
                   </button>
                   <button onClick={() => setMostrarModalCalculadora(true)} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-500/50 text-white py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500">
                      <span>🧮</span> Calculadora
                   </button>
                 </div>
                 {rutinasDelCliente.map(rutina => (
                   <div key={rutina.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-lg animate-in zoom-in duration-300 hover:border-emerald-500/50 transition-all">
                     <div className="flex justify-between items-center mb-3">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-xl">{emojisGym[rutina.id % emojisGym.length]}</div>
                         <h3 className="text-lg font-black text-white line-clamp-1">{rutina.nombre}</h3>
                       </div>
                     </div>
                     <div className="flex flex-col gap-2 mt-2">
                       <button onClick={() => abrirParaAnotar(rutina)} className="w-full bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 py-2.5 rounded-xl font-bold transition text-xs shadow-lg flex items-center justify-center gap-2"><span>📝</span> Anotar Hoy</button>
                       <div className="flex gap-2">
                         <button onClick={() => abrirConstructor(rutina)} className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white py-2 rounded-xl font-bold transition text-xs" title="Editar Plantilla">✏️ Editar</button>
                         <button onClick={() => handleEliminarRutina(rutina.id)} className="w-12 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 py-2 rounded-xl font-bold transition flex items-center justify-center" title="Eliminar Plan">✕</button>
                       </div>
                     </div>
                   </div>
                 ))}
                 <button onClick={() => setMostrarModalAsignar(true)} className="border-2 border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 rounded-2xl p-4 flex items-center justify-center font-bold transition gap-2"><span className="text-xl">+</span> Asignar plan</button>
               </div>
             }
          />
        </div>
      )}

      {clienteSeleccionado && rutinaEnProgreso && (<EstacionProgreso cliente={clienteSeleccionado} rutina={rutinaEnProgreso} onVolver={() => setRutinaEnProgreso(null)} mostrarAlerta={mostrarAlerta} vistaInicial={modoEstacion} usuarioActual={usuarioActual} />)}

      <ModalNuevaNota 
        mostrarModalNota={mostrarModalNota} setMostrarModalNota={setMostrarModalNota} 
        nuevaNota={nuevaNota} setNuevaNota={setNuevaNota} handleGuardarNota={handleGuardarNota} 
      />

      <ModalAsignarPlantilla 
        mostrarModalAsignar={mostrarModalAsignar} setMostrarModalAsignar={setMostrarModalAsignar} 
        listaRutinas={listaRutinas} handleClonarRutina={handleClonarRutina} clienteSeleccionado={clienteSeleccionado} 
      />

      <ModalNuevoCliente 
        mostrarModalCliente={mostrarModalCliente} setMostrarModalCliente={setMostrarModalCliente} 
        nuevoCliente={nuevoCliente} setNuevoCliente={setNuevoCliente} handleGuardarCliente={handleGuardarCliente} 
      />

      <ModalCoachboardLive 
        modalLiveVisible={modalLiveVisible} setModalLiveVisible={setModalLiveVisible} 
        sessionLiveSeleccionada={sessionLiveSeleccionada} 
      />

      <ModalCentroRendimiento 
        mostrarModalHistorial={mostrarModalHistorial} setMostrarModalHistorial={setMostrarModalHistorial} 
        rutinasDelCliente={rutinasDelCliente} 
        mostrarAlerta={mostrarAlerta} 
        cliente={clienteSeleccionado} usuarioActual={usuarioActual} catalogoEjercicios={catalogoEjercicios}
      />

      <ModalCalculadora 
        mostrarModalCalculadora={mostrarModalCalculadora} setMostrarModalCalculadora={setMostrarModalCalculadora}
        cliente={clienteSeleccionado} usuarioActual={usuarioActual} catalogoEjercicios={catalogoEjercicios}
      />
    </>
  );
}