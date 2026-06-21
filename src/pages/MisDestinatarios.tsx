import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Pencil, X, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getClienteByEmail, createCliente } from '../services/clientes';
import { subscribeDestinatarios, createDestinatario, updateDestinatario, deleteDestinatario } from '../services/destinatarios';
import { PROVINCIAS_CUBA } from '../constants/estados';

interface Destinatario {
  id: string;
  clienteId: string;
  nombre: string;
  carnetPasaporte: string;
  telefonoCuba: string;
  telefonoSecundario: string;
  email: string;
  direccion: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
}

const FORM_INICIAL = {
  nombre: '',
  carnetPasaporte: '',
  telefonoCuba: '',
  telefonoSecundario: '',
  email: '',
  direccion: '',
  provincia: '',
  municipio: '',
  codigoPostal: '',
};

export function MisDestinatarios() {
  const { user, profile } = useAuth();
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState(FORM_INICIAL);

  useEffect(() => {
    const fetchClienteId = async () => {
      if (!user?.email) return;
      const existente = await getClienteByEmail(user.email);
      if (existente) {
        setClienteId(existente.id);
      } else {
        // Auto-create cliente if it doesn't exist
        const nuevo = await createCliente({
          nombre: profile?.name || user.displayName || '',
          documentoIdentidad: profile?.dni || '',
          telefonoEspana: profile?.telefono || '',
          email: user.email,
          direccion: profile?.direccion || '',
          agenteId: null,
        });
        setClienteId(nuevo.id);
      }
    };
    fetchClienteId();
  }, [user, profile]);

  useEffect(() => {
    if (clienteId) {
      const unsubscribe = subscribeDestinatarios({ clienteId }, (data) => {
        setDestinatarios(data as unknown as Destinatario[]);
      });
      return () => unsubscribe();
    }
  }, [clienteId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clienteId) {
      setError('No se pudo identificar tu cuenta. Cierra esta ventana, recarga la página e inténtalo de nuevo. Si el problema persiste, contacta con soporte.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDestinatario(editingId, formData);
      } else {
        await createDestinatario({
          ...formData,
          clienteId,
        });
      }
      closeModal();
    } catch (err) {
      console.error("Error saving destinatario:", err);
      setError('Error al guardar el destinatario. Verifica tu conexión y permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(FORM_INICIAL);
    setError(null);
  };

  const handleEdit = (dest: Destinatario) => {
    setEditingId(dest.id);
    setFormData({
      nombre: dest.nombre,
      carnetPasaporte: dest.carnetPasaporte,
      telefonoCuba: dest.telefonoCuba,
      telefonoSecundario: dest.telefonoSecundario || '',
      email: dest.email || '',
      direccion: dest.direccion,
      provincia: dest.provincia,
      municipio: dest.municipio,
      codigoPostal: dest.codigoPostal || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este destinatario?')) {
      try {
        await deleteDestinatario(id);
      } catch (error) {
        console.error("Error deleting destinatario:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Mis Destinatarios</h1>
          <p className="text-tp-blue/60 mt-1">Gestiona las personas que recibirán tus paquetes en Cuba</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!clienteId}
          title={!clienteId ? 'Cargando tu cuenta…' : undefined}
          className="bg-tp-red hover:bg-[#D91F33] text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          {clienteId ? 'Nuevo Destinatario' : 'Cargando...'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Carnet / Pasaporte</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Provincia</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {destinatarios.map((dest) => (
                <tr key={dest.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-tp-blue">{dest.nombre}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{dest.carnetPasaporte}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{dest.telefonoCuba}</td>
                  <td className="px-5 py-4 text-tp-blue/70">{dest.provincia}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleEdit(dest)}
                      className="text-tp-blue hover:text-[#004a78] p-2 transition-colors"
                      title="Editar Destinatario"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      className="text-tp-red hover:text-red-700 p-2 transition-colors"
                      title="Eliminar Destinatario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {destinatarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-tp-blue/50">
                    No tienes destinatarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white shrink-0">
              <h3 className="font-bold">{editingId ? 'Editar Destinatario' : 'Nuevo Destinatario'}</h3>
              <button onClick={closeModal} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form id="form-mis-destinatarios" onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-tp-red text-sm font-medium">{error}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre *</label>
                <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Carnet o Pasaporte *</label>
                  <input type="text" required value={formData.carnetPasaporte} onChange={e => setFormData({...formData, carnetPasaporte: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono en Cuba *</label>
                  <input type="tel" required value={formData.telefonoCuba} onChange={e => setFormData({...formData, telefonoCuba: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Teléfono Secundario</label>
                  <input type="tel" value={formData.telefonoSecundario} onChange={e => setFormData({...formData, telefonoSecundario: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Calle, número, piso, etc. *</label>
                <textarea required rows={2} value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none resize-none"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Provincia *</label>
                  <select required value={formData.provincia} onChange={e => setFormData({...formData, provincia: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    {PROVINCIAS_CUBA.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Municipio *</label>
                  <input type="text" required value={formData.municipio} onChange={e => setFormData({...formData, municipio: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Código Postal</label>
                  <input type="text" value={formData.codigoPostal} onChange={e => setFormData({...formData, codigoPostal: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
              </div>
            </form>
            <div className="p-4 border-t border-tp-gray-soft flex justify-end gap-3 shrink-0 bg-white">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" form="form-mis-destinatarios" disabled={isSubmitting} className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50">
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
