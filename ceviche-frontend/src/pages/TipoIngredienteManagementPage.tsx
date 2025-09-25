import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  PlusIcon as PlusIconSolid,
  PencilIcon as PencilIconSolid,
  TrashIcon as TrashIconSolid,
  CheckIcon as CheckIconSolid
} from '@heroicons/react/24/solid';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../utils/errorHandler';
import { ThemeToggle } from '../components/ThemeToggle';
import { ConfirmModal } from '../components/ConfirmModal';

interface TipoIngrediente {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
  ingredientes?: Array<{
    id: number;
    nombre: string;
    stock: number;
    unidad?: string;
    activo: boolean;
  }>;
  creado_en?: string;
  actualizado_en?: string;
}

// Función para formatear fechas
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Nunca';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
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

// Colores disponibles para tipos de ingrediente
const COLORES_DISPONIBLES = [
  { name: '#6B7280', label: 'Gris', class: 'bg-gray-500' },
  { name: '#EF4444', label: 'Rojo', class: 'bg-red-500' },
  { name: '#F59E0B', label: 'Ámbar', class: 'bg-amber-500' },
  { name: '#EAB308', label: 'Amarillo', class: 'bg-yellow-500' },
  { name: '#84CC16', label: 'Lima', class: 'bg-lime-500' },
  { name: '#10B981', label: 'Esmeralda', class: 'bg-emerald-500' },
  { name: '#06B6D4', label: 'Cian', class: 'bg-cyan-500' },
  { name: '#3B82F6', label: 'Azul', class: 'bg-blue-500' },
  { name: '#8B5CF6', label: 'Violeta', class: 'bg-violet-500' },
  { name: '#EC4899', label: 'Rosa', class: 'bg-pink-500' },
  { name: '#F97316', label: 'Naranja', class: 'bg-orange-500' },
  { name: '#14B8A6', label: 'Teal', class: 'bg-teal-500' }
];

// Función para obtener la clase de color correcta
const getColorClass = (colorName?: string) => {
  if (!colorName) return 'bg-gray-500';
  const colorMap: Record<string, string> = {
    '#6B7280': 'bg-gray-500',
    '#EF4444': 'bg-red-500',
    '#F59E0B': 'bg-amber-500',
    '#EAB308': 'bg-yellow-500',
    '#84CC16': 'bg-lime-500',
    '#10B981': 'bg-emerald-500',
    '#06B6D4': 'bg-cyan-500',
    '#3B82F6': 'bg-blue-500',
    '#8B5CF6': 'bg-violet-500',
    '#EC4899': 'bg-pink-500',
    '#F97316': 'bg-orange-500',
    '#14B8A6': 'bg-teal-500'
  };
  return colorMap[colorName] || 'bg-gray-500';
};

