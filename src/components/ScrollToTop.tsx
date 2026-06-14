import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Al cambiar de ruta, lleva el scroll al principio de la página, o si la URL
 * incluye un ancla (#id), hace scroll hasta el elemento correspondiente una
 * vez que la página ha terminado de renderizar.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let intentos = 0;
      let timeoutId: ReturnType<typeof setTimeout>;
      // Reintenta mientras la página destino (cargada con React.lazy/Suspense
      // y conexiones lentas) termina de renderizar el elemento del ancla.
      const intentar = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        intentos += 1;
        if (intentos < 15) {
          timeoutId = setTimeout(intentar, 200);
        }
      };
      intentar();
      return () => clearTimeout(timeoutId);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
