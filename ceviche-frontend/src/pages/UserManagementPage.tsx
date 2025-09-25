import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';
import { UserForm } from '../components/admin/UserForm';
import { UserPermissions } from '../components/admin/UserPermissions';
import {
  UserPlusIcon,
  UserIcon,
  ShieldCheckIcon,
  CogIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  UserIcon as UserIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  CogIcon as CogIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';

// --- Interfaces ---
interface ApiUser {
  id: number;
  usuario: string;
  correo: string;
  rol: string;
  estacion?: string | null;
  activo: boolean;
  intentos_fallidos: number;
  bloqueado_hasta?: string | null;
  preferencias?: any;
  avatar?: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export function UserManagementPage() {
  // --- Estados ---
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<ApiUser> | null>(null);
  const [viewingUser, setViewingUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [managingPermissionsForUser, setManagingPermissionsForUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // --- Lógica de Datos ---
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<ApiUser[]>('/api/admin/users');
      setUsers(data);
    } catch (error) {
      toast.error('No se pudo cargar la lista de usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Manejadores de Modales ---
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user: ApiUser) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleOpenViewModal = (user: ApiUser) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const handleOpenPermissionsModal = (user: ApiUser) => {
    setManagingPermissionsForUser(user);
    setIsPermissionsModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsViewModalOpen(false);
    setIsPermissionsModalOpen(false);
    setEditingUser(null);
    setViewingUser(null);
    setUserToDelete(null);
    setManagingPermissionsForUser(null);
  };

  // --- Lógica de CRUD ---
  const handleSaveUser = async (userData: Partial<ApiUser>) => {
    const isEditing = editingUser && editingUser.id;
    const endpoint = isEditing ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = isEditing ? apiClient.put : apiClient.post;
    
    setIsLoading(true);
    try {
      await method(endpoint, userData);
      toast.success(`Usuario ${isEditing ? 'actualizado' : 'creado'} exitosamente.`);
      handleCloseModals();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al guardar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await apiClient.del(`/api/admin/users/${userToDelete.id}`);
      toast.success('Usuario eliminado exitosamente.');
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar el usuario.');
    } finally {
      handleCloseModals();
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Funciones de filtrado
  const filteredUsers = users.filter(user => {
    // Excluir administradores de la lista
    if (user.rol === 'admin') {
      return false;
    }
    
    const matchesSearch = user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.correo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'admin':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-full border border-red-200 dark:border-red-800"
          >
            <ShieldCheckIconSolid className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Admin</span>
          </motion.div>
        );
      case 'mozo':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-full border border-blue-200 dark:border-blue-800"
          >
            <UserIconSolid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Mozo</span>
          </motion.div>
        );
      case 'cocina':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 rounded-full border border-orange-200 dark:border-orange-800"
          >
            <CogIconSolid className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Cocina</span>
          </motion.div>
        );
      case 'caja':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-full border border-green-200 dark:border-green-800"
          >
            <CheckCircleIconSolid className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Caja</span>
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-full border border-gray-200 dark:border-gray-600"
          >
            <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide capitalize">{rol}</span>
          </motion.div>
        );
    }
  };

  const getStatusIcon = (activo: boolean, intentosFallidos: number) => {
    if (!activo) {
      return (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-full border border-red-200 dark:border-red-800"
        >
          <XCircleIconSolid className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-xs font-semibold text-red-700 dark:text-red-300">Inactivo</span>
        </motion.div>
      );
    }

    if (intentosFallidos > 0) {
      return (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-full border border-yellow-200 dark:border-yellow-800"
        >
          <ClockIconSolid className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
            {intentosFallidos} intentos
          </span>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-full border border-green-200 dark:border-green-800"
      >
        <CheckCircleIconSolid className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-xs font-semibold text-green-700 dark:text-green-300">Activo</span>
      </motion.div>
    );
  };


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="min-h-screen"
      >
        {/* Header con estadísticas visuales */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                Gestión de Usuarios
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                Administra y supervisa todos los usuarios del sistema
              </p>
            </motion.div>

            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 group transform hover:scale-105"
            >
              <UserPlusIcon className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Añadir Usuario</span>
            </motion.button>
          </div>

          {/* Estadísticas rápidas */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{users.length}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Usuarios</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-2xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-xl">
                  <CheckCircleIconSolid className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {users.filter(u => u.activo).length}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Usuarios Activos</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-xl">
                  <XCircleIconSolid className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {users.filter(u => !u.activo).length}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">Usuarios Inactivos</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500 rounded-xl">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {filteredUsers.length}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Mostrando</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Buscar por usuario, correo o estación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-400"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
            <div className="lg:w-64">
              <div className="relative group">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-400 appearance-none"
                >
                  <option value="all">🔍 Todos los roles</option>
                  <option value="admin">🛡️ Administradores</option>
                  <option value="mozo">👨‍🍳 Mozos</option>
                  <option value="cocina">👨‍🍳 Cocina</option>
                  <option value="caja">💰 Caja</option>
                </select>
                <FunnelIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-4 top-3.5 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Contenido principal - Grid de cards de usuarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <AnimatePresence mode="wait">
            {isLoading && users.length === 0 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cargando usuarios...
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Obteniendo información del sistema
                </p>
              </motion.div>
            ) : filteredUsers.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserIcon className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Intenta ajustar los filtros de búsqueda o añade nuevos usuarios
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Añadir Primer Usuario
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-700 group transition-all duration-300"
                  >
                    {/* Header del usuario */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center overflow-hidden ring-4 ring-slate-100 dark:ring-slate-700 group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all duration-300">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.usuario}
                              className="w-16 h-16 rounded-2xl object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<svg class="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                                }
                              }}
                            />
                          ) : (
                            <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusIcon(user.activo, user.intentos_fallidos)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate">
                          {user.usuario}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {user.correo}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getRoleIcon(user.rol)}
                          {user.estacion && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                              📍 {user.estacion}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">ID:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">#{user.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Última actualización:</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatDate(user.fecha_actualizacion)}</span>
                      </div>
                      {user.intentos_fallidos > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Intentos fallidos:</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                            {user.intentos_fallidos}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acciones */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenViewModal(user)}
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 group border border-blue-200 dark:border-blue-800"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenPermissionsModal(user)}
                          className="p-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200 group border border-purple-200 dark:border-purple-800"
                          title="Gestionar Permisos"
                        >
                          <KeyIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                        </motion.button>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 group border border-green-200 dark:border-green-800"
                          title="Editar usuario"
                        >
                          <PencilSquareIcon className="h-4 w-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setUserToDelete(user)}
                          className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 group border border-red-200 dark:border-red-800"
                          title="Eliminar usuario"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Modal para Crear/Editar Usuario */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals} title={editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}>
        <UserForm editingUser={editingUser} onSave={handleSaveUser} onCancel={handleCloseModals} isLoading={isLoading} />
      </Modal>

      {/* Modal para Ver Detalles del Usuario */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseModals} title={`👤 ${viewingUser?.usuario}`}>
        {viewingUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header del usuario */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b dark:border-slate-700">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center overflow-hidden ring-4 ring-slate-200 dark:ring-slate-600 shadow-lg">
                  {viewingUser.avatar ? (
                    <img
                      src={viewingUser.avatar}
                      alt={viewingUser.usuario}
                      className="w-24 h-24 rounded-2xl object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<svg class="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                        }
                      }}
                    />
                  ) : (
                    <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2">
                  {getStatusIcon(viewingUser.activo, viewingUser.intentos_fallidos)}
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center sm:text-left flex-1"
              >
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {viewingUser.usuario}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-3">
                  {viewingUser.correo}
                </p>
                <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                  {getRoleIcon(viewingUser.rol)}
                  {viewingUser.estacion && (
                    <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                      📍 Estación: {viewingUser.estacion}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Información detallada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CogIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Información del Sistema
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID:</span>
                    <span className="font-mono text-sm">{viewingUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Estado:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingUser.activo 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {viewingUser.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {viewingUser.estacion && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Estación:</span>
                      <span className="capitalize">{viewingUser.estacion}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Intentos fallidos:</span>
                    <span className={viewingUser.intentos_fallidos > 0 ? 'text-orange-500' : 'text-green-500'}>
                      {viewingUser.intentos_fallidos}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PencilSquareIcon className="h-5 w-5" />
                  Fechas
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 block text-sm">Creado:</span>
                    <span className="text-sm">{formatDate(viewingUser.fecha_creacion)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 block text-sm">Última actualización:</span>
                    <span className="text-sm">{formatDate(viewingUser.fecha_actualizacion)}</span>
                  </div>
                  {viewingUser.bloqueado_hasta && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block text-sm">Bloqueado hasta:</span>
                      <span className="text-sm text-red-500">{formatDate(viewingUser.bloqueado_hasta)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preferencias si existen */}
            {viewingUser.preferencias && (
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Preferencias</h4>
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                  <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                    {JSON.stringify(viewingUser.preferencias, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t dark:border-slate-700"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCloseModals}
                className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-2xl transition-all duration-200"
              >
                Cerrar
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleCloseModals();
                  handleOpenEditModal(viewingUser);
                }}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl transition-all duration-200 flex items-center gap-2 justify-center"
              >
                <PencilSquareIcon className="h-5 w-5" />
                Editar Usuario
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <Modal isOpen={!!userToDelete} onClose={handleCloseModals} title="⚠️ Confirmar Eliminación">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            ¿Estás completamente seguro?
          </h3>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl mb-6">
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              Estás a punto de eliminar permanentemente al usuario:
            </p>
            <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-slate-600 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                {userToDelete?.avatar ? (
                  <img
                    src={userToDelete.avatar}
                    alt={userToDelete.usuario}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {userToDelete?.usuario}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {userToDelete?.correo}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300 text-sm">
              <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente al usuario y todos sus datos asociados. No se puede deshacer.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-end gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleCloseModals}
            className="py-3 px-6 border border-slate-300 dark:border-slate-600 rounded-2xl shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDeleteUser}
            className="py-3 px-6 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200"
          >
            Confirmar Eliminación
          </motion.button>
        </motion.div>
      </Modal>

      {/* Modal de Permisos */}
      <Modal isOpen={isPermissionsModalOpen} onClose={handleCloseModals} title={`Permisos para ${managingPermissionsForUser?.usuario}`}>
        {managingPermissionsForUser && <UserPermissions user={managingPermissionsForUser} onClose={handleCloseModals} />}
      </Modal>
    </>
  );
}
