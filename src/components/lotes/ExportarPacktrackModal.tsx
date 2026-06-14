import React, { useState } from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { listClientesByIds } from '../../services/clientes';
import { listDestinatariosByIds } from '../../services/destinatarios';
import { exportarExcelEspana, exportarExcelCuba, type PaquetePacktrack, type DatosExpedicion } from '../../lib/exportPacktrack';
import type { Lote } from '../../types/models';
import type { PaquetePanel } from './PanelLotes';

interface ExportarPacktrackModalProps {
  open: boolean;
  onClose: () => void;
  lote: Lote;
  paquetes: PaquetePanel[];
}

const FORM_INICIAL = {
  mawb: '',
  contenedor: '',
  almacen: '',
  precinto: '',
};

export function ExportarPacktrackModal({ open, onClose, lote, paquetes }: ExportarPacktrackModalProps) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setForm(FORM_INICIAL);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsExporting(true);
    try {
      const datosExpedicion: DatosExpedicion = {
        mawb: form.mawb,
        contenedor: form.contenedor || lote.contenedor || '',
        almacen: form.almacen,
        precinto: form.precinto,
        fecha: lote.fechaEstimadaSalida || new Date().toISOString().slice(0, 10),
      };

      const paquetesExport: PaquetePacktrack[] = paquetes.map(p => ({
        tracking: p.tracking,
        clienteId: p.clienteId,
        clienteNombre: p.clienteNombre,
        destinatarioId: p.destinatarioId,
        destinatarioNombre: p.destinatarioNombre,
        destinatarioTelefono: p.destinatarioTelefono,
        destinatarioDireccion: p.destinatarioDireccion,
        destino: p.destino,
        contenido: p.contenido,
        descripcion: p.descripcion,
        peso: p.peso,
        pesoTasable: p.pesoTasable,
        valorDeclarado: p.valorDeclarado,
        precioAplicado: p.precioAplicado,
      }));

      const clienteIds = paquetes.map(p => p.clienteId || '').filter(Boolean);
      const destinatarioIds = paquetes.map(p => p.destinatarioId || '').filter(Boolean);
      const [clientes, destinatarios] = await Promise.all([
        listClientesByIds(clienteIds),
        listDestinatariosByIds(destinatarioIds),
      ]);

      exportarExcelEspana(paquetesExport, datosExpedicion, clientes, destinatarios, `manifiesto-espana-${lote.codigo}`);
      exportarExcelCuba(paquetesExport, datosExpedicion, `manifiesto-cuba-${lote.codigo}`);

      handleClose();
    } catch (err) {
      console.error('Error exportando para PackTrack:', err);
      setError('Error al generar los archivos. Verifica tu conexión y vuelve a intentarlo.');
    } finally {
      setIsExporting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none text-tp-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
        <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
          <h3 className="font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Exportar para PackTrack — {lote.codigo}
          </h3>
          <button onClick={handleClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-tp-blue/60">
            Se generarán dos archivos Excel (manifiesto España y manifiesto Cuba) con los
            {' '}{paquetes.length} paquete(s) de este lote.
          </p>
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-tp-red text-sm font-medium">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">MAWB</label>
              <input type="text" value={form.mawb} onChange={e => setForm({ ...form, mawb: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Contenedor</label>
              <input type="text" placeholder={lote.contenedor || 'E20-TP'} value={form.contenedor} onChange={e => setForm({ ...form, contenedor: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Almacén de salida</label>
              <input type="text" placeholder="AEROVARADERO" value={form.almacen} onChange={e => setForm({ ...form, almacen: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Precinto</label>
              <input type="text" value={form.precinto} onChange={e => setForm({ ...form, precinto: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isExporting} className="bg-tp-red text-white px-6 py-2 rounded-lg font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50">
              {isExporting ? 'Generando...' : 'Descargar Excel (España + Cuba)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
