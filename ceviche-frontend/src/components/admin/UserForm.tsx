import { useState, useEffect } from 'react';
import { ImageUpload } from './ImageUpload';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Información Básica</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre de Usuario
            </label>
            <input 
              type="text" 
              name="usuario" 
              id="usuario" 
              value={formData.usuario} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
          </div>
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              name="correo" 
              id="correo" 
              value={formData.correo} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
          </div>
          <div>
            <label htmlFor="contrasena" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              name="contrasena" 
              id="contrasena" 
              value={formData.contrasena} 
              onChange={handleChange} 
              placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Ingrese una contraseña segura'} 
              required={!editingUser} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
          </div>
        </div>
      </div>
      {/* Configuración de Rol */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Configuración de Rol</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rol del Usuario
            </label>
            <select 
              name="rol" 
              id="rol" 
              value={formData.rol} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="mozo">Mozo</option>
              <option value="cocina">Cocina</option>
              <option value="caja">Caja</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {isKitchenRole && (
            <div>
              <label htmlFor="estacion" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estación de Cocina
              </label>
              <select 
                name="estacion" 
                id="estacion" 
                value={formData.estacion || ''} 
                onChange={handleChange} 
                required={isKitchenRole} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Seleccionar estación...</option>
                <option value="frio">Frío</option>
                <option value="caliente">Caliente</option>
                <option value="bebida">Bebida</option>
                <option value="postre">Postre</option>
              </select>
            </div>
          )}
        </div>
      </div>
      {/* Configuración Avanzada */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Configuración Avanzada</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              name="activo" 
              id="activo" 
              checked={formData.activo} 
              onChange={handleChange} 
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700" 
            />
            <label htmlFor="activo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Usuario Activo
            </label>
          </div>
          <div>
            <label htmlFor="intentos_fallidos" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Intentos Fallidos de Login
            </label>
            <input 
              type="number" 
              name="intentos_fallidos" 
              id="intentos_fallidos" 
              value={formData.intentos_fallidos || 0} 
              onChange={handleChange} 
              min="0"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
          </div>
        </div>
      </div>

      {/* Sección de Avatar - Siempre visible */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Avatar del Usuario</h3>
        <div className="flex items-start gap-4">
          <ImageUpload
            currentImage={formData.avatar}
            onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, avatar: imageUrl }))}
          />
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Sube una imagen para el avatar del usuario. <span className="text-slate-500">(Opcional)</span> Formatos soportados: JPG, PNG, GIF (máx. 5MB)
            </p>
            {formData.avatar && (
              <div className="flex items-center gap-2">
                <input 
                  type="url" 
                  name="avatar" 
                  id="avatar" 
                  value={formData.avatar || ''} 
                  onChange={handleChange}
                  placeholder="O ingresa una URL manualmente"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar: null }))}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Configuración Adicional</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="bloqueado_hasta" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bloqueado Hasta
              </label>
              <input 
                type="datetime-local" 
                name="bloqueado_hasta" 
                id="bloqueado_hasta" 
                value={formData.bloqueado_hasta ? new Date(formData.bloqueado_hasta).toISOString().slice(0, 16) : ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, bloqueado_hasta: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isLoading} 
          className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
}
