import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
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
  color: string;
}

interface Ingrediente {
  id: number;
  nombre: string;
  descripcion?: string;
  stock: number;
  stock_minimo: number;
  unidad?: string;
  precio_unitario: number;
  tipo_ingrediente_id?: number;
  tipo_ingrediente?: TipoIngrediente;
  activo: boolean;
  fecha_vencimiento?: string;
  proveedor?: string;
  codigo_barras?: string;
  ubicacion_almacen?: string;
  creado_en?: string;
  actualizado_en?: string;
}

// Función para formatear fechas
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'No especificada';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Unidades disponibles
const UNIDADES_DISPONIBLES = [
  'kg', 'g', 'l', 'ml', 'unidad', 'unidad(es)', 'paquete', 'paquete(s)',
  'caja', 'caja(s)', 'lata', 'lata(s)', 'botella', 'botella(s)', 'porción', 'porción(es)'
];

// Función para obtener el estado del stock
const getStockStatus = (ingrediente: Ingrediente) => {
  if (ingrediente.stock <= 0) return { status: 'sin-stock', label: 'Sin stock', color: 'text-red-600 bg-red-100 dark:bg-red-900/20' };
  if (ingrediente.stock <= ingrediente.stock_minimo) return { status: 'bajo', label: 'Stock bajo', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' };
  return { status: 'suficiente', label: 'Stock OK', color: 'text-green-600 bg-green-100 dark:bg-green-900/20' };
};

const IngredienteManagementPage: React.FC = () => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [tiposIngrediente, setTiposIngrediente] = useState<TipoIngrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState<Ingrediente | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    stock: 0,
    stock_minimo: 0,
    unidad: '',
    precio_unitario: 0,
    tipo_ingrediente_id: '',
    activo: true,
    fecha_vencimiento: '',
    proveedor: '',
    codigo_barras: '',
    ubicacion_almacen: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filtrar ingredientes basados en el término de búsqueda
  const filteredIngredientes = useMemo(() => {
    return ingredientes.filter(ingrediente =>
      ingrediente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ingrediente.descripcion && ingrediente.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ingrediente.proveedor && ingrediente.proveedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ingrediente.codigo_barras && ingrediente.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [ingredientes, searchTerm]);

  // Cargar ingredientes
  const loadIngredientes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/ingrediente/');
      if (response.success) {
        setIngredientes(response.data);
      } else {
        toast.error('Error al cargar ingredientes');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de ingrediente
  const loadTiposIngrediente = async () => {
    try {
      const response = await apiClient.get('/api/tipo-ingrediente/');
      if (response.success) {
        setTiposIngrediente(response.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de ingrediente:', error);
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
      const dataToSend = {
        ...formData,
        tipo_ingrediente_id: formData.tipo_ingrediente_id ? parseInt(formData.tipo_ingrediente_id) : null,
        stock: parseFloat(formData.stock.toString()),
        stock_minimo: parseFloat(formData.stock_minimo.toString()),
        precio_unitario: parseFloat(formData.precio_unitario.toString())
      };

      let response;
      if (isEditing && selectedIngrediente) {
        response = await apiClient.put(`/api/ingrediente/${selectedIngrediente.id}`, dataToSend);
        } else {
        response = await apiClient.post('/api/ingrediente/', dataToSend);
      }

      if (response.success) {
        toast.success(isEditing ? 'Ingrediente actualizado' : 'Ingrediente creado');
        setShowModal(false);
          resetForm();
        loadIngredientes();
        } else {
        toast.error(response.error || 'Error al guardar ingrediente');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al guardar ingrediente');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar edición
  const handleEdit = (ingrediente: Ingrediente) => {
    setSelectedIngrediente(ingrediente);
    setFormData({
      nombre: ingrediente.nombre,
      descripcion: ingrediente.descripcion || '',
      stock: ingrediente.stock,
      stock_minimo: ingrediente.stock_minimo,
      unidad: ingrediente.unidad || '',
      precio_unitario: ingrediente.precio_unitario,
      tipo_ingrediente_id: ingrediente.tipo_ingrediente_id?.toString() || '',
      activo: ingrediente.activo,
      fecha_vencimiento: ingrediente.fecha_vencimiento ? ingrediente.fecha_vencimiento.split('T')[0] : '',
      proveedor: ingrediente.proveedor || '',
      codigo_barras: ingrediente.codigo_barras || '',
      ubicacion_almacen: ingrediente.ubicacion_almacen || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!selectedIngrediente) return;

    try {
      const response = await apiClient.del(`/api/ingrediente/${selectedIngrediente.id}`);
      if (response.success) {
        toast.success('Ingrediente eliminado');
        setShowDeleteModal(false);
        setSelectedIngrediente(null);
        loadIngredientes();
      } else {
        toast.error(response.error || 'Error al eliminar ingrediente');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al eliminar ingrediente');
    }
  };

  // Mostrar detalles
  const handleShowDetails = (ingrediente: Ingrediente) => {
    setSelectedIngrediente(ingrediente);
    setShowDetailsModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      stock: 0,
      stock_minimo: 0,
      unidad: '',
      precio_unitario: 0,
      tipo_ingrediente_id: '',
      activo: true,
      fecha_vencimiento: '',
      proveedor: '',
      codigo_barras: '',
      ubicacion_almacen: ''
    });
    setIsEditing(false);
    setSelectedIngrediente(null);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadIngredientes();
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
                Gestión de Ingredientes
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra el inventario de ingredientes para tus productos
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
                <span>Nuevo Ingrediente</span>
            </button>
        </div>
      </div>

          {/* Buscador */}
            <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar ingredientes..."
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

        {/* Grid de ingredientes */}
        {!loading && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
                {filteredIngredientes.map((ingrediente) => {
                const stockStatus = getStockStatus(ingrediente);
                    return (
                  <motion.div
                    key={ingrediente.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Header de la card */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {ingrediente.activo ? (
                            <CheckCircleIcon className="h-8 w-8 text-green-500" />
                          ) : (
                            <XMarkIcon className="h-8 w-8 text-red-500" />
                          )}
                            <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {ingrediente.nombre}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {ingrediente.unidad}
                            </p>
                              </div>
                              </div>
                        <div className="flex space-x-2">
                            <button
                            onClick={() => handleShowDetails(ingrediente)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            title="Ver detalles"
                          >
                            <InformationCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                            onClick={() => handleEdit(ingrediente)}
                            className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                              title="Editar"
                            >
                            <PencilIconSolid className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                              setSelectedIngrediente(ingrediente);
                                setShowDeleteModal(true);
                              }}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                              title="Eliminar"
                            >
                            <TrashIconSolid className="h-5 w-5" />
                            </button>
                          </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Stock:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {ingrediente.stock} {ingrediente.unidad}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>

                        {ingrediente.stock_minimo > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Mínimo:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {ingrediente.stock_minimo} {ingrediente.unidad}
                            </span>
                          </div>
                        )}

                        {ingrediente.precio_unitario > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Precio:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              ${ingrediente.precio_unitario.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {ingrediente.tipo_ingrediente && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Tipo:
                            </span>
                            <span
                              className="text-sm px-2 py-1 rounded"
                              style={{
                                backgroundColor: ingrediente.tipo_ingrediente.color + '20',
                                color: ingrediente.tipo_ingrediente.color
                              }}
                            >
                              {ingrediente.tipo_ingrediente.nombre}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Estado vacío */}
        {!loading && filteredIngredientes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <InformationCircleIcon className="h-16 w-16 mx-auto" />
          </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No se encontraron ingredientes' : 'No hay ingredientes'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primer ingrediente para comenzar'
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
                <span>Crear Primer Ingrediente</span>
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Nombre del ingrediente"
                          required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unidad
                    </label>
                    <select
                          value={formData.unidad}
                          onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Seleccionar unidad</option>
                          {UNIDADES_DISPONIBLES.map((unidad) => (
                            <option key={unidad} value={unidad}>
                              {unidad}
                        </option>
                      ))}
                    </select>
                      </div>
                  </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Descripción del ingrediente..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stock_minimo}
                          onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio Unitario
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precio_unitario}
                          onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo de Ingrediente
                  </label>
                        <select
                          value={formData.tipo_ingrediente_id}
                          onChange={(e) => setFormData({ ...formData, tipo_ingrediente_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Seleccionar tipo</option>
                          {tiposIngrediente.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </option>
                          ))}
                        </select>
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de Vencimiento
                    </label>
                    <input
                          type="date"
                          value={formData.fecha_vencimiento}
                          onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Proveedor
                    </label>
                    <input
                      type="text"
                          value={formData.proveedor}
                          onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_barras}
                          onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Código de barras"
                    />
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ubicación en Almacén
                    </label>
                    <input
                        type="text"
                        value={formData.ubicacion_almacen}
                        onChange={(e) => setFormData({ ...formData, ubicacion_almacen: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ej: Estante A, Sección 1"
                      />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                      <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Ingrediente activo
                  </label>
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
          {showDetailsModal && selectedIngrediente && (
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
                      {selectedIngrediente.activo ? (
                        <CheckCircleIcon className="h-16 w-16 text-green-500" />
                      ) : (
                        <XMarkIcon className="h-16 w-16 text-red-500" />
                      )}
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {selectedIngrediente.nombre}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedIngrediente.unidad}
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
                    {selectedIngrediente.descripcion && (
                <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Descripción
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedIngrediente.descripcion}
                        </p>
                </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Información de Stock
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Stock Actual:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedIngrediente.stock} {selectedIngrediente.unidad}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Stock Mínimo:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedIngrediente.stock_minimo} {selectedIngrediente.unidad}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Precio Unitario:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${selectedIngrediente.precio_unitario.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Estado:</span>
                            <span className={`font-medium ${getStockStatus(selectedIngrediente).color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                              {getStockStatus(selectedIngrediente).label}
                            </span>
                          </div>
                        </div>
                </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Información Adicional
                        </h3>
                        <div className="space-y-2">
                          {selectedIngrediente.tipo_ingrediente && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Tipo:</span>
                              <span
                                className="font-medium px-2 py-1 rounded"
                                style={{
                                  backgroundColor: selectedIngrediente.tipo_ingrediente.color + '20',
                                  color: selectedIngrediente.tipo_ingrediente.color
                                }}
                              >
                                {selectedIngrediente.tipo_ingrediente.nombre}
                              </span>
                </div>
                          )}
                          {selectedIngrediente.fecha_vencimiento && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Vencimiento:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatDate(selectedIngrediente.fecha_vencimiento)}
                              </span>
                            </div>
                          )}
                          {selectedIngrediente.proveedor && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Proveedor:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {selectedIngrediente.proveedor}
                              </span>
                            </div>
                          )}
                          {selectedIngrediente.codigo_barras && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Código de Barras:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {selectedIngrediente.codigo_barras}
                              </span>
                            </div>
                          )}
                          {selectedIngrediente.ubicacion_almacen && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Ubicación:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {selectedIngrediente.ubicacion_almacen}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Estado:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedIngrediente.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Creado
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedIngrediente.creado_en)}
                        </p>
                </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Última Actualización
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedIngrediente.actualizado_en)}
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
          title="Eliminar Ingrediente"
          message={`¿Estás seguro de que deseas eliminar el ingrediente "${selectedIngrediente?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </div>
  );
};

export default IngredienteManagementPage;