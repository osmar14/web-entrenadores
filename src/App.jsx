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
import { ModalConfirmacion, ModalNuevaRutina, ModalClonarMasivo, ModalCatalogo } from './componentes/ModalesApp';
import { BottomTabBar } from './componentes/BottomTabBar';
import CalculadoraRM from './componentes/CalculadoraRM';

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
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
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
      } catch (err) { console.error("Error obteniendo perfil", err); }

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (usuarioActual) cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (e) { mostrarAlerta("Hubo un error de conexión", "error"); console.error(e); }
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
    } catch (e) { mostrarAlerta("Error de conexión", "error"); console.error(e); }
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
    } catch (e) { mostrarAlerta("Error", "error"); console.error(e); }
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
    } catch (e) { mostrarAlerta("Error", "error"); console.error(e); }
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
    } catch (e) { mostrarAlerta("Error al guardar rutina", "error"); console.error(e); }
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
    } catch (e) { mostrarAlerta("Error al guardar el plan", "error"); console.error(e); }
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
        setMostrarCalculadora={setMostrarCalculadora}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full relative pb-28 md:pb-8">
        <header className="mb-6 flex flex-row justify-between items-center gap-4">
          <div><p className="text-emerald-400 font-medium mb-1 text-sm md:text-base">Tu imperio te espera</p><h1 className="text-2xl md:text-3xl font-extrabold text-white">Hola, {obtenerNombreUsuario()} 👋</h1></div>
          <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({ id: null, nombre: '', descripcion: '', nivel: 'Principiante' }); }} className="bg-emerald-500 text-zinc-950 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 shadow-lg shrink-0"><span className="hidden md:inline text-sm">➕</span><span className="md:hidden text-lg">➕</span> <span className="hidden md:inline">Crear</span></button>
        </header>

        {vistaActiva === 'inicio' && <Inicio totalClientes={totalClientes} totalRutinas={totalRutinas} usuarioActual={usuarioActual} listaClientes={listaClientes} cargarDatos={cargarDatos} />}
        
        {vistaActiva === 'planes' && <Planes planActual={planEntrenador} actualizarPlanLocal={setPlanEntrenador} usuarioActual={usuarioActual} mostrarAlerta={mostrarAlerta} />}

        {vistaActiva === 'clientes' && <Clientes planActual={planEntrenador} listaClientes={listaClientes} clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado} listaRutinas={listaRutinas} todasLasRutinas={todasLasRutinas} handleClonarRutina={handleClonarRutina} abrirConstructor={abrirConstructor} handleEliminarRutina={handleEliminarRutina} cargarDatos={cargarDatos} mostrarAlerta={mostrarAlerta} usuarioActual={usuarioActual} esPro={esPro} setMostrarPaywall={setMostrarPaywall} catalogoEjercicios={catalogoEjercicios} />}

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

      <BottomTabBar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} setClienteSeleccionado={setClienteSeleccionado} />

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

      <ModalConfirmacion confirmacion={confirmacion} setConfirmacion={setConfirmacion} />

      <ModalNuevaRutina 
        mostrarModal={mostrarModal} setMostrarModal={setMostrarModal} 
        pasoModal={pasoModal} setPasoModal={setPasoModal} 
        nuevaRutina={nuevaRutina} setNuevaRutina={setNuevaRutina} 
        handleGuardarRutina={handleGuardarRutina} abrirConstructor={abrirConstructor} 
      />

      <ModalClonarMasivo 
        mostrarModalClonarMasivo={mostrarModalClonarMasivo} setMostrarModalClonarMasivo={setMostrarModalClonarMasivo} 
        rutinaAClonar={rutinaAClonar} setRutinaAClonar={setRutinaAClonar} 
        listaClientes={listaClientes} clientesSeleccionados={clientesSeleccionados} setClientesSeleccionados={setClientesSeleccionados} 
        handleClonarMasivo={handleClonarMasivo} 
      />

      <ModalCatalogo 
        mostrarModalCatalogo={mostrarModalCatalogo} setMostrarModalCatalogo={setMostrarModalCatalogo} 
        nuevoEjercicioCatalogo={nuevoEjercicioCatalogo} setNuevoEjercicioCatalogo={setNuevoEjercicioCatalogo} 
        handleCrearEjercicio={handleCrearEjercicio} catalogoEjercicios={catalogoEjercicios} handleEliminarEjercicio={handleEliminarEjercicio} 
      />

      {mostrarCalculadora && <CalculadoraRM onClose={() => setMostrarCalculadora(false)} />}
    </div>
  )
}

export default App;