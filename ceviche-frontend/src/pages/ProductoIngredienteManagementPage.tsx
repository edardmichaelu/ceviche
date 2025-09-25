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
  ExclamationTriangleIcon,
  CubeIcon
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

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: {
    id: number;
    nombre: string;
  };
}

interface Ingrediente {
  id: number;
  nombre: string;
  stock: number;
  unidad: string;
  tipo_ingrediente: {
    id: number;
    nombre: string;
    color: string;
  };
}

interface ProductoIngrediente {
  id: number;
  producto_id: number;
  ingrediente_id: number;
  cantidad: number;
  producto?: Producto;
  ingrediente?: Ingrediente;
}

// Función para formatear números
const formatNumber = (num: number) => {
  return num.toLocaleString('es-ES', { maximumFractionDigits: 3 });
};

const ProductoIngredienteManagementPage: React.FC = () => {
  const [asociaciones, setAsociaciones] = useState<ProductoIngrediente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsociacion, setSelectedAsociacion] = useState<ProductoIngrediente | null>(null);
  const [formData, setFormData] = useState({
    producto_id: '',
    ingrediente_id: '',
    cantidad: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingStock, setVerifyingStock] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');

  // Filtrar asociaciones basados en el término de búsqueda
  const filteredAsociaciones = useMemo(() => {
    return asociaciones.filter(asociacion => {
      const productoNombre = asociacion.producto?.nombre || '';
      const ingredienteNombre = asociacion.ingrediente?.nombre || '';
      const categoriaNombre = asociacion.producto?.categoria?.nombre || '';

      return productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
             ingredienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
             categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [asociaciones, searchTerm]);

  // Filtrar productos basados en el término de búsqueda
  const filteredProductos = useMemo(() => {
    if (!productSearchTerm.trim()) return productos;

    return productos.filter(producto => {
      const nombre = producto.nombre.toLowerCase();
      const categoria = producto.categoria?.nombre?.toLowerCase() || '';
      const precio = producto.precio.toString();

      return nombre.includes(productSearchTerm.toLowerCase()) ||
             categoria.includes(productSearchTerm.toLowerCase()) ||
             precio.includes(productSearchTerm.toLowerCase());
    });
  }, [productos, productSearchTerm]);

  // Filtrar ingredientes basados en el término de búsqueda
  const filteredIngredientes = useMemo(() => {
    if (!ingredientSearchTerm.trim()) return ingredientes;

    return ingredientes.filter(ingrediente => {
      const nombre = ingrediente.nombre.toLowerCase();
      const tipo = ingrediente.tipo_ingrediente?.nombre?.toLowerCase() || '';
      const stock = ingrediente.stock.toString();
      const unidad = ingrediente.unidad?.toLowerCase() || '';

      return nombre.includes(ingredientSearchTerm.toLowerCase()) ||
             tipo.includes(ingredientSearchTerm.toLowerCase()) ||
             stock.includes(ingredientSearchTerm.toLowerCase()) ||
             unidad.includes(ingredientSearchTerm.toLowerCase());
    });
  }, [ingredientes, ingredientSearchTerm]);

  // Cargar asociaciones producto-ingrediente
  const loadAsociaciones = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/producto-ingrediente/');
      if (response.success) {
        setAsociaciones(response.data);
      } else {
        toast.error('Error al cargar asociaciones producto-ingrediente');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al cargar asociaciones producto-ingrediente');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos
  const loadProductos = async () => {
    try {
      const response = await apiClient.get('/api/producto/');
      if (response.success) {
        setProductos(response.data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  // Cargar ingredientes
  const loadIngredientes = async () => {
    try {
      const response = await apiClient.get('/api/ingrediente/');
      if (response.success) {
        setIngredientes(response.data);
      }
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
    }
  };

  // Verificar stock disponible
  const verificarStock = async (productoId: number, cantidadNecesaria: number = 1) => {
    try {
      setVerifyingStock(true);
      console.log('[DEBUG] Verificando stock para producto ' + productoId + ' con cantidad ' + cantidadNecesaria);
      const response = await apiClient.get(`/api/producto-ingrediente/verificar-stock/${productoId}?cantidad=${cantidadNecesaria}`);
      console.log('[DEBUG] Respuesta de verificar stock:', response);

      if (response && response.success) {
        toast.success('Stock suficiente disponible');
        return true;
      } else {
        const errorMessage = response?.error || 'Error al verificar stock';
        console.error('[DEBUG] Error en verificar stock:', errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('[DEBUG] Error en verificarStock:', error);
      ErrorHandler.handleApiError(error, 'Error al verificar stock');
      return false;
    } finally {
      setVerifyingStock(false);
    }
  };

  // Manejar submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.producto_id || !formData.ingrediente_id) {
      toast.error('Debe seleccionar producto e ingrediente');
      return;
    }

    if (formData.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a cero');
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = {
        producto_id: parseInt(formData.producto_id),
        ingrediente_id: parseInt(formData.ingrediente_id),
        cantidad: parseFloat(formData.cantidad.toString())
      };

      let response;
      if (isEditing && selectedAsociacion) {
        response = await apiClient.put(`/api/producto-ingrediente/${selectedAsociacion.id}`, dataToSend);
      } else {
        response = await apiClient.post('/api/producto-ingrediente/', dataToSend);
      }

      if (response.success) {
        toast.success(isEditing ? 'Asociación actualizada' : 'Asociación creada');
        setShowModal(false);
        resetForm();
        loadAsociaciones();
      } else {
        toast.error(response.error || 'Error al guardar asociación');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al guardar asociación');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar edición
  const handleEdit = (asociacion: ProductoIngrediente) => {
    setSelectedAsociacion(asociacion);
    setFormData({
      producto_id: asociacion.producto_id.toString(),
      ingrediente_id: asociacion.ingrediente_id.toString(),
      cantidad: asociacion.cantidad
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!selectedAsociacion) return;

    try {
      const response = await apiClient.del(`/api/producto-ingrediente/${selectedAsociacion.id}`);
      if (response.success) {
        toast.success('Asociación eliminada');
        setShowDeleteModal(false);
        setSelectedAsociacion(null);
        loadAsociaciones();
      } else {
        toast.error(response.error || 'Error al eliminar asociación');
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'Error al eliminar asociación');
    }
  };

  // Mostrar detalles
  const handleShowDetails = (asociacion: ProductoIngrediente) => {
    setSelectedAsociacion(asociacion);
    setShowDetailsModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      producto_id: '',
      ingrediente_id: '',
      cantidad: 0
    });
    setIsEditing(false);
    setSelectedAsociacion(null);
    setProductSearchTerm('');
    setIngredientSearchTerm('');
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAsociaciones();
    loadProductos();
    loadIngredientes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de Producto-Ingrediente
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra las asociaciones entre productos e ingredientes
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
                <span>Nueva Asociación</span>
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por producto, ingrediente o categoría..."
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

        {/* Grid de asociaciones */}
        {!loading && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredAsociaciones.map((asociacion) => (
                <motion.div
                  key={asociacion.id}
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
                        <CubeIcon className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Asociación #{asociacion.id}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {formatNumber(asociacion.cantidad)} unidades
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleShowDetails(asociacion)}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                          title="Ver detalles"
                        >
                          <InformationCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(asociacion)}
                          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                          title="Editar"
                        >
                          <PencilIconSolid className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAsociacion(asociacion);
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
                      {asociacion.producto && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Producto:
                            </span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {asociacion.producto.nombre}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Categoría:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {asociacion.producto.categoria.nombre}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Precio:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              ${formatNumber(asociacion.producto.precio)}
                            </span>
                          </div>
                        </div>
                      )}

                      {asociacion.ingrediente && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Ingrediente:
                            </span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {asociacion.ingrediente.nombre}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Stock Disponible:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatNumber(asociacion.ingrediente.stock)} {asociacion.ingrediente.unidad || 'unidad'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Tipo:
                            </span>
                            {asociacion.ingrediente.tipo_ingrediente ? (
                              <span
                                className="text-sm px-2 py-1 rounded"
                                style={{
                                  backgroundColor: asociacion.ingrediente.tipo_ingrediente.color + '20',
                                  color: asociacion.ingrediente.tipo_ingrediente.color
                                }}
                              >
                                {asociacion.ingrediente.tipo_ingrediente.nombre}
                              </span>
                            ) : (
                              <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                Sin tipo
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Cantidad Requerida:
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatNumber(asociacion.cantidad)} {asociacion.ingrediente?.unidad || 'unidades'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Estado vacío */}
        {!loading && filteredAsociaciones.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CubeIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No se encontraron asociaciones' : 'No hay asociaciones producto-ingrediente'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primera asociación entre productos e ingredientes'
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
                <span>Crear Primera Asociación</span>
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
                      {isEditing ? 'Editar Asociación' : 'Nueva Asociación'}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo de búsqueda para productos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Producto *
                      </label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Buscar producto por nombre, categoría o precio..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {productSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setProductSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {/* Sugerencias de productos */}
                      {productSearchTerm && filteredProductos.length > 0 && (
                        <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-lg">
                          {filteredProductos.slice(0, 5).map((producto) => (
                            <div
                              key={producto.id}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                              onClick={() => {
                                setFormData({ ...formData, producto_id: producto.id.toString() });
                                setProductSearchTerm('');
                              }}
                            >
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {producto.nombre}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {producto.categoria.nombre} - ${formatNumber(producto.precio)}
                              </div>
                            </div>
                          ))}
                          {filteredProductos.length > 5 && (
                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-600">
                              +{filteredProductos.length - 5} más... (selecciona del desplegable)
                            </div>
                          )}
                        </div>
                      )}
                      {filteredProductos.length === 0 && productSearchTerm ? (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            No se encontraron productos
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                            Intenta con otros términos
                          </p>
                        </div>
                      ) : null}
                      <select
                        value={formData.producto_id}
                        onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">
                          {productSearchTerm
                            ? 'Selecciona un producto (' + filteredProductos.length + ' disponibles)'
                            : 'Seleccionar producto (' + productos.length + ' total)'
                          }
                        </option>
                        {filteredProductos.slice(0, 50).map((producto) => (
                          <option key={producto.id} value={producto.id}>
                            {producto.nombre} - {producto.categoria.nombre} (${formatNumber(producto.precio)})
                          </option>
                        ))}
                      </select>
                      {filteredProductos.length > 50 && productSearchTerm && (
                        <p className="text-xs text-gray-500 mt-1">
                          Mostrando 50 de {filteredProductos.length} productos. Refina la búsqueda.
                        </p>
                      )}
                    </div>

                    {/* Campo de búsqueda para ingredientes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ingrediente *
                      </label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Buscar ingrediente por nombre, tipo, stock o unidad..."
                          value={ingredientSearchTerm}
                          onChange={(e) => setIngredientSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {ingredientSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setIngredientSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {/* Sugerencias de ingredientes */}
                      {ingredientSearchTerm && filteredIngredientes.length > 0 && (
                        <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-lg">
                          {filteredIngredientes.slice(0, 5).map((ingrediente) => (
                            <div
                              key={ingrediente.id}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                              onClick={() => {
                                setFormData({ ...formData, ingrediente_id: ingrediente.id.toString() });
                                setIngredientSearchTerm('');
                              }}
                            >
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {ingrediente.nombre}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Stock: {formatNumber(ingrediente.stock)} {ingrediente.unidad}
                                {ingrediente.tipo_ingrediente && ' - ' + ingrediente.tipo_ingrediente.nombre}
                              </div>
                            </div>
                          ))}
                          {filteredIngredientes.length > 5 && (
                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-600">
                              +{filteredIngredientes.length - 5} más... (selecciona del desplegable)
                            </div>
                          )}
                        </div>
                      )}
                      {filteredIngredientes.length === 0 && ingredientSearchTerm ? (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            No se encontraron ingredientes
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                            Intenta con otros términos
                          </p>
                        </div>
                      ) : null}
                      <select
                        value={formData.ingrediente_id}
                        onChange={(e) => setFormData({ ...formData, ingrediente_id: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">
                          {ingredientSearchTerm
                            ? 'Selecciona un ingrediente (' + filteredIngredientes.length + ' disponibles)'
                            : 'Seleccionar ingrediente (' + ingredientes.length + ' total)'
                          }
                        </option>
                        {filteredIngredientes.slice(0, 50).map((ingrediente) => (
                          <option key={ingrediente.id} value={ingrediente.id}>
                            {ingrediente.nombre} - Stock: {formatNumber(ingrediente.stock)} {ingrediente.unidad}
                            {ingrediente.tipo_ingrediente && ' - ' + ingrediente.tipo_ingrediente.nombre}
                          </option>
                        ))}
                      </select>
                      {filteredIngredientes.length > 50 && ingredientSearchTerm && (
                        <p className="text-xs text-gray-500 mt-1">
                          Mostrando 50 de {filteredIngredientes.length} ingredientes. Refina la búsqueda.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cantidad Requerida *
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.cantidad || ''}
                          onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                          required
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                          {ingredientes.find(i => i.id === parseInt(formData.ingrediente_id))?.unidad || 'unidades'}
                        </span>
                      </div>
                    </div>

                    {/* Información de elementos seleccionados */}
                    {(formData.producto_id || formData.ingrediente_id) && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Información Seleccionada:
                        </h4>
                        <div className="space-y-1">
                          {formData.producto_id && (
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600 dark:text-blue-300">Producto:</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {productos.find(p => p.id === parseInt(formData.producto_id))?.nombre || 'No encontrado'}
                              </span>
                            </div>
                          )}
                          {formData.ingrediente_id && (
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600 dark:text-blue-300">Ingrediente:</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {ingredientes.find(i => i.id === parseInt(formData.ingrediente_id))?.nombre || 'No encontrado'}
                              </span>
                            </div>
                          )}
                          {formData.producto_id && formData.ingrediente_id && (
                            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                              <span className="text-blue-600 dark:text-blue-300">Cantidad:</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {formData.cantidad} {ingredientes.find(i => i.id === parseInt(formData.ingrediente_id))?.unidad || 'unidades'}
                              </span>
                            </div>
                          )}
                        </div>
                        {formData.producto_id && formData.ingrediente_id && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
                            <button
                              type="button"
                              onClick={() => verificarStock(parseInt(formData.producto_id), 1)}
                              disabled={verifyingStock}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center space-x-1"
                            >
                              {verifyingStock && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                              <span>Verificar Stock</span>
                            </button>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              Para 1 unidad del producto
                            </span>
                          </div>
                        )}
                      </div>
                    )}

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
          {showDetailsModal && selectedAsociacion && (
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
                      <CubeIcon className="h-12 w-12 text-blue-600" />
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                          Asociación #{selectedAsociacion.id}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          Detalles de la asociación producto-ingrediente
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
                    {selectedAsociacion.producto && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Información del Producto
                        </h3>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                {selectedAsociacion.producto.nombre}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                {selectedAsociacion.producto.categoria.nombre}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Precio:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                ${formatNumber(selectedAsociacion.producto.precio)}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                #{selectedAsociacion.producto.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAsociacion.ingrediente && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Información del Ingrediente
                        </h3>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                {selectedAsociacion.ingrediente.nombre}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                              {selectedAsociacion.ingrediente.tipo_ingrediente ? (
                                <p
                                  className="font-semibold px-2 py-1 rounded inline-block"
                                  style={{
                                    backgroundColor: selectedAsociacion.ingrediente.tipo_ingrediente.color + '20',
                                    color: selectedAsociacion.ingrediente.tipo_ingrediente.color
                                  }}
                                >
                                  {selectedAsociacion.ingrediente.tipo_ingrediente.nombre}
                                </p>
                              ) : (
                                <p className="font-semibold px-2 py-1 rounded inline-block bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  Sin tipo
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock Disponible:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                {formatNumber(selectedAsociacion.ingrediente.stock)} {selectedAsociacion.ingrediente.unidad || 'unidad'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID:</span>
                              <p className="text-gray-900 dark:text-white font-semibold">
                                #{selectedAsociacion.ingrediente.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Información de la Asociación
                      </h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad Requerida:</span>
                            <p className="text-gray-900 dark:text-white font-semibold text-lg">
                              {formatNumber(selectedAsociacion.cantidad)} {selectedAsociacion.ingrediente?.unidad || 'unidades'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID de Asociación:</span>
                            <p className="text-gray-900 dark:text-white font-semibold">
                              #{selectedAsociacion.id}
                            </p>
                          </div>
                        </div>
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
          title="Eliminar Asociación"
          message={'¿Estás seguro de que deseas eliminar esta asociación producto-ingrediente? Esta acción no se puede deshacer.'}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </div>
  );
};

export default ProductoIngredienteManagementPage;
