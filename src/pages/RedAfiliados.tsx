import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Package, ArrowUpRight, Search, Filter, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { subscribeProfiles } from '../services/profiles';

export function RedAfiliados() {
  const { user } = useAuth();
  const [network, setNetwork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'influencer' | 'cliente'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeProfiles(
      { extraKey: 'referidoPor', extraValue: user.uid },
      (profiles) => {
        setNetwork(profiles);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredNetwork = network.filter(member => {
    const matchesFilter = filter === 'todos' || member.role === filter;
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: network.length,
    subAfiliados: network.filter(m => m.role === 'influencer').length,
    clientes: network.filter(m => m.role === 'cliente').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-tp-blue tracking-tight">Mi Red de Afiliados</h1>
        <p className="text-tp-blue/70 mt-1">Gestiona tus sub-afiliados y clientes referidos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-tp-blue/5 rounded-xl flex items-center justify-center text-tp-blue">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-tp-blue/50 uppercase tracking-wider">Total en tu Red</p>
              <p className="text-3xl font-black text-tp-blue">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-tp-red/5 rounded-xl flex items-center justify-center text-tp-red">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-tp-blue/50 uppercase tracking-wider">Sub-Afiliados</p>
              <p className="text-3xl font-black text-tp-blue">{stats.subAfiliados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-tp-gray-soft shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/5 rounded-xl flex items-center justify-center text-green-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-tp-blue/50 uppercase tracking-wider">Clientes Directos</p>
              <p className="text-3xl font-black text-tp-blue">{stats.clientes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="bg-white rounded-2xl border border-tp-gray-soft shadow-sm overflow-hidden">
        <div className="p-6 border-b border-tp-gray-soft flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex-1 md:flex-none ${
                filter === 'todos' 
                  ? 'bg-tp-blue text-white shadow-md' 
                  : 'bg-white text-tp-blue/70 border border-tp-gray-soft hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('influencer')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex-1 md:flex-none ${
                filter === 'influencer' 
                  ? 'bg-tp-blue text-white shadow-md' 
                  : 'bg-white text-tp-blue/70 border border-tp-gray-soft hover:bg-gray-50'
              }`}
            >
              Sub-Afiliados
            </button>
            <button
              onClick={() => setFilter('cliente')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex-1 md:flex-none ${
                filter === 'cliente' 
                  ? 'bg-tp-blue text-white shadow-md' 
                  : 'bg-white text-tp-blue/70 border border-tp-gray-soft hover:bg-gray-50'
              }`}
            >
              Clientes
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tp-blue/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-tp-gray-soft">
                <th className="p-4 text-xs font-bold text-tp-blue/50 uppercase tracking-wider">Usuario</th>
                <th className="p-4 text-xs font-bold text-tp-blue/50 uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-tp-blue/50 uppercase tracking-wider">Fecha de Registro</th>
                <th className="p-4 text-xs font-bold text-tp-blue/50 uppercase tracking-wider text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-gray-soft">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-tp-blue/50">
                    <div className="w-6 h-6 border-2 border-tp-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando red...
                  </td>
                </tr>
              ) : filteredNetwork.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-tp-blue/50">
                    No se encontraron usuarios en tu red.
                  </td>
                </tr>
              ) : (
                filteredNetwork.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tp-blue/5 flex items-center justify-center text-tp-blue font-bold">
                          {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-tp-blue">{member.name || 'Usuario sin nombre'}</p>
                          <p className="text-xs text-tp-blue/60">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        member.role === 'influencer' 
                          ? 'bg-tp-red/10 text-tp-red' 
                          : 'bg-green-500/10 text-green-600'
                      }`}>
                        {member.role === 'influencer' ? 'Sub-Afiliado' : 'Cliente'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-tp-blue/70">
                      {member.createdAt?.toDate().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) || 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Activo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
