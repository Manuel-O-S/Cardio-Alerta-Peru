import { useEffect, useRef, useState } from "react";

/**
 * Ayuda visual sobre donde va cada sensor.
 *
 * POR QUE UNA IMAGEN Y NO TEXTO
 * "Preductal" y "postductal" son terminos que no dicen nada a quien no los usa
 * a diario, y el texto de ayuda al lado del campo se lee una vez y se ignora.
 * La duda real es fisica: donde pongo el sensor. Una foto la resuelve en un
 * segundo y no ocupa espacio hasta que se pide.
 *
 * La imagen se sirve desde el propio sitio (public/), asi que el service
 * worker la guarda y sigue disponible sin conexion.
 */
export default function AyudaSensores() {
  const [abierta, setAbierta] = useState(false);
  const cajaRef = useRef(null);
  const botonRef = useRef(null);

  // Cerrar con Escape o pulsando fuera: en una pantalla pequeña la ventana
  // tapa el formulario y tiene que quitarse de en medio facilmente.
  useEffect(() => {
    if (!abierta) return;

    const alPulsarFuera = (e) => {
      if (
        cajaRef.current &&
        !cajaRef.current.contains(e.target) &&
        !botonRef.current?.contains(e.target)
      ) {
        setAbierta(false);
      }
    };
    const alTeclear = (e) => {
      if (e.key === "Escape") {
        setAbierta(false);
        botonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", alPulsarFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alPulsarFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierta]);

  return (
    <div className="ayu">
      <style>{CSS_AYU}</style>

      <button
        ref={botonRef}
        type="button"
        className={`ayu-boton ${abierta ? "ayu-boton-on" : ""}`}
        onClick={() => setAbierta(!abierta)}
        aria-expanded={abierta}
        aria-label="Ver donde se coloca cada sensor"
        title="Donde va cada sensor"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {abierta && (
        <div className="ayu-caja" ref={cajaRef} role="dialog" aria-label="Colocacion de los sensores">
          <div className="ayu-caja-cab">
            <span className="ayu-caja-titulo">{"Colocaci\u00F3n de los sensores"}</span>
            <button
              type="button"
              className="ayu-cerrar"
              onClick={() => setAbierta(false)}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <img
            className="ayu-img"
            src="/colocacion-sensores.jpg"
            alt={
              "Dos fotograf\u00EDas: a la izquierda, un sensor de ox\u00EDmetro colocado en la " +
              "mano derecha de un reci\u00E9n nacido, para la saturaci\u00F3n preductal. A la " +
              "derecha, un sensor colocado en el pie, para la saturaci\u00F3n postductal."
            }
            width="900"
            height="556"
            loading="lazy"
          />

          <p className="ayu-nota">
            {"La diferencia entre ambas mediciones es lo que detecta las lesiones en las que la mano derecha satura normal y el pie no."}
          </p>
        </div>
      )}
    </div>
  );
}

const CSS_AYU = `
.ayu { position: relative; display: inline-flex; }
.ayu-boton { display:flex; align-items:center; justify-content:center;
             width:32px; height:32px; padding:0; border-radius:50%;
             border:1px solid var(--linea); background:var(--carta-solida, #fff);
             color:var(--acento, #3b82f6); cursor:pointer;
             transition:background .15s ease, border-color .15s ease; }
.ayu-boton:hover { background:var(--acento-suave, rgba(59,130,246,.08));
                   border-color:var(--acento, #3b82f6); }
.ayu-boton-on { background:var(--acento, #3b82f6); border-color:var(--acento, #3b82f6);
                color:#fff; }
.ayu-boton:focus-visible { outline:2px solid var(--acento, #3b82f6); outline-offset:2px; }

.ayu-caja { position:absolute; top:40px; right:0; z-index:40;
            width:min(440px, calc(100vw - 40px));
            background:var(--carta-solida, #fff); border:1px solid var(--linea);
            border-radius:14px; box-shadow:0 12px 32px rgba(15,23,42,.16);
            padding:14px; animation:ayuAparece .18s ease-out both; }
@keyframes ayuAparece {
  from { opacity:0; transform:translateY(-6px) scale(.98); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.ayu-caja-cab { display:flex; align-items:center; justify-content:space-between;
                gap:10px; margin-bottom:11px; }
.ayu-caja-titulo { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                   text-transform:uppercase; color:var(--suave);
                   font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.ayu-cerrar { display:flex; padding:5px; border:none; background:none;
              color:var(--suave); cursor:pointer; border-radius:6px; }
.ayu-cerrar:hover { background:var(--campo); color:var(--tinta); }
.ayu-img { width:100%; height:auto; display:block; border-radius:10px; }
.ayu-nota { margin:11px 0 0; font-size:12.5px; line-height:1.5; color:var(--suave); }

/* En pantallas pequeñas la ventana se centra en vez de colgar del boton:
   anclada a la derecha se saldria del borde. */
@media (max-width: 520px) {
  .ayu-caja { position:fixed; top:auto; bottom:16px; left:16px; right:16px;
              width:auto; max-height:80vh; overflow-y:auto; }
}
@media (prefers-reduced-motion: reduce) {
  .ayu-caja { animation:none; }
}
`;
