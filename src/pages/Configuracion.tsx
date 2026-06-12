import React, { useState, useEffect } from 'react';
import {
  Settings, Building2, Calculator, Truck, FileText, Save, Plus, X, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CONFIG_NEGOCIO_DEFAULT, type ConfigNegocio } from '../lib/calculos';
import { cargarConfigNegocio, guardarConfigNegocio } from '../services/paquetes';
import { TIPOS_ENVIO } from '../constants/estados';

/** Editor de listas simples (oficinas, rutas, contenedores). */
function ListaEditable({ titulo, items, onChange, placeholder }: {
  titulo: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [nuevo, setNuevo] = useState('');

  const agregar = () => {
    const valor = nuevo.trim();
    if (!valor || items.includes(valor)) return;
    onChange([...items, valor]);
    setNuevo('');
  };

  return (
    <div>
      <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-2">{titulo}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.length === 0 && <span className="text-xs text-tp-blue/30 italic">Sin elementos.</span>}
        {items.map(item => (
          <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-tp-blue-light text-tp-blue rounded-xl text-xs font-bold">
            {item}
            <button type="button" onClick={() => onChange(items.filter(i => i !== item))} className="hover:text-tp-red transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-tp-gray-soft rounded-lg text-sm text-tp-blue focus:ring-2 focus:ring-tp-blue/20 outline-none"
        />
        <button type="button" onClick={agregar} className="px-3 py-2 bg-tp-blue text-white rounded-lg font-bold text-sm hover:bg-[#004a78] transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Configuracion() {
  const [config, setConfig] = useState<ConfigNegocio>(CONFIG_NEGOCIO_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    cargarConfigNegocio()
      .then(setConfig)
      .finally(() => setIsLoading(false));
  }, []);

  const notificar = (tipo: 'ok' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleGuardar = async () => {
    if (config.factorVolumetrico <= 0) {
      notificar('error', 'El factor volumétrico debe ser mayor que 0.');
      return;
    }
    if (config.tarifaBaseKg <= 0) {
      notificar('error', 'La tarifa base por kilo debe ser mayor que 0.');
      return;
    }
    setIsSaving(true);
    try {
      await guardarConfigNegocio(config);
      notificar('ok', 'Configuración guardada. Los nuevos valores ya se aplican en precios y documentos.');
    } catch (err) {
      console.error('Error guardando configuración:', err);
      notificar('error', 'Error al guardar. Verifica tu conexión y permisos.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";
  const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-tp-blue uppercase tracking-wider mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4 text-tp-red" />
      {children}
    </h3>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-tp-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue flex items-center gap-2">
            <Settings className="w-6 h-6" /> Configuración del Negocio
          </h1>
          <p className="text-tp-blue/60 mt-1">Datos de empresa, tarifas, catálogos logísticos y textos legales</p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={isSaving}
          className="bg-tp-red hover:bg-[#D91F33] text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {mensaje && (
        <div className={cn(
          "rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border",
          mensaje.tipo === 'ok' ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-tp-red"
        )}>
          {mensaje.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      {/* Datos de empresa */}
      <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft">
        <SectionTitle icon={Building2}>Datos de Empresa (aparecen en los documentos)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre Legal</label>
            <input type="text" value={config.empresa.nombre} onChange={e => setConfig({ ...config, empresa: { ...config.empresa, nombre: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Subtítulo / Partner</label>
            <input type="text" value={config.empresa.subtitulo} onChange={e => setConfig({ ...config, empresa: { ...config.empresa, subtitulo: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono</label>
            <input type="tel" value={config.empresa.telefono} onChange={e => setConfig({ ...config, empresa: { ...config.empresa, telefono: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Email</label>
            <input type="email" value={config.empresa.email} onChange={e => setConfig({ ...config, empresa: { ...config.empresa, email: e.target.value } })} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Dirección</label>
            <input type="text" value={config.empresa.direccion} onChange={e => setConfig({ ...config, empresa: { ...config.empresa, direccion: e.target.value } })} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Pie Legal de Documentos</label>
            <input type="text" value={config.empresa.pie} onChange={e => setConfig({ ...config, empresa: { ...config.empresa, pie: e.target.value } })} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Tarifas y cálculo */}
      <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft">
        <SectionTitle icon={Calculator}>Tarifas y Reglas de Cálculo</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Factor Volumétrico</label>
            <input
              type="number"
              min="1"
              value={config.factorVolumetrico}
              onChange={e => setConfig({ ...config, factorVolumetrico: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
            <p className="text-[10px] text-tp-blue/40 mt-1">Peso volumétrico (kg) = volumen (cm³) ÷ factor. Estándar aéreo: 6000.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Tarifa Base (€/kg tasable)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.tarifaBaseKg}
              onChange={e => setConfig({ ...config, tarifaBaseKg: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
            <p className="text-[10px] text-tp-blue/40 mt-1">Se usa cuando el paquete no tiene tarifa de partner u oficina.</p>
          </div>
        </div>
        <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-2">Ajuste por Tipo de Envío (multiplicador, 1 = sin recargo)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIPOS_ENVIO.map(tipo => (
            <div key={tipo}>
              <label className="block text-[10px] font-bold text-tp-blue/40 mb-1 truncate">{tipo}</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={config.recargosTipoEnvio[tipo] ?? 1}
                onChange={e => setConfig({
                  ...config,
                  recargosTipoEnvio: { ...config.recargosTipoEnvio, [tipo]: parseFloat(e.target.value) || 1 },
                })}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Catálogos logísticos */}
      <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft space-y-6">
        <SectionTitle icon={Truck}>Catálogos Logísticos (sugerencias en los formularios de lote)</SectionTitle>
        <ListaEditable
          titulo="Oficinas"
          items={config.oficinas}
          onChange={oficinas => setConfig({ ...config, oficinas })}
          placeholder="Ej: Madrid, España"
        />
        <ListaEditable
          titulo="Rutas"
          items={config.rutas}
          onChange={rutas => setConfig({ ...config, rutas })}
          placeholder="Ej: Madrid → La Habana"
        />
        <ListaEditable
          titulo="Contenedores / Guías"
          items={config.contenedores}
          onChange={contenedores => setConfig({ ...config, contenedores })}
          placeholder="Ej: CNT-001"
        />
      </div>

      {/* Textos legales */}
      <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft">
        <SectionTitle icon={FileText}>Textos Legales</SectionTitle>
        <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Condiciones del Recibo de Paquete</label>
        <textarea
          rows={3}
          value={config.condicionesRecibo}
          onChange={e => setConfig({ ...config, condicionesRecibo: e.target.value })}
          className={cn(inputClass, "resize-none")}
        ></textarea>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          disabled={isSaving}
          className="bg-tp-red hover:bg-[#D91F33] text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
