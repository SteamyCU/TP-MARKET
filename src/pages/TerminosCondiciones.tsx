import React from 'react';
import { FileText, ShieldCheck, AlertCircle, Scale, Clock, Globe } from 'lucide-react';

export function TerminosCondiciones() {
  return (
    <div className="bg-gray-50 min-h-screen py-24 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-10 lg:p-20 shadow-xl border border-tp-gray-soft">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-tp-blue-light rounded-3xl flex items-center justify-center text-tp-blue rotate-3">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-tp-blue">Términos y <span className="text-tp-red">Condiciones</span></h1>
            <p className="text-tp-blue/40 font-bold text-xs uppercase tracking-widest mt-1">Última actualización: 10 de Marzo, 2026</p>
          </div>
        </div>

        <div className="prose prose-lg prose-tp-blue max-w-none space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">1</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Introducción</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Bienvenido a To Paquete Logística. Al acceder a nuestro sitio web y utilizar nuestros servicios de envío a Cuba, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso, que junto con nuestra política de privacidad rigen la relación de To Paquete Logística con usted en relación con este sitio web y el servicio prestado.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">2</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Definiciones</h2>
            </div>
            <ul className="space-y-4 text-tp-blue/70 font-medium">
              <li className="flex gap-3"><span className="text-tp-red font-black">•</span> <strong>"Empresa":</strong> Se refiere a To Paquete Logística, con domicilio social en Madrid, España.</li>
              <li className="flex gap-3"><span className="text-tp-red font-black">•</span> <strong>"Cliente":</strong> Se refiere a la persona física o jurídica que contrata los servicios de envío.</li>
              <li className="flex gap-3"><span className="text-tp-red font-black">•</span> <strong>"Agente":</strong> Se refiere al colaborador autorizado que gestiona la recepción de paquetes.</li>
              <li className="flex gap-3"><span className="text-tp-red font-black">•</span> <strong>"Servicio":</strong> Se refiere a la gestión logística de transporte de paquetería desde España a Cuba.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">3</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Condiciones del Servicio</h2>
            </div>
            <div className="bg-tp-blue-light/20 p-8 rounded-3xl border border-tp-blue/5 space-y-4">
              <p className="text-tp-blue/70 m-0">
                El cliente es responsable de declarar el contenido exacto de cada bulto. To Paquete Logística se reserva el derecho de inspeccionar cualquier paquete para garantizar el cumplimiento de las normativas aduanales vigentes tanto en España como en Cuba.
              </p>
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-tp-gray-soft">
                <AlertCircle className="w-5 h-5 text-tp-red shrink-0 mt-1" />
                <p className="text-sm font-bold text-tp-blue/60 m-0 italic">
                  Está estrictamente prohibido el envío de sustancias ilegales, armas, material explosivo, dinero en efectivo y cualquier artículo restringido por la Aduana General de la República de Cuba.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">4</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Responsabilidad y Seguros</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Todos los envíos gestionados por To Paquete Logística incluyen un seguro básico de transporte. En caso de pérdida o daño total comprobado, la indemnización se basará en el valor declarado del paquete, hasta un máximo establecido por la normativa de transporte internacional vigente.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">5</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Política de Cancelación y Reembolso</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Las cancelaciones de envíos solo serán aceptadas antes de que el paquete haya sido procesado para su salida internacional. Una vez que el paquete se encuentra en tránsito hacia Cuba, no se admitirán devoluciones ni cancelaciones.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">6</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Jurisdicción</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Cualquier disputa que surja del uso de este sitio web o de la contratación de nuestros servicios estará sujeta a las leyes de España y a la jurisdicción de los tribunales de Madrid.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-tp-gray-soft flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-tp-blue/40">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Navegación Segura SSL</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-tp-blue/60 hover:text-tp-red text-xs font-black uppercase tracking-widest transition-colors">Descargar PDF</button>
            <button className="text-tp-blue/60 hover:text-tp-red text-xs font-black uppercase tracking-widest transition-colors">Imprimir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
