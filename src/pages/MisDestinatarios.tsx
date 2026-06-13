import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, X, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { db } from '../firebase';
import { auth } from '../supabase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

interface Destinatario {
  id: string;
  clienteId: string;
  nombre: string;
  carnetPasaporte: string;
  telefonoCuba: string;
  email: string;
  direccion: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
}

export function MisDestinatarios() {
  const { user, profile } = useAuth();
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    carnetPasaporte: '',
    telefonoCuba: '',
    email: '',
    direccion: '',
    provincia: '',
    municipio: '',
    codigoPostal: ''
  });

  useEffect(() => {
    const fetchClienteId = async () => {
      if (!user?.email) return;
      const q = query(collection(db, 'clientes'), where('email', '==', user.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setClienteId(snapshot.docs[0].id);
      } else {
        // Auto-create cliente if it doesn't exist
        const newClienteRef = await addDoc(collection(db, 'clientes'), {
          nombre: profile?.name || user.displayName || '',
          documentoIdentidad: profile?.dni || '',
          telefonoEspana: profile?.telefono || '',
          email: user.email,
          direccion: profile?.direccion || '',
          agenteId: 'self',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setClienteId(newClienteRef.id);
      }
    };
    fetchClienteId();
  }, [user, profile]);

  useEffect(() => {
    if (clienteId) {
      const q = query(collection(db, 'destinatarios'), where('clienteId', '==', clienteId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const destData: Destinatario[] = [];
        snapshot.forEach((doc) => {
          destData.push({ id: doc.id, ...doc.data() } as Destinatario);
        });
        setDestinatarios(destData);
      });
      return () => unsubscribe();
    }
  }, [clienteId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'destinatarios'), {
        ...formData,
        clienteId,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({
        nombre: '', carnetPasaporte: '', telefonoCuba: '', email: '',
        direccion: '', provincia: '', municipio: '', codigoPostal: ''
      });
    } catch (error) {
      console.error("Error saving destinatario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este destinatario?')) {
      try {
        await deleteDoc(doc(db, 'destinatarios', id));
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
          className="bg-tp-red hover:bg-[#D91F33] text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Destinatario
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-4 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="font-bold">Nuevo Destinatario</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
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
                  <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Correo Electrónico</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-tp-gray-soft rounded-lg focus:ring-2 focus:ring-tp-blue/20 outline-none" />
                </div>
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
                    <option value="La Habana">La Habana</option>
                    <option value="Santiago de Cuba">Santiago de Cuba</option>
                    <option value="Camagüey">Camagüey</option>
                    <option value="Holguín">Holguín</option>
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
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-tp-blue font-bold hover:bg-tp-blue/5 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-tp-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
