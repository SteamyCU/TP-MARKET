import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Mail, UserCheck, Scale, Clock, CheckCircle2 } from 'lucide-react';

export function PoliticaPrivacidad() {
  return (
    <div className="bg-gray-50 min-h-screen py-24 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-10 lg:p-20 shadow-xl border border-tp-gray-soft">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-tp-blue-light rounded-3xl flex items-center justify-center text-tp-blue rotate-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-tp-blue">Política de <span className="text-tp-red">Privacidad</span></h1>
            <p className="text-tp-blue/40 font-bold text-xs uppercase tracking-widest mt-1">Última actualización: 10 de Marzo, 2026</p>
          </div>
        </div>

        <div className="prose prose-lg prose-tp-blue max-w-none space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">1</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Compromiso de Privacidad</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              En To Paquete Logística, la privacidad de nuestros clientes y colaboradores es fundamental. Esta política detalla cómo recopilamos, utilizamos y protegemos su información personal de acuerdo con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">2</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Información que Recopilamos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-tp-blue-light/20 rounded-2xl border border-tp-blue/5">
                <UserCheck className="w-6 h-6 text-tp-blue mb-4" />
                <h4 className="font-black text-tp-blue mb-2">Datos de Identificación</h4>
                <p className="text-sm text-tp-blue/60 m-0">Nombre, DNI/Pasaporte, dirección de correo electrónico y número de teléfono.</p>
              </div>
              <div className="p-6 bg-tp-blue-light/20 rounded-2xl border border-tp-blue/5">
                <Database className="w-6 h-6 text-tp-blue mb-4" />
                <h4 className="font-black text-tp-blue mb-2">Datos de Envío</h4>
                <p className="text-sm text-tp-blue/60 m-0">Direcciones de origen y destino, descripción del contenido y valor declarado.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">3</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Uso de la Información</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Utilizamos su información personal exclusivamente para:
            </p>
            <ul className="space-y-3 text-tp-blue/70 font-medium list-none p-0">
              <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-tp-red shrink-0" /> Procesar y gestionar sus envíos a Cuba.</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-tp-red shrink-0" /> Proporcionar actualizaciones de rastreo en tiempo real.</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-tp-red shrink-0" /> Cumplir con las regulaciones aduanales internacionales.</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-tp-red shrink-0" /> Mejorar la calidad de nuestro servicio de atención al cliente.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">4</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Seguridad de los Datos</h2>
            </div>
            <div className="bg-tp-blue p-8 rounded-3xl text-white relative overflow-hidden">
              <Lock className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12" />
              <p className="relative z-10 text-lg font-medium leading-relaxed m-0">
                Implementamos medidas de seguridad técnicas y organizativas avanzadas para proteger sus datos contra el acceso no autorizado, la pérdida accidental o la destrucción. Toda la información sensible se transmite mediante protocolos de cifrado SSL/TLS.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">5</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Sus Derechos</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales en cualquier momento. Para ejercer estos derechos, puede ponerse en contacto con nuestro Delegado de Protección de Datos.
            </p>
            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-tp-gray-soft">
              <Mail className="w-6 h-6 text-tp-red" />
              <div>
                <p className="text-sm font-black text-tp-blue m-0">Correo de contacto:</p>
                <p className="text-sm font-bold text-tp-red m-0">privacidad@topaquete.com</p>
              </div>
            </div>
          </section>

          <section id="cookies" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-tp-blue text-white rounded-full flex items-center justify-center text-sm font-black">6</div>
              <h2 className="text-2xl font-black text-tp-blue m-0">Cookies</h2>
            </div>
            <p className="text-tp-blue/70 leading-relaxed">
              Nuestro sitio web utiliza cookies técnicas y analíticas para mejorar su experiencia de navegación. Puede configurar su navegador para rechazar todas o algunas cookies, pero esto podría afectar la funcionalidad de la plataforma.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-tp-gray-soft flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-tp-blue/40">
            <Scale className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Cumplimiento RGPD / LOPD</span>
          </div>
          <div className="flex items-center gap-3 text-tp-blue/40">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Revisión Semestral</span>
          </div>
        </div>
      </div>
    </div>
  );
}
