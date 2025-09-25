import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';

interface ModalCrearEditarZonaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zona: any | null;
  mode: 'create' | 'edit';
  pisos: any[];
}

const ModalCrearEditarZona: React.FC<ModalCrearEditarZonaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zona,
  mode,
  pisos
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'interior',
    capacidad_maxima: 10,
    piso_id: '',
    orden: 1,
    activo: true,
    color: '#3B82F6',
    icono: '🏠'
  });
  const [loading, setLoading] = useState(false);

  const tiposZona = [
    { value: 'recepcion', label: 'Recepción', color: '#6B7280' },
    { value: 'interior', label: 'Interior', color: '#3B82F6' },
    { value: 'barra', label: 'Barra', color: '#10B981' },
    { value: 'terraza', label: 'Terraza', color: '#84CC16' },
    { value: 'vip', label: 'VIP', color: '#EC4899' },
    { value: 'privada', label: 'Privada', color: '#6366F1' },
    { value: 'infantil', label: 'Infantil', color: '#F59E0B' },
    { value: 'rapida', label: 'Rápida', color: '#EF4444' },
    { value: 'business', label: 'Business', color: '#0EA5E9' }
  ];

  useEffect(() => {
    if (zona && mode === 'edit') {
      setFormData({
        nombre: zona.nombre || '',
        descripcion: zona.descripcion || '',
        tipo: zona.tipo || 'interior',
        capacidad_maxima: zona.capacidad_maxima || 10,
        piso_id: zona.piso_id?.toString() || '',
        orden: zona.orden || 1,
        activo: zona.activo !== false,
        color: zona.color || '#3B82F6',
        icono: zona.icono || '🏠'
      });
    } else if (mode === 'create') {
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'interior',
        capacidad_maxima: 10,
        piso_id: '',
        orden: 1,
        activo: true,
        color: '#3B82F6',
        icono: '🏠'
      });
    }
  }, [zona, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'create' ? '/api/local/zonas' : `/api/local/zonas/${zona?.id}`;
      const method = mode === 'create' ? 'post' : 'put';

      const response = await apiClient[method](endpoint, formData);
      const apiResponse = ErrorHandler.processApiResponse(response);

      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success(
          mode === 'create'
            ? 'Zona creada correctamente'
            : 'Zona actualizada correctamente'
        );
        onSuccess();
        onClose();
      } else {
        const errorMessage = ErrorHandler.getFriendlyErrorMessage(apiResponse);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      ErrorHandler.logError('guardar zona', err, { formData, mode });
      const errorMessage = ErrorHandler.showErrorNotification(err, 'guardar zona');
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Crear Zona' : 'Editar Zona'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Zona
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Salón Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Zona
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {tiposZona.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Descripción de la zona"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Piso
                </label>
                <select
                  value={formData.piso_id}
                  onChange={(e) => setFormData({...formData, piso_id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar piso</option>
                  {pisos.map(piso => (
                    <option key={piso.id} value={piso.id}>
                      {piso.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacidad Máxima
                </label>
                <input
                  type="number"
                  value={formData.capacidad_maxima}
                  onChange={(e) => setFormData({...formData, capacidad_maxima: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10"
                  min="1"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center mt-8">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activa
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
              >
                {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalCrearEditarZona;

