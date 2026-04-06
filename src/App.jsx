import { useState, useEffect } from 'react';
import Login from './vistas/Login';
import Inicio from './vistas/Inicio';
import Clientes from './vistas/Clientes';
import Constructor from './vistas/Constructor'; // 🌟 NUEVO COMPONENTE IMPORTADO
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  // 👑 ESTADOS DEL PLAN PRO Y MURO DE CRISTAL (INYECTADOS)
  const [planEntrenador, setPlanEntrenador] = useState('BASICO'); // Cambia a 'PRO' para ver cómo se desbloquea
  const esPro = planEntrenador === 'PRO' || planEntrenador === 'TRIAL';
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
  const [diasPlan, setDiasPlan] = useState(['Día 1']);
  const [diaActivo, setDiaActivo] = useState('Día 1');
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

      const resRutinas = await fetch('https://backend-entrenadores-production.up.railway.app/api/rutinas', { headers: headersSeguros });
      const datosRutinas = await resRutinas.json();
      if (Array.isArray(datosRutinas)) {
        setTodasLasRutinas(datosRutinas);
        const plantillas = datosRutinas.filter(r => r.es_plantilla === 1);
        setTotalRutinas(plantillas.length);
        setListaRutinas(plantillas);
      }

      const resEjercicios = await fetch('https://backend-entrenadores-production.up.railway.app/api/ejercicios');
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
          // Carga de variables Pro guardadas en BD
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

  // 🌟 VARIABLE PRO INYECTADA AL AGREGAR
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

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full relative pb-28 md:pb-8">
        <header className="mb-6 flex flex-row justify-between items-center gap-4">
          <div><p className="text-emerald-400 font-medium mb-1 text-sm md:text-base">Tu imperio te espera</p><h1 className="text-2xl md:text-3xl font-extrabold text-white">Hola, {obtenerNombreUsuario()} 👋</h1></div>
          <button onClick={() => { setMostrarModal(true); setPasoModal('formulario'); setNuevaRutina({ id: null, nombre: '', descripcion: '', nivel: 'Principiante' }); }} className="bg-emerald-500 text-zinc-950 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 shadow-lg shrink-0"><span className="hidden md:inline text-sm">➕</span><span className="md:hidden text-lg">➕</span> <span className="hidden md:inline">Crear</span></button>
        </header>

        {/* RUTEO INTERNO DE VISTAS */}
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

      {/* MODAL PAYWALL (MURO DE CRISTAL) */}
      {mostrarPaywall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[80] p-4">
          <div className="bg-zinc-900 border border-amber-500/30 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-yellow-400"></div>
            <button onClick={() => setMostrarPaywall(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-2xl">✕</button>
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">👑</span>
              <h3 className="text-2xl font-black text-white">Prescripción Científica</h3>
              <p className="text-zinc-400 text-sm mt-2">Estás usando el plan Básico. Actualiza a Pro para desbloquear variables avanzadas.</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500">✔</span> <b>Tempo:</b> Controla el tiempo bajo tensión.</li>
              <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500">✔</span> <b>RIR/RPE:</b> Mide la fatiga central real.</li>
              <li className="flex items-center gap-3 text-sm text-zinc-300"><span className="text-amber-500">✔</span> <b>Unilateral:</b> Cálculo de tonelaje preciso.</li>
            </ul>
            <button onClick={() => { setMostrarPaywall(false); alert("Redirigir a pasarela de pago"); }} className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 py-3 rounded-xl font-black shadow-lg hover:scale-[1.02] transition-transform">
              Actualizar a Pro - $500/mes
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default App;