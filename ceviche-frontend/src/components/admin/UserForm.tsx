import { useState, useEffect } from 'react';
import { ImageUpload } from './ImageUpload';
import {
    UserIcon,
    EnvelopeIcon,
    KeyIcon,
    ShieldCheckIcon,
    PhotoIcon,
    UserGroupIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
    UserIcon as UserIconSolid,
    KeyIcon as KeyIconSolid,
    ShieldCheckIcon as ShieldCheckIconSolid
} from '@heroicons/react/24/solid';

// Interfaz parcial del usuario, ya que no manejaremos todas las 13 columnas en el form.
interface UserFormData {
  usuario: string;
  correo: string;
  rol: string;
  estacion: string | null;
  activo: boolean;
  contrasena?: string;
  intentos_fallidos?: number;
  bloqueado_hasta?: string | null;
  preferencias?: any;
  avatar?: string | null;
}

interface UserFormProps {
  // El usuario a editar, o null si es para crear uno nuevo
  editingUser: Partial<UserFormData> & { id?: number } | null;
  onSave: (userData: Partial<UserFormData>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function UserForm({ editingUser, onSave, onCancel, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    usuario: '',
    correo: '',
    rol: 'mozo', // Valor por defecto
    estacion: null,
    activo: true,
    contrasena: '',
    intentos_fallidos: 0,
    bloqueado_hasta: null,
    preferencias: null,
    avatar: null,
  });

  // Rellena el formulario si estamos en modo edición
  useEffect(() => {
    if (editingUser) {
      setFormData({
        usuario: editingUser.usuario || '',
        correo: editingUser.correo || '',
        rol: editingUser.rol || 'mozo',
        estacion: editingUser.estacion || null,
        activo: editingUser.activo !== undefined ? editingUser.activo : true,
        contrasena: '', // La contraseña nunca se precarga por seguridad
        intentos_fallidos: editingUser.intentos_fallidos || 0,
        bloqueado_hasta: editingUser.bloqueado_hasta || null,
        preferencias: editingUser.preferencias || null,
        avatar: editingUser.avatar || null,
      });
    } else {
      // Resetea el formulario para el modo creación
      setFormData({
        usuario: '',
        correo: '',
        rol: 'mozo',
        estacion: null,
        activo: true,
        contrasena: '',
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        preferencias: null,
        avatar: null,
      });
    }
  }, [editingUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepara los datos para enviar, asegurándose de que la estación sea null si no es rol de cocina
    const dataToSave = {
        ...formData,
        estacion: formData.rol === 'cocina' ? formData.estacion : null,
    };
    onSave(dataToSave);
  };

  const isKitchenRole = formData.rol === 'cocina';

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <UserGroupIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {editingUser
            ? 'Modifica la información del usuario seleccionado'
            : 'Complete la información para crear un nuevo usuario en el sistema'
          }
        </p>
      </div>

      {/* Información Básica */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl border border-blue-200 dark:border-slate-600 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <UserIconSolid className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Información Personal
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="usuario" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-blue-500" />
              Nombre de Usuario *
            </label>
            <div className="relative">
              <input
                type="text"
                name="usuario"
                id="usuario"
                value={formData.usuario}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                placeholder="Ingrese el nombre de usuario"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="correo" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4 text-green-500" />
              Correo Electrónico *
            </label>
            <div className="relative">
              <input
                type="email"
                name="correo"
                id="correo"
                value={formData.correo}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm"
                placeholder="usuario@ejemplo.com"
              />
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contrasena" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <KeyIcon className="h-4 w-4 text-orange-500" />
              Contraseña {editingUser ? '(opcional)' : '*'}
            </label>
            <div className="relative">
              <input
                type="password"
                name="contrasena"
                id="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Contraseña segura'}
                required={!editingUser}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      {/* Configuración de Rol */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-purple-200 dark:border-slate-600 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ShieldCheckIconSolid className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Configuración de Rol
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="rol" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <UserGroupIcon className="h-3 w-3 text-purple-500" />
              Rol del Usuario *
            </label>
            <div className="relative">
              <select
                name="rol"
                id="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-sm"
              >
                <option value="mozo">🍽️ Mozo</option>
                <option value="cocina">🍳 Cocina</option>
                <option value="caja">💰 Caja</option>
                <option value="admin">⚙️ Admin</option>
              </select>
              <ShieldCheckIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            </div>
          </div>

          {isKitchenRole && (
            <div className="space-y-1">
              <label htmlFor="estacion" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <KeyIcon className="h-3 w-3 text-orange-500" />
                Estación de Cocina *
              </label>
              <div className="relative">
                <select
                  name="estacion"
                  id="estacion"
                  value={formData.estacion || ''}
                  onChange={handleChange}
                  required={isKitchenRole}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-sm"
                >
                  <option value="">Seleccionar estación...</option>
                  <option value="frio">🥗 Frío</option>
                  <option value="caliente">🔥 Caliente</option>
                  <option value="bebida">🥤 Bebida</option>
                  <option value="postre">🍰 Postre</option>
                </select>
                <KeyIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Configuración de Seguridad */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-green-200 dark:border-slate-600 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ShieldCheckIconSolid className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Configuración de Seguridad
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-green-200 dark:border-green-800">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500 dark:border-green-600 dark:bg-slate-600"
            />
            <div className="flex-1">
              <label htmlFor="activo" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <ShieldCheckIcon className="h-3 w-3 text-green-500" />
                Usuario Activo
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permite acceso al sistema
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="intentos_fallidos" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500" />
              Intentos Fallidos
            </label>
            <div className="relative">
              <input
                type="number"
                name="intentos_fallidos"
                id="intentos_fallidos"
                value={formData.intentos_fallidos || 0}
                onChange={handleChange}
                min="0"
                max="10"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 shadow-sm text-sm"
                placeholder="0"
              />
              <ExclamationTriangleIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            </div>
          </div>

          {editingUser && (
            <div className="space-y-1">
              <label htmlFor="bloqueado_hasta" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <ClockIcon className="h-3 w-3 text-red-500" />
                Bloqueado Hasta
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="bloqueado_hasta"
                  id="bloqueado_hasta"
                  value={formData.bloqueado_hasta ? new Date(formData.bloqueado_hasta).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloqueado_hasta: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm text-sm"
                />
                <ClockIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar del Usuario */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-indigo-200 dark:border-slate-600 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <PhotoIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Avatar del Usuario
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded-full">
            Opcional
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Subir Imagen
            </h4>
            <ImageUpload
              currentImage={formData.avatar}
              onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, avatar: imageUrl }))}
              className="w-full"
              uploadUrl="/api/upload/avatar"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p><span className="font-medium">Formatos:</span> JPG, PNG, GIF, WEBP</p>
              <p><span className="font-medium">Máximo:</span> 5MB</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              URL Manual
            </h4>
            <div className="relative">
              <input
                type="url"
                name="avatar"
                id="avatar"
                value={formData.avatar || ''}
                onChange={handleChange}
                placeholder="https://ejemplo.com/avatar.jpg"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm text-sm"
              />
              <PhotoIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            </div>

            {formData.avatar && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, avatar: null }))}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors border border-red-200 dark:border-red-800"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar Avatar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
