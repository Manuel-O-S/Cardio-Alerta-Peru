import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Ayuda visual sobre un sintoma especifico.
 *
 * Mismo patron que AyudaSensores: boton con interrogacion que despliega un
 * cuadro flotante con imagen y texto explicativo. El cuadro se renderiza con
 * createPortal en el body para evitar recortes por backdrop-filter.
 *
 * Props:
 * - titulo:      nombre legible del sintoma
 * - imagen:      ruta dentro de public/
 * - alt:         texto alternativo de la imagen
 * - descripcion: texto explicativo
 */
export default function AyudaSintoma({ titulo, imagen, alt, descripcion }) {
  const [abierta, setAbierta] = useState(false);
  const [pos, setPos] = useState(null);
  const cajaRef = useRef(null);
  const botonRef = useRef(null);

  const abrir = (e) => {
    // Evitar que el clic en el boton de ayuda active el checkbox del label padre
    e.preventDefault();
    e.stopPropagation();

    if (abierta) {
      setAbierta(false);
      return;
    }
    const r = botonRef.current.getBoundingClientRect();
    const anchoVentana = window.innerWidth;
    const altoVentana = window.innerHeight;
    const ANCHO = Math.min(440, anchoVentana - 32);
    const izquierda = Math.max(
      16,
      Math.min(r.right - ANCHO, anchoVentana - ANCHO - 16)
    );
    // Posicion inicial centrada verticalmente en el viewport
    const topCentrado = Math.max(16, (altoVentana - 500) / 2);
    setPos({ top: topCentrado, left: izquierda, ancho: ANCHO });
    setAbierta(true);
  };

  // Reposicionar despues del render: medir el alto real del popup y
  // centrarlo en el viewport asegurandose de que cabe completo.
  useLayoutEffect(() => {
    if (!abierta || !cajaRef.current) return;
    const caja = cajaRef.current;
    const altoVentana = window.innerHeight;
    const altoCaja = caja.offsetHeight;
    const maxAlto = altoVentana - 32;
    const altoFinal = Math.min(altoCaja, maxAlto);
    const topFinal = Math.max(16, (altoVentana - altoFinal) / 2);
    setPos((prev) => ({ ...prev, top: topFinal }));
  }, [abierta]);

  // Cerrar al desplazar o cambiar tamano
  useEffect(() => {
    if (!abierta) return;
    const cerrar = () => setAbierta(false);
    window.addEventListener("scroll", cerrar, { passive: true });
    window.addEventListener("resize", cerrar);
    return () => {
      window.removeEventListener("scroll", cerrar);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierta]);

  // Cerrar con Escape o clic fuera
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
    <>
      <style>{CSS_AYUSINT}</style>

      <button
        ref={botonRef}
        type="button"
        className={`ayusint-boton ${abierta ? "ayusint-boton-on" : ""}`}
        onClick={abrir}
        aria-expanded={abierta}
        aria-label={`Ver informaci\u00F3n sobre ${titulo}`}
        title={`\u00BFQu\u00E9 es ${titulo}?`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {abierta &&
        pos &&
        createPortal(
          <div
            className="ayusint-caja"
            ref={cajaRef}
            role="dialog"
            aria-label={titulo}
            style={{ top: pos.top, left: pos.left, width: pos.ancho }}
          >
            <div className="ayusint-caja-cab">
              <span className="ayusint-caja-titulo">{titulo}</span>
              <button
                type="button"
                className="ayusint-cerrar"
                onClick={() => setAbierta(false)}
                aria-label="Cerrar"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <img
              className="ayusint-img"
              src={imagen}
              alt={alt}
              width="900"
              height="675"
              loading="lazy"
            />

            <p className="ayusint-nota">{descripcion}</p>
          </div>,
          document.body
        )}
    </>
  );
}

const CSS_AYUSINT = `
/* Boton de interrogacion pequeno, alineado con el checkbox */
.ayusint-boton { display:inline-flex; align-items:center; justify-content:center;
                 width:24px; height:24px; padding:0; border-radius:50%;
                 border:1px solid var(--linea); background:var(--carta-solida, #fff);
                 color:var(--acento, #3b82f6); cursor:pointer; flex-shrink:0;
                 transition:background .15s ease, border-color .15s ease;
                 margin-left:auto; }
.ayusint-boton:hover { background:var(--acento-suave, rgba(59,130,246,.08));
                       border-color:var(--acento, #3b82f6); }
.ayusint-boton-on { background:var(--acento, #3b82f6); border-color:var(--acento, #3b82f6);
                    color:#fff; }
.ayusint-boton:focus-visible { outline:2px solid var(--acento, #3b82f6); outline-offset:2px; }

.ayusint-caja { position:fixed; z-index:200;
                background:var(--carta-solida, #fff); border:1px solid var(--linea);
                border-radius:14px; box-shadow:0 12px 32px rgba(15,23,42,.16);
                padding:14px; animation:ayusintAparece .18s ease-out both;
                max-height:calc(100vh - 32px); overflow-y:auto; }
@keyframes ayusintAparece {
  from { opacity:0; transform:translateY(-6px) scale(.98); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.ayusint-caja-cab { display:flex; align-items:center; justify-content:space-between;
                    gap:10px; margin-bottom:11px; }
.ayusint-caja-titulo { font-size:10.5px; font-weight:600; letter-spacing:.12em;
                       text-transform:uppercase; color:var(--suave);
                       font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.ayusint-cerrar { display:flex; padding:5px; border:none; background:none;
                  color:var(--suave); cursor:pointer; border-radius:6px; }
.ayusint-cerrar:hover { background:var(--campo); color:var(--tinta); }
.ayusint-img { width:100%; height:auto; display:block; border-radius:10px; }
.ayusint-nota { margin:11px 0 0; font-size:12.5px; line-height:1.5; color:var(--suave); }

@media (max-width: 560px) {
  .ayusint-caja { top:auto !important; bottom:16px; left:16px !important;
                  right:16px; width:auto !important; max-height:82vh;
                  overflow-y:auto; }
}
@media (prefers-reduced-motion: reduce) {
  .ayusint-caja { animation:none; }
}
`;
