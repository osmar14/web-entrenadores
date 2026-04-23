import { useState, useEffect } from 'react';
import Login from './vistas/Login';
import Inicio from './vistas/Inicio';
import Clientes from './vistas/Clientes';
import Constructor from './vistas/Constructor';
import Planes from './vistas/Planes';
import Sidebar from './componentes/Sidebar';
import PaywallModal from './componentes/PaywallModal';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  // 👑 ESTADOS DEL PLAN PRO Y MURO DE CRISTAL
  const [planEntrenador, setPlanEntrenador] = useState('TRIAL'); 
  const esPro = planEntrenador === 'PRO';
  const [mostrarPaywall, setMostrarPaywall] = useState(false);

  // ESTADOS ORIGINALES
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalRutinas, setTotalRutinas] = useState(0);
  const [listaRutinas, setListaRutinas] = useState([]);
  const [todasLasRutinas, setTodasLasRutinas] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [catalogoEjercicios, setCatalogoEjercicios] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [filtroMusculo, setFiltroMusculo] = useState('Todos');
  const [ejerciciosEnRutina, setEjerciciosEnRutina] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [diasPlan, setDiasPlan] = useState([]);
  const [diaActivo, setDiaActivo] = useState('');
  
  // Phase 2 states
  const [mostrarModalClonarMasivo, setMostrarModalClonarMasivo] = useState(false);
  const [rutinaAClonar, setRutinaAClonar] = useState(null);
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
  const [mostrarModalCatalogo, setMostrarModalCatalogo] = useState(false);
  const [nuevoEjercicioCatalogo, setNuevoEjercicioCatalogo] = useState({nombre: '', grupo_muscular: 'Pecho', tipo_metrica: 'reps'});

  const [pasoModal, setPasoModal] = useState('formulario');
  const [nuevaRutina, setNuevaRutina] = useState({ id: null, nombre: '', descripcion: '', nivel: 'Principiante' });
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

      // Obtener plan actual
      try {
        const resPerfil = await fetch('https://backend-entrenadores-production.up.railway.app/api/entrenadores/perfil', { headers: headersSeguros });
        const datosPerfil = await resPerfil.json();
        if (datosPerfil.plan_actual) {
          setPlanEntrenador(datosPerfil.plan_actual);
        }
      } catch (err) { console.error("Error obteniendo perfil"); }

      const resRutinas = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', { headers: headersSeguros });
      const datosRutinas = await resRutinas.json();
      if (Array.isArray(datosRutinas)) {
        setTodasLasRutinas(datosRutinas);
        const plantillas = datosRutinas.filter(r => r.es_plantilla === 1);
        setTotalRutinas(plantillas.length);
        setListaRutinas(plantillas);
      }

      const resEjercicios = await fetch('https://backend-entrenadores-production.up.railway.app/api/ejercicios', { headers: headersSeguros });
      const datosEjercicios = await resEjercicios.json();
      if (Array.isArray(datosEjercicios)) setCatalogoEjercicios(datosEjercicios);
    } catch (e) { console.error("Error de conexión:", e); }
  }

  useEffect(() => {
    if (usuarioActual) cargarDatos();
  }, [usuarioActual]);

  const handleClonarRutina = async (plantilla_id, cliente_id) => {
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas/clonar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plantilla_id, cliente_id })
      });
      if (res.ok) { mostrarAlerta("Plan asignado exitosamente al cliente 🪄", "exito"); cargarDatos(); }
      else { mostrarAlerta("Error al clonar", "error"); }
    } catch (e) { mostrarAlerta("Hubo un error de conexión", "error"); }
  }

  const handleClonarMasivo = async () => {
    if (clientesSeleccionados.length === 0) return mostrarAlerta("Selecciona al menos un cliente", "error");
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas/clonar-masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plantilla_id: rutinaAClonar.id, cliente_ids: clientesSeleccionados })
      });
      if (res.ok) { 
        mostrarAlerta(`Plan asignado a ${clientesSeleccionados.length} clientes 🚀`, "exito"); 
        setMostrarModalClonarMasivo(false);
        setClientesSeleccionados([]);
        setRutinaAClonar(null);
        cargarDatos(); 
      } else {
        const d = await res.json();
        mostrarAlerta(d.error || "Error al clonar", "error");
      }
    } catch (e) { mostrarAlerta("Error de conexión", "error"); }
  }

  const handleCrearEjercicio = async () => {
    if(!nuevoEjercicioCatalogo.nombre) return mostrarAlerta("El nombre es requerido", "error");
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/ejercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(nuevoEjercicioCatalogo)
      });
      if (res.ok) { 
        mostrarAlerta("Ejercicio añadido al catálogo", "exito"); 
        setNuevoEjercicioCatalogo({nombre: '', grupo_muscular: 'Pecho', tipo_metrica: 'reps'});
        cargarDatos(); 
      }
    } catch (e) { mostrarAlerta("Error", "error"); }
  };

  const handleEliminarEjercicio = async (id) => {
    if(!window.confirm("¿Seguro que deseas eliminar este ejercicio?")) return;
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch(`https://backend-entrenadores-production.up.railway.app/api/ejercicios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { mostrarAlerta("Ejercicio eliminado", "exito"); cargarDatos(); }
      else { mostrarAlerta("No puedes eliminar un ejercicio global", "error"); }
    } catch (e) { mostrarAlerta("Error", "error"); }
  };

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
          notas_entrenador: e.notas_entrenador || '',
          rir_objetivo: e.rir_objetivo || '',
          tempo: e.tempo || '',
          es_unilateral: e.es_unilateral === 1 ? true : false,
          segundos_objetivo: e.segundos_objetivo || ''
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
    } catch (error) { console.error("Error al cargar ejercicios:", error); }
  }

  const handleGuardarRutina = async () => {
    if (!nuevaRutina.nombre) return mostrarAlerta("¡El nombre de la plantilla es obligatorio!", "error");
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(nuevaRutina)
      });
      const data = await res.json();
      if (res.ok) {
        setNuevaRutina({ ...nuevaRutina, id: data.id });
        setPasoModal('exito');
        cargarDatos();
      } else { mostrarAlerta(data.error || "Error del servidor", "error"); }
    } catch (e) { mostrarAlerta("Error al guardar rutina", "error"); }
  }

  const handleGuardarPlanDeVuelo = async () => {
    try {
      const token = await usuarioActual.getIdToken();
      const res = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutina-ejercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rutina_id: rutinaSeleccionada.id, ejercicios: ejerciciosEnRutina })
      });
      if (res.ok) { mostrarAlerta("¡Plan de vuelo guardado en la bóveda! 🚀", "exito"); setVistaActiva(rutinaSeleccionada.cliente_id ? 'clientes' : 'rutinas'); }
    } catch (e) { mostrarAlerta("Error al guardar el plan", "error"); }
  }

  const gruposMusculares = ['Todos', ...new Set(catalogoEjercicios.map(e => e.grupo_muscular || 'General'))];
  const ejerciciosFiltrados = filtroMusculo === 'Todos' ? catalogoEjercicios : catalogoEjercicios.filter(e => (e.grupo_muscular || 'General') === filtroMusculo);

  const agregarAlConstructor = (ejercicio) => {
    setEjerciciosEnRutina([...ejerciciosEnRutina, {
      ...ejercicio, id_unico: Date.now(), series_objetivo: 3, reps_objetivo: '10', dia_nombre: diaActivo, notas_entrenador: '',
      rir_objetivo: '', tempo: '', es_unilateral: false, segundos_objetivo: ''
    }]);
  }

  const quitarDelConstructor = (id_unico) => setEjerciciosEnRutina(ejerciciosEnRutina.filter(e => e.id_unico !== id_unico));
  const actualizarEjercicio = (id_unico, campo, valor) => setEjerciciosEnRutina(ejerciciosEnRutina.map(e => e.id_unico === id_unico ? { ...e, [campo]: valor } : e));

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
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const ejerciciosDiaActual = ejerciciosEnRutina.filter(e => e.dia_nombre === diaActivo);
    const ejerciciosOtrosDias = ejerciciosEnRutina.filter(e => e.dia_nombre !== diaActivo);

    const reordenados = Array.from(ejerciciosDiaActual);
    const [ejercicioMovido] = reordenados.splice(sourceIndex, 1);
    reordenados.splice(destinationIndex, 0, ejercicioMovido);

    const actualizadosConOrden = reordenados.map((ej, index) => ({ ...ej, orden: index }));
    setEjerciciosEnRutina([...ejerciciosOtrosDias, ...actualizadosConOrden]);
  };

  const ejerciciosDelDia = ejerciciosEnRutina.filter(e => e.dia_nombre === diaActivo);

  if (verificandoSesion) return (<div className="h-[100dvh] w-full bg-zinc-950 flex flex-col items-center justify-center text-emerald-500"><div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl flex items-center justify-center text-3xl font-black text-white border border-zinc-700 animate-pulse mb-4">C</div><p className="font-bold text-zinc-400 tracking-widest animate-pulse">CARGANDO IMPERIO...</p></div>);

  if (!usuarioActual) return <Login onLogin={() => { }} />;

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">

      {/* 🌟 COMPONENTE SIDEBAR INYECTADO */}
      <Sidebar 
        vistaActiva={vistaActiva} 
        setVistaActiva={setVistaActiva} 
        setClienteSeleccionado={setClienteSeleccionado} 
        onSignOut={() => signOut(auth)} 
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full relative pb-28 md:pb-8">
        <header className="mb-6 flex flex-row justify-between items-center gap-4">
          <div><p className="text-emerald-400 font-medium mb-1 text-sm md:text-base">Tu imperio te espera</p><h1 className="text-2xl md:text-3xl font-extrabold text-white">Hola, {obtenerNombreUsuario()} 👋</h1></div>
          <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({ id: null, nombre: '', descripcion: '', nivel: 'Principiante' }); }} className="bg-emerald-500 text-zinc-950 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 shadow-lg shrink-0"><span className="hidden md:inline text-sm">➕</span><span className="md:hidden text-lg">➕</span> <span className="hidden md:inline">Crear</span></button>
        </header>

        {vistaActiva === 'inicio' && <Inicio totalClientes={totalClientes} totalRutinas={totalRutinas} usuarioActual={usuarioActual} listaClientes={listaClientes} cargarDatos={cargarDatos} />}
        
        {vistaActiva === 'planes' && <Planes planActual={planEntrenador} actualizarPlanLocal={setPlanEntrenador} usuarioActual={usuarioActual} mostrarAlerta={mostrarAlerta} />}

        {vistaActiva === 'clientes' && <Clientes planActual={planEntrenador} listaClientes={listaClientes} clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado} listaRutinas={listaRutinas} todasLasRutinas={todasLasRutinas} handleClonarRutina={handleClonarRutina} abrirConstructor={abrirConstructor} handleEliminarRutina={handleEliminarRutina} cargarDatos={cargarDatos} mostrarAlerta={mostrarAlerta} usuarioActual={usuarioActual} esPro={esPro} setMostrarPaywall={setMostrarPaywall} />}

        {vistaActiva === 'rutinas' && (
          <div className="mt-4 md:mt-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-8">
              <h2 className="text-2xl font-black text-white">Librería Maestra</h2>
              <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({id: null, nombre: '', descripcion: '', nivel: 'Principiante'}); }} className="w-full md:w-auto bg-blue-600 text-white px-4 py-3 md:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500"><span className="text-sm">➕</span> Nueva Plantilla</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {listaRutinas.map((rutina) => (
                <div key={rutina.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col shadow-lg relative group">
                  <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => { setRutinaAClonar(rutina); setMostrarModalClonarMasivo(true); }} className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg" title="Asignar a Clientes (Clonar)">👥</button>
                    <button onClick={() => handleEliminarRutina(rutina.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg" title="Eliminar Plantilla">🗑️</button>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 pr-16">{rutina.nombre}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-1">{rutina.descripcion || 'Sin descripción'}</p>
                  <button onClick={() => abrirConstructor(rutina)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-blue-500 py-3 rounded-xl font-bold transition flex justify-center gap-2"><span>⚙️</span> Editar Ejercicios</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 AQUÍ SE INYECTA EL NUEVO COMPONENTE MODULAR */}
        {vistaActiva === 'constructor' && rutinaSeleccionada && (
          <Constructor 
            rutinaSeleccionada={rutinaSeleccionada}
            setVistaActiva={setVistaActiva}
            handleGuardarPlanDeVuelo={handleGuardarPlanDeVuelo}
            ejerciciosFiltrados={ejerciciosFiltrados}
            gruposMusculares={gruposMusculares}
            filtroMusculo={filtroMusculo}
            setFiltroMusculo={setFiltroMusculo}
            agregarAlConstructor={agregarAlConstructor}
            diasPlan={diasPlan}
            diaActivo={diaActivo}
            setDiaActivo={setDiaActivo}
            agregarNuevoDia={agregarNuevoDia}
            renombrarDiaActivo={renombrarDiaActivo}
            eliminarDiaActivo={eliminarDiaActivo}
            ejerciciosDelDia={ejerciciosDelDia}
            onDragEnd={onDragEnd}
            quitarDelConstructor={quitarDelConstructor}
            actualizarEjercicio={actualizarEjercicio}
            esPro={esPro} 
            setMostrarPaywall={setMostrarPaywall}
            setMostrarModalCatalogo={setMostrarModalCatalogo}
          />
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

      {/* 🌟 COMPONENTE MODAL PAYWALL INYECTADO */}
      {mostrarPaywall && <PaywallModal onClose={() => setMostrarPaywall(false)} onNavigateToPlanes={() => { setMostrarPaywall(false); setVistaActiva('planes'); }} />}

      {/* MODALES DE NOTIFICACIÓN ORIGINALES */}
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

      {/* MODAL CLONAR MASIVO */}
      {mostrarModalClonarMasivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Asignar a Múltiples Clientes</h2>
              <button onClick={() => { setMostrarModalClonarMasivo(false); setClientesSeleccionados([]); setRutinaAClonar(null); }} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Plantilla: <span className="text-blue-400 font-bold">{rutinaAClonar?.nombre}</span></p>
            
            <div className="max-h-60 overflow-y-auto mb-4 border border-zinc-800 rounded-xl p-2 bg-zinc-950">
              {listaClientes.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer transition">
                  <input type="checkbox" className="w-5 h-5 accent-blue-500" 
                    checked={clientesSeleccionados.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setClientesSeleccionados([...clientesSeleccionados, c.id]);
                      else setClientesSeleccionados(clientesSeleccionados.filter(id => id !== c.id));
                    }}
                  />
                  <span className="text-white font-medium">{c.nombre}</span>
                </label>
              ))}
              {listaClientes.length === 0 && <p className="text-zinc-500 text-center text-sm py-4">No tienes clientes aún.</p>}
            </div>

            <div className="flex justify-between mt-4">
              <button onClick={() => setClientesSeleccionados(clientesSeleccionados.length === listaClientes.length ? [] : listaClientes.map(c => c.id))} className="text-sm text-blue-400 hover:underline">
                {clientesSeleccionados.length === listaClientes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              <button onClick={handleClonarMasivo} disabled={clientesSeleccionados.length === 0} className={`px-4 py-2 rounded-xl font-bold ${clientesSeleccionados.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                Asignar ({clientesSeleccionados.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIONAR CATÁLOGO */}
      {mostrarModalCatalogo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">📚 Mi Catálogo</h2>
              <button onClick={() => setMostrarModalCatalogo(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            
            {/* Formulario nuevo ejercicio */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4 shrink-0">
              <h3 className="text-sm font-bold text-emerald-400 mb-3">Añadir Ejercicio Propio</h3>
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Nombre (ej. Press Inclinado en Máquina)" value={nuevoEjercicioCatalogo.nombre} onChange={(e) => setNuevoEjercicioCatalogo({...nuevoEjercicioCatalogo, nombre: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none" />
                <div className="flex gap-2">
                  <select value={nuevoEjercicioCatalogo.grupo_muscular} onChange={(e) => setNuevoEjercicioCatalogo({...nuevoEjercicioCatalogo, grupo_muscular: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                    <option value="Pecho">Pecho</option>
                    <option value="Espalda">Espalda</option>
                    <option value="Pierna">Pierna</option>
                    <option value="Hombro">Hombro</option>
                    <option value="Brazo">Brazo</option>
                    <option value="Core">Core</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Fullbody">Fullbody</option>
                  </select>
                  <button onClick={handleCrearEjercicio} className="bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-emerald-400 transition">Añadir</button>
                </div>
              </div>
            </div>

            {/* Lista de ejercicios del catálogo */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              <p className="text-xs text-zinc-500 font-bold mb-2 uppercase">Tus Ejercicios ({catalogoEjercicios.filter(e => e.entrenador_id).length})</p>
              {catalogoEjercicios.filter(e => e.entrenador_id).length === 0 ? (
                 <p className="text-sm text-zinc-600 italic px-2">No has añadido ejercicios propios todavía.</p>
              ) : (
                catalogoEjercicios.filter(e => e.entrenador_id).map(e => (
                  <div key={e.id} className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                    <div>
                      <p className="text-sm font-bold text-white">{e.nombre}</p>
                      <p className="text-[10px] text-zinc-400 uppercase">{e.grupo_muscular}</p>
                    </div>
                    <button onClick={() => handleEliminarEjercicio(e.id)} className="text-red-400 hover:text-red-300 p-2">🗑️</button>
                  </div>
                ))
              )}
              
              <div className="mt-6 mb-2 border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-500 font-bold uppercase">Ejercicios Globales ({catalogoEjercicios.filter(e => !e.entrenador_id).length})</p>
              </div>
              {catalogoEjercicios.filter(e => !e.entrenador_id).slice(0, 15).map(e => (
                <div key={e.id} className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                  <span className="text-sm text-zinc-300">{e.nombre}</span>
                  <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded">{e.grupo_muscular}</span>
                </div>
              ))}
              <p className="text-xs text-zinc-600 italic text-center py-2">+ más ejercicios globales...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App;