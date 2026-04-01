import { useState, useEffect } from 'react'
import Login from './vistas/Login';
import Inicio from './vistas/Inicio'
import Clientes from './vistas/Clientes'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

  // 🛡️ 1. CARGAR DATOS BLINDADO
  const cargarDatos = async () => {
    if (!usuarioActual) return; 

    try {
      const token = await usuarioActual.getIdToken();
      const headersSeguros = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const resClientes = await fetch('https://backend-entrenadores-production.up.railway.app/api/clientes', { headers: headersSeguros });
      const datosClientes = await resClientes.json();
      if (Array.isArray(datosClientes)) {
          setTotalClientes(datosClientes.length); 
          setListaClientes(datosClientes); 
      }

      const resRutinas = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', { headers: headersSeguros });
      const datosRutinas = await resRutinas.json();
      if (Array.isArray(datosRutinas)) {
          setTodasLasRutinas(datosRutinas); 
          const plantillas = datosRutinas.filter(r => r.es_plantilla === 1); 
          setTotalRutinas(plantillas.length); 
          setListaRutinas(plantillas); 
      } else {
          mostrarAlerta(datosRutinas.error || "Error de permisos", "error");
      }

      const resEjercicios = await fetch('https://backend-entrenadores-production.up.railway.app/api/ejercicios');
      const datosEjercicios = await resEjercicios.json();
      if (Array.isArray(datosEjercicios)) setCatalogoEjercicios(datosEjercicios);

    } catch (e) { console.error("Error de conexión:", e); }
  }

  useEffect(() => { 
    if (usuarioActual) cargarDatos();
  }, [usuarioActual]);

  // 🛡️ 2. CLONAR RUTINA BLINDADO
  const handleClonarRutina = async (plantilla_id, cliente_id) => {
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas/clonar', {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify({ plantilla_id, cliente_id })
      });
      if (res.ok) { mostrarAlerta("Plan asignado exitosamente al cliente 🪄", "exito"); cargarDatos(); } 
      else { mostrarAlerta("Error al clonar", "error"); }
    } catch (e) { mostrarAlerta("Hubo un error de conexión", "error"); }
  }

  // 🛡️ 3. ELIMINAR RUTINA BLINDADO
  const handleEliminarRutina = (rutina_id) => {
    setConfirmacion({
      mensaje: "¿Estás seguro de eliminar este plan? Esta acción destruirá todos los datos y no se puede deshacer.",
      onConfirm: async () => {
        try {
          const token = await usuarioActual.getIdToken();
          const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rutinas/${rutina_id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) { mostrarAlerta("Plan eliminado con éxito 🗑️", "exito"); setVistaActiva('rutinas'); cargarDatos(); }
        } catch (e) { console.error(e); }
        setConfirmacion(null); 
      }
    });
  }

  // 🛡️ 4. ABRIR CONSTRUCTOR BLINDADO
  const abrirConstructor = async (rutina) => {
    setRutinaSeleccionada(rutina); 
    setVistaActiva('constructor');
    
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios/${rutina.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const datosCargados = await res.json();
      
      if (Array.isArray(datosCargados) && datosCargados.length > 0) {
        const ejerciciosRecuperados = datosCargados.map(e => ({
          id: e.ejercicio_id, 
          id_unico: e.id, 
          nombre: e.nombre, 
          grupo_muscular: e.grupo_muscular,
          series_objetivo: e.series_objetivo, 
          reps_objetivo: e.reps_objetivo, 
          dia_nombre: e.dia_nombre,
          rir_objetivo: e.rir_objetivo || '',
          notas_entrenador: e.notas_entrenador || '' 
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

  // 🛡️ 5. GUARDAR RUTINA (CREAR) BLINDADO
  const handleGuardarRutina = async () => {
    if (!nuevaRutina.nombre) return mostrarAlerta("¡El nombre de la plantilla es obligatorio!", "error");
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify(nuevaRutina) 
      });
      const data = await res.json(); 
      
      if (res.ok) { 
        setNuevaRutina({ ...nuevaRutina, id: data.id }); 
        setPasoModal('exito'); 
        cargarDatos(); 
      } else {
        mostrarAlerta(data.error || "Error del servidor", "error");
      }
    } catch (e) { mostrarAlerta("Error al guardar rutina", "error"); }
  }

  // 🛡️ 6. GUARDAR PLAN DE VUELO (EJERCICIOS) BLINDADO
  const handleGuardarPlanDeVuelo = async () => {
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios', {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify({ rutina_id: rutinaSeleccionada.id, ejercicios: ejerciciosEnRutina })
      });
      if (res.ok) { mostrarAlerta("¡Plan de vuelo guardado en la bóveda! 🚀", "exito"); setVistaActiva(rutinaSeleccionada.cliente_id ? 'clientes' : 'rutinas'); }
    } catch (e) { mostrarAlerta("Error al guardar el plan", "error"); }
  }

  const gruposMusculares = ['Todos', ...new Set(catalogoEjercicios.map(e => e.grupo_muscular || 'General'))]
  const ejerciciosFiltrados = filtroMusculo === 'Todos' ? catalogoEjercicios : catalogoEjercicios.filter(e => (e.grupo_muscular || 'General') === filtroMusculo)
  
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

  const onDragEnd = (result) => {
    // Si lo suelta fuera del área, no hacemos nada
    if (!result.destination) return; 

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Separamos los ejercicios del día actual de los demás días
    const ejerciciosDiaActual = ejerciciosEnRutina.filter(e => e.dia_nombre === diaActivo);
    const ejerciciosOtrosDias = ejerciciosEnRutina.filter(e => e.dia_nombre !== diaActivo);

    // Reordenamos visualmente el arreglo del día actual
    const reordenados = Array.from(ejerciciosDiaActual);
    const [ejercicioMovido] = reordenados.splice(sourceIndex, 1);
    reordenados.splice(destinationIndex, 0, ejercicioMovido);

    // 🌟 INYECCIÓN PRO: Actualizamos la propiedad "orden" basándonos en su nueva posición
    const actualizadosConOrden = reordenados.map((ej, index) => ({
      ...ej,
      orden: index
    }));

    // Juntamos todo de nuevo y actualizamos el estado
    setEjerciciosEnRutina([...ejerciciosOtrosDias, ...actualizadosConOrden]);
  };
  
  const ejerciciosDelDia = ejerciciosEnRutina.filter(e => e.dia_nombre === diaActivo)

  if (verificandoSesion) return (<div className="h-[100dvh] w-full bg-zinc-950 flex flex-col items-center justify-center text-emerald-500"><div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl flex items-center justify-center text-3xl font-black text-white border border-zinc-700 animate-pulse mb-4">C</div><p className="font-bold text-zinc-400 tracking-widest animate-pulse">CARGANDO IMPERIO...</p></div>);

  if (!usuarioActual) return <Login onLogin={() => {}} />;

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* SIDEBAR PC */}
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

      {/* CONTENEDOR PRINCIPAL CON PADDING PARA LA BARRA INFERIOR EN MÓVIL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full relative pb-28 md:pb-8">
        <header className="mb-6 flex flex-row justify-between items-center gap-4">
          <div><p className="text-emerald-400 font-medium mb-1 text-sm md:text-base">Tu imperio te espera</p><h1 className="text-2xl md:text-3xl font-extrabold text-white">Hola, {obtenerNombreUsuario()} 👋</h1></div>
          <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="bg-emerald-500 text-zinc-950 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 shadow-lg shrink-0"><span className="hidden md:inline text-sm">➕</span><span className="md:hidden text-lg">➕</span> <span className="hidden md:inline">Crear</span></button>
        </header>

        {vistaActiva === 'inicio' && <Inicio totalClientes={totalClientes} totalRutinas={totalRutinas} usuarioActual={usuarioActual} listaClientes={listaClientes} cargarDatos={cargarDatos} />}
        {vistaActiva === 'clientes' && <Clientes listaClientes={listaClientes} clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado} listaRutinas={listaRutinas} todasLasRutinas={todasLasRutinas} handleClonarRutina={handleClonarRutina} abrirConstructor={abrirConstructor} handleEliminarRutina={handleEliminarRutina} cargarDatos={cargarDatos} mostrarAlerta={mostrarAlerta} usuarioActual={usuarioActual} />}

        {vistaActiva === 'rutinas' && (
          <div className="mt-4 md:mt-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-8">
              <h2 className="text-2xl font-black text-white">Librería Maestra</h2>
              <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="w-full md:w-auto bg-blue-600 text-white px-4 py-3 md:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500"><span className="text-sm">➕</span> Nueva Plantilla</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {listaRutinas.map((rutina) => (
                <div key={rutina.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col shadow-lg relative group">
                  <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
          <div className="mt-2 animate-in fade-in h-full flex flex-col">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
              <div>
                <button onClick={() => setVistaActiva(rutinaSeleccionada.cliente_id ? 'clientes' : 'rutinas')} className="text-zinc-500 hover:text-zinc-300 font-medium text-sm flex items-center gap-2 mb-2 transition">&larr; Volver</button>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight"><span className="block md:inline text-sm text-zinc-400 font-normal">Editando:</span> <span className="text-blue-400">{rutinaSeleccionada.nombre}</span></h2>
              </div>
              <button onClick={handleGuardarPlanDeVuelo} className="w-full md:w-auto bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 shadow-lg">Guardar Plan 🚀</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 pb-10">
              <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[40vh] md:max-h-full">
                <div className="p-3 md:p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
                  <h3 className="text-white font-bold mb-2 md:mb-3">📚 Catálogo ({ejerciciosFiltrados.length})</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {gruposMusculares.map(grupo => (
                      <button key={grupo} onClick={() => setFiltroMusculo(grupo)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filtroMusculo === grupo ? 'bg-blue-500 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}>{grupo}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {ejerciciosFiltrados.map(ejercicio => (
                    <div key={ejercicio.id} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                      <div><p className="text-sm font-bold text-zinc-200">{ejercicio.nombre}</p><p className="text-[10px] text-zinc-500 uppercase">{ejercicio.grupo_muscular}</p></div>
                      <button onClick={() => agregarAlConstructor(ejercicio)} className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:bg-emerald-500 hover:text-white font-bold shrink-0">+</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col p-3 md:p-6`}>
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6 border-b border-zinc-800 pb-4">
                   <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full md:flex-1 pb-1 md:pb-0">
                      {diasPlan.map(dia => (
                        <button key={dia} onClick={() => setDiaActivo(dia)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${diaActivo === dia ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 bg-zinc-900 hover:bg-zinc-800'}`}>{dia}</button>
                      ))}
                      <button onClick={agregarNuevoDia} className="px-3 py-2 rounded-xl font-bold text-sm text-emerald-400 hover:bg-emerald-500/10 transition flex items-center gap-1 whitespace-nowrap shrink-0"><span>+</span> Nuevo Día</button>
                   </div>
                   
                   <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4 shrink-0 w-full md:w-auto justify-end">
                     <button onClick={renombrarDiaActivo} className="flex-1 md:flex-none p-2 text-zinc-400 hover:text-blue-400 bg-zinc-900 hover:bg-blue-500/10 rounded-lg transition text-center text-sm" title="Renombrar Día">✏️ Renombrar</button>
                     <button onClick={eliminarDiaActivo} className="flex-1 md:flex-none p-2 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 rounded-lg transition text-center text-sm" title="Eliminar Día">🗑️ Eliminar</button>
                   </div>
                 </div>

                 {ejerciciosDelDia.length === 0 ? (
                   <div className="text-center py-10">
                     <h3 className="text-xl font-bold text-white mb-2">{diaActivo} está vacío</h3>
                     <p className="text-zinc-500 text-sm">Busca en el catálogo y agrega ejercicios para esta sesión.</p>
                   </div>
                 ) : (
                   <DragDropContext onDragEnd={onDragEnd}>
                     <Droppable droppableId={`droppable-${diaActivo}`}>
                       {(provided) => (
                         <div 
                           {...provided.droppableProps} 
                           ref={provided.innerRef}
                           className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 md:pr-2 pb-20"
                         >
                           {ejerciciosDelDia
                              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                              .map((ejercicio, index) => (
                             <Draggable key={ejercicio.id_unico.toString()} draggableId={ejercicio.id_unico.toString()} index={index}>
                               {(provided, snapshot) => (
                                 <div 
                                   ref={provided.innerRef}
                                   {...provided.draggableProps}
                                   className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center bg-zinc-900 border p-4 rounded-xl relative transition-shadow ${snapshot.isDragging ? 'border-blue-500 shadow-2xl shadow-blue-500/20 z-50 scale-[1.02]' : 'border-zinc-800'}`}
                                 >
                                   {/* 🌟 BOTÓN DE ARRASTRE (GRIP) */}
                                   <div className="hidden md:flex col-span-1 justify-center items-center">
                                      <div {...provided.dragHandleProps} className="p-2 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                      </div>
                                   </div>

                                   {/* Top Row: Name, Notes & Delete */}
                                   <div className="w-full md:col-span-4 flex flex-col justify-center pr-6 md:pr-0">
                                     <div className="flex items-center gap-2">
                                       {/* Botón de arrastre en móvil */}
                                       <div {...provided.dragHandleProps} className="md:hidden p-1 text-zinc-600 active:text-white cursor-grab">
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>
                                       </div>
                                       <p className="font-bold text-zinc-200 text-sm">{ejercicio.nombre}</p>
                                     </div>
                                     <input 
                                       type="text" 
                                       placeholder="Nota (Ej. Bajar lento...)" 
                                       value={ejercicio.notas_entrenador || ''} 
                                       onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'notas_entrenador', e.target.value)} 
                                       className="w-full mt-2 md:mt-1.5 bg-zinc-950 border border-zinc-800 text-emerald-400 text-xs md:text-[10px] font-bold rounded-md px-2 py-2 md:py-1.5 focus:border-emerald-500 outline-none placeholder-zinc-700 transition" 
                                     />
                                   </div>
                                   
                                   {/* Bottom Row: Metrics */}
                                   <div className="w-full md:w-auto md:col-span-6 flex flex-row justify-between md:grid md:grid-cols-6 gap-2 mt-2 md:mt-0 bg-zinc-950/50 md:bg-transparent p-2 md:p-0 rounded-lg border border-zinc-800/50 md:border-none">
                                     <div className="flex flex-col items-center md:col-span-2 flex-1">
                                       <span className="text-[10px] md:text-[9px] text-zinc-500 uppercase mb-1">Series</span>
                                       <input type="number" value={ejercicio.series_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'series_objetivo', e.target.value)} className="w-full max-w-[60px] md:w-14 bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-1.5 md:py-1 text-sm focus:border-blue-500 focus:outline-none" />
                                     </div>
                                     <div className="flex flex-col items-center md:col-span-2 flex-1 border-l border-r border-zinc-800 md:border-none">
                                       <span className="text-[10px] md:text-[9px] text-zinc-500 uppercase mb-1">Reps</span>
                                       <input type="text" value={ejercicio.reps_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'reps_objetivo', e.target.value)} placeholder="Ej. 10" className="w-full max-w-[70px] md:w-16 bg-zinc-950 border border-zinc-700 text-white text-center rounded-lg py-1.5 md:py-1 text-sm focus:border-blue-500 focus:outline-none" />
                                     </div>
                                     <div className="flex flex-col items-center md:col-span-2 flex-1">
                                       <span className="text-[10px] md:text-[9px] text-zinc-500 uppercase font-bold text-emerald-500 mb-1">RIR</span>
                                       <input type="text" value={ejercicio.rir_objetivo} onChange={(e) => actualizarEjercicio(ejercicio.id_unico, 'rir_objetivo', e.target.value)} placeholder="Ej. 1-2" className="w-full max-w-[60px] md:w-14 bg-zinc-950 border border-emerald-900 text-emerald-400 text-center rounded-lg py-1.5 md:py-1 text-sm focus:border-emerald-500 focus:outline-none" />
                                     </div>
                                   </div>

                                   <div className="absolute top-2 right-2 md:static md:col-span-1 flex justify-end">
                                     <button onClick={() => quitarDelConstructor(ejercicio.id_unico)} className="text-zinc-600 hover:text-red-400 font-bold p-2 bg-zinc-950 md:bg-transparent rounded-lg border border-zinc-800 md:border-none">✕</button>
                                   </div>
                                 </div>
                               )}
                             </Draggable>
                           ))}
                           {provided.placeholder}
                         </div>
                       )}
                     </Droppable>
                   </DragDropContext>
                 )}

              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM TAB BAR PARA MÓVILES */}
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

      {/* MODALES Y ALERTAS */}
      {notificacion && (
        <div className="fixed top-4 md:top-auto md:bottom-8 right-4 md:right-8 z-[60] animate-in slide-in-from-top-5 md:slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${notificacion.tipo === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <span className="text-xl">{notificacion.tipo === 'exito' ? '✅' : '⚠️'}</span>
            <p className="font-bold text-sm tracking-wide">{notificacion.mensaje}</p>
          </div>
        </div>
      )}

      {confirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-3xl mb-6 mx-auto shadow-inner">⚠️</div>
            <h3 className="text-2xl font-black text-white text-center mb-2">¿Estás seguro?</h3>
            <p className="text-zinc-400 text-center text-sm mb-8">{confirmacion.mensaje}</p>
            <div className="flex flex-col md:flex-row gap-3">
              <button onClick={() => setConfirmacion(null)} className="flex-1 px-5 py-3 rounded-xl font-bold text-zinc-300 hover:bg-zinc-800 transition border border-zinc-700 md:border-none">Cancelar</button>
              <button onClick={confirmacion.onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/20">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl">
            {pasoModal === 'formulario' ? (
              <>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl md:text-2xl font-extrabold text-white">Nueva Rutina</h2><button onClick={() => { setMostrarModal(false); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400 text-xl md:text-base">✕</button></div>
                <div className="space-y-4">
                  <input type="text" value={nuevaRutina.nombre} onChange={(e) => setNuevaRutina({...nuevaRutina, nombre: e.target.value})} placeholder="Nombre" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
                  <textarea value={nuevaRutina.descripcion} onChange={(e) => setNuevaRutina({...nuevaRutina, descripcion: e.target.value})} placeholder="Descripción" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 h-24 focus:border-blue-500 outline-none"></textarea>
                </div>
                <div className="flex justify-end gap-3 mt-8"><button onClick={() => { setMostrarModal(false); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400 font-medium px-4">Cancelar</button><button onClick={handleGuardarRutina} className="bg-blue-600 text-white px-6 py-3 md:py-2 rounded-xl font-bold">Guardar</button></div>
              </>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-3xl font-black text-white mb-4">¡Creada!</h2>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setMostrarModal(false); setPasoModal('formulario'); abrirConstructor(nuevaRutina); }} className="bg-emerald-500 text-zinc-950 px-6 py-4 md:py-3 rounded-xl font-bold">Sí, agregar ejercicios</button>
                  <button onClick={() => { setMostrarModal(false); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="text-zinc-400 py-2">No, después</button>
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