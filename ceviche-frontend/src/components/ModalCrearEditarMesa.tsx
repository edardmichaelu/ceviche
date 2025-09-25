import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';

interface ModalCrearEditarMesaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mesa: any | null;
  mode: 'create' | 'edit';
  zonas: any[];
}

const ModalCrearEditarMesa: React.FC<ModalCrearEditarMesaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mesa,
  mode,
  zonas
}) => {
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: 4,
    zona_id: '',
    estado: 'disponible',
    activo: true,
    notas: ''
  });
  const [loading, setLoading] = useState(false);

  const estadosMesa = [
    { value: 'disponible', label: 'Disponible', color: 'text-green-800 bg-green-50 dark:bg-green-900/20 dark:text-green-300' },
    { value: 'ocupada', label: 'Ocupada', color: 'text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-300' },
    { value: 'reservada', label: 'Reservada', color: 'text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300' },
    { value: 'limpieza', label: 'En Limpieza', color: 'text-blue-800 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' },
    { value: 'fuera_servicio', label: 'Fuera de Servicio', color: 'text-gray-800 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-300' }
  ];

  useEffect(() => {
    if (mesa && mode === 'edit') {
      setFormData({
        numero: mesa.numero || '',
        capacidad: mesa.capacidad || 4,
        zona_id: mesa.zona_id?.toString() || '',
        estado: mesa.estado || 'disponible',
        activo: mesa.activo !== false,
        notas: mesa.notas || ''
      });
    } else if (mode === 'create') {
      setFormData({
        numero: '',
        capacidad: 4,
        zona_id: '',
        estado: 'disponible',
        activo: true,
        notas: ''
      });
    }
  }, [mesa, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'create' ? '/api/local/mesas' : `/api/local/mesas/${mesa?.id}`;
      const method = mode === 'create' ? 'post' : 'put';

      const response = await apiClient[method](endpoint, formData);
      const apiResponse = ErrorHandler.processApiResponse(response);

      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success(
          mode === 'create'
            ? 'Mesa creada correctamente'
            : 'Mesa actualizada correctamente'
        );
        onSuccess();
        onClose();
      } else {
        const errorMessage = ErrorHandler.getFriendlyErrorMessage(apiResponse);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      ErrorHandler.logError('guardar mesa', err, { formData, mode });
      const errorMessage = ErrorHandler.showErrorNotification(err, 'guardar mesa');
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Crear Mesa' : 'Editar Mesa'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Mesa
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({...formData, numero: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: S01"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zona
                </label>
                <select
                  value={formData.zona_id}
                  onChange={(e) => setFormData({...formData, zona_id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar zona</option>
                  {zonas.map(zona => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nombre} ({zona.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacidad
                </label>
                <input
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="4"
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {estadosMesa.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Notas adicionales sobre la mesa"
                rows={3}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Mesa Activa
              </label>
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

export default ModalCrearEditarMesa;

