import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CogIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  HomeIcon,
  CreditCardIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { 
  ShieldCheckIcon as ShieldCheckIconSolid, 
  ClockIcon as ClockIconSolid, 
  CheckIcon as CheckIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  CogIcon as CogIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  HomeIcon as HomeIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';
import { apiClient } from '../../apiClient';
import { toast } from 'react-hot-toast';

// Función utilitaria para formatear fechas
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nunca';
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Interfaces para las respuestas de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PermissionInfo {
  id: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  categoria?: string;
}

interface UserPermission {
  id: number;
  permiso_id: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  categoria: string;
  area: string | null;
  activo: boolean;
  creado_en: string | null;
  expira_en: string | null;
  concedido_por: number;
  concedido_por_nombre: string;
  permiso_temporal_id?: number;
}

interface Permission {
  id: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  categoria?: string;
  activo: boolean;
  fecha_expiracion?: string | null;
  concedido_por?: number;
  concedido_por_nombre?: string;
  area?: string | null;
}

interface UserPermissionsProps {
  user: {
    id: number;
    usuario: string;
    rol: string;
  };
  onClose: () => void;
}

export function UserPermissions({ user, onClose }: UserPermissionsProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    fetchUserPermissions();
  }, [user.id]);

  const fetchUserPermissions = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching permissions for user:', user.id);
      
      // Obtener permisos disponibles
      console.log('📋 Getting available permissions...');
      const availableResponse = await apiClient.get<ApiResponse<PermissionInfo[]>>('/api/permissions/available');
      console.log('Available permissions response:', availableResponse);
      if (!availableResponse.success) {
        throw new Error('Error al obtener permisos disponibles');
      }

      // Obtener permisos del usuario
      console.log('👤 Getting user permissions...');
      const userResponse = await apiClient.get<ApiResponse<UserPermission[]>>(`/api/permissions/user/${user.id}`);
      console.log('User permissions response:', userResponse);
      if (!userResponse.success) {
        throw new Error('Error al obtener permisos del usuario');
      }

      // Combinar permisos disponibles con permisos del usuario
      const availablePermissions = availableResponse.data || [];
      const userPermissions = userResponse.data || [];
      
      // Crear mapa de permisos del usuario
      const userPermissionMap = new Map();
      userPermissions.forEach(up => {
        userPermissionMap.set(up.permiso_id, up);
      });
      
      // Crear lista combinada
      const combinedPermissions = availablePermissions.map(ap => {
        const userPerm = userPermissionMap.get(ap.id);
        return {
          id: ap.id,
          nombre: ap.nombre,
          descripcion: ap.descripcion,
          modulo: ap.modulo,
          categoria: ap.categoria,
          activo: userPerm ? userPerm.activo : false,
          fecha_expiracion: userPerm ? userPerm.expira_en : null,
          concedido_por: userPerm ? userPerm.concedido_por : null,
          concedido_por_nombre: userPerm ? userPerm.concedido_por_nombre : null,
          area: userPerm ? userPerm.area : null
        };
      });
      
      setPermissions(combinedPermissions);
      setSelectedPermissions(combinedPermissions.filter(p => p.activo).map(p => p.id));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Error al cargar los permisos');
      
      // Fallback a datos simulados si la API falla
      const mockPermissions: Permission[] = [
        {
          id: 'gestionar_usuarios',
          nombre: 'Gestionar Usuarios',
          descripcion: 'Crear, editar y eliminar usuarios del sistema',
          modulo: 'admin',
          activo: false
        },
        {
          id: 'ver_reportes',
          nombre: 'Ver Reportes',
          descripcion: 'Acceso a reportes y estadísticas',
          modulo: 'admin',
          activo: false
        },
        {
          id: 'gestionar_menu',
          nombre: 'Gestionar Menú',
          descripcion: 'Modificar productos y categorías',
          modulo: 'menu',
          activo: false
        },
        {
          id: 'configurar_local',
          nombre: 'Configurar Local',
          descripcion: 'Modificar mesas, zonas y configuración',
          modulo: 'local',
          activo: false
        }
      ];
      
      setPermissions(mockPermissions);
      setSelectedPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    try {
      setIsSaving(true);
      
      // Obtener el ID del usuario actual (admin que está concediendo)
      const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const grantedBy = currentUser.id;
      
      if (!grantedBy) {
        toast.error('Error: No se pudo identificar al usuario actual');
        return;
      }
      
      // Conceder permisos
      const response = await apiClient.post<ApiResponse<any>>('/api/permissions/grant', {
        user_id: user.id,
        permission_ids: selectedPermissions,
        granted_by: grantedBy,
        expiration_date: expirationDate || null,
        area: null
      });

      if (response.success) {
        toast.success('Permisos actualizados exitosamente');
        onClose();
      } else {
        toast.error(response.error || 'Error al actualizar los permisos');
      }
    } catch (error) {
      toast.error('Error al actualizar los permisos');
      console.error('Error saving permissions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getModuleInfo = (modulo: string) => {
    switch (modulo) {
      case 'admin': 
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
          icon: <ShieldCheckIconSolid className="h-4 w-4" />,
          name: 'Administración'
        };
      case 'menu': 
        return {
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
          icon: <ShoppingBagIconSolid className="h-4 w-4" />,
          name: 'Menú'
        };
      case 'local': 
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
          icon: <HomeIconSolid className="h-4 w-4" />,
          name: 'Local'
        };
      case 'ordenes': 
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
          icon: <ChartBarIconSolid className="h-4 w-4" />,
          name: 'Órdenes'
        };
      case 'caja': 
        return {
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
          icon: <CreditCardIconSolid className="h-4 w-4" />,
          name: 'Caja'
        };
      case 'cocina': 
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
          icon: <FireIconSolid className="h-4 w-4" />,
          name: 'Cocina'
        };
      case 'temporal': 
        return {
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
          icon: <ClockIconSolid className="h-4 w-4" />,
          name: 'Temporal'
        };
      default: 
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
          icon: <CogIconSolid className="h-4 w-4" />,
          name: 'General'
        };
    }
  };

  const isExpired = (fechaExpiracion?: string) => {
    if (!fechaExpiracion) return false;
    return new Date(fechaExpiracion) < new Date();
  };

  const isExpiringSoon = (fechaExpiracion?: string) => {
    if (!fechaExpiracion) return false;
    const expirationDate = new Date(fechaExpiracion);
    const now = new Date();
    const diffHours = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24; // Expira en las próximas 24 horas
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del usuario */}
      <div className="flex items-center gap-4 pb-4 border-b dark:border-slate-700">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
          <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Permisos de {user.usuario}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rol actual: <span className="font-medium capitalize">{user.rol}</span>
          </p>
        </div>
        </div>

      {/* Configuración de expiración */}
      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Configuración de Expiración
        </h4>
        <div className="flex items-center gap-4">
          <input
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setExpirationDate('')}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Sin expiración
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Los permisos se aplicarán a todos los permisos seleccionados
        </p>
                </div>

      {/* Lista de permisos */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
          Permisos Disponibles ({selectedPermissions.length} seleccionados)
        </h4>
        
        {permissions.map(permission => (
          <div
            key={permission.id}
            className={`p-4 border rounded-lg transition-all duration-200 ${
              selectedPermissions.includes(permission.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handlePermissionToggle(permission.id)}
                className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  selectedPermissions.includes(permission.id)
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {selectedPermissions.includes(permission.id) && (
                  <CheckIconSolid className="h-4 w-4" />
                )}
                </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-slate-800 dark:text-slate-200">
                    {permission.nombre}
                  </h5>
                  <div className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${getModuleInfo(permission.modulo).color}`}>
                    {getModuleInfo(permission.modulo).icon}
                    <span>{getModuleInfo(permission.modulo).name}</span>
                  </div>
                  {permission.categoria && (
                    <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                      {permission.categoria}
                    </span>
                  )}
                  {permission.fecha_expiracion && (
                    <div className="flex items-center gap-1">
                      {isExpired(permission.fecha_expiracion) ? (
                        <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                          <ExclamationTriangleIconSolid className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                      ) : isExpiringSoon(permission.fecha_expiracion) ? (
                        <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                          <ClockIconSolid className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                        </div>
                      ) : (
                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckIconSolid className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {permission.descripcion}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {permission.fecha_expiracion && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3 text-slate-400" />
                        <span className={`${
                          isExpired(permission.fecha_expiracion)
                            ? 'text-red-500'
                            : isExpiringSoon(permission.fecha_expiracion)
                            ? 'text-orange-500'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {isExpired(permission.fecha_expiracion)
                            ? 'Expirado'
                            : isExpiringSoon(permission.fecha_expiracion)
                            ? 'Expira pronto'
                            : 'Vigente'
                          } - {new Date(permission.fecha_expiracion).toLocaleDateString('es-ES')}
                        </span>
          </div>
        )}
                  </div>
                  {permission.concedido_por_nombre && (
                    <span className="text-slate-500 dark:text-slate-400">
                      Concedido por: {permission.concedido_por_nombre}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSavePermissions}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="h-4 w-4" />
              Guardar Permisos
            </>
          )}
        </button>
      </div>
    </div>
  );
}
