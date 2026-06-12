import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, ShieldCheck, Zap, ArrowRight, ArrowLeft,
  CheckCircle2, Star, Wallet, Globe, Smartphone,
  BarChart3, MessageSquare, MapPin, Clock, XCircle, FileText, Target, Euro
} from 'lucide-react';

export function SerAgenteFreelance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quien-es');

  const tabs = [
    { id: 'quien-es', num: '01', label: 'Quién es' },
    { id: 'que-hace', num: '02', label: 'Qué hace' },
    { id: 'como-capta', num: '03', label: 'Cómo capta' },
    { id: 'su-panel', num: '04', label: 'Su panel' },
    { id: 'reglas', num: '05', label: 'Reglas' },
    { id: 'vs-otros', num: '06', label: 'Vs otros roles' }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <header className="bg-tp-blue py-24 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-tp-red/10 skew-x-12 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <button 
            onClick={() => navigate('/ser-agente')}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver a Modelos de Negocio
          </button>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6">
            <span className="w-2 h-2 bg-tp-red rounded-full animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider">Programa Agente Freelance 2026</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Conviértete en <br/>
            <span className="text-tp-red">Agente Autorizado</span>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl leading-relaxed">
            Gestiona envíos en tu comunidad y gana comisiones competitivas. Te proporcionamos la tecnología y el soporte logístico para que emprendas con éxito.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login?mode=register&role=agente')}
              className="bg-tp-red text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D91F33] transition-all shadow-xl shadow-tp-red/20 flex items-center gap-2"
            >
              SOLICITAR ALTA AHORA <ArrowRight className="w-6 h-6" />
            </button>
            <a href="#beneficios" className="bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all">
              VER BENEFICIOS
            </a>
          </div>
        </div>
      </header>

      {/* Beneficios Específicos */}
      <section id="beneficios" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-tp-blue mb-4">Ventajas de ser Agente Freelance</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Diseñamos este programa para que puedas trabajar a tu ritmo, con total transparencia y el respaldo de una marca líder.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "Altas Comisiones",
              desc: "Gana hasta 2.50€ por cada kilogramo gestionado. Sin techos de ganancia.",
              icon: <Wallet className="w-8 h-8 text-tp-red" />
            },
            {
              title: "App de Gestión",
              desc: "Registra paquetes, escanea etiquetas y sigue envíos desde tu móvil.",
              icon: <Smartphone className="w-8 h-8 text-tp-blue" />
            },
            {
              title: "Soporte VIP",
              desc: "Canal directo vía WhatsApp con nuestro equipo de logística 24/7.",
              icon: <MessageSquare className="w-8 h-8 text-tp-red" />
            },
            {
              title: "Pagos Semanales",
              desc: "Liquidamos tus comisiones acumuladas cada semana sin esperas.",
              icon: <TrendingUp className="w-8 h-8 text-tp-blue" />
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-tp-gray-soft hover:shadow-xl transition-all group">
              <div className="mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="text-xl font-black text-tp-blue mb-2">{item.title}</h4>
              <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Manual del Agente - Tabs Dinámicos */}
      <section className="py-24 px-6 max-w-6xl mx-auto bg-white border border-tp-gray-soft rounded-[3rem] my-12 text-tp-blue shadow-xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">Manual del Agente</h2>
          <p className="text-tp-blue/60 text-lg max-w-2xl mx-auto">Todo lo que necesitas saber sobre el rol, responsabilidades y herramientas.</p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap md:flex-nowrap gap-2 mb-12 border-b border-tp-gray-soft pb-4 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-4 px-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 ${
                activeTab === tab.id 
                  ? 'bg-tp-blue-light/10 border border-tp-blue/20 text-tp-blue shadow-sm' 
                  : 'text-tp-blue/50 hover:text-tp-blue hover:bg-tp-blue-light/5 border border-transparent'
              }`}
            >
              <span className={`text-xl font-black ${activeTab === tab.id ? 'text-tp-red' : ''}`}>{tab.num}</span>
              <span className="font-bold text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'quien-es' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-2xl font-black text-tp-blue/50 uppercase tracking-widest mb-8">Identidad del Rol</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl">
                  <h4 className="text-xl font-bold mb-6 flex items-center gap-3"><Users className="text-tp-red" /> Perfil del agente</h4>
                  <ul className="space-y-4">
                    {['Persona física o empresa independiente', 'Firma contrato de agencia mercantil', 'Zona geográfica asignada o libre', 'No es empleado — es colaborador externo', 'Trabaja a comisión + incentivos por objetivos'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-tp-blue/80">
                        <div className="w-2 h-2 rounded-full bg-tp-red mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl">
                  <h4 className="text-xl font-bold mb-6 flex items-center gap-3"><Target className="text-tp-blue" /> Diferencia clave con afiliado</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-tp-blue/80"><div className="w-2 h-2 rounded-full bg-tp-red mt-2 shrink-0" /> El afiliado capta online de forma pasiva</li>
                    <li className="flex items-start gap-3 text-tp-blue/80"><div className="w-2 h-2 rounded-full bg-tp-red mt-2 shrink-0" /> El agente capta de forma activa y presencial</li>
                    <li className="flex items-start gap-3 text-tp-blue/80"><div className="w-2 h-2 rounded-full bg-tp-blue mt-2 shrink-0" /> El agente negocia condiciones con el cliente</li>
                    <li className="flex items-start gap-3 text-tp-blue/80"><div className="w-2 h-2 rounded-full bg-tp-blue mt-2 shrink-0" /> El agente gestiona su cartera mes a mes</li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                  <div className="text-4xl font-black text-tp-blue mb-2">20%</div>
                  <div className="text-tp-blue/60 text-sm font-bold uppercase">Comisión Máx.</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                  <div className="text-4xl font-black text-tp-blue mb-2">∞</div>
                  <div className="text-tp-blue/60 text-sm font-bold uppercase">Cartera Propia</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                  <div className="text-4xl font-black text-tp-blue mb-2">48h</div>
                  <div className="text-tp-blue/60 text-sm font-bold uppercase">Alta de Cliente</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'que-hace' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-2xl font-black text-tp-blue/50 uppercase tracking-widest mb-8">Responsabilidades del Agente</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl">
                  <h4 className="text-xl font-bold mb-6 flex items-center gap-3"><CheckCircle2 className="text-green-500" /> Tareas principales</h4>
                  <ul className="space-y-4">
                    {['Prospectar empresas que generen envíos', 'Presentar la propuesta comercial', 'Negociar tarifas dentro del margen autorizado', 'Dar de alta al cliente en el sistema', 'Acompañar onboarding del nuevo cliente', 'Fidelizar y hacer seguimiento mensual', 'Reportar actividad comercial a la empresa'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-tp-blue/80">
                        <div className="w-2 h-2 rounded-full bg-tp-red mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-8">
                  <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl">
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-3"><XCircle className="text-tp-red" /> Lo que NO hace el agente</h4>
                    <ul className="space-y-4">
                      {['No manipula paquetes físicamente', 'No gestiona incidencias de envío', 'No cobra directamente al cliente', 'No firma contratos sin autorización'].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-tp-blue/80">
                          <div className="w-2 h-2 rounded-full bg-tp-red mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl">
                    <h4 className="text-xl font-bold mb-6">Sectores objetivo prioritarios</h4>
                    <div className="flex flex-wrap gap-2">
                      {['E-commerce', 'Tiendas físicas', 'Proveedores B2B', 'Artesanía / makers', 'Importadores', 'Farmacias', 'Joyerías', 'Talleres'].map((tag, i) => (
                        <span key={i} className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium text-tp-blue/90">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'como-capta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-2xl font-black text-tp-blue/50 uppercase tracking-widest mb-8">Proceso de Captación Paso a Paso</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-tp-blue/10 before:to-transparent">
                {[
                  { step: "1", title: "Identificar prospecto", desc: "El agente localiza negocios que envían paquetes regularmente. Puede ser por visita física, búsqueda en redes, referencias de otros clientes o ferias sectoriales.", tool: "Herramienta: mapa de zona en app del agente" },
                  { step: "2", title: "Primera toma de contacto", desc: "Visita presencial, llamada o email. El agente presenta la empresa y solicita una reunión de valoración. Registra el contacto en el CRM del agente.", tool: "Estado CRM: Prospecto contactado" },
                  { step: "3", title: "Análisis de necesidades", desc: "Reunión con el cliente para conocer su volumen de envíos, destinos habituales, peso medio, urgencias y presupuesto actual. El agente completa un formulario de valoración.", tool: "Estado CRM: Valoración en curso" },
                  { step: "4", title: "Enviar propuesta personalizada", desc: "Con los datos del formulario, el sistema genera automáticamente una propuesta con tarifas ajustadas al volumen. El agente la envía desde su panel y la firma digitalmente.", tool: "Sistema: propuesta PDF auto-generada" },
                  { step: "5", title: "Alta del cliente", desc: "El cliente acepta. El agente registra el alta en el panel: datos de empresa, CIF, IBAN y tipo de plan. El cliente queda vinculado al agente de forma permanente.", tool: "Estado CRM: Cliente activo" },
                  { step: "6", title: "Seguimiento y fidelización", desc: "El agente revisa mensualmente la actividad de su cartera. Si un cliente baja de volumen, actúa. Si uno crece, propone un upgrade de plan. La comisión es vitalicia mientras el cliente esté activo.", tool: "Recurrente: comisión mientras el cliente envía" }
                ].map((item, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-tp-blue text-white font-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10">
                      {item.step}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-gray-50 border border-gray-200 p-6 rounded-3xl hover:bg-gray-100 transition-colors">
                      <h4 className="text-xl font-bold mb-2 text-tp-blue">{item.title}</h4>
                      <p className="text-tp-blue/70 text-sm leading-relaxed mb-4">{item.desc}</p>
                      <span className="inline-block bg-tp-blue-light/10 text-tp-blue px-3 py-1 rounded-full text-xs font-bold border border-tp-blue/20">{item.tool}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'su-panel' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-2xl font-black text-tp-blue/50 uppercase tracking-widest mb-8">Herramientas del Panel del Agente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: <Users className="w-6 h-6" />, title: "Gestión de cartera (CRM)", desc: "Lista de todos los clientes captados, su estado (activo, inactivo, prospecto), volumen del mes y comisión generada. Filtrable y exportable." },
                  { icon: <Euro className="w-6 h-6" />, title: "Dashboard de ganancias", desc: "Resumen visual de comisiones del mes: confirmadas, pendientes y liquidadas. Gráfico de evolución mensual y proyección anual." },
                  { icon: <FileText className="w-6 h-6" />, title: "Generador de propuestas", desc: "Formulario de valoración que genera automáticamente una propuesta comercial en PDF con las tarifas correctas según el volumen declarado por el prospecto." },
                  { icon: <ArrowRight className="w-6 h-6" />, title: "Alta de cliente", desc: "Formulario de registro del cliente nuevo. Una vez enviado, el cliente recibe un email con sus credenciales y queda vinculado permanentemente al agente." },
                  { icon: <Target className="w-6 h-6" />, title: "Objetivos y ranking", desc: "Barra de progreso hacia el siguiente nivel (Bronce → Plata → Oro → Élite). Ranking de agentes de la zona para fomentar competencia sana." },
                  { icon: <Wallet className="w-6 h-6" />, title: "Solicitar liquidación", desc: "Con un clic el agente solicita el pago de las comisiones confirmadas. La empresa transfiere en los siguientes 5 días hábiles al IBAN registrado." }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 p-6 rounded-3xl flex gap-4 hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-tp-red shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-tp-blue mb-2">{item.title}</h4>
                      <p className="text-tp-blue/60 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reglas' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-2xl font-black text-tp-blue/50 uppercase tracking-widest mb-8">Reglas del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-green-50 border border-green-200 p-8 rounded-3xl">
                  <h4 className="text-xl font-bold mb-6 text-green-700">El agente PUEDE</h4>
                  <ul className="space-y-4">
                    {['Aplicar descuentos dentro del margen autorizado', 'Captar clientes de cualquier sector', 'Tener sub-agentes bajo su supervisión', 'Trabajar para varias empresas si no hay exclusividad', 'Ver en tiempo real su comisión acumulada', 'Renegociar el contrato si supera objetivos'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-green-800">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 p-8 rounded-3xl">
                  <h4 className="text-xl font-bold mb-6 text-red-700">El agente NO PUEDE</h4>
                  <ul className="space-y-4">
                    {['Prometer tarifas fuera de lo autorizado', 'Dar de alta a clientes sin su validación', 'Cobrar dinero directamente al cliente', 'Ser también cliente de la empresa', 'Trabajar con competidores directos si hay exclusividad', 'Ceder su cartera sin autorización'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-red-800">
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl mt-8">
                <h4 className="text-xl font-bold mb-6">Anti-fraude y control</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Verificación de CIF del cliente en alta', 'Validación de IBAN del agente antes de pagar', 'Comisión no se paga hasta cliente activo 30 días', 'Límite 1.000€ primer mes de alta', 'Bloqueo automático si tasa baja > 30%', 'Auditoria trimestral de cartera activa'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-tp-blue/80">
                      <div className="w-2 h-2 rounded-full bg-tp-red shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vs-otros' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-2xl font-black text-tp-blue/50 uppercase tracking-widest mb-8">Comparativa de Roles</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-4 text-tp-blue/50 font-bold uppercase text-sm">Aspecto</th>
                      <th className="p-4 text-tp-blue/50 font-bold uppercase text-sm">Sistema A — Influencer</th>
                      <th className="p-4 text-tp-blue/50 font-bold uppercase text-sm">Sistema B — B2B / Punto</th>
                      <th className="p-4 text-tp-red font-bold uppercase text-sm">Sistema C — Agente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { aspect: "Tipo de captación", a: "Pasiva — link / código", b: "Contractual — empresa ya conocida", c: "Activa — visita y negociación" },
                      { aspect: "Perfil", a: "Creador de contenido", b: "E-commerce o local", c: "Comercial experto" },
                      { aspect: "Relación empresa", a: "Plataforma digital", b: "Contrato de servicio", c: "Contrato de agencia" },
                      { aspect: "Comisión base", a: "3% - 10% por envío", b: "Descuento 0% - 40%", c: "5% - 20% por envío" },
                      { aspect: "Negocia tarifas", a: "No", b: "No (tarifa fija por plan)", c: "Sí, dentro de margen" },
                      { aspect: "Gestiona cartera", a: "No (captación pasiva)", b: "No", c: "Sí, seguimiento activo" },
                      { aspect: "Atribución", a: "Cookie 90 días", b: "Contrato permanente", c: "Vínculo permanente" },
                      { aspect: "Facturación", a: "Recibe transferencia", b: "Paga factura mensual", c: "Emite factura mensual" },
                      { aspect: "Potencial ingreso", a: "Variable, ilimitado", b: "Ahorro en coste", c: "6.000€/mes en Élite" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-tp-blue/70 font-medium">{row.aspect}</td>
                        <td className="p-4 text-tp-blue/90">{row.a}</td>
                        <td className="p-4 text-tp-blue/90">{row.b}</td>
                        <td className="p-4 font-bold text-tp-red">{row.c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-tp-blue leading-tight">¿Qué necesitas para <br/><span className="text-tp-red">empezar?</span></h2>
            <p className="text-tp-blue/60 text-lg leading-relaxed">
              No necesitas una oficina física ni grandes inversiones. Queremos personas comprometidas y con ganas de crecer.
            </p>
            <div className="space-y-4">
              {[
                "Residir en España (Cualquier provincia).",
                "Dispositivo móvil con conexión a internet.",
                "Espacio mínimo para almacenamiento temporal (opcional).",
                "Capacidad de gestión y atención al cliente.",
                "DNI / NIE en vigor."
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-tp-blue">
                  <CheckCircle2 className="w-5 h-5 text-tp-red" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-tp-gray-soft shadow-xl">
            <h3 className="text-2xl font-black text-tp-blue mb-6">Proceso de Alta</h3>
            <div className="space-y-8">
              {[
                { step: "1", title: "Registro Online", desc: "Completa el formulario con tus datos básicos." },
                { step: "2", title: "Validación", desc: "Nuestro equipo revisa tu perfil en 24-48 horas." },
                { step: "3", title: "Capacitación", desc: "Acceso a videos tutoriales sobre el uso de la App." },
                { step: "4", title: "¡Listo!", desc: "Empieza a recibir paquetes y ganar comisiones." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-10 h-10 bg-tp-blue text-white rounded-full flex items-center justify-center font-black shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-black text-tp-blue">{item.title}</h4>
                    <p className="text-sm text-tp-blue/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-tp-blue p-16 rounded-[4rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-tp-red/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 relative z-10">Únete a la familia <br/>To Paquete</h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Estamos buscando agentes en todas las provincias de España. No pierdas la oportunidad de ser el referente de envíos a Cuba en tu zona.
          </p>
          <button 
            onClick={() => navigate('/login?mode=register&role=agente')}
            className="bg-tp-red text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#D91F33] transition-all shadow-2xl shadow-tp-red/40 relative z-10"
          >
            SOLICITAR MI ALTA DE AGENTE
          </button>
        </div>
      </section>
    </div>
  );
}
