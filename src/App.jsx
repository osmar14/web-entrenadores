import { useState, useEffect } from 'react'
import Login from './vistas/Login';
import Inicio from './vistas/Inicio'
import Clientes from './vistas/Clientes'

import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const [totalClientes, setTotalClientes] = useState(0)
  const [totalRutinas, setTotalRutinas] = useState(0)
  const [listaRutinas, setListaRutinas] = useState([]) 
  const [todasLasRutinas, setTodasLasRutinas] = useState([]) 
  
  const [listaClientes, setListaClientes] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  
  const [catalogoEjercicios, setCatalogoEjercicios] = useState([])
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null)
  const [filtroMusculo, setFiltroMusculo] = useState('Todos')
  const [ejerciciosEnRutina, setEjerciciosEnRutina] = useState([]) 
  const [vistaActiva, setVistaActiva] = useState('inicio') 

  const [diasPlan, setDiasPlan] = useState(['Día 1'])
  const [diaActivo, setDiaActivo] = useState('Día 1')

  const [mostrarModal, setMostrarModal] = useState(false)
  const [pasoModal, setPasoModal] = useState('formulario')
  const [nuevaRutina, setNuevaRutina] = useState({ id: null, nombre: '', descripcion: '', nivel: 'Principiante' })

  const [notificacion, setNotificacion] = useState(null); 
  const [confirmacion, setConfirmacion] = useState(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      setUsuarioActual(usuario);
      setVerificandoSesion(false); 
    });
    return () => unsubscribe();
  }, []);

  const obtenerNombreUsuario = () => {
    if (!usuarioActual?.email) return 'Entrenador';
    let nombre = usuarioActual.email.split('@')[0];
    nombre = nombre.replace(/[0-9]/g, '');
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  };

  const mostrarAlerta = (mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 3000); 
  };

  const cargarDatos = () => {
    if (!usuarioActual) return; 

    const headersSeguros = {
      'Content-Type': 'application/json',
      'usuario-email': usuarioActual.email 
    };

    fetch('https://backend-entrenadores-production.up.railway.app/api/clientes', { headers: headersSeguros })
      .then(res => res.json())
      .then(datos => {
          if (Array.isArray(datos)) {
              setTotalClientes(datos.length); 
              setListaClientes(datos); 
          }
      }).catch(e => console.error(e));

    fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', { headers: headersSeguros })
      .then(res => res.json())
      .then(datos => {
          if (Array.isArray(datos)) {
              setTodasLasRutinas(datos); 
              const plantillas = datos.filter(r => r.es_plantilla === 1); 
              setTotalRutinas(plantillas.length); 
              setListaRutinas(plantillas); 
          } else {
              mostrarAlerta(datos.error || "Error de permisos", "error");
          }
      }).catch(e => console.error(e));

    fetch('https://backend-entrenadores-production.up.railway.app/api/ejercicios')
      .then(res => res.json())
      .then(datos => {
          if (Array.isArray(datos)) setCatalogoEjercicios(datos);
      }).catch(e => console.error(e));
  }

  useEffect(() => { 
    if (usuarioActual) cargarDatos();
  }, [usuarioActual]);

  const handleClonarRutina = async (plantilla_id, cliente_id) => {
    try {
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas/clonar', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'usuario-email': usuarioActual.email }, 
        body: JSON.stringify({ plantilla_id, cliente_id })
      });
      if (res.ok) { mostrarAlerta("Plan asignado exitosamente al cliente 🪄", "exito"); cargarDatos(); } 
    } catch (e) { mostrarAlerta("Hubo un error de conexión", "error"); }
  }

  const handleEliminarRutina = (rutina_id) => {
    setConfirmacion({
      mensaje: "¿Estás seguro de eliminar este plan? Esta acción destruirá todos los datos y no se puede deshacer.",
      onConfirm: async () => {
        try {
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rutinas/${rutina_id}`, { 
            method: 'DELETE',
            headers: { 'usuario-email': usuarioActual.email }
          });
          if (res.ok) { mostrarAlerta("Plan eliminado con éxito 🗑️", "exito"); setVistaActiva('rutinas'); cargarDatos(); }
        } catch (e) { console.error(e); }
        setConfirmacion(null); 
      }
    });
  }

  const abrirConstructor = async (rutina) => {
    setRutinaSeleccionada(rutina); 
    setVistaActiva('constructor');
    
    try {
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios/${rutina.id}`);
      const datosCargados = await res.json();
      
      if (datosCargados.length > 0) {
        const ejerciciosRecuperados = datosCargados.map(e => ({
          id: e.ejercicio_id, 
          id_unico: e.id, 
          nombre: e.nombre, 
          grupo_muscular: e.grupo_muscular,
          series_objetivo: e.series_objetivo, 
          reps_objetivo: e.reps_objetivo, 
          dia_nombre: e.dia_nombre,
          rir_objetivo: e.rir_objetivo || '',
          notas_entrenador: e.notas_entrenador || '' // 🌟 CARGAMOS LA NOTA DESDE LA BD
        }));
        setEjerciciosEnRutina(ejerciciosRecuperados);
        const diasUnicos = [...new Set(ejerciciosRecuperados.map(e => e.dia_nombre))];
        setDiasPlan(diasUnicos.length > 0 ? diasUnicos : ['Día 1']);
        setDiaActivo(diasUnicos.length > 0 ? diasUnicos[0] : 'Día 1');
      } else {
        setEjerciciosEnRutina([]); 
        setDiasPlan(['Día 1']); 
        setDiaActivo('Día 1');
      }
    } catch (error) { 
      console.error("Error al cargar ejercicios:", error); 
    }
  }

  const handleGuardarRutina = async () => {
    if (!nuevaRutina.nombre) return mostrarAlerta("¡El nombre de la plantilla es obligatorio!", "error");
    try {
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'usuario-email': usuarioActual.email }, 
        body: JSON.stringify(nuevaRutina) 
      });
      const data = await res.json(); 
      
      if (res.ok) { 
        setNuevaRutina({ ...nuevaRutina, id: data.id }); 
        setPasoModal('exito'); 
        cargarDatos(); 
      }
    } catch (e) { mostrarAlerta("Error al guardar rutina", "error"); }
  }

  const handleGuardarPlanDeVuelo = async () => {
    try {
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ rutina_id: rutinaSeleccionada.id, ejercicios: ejerciciosEnRutina })
      });
      if (res.ok) { mostrarAlerta("¡Plan de vuelo guardado en la bóveda! 🚀", "exito"); setVistaActiva(rutinaSeleccionada.cliente_id ? 'clientes' : 'rutinas'); }
    } catch (e) { mostrarAlerta("Error al guardar el plan", "error"); }
  }

  const gruposMusculares = ['Todos', ...new Set(catalogoEjercicios.map(e => e.grupo_muscular || 'General'))]
  const ejerciciosFiltrados = filtroMusculo === 'Todos' ? catalogoEjercicios : catalogoEjercicios.filter(e => (e.grupo_muscular || 'General') === filtroMusculo)
  
  // 🌟 AGREGAMOS LA NOTA VACÍA AL CREAR UN EJERCICIO NUEVO
  const agregarAlConstructor = (ejercicio) => { 
    setEjerciciosEnRutina([...ejerciciosEnRutina, { ...ejercicio, id_unico: Date.now(), series_objetivo: 3, reps_objetivo: '10', dia_nombre: diaActivo, rir_objetivo: '', notas_entrenador: '' }]) 
  }
  
  const quitarDelConstructor = (id_unico) => setEjerciciosEnRutina(ejerciciosEnRutina.filter(e => e.id_unico !== id_unico))
  const actualizarEjercicio = (id_unico, campo, valor) => setEjerciciosEnRutina(ejerciciosEnRutina.map(e => e.id_unico === id_unico ? { ...e, [campo]: valor } : e))
  
  const agregarNuevoDia = () => { 
    const nuevoNombre = prompt("Nombre de la sesión (ej. Pecho, Pierna, Día 1):");
    if (!nuevoNombre || nuevoNombre.trim() === "") return;
    if (diasPlan.includes(nuevoNombre.trim())) return mostrarAlerta("Ese día ya existe", "error");
    
    setDiasPlan([...diasPlan, nuevoNombre.trim()]); 
    setDiaActivo(nuevoNombre.trim()); 
  }

  const renombrarDiaActivo = () => {
    const nuevoNombre = prompt(`Renombrar "${diaActivo}" a:`, diaActivo);
    if (!nuevoNombre || nuevoNombre.trim() === "" || nuevoNombre === diaActivo) return;
    if (diasPlan.includes(nuevoNombre.trim())) return mostrarAlerta("Ese nombre ya existe", "error");
    
    const nombreLimpio = nuevoNombre.trim();
    setDiasPlan(diasPlan.map(d => d === diaActivo ? nombreLimpio : d));
    setEjerciciosEnRutina(ejerciciosEnRutina.map(e => e.dia_nombre === diaActivo ? { ...e, dia_nombre: nombreLimpio } : e));
    setDiaActivo(nombreLimpio);
  }

  const eliminarDiaActivo = () => {
    if (diasPlan.length === 1) return mostrarAlerta("La rutina debe tener al menos un día", "error");
    if (!window.confirm(`¿Seguro que deseas eliminar "${diaActivo}" y todos sus ejercicios?`)) return;
    
    const nuevosDias = diasPlan.filter(d => d !== diaActivo);
    setDiasPlan(nuevosDias);
    setEjerciciosEnRutina(ejerciciosEnRutina.filter(e => e.dia_nombre !== diaActivo));
    setDiaActivo(nuevosDias[0]);
  }
  
  const ejerciciosDelDia = ejerciciosEnRutina.filter(e => e.dia_nombre === diaActivo)

  if (verificandoSesion) return (<div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-emerald-500"><div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl flex items-center justify-center text-3xl font-black text-white border border-zinc-700 animate-pulse mb-4">C</div><p className="font-bold text-zinc-400 tracking-widest animate-pulse">CARGANDO IMPERIO...</p></div>);

  if (!usuarioActual) return <Login onLogin={() => {}} />;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative">
      <aside className="hidden md:flex w-64 bg-zinc-900/50 border-r border-zinc-800 flex-col p-6 backdrop-blur-xl shrink-0 z-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"><span className="text-xl font-black text-white">C</span></div>
          <h2 className="text-2xl font-black text-white">Coach<span className="text-blue-500">board</span></h2>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => { setVistaActiva('inicio'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${vistaActiva === 'inicio' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}><span className="text-xl">🏠</span> Inicio</button>
          <button onClick={() => { setVistaActiva('clientes'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${vistaActiva === 'clientes' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}><span className="text-xl">👥</span> Mis Clientes</button>
          <button onClick={() => { setVistaActiva('rutinas'); setClienteSeleccionado(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${(vistaActiva === 'rutinas' || vistaActiva === 'constructor') ? 'bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20' : 'text-zinc-400 font-semibold hover:bg-zinc-800'}`}><span className="text-xl">📋</span> Rutinas</button>
        </nav>

        <button onClick={() => signOut(auth)} className="mt-auto flex items-center justify-center gap-2 p-3 rounded-xl transition text-red-400 font-semibold border border-red-500/20 hover:bg-red-500/10 bg-red-500/5"><span>🚪</span> Cerrar Sesión</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full relative pb-24 md:pb-8">
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div><p className="text-emerald-400 font-medium mb-1">Tu imperio te espera</p><h1 className="text-3xl font-extrabold text-white">Hola, {obtenerNombreUsuario()} 👋</h1></div>
          <div className="flex items-center gap-3"><button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 shadow-lg"><span className="text-sm">➕</span> Crear</button></div>
        </header>

        {vistaActiva === 'inicio' && <Inicio totalClientes={totalClientes} totalRutinas={totalRutinas} usuarioActual={usuarioActual} listaClientes={listaClientes} cargarDatos={cargarDatos} />}
        {vistaActiva === 'clientes' && <Clientes listaClientes={listaClientes} clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado} listaRutinas={listaRutinas} todasLasRutinas={todasLasRutinas} handleClonarRutina={handleClonarRutina} abrirConstructor={abrirConstructor} handleEliminarRutina={handleEliminarRutina} cargarDatos={cargarDatos} mostrarAlerta={mostrarAlerta} usuarioActual={usuarioActual} />}

        {vistaActiva === 'rutinas' && (
          <div className="mt-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div><h2 className="text-2xl font-black text-white mb-2">Librería Maestra</h2></div>
              <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-500"><span className="text-sm">➕</span> Nueva Plantilla</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {listaRutinas.map((rutina) => (
                <div key={rutina.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEliminarRutina(rutina.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg" title="Eliminar Plantilla">🗑️</button>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 pr-8">{rutina.nombre}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-1">{rutina.descripcion || 'Sin descripción'}</p>
                  <button onClick={() => abrirConstructor(rutina)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-blue-500 py-3 rounded-xl font-bold transition flex justify-center gap-2"><span>⚙️</span> Editar Ejercicios</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {vistaActiva === 'constructor' && rutinaSeleccionada && (
          <div className="mt-4 animate-in fade-in h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <button onClick={() => setVistaActiva(rutinaSeleccionada.cliente_id ? 'clientes' : 'rutinas')} className="text-zinc-500 hover:text-zinc-300 font-medium text-sm flex items-center gap-2 mb-3 transition">&larr; Volver</button>
                <h2 className="text-3xl font-black text-white">Editando: <span className="text-blue-400">{rutinaSeleccionada.nombre}</span></h2>
              </div>
              <button onClick={handleGuardarPlanDeVuelo} className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 shadow-lg">Guardar Plan 🚀</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
              <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900">
                  <h3 className="text-white font-bold mb-3">📚 Catálogo ({ejerciciosFiltrados.length})</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {gruposMusculares.map(grupo => (
                      <button key={grupo} onClick={() => setFiltroMusculo(grupo)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filtroMusculo === grupo ? 'bg-blue-500 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}>{grupo}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {ejerciciosFiltrados.map(ejercicio => (
                    <div key={ejercicio.id} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                      <div><p className="text-sm font-bold text-zinc-200">{ejercicio.nombre}</p><p className="text-[10px] text-zinc-500 uppercase">{ejercicio.grupo_muscular}</p></div>
                      <button onClick={() => agregarAlConstructor(ejercicio)} className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:bg-emerald-500 hover:text-white font-bold">+</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col p-6`}>
                 <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                   <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1">
                      {diasPlan.map(dia => (
                        <button key={dia} onClick={() => setDiaActivo(dia)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${diaActivo === dia ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 bg-zinc-900 hover:bg-zinc-800'}`}>{dia}</button>
                      ))}
                      <button onClick={agregarNuevoDia} className="px-3 py-2 rounded-xl font-bold text-sm text-emerald-400 hover:bg-emerald-500/10 transition flex items-center gap-1 whitespace-nowrap"><span>+</span> Nuevo Día</button>
                   </div>
                   
                   <div className="flex items-center gap-1 pl-4 ml-4 border-l border-zinc-800 shrink-0">
                     <button onClick={renombrarDiaActivo} className="p-2 text-zinc-400 hover:text-blue-400 bg-zinc-900 hover:bg-blue-500/10 rounded-lg transition" title="Renombrar Día">✏️</button>
                     <button onClick={eliminarDiaActivo} className="p-2 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 rounded-lg transition" title="Eliminar Día">🗑️</button>
                   </div>
                 </div>

                 {ejerciciosDelDia.length === 0 ? (
                   <div className="text-center py-10">
                     <h3 className="text-xl font-bold text-white mb-2">{diaActivo} está vacío</h3>
                     <p className="text-zinc-500 text-sm">Busca en el catálogo y agrega ejercicios para esta sesión.</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
                     {ejerciciosDelDia.map((ejercicio, index) => (
                       <div key={ejercicio.id_unico} className="grid grid-cols-12 gap-4 items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                         <div className="col-span-1 text-center font-black text-zinc-600">{index + 1}</div>

                         {/* 🌟 AQUÍ ESTÁ EL INPUT DE LA NOTA DEL ENTRENADOR 🌟 */}
                         <div className="col-span-4 flex flex-col justify-center">
                           <p className="font-bold text-zinc-200 text-sm line-clamp-1">{ejercicio.nombre}</p>
                           <input 
                             type="text" 
                             placeholder="Nota (Ej. Bajar lento...)" 
                             value={ejercicio.notas_entrenador || ''} 
                             onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'notas_entrenador', e.target.value)} 
                             className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 text-emerald-400 text-[10px] font-bold rounded-md px-2 py-1.5 focus:border-emerald-500 outline-none placeholder-zinc-700 transition" 
                           />
                         </div>
                         
                         <div className="col-span-2 flex flex-col items-center">
                           <span className="text-[9px] text-zinc-500 uppercase mb-1">Series</span>
                           <input type="number" value={ejercicio.series_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'series_objetivo', e.target.value)} className="w-14 bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-1 text-sm focus:border-blue-500 focus:outline-none" />
                         </div>
                         <div className="col-span-2 flex flex-col items-center">
                           <span className="text-[9px] text-zinc-500 uppercase mb-1">Reps</span>
                           <input type="text" value={ejercicio.reps_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'reps_objetivo', e.target.value)} placeholder="Ej. 10" className="w-16 bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-1 text-sm focus:border-blue-500 focus:outline-none" />
                         </div>
                         <div className="col-span-2 flex flex-col items-center">
                           <span className="text-[9px] text-zinc-500 uppercase font-bold text-emerald-500 mb-1">RIR (Opc)</span>
                           <input type="text" value={ejercicio.rir_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'rir_objetivo', e.target.value)} placeholder="Ej. 1-2" className="w-14 bg-zinc-950 border border-emerald-900 text-emerald-400 text-center rounded-lg py-1 text-sm focus:border-emerald-500 focus:outline-none" />
                         </div>

                         <div className="col-span-1 flex justify-end">
                           <button onClick={() => quitarDelConstructor(ejercicio.id_unico)} className="text-zinc-600 hover:text-red-400 font-bold p-2">✕</button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </main>

      {notificacion && (
        <div className="fixed bottom-8 right-8 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${notificacion.tipo === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <span className="text-xl">{notificacion.tipo === 'exito' ? '✅' : '⚠️'}</span>
            <p className="font-bold text-sm tracking-wide">{notificacion.mensaje}</p>
          </div>
        </div>
      )}

      {confirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-3xl mb-6 mx-auto shadow-inner">⚠️</div>
            <h3 className="text-2xl font-black text-white text-center mb-2">¿Estás seguro?</h3>
            <p className="text-zinc-400 text-center text-sm mb-8">{confirmacion.mensaje}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmacion(null)} className="flex-1 px-5 py-3 rounded-xl font-bold text-zinc-300 hover:bg-zinc-800 transition">Cancelar</button>
              <button onClick={confirmacion.onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/20">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            {pasoModal === 'formulario' ? (
              <>
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-extrabold text-white">Nueva Rutina</h2><button onClick={() => { setMostrarModal(false); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400">✕</button></div>
                <div className="space-y-4">
                  <input type="text" value={nuevaRutina.nombre} onChange={(e) => setNuevaRutina({...nuevaRutina, nombre: e.target.value})} placeholder="Nombre" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3" />
                  <textarea value={nuevaRutina.descripcion} onChange={(e) => setNuevaRutina({...nuevaRutina, descripcion: e.target.value})} placeholder="Descripción" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3"></textarea>
                </div>
                <div className="flex justify-end gap-3 mt-8"><button onClick={() => { setMostrarModal(false); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400">Cancelar</button><button onClick={handleGuardarRutina} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Guardar</button></div>
              </>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-3xl font-black text-white mb-4">¡Creada!</h2>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setMostrarModal(false); setPasoModal('formulario'); abrirConstructor(nuevaRutina); }} className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-bold">Sí, agregar ejercicios</button>
                  <button onClick={() => { setMostrarModal(false); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400">No, después</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App