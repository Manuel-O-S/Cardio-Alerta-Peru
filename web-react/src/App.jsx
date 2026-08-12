import { useEffect, useState } from "react";
import FormularioTamizaje from "./tamizaje/FormularioTamizaje.jsx";
import PanelPendientes from "./tamizaje/PanelPendientes.jsx";
import { casosVigentes } from "./tamizaje/casosPendientes.js";
import { VERSION_UMBRALES } from "./tamizaje/motorTamizaje.js";

/**
 * Cascaron de la aplicacion.
 *
 * Dos vistas y nada mas: el tamizaje, y los casos que quedaron pendientes de
 * repetir. La segunda existe porque un "repetir en 60 minutos" que nadie
 * repite es un caso perdido, y el cambio de turno es donde se pierden.
 */
export default function App() {
  const [vista, setVista] = useState("tamizaje");
  const [pendientes, setPendientes] = useState(0);
  const [enLinea, setEnLinea] = useState(navigator.onLine);

  const refrescarPendientes = () => setPendientes(casosVigentes().length);

  useEffect(() => {
    refrescarPendientes();
    const alCambiarConexion = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", alCambiarConexion);
    window.addEventListener("offline", alCambiarConexion);
    return () => {
      window.removeEventListener("online", alCambiarConexion);
      window.removeEventListener("offline", alCambiarConexion);
    };
  }, []);

  return (
    <div className="app">
      <style>{CSS_APP}</style>

      <header className="app-cab">
        <div className="app-cab-fila">
          <div>
            <h1 className="app-titulo">Cardio Alerta Peru</h1>
            <p className="app-sub">Tamizaje neonatal por oximetria de pulso</p>
          </div>
          {!enLinea && <span className="app-offline">Sin conexion</span>}
        </div>

        <nav className="app-tabs" aria-label="Secciones">
          <button
            type="button"
            className={`app-tab ${vista === "tamizaje" ? "app-tab-on" : ""}`}
            onClick={() => setVista("tamizaje")}
            aria-current={vista === "tamizaje"}
          >
            Tamizaje
          </button>
          <button
            type="button"
            className={`app-tab ${vista === "pendientes" ? "app-tab-on" : ""}`}
            onClick={() => {
              refrescarPendientes();
              setVista("pendientes");
            }}
            aria-current={vista === "pendientes"}
          >
            Pendientes
            {pendientes > 0 && <span className="app-badge">{pendientes}</span>}
          </button>
        </nav>
      </header>

      <main>
        {vista === "tamizaje" ? (
          <FormularioTamizaje onCasoGuardado={refrescarPendientes} />
        ) : (
          <PanelPendientes onCambio={refrescarPendientes} />
        )}
      </main>

      <footer className="app-pie">
        <p>
          Herramienta de apoyo al tamizaje. No sustituye el diagnostico ni el
          criterio del medico especialista.
        </p>
        <p className="app-pie-tec">Umbrales version {VERSION_UMBRALES}</p>
      </footer>
    </div>
  );
}

const CSS_APP = `
:root {
  color-scheme: light;

  /* Azules: cabecera, chips activos, cifras neutras */
  --marino:      #16304d;
  --marino-alto: #1d3557;
  --marino-tenue:#a8c0d6;

  /* Texto */
  --tinta:  #1f3346;
  --suave:  #7b93a8;
  --tenue:  #93a8ba;

  /* Superficies */
  --fondo:  #eef1f4;
  --carta:  #ffffff;
  --campo:  #f8fafc;
  --linea:  #e3e9ef;

  /* Rojo de marca: accion principal y estado critico */
  --rojo:       #cc3a2e;
  --rojo-hover: #b8332a;
  --rojo-suave: #fdecea;
  --rojo-linea: #f5c2bd;

  /* Verde: resultado superado, estado en linea */
  --verde:       #1f7a5a;
  --verde-suave: #e8f6ef;
  --verde-linea: #b8e0cd;

  /* Ambar: pendiente, repetir, umbrales provisionales */
  --ambar:       #b8730f;
  --ambar-suave: #fdf3e2;
  --ambar-linea: #f0d9ae;

  /* Azul informativo: etiquetas de contexto */
  --azul:       #2563eb;
  --azul-suave: #e5edfd;

  --radio: 12px;
}

* { box-sizing: border-box; }
body { margin:0; background:var(--fondo); color:var(--tinta);
       font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
       -webkit-text-size-adjust:100%; }
.app { max-width:760px; margin:0 auto; padding:0 0 40px; }

.app-cab { background:var(--marino); color:#fff; padding:20px 16px 0;
           border-radius:0 0 18px 18px; margin-bottom:16px; }
.app-cab-fila { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.app-titulo { margin:0; font-size:20px; font-weight:600; letter-spacing:-.015em; }
.app-sub { margin:4px 0 0; font-size:11.5px; color:var(--marino-tenue);
           font-family:ui-monospace,"SF Mono",Menlo,monospace; letter-spacing:.02em; }

.app-offline { flex-shrink:0; display:inline-flex; align-items:center; gap:6px;
               font-size:11px; font-weight:600; letter-spacing:.06em;
               text-transform:uppercase; background:rgba(184,115,15,.18);
               border:1px solid var(--ambar-linea); color:#f5d9a8;
               padding:5px 10px; border-radius:20px; }
.app-offline::before { content:""; width:6px; height:6px; border-radius:50%;
                       background:#f0b95a; }

.app-tabs { display:flex; gap:4px; margin-top:18px; }
.app-tab { flex:1; padding:11px 12px; border:none; background:transparent;
           color:var(--marino-tenue); font-size:14px; font-family:inherit;
           cursor:pointer; border-bottom:2px solid transparent; display:flex;
           align-items:center; justify-content:center; gap:7px; }
.app-tab-on { color:#fff; font-weight:500; border-bottom-color:#fff; }
.app-tab:focus-visible { outline:2px solid #fff; outline-offset:-2px; }
.app-badge { background:var(--rojo); color:#fff; font-size:11px; font-weight:600;
             min-width:19px; height:19px; border-radius:10px; display:inline-flex;
             align-items:center; justify-content:center; padding:0 5px; }

.app-pie { padding:20px 16px 0; margin-top:8px; border-top:1px solid var(--linea);
           font-size:12px; color:var(--suave); line-height:1.5; }
.app-pie p { margin:0 0 5px; }
.app-pie-tec { font-family:ui-monospace,"SF Mono",Menlo,monospace; font-size:11px;
               color:var(--tenue); }
`;