const TipoIngredienteManagementPage: React.FC = () => {
  const [tiposIngrediente, setTiposIngrediente] = useState<TipoIngrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoIngrediente | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#6B7280'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filtrar tipos de ingrediente basados en el término de búsqueda
  const filteredTipos = useMemo(() => {
    return tiposIngrediente.filter(tipo =>
      tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tipo.descripcion && tipo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tiposIngrediente, searchTerm]);

  // Cargar tipos de ingrediente
  const loadTiposIngrediente = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/tipo-ingrediente/');
      if (response.success) {
        setTiposIngrediente(response.data);
      } else {
        toast.error('Error al cargar tipos de ingrediente');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al cargar tipos de ingrediente');
    } finally {
      setLoading(false);
    }
  };

  // Manejar submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      let response;
      if (isEditing && selectedTipo) {
        response = await apiClient.put(`/api/tipo-ingrediente/${selectedTipo.id}`, formData);
      } else {
        response = await apiClient.post('/api/tipo-ingrediente/', formData);
      }

      if (response.success) {
        toast.success(isEditing ? 'Tipo de ingrediente actualizado' : 'Tipo de ingrediente creado');
        setShowModal(false);
        resetForm();
        loadTiposIngrediente();
      } else {
        toast.error(response.error || 'Error al guardar tipo de ingrediente');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al guardar tipo de ingrediente');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar edición
  const handleEdit = (tipo: TipoIngrediente) => {
    setSelectedTipo(tipo);
    setFormData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      color: tipo.color
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!selectedTipo) return;

    try {
      const response = await apiClient.del(`/api/tipo-ingrediente/${selectedTipo.id}`);
      if (response.success) {
        toast.success('Tipo de ingrediente eliminado');
        setShowDeleteModal(false);
        setSelectedTipo(null);
        loadTiposIngrediente();
      } else {
        toast.error(response.error || 'Error al eliminar tipo de ingrediente');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al eliminar tipo de ingrediente');
    }
  };

  // Mostrar detalles
  const handleShowDetails = (tipo: TipoIngrediente) => {
    setSelectedTipo(tipo);
    setShowDetailsModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      color: '#6B7280'
    });
    setIsEditing(false);
    setSelectedTipo(null);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadTiposIngrediente();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de Tipos de Ingrediente
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra los tipos de ingredientes para organizar mejor tu inventario
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Nuevo Tipo</span>
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar tipos de ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Grid de tipos de ingrediente */}
        {!loading && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredTipos.map((tipo) => (
                <motion.div
                  key={tipo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Header de la card */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg ${getColorClass(tipo.color)} flex items-center justify-center text-white text-xl font-bold`}
                        style={{ backgroundColor: tipo.color }}
                      >
                        {tipo.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleShowDetails(tipo)}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                          title="Ver detalles"
                        >
                          <InformationCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(tipo)}
                          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                          title="Editar"
                        >
                          <PencilIconSolid className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTipo(tipo);
                            setShowDeleteModal(true);
                          }}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          title="Eliminar"
                        >
                          <TrashIconSolid className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {tipo.nombre}
                    </h3>

                    {tipo.descripcion && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {tipo.descripcion}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{tipo.ingredientes?.length || 0} ingredientes</span>
                      <span>{formatDate(tipo.actualizado_en)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Estado vacío */}
        {!loading && filteredTipos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <InformationCircleIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No se encontraron tipos de ingrediente' : 'No hay tipos de ingrediente'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primer tipo de ingrediente para comenzar'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Crear Primer Tipo</span>
              </button>
            )}
          </div>
        )}

        {/* Modal de Crear/Editar */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isEditing ? 'Editar Tipo de Ingrediente' : 'Nuevo Tipo de Ingrediente'}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ej: Vegetales, Proteínas..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Descripción opcional del tipo de ingrediente..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLORES_DISPONIBLES.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: color.name })}
                            className={`w-10 h-10 rounded-lg ${color.class} border-2 transition-all duration-200 ${
                              formData.color === color.name
                                ? 'border-gray-900 dark:border-gray-100 scale-110'
                                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                            }`}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      >
                        {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                        <span>{isEditing ? 'Actualizar' : 'Crear'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Detalles */}
        <AnimatePresence>
          {showDetailsModal && selectedTipo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-16 h-16 rounded-lg ${getColorClass(selectedTipo.color)} flex items-center justify-center text-white text-2xl font-bold`}
                        style={{ backgroundColor: selectedTipo.color }}
                      >
                        {selectedTipo.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {selectedTipo.nombre}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          Tipo de Ingrediente
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {selectedTipo.descripcion && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Descripción
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedTipo.descripcion}
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Ingredientes Asociados ({selectedTipo.ingredientes?.length || 0})
                      </h3>
                      {selectedTipo.ingredientes && selectedTipo.ingredientes.length > 0 ? (
                        <div className="grid gap-3">
                          {selectedTipo.ingredientes.map((ingrediente) => (
                            <div
                              key={ingrediente.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {ingrediente.nombre}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Stock: {ingrediente.stock} {ingrediente.unidad || 'unidades'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {ingrediente.activo ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XMarkIcon className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300 italic">
                          No hay ingredientes asociados a este tipo
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Creado
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedTipo.creado_en)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Última Actualización
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedTipo.actualizado_en)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Eliminar Tipo de Ingrediente"
          message={`¿Estás seguro de que deseas eliminar el tipo "${selectedTipo?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </div>
  );
};

export default TipoIngredienteManagementPage;
