import React, { useState, useEffect } from 'react';
import { subscribeProfiles, createStaffProfile, updateProfileFields, deleteProfile } from '../services/profiles';
import { Users, Shield, UserCog, Trash2, Mail, Phone, MapPin, Building2, Search, Filter, MoreVertical, CheckCircle2, XCircle, CreditCard, Plus, Wallet } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agente' | 'influencer' | 'partner' | 'cliente' | 'contabilidad' | 'logistica';
  telefono?: string;
  dni?: string;
  direccion?: string;
  oficina?: string;
  socialHandle?: string;
  businessName?: string;
  precioPorKilo?: number;
  notas?: string;
  balance?: number;
  createdAt?: any;
}

export function Usuarios() {
  const { role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditAgentModalOpen, setIsEditAgentModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'agente' as 'agente' | 'contabilidad' | 'logistica',
    oficina: '',
    telefono: ''
  });
  const [editFormData, setEditFormData] = useState({
    notas: '',
    balance: 0
  });

  if (currentUserRole !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    const unsubscribe = subscribeProfiles(
      { roles: ['agente', 'contabilidad', 'logistica'] },
      (profiles) => {
        setUsers(profiles as unknown as UserProfile[]);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating('new');
    try {
      const { email, role, ...rest } = newUser;
      await createStaffProfile(role, email, rest);
      setIsNewUserModalOpen(false);
      setNewUser({ email: '', name: '', role: 'agente', oficina: '', telefono: '' });
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error al crear el usuario.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleOpenEditAgent = (user: UserProfile) => {
    setSelectedUser(user);
    setEditFormData({
      notas: user.notas || '',
      balance: user.balance || 0
    });
    setIsEditAgentModalOpen(true);
  };

  const handleUpdateAgentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsUpdating(selectedUser.id);
    try {
      await updateProfileFields(selectedUser.id, { ...editFormData });
      setIsEditAgentModalOpen(false);
    } catch (error) {
      console.error("Error updating agent details:", error);
      alert("Error al actualizar los detalles.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) return;
    
    try {
      await deleteProfile(userId);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar el usuario.");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.dni?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tp-blue">Gestión de Usuarios y Agentes</h1>
          <p className="text-tp-blue/60 text-sm">Administra los roles y permisos de toda la red logística</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-tp-gray-soft flex items-center gap-2">
            <Users className="w-4 h-4 text-tp-blue/40" />
            <span className="text-sm font-bold text-tp-blue">{users.length} Usuarios</span>
          </div>
          <button 
            onClick={() => setIsNewUserModalOpen(true)}
            className="bg-tp-red hover:bg-[#D91F33] text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar Agente
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-tp-gray-soft flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/30" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
          />
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-tp-blue/70 font-medium border-b border-tp-gray-soft">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Oficina</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-2 border-tp-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-tp-blue/50">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-tp-blue/50">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tp-blue-light flex items-center justify-center text-tp-blue font-bold">
                          {user.name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-tp-blue flex items-center gap-2">
                            {user.name || 'Sin nombre'}
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                              user.role === 'agente' ? "bg-tp-blue-light text-tp-blue" :
                              user.role === 'contabilidad' ? "bg-green-100 text-green-700" :
                              "bg-purple-100 text-purple-700"
                            )}>
                              {user.role === 'logistica' ? 'Logística' : user.role}
                            </span>
                          </div>
                          <div className="text-xs text-tp-blue/50 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit bg-tp-blue-light text-tp-blue">
                          <Building2 className="w-3 h-3" />
                          {user.oficina || 'Sin oficina'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-xs text-tp-blue/70 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {user.telefono || 'N/A'}
                        </div>
                        <div className="text-xs text-tp-blue/70 flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3" /> {user.dni || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-tp-blue/30 hover:text-tp-red hover:bg-tp-red/5 rounded-lg transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link 
                          to={`/contabilidad?agente=${user.id}`}
                          className="p-2 text-tp-blue/30 hover:text-tp-blue hover:bg-tp-blue-light rounded-lg transition-all"
                          title="Contabilidad de Agente"
                        >
                          <Wallet className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modales */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Agregar Miembro del Equipo</h3>
              <button onClick={() => setIsNewUserModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'agente' | 'contabilidad' | 'logistica' })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                >
                  <option value="agente">Agente (operación completa)</option>
                  <option value="logistica">Logística (recepción, estados y lotes)</option>
                  <option value="contabilidad">Contabilidad (pagos, gastos y reportes)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Email</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Nombre</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Oficina</label>
                <input 
                  type="text" 
                  required
                  value={newUser.oficina}
                  onChange={(e) => setNewUser({...newUser, oficina: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isUpdating === 'new'}
                  className="w-full bg-tp-red text-white py-3 rounded-xl font-bold hover:bg-[#D91F33] transition-colors disabled:opacity-50"
                >
                  {isUpdating === 'new' ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditAgentModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tp-blue/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-tp-gray-soft flex justify-between items-center bg-tp-blue text-white">
              <h3 className="text-xl font-bold">Configurar Agente: {selectedUser.name}</h3>
              <button onClick={() => setIsEditAgentModalOpen(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdateAgentDetails} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Balance Actual (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={isNaN(editFormData.balance || 0) ? '' : editFormData.balance}
                  onChange={(e) => setEditFormData({...editFormData, balance: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tp-blue/50 uppercase mb-1.5">Notas / Observaciones</label>
                <textarea 
                  rows={4}
                  value={editFormData.notas}
                  onChange={(e) => setEditFormData({...editFormData, notas: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-tp-gray-soft rounded-xl text-tp-blue focus:outline-none focus:ring-2 focus:ring-tp-blue/20 resize-none"
                ></textarea>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isUpdating === selectedUser.id}
                  className="w-full bg-tp-blue text-white py-3 rounded-xl font-bold hover:bg-[#004a78] transition-colors disabled:opacity-50"
                >
                  {isUpdating === selectedUser.id ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
